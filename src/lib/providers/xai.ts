import type { ProviderAdapter, Message, ModelConfig, ModelResponse } from './base';

const XAI_API_URL = 'https://api.x.ai/v1/chat/completions';

/**
 * xAI (Grok) uses an OpenAI-compatible chat completions API.
 */
export const xaiAdapter: ProviderAdapter = {
  name: 'xai',

  async callModel(messages: Message[], config: ModelConfig): Promise<ModelResponse> {
    const apiKey = import.meta.env.XAI_API_KEY ?? process.env.XAI_API_KEY;
    if (!apiKey) throw new Error('XAI_API_KEY not configured');

    const start = Date.now();

    const res = await fetch(XAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: config.model,
        max_tokens: config.maxTokens ?? 4096,
        temperature: config.temperature ?? 0.7,
        messages: messages.map((m) => ({ role: m.role, content: m.content })),
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`xAI API error (${res.status}): ${err}`);
    }

    const data = await res.json();
    const choice = data.choices?.[0];

    return {
      content: choice?.message?.content ?? '',
      inputTokens: data.usage?.prompt_tokens ?? 0,
      outputTokens: data.usage?.completion_tokens ?? 0,
      model: config.model,
      latencyMs: Date.now() - start,
    };
  },
};
