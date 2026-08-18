/** Types returned by the git service (shared with the git panel UI). */

export type ChangeType = 'added' | 'modified' | 'deleted' | 'renamed' | 'untracked';

export interface FileChange {
  path: string;
  /** Staging state: 'staged' | 'unstaged' | 'both'. */
  status: 'staged' | 'unstaged' | 'both';
  changeType: ChangeType;
  /** Per-chunk status (index/worktree) for conflict display. */
  index?: string;
  worktree?: string;
}

export interface RepoStatus {
  isRepo: boolean;
  branch: string;
  ahead: number;
  behind: number;
  current?: string;
  changes: FileChange[];
}

export interface DiffLine {
  line: string;
  type: 'add' | 'del' | 'ctx';
}

export interface FileDiff {
  path: string;
  hunks: DiffLine[];
}

export interface BranchInfo {
  current: boolean;
  name: string;
  local: boolean;
  tracking?: string;
  ahead?: number;
  behind?: number;
  /** Whether it's the default/main branch. */
  default?: boolean;
}

export interface GitLogEntry {
  hash: string;
  shortHash: string;
  message: string;
  author: string;
  date: string;
}

export interface PushPullResult {
  ok: boolean;
  message: string;
  stdout?: string;
  stderr?: string;
}