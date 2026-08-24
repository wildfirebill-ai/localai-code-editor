/**
 * Model Comparison - send the same prompt to multiple models and compare results.
 */

export interface ModelComparison {
  prompt: string;
  models: {
    model: string;
    provider: string;
    response: string;
    time: number;
    tokens: number;
    cost: number;
    error?: string;
  }[];
}

/**
 * Compare responses from multiple models for the same prompt.
 * Uses the server's agent.run endpoint with different models.
 */
export async function compareModels(
  client: { request: <T>(m: string, p?: Record<string, unknown>) => Promise<T> },
  prompt: string,
  providers: { providerId: string; model: string }[],
): Promise<ModelComparison> {
  const models: ModelComparison['models'] = [];
  
  // Run each model in parallel
  const promises = providers.map(async (provider) => {
    const startTime = Date.now();
    try {
      const result = await client.request<{ content?: string }>('chat.send', {
        providerId: provider.providerId,
        model: provider.model,
        messages: [{ role: 'user', content: prompt }],
      });
      
      return {
        model: provider.model,
        provider: provider.providerId,
        response: result.content || '',
        time: Date.now() - startTime,
        tokens: 0, // Would need token counting from the server
        cost: 0,
      };
    } catch (error) {
      return {
        model: provider.model,
        provider: provider.providerId,
        response: '',
        time: Date.now() - startTime,
        tokens: 0,
        cost: 0,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  });
  
  const results = await Promise.all(promises);
  models.push(...results);
  
  return {
    prompt,
    models,
  };
}

/**
 * Calculate summary statistics for a comparison.
 */
export function getComparisonStats(comparison: ModelComparison): {
  fastest: string;
  slowest: string;
  mostTokens: string;
  leastTokens: string;
  totalCost: number;
} {
  const successful = comparison.models.filter(m => !m.error);
  
  if (successful.length === 0) {
    return {
      fastest: 'N/A',
      slowest: 'N/A',
      mostTokens: 'N/A',
      leastTokens: 'N/A',
      totalCost: 0,
    };
  }
  
  const sorted = [...successful].sort((a, b) => a.time - b.time);
  const tokenSorted = [...successful].sort((a, b) => a.tokens - b.tokens);
  const totalCost = successful.reduce((sum, m) => sum + m.cost, 0);
  
  return {
    fastest: sorted[0].model,
    slowest: sorted[sorted.length - 1].model,
    mostTokens: tokenSorted[tokenSorted.length - 1].model,
    leastTokens: tokenSorted[0].model,
    totalCost,
  };
}

/**
 * Format comparison results for display.
 */
export function formatComparison(comparison: ModelComparison): string {
  const stats = getComparisonStats(comparison);
  const lines = [
    `Prompt: "${comparison.prompt.slice(0, 50)}${comparison.prompt.length > 50 ? '...' : ''}"`,
    '',
  ];
  
  for (const model of comparison.models) {
    if (model.error) {
      lines.push(`❌ ${model.provider}/${model.model}: ${model.error}`);
    } else {
      lines.push(`✅ ${model.provider}/${model.model}:`);
      lines.push(`   Time: ${model.time}ms | Tokens: ${model.tokens} | Cost: $${model.cost.toFixed(4)}`);
      lines.push(`   Response: ${model.response.slice(0, 100)}${model.response.length > 100 ? '...' : ''}`);
    }
    lines.push('');
  }
  
  lines.push(`Fastest: ${stats.fastest} | Slowest: ${stats.slowest}`);
  lines.push(`Total cost: $${stats.totalCost.toFixed(4)}`);
  
  return lines.join('\n');
}