export interface SearchResult {
  title: string;
  url: string;
  content: string;
  score: number;
}

export async function webSearch(query: string): Promise<SearchResult[]> {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) {
    throw new Error('TAVILY_API_KEY not configured');
  }

  const response = await fetch('https://api.tavily.com/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      api_key: apiKey,
      query,
      search_depth: 'basic',
      max_results: 5,
      include_answer: true,
    }),
  });

  if (!response.ok) {
    throw new Error(`Tavily search failed: ${response.status}`);
  }

  const data = await response.json() as {
    answer?: string;
    results: Array<{ title: string; url: string; content: string; score: number }>;
  };

  return data.results.map((r) => ({
    title: r.title,
    url: r.url,
    content: r.content,
    score: r.score,
  }));
}
