import { useState } from 'react';

const POD_CATALOG = [
  {
    type: 'lead_research',
    label: 'Lead Research',
    description: 'Find, qualify, and score leads for any vertical. Get outreach-ready lists with validated emails and personalized first lines.',
    icon: '🔍',
    color: 'from-blue-500/10 to-blue-600/5',
    border: 'border-blue-500/30',
    highlight: 'bg-blue-500/10',
    ready: true,
  },
  {
    type: 'marketing',
    label: 'Marketing',
    description: 'Content, SEO, social media, campaigns. Your full marketing team that knows your brand inside out.',
    icon: '📣',
    color: 'from-violet-500/10 to-violet-600/5',
    border: 'border-violet-500/30',
    highlight: 'bg-violet-500/10',
    ready: false,
  },
  {
    type: 'sales',
    label: 'Sales',
    description: 'Outreach, follow-ups, pipeline management. Close more deals with AI that remembers every conversation.',
    icon: '💼',
    color: 'from-emerald-500/10 to-emerald-600/5',
    border: 'border-emerald-500/30',
    highlight: 'bg-emerald-500/10',
    ready: false,
  },
  {
    type: 'ops',
    label: 'Ops',
    description: 'Workflows, documentation, process automation. Keep your business running like clockwork.',
    icon: '⚙️',
    color: 'from-amber-500/10 to-amber-600/5',
    border: 'border-amber-500/30',
    highlight: 'bg-amber-500/10',
    ready: false,
  },
  {
    type: 'creative',
    label: 'Creative',
    description: 'Design, copy, video, assets. A full creative department at a fraction of the cost.',
    icon: '🎨',
    color: 'from-pink-500/10 to-pink-600/5',
    border: 'border-pink-500/30',
    highlight: 'bg-pink-500/10',
    ready: false,
  },
  {
    type: 'research',
    label: 'Research',
    description: 'Market analysis, competitive intel, trend spotting. Deep research your team can act on.',
    icon: '📊',
    color: 'from-cyan-500/10 to-cyan-600/5',
    border: 'border-cyan-500/30',
    highlight: 'bg-cyan-500/10',
    ready: false,
  },
];

export default function PodCreator() {
  const [selected, setSelected] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  const handleCreate = async () => {
    if (!selected || !name.trim()) return;
    setCreating(true);
    setError('');

    try {
      const res = await fetch('/api/pods', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ podType: selected, name: name.trim() }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create pod');
      }

      const { pod } = await res.json();
      window.location.href = `/app/pods/${pod.id}`;
    } catch (err: any) {
      setError(err.message);
      setCreating(false);
    }
  };

  return (
    <div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {POD_CATALOG.map((pod) => (
          <button
            key={pod.type}
            onClick={() => pod.ready && setSelected(pod.type)}
            disabled={!pod.ready}
            className={`
              relative flex flex-col rounded-2xl border p-6 text-left transition
              ${selected === pod.type
                ? `${pod.border} ${pod.highlight}`
                : pod.ready
                  ? 'border-white/5 bg-white/[0.02] hover:border-white/15 hover:bg-white/[0.04]'
                  : 'border-white/5 bg-white/[0.01] opacity-50 cursor-not-allowed'
              }
            `}
          >
            {!pod.ready && (
              <span className="absolute top-3 right-3 rounded-full bg-zinc-800 px-2 py-0.5 text-[10px] text-zinc-500">
                Coming soon
              </span>
            )}
            <span className="mb-3 text-3xl">{pod.icon}</span>
            <h3 className="mb-1 text-base font-semibold text-white">{pod.label}</h3>
            <p className="text-sm leading-relaxed text-zinc-400">{pod.description}</p>
            {selected === pod.type && (
              <div className="mt-3 rounded-md bg-blue-500/20 px-2 py-1 text-center text-xs font-medium text-blue-300">
                Selected
              </div>
            )}
          </button>
        ))}
      </div>

      {selected && (
        <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.02] p-8">
          <h3 className="mb-4 text-lg font-semibold text-white">
            Name your {POD_CATALOG.find((p) => p.type === selected)?.label} Pod
          </h3>
          <div className="flex gap-4">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={`e.g. "Q1 SaaS Leads" or "EU Market Research"`}
              className="flex-1 rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-zinc-600 outline-none transition focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30"
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            />
            <button
              onClick={handleCreate}
              disabled={!name.trim() || creating}
              className="shrink-0 rounded-lg bg-blue-600 px-8 py-3 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {creating ? 'Deploying...' : 'Deploy Pod →'}
            </button>
          </div>
          {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
          <p className="mt-4 text-xs text-zinc-600">Your pod will be ready in seconds with all default modules pre-loaded.</p>
        </div>
      )}
    </div>
  );
}
