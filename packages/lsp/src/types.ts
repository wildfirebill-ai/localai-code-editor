/** A configured language server. */
export interface LanguageServerConfig {
  /** Unique id, used as the WebSocket endpoint path. */
  id: string;
  /** LSP language id registered in Monaco (e.g. 'typescript', 'python'). */
  language: string;
  /** File extensions this server handles (with leading dot). */
  extensions: string[];
  /** Executable to spawn. */
  command: string;
  args?: string[];
  /** Working directory for the server process (defaults to workspace). */
  cwd?: string;
  /** Extra env vars. */
  env?: Record<string, string>;
  /** Human-readable label for the UI. */
  label?: string;
}

export interface LanguageServerStatus {
  id: string;
  language: string;
  extensions: string[];
  running: boolean;
  pid?: number;
  error?: string;
}