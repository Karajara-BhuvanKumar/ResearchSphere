// API Service Layer for ResearchSphere - CS/IT/AI Focused
// Integrates multiple free research APIs with focus on Computer Science, IT, and AI

const ARXIV_BASE_URL = 'http://export.arxiv.org/api/query';
const OPENALEX_BASE_URL = 'https://api.openalex.org';
const CROSSREF_BASE_URL = 'https://api.crossref.org';
const SEMANTIC_SCHOLAR_BASE_URL = 'https://api.semanticscholar.org/graph/v1';
const CORE_BASE_URL = 'https://api.core.ac.uk/v3';
const GOOGLE_BOOKS_BASE_URL = "https://www.googleapis.com/books/v1/volumes";
const HUGGING_FACE_BASE_URL = "https://huggingface.co/api";

// Types
export interface Paper {
  id: string;
  title: string;
  authors: string[];
  abstract: string;
  publishedDate: string;
  category: string;
  url: string;
  source: string;
  doi?: string;
  citationCount?: number;
  venue?: string;
}

export interface Conference {
  id: string;
  title: string;
  location: string;
  date: string;
  category: string;
  description: string;
  url: string;
  deadline?: string;
}

export interface Journal {
  id: string;
  title: string;
  publisher: string;
  impactFactor?: string;
  issn?: string;
  subjects: string[];
  url: string;
  openAccess?: boolean;
}

export interface GoogleBook {
  id: string;
  volumeInfo: {
    title: string;
    authors?: string[];
    publisher?: string;
    publishedDate?: string;
    description?: string;
    imageLinks?: {
      thumbnail: string;
    };
    previewLink: string;
    infoLink: string;
    categories?: string[];
  };
}

export interface HFModel {
  id: string;
  modelId: string;
  author?: string;
  lastModified: string;
  downloads: number;
  likes: number;
  pipeline_tag?: string;
  tags: string[];
}

export interface DBLPPublication {
  title: string;
  authors: { author: string[] } | { author: string };
  venue: string;
  year: string;
  type: string;
  url: string;
  doi?: string;
}

export interface NSFAward {
  id: string;
  title: string;
  fundsObligatedAmt: string;
  awardeeName: string;
  date: string;
  expDate: string;
  abstractText?: string;
  agency?: string;
}

export interface OpenAlexSource {
  id: string;
  displayName: string;
  type: string;
  hostOrganization: string;
  countryCode: string;
  url: string;
  worksCount: number;
  citedByCount: number;
}

// Helper function to parse arXiv XML response
const parseArxivXML = (xmlText: string): Paper[] => {
  try {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
    
    // Check for parsing errors
    const parserError = xmlDoc.querySelector('parsererror');
    if (parserError) {
      console.error('XML parsing error:', parserError.textContent);
      return [];
    }
    
    const entries = xmlDoc.querySelectorAll('entry');
    
    const papers: Paper[] = [];
    entries.forEach((entry) => {
      const title = entry.querySelector('title')?.textContent?.trim().replace(/\s+/g, ' ') || '';
      const summary = entry.querySelector('summary')?.textContent?.trim().replace(/\s+/g, ' ') || '';
      const published = entry.querySelector('published')?.textContent?.trim() || '';
      const id = entry.querySelector('id')?.textContent?.trim() || '';
      const category = entry.querySelector('category')?.getAttribute('term') || 'Computer Science';
      
      const authors: string[] = [];
      entry.querySelectorAll('author name').forEach((author) => {
        const name = author.textContent?.trim();
        if (name) authors.push(name);
      });
      
      if (title && id) {
        papers.push({
          id,
          title,
          authors,
          abstract: summary,
          publishedDate: published ? new Date(published).toLocaleDateString() : 'N/A',
          category,
          url: id,
          source: 'arXiv'
        });
      }
    });
    
    return papers;
  } catch (error) {
    console.error('Error parsing arXiv XML:', error);
    return [];
  }
};

