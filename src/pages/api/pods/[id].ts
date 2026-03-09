import type { APIRoute } from 'astro';
import { hasSessionCookie } from '../../../lib/auth';
import { getPod, getRecentTasks } from '../../../lib/pods';
import { isSupabaseConfigured } from '../../../lib/supabase';

export const GET: APIRoute = async ({ params, request }) => {
  if (!hasSessionCookie(request.headers.get('cookie'))) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  if (!isSupabaseConfigured()) {
    return new Response(JSON.stringify({ error: 'Supabase not configured' }), { status: 503 });
  }

  const podId = params.id;
  if (!podId) {
    return new Response(JSON.stringify({ error: 'Pod ID required' }), { status: 400 });
  }

  const pod = await getPod(podId);
  if (!pod) {
    return new Response(JSON.stringify({ error: 'Pod not found' }), { status: 404 });
  }

  const tasks = await getRecentTasks(podId, 20);

  return new Response(JSON.stringify({ pod, tasks }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
