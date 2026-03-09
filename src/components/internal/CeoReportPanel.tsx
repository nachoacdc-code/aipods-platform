import { useState, useEffect } from 'react';

interface CeoReport {
  id: string;
  report_type: string;
  content: string;
  metrics_json: Record<string, unknown>;
  created_at: string;
}

export default function CeoReportPanel() {
  const [reports, setReports] = useState<CeoReport[]>([]);
  const [filter, setFilter] = useState<string>('weekly');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    const params = filter ? `?type=${filter}&limit=20` : '?limit=20';
    fetch(`/api/agents/ceo-report${params}`)
      .then((r) => r.json())
      .then((data) => {
        setReports(data.reports ?? []);
        if (data.reports?.length > 0) setExpanded(data.reports[0].id);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [filter]);

  const generateReport = async (type: 'ceo_weekly' | 'ceo_daily') => {
    setGenerating(true);
    try {
      const res = await fetch('/api/agents/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: type }),
      });
      if (res.ok) {
        const params = filter ? `?type=${filter}&limit=20` : '?limit=20';
        const refreshRes = await fetch(`/api/agents/ceo-report${params}`);
        const data = await refreshRes.json();
        setReports(data.reports ?? []);
        if (data.reports?.length > 0) setExpanded(data.reports[0].id);
      }
    } catch { /* silent */ }
    finally { setGenerating(false); }
  };

  if (loading) return <div className="flex items-center justify-center py-24 text-sm text-zinc-500">Loading...</div>;

  return (
    <div>
      {/* Controls */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex gap-2">
          {[
            { key: 'weekly', label: 'Weekly Reports' },
            { key: 'daily', label: 'Daily Checks' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => { setFilter(tab.key); setLoading(true); }}
              className={`rounded-lg px-4 py-2 text-xs font-medium transition ${
                filter === tab.key ? 'bg-blue-500/10 text-blue-300' : 'bg-white/5 text-zinc-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => generateReport('ceo_weekly')}
            disabled={generating}
            className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-medium text-white transition hover:bg-blue-500 disabled:opacity-50"
          >
            {generating ? 'Generating...' : 'Generate Weekly Report'}
          </button>
          <button
            onClick={() => generateReport('ceo_daily')}
            disabled={generating}
            className="rounded-lg bg-white/10 px-4 py-2 text-xs font-medium text-white transition hover:bg-white/20 disabled:opacity-50"
          >
            Quick Daily Check
          </button>
        </div>
      </div>

      {/* Report List */}
      {reports.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 py-16 text-center">
          <p className="text-sm text-zinc-600">No {filter} reports yet.</p>
          <p className="mt-1 text-xs text-zinc-700">Generate one using the button above.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reports.map((r) => (
            <div key={r.id} className="rounded-2xl border border-white/5 bg-white/[0.02]">
              <button
                onClick={() => setExpanded(expanded === r.id ? null : r.id)}
                className="flex w-full items-center justify-between px-6 py-4 text-left"
              >
                <div>
                  <p className="text-sm font-medium text-zinc-200">
                    {r.report_type === 'weekly' ? '📊 Weekly CEO Report' : '⚡ Daily Check'}
                  </p>
                  <p className="text-xs text-zinc-600">{new Date(r.created_at).toLocaleString()}</p>
                </div>
                <span className="text-xs text-zinc-600">{expanded === r.id ? '▲' : '▼'}</span>
              </button>

              {expanded === r.id && (
                <div className="border-t border-white/5 px-6 py-5">
                  <div className="prose prose-invert prose-sm max-w-none">
                    <pre className="whitespace-pre-wrap rounded-lg bg-black/20 p-5 text-xs leading-relaxed text-zinc-300">
                      {r.content}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
