import { callWithRouter } from '../../model-router';
import { getSupabaseServiceClient, isSupabaseConfigured } from '../../supabase';
import { reviewOutput } from './qa';

const CEO_WEEKLY_PROMPT = `You are the AI CEO of AIpods. You have full strategic oversight of the autonomous company.

Your weekly report must cover:
1. **Key Metrics** — Total tasks run, API costs, pod performance, Knowledge Center growth, active pods
2. **Director Summaries** — What each Director accomplished this week (Sales, Marketing, Finance, Customer Success, Pod Factory)
3. **Escalations** — Any pending items needing founder approval
4. **Recommendations** — Strategic suggestions for next week (new pods to test, model changes, cost optimizations)
5. **Model Upgrade Log** — Any model routing changes made this week
6. **Health Score** — Overall platform health (1-10) with brief justification

Be concise but thorough. Use data from the metrics provided. Your tone is that of a competent, confident executive reporting to the board.`;

const CEO_DAILY_PROMPT = `You are the AI CEO of AIpods. This is your daily quick check.

Review today's activity and provide:
1. **Tasks Today** — count and success rate
2. **Cost Today** — total API spend
3. **Alerts** — anything unusual (cost spikes, failures, pending escalations)
4. **One-liner** — single sentence summary of today

Keep it brief — 5-10 lines max.`;

interface PlatformMetrics {
  totalTasks: number;
  completedTasks: number;
  failedTasks: number;
  totalCostUsd: number;
  activePods: number;
  pendingEscalations: number;
  agentRuns: number;
  knowledgeDocs: number;
  knowledgeNotes: number;
}

async function gatherMetrics(periodDays: number): Promise<PlatformMetrics> {
  const defaults: PlatformMetrics = {
    totalTasks: 0, completedTasks: 0, failedTasks: 0,
    totalCostUsd: 0, activePods: 0, pendingEscalations: 0,
    agentRuns: 0, knowledgeDocs: 0, knowledgeNotes: 0,
  };

  if (!isSupabaseConfigured()) return defaults;

  const supabase = getSupabaseServiceClient();
  const since = new Date(Date.now() - periodDays * 86400000).toISOString();

  const [tasks, pods, escalations, runs, docs, notes] = await Promise.all([
    supabase.from('tasks').select('status', { count: 'exact' }).gte('created_at', since),
    supabase.from('pods').select('id', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('escalations').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('agent_runs').select('cost_usd').gte('created_at', since),
    supabase.from('knowledge_documents').select('id', { count: 'exact', head: true }),
    supabase.from('knowledge_notes').select('id', { count: 'exact', head: true }),
  ]);

  const taskRows = tasks.data ?? [];
  const totalCost = (runs.data ?? []).reduce((sum, r: any) => sum + (r.cost_usd ?? 0), 0);

  return {
    totalTasks: taskRows.length,
    completedTasks: taskRows.filter((t: any) => t.status === 'completed').length,
    failedTasks: taskRows.filter((t: any) => t.status === 'failed').length,
    totalCostUsd: totalCost,
    activePods: pods.count ?? 0,
    pendingEscalations: escalations.count ?? 0,
    agentRuns: (runs.data ?? []).length,
    knowledgeDocs: docs.count ?? 0,
    knowledgeNotes: notes.count ?? 0,
  };
}

export async function runWeeklyReport(): Promise<{ report: string; costUsd: number }> {
  const metrics = await gatherMetrics(7);

  const metricsContext = `Platform metrics (last 7 days):
- Tasks: ${metrics.totalTasks} total, ${metrics.completedTasks} completed, ${metrics.failedTasks} failed
- API cost: $${metrics.totalCostUsd.toFixed(4)}
- Active pods: ${metrics.activePods}
- Agent runs: ${metrics.agentRuns}
- Pending escalations: ${metrics.pendingEscalations}
- Knowledge Center: ${metrics.knowledgeDocs} documents, ${metrics.knowledgeNotes} notes`;

  const response = await callWithRouter('ceo', [
    { role: 'system', content: CEO_WEEKLY_PROMPT },
    { role: 'user', content: metricsContext },
  ], 'high');

  const qa = await reviewOutput('AI CEO', response.content, false);

  if (isSupabaseConfigured()) {
    try {
      const supabase = getSupabaseServiceClient();
      await supabase.from('ceo_reports').insert({
        report_type: 'weekly',
        content: qa.revisedContent,
        metrics_json: metrics,
      });
    } catch { /* non-critical */ }
  }

  return { report: qa.revisedContent, costUsd: response.costUsd + qa.costUsd };
}

export async function runDailyCheck(): Promise<{ report: string; costUsd: number }> {
  const metrics = await gatherMetrics(1);

  const metricsContext = `Today's metrics:
- Tasks: ${metrics.totalTasks} total, ${metrics.completedTasks} completed, ${metrics.failedTasks} failed
- API cost: $${metrics.totalCostUsd.toFixed(4)}
- Pending escalations: ${metrics.pendingEscalations}
- Agent runs: ${metrics.agentRuns}`;

  const response = await callWithRouter('ceo', [
    { role: 'system', content: CEO_DAILY_PROMPT },
    { role: 'user', content: metricsContext },
  ], 'low');

  if (isSupabaseConfigured()) {
    try {
      const supabase = getSupabaseServiceClient();
      await supabase.from('ceo_reports').insert({
        report_type: 'daily',
        content: response.content,
        metrics_json: metrics,
      });
    } catch { /* non-critical */ }
  }

  return { report: response.content, costUsd: response.costUsd };
}
