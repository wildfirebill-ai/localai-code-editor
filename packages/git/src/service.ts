import { simpleGit, type SimpleGit } from 'simple-git';
import type {
  BranchInfo,
  DiffLine,
  FileChange,
  FileDiff,
  GitLogEntry,
  PushPullResult,
  RepoStatus,
} from './types.js';

const ADDED = 'added';
const MODIFIED = 'modified';
const DELETED = 'deleted';
const UNTRACKED = 'untracked';

function classify(status: string): FileChange['changeType'] {
  if (status === ' ') return ADDED;
  if (status === 'D') return DELETED;
  if (status === '?') return UNTRACKED;
  return MODIFIED;
}

/** Wraps simple-git and exposes the operations the git panel needs. */
export class GitService {
  private git: SimpleGit;
  constructor(workspace: string) {
    this.git = simpleGit(workspace);
  }

  async isRepo(): Promise<boolean> {
    try {
      return await this.git.checkIsRepo();
    } catch {
      return false;
    }
  }

  /**
   * Full repo status: current branch, ahead/behind counts, and every changed
   * file with its staging state. This backs the "what hasn't been committed"
   * panel.
   */
  async status(): Promise<RepoStatus> {
    if (!(await this.isRepo())) {
      return { isRepo: false, branch: '', ahead: 0, behind: 0, changes: [] };
    }
    const st = await this.git.status();

    const changes: FileChange[] = [];
    const seen = new Set<string>();
    for (const f of st.files) {
      const index = f.index ?? '';
      const worktree = f.working_dir ?? '';
      const entry: FileChange = { path: f.path, status: 'unstaged', changeType: UNTRACKED };
      if (index !== ' ' && worktree !== ' ') entry.status = 'both';
      else if (index !== ' ') entry.status = 'staged';
      else if (worktree !== ' ') entry.status = 'unstaged';
      // Pick the side that actually changed (worktree wins when both differ).
      entry.changeType = classify(worktree !== ' ' ? worktree : index);
      if (entry.changeType === UNTRACKED) entry.status = 'unstaged';
      entry.index = index;
      entry.worktree = worktree;
      changes.push(entry);
      seen.add(f.path);
    }
    // simple-git also reports untracked files separately; avoid duplicates.
    for (const p of st.not_added ?? []) {
      if (seen.has(p)) continue;
      changes.push({ path: p, status: 'unstaged', changeType: UNTRACKED });
    }

    return {
      isRepo: true,
      branch: st.current ?? '',
      ahead: st.ahead,
      behind: st.behind,
      current: st.current ?? undefined,
      changes,
    };
  }

  async diffFile(path: string, staged = false): Promise<FileDiff> {
    const raw = staged
      ? await this.git.diff(['--cached', '--', path])
      : await this.git.diff(['--', path]);
    return { path, hunks: parseDiff(raw) };
  }

  async diffAll(staged = false): Promise<Record<string, FileDiff>> {
    const raw = staged ? await this.git.diff(['--cached']) : await this.git.diff();
    if (!raw.trim()) return {};
    return splitDiffs(raw);
  }

  async stage(paths: string[]): Promise<void> {
    if (!paths.length) return;
    await this.git.add(paths);
  }

  async unstage(paths: string[]): Promise<void> {
    if (!paths.length) return;
    await this.git.reset(['--', ...paths]);
  }

  async stageAll(): Promise<void> {
    await this.git.add(['-A']);
  }

  async commit(message: string): Promise<void> {
    await this.git.commit(message);
  }

  async branches(): Promise<BranchInfo[]> {
    const branchSummary = await this.git.branch();
    const result: BranchInfo[] = [];
    for (const [name, info] of Object.entries(branchSummary.branches)) {
      const extended = info as unknown as {
        tracking?: string | null;
        ahead?: number;
        behind?: number;
      };
      result.push({
        current: info.current,
        name,
        local: true,
        tracking: extended.tracking ?? undefined,
        ahead: extended.ahead,
        behind: extended.behind,
      });
    }
    return result;
  }

  async createBranch(name: string, checkout = true): Promise<void> {
    if (checkout) await this.git.checkoutLocalBranch(name);
    else await this.git.branch([name]);
  }

  async checkout(name: string): Promise<void> {
    await this.git.checkout(name);
  }

  async deleteBranch(name: string, force = false): Promise<void> {
    await this.git.branch([force ? '-D' : '-d', name]);
  }

  async pull(): Promise<PushPullResult> {
    try {
      const res = await this.git.pull();
      return { ok: true, message: 'Pull complete', stdout: res?.summary?.changes?.toString() ?? '' };
    } catch (e) {
      return { ok: false, message: 'Pull failed', stderr: e instanceof Error ? e.message : String(e) };
    }
  }

  async push(remote = 'origin', branch?: string, opts?: { setUpstream?: boolean; force?: boolean }): Promise<PushPullResult> {
    try {
      const args = [remote];
      if (branch) {
        args.push(branch);
        if (opts?.setUpstream) args.push('--set-upstream');
      }
      if (opts?.force) args.push('--force');
      await this.git.push(args);
      return { ok: true, message: 'Push complete' };
    } catch (e) {
      return { ok: false, message: 'Push failed', stderr: e instanceof Error ? e.message : String(e) };
    }
  }

  async log(limit = 50): Promise<GitLogEntry[]> {
    const log = await this.git.log({ maxCount: limit });
    return log.all.map((l) => ({
      hash: l.hash,
      shortHash: l.hash.slice(0, 7),
      message: l.message,
      author: l.author_name,
      date: l.date,
    }));
  }

  async currentBranch(): Promise<string> {
    const branch = await this.git.revparse(['--abbrev-ref', 'HEAD']);
    return branch.trim();
  }
}

function parseDiff(raw: string): DiffLine[] {
  const lines: DiffLine[] = [];
  for (const line of raw.split('\n')) {
    if (line.startsWith('+') && !line.startsWith('+++')) lines.push({ line, type: 'add' });
    else if (line.startsWith('-') && !line.startsWith('---')) lines.push({ line, type: 'del' });
    else lines.push({ line, type: 'ctx' });
  }
  return lines;
}

function splitDiffs(raw: string): Record<string, FileDiff> {
  const out: Record<string, FileDiff> = {};
  let currentPath: string | null = null;
  const currentLines: DiffLine[] = [];
  const flush = () => {
    if (currentPath) out[currentPath] = { path: currentPath, hunks: [...currentLines] };
    currentLines.length = 0;
  };
  for (const line of raw.split('\n')) {
    if (line.startsWith('diff --git ')) {
      flush();
      currentPath = extractPath(line);
    } else if (currentPath) {
      currentLines.push(parseDiffLine(line));
    }
  }
  flush();
  return out;
}

function extractPath(header: string): string {
  // diff --git a/path b/path
  const m = header.match(/^diff --git a\/(.*) b\//);
  return m ? m[1] : 'unknown';
}

function parseDiffLine(line: string): DiffLine {
  if (line.startsWith('+') && !line.startsWith('+++')) return { line, type: 'add' };
  if (line.startsWith('-') && !line.startsWith('---')) return { line, type: 'del' };
  return { line, type: 'ctx' };
}