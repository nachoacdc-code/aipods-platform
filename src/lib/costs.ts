/**
 * LLM cost tracking — pricing per model (per 1M tokens), March 2026.
 * Updated manually or by Model Scout routine.
 */

export interface ModelPricing {
  inputPerMillion: number;
  outputPerMillion: number;
}

export const MODEL_PRICING: Record<string, ModelPricing> = {
  'claude-opus-4': { inputPerMillion: 15.0, outputPerMillion: 75.0 },
  'claude-sonnet-4': { inputPerMillion: 3.0, outputPerMillion: 15.0 },
  'claude-haiku-3.5': { inputPerMillion: 0.8, outputPerMillion: 4.0 },
  'grok-3': { inputPerMillion: 3.0, outputPerMillion: 15.0 },
  'grok-3-fast': { inputPerMillion: 0.6, outputPerMillion: 3.0 },
  'gemini-2.0-flash': { inputPerMillion: 0.1, outputPerMillion: 0.4 },
  'gemini-2.5-pro': { inputPerMillion: 1.25, outputPerMillion: 10.0 },
};

export function calculateCost(
  model: string,
  inputTokens: number,
  outputTokens: number,
): number {
  const pricing = MODEL_PRICING[model];
  if (!pricing) return 0;

  const inputCost = (inputTokens / 1_000_000) * pricing.inputPerMillion;
  const outputCost = (outputTokens / 1_000_000) * pricing.outputPerMillion;
  return Math.round((inputCost + outputCost) * 1_000_000) / 1_000_000; // 6 decimal places
}

export function formatCost(usd: number): string {
  if (usd < 0.01) return `$${(usd * 100).toFixed(3)}¢`;
  return `$${usd.toFixed(4)}`;
}

export type Provider = 'anthropic' | 'xai' | 'google';

export const MODEL_TO_PROVIDER: Record<string, Provider> = {
  'claude-opus-4': 'anthropic',
  'claude-sonnet-4': 'anthropic',
  'claude-haiku-3.5': 'anthropic',
  'grok-3': 'xai',
  'grok-3-fast': 'xai',
  'gemini-2.0-flash': 'google',
  'gemini-2.5-pro': 'google',
};
