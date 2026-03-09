import { MODEL_TO_PROVIDER, calculateCost, type Provider } from './costs';
import { getAdapter, type Message, type ModelResponse } from './providers';
import { getSupabaseServiceClient, isSupabaseConfigured } from './supabase';

export type AgentType =
  | 'ceo'
  | 'pod_factory'
  | 'sales'
  | 'marketing'
  | 'finance'
  | 'customer_success'
  | 'qa'
  | 'pod_task';

export type TaskComplexity = 'low' | 'medium' | 'high';

interface ModelAssignment {
  primary: string;
  fallback: string;
}

/**
 * Default model assignments per agent type — from Section 12 of the reference doc.
 * Can be overridden via model_router_config table.
 */
const DEFAULT_ASSIGNMENTS: Record<AgentType, ModelAssignment> = {
  ceo:              { primary: 'claude-opus-4',    fallback: 'claude-sonnet-4' },
  pod_factory:      { primary: 'claude-sonnet-4',  fallback: 'grok-3-fast' },
  sales:            { primary: 'grok-3',           fallback: 'grok-3-fast' },
  marketing:        { primary: 'claude-sonnet-4',  fallback: 'gemini-2.0-flash' },
  finance:          { primary: 'claude-haiku-3.5', fallback: 'grok-3-fast' },
  customer_success: { primary: 'claude-sonnet-4',  fallback: 'claude-haiku-3.5' },
  qa:               { primary: 'claude-sonnet-4',  fallback: 'claude-sonnet-4' },
  pod_task:         { primary: 'claude-sonnet-4',  fallback: 'gemini-2.0-flash' },
};

const COMPLEXITY_OVERRIDES: Partial<Record<TaskComplexity, Partial<Record<AgentType, string>>>> = {
  low: {
    pod_task: 'gemini-2.0-flash',
    sales: 'grok-3-fast',
    marketing: 'gemini-2.0-flash',
  },
  high: {
    pod_task: 'claude-opus-4',
    sales: 'claude-sonnet-4',
  },
};

export interface RouteResult {
  model: string;
  provider: Provider;
  maxTokens: number;
  temperature: number;
}

export function routeRequest(
  agentType: AgentType,
  complexity: TaskComplexity = 'medium',
): RouteResult {
  const override = COMPLEXITY_OVERRIDES[complexity]?.[agentType];
  const assignment = DEFAULT_ASSIGNMENTS[agentType];
  const model = override ?? assignment.primary;
  const provider = MODEL_TO_PROVIDER[model];

  if (!provider) throw new Error(`No provider mapping for model: ${model}`);

  const maxTokens = agentType === 'ceo' ? 8192 : complexity === 'high' ? 6144 : 4096;
  const temperature = agentType === 'qa' ? 0.2 : agentType === 'ceo' ? 0.5 : 0.7;

  return { model, provider, maxTokens, temperature };
}

export function getFallbackModel(agentType: AgentType): RouteResult {
  const assignment = DEFAULT_ASSIGNMENTS[agentType];
  const model = assignment.fallback;
  const provider = MODEL_TO_PROVIDER[model];

  if (!provider) throw new Error(`No provider mapping for fallback model: ${model}`);

  return {
    model,
    provider,
    maxTokens: 4096,
    temperature: 0.7,
  };
}

/**
 * Execute an LLM call with automatic fallback and cost logging.
 */
export async function callWithRouter(
  agentType: AgentType,
  messages: Message[],
  complexity: TaskComplexity = 'medium',
): Promise<ModelResponse & { costUsd: number }> {
  const route = routeRequest(agentType, complexity);

  let response: ModelResponse;

  try {
    const adapter = getAdapter(route.provider);
    response = await adapter.callModel(messages, {
      model: route.model,
      maxTokens: route.maxTokens,
      temperature: route.temperature,
    });
  } catch (primaryError) {
    console.error(`Primary model ${route.model} failed, trying fallback:`, primaryError);

    const fallback = getFallbackModel(agentType);
    const fallbackAdapter = getAdapter(fallback.provider);
    response = await fallbackAdapter.callModel(messages, {
      model: fallback.model,
      maxTokens: fallback.maxTokens,
      temperature: fallback.temperature,
    });
  }

  const costUsd = calculateCost(response.model, response.inputTokens, response.outputTokens);

  if (isSupabaseConfigured()) {
    try {
      const supabase = getSupabaseServiceClient();
      await supabase.from('agent_runs').insert({
        agent_type: agentType,
        status: 'completed',
        model_used: response.model,
        tokens_used: response.inputTokens + response.outputTokens,
        cost_usd: costUsd,
        input_json: { message_count: messages.length },
        output_json: { content_length: response.content.length, latency_ms: response.latencyMs },
      });
    } catch {
      // Non-critical: don't fail the LLM call if logging fails
    }
  }

  return { ...response, costUsd };
}
