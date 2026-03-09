import { useState, useEffect } from 'react';

interface Metrics {
  activePods: number;
  tasksThisWeek: number;
  tasksToday: number;
  weekCostUsd: number;
  agentRunsThisWeek: number;
  pendingEscalations: number;
  knowledgeDocs: number;
  knowledgeNotes: number;
  lastCeoReport: { id: string; report_type: string; created_at: string } | null;
}

interface Activity {
  agent: string;
  model: string;
  cost: number;
  when: string;
}

interface Escalation {
  id: string;
  agent_type: string;
  severity: string;
  title: string;
  status: string;
  created_at: string;
}

export default function InternalOverview() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [activity, setActivity] = useState<Activity[]>([]);
  const [escalations, setEscalations] = useState<Escalation[]>([]);
  const [configured, setConfigured] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/internal/overview')
      .then((r) => r.json())
      .then((data) => {
        setConfigured(data.configured ?? false);
        setMetrics(data.metrics ?? null);
        setActivity(data.recentActivity ?? []);
        setEscalations(data.pendingEscalations ?? []);
      })
      .catch(() => setConfigured(false))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center py-24 text-sm text-zinc-500">Loading...</div>;

  if (!configured) {
    return (
      <div className="rounded-2xl border border-yellow-500/20 bg-yellow-500/5 p-8 text-center">
        <p className="text-sm text-yellow-300">Connect Supabase to see internal metrics.</p>
        <p className="mt-1 text-xs text-zinc-500">Set environment variables and run the SQL migrations.</p>
      </div>
    );
  }

  return (
    <div>
      {/* Metrics Grid */}
      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: 'Active Pods', value: String(metrics?.activePods ?? 0), color: 'text-blue-400' },
          { label: 'Tasks This Week', value: String(metrics?.tasksThisWeek ?? 0), color: 'text-emerald-400' },
          { label: 'Week API Cost', value: `$${(metrics?.weekCostUsd ?? 0).toFixed(4)}`, color: 'text-amber-400' },
          { label: 'Agent Runs', value: String(metrics?.agentRunsThisWeek ?? 0), color: 'text-violet-400' },
          { label: 'Pending Escalations', value: String(metrics?.pendingEscalations ?? 0), color: metrics?.pendingEscalations ? 'text-red-400' : 'text-zinc-400' },
          { label: 'Tasks Today', value: String(metrics?.tasksToday ?? 0), color: 'text-cyan-400' },
          { label: 'Knowledge Docs', value: String(metrics?.knowledgeDocs ?? 0), color: 'text-pink-400' },
          { label: 'Knowledge Notes', value: String(metrics?.knowledgeNotes ?? 0), color: 'text-teal-400' },
        ].map((m) => (
          <div key={m.label} className="rounded-xl border border-white/5 bg-white/[0.02] p-5">
            <p className={`text-2xl font-bold ${m.color}`}>{m.value}</p>
            <p className="mt-1 text-xs text-zinc-500">{m.label}</p>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="mb-8 flex flex-wrap gap-3">
        <a href="/internal/agents" className="rounded-lg border border-amber-500/20 bg-amber-500/5 px-4 py-2 text-sm font-medium text-amber-300 transition hover:bg-amber-500/10">
          🤖 Trigger Agent Run
        </a>
        <a href="/internal/escalations" className="rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-2 text-sm font-medium text-red-300 transition hover:bg-red-500/10">
          🚨 Escalations {metrics?.pendingEscalations ? `(${metrics.pendingEscalations})` : ''}
        </a>
        <a href="/internal/ceo-report" className="rounded-lg border border-blue-500/20 bg-blue-500/5 px-4 py-2 text-sm font-medium text-blue-300 transition hover:bg-blue-500/10">
          📊 CEO Report
        </a>
        <a href="/internal/costs" className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-4 py-2 text-sm font-medium text-emerald-300 transition hover:bg-emerald-500/10">
          💰 Cost Breakdown
        </a>
        <a href="/app" className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-zinc-400 transition hover:text-white">
          ← Client View
        </a>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent Activity */}
        <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-6">
          <h2 className="mb-4 text-sm font-semibold text-zinc-300">Recent Agent Activity</h2>
          {activity.length === 0 ? (
            <p className="text-xs text-zinc-600">No agent runs yet.</p>
          ) : (
            <div className="space-y-2">
              {activity.map((a, i) => (
                <div key={i} className="flex items-center justify-between rounded-lg bg-white/[0.02] px-3 py-2">
                  <div>
                    <p className="text-xs font-medium text-zinc-200">{a.agent}</p>
                    <p className="text-[10px] text-zinc-600">{a.model} · {new Date(a.when).toLocaleString()}</p>
                  </div>
                  <span className="text-xs font-mono text-amber-400">${a.cost?.toFixed(4) ?? '0.00'}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pending Escalations */}
        <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-6">
          <h2 className="mb-4 text-sm font-semibold text-zinc-300">Pending Escalations</h2>
          {escalations.length === 0 ? (
            <p className="text-xs text-zinc-600">All clear — no pending escalations.</p>
          ) : (
            <div className="space-y-2">
              {escalations.map((e) => (
                <a key={e.id} href="/internal/escalations"
                  className="block rounded-lg border border-red-500/10 bg-red-500/5 px-3 py-2 transition hover:border-red-500/20">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium text-zinc-200">{e.title}</p>
                    <span className={`rounded-full px-2 py-0.5 text-[9px] uppercase tracking-wide ${
                      e.severity === 'critical' ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-400'
                    }`}>{e.severity}</span>
                  </div>
                  <p className="mt-1 text-[10px] text-zinc-600">{e.agent_type} · {new Date(e.created_at).toLocaleString()}</p>
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
