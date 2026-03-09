import type { APIRoute } from 'astro';
import { hasSessionCookie } from '../../../lib/auth';
import { getSupabaseServiceClient, isSupabaseConfigured } from '../../../lib/supabase';

export const GET: APIRoute = async ({ request, url }) => {
  if (!hasSessionCookie(request.headers.get('cookie'))) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  if (!isSupabaseConfigured()) {
    return new Response(JSON.stringify({ configured: false }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const days = parseInt(url.searchParams.get('days') ?? '30', 10);
  const since = new Date(Date.now() - days * 86400000).toISOString();

  const supabase = getSupabaseServiceClient();

  const { data: runs } = await supabase
    .from('agent_runs')
    .select('agent_type, model_used, cost_usd, tokens_used, created_at')
    .gte('created_at', since)
    .order('created_at', { ascending: false });

  const rows = runs ?? [];

  const byAgent = new Map<string, { cost: number; runs: number; tokens: number }>();
  const byModel = new Map<string, { cost: number; runs: number; tokens: number }>();
  const byDay = new Map<string, { cost: number; runs: number }>();

  let totalCost = 0;
  let totalRuns = 0;
  let totalTokens = 0;

  for (const r of rows) {
    const cost = r.cost_usd ?? 0;
    const tokens = r.tokens_used ?? 0;
    totalCost += cost;
    totalRuns++;
    totalTokens += tokens;

    const agent = byAgent.get(r.agent_type) ?? { cost: 0, runs: 0, tokens: 0 };
    agent.cost += cost; agent.runs++; agent.tokens += tokens;
    byAgent.set(r.agent_type, agent);

    const model = byModel.get(r.model_used) ?? { cost: 0, runs: 0, tokens: 0 };
    model.cost += cost; model.runs++; model.tokens += tokens;
    byModel.set(r.model_used, model);

    const day = r.created_at.slice(0, 10);
    const d = byDay.get(day) ?? { cost: 0, runs: 0 };
    d.cost += cost; d.runs++;
    byDay.set(day, d);
  }

  return new Response(JSON.stringify({
    configured: true,
    period: { days, since },
    totals: { cost: totalCost, runs: totalRuns, tokens: totalTokens },
    byAgent: Array.from(byAgent.entries()).map(([agent, v]) => ({ agent, ...v })).sort((a, b) => b.cost - a.cost),
    byModel: Array.from(byModel.entries()).map(([model, v]) => ({ model, ...v })).sort((a, b) => b.cost - a.cost),
    byDay: Array.from(byDay.entries()).map(([day, v]) => ({ day, ...v })).sort((a, b) => a.day.localeCompare(b.day)),
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
