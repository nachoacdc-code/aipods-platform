import type { APIRoute } from 'astro';
import { hasSessionCookie } from '../../../lib/auth';
import { getSupabaseServiceClient, isSupabaseConfigured } from '../../../lib/supabase';

export const GET: APIRoute = async ({ request }) => {
  if (!hasSessionCookie(request.headers.get('cookie'))) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  if (!isSupabaseConfigured()) {
    return new Response(JSON.stringify({ documents: [], configured: false }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const supabase = getSupabaseServiceClient();

  const { data, error } = await supabase
    .from('knowledge_documents')
    .select('id, file_name, file_type, file_size, status, chunk_count, created_at, updated_at')
    .order('created_at', { ascending: false });

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  return new Response(JSON.stringify({ documents: data, configured: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};

export const DELETE: APIRoute = async ({ request }) => {
  if (!hasSessionCookie(request.headers.get('cookie'))) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  if (!isSupabaseConfigured()) {
    return new Response(JSON.stringify({ error: 'Supabase not configured' }), { status: 503 });
  }

  const { id } = await request.json() as { id: string };
  if (!id) {
    return new Response(JSON.stringify({ error: 'Missing document id' }), { status: 400 });
  }

  const supabase = getSupabaseServiceClient();

  const { data: doc } = await supabase
    .from('knowledge_documents')
    .select('storage_path')
    .eq('id', id)
    .single();

  if (doc?.storage_path) {
    await supabase.storage.from('knowledge-files').remove([doc.storage_path]);
  }

  const { error } = await supabase
    .from('knowledge_documents')
    .delete()
    .eq('id', id);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  await supabase.from('knowledge_audit_log').insert({
    action: 'delete',
    target_type: 'document',
    target_id: id,
  });

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
