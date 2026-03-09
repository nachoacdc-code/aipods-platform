import type { AgentTool } from '../base-agent';

/**
 * Web search via DuckDuckGo HTML scraping.
 * MVP implementation — no API key required.
 */
export const webSearchTool: AgentTool = {
  name: 'web_search',
  description: 'Search the web for information. Input: { "query": "search terms", "maxResults": 5 }',

  async execute(input) {
    const query = (input.query as string) ?? '';
    const maxResults = (input.maxResults as number) ?? 5;

    if (!query) return { results: [], error: 'Query is required' };

    try {
      const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;

      const res = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; AIpods/1.0)',
        },
      });

      if (!res.ok) {
        return { results: [], error: `Search failed: ${res.status}` };
      }

      const html = await res.text();

      const results: { title: string; url: string; snippet: string }[] = [];
      const resultRegex = /<a[^>]*class="result__a"[^>]*href="([^"]*)"[^>]*>([^<]*)<\/a>/g;
      const snippetRegex = /<a[^>]*class="result__snippet"[^>]*>([^<]*(?:<[^>]*>[^<]*)*)<\/a>/g;

      let match;
      while ((match = resultRegex.exec(html)) && results.length < maxResults) {
        results.push({ url: match[1], title: match[2].trim(), snippet: '' });
      }

      let i = 0;
      while ((match = snippetRegex.exec(html)) && i < results.length) {
        results[i].snippet = match[1].replace(/<[^>]*>/g, '').trim();
        i++;
      }

      return { results, count: results.length };
    } catch (err: any) {
      return { results: [], error: err.message || 'Search failed' };
    }
  },
};