// arXiv API - CS/AI focused papers
export const fetchArxivPapers = async (query: string = 'artificial intelligence', maxResults: number = 20): Promise<Paper[]> => {
  try {
    // Focus on CS categories: cs.AI, cs.LG, cs.CV, cs.CL, cs.NE, cs.IT
    const csCategories = 'cat:cs.AI+OR+cat:cs.LG+OR+cat:cs.CV+OR+cat:cs.CL+OR+cat:cs.NE+OR+cat:cs.IT+OR+cat:cs.CR';
    const searchQuery = encodeURIComponent(query);
    const url = `${ARXIV_BASE_URL}?search_query=all:${searchQuery}+AND+(${csCategories})&start=0&max_results=${maxResults}&sortBy=submittedDate&sortOrder=descending`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`arXiv API error: ${response.status}`);
    }
    
    const xmlText = await response.text();
    return parseArxivXML(xmlText);
  } catch (error) {
    console.error('Error fetching arXiv papers:', error);
    return [];
  }
};

// Semantic Scholar API - Best for CS/AI papers
export const fetchSemanticScholarPapers = async (query: string = 'machine learning', limit: number = 20): Promise<Paper[]> => {
  try {
    const searchQuery = encodeURIComponent(query);
    // Focus on CS fields with recent papers sorted by date
    const fields = 'paperId,title,abstract,authors,year,citationCount,venue,externalIds,publicationDate,fieldsOfStudy,openAccessPdf';
    // Removed year filter to avoid CORS issues, sorting by date will give us recent papers
    const url = `${SEMANTIC_SCHOLAR_BASE_URL}/paper/search?query=${searchQuery}&fields=${fields}&limit=${limit}&fieldsOfStudy=Computer Science&sort=publicationDate:desc`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      }
    });
    
    if (!response.ok) {
      console.warn(`Semantic Scholar API error: ${response.status}`);
      return [];
    }
    
    const data = await response.json();
    
    if (!data.data || data.data.length === 0) {
      return [];
    }
    
    // Filter for 2024+ papers on the client side
    return data.data
      .filter((paper: any) => {
        const year = paper.year || new Date(paper.publicationDate).getFullYear();
        return year >= 2024;
      })
      .map((paper: any) => ({
        id: paper.paperId || Math.random().toString(),
        title: paper.title || 'Untitled',
        authors: paper.authors?.map((a: any) => a.name).filter(Boolean) || [],
        abstract: paper.abstract || paper.title || '',
        publishedDate: paper.publicationDate 
          ? new Date(paper.publicationDate).toLocaleDateString() 
          : paper.year?.toString() || 'N/A',
        category: paper.fieldsOfStudy?.[0] || 'Computer Science',
        url: paper.openAccessPdf?.url || `https://www.semanticscholar.org/paper/${paper.paperId}`,
        source: 'Semantic Scholar',
        doi: paper.externalIds?.DOI,
        citationCount: paper.citationCount || 0,
        venue: paper.venue
      }));
  } catch (error) {
    console.error('Error fetching Semantic Scholar papers:', error);
    return [];
  }
};

// CORE API - Open Access CS papers
export const fetchCOREPapers = async (query: string = 'computer science', limit: number = 20): Promise<Paper[]> => {
  try {
    const searchQuery = encodeURIComponent(query + ' computer science');
    const url = `${CORE_BASE_URL}/search/works?q=${searchQuery}&limit=${limit}`;
    
    const response = await fetch(url);
    if (!response.ok) {
      console.warn(`CORE API error: ${response.status}`);
      return [];
    }
    
    const data = await response.json();
    
    if (!data.results || data.results.length === 0) {
      return [];
    }
    
    return data.results.map((paper: any) => ({
      id: paper.id || Math.random().toString(),
      title: paper.title || 'Untitled',
      authors: paper.authors?.map((a: any) => a.name || a).filter(Boolean) || [],
      abstract: paper.abstract || paper.description || '',
      publishedDate: paper.publishedDate 
        ? new Date(paper.publishedDate).toLocaleDateString() 
        : paper.yearPublished?.toString() || 'N/A',
      category: 'Computer Science',
      url: paper.downloadUrl || paper.sourceFulltextUrls?.[0] || `https://core.ac.uk/works/${paper.id}`,
      source: 'CORE',
      doi: paper.doi
    }));
  } catch (error) {
    console.error('Error fetching CORE papers:', error);
    return [];
  }
};

