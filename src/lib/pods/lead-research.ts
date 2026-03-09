import { StateGraph, END } from '@langchain/langgraph';
import { Annotation } from '@langchain/langgraph';
import { callWithRouter } from '../model-router';

/**
 * LeadResearch Pod — 7-agent pipeline.
 * 
 * 1. ICP & Source Strategist — reads input, determines best sources
 * 2. Company Finder — searches web for matching companies
 * 3. Decision-Maker Hunter — finds key contacts
 * 4. Email Validator — validates/finds emails
 * 5. Fresh Signal Analyzer — checks for buying signals (7-60 days)
 * 6. Scorer & Outreach Writer — scores leads, writes first lines
 * 7. Compiler & Learner — assembles final output, extracts lessons
 */

const LeadState = Annotation.Root({
  input: Annotation<LeadInput>({
    reducer: (_prev, next) => next,
    default: () => ({ industry: '', targetRole: '', geography: '', maxLeads: 10, additionalContext: '' }),
  }),
  icpStrategy: Annotation<string>({
    reducer: (_prev, next) => next,
    default: () => '',
  }),
  companies: Annotation<string>({
    reducer: (_prev, next) => next,
    default: () => '',
  }),
  contacts: Annotation<string>({
    reducer: (_prev, next) => next,
    default: () => '',
  }),
  validatedEmails: Annotation<string>({
    reducer: (_prev, next) => next,
    default: () => '',
  }),
  signals: Annotation<string>({
    reducer: (_prev, next) => next,
    default: () => '',
  }),
  scoredLeads: Annotation<string>({
    reducer: (_prev, next) => next,
    default: () => '',
  }),
  finalOutput: Annotation<string>({
    reducer: (_prev, next) => next,
    default: () => '',
  }),
  lessons: Annotation<string[]>({
    reducer: (prev, next) => [...prev, ...next],
    default: () => [],
  }),
  totalCost: Annotation<number>({
    reducer: (prev, next) => prev + next,
    default: () => 0,
  }),
});

interface LeadInput {
  industry: string;
  targetRole: string;
  geography: string;
  maxLeads: number;
  additionalContext: string;
}

