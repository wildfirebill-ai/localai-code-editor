import type {
  ChatMessage,
  ChatRequest,
  ChatStreamChunk,
  LLMProvider,
  ModelInfo,
  ProviderHealth,
  ToolCall,
  Usage,
} from './types.js';

interface OpenAIErrorBody {
  error?: { message?: string };
}

/**
 * A provider that speaks the OpenAI-compatible HTTP API.
 *
 * Every local inference server the editor targets (Ollama, LM Studio,
 * llama.cpp's server, text-generation-webui, vLLM, Jan, etc.) exposes this
 * protocol at a local port. By parameterizing baseUrl we get one client that
 * connects to all of them, plus arbitrary user-configured endpoints.
 */
export class OpenAICompatProvider implements LLMProvider {
  readonly id: string;
  readonly label: string;
  readonly baseUrl: string;
  readonly apiKey?: string;

  constructor(opts: { id: string; label: string; baseUrl: string; apiKey?: string }) {
    this.id = opts.id;
    this.label = opts.label;
    this.baseUrl = opts.baseUrl.replace(/\/+$/, '');
    this.apiKey = opts.apiKey;
  }

  private headers(streaming = false): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: streaming ? 'text/event-stream' : 'application/json',
    };
    if (this.apiKey) headers.Authorization = `Bearer ${this.apiKey}`;
    return headers;
  }

  async health(): Promise<ProviderHealth> {
    const start = Date.now();
    try {
      const res = await fetch(`${this.baseUrl}/models`, { headers: this.headers() });
      const ok = res.ok;
      return { ok, latencyMs: Date.now() - start, error: ok ? undefined : `${res.status} ${res.statusText}` };
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : String(e) };
    }
  }

  async listModels(): Promise<ModelInfo[]> {
    const res = await fetch(`${this.baseUrl}/models`, { headers: this.headers() });
    if (!res.ok) throw new Error(`Failed to list models: ${res.status} ${res.statusText}`);
    const body = (await res.json()) as {
      data?: Array<{ id: string; name?: string; size?: number; context_length?: number }>;
    };
    return (body.data ?? []).map((m) => ({
      id: m.id,
      name: m.name,
      size: m.size,
      contextLength: m.context_length,
    }));
  }

  /**
   * Stream a chat completion. Handles both the streaming SSE path (used for
   * incremental text and tool-call deltas) and the non-stream fallback.
   */
  async *streamChat(request: ChatRequest): AsyncGenerator<ChatStreamChunk> {
    const payload: Record<string, unknown> = {
      model: request.model,
      messages: request.messages.map((m) => ({
        role: m.role,
        content: m.content,
        ...(m.role === 'assistant' && m.toolCalls?.length
          ? {
              tool_calls: m.toolCalls.map((tc) => ({
                id: tc.id,
                type: 'function',
                function: { name: tc.name, arguments: JSON.stringify(tc.arguments) },
              })),
            }
          : {}),
        ...(m.role === 'tool' ? { tool_call_id: m.toolCallId, name: m.name } : {}),
      })),
      ...(request.tools?.length
        ? {
            tools: request.tools.map((t) => ({
              type: 'function',
              function: { name: t.name, description: t.description, parameters: t.inputSchema },
            })),
          }
        : {}),
      stream: true,
      stream_options: { include_usage: true },
      ...(request.temperature !== undefined ? { temperature: request.temperature } : {}),
      ...(request.maxTokens !== undefined ? { max_tokens: request.maxTokens } : {}),
      // Ask compatible servers for token accounting on the final stream chunk.
      ...(request.stream ? { stream_options: { include_usage: true } } : {}),
    };

    const res = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: this.headers(true),
      body: JSON.stringify(payload),
      signal: request.signal,
    });

    if (!res.ok || !res.body) {
      const text = await res.text().catch(() => '');
      let message = `${res.status} ${res.statusText}`;
      try {
        const parsed = JSON.parse(text) as OpenAIErrorBody;
        if (parsed.error?.message) message = parsed.error.message;
      } catch {
        /* ignore parse errors */
      }
      throw new Error(message);
    }

    // Accumulate the final assistant message for the `done` chunk.
    const contentAccumulator: string[] = [];
    const toolCallsAccumulator = new Map<string, ToolCall>();
    let role = 'assistant';
    let finishReason: string | undefined;
    let lastUsage: Usage | undefined;

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';
      for (const rawLine of lines) {
        const line = rawLine.trim();
        if (!line.startsWith('data:')) continue;
        const data = line.slice(5).trim();
        if (data === '[DONE]') continue;
        let chunk: {
          choices?: Array<{
            delta?: { role?: string; content?: string | null; tool_calls?: unknown[] };
            finish_reason?: string | null;
          }>;
          usage?: unknown;
        };
        try {
          chunk = JSON.parse(data);
        } catch {
          continue;
        }
        const choice = chunk.choices?.[0];
        if (chunk.usage) {
          // Final chunk (choices empty) carries token usage when requested.
          lastUsage = chunk.usage as Usage;
        }
        if (!choice) continue;
        if (choice.delta?.role) role = choice.delta.role;
        const deltaContent = choice.delta?.content;
        if (deltaContent) {
          contentAccumulator.push(deltaContent);
          yield { type: 'delta', content: deltaContent };
        }
        if (choice.delta?.tool_calls) {
          for (const raw of choice.delta.tool_calls as Array<{
            index?: number;
            id?: string;
            function?: { name?: string; arguments?: string };
          }>) {
            const idx = raw.index ?? 0;
            const existing = toolCallsAccumulator.get(String(idx)) ?? {
              id: raw.id ?? `call_${idx}`,
              name: '',
              arguments: {} as Record<string, unknown>,
            };
            if (raw.id) existing.id = raw.id;
            if (raw.function?.name) existing.name += raw.function.name;
            if (raw.function?.arguments) {
              // Arguments stream in as partial JSON fragments.
              const merged = (existing.arguments as unknown as { __raw?: string }).__raw
                ? { ...(existing.arguments as object), __raw: (existing.arguments as unknown as { __raw?: string }).__raw }
                : { ...(existing.arguments as object), __raw: '' };
              merged.__raw = (merged.__raw as string) + raw.function.arguments;
              (existing.arguments as unknown) = merged;
            }
            toolCallsAccumulator.set(String(idx), existing);
          }
        }
        if (choice.finish_reason) finishReason = choice.finish_reason;
        if (chunk.usage) {
          // usage may arrive mid-stream on some servers; ignore here, it's in done.
        }
      }
    }

    // Materialize final tool calls, parsing any accumulated JSON fragments.
    const toolCalls: ToolCall[] = [...toolCallsAccumulator.values()]
      .filter((tc) => tc.name.length > 0)
      .map((tc) => {
        const raw = (tc.arguments as unknown as { __raw?: string })?.__raw;
        let parsed: Record<string, unknown> = {};
        if (raw) {
          try {
            parsed = JSON.parse(raw);
          } catch {
            parsed = { _raw: raw };
          }
        }
        return { id: tc.id, name: tc.name, arguments: parsed };
      });

    const finalMessage: ChatMessage = {
      role: (role as ChatMessage['role']) || 'assistant',
      content: contentAccumulator.length ? contentAccumulator.join('') : null,
      ...(toolCalls.length ? { toolCalls } : {}),
    };

    void finishReason;
    yield { type: 'done', message: finalMessage, usage: lastUsage };
  }
}