// OpenAlex API - Comprehensive Research Data (CS focused, 2025+)
export const fetchOpenAlexWorks = async (query: string = 'artificial intelligence', page: number = 1): Promise<Paper[]> => {
  try {
    const searchQuery = encodeURIComponent(query);
    // Filter for Computer Science concept AND 2025+ publications
    const url = `${OPENALEX_BASE_URL}/works?search=${searchQuery}&filter=concepts.id:C41008148,from_publication_date:2025-01-01&per-page=20&page=${page}&sort=publication_date:desc`;
    
    const response = await fetch(url);
    if (!response.ok) {
      console.warn(`OpenAlex API error: ${response.status}`);
      return [];
    }
    
    const data = await response.json();
    
    if (!data.results || data.results.length === 0) {
      return [];
    }
    
    return data.results.map((work: any) => ({
      id: work.id,
      title: work.title || 'Untitled',
      authors: work.authorships?.map((a: any) => a.author?.display_name).filter(Boolean) || [],
      abstract: work.abstract || work.title || '',
      publishedDate: work.publication_date ? new Date(work.publication_date).toLocaleDateString() : 'N/A',
      category: work.primary_topic?.display_name || work.type || 'Computer Science',
      url: work.doi ? `https://doi.org/${work.doi}` : work.id,
      source: 'OpenAlex',
      doi: work.doi,
      citationCount: work.cited_by_count || 0
    }));
  } catch (error) {
    console.error('Error fetching OpenAlex works:', error);
    return [];
  }
};

// CrossRef API - Journal Metadata (CS focused)
export const fetchCrossRefJournals = async (query: string = 'computer science', rows: number = 20): Promise<Journal[]> => {
  try {
    const searchQuery = encodeURIComponent(query + ' computer science technology');
    const url = `${CROSSREF_BASE_URL}/journals?query=${searchQuery}&rows=${rows}`;
    
    const response = await fetch(url);
    if (!response.ok) {
      console.warn(`CrossRef API error: ${response.status}`);
      return [];
    }
    
    const data = await response.json();
    
    if (!data.message?.items || data.message.items.length === 0) {
      return [];
    }
    
    return data.message.items.map((journal: any) => {
      // Try to get a direct URL from the journal metadata
      const directUrl = journal.URL || 
                       (journal.ISSN?.[0] ? `https://portal.issn.org/resource/ISSN/${journal.ISSN[0]}` : null) ||
                       `https://www.crossref.org/search/journals?q=${encodeURIComponent(journal.title)}`;
      
      return {
        id: journal.ISSN?.[0] || Math.random().toString(),
        title: journal.title || 'Unknown Journal',
        publisher: journal.publisher || 'Unknown Publisher',
        issn: journal.ISSN?.[0],
        subjects: journal.subjects || ['Computer Science'],
        url: directUrl,
        openAccess: false
      };
    });
  } catch (error) {
    console.error('Error fetching CrossRef journals:', error);
    return [];
  }
};

// CrossRef API - Recent CS Publications
export const fetchCrossRefPublications = async (query: string = 'computer science', rows: number = 20): Promise<Paper[]> => {
  try {
    const searchQuery = encodeURIComponent(query + ' computer science artificial intelligence');
    const url = `${CROSSREF_BASE_URL}/works?query=${searchQuery}&rows=${rows}&sort=published&order=desc`;
    
    const response = await fetch(url);
    if (!response.ok) {
      console.warn(`CrossRef API error: ${response.status}`);
      return [];
    }
    
    const data = await response.json();
    
    if (!data.message?.items || data.message.items.length === 0) {
      return [];
    }
    
    return data.message.items.map((work: any) => ({
      id: work.DOI || Math.random().toString(),
      title: work.title?.[0] || 'Untitled',
      authors: work.author?.map((a: any) => `${a.given || ''} ${a.family || ''}`).filter(Boolean) || [],
      abstract: work.abstract || work.title?.[0] || '',
      publishedDate: work.published?.['date-parts']?.[0] 
        ? new Date(work.published['date-parts'][0].join('-')).toLocaleDateString() 
        : 'N/A',
      category: work.type || 'Research Paper',
      url: work.URL || `https://doi.org/${work.DOI}`,
      source: 'CrossRef',
      doi: work.DOI
    }));
  } catch (error) {
    console.error('Error fetching CrossRef publications:', error);
    return [];
  }
};

