import { callWithRouter } from '../../model-router';
import { reviewOutput } from './qa';

const MARKETING_PROMPT = `You are the Marketing & Content Director at AIpods. You own content creation, SEO, social media, and website copy.

Your responsibilities:
1. **Content Calendar** — Plan weekly content (blog posts, social posts, case studies)
2. **SEO Audit** — Identify keyword opportunities, suggest meta improvements, track rankings
3. **Social Media** — Draft posts for LinkedIn, Twitter/X, and other channels
4. **Website Copy** — Landing page copy, feature descriptions, comparison pages
5. **Competitor Research** — Monitor competitor messaging, pricing, and positioning

Brand voice rules:
- Positive, vibrant, enthusiastic, results-focused
- Lead with outcomes ("50 qualified leads in 20 minutes") not process
- Never mention AI internals, model names, or technical architecture
- Never use fear-based or security-heavy language as the primary message
- Think: "What would a delighted customer tweet about us?"

Your outputs will be reviewed by the QA layer before reaching the founder.`;

export interface ContentPiece {
  type: 'blog_outline' | 'social_post' | 'landing_copy' | 'seo_suggestion';
  title: string;
  content: string;
  channel?: string;
}

export async function generateContentCalendar(
  focusAreas: string,
): Promise<{ pieces: ContentPiece[]; costUsd: number }> {
  const response = await callWithRouter('marketing', [
    { role: 'system', content: MARKETING_PROMPT },
    {
      role: 'user',
      content: `Create a weekly content calendar with focus areas: ${focusAreas}

Provide 5-7 content pieces. For each, include:
- TYPE: blog_outline / social_post / landing_copy / seo_suggestion
- TITLE: headline or title
- CHANNEL: where it should be published
- CONTENT: the actual draft or outline

Separate each piece with "---".`,
    },
  ], 'medium');

  const qa = await reviewOutput('Marketing Director', response.content, true);

  const sections = qa.revisedContent.split('---').filter((s) => s.trim());
  const pieces: ContentPiece[] = sections.map((section) => {
    const typeMatch = section.match(/TYPE:\s*(\w+)/i);
    const titleMatch = section.match(/TITLE:\s*(.+)/i);
    const channelMatch = section.match(/CHANNEL:\s*(.+)/i);
    const contentMatch = section.match(/CONTENT:\s*([\s\S]*?)$/i);

    return {
      type: (typeMatch?.[1]?.toLowerCase() as ContentPiece['type']) ?? 'social_post',
      title: titleMatch?.[1]?.trim() ?? 'Untitled',
      channel: channelMatch?.[1]?.trim(),
      content: contentMatch?.[1]?.trim() ?? section.trim(),
    };
  });

  return { pieces, costUsd: response.costUsd + qa.costUsd };
}

export async function runSEOAudit(
  currentPages: string[],
): Promise<{ audit: string; costUsd: number }> {
  const response = await callWithRouter('marketing', [
    { role: 'system', content: MARKETING_PROMPT },
    {
      role: 'user',
      content: `Run an SEO audit for AIpods. Current pages: ${currentPages.join(', ')}

Analyze:
1. Meta title/description suggestions for each page
2. Keyword opportunities we're missing
3. Content gaps vs competitors
4. Technical SEO quick wins

Prioritize by impact.`,
    },
  ], 'medium');

  const qa = await reviewOutput('Marketing Director', response.content, false);

  return { audit: qa.revisedContent, costUsd: response.costUsd + qa.costUsd };
}
