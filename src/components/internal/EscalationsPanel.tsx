import { useState, useEffect, useCallback } from 'react';

interface Escalation {
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

interface Counts {
  pending: number;
  approved: number;
  rejected: number;
}

const SEVERITY_STYLE: Record<string, string> = {
  critical: 'bg-red-500/10 text-red-400 border-red-500/20',
  high: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  medium: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  low: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
};

const STATUS_STYLE: Record<string, string> = {
  pending: 'bg-yellow-500/10 text-yellow-400',
  approved: 'bg-emerald-500/10 text-emerald-400',
  rejected: 'bg-red-500/10 text-red-400',
  modified: 'bg-blue-500/10 text-blue-400',
};

export default function EscalationsPanel() {
  const [escalations, setEscalations] = useState<Escalation[]>([]);
  const [counts, setCounts] = useState<Counts>({ pending: 0, approved: 0, rejected: 0 });
  const [filter, setFilter] = useState<string>('pending');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [resolving, setResolving] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchEscalations = useCallback(async () => {
    const params = filter ? `?status=${filter}` : '';
    const res = await fetch(`/api/escalations${params}`);
    const data = await res.json();
    setEscalations(data.escalations ?? []);
    setCounts(data.counts ?? { pending: 0, approved: 0, rejected: 0 });
    setLoading(false);
  }, [filter]);

  useEffect(() => { fetchEscalations(); }, [fetchEscalations]);

  const resolve = async (id: string, resolution: 'approved' | 'rejected' | 'modified', notes?: string) => {
    setResolving(id);
    try {
      await fetch('/api/escalations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, resolution, notes }),
      });
      await fetchEscalations();
    } catch { /* silent */ }
    finally { setResolving(null); }
  };

  if (loading) return <div className="flex items-center justify-center py-24 text-sm text-zinc-500">Loading...</div>;

  return (
    <div>
      {/* Filter Tabs */}
      <div className="mb-6 flex gap-2">
        {[
          { key: 'pending', label: `Pending (${counts.pending})` },
          { key: 'approved', label: `Approved (${counts.approved})` },
          { key: 'rejected', label: `Rejected (${counts.rejected})` },
          { key: '', label: 'All' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`rounded-lg px-4 py-2 text-xs font-medium transition ${
              filter === tab.key ? 'bg-amber-500/10 text-amber-300' : 'bg-white/5 text-zinc-400 hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Escalation List */}
      {escalations.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 py-16 text-center text-sm text-zinc-600">
          {filter === 'pending' ? 'No pending escalations — all clear.' : 'No escalations found.'}
        </div>
      ) : (
        <div className="space-y-3">
          {escalations.map((e) => (
            <div key={e.id} className="rounded-2xl border border-white/5 bg-white/[0.02]">
              <button
                onClick={() => setExpanded(expanded === e.id ? null : e.id)}
                className="flex w-full items-center gap-4 px-6 py-4 text-left"
              >
                <span className={`shrink-0 rounded-full border px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wide ${SEVERITY_STYLE[e.severity] ?? SEVERITY_STYLE.medium}`}>
                  {e.severity}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-medium text-zinc-200">{e.title}</p>
                  <p className="text-xs text-zinc-600">{e.agent_type} · {new Date(e.created_at).toLocaleString()}</p>
                </div>
                <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-medium uppercase ${STATUS_STYLE[e.status] ?? ''}`}>
                  {e.status}
                </span>
              </button>

              {expanded === e.id && (
                <div className="border-t border-white/5 px-6 py-4">
                  <p className="mb-3 text-sm text-zinc-300">{e.description}</p>

                  {e.context_json && Object.keys(e.context_json).length > 0 && (
                    <pre className="mb-4 max-h-48 overflow-auto rounded-lg bg-black/30 p-3 text-xs text-zinc-400">
                      {JSON.stringify(e.context_json, null, 2)}
                    </pre>
                  )}

                  {e.resolution && (
                    <p className="mb-3 text-xs text-zinc-500">Resolution: {e.resolution}</p>
                  )}

                  {e.status === 'pending' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => resolve(e.id, 'approved')}
                        disabled={resolving === e.id}
                        className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-medium text-white transition hover:bg-emerald-500 disabled:opacity-50"
                      >
                        ✓ Approve
                      </button>
                      <button
                        onClick={() => resolve(e.id, 'rejected')}
                        disabled={resolving === e.id}
                        className="rounded-lg bg-red-600 px-4 py-2 text-xs font-medium text-white transition hover:bg-red-500 disabled:opacity-50"
                      >
                        ✗ Reject
                      </button>
                      <button
                        onClick={() => {
                          const notes = prompt('Modification notes:');
                          if (notes) resolve(e.id, 'modified', notes);
                        }}
                        disabled={resolving === e.id}
                        className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-medium text-white transition hover:bg-blue-500 disabled:opacity-50"
                      >
                        ✎ Modify
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
