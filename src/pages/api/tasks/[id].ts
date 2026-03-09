import type { APIRoute } from 'astro';
import { hasSessionCookie } from '../../../lib/auth';
import { getTask } from '../../../lib/tasks';
import { isSupabaseConfigured } from '../../../lib/supabase';

export const GET: APIRoute = async ({ params, request }) => {
  if (!hasSessionCookie(request.headers.get('cookie'))) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  if (!isSupabaseConfigured()) {
    return new Response(JSON.stringify({ error: 'Supabase not configured' }), { status: 503 });
  }

  const taskId = params.id;
  if (!taskId) {
    return new Response(JSON.stringify({ error: 'Task ID required' }), { status: 400 });
  }

  const task = await getTask(taskId);
  if (!task) {
    return new Response(JSON.stringify({ error: 'Task not found' }), { status: 404 });
  }

  return new Response(JSON.stringify({ task }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
