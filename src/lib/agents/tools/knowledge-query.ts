import type { AgentTool } from '../base-agent';
import { getSupabaseServiceClient, isSupabaseConfigured } from '../../supabase';

/**
 * Vector similarity search against the Knowledge Center.
 * Used by pods to find relevant context for a task.
 */
export const knowledgeQueryTool: AgentTool = {
  name: 'knowledge_query',
  description: 'Search the Knowledge Center for relevant documents and notes. Input: { "query": "search terms", "limit": 5 }',

  async execute(input) {
    if (!isSupabaseConfigured()) {
      return { results: [], error: 'Supabase not configured' };
    }

    const query = (input.query as string) ?? '';
    const limit = (input.limit as number) ?? 5;

    if (!query) return { results: [], error: 'Query is required' };

    const supabase = getSupabaseServiceClient();

    // For MVP: text search via ilike (until embeddings are generated)
    const { data: chunks } = await supabase
      .from('knowledge_chunks')
      .select('id, document_id, content, chunk_index')
      .ilike('content', `%${query}%`)
      .limit(limit);

    const { data: notes } = await supabase
      .from('knowledge_notes')
      .select('id, content')
      .ilike('content', `%${query}%`)
      .limit(limit);

    return {
      chunks: chunks ?? [],
      notes: notes ?? [],
      totalResults: (chunks?.length ?? 0) + (notes?.length ?? 0),
    };
  },
};
