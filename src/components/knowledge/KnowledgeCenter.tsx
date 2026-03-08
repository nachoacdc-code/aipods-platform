import { useState, useEffect, useCallback } from 'react';
import FileUpload from './FileUpload';
import DocumentList from './DocumentList';
import QuickNotes from './QuickNotes';

type Tab = 'documents' | 'notes';

interface Document {
  id: string;
  file_name: string;
  file_type: string;
  file_size: number;
  status: string;
  chunk_count: number;
  created_at: string;
}

interface Note {
  id: string;
  content: string;
  created_at: string;
}

export default function KnowledgeCenter() {
  const [tab, setTab] = useState<Tab>('documents');
  const [documents, setDocuments] = useState<Document[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchDocuments = useCallback(async () => {
    try {
      const res = await fetch('/api/knowledge/documents');
      const data = await res.json();
      setDocuments(data.documents ?? []);
      setConfigured(data.configured ?? false);
    } catch {
      setConfigured(false);
    }
  }, []);

  const fetchNotes = useCallback(async () => {
    try {
      const res = await fetch('/api/knowledge/notes');
      const data = await res.json();
      setNotes(data.notes ?? []);
    } catch {
      // silent
    }
  }, []);

  useEffect(() => {
    Promise.all([fetchDocuments(), fetchNotes()]).finally(() => setLoading(false));
  }, [fetchDocuments, fetchNotes]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-sm text-zinc-500">
        Loading Knowledge Center...
      </div>
    );
  }

  if (configured === false) {
    return (
      <div className="rounded-2xl border border-yellow-500/20 bg-yellow-500/5 p-8 text-center">
        <p className="mb-2 text-lg font-semibold text-yellow-300">Supabase not connected</p>
        <p className="text-sm text-zinc-400">
          Set <code className="rounded bg-white/5 px-1.5 py-0.5 text-xs text-yellow-300">PUBLIC_SUPABASE_URL</code>,{' '}
          <code className="rounded bg-white/5 px-1.5 py-0.5 text-xs text-yellow-300">PUBLIC_SUPABASE_ANON_KEY</code>, and{' '}
          <code className="rounded bg-white/5 px-1.5 py-0.5 text-xs text-yellow-300">SUPABASE_SERVICE_ROLE_KEY</code>{' '}
          in your environment variables, then run the migration in{' '}
          <code className="rounded bg-white/5 px-1.5 py-0.5 text-xs text-yellow-300">supabase/migrations/001_knowledge_center.sql</code>.
        </p>
      </div>
    );
  }

  const totalSize = documents.reduce((sum, d) => sum + d.file_size, 0);
  const readyCount = documents.filter((d) => d.status === 'ready').length;

  return (
    <div>
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-4">
        {[
          { label: 'Documents', value: String(documents.length), sub: 'uploaded' },
          { label: 'Quick Notes', value: String(notes.length), sub: 'saved' },
          { label: 'Total Size', value: totalSize > 0 ? `${(totalSize / (1024 * 1024)).toFixed(1)} MB` : '—', sub: 'original size' },
          { label: 'Ready for Pods', value: String(readyCount), sub: documents.length > 0 ? `of ${documents.length}` : 'upload to start' },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl border border-white/5 bg-white/[0.02] p-5">
            <p className="text-2xl font-bold text-white">{stat.value}</p>
            <p className="mt-1 text-xs font-medium text-zinc-400">{stat.label}</p>
            <p className="text-xs text-zinc-600">{stat.sub}</p>
          </div>
        ))}
      </div>

      <FileUpload onUploadComplete={fetchDocuments} />

      <div className="mt-10 flex gap-1 border-b border-white/5">
        {(['documents', 'notes'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-5 py-2.5 text-sm font-medium transition ${
              tab === t
                ? 'border-b-2 border-blue-500 text-white'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            {t === 'documents' ? `Documents (${documents.length})` : `Quick Notes (${notes.length})`}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {tab === 'documents' ? (
          <DocumentList
            documents={documents}
            onDelete={(id) => setDocuments((prev) => prev.filter((d) => d.id !== id))}
          />
        ) : (
          <QuickNotes
            notes={notes}
            onNoteAdded={fetchNotes}
            onNoteDeleted={(id) => setNotes((prev) => prev.filter((n) => n.id !== id))}
          />
        )}
      </div>
    </div>
  );
}
