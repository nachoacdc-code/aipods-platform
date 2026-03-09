import { getSupabaseServiceClient, isSupabaseConfigured } from './supabase';

export interface Escalation {
  id: string;
  agent_type: string;
  severity: string;
  title: string;
  description: string;
  context_json: Record<string, unknown>;
  status: string;
  resolution: string | null;
  created_at: string;
  resolved_at: string | null;
}

export async function listEscalations(status?: string): Promise<Escalation[]> {
  if (!isSupabaseConfigured()) return [];

  const supabase = getSupabaseServiceClient();
  let query = supabase.from('escalations').select('*').order('created_at', { ascending: false });

  if (status) {
    query = query.eq('status', status);
  }

  const { data } = await query.limit(50);
  return (data ?? []) as Escalation[];
}

export async function resolveEscalation(
  id: string,
  resolution: 'approved' | 'rejected' | 'modified',
  notes?: string,
): Promise<void> {
  if (!isSupabaseConfigured()) return;

  const supabase = getSupabaseServiceClient();

  await supabase
    .from('escalations')
    .update({
      status: resolution,
      resolution: notes ?? resolution,
      resolved_at: new Date().toISOString(),
    })
    .eq('id', id);
}

export async function getEscalationCounts(): Promise<{ pending: number; approved: number; rejected: number }> {
  if (!isSupabaseConfigured()) return { pending: 0, approved: 0, rejected: 0 };

  const supabase = getSupabaseServiceClient();

  const [pending, approved, rejected] = await Promise.all([
    supabase.from('escalations').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('escalations').select('id', { count: 'exact', head: true }).eq('status', 'approved'),
    supabase.from('escalations').select('id', { count: 'exact', head: true }).eq('status', 'rejected'),
  ]);

  return {
    pending: pending.count ?? 0,
    approved: approved.count ?? 0,
    rejected: rejected.count ?? 0,
  };
}
