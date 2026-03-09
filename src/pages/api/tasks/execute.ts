import type { APIRoute } from 'astro';
import { hasSessionCookie } from '../../../lib/auth';
import { isSupabaseConfigured } from '../../../lib/supabase';
import { executeTask } from '../../../lib/tasks';
import { consumeUnits } from '../../../lib/usage';
import { runLeadResearch } from '../../../lib/pods/lead-research';

const POD_RUNNERS: Record<string, (input: Record<string, unknown>) => Promise<{ output: Record<string, unknown>; lessons: unknown[]; units: number }>> = {
  lead_research: runLeadResearch,
};

export const POST: APIRoute = async ({ request }) => {
  if (!hasSessionCookie(request.headers.get('cookie'))) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  if (!isSupabaseConfigured()) {
    return new Response(JSON.stringify({ error: 'Supabase not configured' }), { status: 503 });
  }

  const { podId, podType, taskType, input } = await request.json() as {
    podId: string;
    podType: string;
    taskType: string;
    input: Record<string, unknown>;
  };

  if (!podId || !podType || !taskType) {
    return new Response(JSON.stringify({ error: 'podId, podType, and taskType are required' }), { status: 400 });
  }

  const runner = POD_RUNNERS[podType];
  if (!runner) {
    return new Response(JSON.stringify({ error: `No runner available for pod type: ${podType}. Coming soon.` }), { status: 501 });
  }

  try {
    const task = await executeTask(podId, taskType, input, runner);

    if (task && task.units_consumed > 0) {
      await consumeUnits(task.units_consumed);
    }

    return new Response(JSON.stringify({ task }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
};
