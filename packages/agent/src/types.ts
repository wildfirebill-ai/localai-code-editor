import type { ChatMessage, ToolDefinition, ToolCall } from '@localai/provider';

/** Result of executing a single tool call. */
export interface ToolResult {
  /** Mirror of the tool call id this result belongs to. */
  toolCallId: string;
  ok: boolean;
  /** Human-readable content to feed back to the model. */
  content: string;
}

/** Context handed to every tool executor. */
export interface ToolContext {
  /** Workspace root the tools are sandboxed to. */
  workspace: string;
  /** Abort support if needed. */
  signal?: AbortSignal;
  /** Optional file-system functions so tools stay runtime-agnostic. */
  fs?: ToolFs;
}

/** Minimal fs surface used by the file tools (injected by the host). */
export interface ToolFs {
  readFile(path: string): Promise<string>;
  writeFile(path: string, content: string): Promise<void>;
  listFiles(path: string): Promise<string[]>;
  pathExists(path: string): Promise<boolean>;
}

/** A tool the model can invoke. */
export interface Tool {
  definition: ToolDefinition;
  execute(args: Record<string, unknown>, ctx: ToolContext): Promise<ToolResult>;
}

/** Runtime the agent loop needs (provided by the server). */
export interface AgentRuntime {
  workspace: string;
  getTools(): Tool[];
  fs: ToolFs;
}

/** Events emitted while the agent runs. */
export type AgentEvent =
  | { type: 'delta'; content: string }
  | { type: 'tool_call'; toolCall: ToolCall }
  | { type: 'tool_result'; result: ToolResult }
  | { type: 'done'; messages: ChatMessage[]; iterations: number };

export interface RunAgentOptions {
  runtime: AgentRuntime;
  model: string;
  provider: {
    streamChat(request: import('@localai/provider').ChatRequest): AsyncGenerator<import('@localai/provider').ChatStreamChunk>;
  };
  systemPrompt: string;
  userPrompt: string;
  /** Max tool-call rounds before giving up. Defaults to 25. */
  maxIterations?: number;
  signal?: AbortSignal;
  onEvent?: (event: AgentEvent) => void;
}

/** Default system prompt describing the agent's capabilities and rules. */
export function defaultSystemPrompt(workspace: string): string {
  return [
                `You are LocalAI Code Editor's coding agent. You work inside the workspace: ${workspace}`,
    'You can run shell commands and read/write files to accomplish the task.',
    'Rules:',
    '- Prefer reading files before editing them.',
    '- Write complete, correct code. Do not truncate or use ellipses in file writes.',
    '- After making changes, run available build/lint/test commands to verify.',
    '- When a command fails, read the error and fix it.',
    '- Be concise. Report what you changed and the result.',
    'When you need to call a tool, request exactly one round of tool calls at a time and wait for results.',
  ].join('\n');
}