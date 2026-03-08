-- AIpods Knowledge Center schema
-- MVP: single-tenant (founder only), per-client isolation deferred to commercial phase

-- Enable pgvector for embedding storage
create extension if not exists vector with schema extensions;

-- ─── Documents ───────────────────────────────────────────────────────────────
-- Metadata for every uploaded file. The actual encrypted blob lives in Supabase Storage.
create table if not exists knowledge_documents (
  id            uuid primary key default gen_random_uuid(),
  file_name     text not null,
  file_type     text not null,                       -- MIME type
  file_size     bigint not null default 0,           -- bytes (original, pre-encryption)
  storage_path  text not null,                       -- path in Supabase Storage bucket
  status        text not null default 'uploaded'     -- uploaded | processing | ready | error
    check (status in ('uploaded', 'processing', 'ready', 'error')),
  chunk_count   int not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ─── Chunks ──────────────────────────────────────────────────────────────────
-- Each document is split into chunks for vector search.
-- Content is stored encrypted; the embedding is generated from a server-side
-- decrypted pass (or from plaintext before encryption on the client in MVP).
create table if not exists knowledge_chunks (
  id            uuid primary key default gen_random_uuid(),
  document_id   uuid not null references knowledge_documents(id) on delete cascade,
  chunk_index   int not null,
  content       text not null,                       -- chunk text (encrypted or plaintext for MVP)
  embedding     vector(1536),                        -- OpenAI-compatible dimensions; nullable until embeddings are generated
  token_count   int not null default 0,
  created_at    timestamptz not null default now()
);

create index if not exists idx_chunks_document on knowledge_chunks(document_id);
create index if not exists idx_chunks_embedding on knowledge_chunks
  using ivfflat (embedding vector_cosine_ops) with (lists = 100);

-- ─── Quick Notes ─────────────────────────────────────────────────────────────
-- Free-form text snippets: "Our audience hates long emails", etc.
create table if not exists knowledge_notes (
  id            uuid primary key default gen_random_uuid(),
  content       text not null,
  embedding     vector(1536),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ─── Audit Log ───────────────────────────────────────────────────────────────
-- Immutable record of every knowledge access (who/what accessed, when, why)
create table if not exists knowledge_audit_log (
  id            uuid primary key default gen_random_uuid(),
  action        text not null,                       -- upload | delete | query | note_add | note_delete
  target_type   text not null,                       -- document | chunk | note
  target_id     uuid,
  metadata      jsonb default '{}',
  created_at    timestamptz not null default now()
);

create index if not exists idx_audit_created on knowledge_audit_log(created_at desc);

-- ─── Storage bucket ──────────────────────────────────────────────────────────
-- Create a private bucket for encrypted document blobs
insert into storage.buckets (id, name, public)
values ('knowledge-files', 'knowledge-files', false)
on conflict (id) do nothing;

-- ─── Updated-at trigger ─────────────────────────────────────────────────────
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_documents_updated
  before update on knowledge_documents
  for each row execute function update_updated_at();

create trigger trg_notes_updated
  before update on knowledge_notes
  for each row execute function update_updated_at();
