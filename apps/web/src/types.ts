/** UI-facing types mirroring the server RPC payloads. */

/** Bridge exposed by the Electron desktop shell (absent in plain browser mode). */
declare global {
  interface Window {
    localai?: {
      pickWorkspace(): Promise<string | null>;
      getWorkspace(): Promise<string>;
    };
  }
}

export interface ProviderInfo {
  id: string;
  label: string;
  baseUrl: string;
  apiKey?: string;
}

export interface ProviderHealth {
  ok: boolean;
  latencyMs?: number;
  error?: string;
}

export interface ModelInfo {
  id: string;
  name?: string;
  size?: number;
  contextLength?: number;
}

export type ChangeType = 'added' | 'modified' | 'deleted' | 'renamed' | 'untracked';

export interface FileChange {
  path: string;
  status: 'staged' | 'unstaged' | 'both';
  changeType: ChangeType;
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
}

export interface GitLogEntry {
  hash: string;
  shortHash: string;
  message: string;
  author: string;
  date: string;
}

export interface McpServerStatus {
  name: string;
  transport: 'stdio' | 'http' | 'sse';
  connected: boolean;
  toolCount: number;
  error?: string;
}

export interface McpTool {
  name: string;
  server: string;
  description?: string;
}

export type AgentEvent =
  | { type: 'delta'; content: string }
  | { type: 'tool_call'; toolCall: { name: string } }
  | { type: 'tool_result'; result: { ok: boolean; content: string } }
  | { type: 'done' };

export interface ChatEntry {
  role: 'user' | 'assistant' | 'tool' | 'system';
  content: string;
}

export interface SkillSummary {
  name: string;
  description: string;
  source: 'builtin' | 'project' | 'user';
  path: string;
  enabled: boolean;
  size: number;
}

export interface LspStatus {
  id: string;
  language: string;
  extensions: string[];
  running: boolean;
  pid?: number;
  error?: string;
}