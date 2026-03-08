import { useState } from 'react';

interface Note {
  id: string;
  content: string;
  created_at: string;
}

interface Props {
  notes: Note[];
  onNoteAdded?: () => void;
  onNoteDeleted?: (id: string) => void;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export default function QuickNotes({ notes, onNoteAdded, onNoteDeleted }: Props) {
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || saving) return;

    setSaving(true);
    try {
      const res = await fetch('/api/knowledge/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: content.trim() }),
      });
      if (res.ok) {
        setContent('');
        onNoteAdded?.();
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeleting(id);
    try {
      const res = await fetch('/api/knowledge/notes', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (res.ok) onNoteDeleted?.(id);
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div>
      <form onSubmit={handleSubmit} className="mb-4">
        <div className="flex gap-3">
          <input
            type="text"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder='e.g. "Our audience hates long emails" or "Always use this CTA"'
            className="flex-1 rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-zinc-600 outline-none transition focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30"
          />
          <button
            type="submit"
            disabled={!content.trim() || saving}
            className="shrink-0 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving...' : 'Add Note'}
          </button>
        </div>
      </form>

      {notes.length === 0 ? (
        <p className="py-6 text-center text-sm text-zinc-600">
          No notes yet. Add quick instructions or context for your pods.
        </p>
      ) : (
        <div className="space-y-2">
          {notes.map((note) => (
            <div
              key={note.id}
              className="group flex items-start gap-3 rounded-xl border border-white/5 bg-white/[0.02] px-4 py-3 transition hover:border-white/10"
            >
              <span className="mt-0.5 text-sm shrink-0">💡</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-zinc-300">{note.content}</p>
                <p className="mt-1 text-xs text-zinc-700">{timeAgo(note.created_at)}</p>
              </div>
              <button
                onClick={() => handleDelete(note.id)}
                disabled={deleting === note.id}
                className="shrink-0 rounded-lg p-1 text-xs text-zinc-600 opacity-0 transition hover:bg-red-500/10 hover:text-red-400 group-hover:opacity-100 disabled:opacity-50"
                title="Delete note"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
