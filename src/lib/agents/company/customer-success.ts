import { callWithRouter } from '../../model-router';
import { getSupabaseServiceClient, isSupabaseConfigured } from '../../supabase';
import { reviewOutput } from './qa';

const CS_PROMPT = `You are the Customer Success Director at AIpods. You monitor client health, generate growth reports, and suggest upgrades.

Your responsibilities:
1. **Task Health** — Monitor task completion rates, identify patterns in failures
2. **Usage Insights** — Track which pods and features are used most, suggest optimizations
3. **Growth Reports** — Monthly summary of value delivered (tasks completed, units consumed, time saved)
4. **Upgrade Suggestions** — Based on usage patterns, suggest new pods or modules that would add value
5. **Satisfaction Signals** — Infer satisfaction from usage patterns (frequency, repeat tasks, pod additions)

For MVP: You're analyzing the founder's own test usage. Treat them as client #1.

Your reports should be positive and forward-looking — celebrate wins, frame improvements constructively.`;

export interface UsageInsights {
  totalTasks: number;
  completedTasks: number;
  failedTasks: number;
  mostUsedPod: string;
  totalUnitsConsumed: number;
  avgTaskDuration: number | null;
}

async function gatherUsageInsights(periodDays: number): Promise<UsageInsights> {
  const defaults: UsageInsights = {
    totalTasks: 0, completedTasks: 0, failedTasks: 0,
    mostUsedPod: 'none', totalUnitsConsumed: 0, avgTaskDuration: null,
  };

  if (!isSupabaseConfigured()) return defaults;

  const supabase = getSupabaseServiceClient();
  const since = new Date(Date.now() - periodDays * 86400000).toISOString();

  const { data: tasks } = await supabase
    .from('tasks')
    .select('pod_id, status, units_consumed, created_at, completed_at, task_type')
    .gte('created_at', since);

  if (!tasks?.length) return defaults;

  const completed = tasks.filter((t: any) => t.status === 'completed');
  const failed = tasks.filter((t: any) => t.status === 'failed');

  const podCounts = new Map<string, number>();
  for (const t of tasks) {
    const key = (t as any).task_type ?? 'unknown';
    podCounts.set(key, (podCounts.get(key) ?? 0) + 1);
  }
  const mostUsedPod = Array.from(podCounts.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'none';

  const totalUnits = tasks.reduce((sum, t: any) => sum + (t.units_consumed ?? 0), 0);

  const durations = completed
    .filter((t: any) => t.completed_at && t.created_at)
    .map((t: any) => new Date(t.completed_at).getTime() - new Date(t.created_at).getTime());
  const avgDuration = durations.length > 0 ? durations.reduce((a, b) => a + b, 0) / durations.length : null;

  return {
    totalTasks: tasks.length,
    completedTasks: completed.length,
    failedTasks: failed.length,
    mostUsedPod,
    totalUnitsConsumed: totalUnits,
    avgTaskDuration: avgDuration,
  };
}

export async function generateGrowthReport(): Promise<{ report: string; costUsd: number }> {
  const insights = await gatherUsageInsights(30);

  const context = `Monthly usage insights:
- Tasks: ${insights.totalTasks} total, ${insights.completedTasks} completed, ${insights.failedTasks} failed
- Success rate: ${insights.totalTasks > 0 ? ((insights.completedTasks / insights.totalTasks) * 100).toFixed(0) : 0}%
- Most used pod type: ${insights.mostUsedPod}
- Total units consumed: ${insights.totalUnitsConsumed}
- Avg task duration: ${insights.avgTaskDuration ? `${(insights.avgTaskDuration / 1000).toFixed(0)}s` : 'N/A'}`;

  const response = await callWithRouter('customer_success', [
    { role: 'system', content: CS_PROMPT },
    { role: 'user', content: `Generate a monthly Growth Report for our founder (client #1):\n${context}` },
  ], 'medium');

  const qa = await reviewOutput('Customer Success Director', response.content, true);

  return { report: qa.revisedContent, costUsd: response.costUsd + qa.costUsd };
}

export async function analyzeTaskCompletion(
  taskId: string,
): Promise<{ analysis: string; costUsd: number }> {
  if (!isSupabaseConfigured()) return { analysis: 'Supabase not configured', costUsd: 0 };

  const supabase = getSupabaseServiceClient();
  const { data: task } = await supabase.from('tasks').select('*').eq('id', taskId).single();

  if (!task) return { analysis: 'Task not found', costUsd: 0 };

  const response = await callWithRouter('customer_success', [
    { role: 'system', content: CS_PROMPT },
    {
      role: 'user',
      content: `Analyze this completed task for satisfaction signals:
- Type: ${task.task_type}
- Status: ${task.status}
- Units consumed: ${task.units_consumed}
- Had errors: ${task.error_message ? 'Yes' : 'No'}

Provide a brief satisfaction assessment and any follow-up actions.`,
    },
  ], 'low');

  return { analysis: response.content, costUsd: response.costUsd };
}
