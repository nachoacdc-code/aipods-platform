export interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ModelConfig {
  model: string;
  maxTokens?: number;
  temperature?: number;
}

export interface ModelResponse {
  content: string;
  inputTokens: number;
  outputTokens: number;
  model: string;
  latencyMs: number;
}

export interface ProviderAdapter {
  name: string;
  callModel(messages: Message[], config: ModelConfig): Promise<ModelResponse>;
}