// Google Books API
export const fetchGoogleBooks = async (query: string = 'computer science', limit: number = 20): Promise<GoogleBook[]> => {
  try {
    // Search for books with "handbook", "proceedings", or "advances" in title to find academic collections
    const searchQuery = encodeURIComponent(`${query} subject:computer science`);
    const url = `${GOOGLE_BOOKS_BASE_URL}?q=${searchQuery}&maxResults=${limit}&orderBy=newest&printType=books`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Google Books API error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.items || [];
  } catch (error) {
    console.error("Error fetching Google Books:", error);
    return [];
  }
};

// Hugging Face API
export const fetchHuggingFaceModels = async (query: string = 'text-generation', limit: number = 20): Promise<HFModel[]> => {
  try {
    const searchQuery = encodeURIComponent(query);
    const url = `${HUGGING_FACE_BASE_URL}/models?search=${searchQuery}&limit=${limit}&sort=downloads&direction=-1&full=true`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Hugging Face API error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.map((model: any) => ({
      id: model._id,
      modelId: model.modelId,
      author: model.author,
      lastModified: model.lastModified,
      downloads: model.downloads,
      likes: model.likes,
      pipeline_tag: model.pipeline_tag,
      tags: model.tags
    }));
  } catch (error) {
    console.error("Error fetching Hugging Face models:", error);
    return [];
  }
};

// Project Calls / Opportunities API (using OpenAlex & CrossRef as proxy for calls)
export interface ProjectOpportunity {
  id: string;
  title: string;
  organization: string;
  type: string;
  date: string;
  description: string;
  url: string;
  source: 'OpenAlex' | 'CrossRef';
}

export const fetchProjectOpportunities = async (query: string = 'conference'): Promise<ProjectOpportunity[]> => {
  try {
    const searchQuery = encodeURIComponent(query);
    
    // 1. OpenAlex - 2025+ CS/AI Works/Conferences
    const openAlexUrl = `${OPENALEX_BASE_URL}/works?search=${searchQuery}&filter=from_publication_date:2025-01-01,concepts.id:C41008148&per-page=10&sort=publication_date:desc`;
    
    // 2. CrossRef - Recent Conference items in CS/AI
    const crossRefUrl = `${CROSSREF_BASE_URL}/works?query=${searchQuery}+computer+science+conference&rows=10&sort=issued&order=desc&filter=from-pub-date:2025`;

    const [openAlexRes, crossRefRes] = await Promise.allSettled([
      fetch(openAlexUrl).then(r => r.json()),
      fetch(crossRefUrl).then(r => r.json())
    ]);

    const opportunities: ProjectOpportunity[] = [];

    // Process OpenAlex
    if (openAlexRes.status === 'fulfilled' && openAlexRes.value.results) {
      opportunities.push(...openAlexRes.value.results.map((work: any) => ({
        id: work.id,
        title: work.title,
        organization: work.primary_location?.source?.display_name || 'Unknown Organization',
        type: work.type || 'Conference',
        date: work.publication_date,
        description: work.abstract_inverted_index ? 'Abstract available' : 'No description available',
        url: work.doi ? `https://doi.org/${work.doi}` : work.id,
        source: 'OpenAlex'
      })));
    }

    // Process CrossRef
    if (crossRefRes.status === 'fulfilled' && crossRefRes.value.message?.items) {
      opportunities.push(...crossRefRes.value.message.items.map((work: any) => ({
        id: work.DOI,
        title: work.title?.[0] || 'Untitled',
        organization: work.publisher || 'Unknown Publisher',
        type: work.type || 'Conference Paper',
        date: work.issued?.['date-parts']?.[0]?.join('-') || '2025',
        description: 'Publication/Conference Record',
        url: work.URL || `https://doi.org/${work.DOI}`,
        source: 'CrossRef'
      })));
    }

    return opportunities;
  } catch (error) {
    console.error("Error fetching project opportunities:", error);
    return [];
  }
};

