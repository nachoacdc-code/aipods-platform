import { callWithRouter } from '../../model-router';
import { reviewOutput } from './qa';

const SALES_PROMPT = `You are the Sales & Outreach Director at AIpods. You generate and execute outreach campaigns to acquire new customers.

Your responsibilities:
1. **Outreach Campaigns** — Draft cold emails, LinkedIn messages, and follow-up sequences
2. **Lead Prioritization** — Score and prioritize leads based on fit and buying signals
3. **Pipeline Management** — Track outreach status and suggest next actions
4. **Inbound Response** — Draft responses to inbound inquiries

Important rules:
- For MVP: Generate drafts for founder review — NEVER auto-send anything
- Tone: confident, professional, no hype or sleaze. Focus on concrete outcomes.
- Always personalize — reference the prospect's specific situation
- Keep initial outreach short (3-5 sentences max)

Your outputs will be reviewed by the QA layer before reaching the founder.`;

export interface OutreachDraft {
  type: 'cold_email' | 'linkedin' | 'follow_up';
  subject?: string;
  body: string;
  targetDescription: string;
}

export async function generateOutreachBatch(
  context: string,
): Promise<{ drafts: OutreachDraft[]; costUsd: number }> {
  const response = await callWithRouter('sales', [
    { role: 'system', content: SALES_PROMPT },
    {
      role: 'user',
      content: `Generate a batch of outreach drafts based on this context:

${context}

Provide 3-5 outreach pieces. For each, include:
- TYPE: cold_email / linkedin / follow_up
- SUBJECT: (for emails)
- TARGET: who this is for
- BODY: the actual message

Separate each piece with "---".`,
    },
  ], 'medium');

  const qa = await reviewOutput('Sales Director', response.content, true);

  const sections = qa.revisedContent.split('---').filter((s) => s.trim());
  const drafts: OutreachDraft[] = sections.map((section) => {
    const typeMatch = section.match(/TYPE:\s*(\w+)/i);
    const subjectMatch = section.match(/SUBJECT:\s*(.+)/i);
    const targetMatch = section.match(/TARGET:\s*(.+)/i);
    const bodyMatch = section.match(/BODY:\s*([\s\S]*?)$/i);

    return {
      type: (typeMatch?.[1]?.toLowerCase() as OutreachDraft['type']) ?? 'cold_email',
      subject: subjectMatch?.[1]?.trim(),
      targetDescription: targetMatch?.[1]?.trim() ?? 'General',
      body: bodyMatch?.[1]?.trim() ?? section.trim(),
    };
  });

  return { drafts, costUsd: response.costUsd + qa.costUsd };
}

export async function generateFollowUp(
  originalOutreach: string,
  daysElapsed: number,
): Promise<{ followUp: string; costUsd: number }> {
  const response = await callWithRouter('sales', [
    { role: 'system', content: SALES_PROMPT },
    {
      role: 'user',
      content: `Write a follow-up message. It's been ${daysElapsed} days since the original outreach below. Keep it short, add new value, don't be pushy.

Original:
${originalOutreach}`,
    },
  ], 'low');

  const qa = await reviewOutput('Sales Director', response.content, true);

  return { followUp: qa.revisedContent, costUsd: response.costUsd + qa.costUsd };
}
