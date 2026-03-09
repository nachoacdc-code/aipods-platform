import { getSupabaseServiceClient, isSupabaseConfigured } from './supabase';

export interface Task {
  id: string;
  pod_id: string;
  task_type: string;
  status: string;
  units_consumed: number;
  input_json: Record<string, unknown>;
  output_json: Record<string, unknown>;
  lessons_json: unknown[];
  error_message: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
}

export async function createTask(podId: string, taskType: string, input: Record<string, unknown>): Promise<Task | null> {
  if (!isSupabaseConfigured()) return null;

  const supabase = getSupabaseServiceClient();

  const { data, error } = await supabase
    .from('tasks')
    .insert({
      pod_id: podId,
      task_type: taskType,
      status: 'queued',
      input_json: input,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function updateTaskStatus(
  taskId: string,
  status: 'running' | 'completed' | 'failed',
  updates: Partial<{
    output_json: Record<string, unknown>;
    lessons_json: unknown[];
    units_consumed: number;
    error_message: string;
    started_at: string;
    completed_at: string;
  }> = {},
): Promise<void> {
  if (!isSupabaseConfigured()) return;

  const supabase = getSupabaseServiceClient();

  await supabase
    .from('tasks')
    .update({ status, ...updates })
    .eq('id', taskId);
}

export async function getTask(taskId: string): Promise<Task | null> {
  if (!isSupabaseConfigured()) return null;

  const supabase = getSupabaseServiceClient();

  const { data } = await supabase
    .from('tasks')
    .select('*')
    .eq('id', taskId)
    .single();

  return data;
}

/**
 * Execute a pod task end-to-end.
 * This is the main entry point called by the API route.
 */
export async function executeTask(
  podId: string,
  taskType: string,
  input: Record<string, unknown>,
  runner: (input: Record<string, unknown>) => Promise<{ output: Record<string, unknown>; lessons: unknown[]; units: number }>,
): Promise<Task | null> {
  const task = await createTask(podId, taskType, input);
  if (!task) return null;

  await updateTaskStatus(task.id, 'running', { started_at: new Date().toISOString() });

  try {
    const result = await runner(input);

    await updateTaskStatus(task.id, 'completed', {
      output_json: result.output,
      lessons_json: result.lessons,
      units_consumed: result.units,
      completed_at: new Date().toISOString(),
    });

    return { ...task, status: 'completed', output_json: result.output, lessons_json: result.lessons, units_consumed: result.units };
  } catch (err: any) {
    await updateTaskStatus(task.id, 'failed', {
      error_message: err.message || 'Unknown error',
      completed_at: new Date().toISOString(),
    });

    return { ...task, status: 'failed', error_message: err.message };
  }
}
