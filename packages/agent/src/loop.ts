import type { ChatMessage, ChatRequest, ToolCall } from '@localai/provider';
import type { AgentEvent, RunAgentOptions, ToolResult } from './types.js';

/**
 * The agentic loop:
 *
 * 1. Send the conversation (system + history + user prompt) to the LLM with
 *    the current tool definitions.
 * 2. Stream deltas to the caller.
 * 3. If the model requests tool calls, execute each, append the results as
 *    `tool` messages, and loop.
 * 4. Otherwise finish and return the final assistant message.
 *
 * A maximum iteration budget prevents runaway loops, and the whole run can be
 * aborted via an AbortSignal.
 */
export async function* runAgent(opts: RunAgentOptions): AsyncGenerator<AgentEvent> {
  const {
    runtime,
    model,
    provider,
    systemPrompt,
    userPrompt,
    maxIterations = 25,
    temperature,
    maxTokens,
    signal,
    onEvent,
  } = opts;

  const tools = runtime.getTools();
  const toolDefs = tools.map((t) => t.definition);
  const messages: ChatMessage[] = [{ role: 'system', content: systemPrompt }];
  messages.push({ role: 'user', content: userPrompt });

  let iterations = 0;

  while (iterations < maxIterations) {
    iterations++;
    const request: ChatRequest = {
      model,
      messages,
      tools: toolDefs,
      temperature,
      maxTokens,
      signal,
    };

    // Collect the assistant turn (deltas + any tool calls).
    const deltas: string[] = [];
    let toolCalls: ToolCall[] = [];

    for await (const chunk of provider.streamChat(request)) {
      if (chunk.type === 'delta') {
        deltas.push(chunk.content);
        const event: AgentEvent = { type: 'delta', content: chunk.content };
        onEvent?.(event);
        yield event;
      } else if (chunk.type === 'tool_calls') {
        toolCalls = chunk.toolCalls;
      } else if (chunk.type === 'done') {
        toolCalls = chunk.message.toolCalls ?? [];
      }
    }

    const assistantContent = deltas.length ? deltas.join('') : null;
    messages.push({ role: 'assistant', content: assistantContent, toolCalls });

    // No tool calls requested => conversation complete.
    if (!toolCalls.length) {
      const done: AgentEvent = { type: 'done', messages, iterations };
      onEvent?.(done);
      yield done;
      return;
    }

    // Execute each tool call.
    for (const call of toolCalls) {
      const tool = tools.find((t) => t.definition.name === call.name);
      let result: ToolResult;
      if (!tool) {
        result = { toolCallId: call.id, ok: false, content: `Unknown tool: ${call.name}` };
      } else {
        try {
          result = await tool.execute(call.arguments, { workspace: runtime.workspace, signal, fs: runtime.fs });
        } catch (e) {
          result = { toolCallId: call.id, ok: false, content: e instanceof Error ? e.message : String(e) };
        }
        // Ensure the id is attached so the model can correlate it.
        if (!result.toolCallId) result.toolCallId = call.id;
      }
      messages.push({
        role: 'tool',
        content: result.content,
        toolCallId: result.toolCallId,
        name: call.name,
      });
      const event: AgentEvent = { type: 'tool_result', result };
      onEvent?.(event);
      yield event;
    }
  }

  // Hit the iteration budget.
  const stop: AgentEvent = {
    type: 'done',
    messages,
    iterations,
  };
  onEvent?.(stop);
  yield stop;
}

export type { AgentRuntime, AgentEvent, Tool, ToolContext, ToolResult, ToolFs, RunAgentOptions } from './types.js';