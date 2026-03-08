import { useState } from 'react';

interface Document {
  id: string;
  file_name: string;
  file_type: string;
  file_size: number;
  status: string;
  chunk_count: number;
  created_at: string;
}

interface Props {
  documents: Document[];
  onDelete?: (id: string) => void;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const FILE_ICONS: Record<string, string> = {
  'application/pdf': '📕',
  'text/plain': '📝',
  'text/csv': '📊',
  'text/markdown': '📝',
  'application/json': '🔧',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '📘',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '📗',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': '📙',
};

const STATUS_COLORS: Record<string, string> = {
  uploaded: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
  processing: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  ready: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  error: 'text-red-400 bg-red-500/10 border-red-500/20',
};

export default function DocumentList({ documents, onDelete }: Props) {
  const [deleting, setDeleting] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this document? This cannot be undone.')) return;

    setDeleting(id);
    try {
      const res = await fetch('/api/knowledge/documents', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (res.ok) onDelete?.(id);
    } finally {
      setDeleting(null);
    }
  };

  if (documents.length === 0) {
    return (
      <div className="flex items-center justify-center rounded-xl border border-dashed border-white/10 py-12 text-sm text-zinc-600">
        No documents uploaded yet
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {documents.map((doc) => (
        <div
          key={doc.id}
          className="group flex items-center gap-4 rounded-xl border border-white/5 bg-white/[0.02] px-5 py-4 transition hover:border-white/10"
        >
          <span className="text-xl shrink-0">
            {FILE_ICONS[doc.file_type] ?? '📄'}
          </span>

          <div className="flex-1 min-w-0">
            <p className="truncate text-sm font-medium text-zinc-200">{doc.file_name}</p>
            <p className="text-xs text-zinc-600">
              {formatSize(doc.file_size)} · {formatDate(doc.created_at)}
              {doc.chunk_count > 0 && ` · ${doc.chunk_count} chunks`}
            </p>
          </div>

          <span className={`shrink-0 rounded-md border px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wide ${STATUS_COLORS[doc.status] ?? 'text-zinc-400 bg-zinc-500/10 border-zinc-500/20'}`}>
            {doc.status}
          </span>

          <button
            onClick={() => handleDelete(doc.id)}
            disabled={deleting === doc.id}
            className="shrink-0 rounded-lg p-1.5 text-xs text-zinc-600 opacity-0 transition hover:bg-red-500/10 hover:text-red-400 group-hover:opacity-100 disabled:opacity-50"
            title="Delete document"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}
