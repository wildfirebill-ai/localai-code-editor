import type { RpcClient } from './rpc';

/** Module-level cache so Quick Open / @mentions / Explorer share one listing. */
let cache: { workspace: string; files: string[] } | null = null;

export async function getAllFiles(client: RpcClient, workspace: string): Promise<string[]> {
  if (cache && cache.workspace === workspace) return cache.files;
  const files = await client.request<string[]>('fs.allFiles');
  cache = { workspace, files };
  return files;
}

export function invalidateFileCache(): void {
  cache = null;
}

/** Subsequence fuzzy match with a preference for contiguous + word-boundary hits. */
export function fuzzyScore(path: string, query: string): number {
  if (!query) return 1;
  const q = query.toLowerCase();
  const p = path.toLowerCase();
  // Direct substring is the common case — rank by position and length.
  const sub = p.indexOf(q);
  if (sub !== -1) {
    const base = 100 - Math.min(sub, 50) - Math.max(0, path.length - q.length) * 0.1;
    // Bonus when the hit starts at a segment boundary (e.g. "src/fo" in "src/foo.ts").
    const boundary = sub === 0 || p[sub - 1] === '/' || p[sub - 1] === '.' ? 20 : 0;
    return base + boundary;
  }
  // Subsequence fallback.
  let score = 0;
  let pi = 0;
  let streak = 0;
  for (let qi = 0; qi < q.length; qi++) {
    const ch = q[qi];
    const found = p.indexOf(ch, pi);
    if (found === -1) return 0;
    streak = found === pi ? streak + 1 : 0;
    score += 2 + streak;
    if (found === 0 || p[found - 1] === '/' || p[found - 1] === '.' || p[found - 1] === '-') score += 3;
    pi = found + 1;
  }
  return score;
}

export function fuzzyFilter(paths: string[], query: string, limit = 30): string[] {
  if (!query.trim()) return paths.slice(0, limit);
  const scored: { p: string; s: number }[] = [];
  for (const p of paths) {
    const s = fuzzyScore(p, query);
    if (s > 0) scored.push({ p, s });
  }
  scored.sort((a, b) => b.s - a.s);
  return scored.slice(0, limit).map((x) => x.p);
}
