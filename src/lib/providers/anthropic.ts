import Anthropic from '@anthropic-ai/sdk';
import type { ProviderAdapter, Message, ModelConfig, ModelResponse } from './base';

let _client: Anthropic | null = null;

function getClient(): Anthropic {
  if (_client) return _client;
  const apiKey = import.meta.env.ANTHROPIC_API_KEY ?? process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not configured');
  _client = new Anthropic({ apiKey });
  return _client;
}

export const anthropicAdapter: ProviderAdapter = {
  name: 'anthropic',

  async callModel(messages: Message[], config: ModelConfig): Promise<ModelResponse> {
    const client = getClient();
    const start = Date.now();

    const systemMsg = messages.find((m) => m.role === 'system');
    const nonSystemMsgs = messages.filter((m) => m.role !== 'system');

    const response = await client.messages.create({
      model: config.model,
      max_tokens: config.maxTokens ?? 4096,
      temperature: config.temperature ?? 0.7,
      ...(systemMsg ? { system: systemMsg.content } : {}),
      messages: nonSystemMsgs.map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
    });

    const textBlock = response.content.find((b) => b.type === 'text');

    return {
      content: textBlock?.text ?? '',
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
      model: config.model,
      latencyMs: Date.now() - start,
    };
  },
};
