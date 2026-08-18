import type { ChatRequest, ChatStreamChunk, LLMProvider, ModelInfo, ProviderHealth } from './types.js';
/**
 * A provider that speaks the OpenAI-compatible HTTP API.
 *
 * Every local inference server the editor targets (Ollama, LM Studio,
 * llama.cpp's server, text-generation-webui, vLLM, Jan, etc.) exposes this
 * protocol at a local port. By parameterizing baseUrl we get one client that
 * connects to all of them, plus arbitrary user-configured endpoints.
 */
export declare class OpenAICompatProvider implements LLMProvider {
    readonly id: string;
    readonly label: string;
    readonly baseUrl: string;
    readonly apiKey?: string;
    constructor(opts: {
        id: string;
        label: string;
        baseUrl: string;
        apiKey?: string;
    });
    private headers;
    health(): Promise<ProviderHealth>;
    listModels(): Promise<ModelInfo[]>;
    /**
     * Stream a chat completion. Handles both the streaming SSE path (used for
     * incremental text and tool-call deltas) and the non-stream fallback.
     */
    streamChat(request: ChatRequest): AsyncGenerator<ChatStreamChunk>;
}
