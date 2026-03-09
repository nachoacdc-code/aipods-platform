import type { APIRoute } from 'astro';
import { hasSessionCookie } from '../../../lib/auth';
import { getSupabaseServiceClient, isSupabaseConfigured } from '../../../lib/supabase';
import { MODEL_PRICING } from '../../../lib/costs';

const DEFAULT_ASSIGNMENTS: Record<string, { primary: string; fallback: string }> = {
  ceo:              { primary: 'claude-opus-4',    fallback: 'claude-sonnet-4' },
  pod_factory:      { primary: 'claude-sonnet-4',  fallback: 'grok-3-fast' },
  sales:            { primary: 'grok-3',           fallback: 'grok-3-fast' },
  marketing:        { primary: 'claude-sonnet-4',  fallback: 'gemini-2.0-flash' },
  finance:          { primary: 'claude-haiku-3.5', fallback: 'grok-3-fast' },
  customer_success: { primary: 'claude-sonnet-4',  fallback: 'claude-haiku-3.5' },
  qa:               { primary: 'claude-sonnet-4',  fallback: 'claude-sonnet-4' },
  pod_task:         { primary: 'claude-sonnet-4',  fallback: 'gemini-2.0-flash' },
};

export const GET: APIRoute = async ({ request }) => {
  if (!hasSessionCookie(request.headers.get('cookie'))) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  const availableModels = Object.keys(MODEL_PRICING);

  let dbOverrides: Record<string, { default_model: string; fallback_model: string }> = {};
  let upgradeLog: unknown[] = [];

  if (isSupabaseConfigured()) {
    const supabase = getSupabaseServiceClient();

    const { data: configs } = await supabase.from('model_router_config').select('*');
    if (configs) {
      for (const c of configs) {
        dbOverrides[c.agent_type as string] = {
          default_model: c.default_model as string,
          fallback_model: c.fallback_model as string,
        };
      }
    }

    const { data: logs } = await supabase
      .from('model_upgrade_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);
    upgradeLog = logs ?? [];
  }

  const assignments = Object.entries(DEFAULT_ASSIGNMENTS).map(([agent, defaults]) => {
    const override = dbOverrides[agent];
    return {
      agent,
      primary: override?.default_model ?? defaults.primary,
      fallback: override?.fallback_model ?? defaults.fallback,
      isOverridden: !!override,
    };
  });

  return new Response(JSON.stringify({ assignments, availableModels, upgradeLog }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};

export const POST: APIRoute = async ({ request }) => {
  if (!hasSessionCookie(request.headers.get('cookie'))) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  if (!isSupabaseConfigured()) {
    return new Response(JSON.stringify({ error: 'Supabase not configured' }), { status: 503 });
  }

  const { agent, primary, fallback } = await request.json() as {
    agent: string;
    primary: string;
    fallback: string;
  };

  if (!agent || !primary || !fallback) {
    return new Response(JSON.stringify({ error: 'agent, primary, and fallback are required' }), { status: 400 });
  }

  const supabase = getSupabaseServiceClient();

  const { data: existing } = await supabase
    .from('model_router_config')
    .select('id')
    .eq('agent_type', agent)
    .single();

  if (existing) {
    await supabase
      .from('model_router_config')
      .update({ default_model: primary, fallback_model: fallback })
      .eq('agent_type', agent);
  } else {
    await supabase
      .from('model_router_config')
      .insert({ agent_type: agent, default_model: primary, fallback_model: fallback });
  }

  await supabase.from('model_upgrade_log').insert({
    agent_type: agent,
    old_model: 'manual_override',
    new_model: primary,
    reason: `Manual override: primary=${primary}, fallback=${fallback}`,
  });

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
