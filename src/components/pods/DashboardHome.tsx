import { useState, useEffect } from 'react';

interface Pod {
  id: string;
  name: string;
  pod_type: string;
  status: string;
  task_count: number;
  last_task_at: string | null;
}

const POD_ICONS: Record<string, string> = {
  lead_research: '🔍',
  marketing: '📣',
  sales: '💼',
  ops: '⚙️',
  creative: '🎨',
  research: '📊',
};

const POD_COLORS: Record<string, string> = {
  lead_research: 'border-blue-500/20 from-blue-500/10 to-blue-600/5',
  marketing: 'border-violet-500/20 from-violet-500/10 to-violet-600/5',
  sales: 'border-emerald-500/20 from-emerald-500/10 to-emerald-600/5',
  ops: 'border-amber-500/20 from-amber-500/10 to-amber-600/5',
  creative: 'border-pink-500/20 from-pink-500/10 to-pink-600/5',
  research: 'border-cyan-500/20 from-cyan-500/10 to-cyan-600/5',
};

export default function DashboardHome() {
  const [pods, setPods] = useState<Pod[]>([]);
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/pods')
      .then((r) => r.json())
      .then((data) => {
        setPods(data.pods ?? []);
        setConfigured(data.configured ?? false);
      })
      .catch(() => setConfigured(false))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center py-24 text-sm text-zinc-500">Loading dashboard...</div>;
  }

  const totalTasks = pods.reduce((sum, p) => sum + p.task_count, 0);
  const activePods = pods.filter((p) => p.status === 'active').length;

  return (
    <div>
      {/* Stats */}
      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: 'Active Pods', value: String(activePods), sub: activePods > 0 ? 'running' : 'deploy one now' },
          { label: 'Tasks Completed', value: String(totalTasks), sub: 'this month' },
          { label: 'Units Used', value: '—', sub: configured ? 'MVP — unlimited' : 'connect Supabase' },
          { label: 'Knowledge Score', value: '—', sub: 'upload docs to grow' },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl border border-white/5 bg-white/[0.02] p-5">
            <p className="text-2xl font-bold text-white">{stat.value}</p>
            <p className="mt-1 text-xs font-medium text-zinc-400">{stat.label}</p>
            <p className="text-xs text-zinc-600">{stat.sub}</p>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="mb-8 flex gap-3">
        <a href="/app/pods/new"
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-blue-500">
          <span>+</span> New Pod
        </a>
        <a href="/app/knowledge"
          className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-medium text-zinc-300 transition hover:border-white/20 hover:text-white">
          🧠 Upload Knowledge
        </a>
      </div>

      {/* Pod Grid */}
      {pods.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/[0.01] py-24 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-3xl">
            ⬡
          </div>
          <h2 className="mb-2 text-lg font-semibold text-white">No pods yet</h2>
          <p className="mb-6 max-w-xs text-sm text-zinc-500">
            Deploy your first AI pod and start seeing results.
            Your team gets smarter with every task.
          </p>
          <a href="/app/pods/new"
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-blue-600 px-5 text-sm font-medium text-white transition hover:bg-blue-500">
            Deploy your first Pod →
          </a>
        </div>
      ) : (
        <div>
          <h2 className="mb-4 text-lg font-semibold text-white">My Pods</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {pods.map((pod) => (
              <a
                key={pod.id}
                href={`/app/pods/${pod.id}`}
                className={`group rounded-2xl border bg-gradient-to-b p-6 transition hover:scale-[1.02] ${POD_COLORS[pod.pod_type] ?? 'border-white/10 from-white/5 to-transparent'}`}
              >
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-2xl">{POD_ICONS[pod.pod_type] ?? '⬡'}</span>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide ${
                    pod.status === 'active' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-zinc-500/10 text-zinc-500'
                  }`}>
                    {pod.status}
                  </span>
                </div>
                <h3 className="mb-1 text-base font-semibold text-white group-hover:text-blue-300 transition">{pod.name}</h3>
                <p className="text-xs text-zinc-500">
                  {pod.pod_type.replace('_', ' ')} · {pod.task_count} tasks
                  {pod.last_task_at && ` · last run ${new Date(pod.last_task_at).toLocaleDateString()}`}
                </p>
              </a>
            ))}
          </div>
        </div>
      )}

      {configured === false && (
        <div className="mt-8 rounded-2xl border border-yellow-500/20 bg-yellow-500/5 p-6 text-center">
          <p className="text-sm text-yellow-300">Connect Supabase to start creating and running pods.</p>
          <p className="mt-1 text-xs text-zinc-500">Set environment variables and run the SQL migrations.</p>
        </div>
      )}
    </div>
  );
}