// OpenAlex Sources API - For Conferences and Journals (CS/AI focused)
export const fetchOpenAlexSources = async (query: string = 'computer science', type: 'conference' | 'journal' | null = null, limit: number = 20): Promise<OpenAlexSource[]> => {
  try {
    const searchQuery = encodeURIComponent(query);
    // Build URL with CS concept filter
    let url = `${OPENALEX_BASE_URL}/sources?search=${searchQuery}&per-page=${limit}`;
    
    // Add type filter if specified
    if (type) {
        url += `&filter=type:${type}`;
    }
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`OpenAlex Sources API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Filter results to prioritize CS/AI/IT related sources
    const results = data.results || [];
    return results.map((source: any) => ({
      id: source.id,
      displayName: source.display_name,
      type: source.type,
      hostOrganization: source.host_organization_name,
      countryCode: source.country_code,
      url: source.homepage_url || source.url,
      worksCount: source.works_count,
      citedByCount: source.cited_by_count
    }));
  } catch (error) {
    console.error("Error fetching OpenAlex sources:", error);
    return [];
  }
};

// Aggregate search across multiple APIs (CS/IT/AI focused)
export const searchAllSources = async (query: string, limit: number = 10): Promise<Paper[]> => {
  try {
    // Add CS/IT/AI context to query if not present
    const csQuery = query.toLowerCase().includes('computer') || 
                    query.toLowerCase().includes('software') ||
                    query.toLowerCase().includes('ai') ||
                    query.toLowerCase().includes('machine learning')
      ? query
      : `${query} computer science`;
    
    const [semanticResults, arxivResults, openAlexResults] = await Promise.allSettled([
      fetchSemanticScholarPapers(csQuery, limit),
      fetchArxivPapers(csQuery, limit),
      fetchOpenAlexWorks(csQuery, 1),
    ]);
    
    const allResults: Paper[] = [];
    
    if (semanticResults.status === 'fulfilled') allResults.push(...semanticResults.value.slice(0, limit));
    if (arxivResults.status === 'fulfilled') allResults.push(...arxivResults.value.slice(0, limit));
    if (openAlexResults.status === 'fulfilled') allResults.push(...openAlexResults.value.slice(0, limit));
    
    // Remove duplicates based on title similarity
    const uniqueResults = allResults.filter((paper, index, self) =>
      index === self.findIndex((p) => p.title.toLowerCase() === paper.title.toLowerCase())
    );
    
    // Sort by citation count (if available) and date
    return uniqueResults
      .sort((a, b) => (b.citationCount || 0) - (a.citationCount || 0))
      .slice(0, limit * 2);
  } catch (error) {
    console.error('Error searching all sources:', error);
    return [];
  }
};

// Get trending CS/IT/AI topics
export const getTrendingTopics = async (): Promise<string[]> => {
  const topics = [
    'Machine Learning',
    'Artificial Intelligence',
    'Deep Learning',
    'Natural Language Processing',
    'Computer Vision',
    'Cybersecurity',
    'Cloud Computing',
    'Blockchain',
    'Data Science',
    'Neural Networks',
    'Reinforcement Learning',
    'Edge Computing'
  ];
  
  return topics.sort(() => Math.random() - 0.5).slice(0, 8);
};

// Get statistics
export const getResearchStats = async () => {
  return {
    totalPapers: '2.5M+',
    totalJournals: '50K+',
    totalConferences: '15K+',
    activeCalls: '500+'
  };
};

export const searchAllAPIs = async (query: string) => {
  const [arxiv, crossref, openalex, dblp] = await Promise.all([
    fetchArxivPapers(query),
    fetchCrossRefPublications(query),
    fetchOpenAlexWorks(query),
    // Mock DBLP for now as we don't have a direct fetch function yet, or use a placeholder
    Promise.resolve([] as DBLPPublication[]) 
  ]);

  return {
    arxiv,
    crossref,
    openalex,
    dblp
  };
};
