import { useState, useEffect, useCallback } from 'react';

interface Task {
  id: string;
  task_type: string;
  status: string;
  units_consumed: number;
  input_json: Record<string, unknown>;
  output_json: Record<string, unknown>;
  error_message: string | null;
  created_at: string;
  completed_at: string | null;
}

interface Module {
  id: string;
  module_type: string;
  enabled: boolean;
}

interface Pod {
  id: string;
  name: string;
  pod_type: string;
  status: string;
  task_count: number;
  last_task_at: string | null;
  modules: Module[];
}

interface Props {
  podId: string;
}

const STATUS_STYLE: Record<string, string> = {
  queued: 'text-yellow-400 bg-yellow-500/10',
  running: 'text-blue-400 bg-blue-500/10',
  completed: 'text-emerald-400 bg-emerald-500/10',
  failed: 'text-red-400 bg-red-500/10',
};

export default function PodDetail({ podId }: Props) {
  const [pod, setPod] = useState<Pod | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedTask, setExpandedTask] = useState<string | null>(null);

  // Task form
  const [industry, setIndustry] = useState('');
  const [targetRole, setTargetRole] = useState('CEO');
  const [geography, setGeography] = useState('United States');
  const [maxLeads, setMaxLeads] = useState(10);
  const [additionalContext, setAdditionalContext] = useState('');
  const [running, setRunning] = useState(false);
  const [taskError, setTaskError] = useState('');

  const fetchPod = useCallback(async () => {
    try {
      const res = await fetch(`/api/pods/${podId}`);
      if (!res.ok) return;
      const data = await res.json();
      setPod(data.pod);
      setTasks(data.tasks ?? []);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, [podId]);

  useEffect(() => { fetchPod(); }, [fetchPod]);

  const handleRunTask = async () => {
    if (!industry.trim() || running) return;
    setRunning(true);
    setTaskError('');

    try {
      const res = await fetch('/api/tasks/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          podId,
          podType: pod?.pod_type,
          taskType: 'lead_research',
          input: { industry, targetRole, geography, maxLeads, additionalContext },
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Task failed');

      await fetchPod();
      setIndustry('');
      setAdditionalContext('');
    } catch (err: any) {
      setTaskError(err.message);
    } finally {
      setRunning(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center py-24 text-sm text-zinc-500">Loading pod...</div>;
  }

  if (!pod) {
    return <div className="py-24 text-center text-sm text-zinc-500">Pod not found</div>;
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <div className="mb-1 flex items-center gap-3">
            <h1 className="text-2xl font-bold text-white">{pod.name}</h1>
            <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wide ${pod.status === 'active' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-zinc-500/10 text-zinc-500'}`}>
              {pod.status}
            </span>
          </div>
          <p className="text-sm text-zinc-500">{pod.pod_type.replace('_', ' ')} pod · {pod.task_count} tasks run</p>
        </div>
      </div>

      {/* Stats */}
      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: 'Tasks Run', value: String(pod.task_count) },
          { label: 'Status', value: pod.status },
          { label: 'Modules', value: String(pod.modules.length) },
          { label: 'Last Run', value: pod.last_task_at ? new Date(pod.last_task_at).toLocaleDateString() : '—' },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
            <p className="text-xl font-bold text-white">{s.value}</p>
            <p className="mt-1 text-xs text-zinc-500">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Run Task Form */}
      {pod.pod_type === 'lead_research' && (
        <div className="mb-10 rounded-2xl border border-blue-500/20 bg-blue-500/5 p-8">
          <h2 className="mb-4 text-lg font-semibold text-white">Run a Lead Research Task</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-400">Industry / Vertical *</label>
              <input type="text" value={industry} onChange={(e) => setIndustry(e.target.value)}
                placeholder="e.g. SaaS, Construction, E-commerce"
                className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-zinc-600 outline-none focus:border-blue-500/50" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-400">Target Role</label>
              <input type="text" value={targetRole} onChange={(e) => setTargetRole(e.target.value)}
                placeholder="e.g. CEO, VP Marketing, CTO"
                className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-zinc-600 outline-none focus:border-blue-500/50" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-400">Geography</label>
              <input type="text" value={geography} onChange={(e) => setGeography(e.target.value)}
                placeholder="e.g. United States, Europe, LATAM"
                className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-zinc-600 outline-none focus:border-blue-500/50" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-400">Max Leads</label>
              <input type="number" value={maxLeads} onChange={(e) => setMaxLeads(Number(e.target.value))}
                min={1} max={50}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-zinc-600 outline-none focus:border-blue-500/50" />
            </div>
          </div>
          <div className="mt-4">
            <label className="mb-1 block text-xs font-medium text-zinc-400">Additional Context (optional)</label>
            <input type="text" value={additionalContext} onChange={(e) => setAdditionalContext(e.target.value)}
              placeholder="e.g. Focus on companies with 50-200 employees, recently funded"
              className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-zinc-600 outline-none focus:border-blue-500/50" />
          </div>
          <div className="mt-5 flex items-center gap-4">
            <button onClick={handleRunTask} disabled={!industry.trim() || running}
              className="rounded-lg bg-blue-600 px-8 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed">
              {running ? 'Running... (this may take 1-2 min)' : 'Run Task →'}
            </button>
            {taskError && <p className="text-sm text-red-400">{taskError}</p>}
          </div>
        </div>
      )}

      {/* Task History */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-white">Task History</h2>
        {tasks.length === 0 ? (
          <div className="rounded-xl border border-dashed border-white/10 py-12 text-center text-sm text-zinc-600">
            No tasks yet. Run your first task above.
          </div>
        ) : (
          <div className="space-y-2">
            {tasks.map((task) => (
              <div key={task.id} className="rounded-xl border border-white/5 bg-white/[0.02] transition hover:border-white/10">
                <button onClick={() => setExpandedTask(expandedTask === task.id ? null : task.id)}
                  className="flex w-full items-center gap-4 px-5 py-4 text-left">
                  <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wide ${STATUS_STYLE[task.status] ?? 'text-zinc-400 bg-zinc-500/10'}`}>
                    {task.status}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-medium text-zinc-200">{task.task_type.replace('_', ' ')}</p>
                    <p className="text-xs text-zinc-600">
                      {new Date(task.created_at).toLocaleString()}
                      {task.units_consumed > 0 && ` · ${task.units_consumed} units`}
                    </p>
                  </div>
                  <span className="text-xs text-zinc-600">{expandedTask === task.id ? '▲' : '▼'}</span>
                </button>

                {expandedTask === task.id && (
                  <div className="border-t border-white/5 px-5 py-4">
                    {task.error_message && (
                      <div className="mb-3 rounded-lg bg-red-500/10 px-4 py-2 text-sm text-red-400">{task.error_message}</div>
                    )}
                    {task.output_json && Object.keys(task.output_json).length > 0 && (
                      <div>
                        <p className="mb-2 text-xs font-medium text-zinc-400">Output</p>
                        <pre className="max-h-96 overflow-auto rounded-lg bg-black/30 p-4 text-xs text-zinc-300">
                          {typeof task.output_json === 'object' && 'leadList' in task.output_json
                            ? String(task.output_json.leadList)
                            : JSON.stringify(task.output_json, null, 2)
                          }
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
