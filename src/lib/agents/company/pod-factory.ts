import { callWithRouter } from '../../model-router';
import { getSupabaseServiceClient, isSupabaseConfigured } from '../../supabase';
import { reviewOutput } from './qa';

const POD_FACTORY_PROMPT = `You are the Pod Factory Director at AIpods. You own pod creation, improvement, and model scouting.

Your responsibilities:
1. **Model Scouting** — Evaluate current model assignments, suggest upgrades when newer/cheaper models become available
2. **Pod Improvement** — Analyze pod performance data and suggest prompt improvements, new tools, or workflow changes
3. **New Pod Templates** — Design new pod architectures based on demand signals

Volume limits:
- Maximum 3 new pod variants per month (first 6 months)
- Every new pod must go through a 7-Day MVP Sprint before launch
- Never launch anything bigger than a tested mini-pod (3-5 agents)

When analyzing model performance, consider: cost per task, latency, output quality, and failure rate.`;

const MODEL_SCOUT_PROMPT = `You are running the weekly Model Scout routine. Review current model assignments and performance data.

Provide:
1. **Current Assignments** — List each agent type and its current model
2. **Performance Analysis** — Cost efficiency, quality observations, any failures
3. **Recommendations** — Any model swaps that would improve cost or quality
4. **Action Items** — Specific changes to make (or "no changes needed")

Be conservative — only recommend changes backed by data.`;

interface ModelPerformance {
  agent_type: string;
  model_used: string;
  total_runs: number;
  avg_cost: number;
  total_cost: number;
}

async function gatherModelPerformance(): Promise<ModelPerformance[]> {
  if (!isSupabaseConfigured()) return [];

  const supabase = getSupabaseServiceClient();
  const since = new Date(Date.now() - 7 * 86400000).toISOString();

  const { data } = await supabase
    .from('agent_runs')
    .select('agent_type, model_used, cost_usd')
    .gte('created_at', since);

  if (!data?.length) return [];

  const grouped = new Map<string, { runs: number; totalCost: number; model: string; agent: string }>();

  for (const row of data) {
    const key = `${row.agent_type}:${row.model_used}`;
    const existing = grouped.get(key) ?? { runs: 0, totalCost: 0, model: row.model_used, agent: row.agent_type };
    existing.runs++;
    existing.totalCost += row.cost_usd ?? 0;
    grouped.set(key, existing);
  }

  return Array.from(grouped.values()).map((g) => ({
    agent_type: g.agent,
    model_used: g.model,
    total_runs: g.runs,
    avg_cost: g.totalCost / g.runs,
    total_cost: g.totalCost,
  }));
}

export async function runModelScout(): Promise<{ report: string; costUsd: number }> {
  const performance = await gatherModelPerformance();

  const perfContext = performance.length > 0
    ? performance.map((p) =>
      `- ${p.agent_type} → ${p.model_used}: ${p.total_runs} runs, avg $${p.avg_cost.toFixed(4)}/run, total $${p.total_cost.toFixed(4)}`,
    ).join('\n')
    : 'No agent runs recorded this week yet.';

  const response = await callWithRouter('pod_factory', [
    { role: 'system', content: `${POD_FACTORY_PROMPT}\n\n${MODEL_SCOUT_PROMPT}` },
    { role: 'user', content: `Model performance data (last 7 days):\n${perfContext}` },
  ], 'medium');

  const qa = await reviewOutput('Pod Factory Director', response.content, false);

  if (isSupabaseConfigured()) {
    try {
      const supabase = getSupabaseServiceClient();
      await supabase.from('agent_runs').insert({
        agent_type: 'pod_factory',
        status: 'completed',
        model_used: 'system',
        tokens_used: 0,
        cost_usd: response.costUsd + qa.costUsd,
        input_json: { routine: 'model_scout' },
        output_json: { report_length: qa.revisedContent.length },
      });
    } catch { /* non-critical */ }
  }

  return { report: qa.revisedContent, costUsd: response.costUsd + qa.costUsd };
}

export async function analyzePodPerformance(podType: string): Promise<{ analysis: string; costUsd: number }> {
  if (!isSupabaseConfigured()) return { analysis: 'Supabase not configured', costUsd: 0 };

  const supabase = getSupabaseServiceClient();

  const { data: tasks } = await supabase
    .from('tasks')
    .select('status, units_consumed, created_at, completed_at')
    .eq('task_type', podType)
    .order('created_at', { ascending: false })
    .limit(50);

  const taskSummary = (tasks ?? []).length > 0
    ? `${tasks!.length} recent tasks: ${tasks!.filter((t: any) => t.status === 'completed').length} completed, ${tasks!.filter((t: any) => t.status === 'failed').length} failed`
    : 'No tasks found for this pod type.';

  const response = await callWithRouter('pod_factory', [
    { role: 'system', content: POD_FACTORY_PROMPT },
    { role: 'user', content: `Analyze performance for pod type "${podType}":\n${taskSummary}\n\nSuggest improvements to prompts, workflow, or model assignments.` },
  ], 'medium');

  return { analysis: response.content, costUsd: response.costUsd };
}
