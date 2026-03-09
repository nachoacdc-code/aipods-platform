import { getSupabaseServiceClient, isSupabaseConfigured } from './supabase';

export interface Pod {
  id: string;
  name: string;
  pod_type: string;
  status: string;
  config_json: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface PodWithStats extends Pod {
  task_count: number;
  last_task_at: string | null;
  modules: PodModule[];
}

export interface PodModule {
  id: string;
  pod_id: string;
  module_type: string;
  enabled: boolean;
  added_at: string;
}

export const POD_CATALOG: Record<string, { label: string; description: string; icon: string; defaultModules: string[] }> = {
  lead_research: {
    label: 'Lead Research',
    description: 'Find, qualify, and score leads for any vertical. Get outreach-ready lists with validated emails and personalized first lines.',
    icon: '🔍',
    defaultModules: ['icp_strategy', 'company_finder', 'contact_hunter', 'email_validator', 'signal_analyzer', 'scorer_writer', 'compiler'],
  },
  marketing: {
    label: 'Marketing',
    description: 'Content, SEO, social media, campaigns. Your full marketing team that knows your brand inside out.',
    icon: '📣',
    defaultModules: ['content_strategy', 'blog_writer', 'social_media', 'seo_audit'],
  },
  sales: {
    label: 'Sales',
    description: 'Outreach, follow-ups, pipeline management. Close more deals with AI that remembers every conversation.',
    icon: '💼',
    defaultModules: ['outreach', 'follow_up', 'pipeline'],
  },
  ops: {
    label: 'Ops',
    description: 'Workflows, documentation, process automation. Keep your business running like clockwork.',
    icon: '⚙️',
    defaultModules: ['sop_builder', 'process_automation', 'doc_summarizer'],
  },
  creative: {
    label: 'Creative',
    description: 'Design, copy, video, assets. A full creative department at a fraction of the cost.',
    icon: '🎨',
    defaultModules: ['ad_copy', 'landing_pages', 'visual_strategy'],
  },
  research: {
    label: 'Research',
    description: 'Market analysis, competitive intel, trend spotting. Deep research your team can act on.',
    icon: '📊',
    defaultModules: ['market_analysis', 'competitive_intel', 'trend_research'],
  },
};

export async function createPod(podType: string, name: string): Promise<Pod | null> {
  if (!isSupabaseConfigured()) return null;

  const catalog = POD_CATALOG[podType];
  if (!catalog) throw new Error(`Unknown pod type: ${podType}`);

  const supabase = getSupabaseServiceClient();

  const { data: pod, error } = await supabase
    .from('pods')
    .insert({
      name,
      pod_type: podType,
      config_json: { modules: catalog.defaultModules },
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  const modules = catalog.defaultModules.map((mod) => ({
    pod_id: pod.id,
    module_type: mod,
    enabled: true,
  }));

  await supabase.from('pod_modules').insert(modules);

  return pod;
}

export async function listPods(): Promise<PodWithStats[]> {
  if (!isSupabaseConfigured()) return [];

  const supabase = getSupabaseServiceClient();

  const { data: pods, error } = await supabase
    .from('pods')
    .select('*')
    .neq('status', 'archived')
    .order('created_at', { ascending: false });

  if (error || !pods) return [];

  const result: PodWithStats[] = [];

  for (const pod of pods) {
    const { data: modules } = await supabase
      .from('pod_modules')
      .select('*')
      .eq('pod_id', pod.id);

    const { count } = await supabase
      .from('tasks')
      .select('id', { count: 'exact', head: true })
      .eq('pod_id', pod.id);

    const { data: lastTask } = await supabase
      .from('tasks')
      .select('completed_at')
      .eq('pod_id', pod.id)
      .order('completed_at', { ascending: false })
      .limit(1)
      .single();

    result.push({
      ...pod,
      task_count: count ?? 0,
      last_task_at: lastTask?.completed_at ?? null,
      modules: modules ?? [],
    });
  }

  return result;
}

export async function getPod(podId: string): Promise<PodWithStats | null> {
  if (!isSupabaseConfigured()) return null;

  const supabase = getSupabaseServiceClient();

  const { data: pod } = await supabase
    .from('pods')
    .select('*')
    .eq('id', podId)
    .single();

  if (!pod) return null;

  const { data: modules } = await supabase
    .from('pod_modules')
    .select('*')
    .eq('pod_id', podId);

  const { count } = await supabase
    .from('tasks')
    .select('id', { count: 'exact', head: true })
    .eq('pod_id', podId);

  const { data: lastTask } = await supabase
    .from('tasks')
    .select('completed_at')
    .eq('pod_id', podId)
    .order('completed_at', { ascending: false })
    .limit(1)
    .single();

  return {
    ...pod,
    task_count: count ?? 0,
    last_task_at: lastTask?.completed_at ?? null,
    modules: modules ?? [],
  };
}

export async function getRecentTasks(podId: string, limit = 10) {
  if (!isSupabaseConfigured()) return [];

  const supabase = getSupabaseServiceClient();

  const { data } = await supabase
    .from('tasks')
    .select('*')
    .eq('pod_id', podId)
    .order('created_at', { ascending: false })
    .limit(limit);

  return data ?? [];
}
