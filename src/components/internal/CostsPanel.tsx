import { useState, useEffect } from 'react';

interface AgentCost { agent: string; cost: number; runs: number; tokens: number }
interface ModelCost { model: string; cost: number; runs: number; tokens: number }
interface DayCost { day: string; cost: number; runs: number }

export default function CostsPanel() {
  const [totals, setTotals] = useState({ cost: 0, runs: 0, tokens: 0 });
  const [byAgent, setByAgent] = useState<AgentCost[]>([]);
  const [byModel, setByModel] = useState<ModelCost[]>([]);
  const [byDay, setByDay] = useState<DayCost[]>([]);
  const [days, setDays] = useState(30);
  const [configured, setConfigured] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/internal/costs?days=${days}`)
      .then((r) => r.json())
      .then((data) => {
        setConfigured(data.configured ?? false);
        setTotals(data.totals ?? { cost: 0, runs: 0, tokens: 0 });
        setByAgent(data.byAgent ?? []);
        setByModel(data.byModel ?? []);
        setByDay(data.byDay ?? []);
      })
      .catch(() => setConfigured(false))
      .finally(() => setLoading(false));
  }, [days]);

  if (loading) return <div className="flex items-center justify-center py-24 text-sm text-zinc-500">Loading...</div>;

  if (!configured) {
    return (
      <div className="rounded-2xl border border-yellow-500/20 bg-yellow-500/5 p-8 text-center">
        <p className="text-sm text-yellow-300">Connect Supabase to see cost data.</p>
      </div>
    );
  }

  const maxDayCost = Math.max(...byDay.map((d) => d.cost), 0.001);

  return (
    <div>
      {/* Period Selector */}
      <div className="mb-6 flex gap-2">
        {[7, 14, 30].map((d) => (
          <button key={d} onClick={() => setDays(d)}
            className={`rounded-lg px-4 py-2 text-xs font-medium transition ${days === d ? 'bg-amber-500/10 text-amber-300' : 'bg-white/5 text-zinc-400 hover:text-white'}`}>
            {d} days
          </button>
        ))}
      </div>

      {/* Summary */}
      <div className="mb-8 grid grid-cols-3 gap-4">
        <div className="rounded-xl border border-white/5 bg-white/[0.02] p-5">
          <p className="text-2xl font-bold text-amber-400">${totals.cost.toFixed(4)}</p>
          <p className="mt-1 text-xs text-zinc-500">Total API Cost</p>
        </div>
        <div className="rounded-xl border border-white/5 bg-white/[0.02] p-5">
          <p className="text-2xl font-bold text-blue-400">{totals.runs}</p>
          <p className="mt-1 text-xs text-zinc-500">Total Runs</p>
        </div>
        <div className="rounded-xl border border-white/5 bg-white/[0.02] p-5">
          <p className="text-2xl font-bold text-violet-400">{(totals.tokens / 1000).toFixed(1)}k</p>
          <p className="mt-1 text-xs text-zinc-500">Total Tokens</p>
        </div>
      </div>

      {/* Daily Chart (bar chart using divs) */}
      {byDay.length > 0 && (
        <div className="mb-8 rounded-2xl border border-white/5 bg-white/[0.02] p-6">
          <h3 className="mb-4 text-sm font-semibold text-zinc-300">Daily Spend</h3>
          <div className="flex items-end gap-1" style={{ height: '120px' }}>
            {byDay.map((d) => (
              <div key={d.day} className="group relative flex-1" title={`${d.day}: $${d.cost.toFixed(4)} (${d.runs} runs)`}>
                <div
                  className="w-full rounded-t bg-amber-500/60 transition group-hover:bg-amber-400"
                  style={{ height: `${Math.max((d.cost / maxDayCost) * 100, 2)}%` }}
                />
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 hidden group-hover:block whitespace-nowrap rounded bg-zinc-800 px-2 py-1 text-[9px] text-zinc-300 shadow-lg">
                  {d.day}: ${d.cost.toFixed(4)}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-2 flex justify-between text-[9px] text-zinc-600">
            <span>{byDay[0]?.day}</span>
            <span>{byDay[byDay.length - 1]?.day}</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* By Agent */}
        <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-6">
          <h3 className="mb-4 text-sm font-semibold text-zinc-300">Cost by Agent</h3>
          {byAgent.length === 0 ? (
            <p className="text-xs text-zinc-600">No data yet.</p>
          ) : (
            <div className="space-y-2">
              {byAgent.map((a) => (
                <div key={a.agent} className="flex items-center justify-between rounded-lg bg-white/[0.02] px-3 py-2">
                  <div>
                    <p className="text-xs font-medium text-zinc-200">{a.agent}</p>
                    <p className="text-[10px] text-zinc-600">{a.runs} runs · {(a.tokens / 1000).toFixed(1)}k tokens</p>
                  </div>
                  <span className="font-mono text-xs text-amber-400">${a.cost.toFixed(4)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* By Model */}
        <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-6">
          <h3 className="mb-4 text-sm font-semibold text-zinc-300">Cost by Model</h3>
          {byModel.length === 0 ? (
            <p className="text-xs text-zinc-600">No data yet.</p>
          ) : (
            <div className="space-y-2">
              {byModel.map((m) => (
                <div key={m.model} className="flex items-center justify-between rounded-lg bg-white/[0.02] px-3 py-2">
                  <div>
                    <p className="text-xs font-medium text-zinc-200">{m.model}</p>
                    <p className="text-[10px] text-zinc-600">{m.runs} runs · avg ${(m.cost / Math.max(m.runs, 1)).toFixed(4)}/run</p>
                  </div>
                  <span className="font-mono text-xs text-amber-400">${m.cost.toFixed(4)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
