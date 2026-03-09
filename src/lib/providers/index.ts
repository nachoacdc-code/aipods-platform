import { anthropicAdapter } from './anthropic';
import { xaiAdapter } from './xai';
import { googleAdapter } from './google';
import type { ProviderAdapter } from './base';
import type { Provider } from '../costs';

export type { ProviderAdapter, Message, ModelConfig, ModelResponse } from './base';

const adapters: Record<Provider, ProviderAdapter> = {
  anthropic: anthropicAdapter,
  xai: xaiAdapter,
  google: googleAdapter,
};

export function getAdapter(provider: Provider): ProviderAdapter {
  const adapter = adapters[provider];
  if (!adapter) throw new Error(`Unknown provider: ${provider}`);
  return adapter;
}
