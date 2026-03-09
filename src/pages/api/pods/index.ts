import type { APIRoute } from 'astro';
import { hasSessionCookie } from '../../../lib/auth';
import { createPod, listPods, POD_CATALOG } from '../../../lib/pods';
import { isSupabaseConfigured } from '../../../lib/supabase';

export const GET: APIRoute = async ({ request }) => {
  if (!hasSessionCookie(request.headers.get('cookie'))) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  if (!isSupabaseConfigured()) {
    return new Response(JSON.stringify({ pods: [], configured: false, catalog: POD_CATALOG }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const pods = await listPods();

  return new Response(JSON.stringify({ pods, configured: true, catalog: POD_CATALOG }), {
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

  const { podType, name } = await request.json() as { podType: string; name: string };

  if (!podType || !name?.trim()) {
    return new Response(JSON.stringify({ error: 'podType and name are required' }), { status: 400 });
  }

  if (!POD_CATALOG[podType]) {
    return new Response(JSON.stringify({ error: `Unknown pod type: ${podType}` }), { status: 400 });
  }

  try {
    const pod = await createPod(podType, name.trim());
    return new Response(JSON.stringify({ pod }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
};
