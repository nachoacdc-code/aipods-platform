import { useState, useEffect } from 'react';

interface ScheduleItem {
  key: string;
  label: string;
  description: string;
  frequency: string;
}

interface RunResult {
  key: string;
  output: string;
  costUsd: number;
}

export default function AgentsPanel() {
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [running, setRunning] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, RunResult>>({});
  const [expanded, setExpanded] = useState<string | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/agents/run')
      .then((r) => r.json())
      .then((data) => setSchedules(data.available ?? []))
      .catch(() => {});
  }, []);

  const triggerAgent = async (key: string) => {
    setRunning(key);
    setError('');
    try {
      const res = await fetch('/api/agents/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Agent run failed');
      setResults((prev) => ({ ...prev, [key]: data }));
      setExpanded(key);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setRunning(null);
    }
  };

  const AGENT_COLORS: Record<string, string> = {
    ceo_weekly: 'border-blue-500/20 bg-blue-500/5',
    ceo_daily: 'border-blue-500/20 bg-blue-500/5',
    model_scout: 'border-violet-500/20 bg-violet-500/5',
    sales_outreach: 'border-emerald-500/20 bg-emerald-500/5',
    marketing_content: 'border-pink-500/20 bg-pink-500/5',
    marketing_seo: 'border-pink-500/20 bg-pink-500/5',
    finance_daily: 'border-amber-500/20 bg-amber-500/5',
    finance_weekly: 'border-amber-500/20 bg-amber-500/5',
    cs_growth_report: 'border-cyan-500/20 bg-cyan-500/5',
  };

  return (
    <div className="space-y-4">
      {schedules.map((s) => (
        <div key={s.key} className={`rounded-2xl border p-6 ${AGENT_COLORS[s.key] ?? 'border-white/10 bg-white/[0.02]'}`}>
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-base font-semibold text-white">{s.label}</h3>
              <p className="mt-1 text-sm text-zinc-400">{s.description}</p>
              <p className="mt-1 text-xs text-zinc-600">Schedule: {s.frequency}</p>
            </div>
            <button
              onClick={() => triggerAgent(s.key)}
              disabled={running !== null}
              className="shrink-0 rounded-lg bg-white/10 px-4 py-2 text-xs font-medium text-white transition hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {running === s.key ? 'Running...' : 'Run Now →'}
            </button>
          </div>

          {results[s.key] && (
            <div className="mt-4">
              <button
                onClick={() => setExpanded(expanded === s.key ? null : s.key)}
                className="text-xs text-zinc-400 hover:text-white transition"
              >
                {expanded === s.key ? '▼ Hide output' : '▶ Show output'} · Cost: ${results[s.key].costUsd.toFixed(4)}
              </button>
              {expanded === s.key && (
                <pre className="mt-2 max-h-96 overflow-auto rounded-lg bg-black/30 p-4 text-xs text-zinc-300 whitespace-pre-wrap">
                  {results[s.key].output}
                </pre>
              )}
            </div>
          )}
        </div>
      ))}

      {error && (
        <div className="rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</div>
      )}
    </div>
  );
}
