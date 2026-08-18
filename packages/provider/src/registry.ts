import { OpenAICompatProvider } from './openai-compat.js';
import type { LLMProvider, ProviderHealth } from './types.js';

export interface ProviderPreset {
  id: string;
  label: string;
  defaultBaseUrl: string;
  /** Optional default API key value or empty string. */
  defaultApiKey?: string;
  hint: string;
}

/** Well-known local inference servers, all OpenAI-compatible. */
export const PRESETS: ProviderPreset[] = [
  {
    id: 'ollama',
    label: 'Ollama',
    defaultBaseUrl: 'http://localhost:11434/v1',
    hint: 'Ollama exposes an OpenAI-compatible API at /v1 since v0.1.32.',
  },
  {
    id: 'lmstudio',
    label: 'LM Studio',
    defaultBaseUrl: 'http://localhost:1234/v1',
    hint: 'LM Studio serves an OpenAI-compatible API when its local server is enabled.',
  },
  {
    id: 'llamacpp',
    label: 'llama.cpp server',
    defaultBaseUrl: 'http://localhost:8080/v1',
    hint: 'Run `llama-server -m model.gguf` and it exposes an OpenAI-compatible /v1 API.',
  },
  {
    id: 'custom',
    label: 'Custom OpenAI-compatible',
    defaultBaseUrl: 'http://localhost:11434/v1',
    hint: 'Any server that implements POST /v1/chat/completions (vLLM, Jan, text-gen-webui, etc.).',
  },
];

/** A configured provider instance. */
export interface ProviderConfig {
  id: string;
  label: string;
  baseUrl: string;
  apiKey?: string;
}

/**
 * Holds provider configuration, health-checks endpoints, and resolves the
 * matching LLMProvider for a request. Fully extensible: callers can register
 * additional presets/configs at runtime.
 */
export class ProviderRegistry {
  private configs = new Map<string, ProviderConfig>();
  private instances = new Map<string, LLMProvider>();
  private readonly customDefaults = new Map<string, ProviderConfig>();

  constructor(initial?: ProviderConfig[]) {
    for (const cfg of initial ?? []) this.register(cfg);
  }

  register(cfg: ProviderConfig): void {
    this.configs.set(cfg.id, cfg);
    this.instances.set(
      cfg.id,
      new OpenAICompatProvider({ id: cfg.id, label: cfg.label, baseUrl: cfg.baseUrl, apiKey: cfg.apiKey }),
    );
  }

  registerCustom(cfg: ProviderConfig): void {
    this.customDefaults.set(cfg.id, cfg);
    this.register(cfg);
  }

  get(id: string): LLMProvider | undefined {
    return this.instances.get(id);
  }

  listConfigs(): ProviderConfig[] {
    return [...this.configs.values()];
  }

  /** Health-check every registered provider. */
  async healthAll(): Promise<Record<string, ProviderHealth>> {
    const out: Record<string, ProviderHealth> = {};
    await Promise.all(
      [...this.instances.entries()].map(async ([id, p]) => {
        out[id] = await p.health();
      }),
    );
    return out;
  }
}

/** Convenience: build a registry seeded from presets at their defaults. */
export function createDefaultRegistry(): ProviderRegistry {
  const registry = new ProviderRegistry();
  for (const preset of PRESETS) {
    registry.register({
      id: preset.id,
      label: preset.label,
      baseUrl: preset.defaultBaseUrl,
      apiKey: preset.defaultApiKey,
    });
  }
  return registry;
}

export type { LLMProvider, ProviderHealth, ModelInfo, ChatMessage, ChatRequest, ChatStreamChunk, ToolCall, ToolDefinition } from './types.js';