import { GoogleGenerativeAI } from '@google/generative-ai';
import type { ProviderAdapter, Message, ModelConfig, ModelResponse } from './base';

let _client: GoogleGenerativeAI | null = null;

function getClient(): GoogleGenerativeAI {
  if (_client) return _client;
  const apiKey = import.meta.env.GOOGLE_AI_API_KEY ?? process.env.GOOGLE_AI_API_KEY;
  if (!apiKey) throw new Error('GOOGLE_AI_API_KEY not configured');
  _client = new GoogleGenerativeAI(apiKey);
  return _client;
}

export const googleAdapter: ProviderAdapter = {
  name: 'google',

  async callModel(messages: Message[], config: ModelConfig): Promise<ModelResponse> {
    const client = getClient();
    const start = Date.now();

    const model = client.getGenerativeModel({
      model: config.model,
      generationConfig: {
        maxOutputTokens: config.maxTokens ?? 4096,
        temperature: config.temperature ?? 0.7,
      },
    });

    const systemMsg = messages.find((m) => m.role === 'system');
    const nonSystemMsgs = messages.filter((m) => m.role !== 'system');

    const history = nonSystemMsgs.slice(0, -1).map((m) => ({
      role: m.role === 'assistant' ? 'model' as const : 'user' as const,
      parts: [{ text: m.content }],
    }));

    const lastMsg = nonSystemMsgs[nonSystemMsgs.length - 1];

    const chat = model.startChat({
      history,
      ...(systemMsg ? { systemInstruction: { role: 'user' as const, parts: [{ text: systemMsg.content }] } } : {}),
    });

    const result = await chat.sendMessage(lastMsg?.content ?? '');
    const response = result.response;
    const text = response.text();
    const usage = response.usageMetadata;

    return {
      content: text,
      inputTokens: usage?.promptTokenCount ?? 0,
      outputTokens: usage?.candidatesTokenCount ?? 0,
      model: config.model,
      latencyMs: Date.now() - start,
    };
  },
};
