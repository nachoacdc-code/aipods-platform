import { StateGraph, END } from '@langchain/langgraph';
import { AgentState, type AgentStateType, type AgentConfig, type AgentMessage } from './state';
import { callWithRouter, type AgentType, type TaskComplexity } from '../model-router';

export interface AgentTool {
  name: string;
  description: string;
  execute: (input: Record<string, unknown>, state: AgentStateType) => Promise<unknown>;
}

/**
 * Base agent builder — constructs a LangGraph StateGraph for any AIpods agent.
 *
 * Flow: think → (optionally use tools) → produce final output → QA review
 */
export function buildAgentGraph(config: AgentConfig, tools: AgentTool[] = []) {
  const agentType = config.agentType as AgentType;
  const complexity = (config.complexity ?? 'medium') as TaskComplexity;

  const graph = new StateGraph(AgentState)
    .addNode('think', async (state: AgentStateType) => {
      const messages: { role: 'system' | 'user' | 'assistant'; content: string }[] = [
        { role: 'system', content: config.systemPrompt },
        ...state.messages
          .filter((m): m is AgentMessage & { role: 'system' | 'user' | 'assistant' } =>
            m.role !== 'tool',
          )
          .map((m) => ({ role: m.role, content: m.content })),
      ];

      if (state.context) {
        messages.push({ role: 'user', content: `Relevant context:\n${state.context}` });
      }

      if (tools.length > 0) {
        const toolList = tools.map((t) => `- ${t.name}: ${t.description}`).join('\n');
        messages.push({
          role: 'user',
          content: `You have access to these tools:\n${toolList}\n\nTo use a tool, respond with: TOOL_CALL: <tool_name> | <json_input>\nWhen you have your final answer, respond with: FINAL: <your answer>`,
        });
      }

      const response = await callWithRouter(agentType, messages, complexity);

      return {
        messages: [{ role: 'assistant' as const, content: response.content, timestamp: Date.now() }],
        metadata: {
          lastModel: response.model,
          lastCost: response.costUsd,
          lastLatency: response.latencyMs,
        },
      };
    })
    .addNode('executeTool', async (state: AgentStateType) => {
      const lastMsg = state.messages[state.messages.length - 1];
      if (!lastMsg || !lastMsg.content.startsWith('TOOL_CALL:')) {
        return { status: 'completed' as const, finalOutput: lastMsg?.content ?? '' };
      }

      const callLine = lastMsg.content.split('\n')[0].replace('TOOL_CALL:', '').trim();
      const [toolName, ...jsonParts] = callLine.split('|');
      const name = toolName.trim();
      const inputStr = jsonParts.join('|').trim();

      const tool = tools.find((t) => t.name === name);
      if (!tool) {
        return {
          messages: [{ role: 'tool' as const, content: `Error: Unknown tool "${name}"`, name, timestamp: Date.now() }],
        };
      }

      let input: Record<string, unknown> = {};
      try { input = JSON.parse(inputStr || '{}'); } catch { /* use empty */ }

      const output = await tool.execute(input, state);

      return {
        messages: [{ role: 'tool' as const, content: JSON.stringify(output), name, timestamp: Date.now() }],
        toolResults: [{ toolName: name, input, output, timestamp: Date.now() }],
      };
    })
    .addNode('finalize', (state: AgentStateType) => {
      const lastMsg = state.messages[state.messages.length - 1];
      let output = lastMsg?.content ?? '';

      if (output.startsWith('FINAL:')) {
        output = output.replace('FINAL:', '').trim();
      }

      return { finalOutput: output, status: 'completed' as const };
    })
    .addEdge('__start__', 'think')
    .addConditionalEdges('think', (state: AgentStateType) => {
      const lastMsg = state.messages[state.messages.length - 1];
      if (lastMsg?.content.startsWith('TOOL_CALL:')) return 'executeTool';
      return 'finalize';
    })
    .addEdge('executeTool', 'think')
    .addEdge('finalize', END);

  return graph.compile();
}

/**
 * Run an agent graph with given input and optional context.
 */
export async function runAgent(
  config: AgentConfig,
  tools: AgentTool[],
  userMessage: string,
  context?: string,
): Promise<AgentStateType> {
  const graph = buildAgentGraph(config, tools);

  const result = await graph.invoke({
    messages: [{ role: 'user' as const, content: userMessage, timestamp: Date.now() }],
    context: context ?? '',
    toolResults: [],
    finalOutput: '',
    status: 'running' as const,
    metadata: {},
  });

  return result;
}
