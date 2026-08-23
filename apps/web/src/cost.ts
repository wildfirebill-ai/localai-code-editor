// Default model pricing (USD per 1M tokens) — update as providers change.
// Can be overridden via localai.config.json -> pricing: { modelId: { input, output } }
export const DEFAULT_PRICING: Record<string, { input: number; output: number }> = {
  // OpenAI
  'gpt-4o': { input: 2.50, output: 10.00 },
  'gpt-4o-mini': { input: 0.15, output: 0.60 },
  'gpt-4-turbo': { input: 10.00, output: 30.00 },
  'gpt-3.5-turbo': { input: 0.50, output: 1.50 },
  // Anthropic
  'claude-3-5-sonnet-20241022': { input: 3.00, output: 15.00 },
  'claude-3-5-haiku-20241022': { input: 1.00, output: 5.00 },
  'claude-3-opus-20240229': { input: 15.00, output: 75.00 },
  // Google
  'gemini-1.5-pro': { input: 3.50, output: 10.50 },
  'gemini-1.5-flash': { input: 0.075, output: 0.30 },
  // Local models (Ollama, LM Studio, etc.) — free
  'llama3.1': { input: 0, output: 0 },
  'llama3.2': { input: 0, output: 0 },
  'mistral': { input: 0, output: 0 },
  'qwen2.5': { input: 0, output: 0 },
  'phi3': { input: 0, output: 0 },
};

export function getModelCost(modelId: string): { input: number; output: number } {
  // Try exact match first
  if (DEFAULT_PRICING[modelId]) return DEFAULT_PRICING[modelId];
  // Try fuzzy match (strip version suffixes like -20241022)
  const base = modelId.replace(/-\d{8}$/, '').replace(/-\d{4}$/, '');
  if (DEFAULT_PRICING[base]) return DEFAULT_PRICING[base];
  // Fallback: free
  return { input: 0, output: 0 };
}

export function calculateCost(inputTokens: number, outputTokens: number, modelId: string): number {
  const { input, output } = getModelCost(modelId);
  return (inputTokens * input + outputTokens * output) / 1_000_000;
}