import type { AgentTool } from '../base-agent';
import { getSupabaseServiceClient, isSupabaseConfigured } from '../../supabase';

/**
 * Write lessons and outcomes back to the Knowledge Center.
 * Every pod must write learnings — this is a permanent, non-negotiable rule.
 */
export const knowledgeWriteTool: AgentTool = {
  name: 'knowledge_write',
  description: 'Write a lesson, outcome, or insight back to the Knowledge Center. Input: { "content": "lesson text", "source": "agent or pod name" }',

  async execute(input) {
    if (!isSupabaseConfigured()) {
      return { success: false, error: 'Supabase not configured' };
    }

    const content = (input.content as string) ?? '';
    const source = (input.source as string) ?? 'unknown';

    if (!content.trim()) return { success: false, error: 'Content is required' };

    const supabase = getSupabaseServiceClient();

    const noteContent = `[Learned by ${source}] ${content.trim()}`;

    const { data, error } = await supabase
      .from('knowledge_notes')
      .insert({ content: noteContent })
      .select('id')
      .single();

    if (error) return { success: false, error: error.message };

    await supabase.from('knowledge_audit_log').insert({
      action: 'note_add',
      target_type: 'note',
      target_id: data.id,
      metadata: { source, auto_generated: true },
    });

    return { success: true, noteId: data.id };
  },
};