function buildLeadResearchGraph() {
  const graph = new StateGraph(LeadState)
    .addNode('icpStrategist', async (state) => {
      const response = await callWithRouter('pod_task', [
        { role: 'system', content: 'You are an ICP & Source Strategist. Analyze the target criteria and determine the best sources, search strategies, and qualification criteria for finding leads in this vertical.' },
        { role: 'user', content: `Find leads matching:\n- Industry: ${state.input.industry}\n- Target role: ${state.input.targetRole}\n- Geography: ${state.input.geography}\n- Max leads: ${state.input.maxLeads}\n${state.input.additionalContext ? `- Additional context: ${state.input.additionalContext}` : ''}\n\nProvide a detailed ICP profile and sourcing strategy.` },
      ], 'medium');

      return { icpStrategy: response.content, totalCost: response.costUsd };
    })

    .addNode('companyFinder', async (state) => {
      const response = await callWithRouter('pod_task', [
        { role: 'system', content: 'You are a Company Finder. Using the ICP strategy provided, identify specific companies that match the criteria. List company names, websites, estimated size, and why they match.' },
        { role: 'user', content: `ICP Strategy:\n${state.icpStrategy}\n\nFind up to ${state.input.maxLeads} companies matching this profile. Be specific with real company names and details.` },
      ], 'medium');

      return { companies: response.content, totalCost: response.costUsd };
    })

    .addNode('contactHunter', async (state) => {
      const response = await callWithRouter('pod_task', [
        { role: 'system', content: 'You are a Decision-Maker Hunter. For each company identified, find the most likely decision-maker matching the target role. Include name, title, LinkedIn profile pattern, and any publicly available contact information.' },
        { role: 'user', content: `Companies found:\n${state.companies}\n\nTarget role: ${state.input.targetRole}\n\nFor each company, identify the best contact person to reach out to.` },
      ], 'medium');

      return { contacts: response.content, totalCost: response.costUsd };
    })

    .addNode('emailValidator', async (state) => {
      const response = await callWithRouter('pod_task', [
        { role: 'system', content: 'You are an Email Validator & Finder. For each contact, determine the most likely email address using common email patterns (first.last@company.com, first@company.com, etc.). Note which ones are verified patterns vs guesses.' },
        { role: 'user', content: `Contacts found:\n${state.contacts}\n\nFor each contact, find or construct the most likely email address. Mark confidence level (high/medium/low).` },
      ], 'low');

      return { validatedEmails: response.content, totalCost: response.costUsd };
    })

    .addNode('signalAnalyzer', async (state) => {
      const response = await callWithRouter('pod_task', [
        { role: 'system', content: 'You are a Fresh Signal Analyzer. For each company/contact, identify recent buying signals from the last 7-60 days. Look for: new funding, hiring in relevant roles, new product launches, leadership changes, expansion news, technology changes, or stated pain points.' },
        { role: 'user', content: `Companies and contacts:\n${state.contacts}\n\nFor each, identify any recent buying signals or triggers that suggest they might be receptive to outreach right now. Be specific about the signal and when it occurred.` },
      ], 'medium');

      return { signals: response.content, totalCost: response.costUsd };
    })

    .addNode('scorerWriter', async (state) => {
      const response = await callWithRouter('pod_task', [
        { role: 'system', content: 'You are a Lead Scorer & Outreach Writer. Score each lead on a 1-100 scale based on ICP fit, signal strength, and reachability. Then write a personalized first-line for each lead that references their specific situation or signal.' },
        { role: 'user', content: `ICP Strategy:\n${state.icpStrategy}\n\nContacts with emails:\n${state.validatedEmails}\n\nBuying signals:\n${state.signals}\n\nScore each lead and write a compelling, personalized first-line for outreach.` },
      ], 'high');

      return { scoredLeads: response.content, totalCost: response.costUsd };
    })

    .addNode('compiler', async (state) => {
      const response = await callWithRouter('pod_task', [
        { role: 'system', content: 'You are a Lead List Compiler & Learner. Compile all the research into a clean, structured output. Also extract lessons learned about this vertical/ICP that should be saved for future research. Format the leads as a structured list with: Company, Contact Name, Title, Email, Lead Score, Buying Signal, Personalized First Line.' },
        { role: 'user', content: `Compile the final lead list from this research:\n\nScored leads:\n${state.scoredLeads}\n\nAlso extract 3-5 key lessons about what worked well, what sources were most useful, and what to do differently next time for this vertical.` },
      ], 'medium');

      const lessonMatch = response.content.match(/(?:lessons?|learnings?|takeaways?)[\s\S]*$/i);
      const lessons = lessonMatch ? [lessonMatch[0]] : ['Completed lead research task'];

      return { finalOutput: response.content, lessons, totalCost: response.costUsd };
    })

    .addEdge('__start__', 'icpStrategist')
    .addEdge('icpStrategist', 'companyFinder')
    .addEdge('companyFinder', 'contactHunter')
    .addEdge('contactHunter', 'emailValidator')
    .addEdge('emailValidator', 'signalAnalyzer')
    .addEdge('signalAnalyzer', 'scorerWriter')
    .addEdge('scorerWriter', 'compiler')
    .addEdge('compiler', END);

  return graph.compile();
}

/**
 * Run the LeadResearch pod pipeline.
 */
export async function runLeadResearch(
  input: Record<string, unknown>,
): Promise<{ output: Record<string, unknown>; lessons: unknown[]; units: number }> {
  const graph = buildLeadResearchGraph();

  const result = await graph.invoke({
    input: {
      industry: (input.industry as string) ?? '',
      targetRole: (input.targetRole as string) ?? 'CEO',
      geography: (input.geography as string) ?? 'United States',
      maxLeads: (input.maxLeads as number) ?? 10,
      additionalContext: (input.additionalContext as string) ?? '',
    },
    icpStrategy: '',
    companies: '',
    contacts: '',
    validatedEmails: '',
    signals: '',
    scoredLeads: '',
    finalOutput: '',
    lessons: [],
    totalCost: 0,
  });

  const estimatedUnits = Math.max(1, Math.ceil(result.totalCost / 0.30));

  return {
    output: {
      leadList: result.finalOutput,
      icpStrategy: result.icpStrategy,
      companiesFound: result.companies,
      totalCostUsd: result.totalCost,
    },
    lessons: result.lessons,
    units: estimatedUnits,
  };
}
