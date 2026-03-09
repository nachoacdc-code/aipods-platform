import { callWithRouter } from '../../model-router';
import { getSupabaseServiceClient, isSupabaseConfigured } from '../../supabase';

const FINANCE_PROMPT = `You are the Finance & Ops Director at AIpods. You track costs, monitor margins, and flag anomalies.

Your responsibilities:
1. **Daily Cost Summary** — Total API spend broken down by agent and model
2. **Weekly Financial Report** — Trends, projections, cost optimization opportunities
3. **Anomaly Detection** — Flag unusual spending (>2x daily average), failed runs, or cost spikes
4. **Margin Tracking** — Compare API costs against theoretical revenue from Task Units

Thresholds:
- Daily API spend alert: >$5 (MVP testing phase)
- Single agent run alert: >$0.50
- Failed run ratio alert: >10%

Be precise with numbers. Use tables when helpful. Flag anything the CEO needs to know.`;

interface CostBreakdown {
  byAgent: { agent: string; cost: number; runs: number }[];
  byModel: { model: string; cost: number; runs: number }[];
  total: number;
  totalRuns: number;
}

async function gatherCosts(periodDays: number): Promise<CostBreakdown> {
  const empty: CostBreakdown = { byAgent: [], byModel: [], total: 0, totalRuns: 0 };
  if (!isSupabaseConfigured()) return empty;

  const supabase = getSupabaseServiceClient();
  const since = new Date(Date.now() - periodDays * 86400000).toISOString();

  const { data } = await supabase
    .from('agent_runs')
    .select('agent_type, model_used, cost_usd')
    .gte('created_at', since);

  if (!data?.length) return empty;

  const agentMap = new Map<string, { cost: number; runs: number }>();
  const modelMap = new Map<string, { cost: number; runs: number }>();
  let total = 0;

  for (const row of data) {
    const cost = row.cost_usd ?? 0;
    total += cost;

    const agent = agentMap.get(row.agent_type) ?? { cost: 0, runs: 0 };
    agent.cost += cost;
    agent.runs++;
    agentMap.set(row.agent_type, agent);

    const model = modelMap.get(row.model_used) ?? { cost: 0, runs: 0 };
    model.cost += cost;
    model.runs++;
    modelMap.set(row.model_used, model);
  }

  return {
    byAgent: Array.from(agentMap.entries()).map(([agent, v]) => ({ agent, ...v })),
    byModel: Array.from(modelMap.entries()).map(([model, v]) => ({ model, ...v })),
    total,
    totalRuns: data.length,
  };
}

export async function runDailyCostSummary(): Promise<{ summary: string; costUsd: number; alerts: string[] }> {
  const costs = await gatherCosts(1);

  const alerts: string[] = [];
  if (costs.total > 5) alerts.push(`Daily spend $${costs.total.toFixed(2)} exceeds $5 threshold`);

  for (const agent of costs.byAgent) {
    if (agent.runs > 0 && agent.cost / agent.runs > 0.50) {
      alerts.push(`${agent.agent}: avg $${(agent.cost / agent.runs).toFixed(4)}/run exceeds $0.50 threshold`);
    }
  }

  const costContext = `Today's cost breakdown:
Total: $${costs.total.toFixed(4)} across ${costs.totalRuns} runs

By Agent:
${costs.byAgent.map((a) => `- ${a.agent}: $${a.cost.toFixed(4)} (${a.runs} runs)`).join('\n') || '- No runs'}

By Model:
${costs.byModel.map((m) => `- ${m.model}: $${m.cost.toFixed(4)} (${m.runs} runs)`).join('\n') || '- No runs'}

Alerts: ${alerts.length > 0 ? alerts.join('; ') : 'None'}`;

  const response = await callWithRouter('finance', [
    { role: 'system', content: FINANCE_PROMPT },
    { role: 'user', content: costContext },
  ], 'low');

  return { summary: response.content, costUsd: response.costUsd, alerts };
}

export async function runWeeklyFinancialReport(): Promise<{ report: string; costUsd: number }> {
  const costs = await gatherCosts(7);

  const costContext = `Weekly cost breakdown (last 7 days):
Total: $${costs.total.toFixed(4)} across ${costs.totalRuns} runs

By Agent:
${costs.byAgent.map((a) => `- ${a.agent}: $${a.cost.toFixed(4)} (${a.runs} runs, avg $${(a.cost / Math.max(a.runs, 1)).toFixed(4)}/run)`).join('\n') || '- No runs'}

By Model:
${costs.byModel.map((m) => `- ${m.model}: $${m.cost.toFixed(4)} (${m.runs} runs)`).join('\n') || '- No runs'}`;

  const response = await callWithRouter('finance', [
    { role: 'system', content: FINANCE_PROMPT },
    { role: 'user', content: `Generate a weekly financial report:\n${costContext}` },
  ], 'medium');

  return { report: response.content, costUsd: response.costUsd };
}
