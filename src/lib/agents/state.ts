import { Annotation } from '@langchain/langgraph';

/**
 * Shared state for all AIpods agent graphs.
 */
export const AgentState = Annotation.Root({
  messages: Annotation<AgentMessage[]>({
    reducer: (prev, next) => [...prev, ...next],
    default: () => [],
  }),
  context: Annotation<string>({
    reducer: (_prev, next) => next,
    default: () => '',
  }),
  toolResults: Annotation<ToolResult[]>({
    reducer: (prev, next) => [...prev, ...next],
    default: () => [],
  }),
  finalOutput: Annotation<string>({
    reducer: (_prev, next) => next,
    default: () => '',
  }),
  status: Annotation<'running' | 'completed' | 'failed' | 'needs_review'>({
    reducer: (_prev, next) => next,
    default: () => 'running' as const,
  }),
  metadata: Annotation<Record<string, unknown>>({
    reducer: (prev, next) => ({ ...prev, ...next }),
    default: () => ({}),
  }),
});

export type AgentStateType = typeof AgentState.State;

export interface AgentMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  name?: string;
  timestamp?: number;
}

export interface ToolResult {
  toolName: string;
  input: Record<string, unknown>;
  output: unknown;
  timestamp: number;
}

export interface AgentConfig {
  agentType: string;
  systemPrompt: string;
  complexity?: 'low' | 'medium' | 'high';
}
