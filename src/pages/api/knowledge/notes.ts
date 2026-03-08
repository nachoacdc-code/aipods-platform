import type { APIRoute } from 'astro';
import { hasSessionCookie } from '../../../lib/auth';
import { getSupabaseServiceClient, isSupabaseConfigured } from '../../../lib/supabase';

export const GET: APIRoute = async ({ request }) => {
  if (!hasSessionCookie(request.headers.get('cookie'))) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  if (!isSupabaseConfigured()) {
    return new Response(JSON.stringify({ notes: [], configured: false }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const supabase = getSupabaseServiceClient();

  const { data, error } = await supabase
    .from('knowledge_notes')
    .select('id, content, created_at, updated_at')
    .order('created_at', { ascending: false });

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  return new Response(JSON.stringify({ notes: data, configured: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};

export const POST: APIRoute = async ({ request }) => {
  if (!hasSessionCookie(request.headers.get('cookie'))) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  if (!isSupabaseConfigured()) {
    return new Response(JSON.stringify({ error: 'Supabase not configured' }), { status: 503 });
  }

  const { content } = await request.json() as { content: string };
  if (!content?.trim()) {
    return new Response(JSON.stringify({ error: 'Note content is required' }), { status: 400 });
  }

  const supabase = getSupabaseServiceClient();

  const { data: note, error } = await supabase
    .from('knowledge_notes')
    .insert({ content: content.trim() })
    .select()
    .single();

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  await supabase.from('knowledge_audit_log').insert({
    action: 'note_add',
    target_type: 'note',
    target_id: note.id,
  });

  return new Response(JSON.stringify({ note }), {
    status: 201,
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
    return new Response(JSON.stringify({ error: 'Missing note id' }), { status: 400 });
  }

  const supabase = getSupabaseServiceClient();

  const { error } = await supabase
    .from('knowledge_notes')
    .delete()
    .eq('id', id);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  await supabase.from('knowledge_audit_log').insert({
    action: 'note_delete',
    target_type: 'note',
    target_id: id,
  });

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
