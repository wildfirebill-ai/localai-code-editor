/** MCP server configuration. */

export interface StdioServerConfig {
  type: 'stdio';
  /** Executable to launch. */
  command: string;
  args?: string[];
  env?: Record<string, string>;
  cwd?: string;
}

export interface RemoteServerConfig {
  type: 'http' | 'sse';
  /** Streamable HTTP or SSE endpoint URL. */
  url: string;
  headers?: Record<string, string>;
}

export type McpServerConfig = StdioServerConfig | RemoteServerConfig;

export interface McpTool {
  /** Fully-qualified: `serverName::toolName`. */
  name: string;
  /** Raw tool name as the MCP server knows it. */
  rawName: string;
  server: string;
  description?: string;
  /** JSON Schema input schema. */
  inputSchema: Record<string, unknown>;
}

export interface McpCallResult {
  ok: boolean;
  content: unknown;
  isError?: boolean;
  error?: string;
}

export interface McpServerStatus {
  name: string;
  transport: 'stdio' | 'http' | 'sse';
  connected: boolean;
  toolCount: number;
  error?: string;
}