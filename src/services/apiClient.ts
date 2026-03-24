// API Client for ResearchSphere Frontend
// This replaces direct API calls with calls to our Express backend

import type { Paper } from "./api-types";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export interface HarvestItem {
  id: string;
  kind: "conference" | "journal" | "opportunity" | string;
  subtype?:
    | "conference"
    | "journal"
    | "phd"
    | "postdoc"
    | "internship"
    | "book-chapter"
    | string;
  title: string;
  summary?: string | null;
  location?: string | null;
  eventDate?: string | null;
  deadline?: string | null;
  organization?: string | null;
  url: string;
  sourceId?: string;
  sourceName?: string;
  tags?: string[];
  score?: number;
}

export interface HarvestSearchParams {
  query?: string;
  kind?: string;
  subtype?: string;
  sourceId?: string;
  location?: string;
  year?: number;
  fromYear?: number;
  includePast?: boolean;
  limit?: number;
  page?: number;
}

export interface HarvestSearchResponse {
  data: HarvestItem[];
  meta: {
    total: number;
    page: number;
    limit: number;
    updatedAt?: string;
  };
}

export interface AssistantAnswer {
  text: string;
  results: HarvestItem[];
  parsed?: {
    kind?: string;
    subtype?: string;
    location?: string;
    topicQuery?: string;
    timeWindow?: {
      year?: number;
      monthIndex?: number;
      part?: string;
    };
    filters?: Record<string, unknown>;
  };
  suggestions?: string[];
  meta?: {
    total: number;
    updatedAt?: string;
  };
}

export interface AssistantContext {
  lastParsed?: AssistantAnswer["parsed"];
}

export interface CollaborationRequestPayload {
  name: string;
  email: string;
  institution: string;
  researchAreas: string;
  projectDetails?: string;
}

export interface JournalMatchItem {
  provider: "springer" | "elsevier" | string;
  title: string;
  sourceUrl?: string | null;
  submissionLink?: string | null;
  guideForAuthors?: string | null;
  acronym?: string | null;
  issn?: string | null;
  publishingModel?: string | null;
  openAccessType?: string | null;
  impactFactor?: number | null;
  citeScore?: number | null;
  decisionDays?: number | null;
  acceptanceDays?: number | null;
  subjectAreas?: string[];
  articleTypes?: string[];
  scope?: string | null;
  scopeSnippet?: string | null;
  editorInChief?: string | null;
  goldOpenAccessFee?: number | null;
  goldOpenAccessCurrency?: string | null;
  coverImage?: string | null;
  hasAgreements?: boolean | null;
  topicSeeds?: string[];
  score?: number;
  matchPercent?: number;
  matchReasons?: string[];
  overlapTokens?: string[];
  matchedPhrases?: string[];
}

export interface JournalMatchResponse {
  data: JournalMatchItem[];
  meta: {
    topics: string[];
    totalCorpus: number;
    mode: "keyword" | "abstract";
  };
  count: number;
}

// Helper function for API calls
const apiCall = async (endpoint, params = {}) => {
  try {
    const queryString = new URLSearchParams(params).toString();
    const url = `${API_BASE_URL}${endpoint}${queryString ? `?${queryString}` : ""}`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error(`Error calling ${endpoint}:`, error);
    return [];
  }
};

// ============= PAPERS & PUBLICATIONS =============

export const fetchArxivPapers = async (
  query = "artificial intelligence",
  maxResults = 20,
): Promise<Paper[]> => {
  return apiCall("/papers/arxiv", { query, maxResults });
};

export const fetchSemanticScholarPapers = async (
  query = "machine learning",
  limit = 20,
): Promise<Paper[]> => {
  return apiCall("/papers/semantic-scholar", { query, limit });
};

export const fetchCOREPapers = async (
  query = "computer science",
  limit = 20,
): Promise<Paper[]> => {
  return apiCall("/papers/core", { query, limit });
};

export const fetchOpenAlexWorks = async (
  query = "artificial intelligence",
  page = 1,
): Promise<Paper[]> => {
  return apiCall("/papers/openalex", { query, page });
};

export const fetchCrossRefPublications = async (
  query = "computer science",
  rows = 20,
): Promise<Paper[]> => {
  return apiCall("/papers/crossref", { query, rows });
};

