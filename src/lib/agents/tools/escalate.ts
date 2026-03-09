import type { AgentTool } from '../base-agent';
import { getSupabaseServiceClient, isSupabaseConfigured } from '../../supabase';

/**
 * Create an escalation for founder review.
 * Agents use this when they need human input before proceeding.
 */
export const escalateTool: AgentTool = {
  name: 'escalate',
  description: 'Create an escalation for founder review. Input: { "title": "brief title", "description": "details", "severity": "info|action_required|urgent" }',

  async execute(input) {
    if (!isSupabaseConfigured()) {
      return { success: false, error: 'Supabase not configured' };
    }

    const title = (input.title as string) ?? 'Untitled escalation';
    const description = (input.description as string) ?? '';
    const severity = (input.severity as string) ?? 'info';
    const agentType = (input.agentType as string) ?? 'unknown';

    const supabase = getSupabaseServiceClient();

    const { data, error } = await supabase
      .from('escalations')
      .insert({
        agent_type: agentType,
        severity,
        title,
        description,
        status: 'pending',
      })
      .select('id')
      .single();

    if (error) return { success: false, error: error.message };

    return { success: true, escalationId: data.id };
  },
};
