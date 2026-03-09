import type { APIRoute } from 'astro';
import { hasSessionCookie } from '../../../lib/auth';
import { runScheduledAgent, SCHEDULE_CONFIG, type ScheduleKey } from '../../../lib/agents/scheduler';

export const GET: APIRoute = async () => {
  return new Response(JSON.stringify({
    available: SCHEDULE_CONFIG.map((s) => ({
      key: s.key,
      label: s.label,
      description: s.description,
      frequency: s.frequency,
    })),
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};

export const POST: APIRoute = async ({ request }) => {
  if (!hasSessionCookie(request.headers.get('cookie'))) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  const { key } = await request.json() as { key: string };
  const validKeys = SCHEDULE_CONFIG.map((s) => s.key);

  if (!key || !validKeys.includes(key as ScheduleKey)) {
    return new Response(JSON.stringify({ error: `Invalid key. Valid: ${validKeys.join(', ')}` }), { status: 400 });
  }

  try {
    const result = await runScheduledAgent(key as ScheduleKey);
    return new Response(JSON.stringify({ key, output: result.output, costUsd: result.costUsd }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
};
