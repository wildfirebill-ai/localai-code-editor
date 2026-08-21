import { existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Directory of the current module, working in both:
 *  - ESM output (tsc): import.meta.url
 *  - CJS bundle (esbuild): __dirname
 */
function moduleDir(): string | null {
  if (typeof __dirname !== 'undefined' && __dirname) return __dirname;
  try {
    return dirname(fileURLToPath(import.meta.url));
  } catch {
    return null;
  }
}

/**
 * Locate the built web UI.
 * Priority:
 *  1. Explicit argument / LOCALAI_WEB_DIST env (set by Electron main or Docker)
 *  2. Packaged layout:   <resources>/server/index.cjs -> <resources>/web
 *  3. Source/dev layout: packages/server/dist -> <repo>/apps/web/dist
 * Returns null when nothing exists (caller should 404).
 */
export function resolveWebDist(explicit?: string): string | null {
  const candidates: string[] = [];
  const envOrArg = explicit ?? process.env.LOCALAI_WEB_DIST;
  if (envOrArg) candidates.push(resolve(envOrArg));

  const dir = moduleDir();
  if (dir) {
    // Packaged: extraResources maps apps/web/dist -> <resources>/web
    candidates.push(join(dir, '..', 'web'));
    // Dev/source tree: packages/server/dist -> repo/apps/web/dist
    candidates.push(join(dir, '..', '..', '..', 'apps', 'web', 'dist'));
  }

  for (const c of candidates) {
    if (c && existsSync(join(c, 'index.html'))) return c;
  }
  return null;
}