export const fetchDblpPublications = async (
  query = "computer science",
  limit = 20,
): Promise<Paper[]> => {
  return apiCall("/papers/dblp", { query, limit });
};

export const searchAllSources = async (
  query: string,
  limit = 10,
): Promise<Paper[]> => {
  return apiCall("/papers/search", { query, limit });
};

// ============= JOURNALS =============

export const fetchCrossRefJournals = async (
  query = "computer science",
  rows = 20,
) => {
  return apiCall("/journals", { query, rows });
};

export const matchJournals = async ({
  query,
  mode = "keyword",
  limit = 20,
  provider = "all",
}: {
  query: string;
  mode?: "keyword" | "abstract";
  limit?: number;
  provider?: "all" | "springer" | "elsevier";
}): Promise<JournalMatchResponse> => {
  const response = await fetch(
    `${API_BASE_URL}/journals/match?${new URLSearchParams({
      query,
      mode,
      limit: String(limit),
      provider,
    }).toString()}`,
  );

  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }

  return (await response.json()) as JournalMatchResponse;
};

// ============= CONFERENCES =============

export const fetchOpenAlexSources = async (
  query = "computer science",
  type = null,
  limit = 20,
) => {
  const params = { query, limit };
  if (type) params.type = type;
  return apiCall("/conferences", params);
};

// ============= BOOKS =============

export const fetchGoogleBooks = async (
  query = "computer science",
  limit = 20,
) => {
  return apiCall("/books", { query, limit });
};

// ============= HUGGING FACE MODELS =============

export const fetchHuggingFaceModels = async (
  query = "text-generation",
  limit = 20,
) => {
  return apiCall("/models/huggingface", { query, limit });
};

// ============= PROJECT OPPORTUNITIES =============

export const fetchProjectOpportunities = async (query = "conference") => {
  return apiCall("/projects/opportunities", { query });
};

// ============= TRENDING & STATS =============

export const getTrendingTopics = async () => {
  return apiCall("/trending");
};

export const getResearchStats = async () => {
  return apiCall("/stats");
};

export const searchAllAPIs = async (query) => {
  return apiCall("/search/all", { query });
};

export const submitCollaborationRequest = async (
  payload: CollaborationRequestPayload,
) => {
  const response = await fetch(`${API_BASE_URL}/collaboration/submit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const responseBody = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message =
      responseBody?.detail || responseBody?.error || "Unable to send request";
    throw new Error(message);
  }

  return responseBody;
};

// ============= WEBSITE HARVEST (LOCAL CACHE) =============

export const searchHarvestedData = async (params = {}) => {
  const queryParams = Object.fromEntries(
    Object.entries(params).filter(
      ([, value]) => value !== undefined && value !== null && value !== "",
    ),
  );

  return (await apiCall("/harvest/search", queryParams)) as HarvestItem[];
};

export const searchHarvestedDataWithMeta = async (
  params: HarvestSearchParams = {},
): Promise<HarvestSearchResponse> => {
  const queryParams = Object.fromEntries(
    Object.entries(params).filter(
      ([, value]) => value !== undefined && value !== null && value !== "",
    ),
  );

  const queryString = new URLSearchParams(
    Object.entries(queryParams).reduce<Record<string, string>>(
      (acc, [key, value]) => {
        acc[key] = String(value);
        return acc;
      },
      {},
    ),
  ).toString();

  const response = await fetch(
    `${API_BASE_URL}/harvest/search${queryString ? `?${queryString}` : ""}`,
  );

  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }

  return (await response.json()) as HarvestSearchResponse;
};

export const getHarvestStatus = async () => {
  const response = await fetch(`${API_BASE_URL}/harvest/status`);
  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }
  const data = await response.json();
  return data.data;
};

export const refreshHarvestData = async (force = false) => {
  const query = force ? "?force=true" : "";
  const response = await fetch(`${API_BASE_URL}/harvest/refresh${query}`, {
    method: "POST",
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }

  return response.json();
};

export const queryResearchAssistant = async (
  query: string,
  context?: AssistantContext,
): Promise<AssistantAnswer> => {
  const response = await fetch(`${API_BASE_URL}/assistant/query`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, context }),
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }

  const body = await response.json();
  return body.data as AssistantAnswer;
};

// Export all types from the original api.ts for compatibility
export * from "./api-types";
