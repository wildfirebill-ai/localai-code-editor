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
export declare const PRESETS: ProviderPreset[];
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
export declare class ProviderRegistry {
    private configs;
    private instances;
    private readonly customDefaults;
    constructor(initial?: ProviderConfig[]);
    register(cfg: ProviderConfig): void;
    registerCustom(cfg: ProviderConfig): void;
    get(id: string): LLMProvider | undefined;
    listConfigs(): ProviderConfig[];
    /** Health-check every registered provider. */
    healthAll(): Promise<Record<string, ProviderHealth>>;
}
/** Convenience: build a registry seeded from presets at their defaults. */
export declare function createDefaultRegistry(): ProviderRegistry;
export type { LLMProvider, ProviderHealth, ModelInfo, ChatMessage, ChatRequest, ChatStreamChunk, ToolCall, ToolDefinition } from './types.js';
