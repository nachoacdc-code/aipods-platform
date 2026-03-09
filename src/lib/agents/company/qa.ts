import { callWithRouter } from '../../model-router';

const QA_SYSTEM_PROMPT = `You are the QA & Reviewer Layer for AIpods. Your job is to review ALL outputs from every agent before they reach a human.

You enforce these hardcoded rules:
1. TRUTH — No hallucinated facts, statistics, or claims. If something cannot be verified, it must be clearly marked as an estimate or assumption.
2. BUSINESS-ONLY — Reject any content that could be interpreted as personal coaching, education, legal advice, medical advice, or any regulated advice.
3. NO REGULATED ADVICE — If the output touches anything that requires a professional license (legal, medical, financial investment advice, tax), block it and escalate.
4. PRIVACY — No personally identifiable information should leak between clients. No internal company data (model costs, agent architecture, etc.) should appear in client-facing outputs.
5. BRAND VOICE — Client-facing outputs should be positive, vibrant, results-focused. No fear-based or security-heavy language.
6. NO INTERNAL LEAKS — Never mention "AI CEO", agent names, model names, or internal architecture in client-facing content.

Your response must be EXACTLY in this format:
VERDICT: PASS or FAIL
ISSUES: [list of issues, or "None"]
REVISED: [if FAIL, provide the corrected version; if PASS, repeat the original]`;

export interface QAResult {
  passed: boolean;
  issues: string[];
  revisedContent: string;
  costUsd: number;
}

/**
 * Run QA review on any agent output.
 * Returns pass/fail with optional revision.
 */
export async function reviewOutput(
  agentName: string,
  content: string,
  isClientFacing: boolean,
): Promise<QAResult> {
  const response = await callWithRouter('qa', [
    { role: 'system', content: QA_SYSTEM_PROMPT },
    {
      role: 'user',
      content: `Review this output from the ${agentName} agent.
Client-facing: ${isClientFacing ? 'YES — apply all brand voice and privacy rules' : 'NO — internal only, still check for truth and regulated advice'}

---OUTPUT TO REVIEW---
${content}
---END OUTPUT---`,
    },
  ], 'medium');

  const text = response.content;
  const passed = text.includes('VERDICT: PASS');

  const issuesMatch = text.match(/ISSUES:\s*([\s\S]*?)(?=REVISED:|$)/);
  const issuesStr = issuesMatch?.[1]?.trim() ?? '';
  const issues = issuesStr === 'None' || !issuesStr
    ? []
    : issuesStr.split('\n').map((l) => l.replace(/^[-•*]\s*/, '').trim()).filter(Boolean);

  const revisedMatch = text.match(/REVISED:\s*([\s\S]*?)$/);
  const revisedContent = revisedMatch?.[1]?.trim() ?? content;

  return {
    passed,
    issues,
    revisedContent: passed ? content : revisedContent,
    costUsd: response.costUsd,
  };
}
