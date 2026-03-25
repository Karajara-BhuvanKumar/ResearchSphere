// Research API integrations

export interface ArxivPaper {
  id: string;
  title: string;
  summary: string;
  authors: string[];
  published: string;
  link: string;
  category: string;
}

export interface CrossRefWork {
  DOI: string;
  title: string[];
  author?: Array<{ given?: string; family?: string }>;
  publisher?: string;
  published?: { 'date-parts': number[][] };
  type?: string;
  'container-title'?: string[];
}

export interface OpenAlexWork {
  id: string;
  title: string;
  authorships: Array<{ author: { display_name: string } }>;
  publication_year: number;
  type: string;
  host_venue?: { display_name: string };
  doi?: string;
}

export interface DBLPPublication {
  title: string;
  authors?: { author: string[] | string };
  venue?: string;
  year?: string;
  type?: string;
  url?: string;
}

// arXiv API - Research papers
export async function searchArxiv(query: string, maxResults = 10): Promise<ArxivPaper[]> {
  try {
    const url = `https://export.arxiv.org/api/query?search_query=all:${encodeURIComponent(query)}&start=0&max_results=${maxResults}`;
    const response = await fetch(url);
    const text = await response.text();
    
    const parser = new DOMParser();
    const xml = parser.parseFromString(text, 'text/xml');
    const entries = xml.querySelectorAll('entry');
    
    return Array.from(entries).map(entry => ({
      id: entry.querySelector('id')?.textContent || '',
      title: entry.querySelector('title')?.textContent?.trim() || '',
      summary: entry.querySelector('summary')?.textContent?.trim() || '',
      authors: Array.from(entry.querySelectorAll('author name')).map(a => a.textContent || ''),
      published: entry.querySelector('published')?.textContent || '',
      link: entry.querySelector('id')?.textContent || '',
      category: entry.querySelector('category')?.getAttribute('term') || 'General',
    }));
  } catch (error) {
    console.error('arXiv API error:', error);
    return [];
  }
}

// CrossRef API - Journal metadata
export async function searchCrossRef(query: string, rows = 10): Promise<CrossRefWork[]> {
  try {
    const url = `https://api.crossref.org/works?query=${encodeURIComponent(query)}&rows=${rows}`;
    const response = await fetch(url);
    const data = await response.json();
    return data.message?.items || [];
  } catch (error) {
    console.error('CrossRef API error:', error);
    return [];
  }
}

// OpenAlex API - Modern research API
export async function searchOpenAlex(query: string, perPage = 10): Promise<OpenAlexWork[]> {
  try {
    const url = `https://api.openalex.org/works?search=${encodeURIComponent(query)}&per-page=${perPage}`;
    const response = await fetch(url);
    const data = await response.json();
    return data.results || [];
  } catch (error) {
    console.error('OpenAlex API error:', error);
    return [];
  }
}

// DBLP API - Computer science publications
export async function searchDBLP(query: string, hits = 10): Promise<DBLPPublication[]> {
  try {
    const url = `https://dblp.org/search/publ/api?q=${encodeURIComponent(query)}&h=${hits}&format=json`;
    const response = await fetch(url);
    const data = await response.json();
    
    const results = data.result?.hits?.hit || [];
    return results.map((hit: any) => hit.info);
  } catch (error) {
    console.error('DBLP API error:', error);
    return [];
  }
}

// Semantic Scholar API (requires API key)
export interface SemanticScholarPaper {
  paperId: string;
  title: string;
  abstract?: string;
  authors: Array<{ name: string }>;
  year?: number;
  url?: string;
  venue?: string;
}

export async function searchSemanticScholar(
  query: string,
  limit = 10,
  apiKey?: string
): Promise<SemanticScholarPaper[]> {
  try {
    const url = `https://api.semanticscholar.org/graph/v1/paper/search?query=${encodeURIComponent(query)}&limit=${limit}&fields=title,abstract,authors,year,url,venue`;
    
    const headers: HeadersInit = apiKey 
      ? { 'x-api-key': apiKey }
      : {};
    
    const response = await fetch(url, { headers });
    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error('Semantic Scholar API error:', error);
    return [];
  }
}

// Combined search across all APIs
export async function searchAllAPIs(query: string) {
  const [arxiv, crossref, openalex, dblp] = await Promise.all([
    searchArxiv(query, 5),
    searchCrossRef(query, 5),
    searchOpenAlex(query, 5),
    searchDBLP(query, 5),
  ]);

  return {
    arxiv,
    crossref,
    openalex,
    dblp,
  };
}
