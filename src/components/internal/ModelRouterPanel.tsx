import { useState, useEffect } from 'react';

interface Assignment {
  agent: string;
  primary: string;
  fallback: string;
  isOverridden: boolean;
}

interface LogEntry {
  id: string;
  agent_type: string;
  old_model: string;
  new_model: string;
  reason: string;
  created_at: string;
}

export default function ModelRouterPanel() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [models, setModels] = useState<string[]>([]);
  const [upgradeLog, setUpgradeLog] = useState<LogEntry[]>([]);
  const [editing, setEditing] = useState<string | null>(null);
  const [editPrimary, setEditPrimary] = useState('');
  const [editFallback, setEditFallback] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchData = () => {
    fetch('/api/internal/model-router')
      .then((r) => r.json())
      .then((data) => {
        setAssignments(data.assignments ?? []);
        setModels(data.availableModels ?? []);
        setUpgradeLog(data.upgradeLog ?? []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const startEdit = (a: Assignment) => {
    setEditing(a.agent);
    setEditPrimary(a.primary);
    setEditFallback(a.fallback);
  };

  const saveOverride = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      await fetch('/api/internal/model-router', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agent: editing, primary: editPrimary, fallback: editFallback }),
      });
      fetchData();
      setEditing(null);
    } catch { /* silent */ }
    finally { setSaving(false); }
  };

  if (loading) return <div className="flex items-center justify-center py-24 text-sm text-zinc-500">Loading...</div>;

  return (
    <div>
      {/* Assignments Table */}
      <div className="mb-8 rounded-2xl border border-white/5 bg-white/[0.02] overflow-hidden">
        <div className="grid grid-cols-[1fr_1fr_1fr_auto] gap-4 border-b border-white/5 px-6 py-3 text-xs font-medium text-zinc-500">
          <span>Agent</span>
          <span>Primary Model</span>
          <span>Fallback Model</span>
          <span></span>
        </div>

        {assignments.map((a) => (
          <div key={a.agent} className="grid grid-cols-[1fr_1fr_1fr_auto] gap-4 border-b border-white/[0.03] px-6 py-3 items-center">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-zinc-200">{a.agent}</span>
              {a.isOverridden && (
                <span className="rounded bg-amber-500/10 px-1.5 py-0.5 text-[9px] font-medium text-amber-400">overridden</span>
              )}
            </div>

            {editing === a.agent ? (
              <>
                <select value={editPrimary} onChange={(e) => setEditPrimary(e.target.value)}
                  className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white outline-none">
                  {models.map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
                <select value={editFallback} onChange={(e) => setEditFallback(e.target.value)}
                  className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white outline-none">
                  {models.map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
                <div className="flex gap-1">
                  <button onClick={saveOverride} disabled={saving}
                    className="rounded bg-emerald-600 px-3 py-1 text-[10px] font-medium text-white hover:bg-emerald-500 disabled:opacity-50">
                    {saving ? '...' : 'Save'}
                  </button>
                  <button onClick={() => setEditing(null)}
                    className="rounded bg-white/10 px-3 py-1 text-[10px] font-medium text-zinc-400 hover:text-white">
                    Cancel
                  </button>
                </div>
              </>
            ) : (
              <>
                <span className="font-mono text-xs text-zinc-300">{a.primary}</span>
                <span className="font-mono text-xs text-zinc-500">{a.fallback}</span>
                <button onClick={() => startEdit(a)}
                  className="rounded bg-white/5 px-3 py-1 text-[10px] font-medium text-zinc-400 transition hover:bg-white/10 hover:text-white">
                  Override
                </button>
              </>
            )}
          </div>
        ))}
      </div>

      {/* Upgrade Log */}
      <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-6">
        <h3 className="mb-4 text-sm font-semibold text-zinc-300">Model Change Log</h3>
        {upgradeLog.length === 0 ? (
          <p className="text-xs text-zinc-600">No model changes recorded yet.</p>
        ) : (
          <div className="space-y-2">
            {upgradeLog.map((entry) => (
              <div key={entry.id} className="flex items-center justify-between rounded-lg bg-white/[0.02] px-3 py-2">
                <div>
                  <p className="text-xs text-zinc-200">
                    <span className="font-medium">{entry.agent_type}</span>
                    {' '}<span className="text-zinc-600">→</span>{' '}
                    <span className="font-mono text-amber-400">{entry.new_model}</span>
                  </p>
                  <p className="text-[10px] text-zinc-600">{entry.reason}</p>
                </div>
                <span className="text-[10px] text-zinc-600">{new Date(entry.created_at).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
