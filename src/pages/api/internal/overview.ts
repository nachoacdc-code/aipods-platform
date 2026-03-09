import type { APIRoute } from 'astro';
import { hasSessionCookie } from '../../../lib/auth';
import { getSupabaseServiceClient, isSupabaseConfigured } from '../../../lib/supabase';

export const GET: APIRoute = async ({ request }) => {
  if (!hasSessionCookie(request.headers.get('cookie'))) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  if (!isSupabaseConfigured()) {
    return new Response(JSON.stringify({ configured: false }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const supabase = getSupabaseServiceClient();
  const today = new Date(Date.now() - 86400000).toISOString();
  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();

  const [
    podsRes,
    tasksWeekRes,
    tasksTodayRes,
    runsRes,
    escalationsRes,
    ceoReportRes,
    docsRes,
    notesRes,
  ] = await Promise.all([
    supabase.from('pods').select('id', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('tasks').select('status', { count: 'exact' }).gte('created_at', weekAgo),
    supabase.from('tasks').select('status', { count: 'exact' }).gte('created_at', today),
    supabase.from('agent_runs').select('agent_type, cost_usd, model_used, created_at').gte('created_at', weekAgo).order('created_at', { ascending: false }).limit(50),
    supabase.from('escalations').select('id, agent_type, severity, title, status, created_at').eq('status', 'pending').order('created_at', { ascending: false }).limit(10),
    supabase.from('ceo_reports').select('id, report_type, created_at').order('created_at', { ascending: false }).limit(1),
    supabase.from('knowledge_documents').select('id', { count: 'exact', head: true }),
    supabase.from('knowledge_notes').select('id', { count: 'exact', head: true }),
  ]);

  const runs = runsRes.data ?? [];
  const weekCost = runs.reduce((sum, r: any) => sum + (r.cost_usd ?? 0), 0);

  const recentActivity = runs.slice(0, 10).map((r: any) => ({
    agent: r.agent_type,
    model: r.model_used,
    cost: r.cost_usd,
    when: r.created_at,
  }));

  return new Response(JSON.stringify({
    configured: true,
    metrics: {
      activePods: podsRes.count ?? 0,
      tasksThisWeek: tasksWeekRes.count ?? 0,
      tasksToday: tasksTodayRes.count ?? 0,
      weekCostUsd: weekCost,
      agentRunsThisWeek: runs.length,
      pendingEscalations: (escalationsRes.data ?? []).length,
      knowledgeDocs: docsRes.count ?? 0,
      knowledgeNotes: notesRes.count ?? 0,
      lastCeoReport: (ceoReportRes.data ?? [])[0] ?? null,
    },
    recentActivity,
    pendingEscalations: escalationsRes.data ?? [],
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
