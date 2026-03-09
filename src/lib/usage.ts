import { getSupabaseServiceClient, isSupabaseConfigured } from './supabase';

export interface UsageStats {
  unitsUsed: number;
  unitsLimit: number;
  tasksRun: number;
  periodStart: string;
  periodEnd: string;
}

/**
 * Get or create current usage period (monthly).
 * MVP: effectively unlimited (999,999 units).
 */
export async function getCurrentUsage(): Promise<UsageStats> {
  const defaults: UsageStats = {
    unitsUsed: 0,
    unitsLimit: 999999,
    tasksRun: 0,
    periodStart: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString(),
    periodEnd: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString(),
  };

  if (!isSupabaseConfigured()) return defaults;

  const supabase = getSupabaseServiceClient();

  const now = new Date();
  const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  let { data: period } = await supabase
    .from('usage_periods')
    .select('*')
    .gte('period_start', periodStart.toISOString())
    .lte('period_end', periodEnd.toISOString())
    .single();

  if (!period) {
    const { data: newPeriod } = await supabase
      .from('usage_periods')
      .insert({
        period_start: periodStart.toISOString(),
        period_end: periodEnd.toISOString(),
        units_used: 0,
        units_limit: 999999,
      })
      .select()
      .single();
    period = newPeriod;
  }

  const { count: tasksRun } = await supabase
    .from('tasks')
    .select('id', { count: 'exact', head: true })
    .gte('created_at', periodStart.toISOString());

  return {
    unitsUsed: period?.units_used ?? 0,
    unitsLimit: period?.units_limit ?? 999999,
    tasksRun: tasksRun ?? 0,
    periodStart: periodStart.toISOString(),
    periodEnd: periodEnd.toISOString(),
  };
}

export async function consumeUnits(units: number): Promise<void> {
  if (!isSupabaseConfigured()) return;

  const supabase = getSupabaseServiceClient();
  const now = new Date();
  const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const { data: period } = await supabase
    .from('usage_periods')
    .select('id, units_used')
    .gte('period_start', periodStart.toISOString())
    .single();

  if (period) {
    await supabase
      .from('usage_periods')
      .update({ units_used: period.units_used + units })
      .eq('id', period.id);
  }
}
