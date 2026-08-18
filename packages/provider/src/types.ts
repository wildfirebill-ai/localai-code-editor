/** Core types shared across all LLM providers and the agent loop. */

export type Role = 'system' | 'user' | 'assistant' | 'tool';

export interface ToolCallArgument {
  name: string;
  value: unknown;
}

export interface ToolCall {
  /** Unique id used to correlate the tool result back. */
  id: string;
  /** Function/tool name. */
  name: string;
  /** JSON arguments decoded by the model. */
  arguments: Record<string, unknown>;
}

export interface ChatMessage {
  role: Role;
  content: string | null;
  /** Tool calls requested by the model (assistant role). */
  toolCalls?: ToolCall[];
  /** Id of the tool call this message is a result for. */
  toolCallId?: string;
  name?: string;
}

export interface ToolDefinition {
  name: string;
  description: string;
  /** JSON Schema for the tool's input. */
  inputSchema: Record<string, unknown>;
}

export interface ChatRequest {
  model: string;
  messages: ChatMessage[];
  tools?: ToolDefinition[];
  temperature?: number;
  maxTokens?: number;
  /** Abort controller signal to cancel streaming. */
  signal?: AbortSignal;
}

export type ChatStreamChunk =
  | { type: 'delta'; content: string }
  | { type: 'tool_calls'; toolCalls: ToolCall[] }
  | { type: 'done'; message: ChatMessage; usage?: Usage };

export interface Usage {
  promptTokens?: number;
  completionTokens?: number;
}

export interface ModelInfo {
  id: string;
  name?: string;
  size?: number;
  contextLength?: number;
}

export interface ProviderHealth {
  ok: boolean;
  latencyMs?: number;
  error?: string;
}

/** Any local LLM provider exposing an OpenAI-compatible /chat/completions endpoint. */
export interface LLMProvider {
  readonly id: string;
  readonly label: string;
  /** Base URL of the OpenAI-compatible API, e.g. http://localhost:11434/v1 */
  readonly baseUrl: string;
  /** Optional API key (some servers require a dummy or real key). */
  readonly apiKey?: string;
  /** Whether this provider is currently reachable. */
  health(): Promise<ProviderHealth>;
  /** List models served by this provider. */
  listModels(): Promise<ModelInfo[]>;
  /** Stream a chat completion, emitting content and tool-call deltas. */
  streamChat(request: ChatRequest): AsyncGenerator<ChatStreamChunk>;
}