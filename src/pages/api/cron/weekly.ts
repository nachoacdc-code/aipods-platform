import type { APIRoute } from 'astro';
import { runScheduledAgent } from '../../../lib/agents/scheduler';

export const GET: APIRoute = async ({ request }) => {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${import.meta.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  const results: Record<string, { output_length: number; costUsd: number; error?: string }> = {};

  for (const key of ['ceo_weekly', 'model_scout', 'marketing_content', 'finance_weekly'] as const) {
    try {
      const r = await runScheduledAgent(key);
      results[key] = { output_length: r.output.length, costUsd: r.costUsd };
    } catch (err: any) {
      results[key] = { output_length: 0, costUsd: 0, error: err.message };
    }
  }

  return new Response(JSON.stringify({ ran: 'weekly', results }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
