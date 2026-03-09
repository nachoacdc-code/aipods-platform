import type { APIRoute } from 'astro';
import { hasSessionCookie } from '../../../lib/auth';
import { listEscalations, resolveEscalation, getEscalationCounts } from '../../../lib/escalations';

export const GET: APIRoute = async ({ request, url }) => {
  if (!hasSessionCookie(request.headers.get('cookie'))) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  const status = url.searchParams.get('status') ?? undefined;
  const [escalations, counts] = await Promise.all([
    listEscalations(status),
    getEscalationCounts(),
  ]);

  return new Response(JSON.stringify({ escalations, counts }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};

export const POST: APIRoute = async ({ request }) => {
  if (!hasSessionCookie(request.headers.get('cookie'))) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  const { id, resolution, notes } = await request.json() as {
    id: string;
    resolution: 'approved' | 'rejected' | 'modified';
    notes?: string;
  };

  if (!id || !resolution) {
    return new Response(JSON.stringify({ error: 'id and resolution are required' }), { status: 400 });
  }

  try {
    await resolveEscalation(id, resolution, notes);
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
};
