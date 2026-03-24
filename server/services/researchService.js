import axios from "axios";
import xml2js from "xml2js";

// API Base URLs
const ARXIV_BASE_URL = "http://export.arxiv.org/api/query";
const OPENALEX_BASE_URL = "https://api.openalex.org";
const CROSSREF_BASE_URL = "https://api.crossref.org";
const SEMANTIC_SCHOLAR_BASE_URL = "https://api.semanticscholar.org/graph/v1";
const CORE_BASE_URL = "https://api.core.ac.uk/v3";
const DBLP_BASE_URL = "https://dblp.org/search/publ/api";
const GOOGLE_BOOKS_BASE_URL = "https://www.googleapis.com/books/v1/volumes";
const HUGGING_FACE_BASE_URL = "https://huggingface.co/api";

// ============= HELPER FUNCTIONS =============

const parseArxivXML = async (xmlText) => {
  try {
    const parser = new xml2js.Parser({ explicitArray: false });
    const result = await parser.parseStringPromise(xmlText);

    if (!result.feed || !result.feed.entry) {
      return [];
    }

    const entries = Array.isArray(result.feed.entry)
      ? result.feed.entry
      : [result.feed.entry];

    return entries.map((entry) => {
      const authors = entry.author
        ? (Array.isArray(entry.author) ? entry.author : [entry.author]).map(
            (a) => a.name,
          )
        : [];

      // Handle different category formats from arXiv API
      let category = "Computer Science";
      if (entry.category) {
        if (Array.isArray(entry.category)) {
          // If multiple categories, get the first one
          const firstCat = entry.category[0];
          category = firstCat?.$?.term || firstCat || "Computer Science";
        } else if (entry.category.$?.term) {
          // Standard format with $ attribute
          category = entry.category.$.term;
        } else if (typeof entry.category === "string") {
          // Direct string value
          category = entry.category;
        }
      }

      return {
        id: entry.id,
        title: entry.title?.replace(/\\s+/g, " ").trim() || "Untitled",
        authors,
        abstract: entry.summary?.replace(/\\s+/g, " ").trim() || "",
        publishedDate: entry.published
          ? new Date(entry.published).toLocaleDateString()
          : "N/A",
        category,
        url: entry.id,
        source: "arXiv",
      };
    });
  } catch (error) {
    console.error("Error parsing arXiv XML:", error);
    return [];
  }
};

// ============= ARXIV API =============

export const fetchArxivPapers = async (
  query = "artificial intelligence",
  maxResults = 20,
) => {
  try {
    const csCategories =
      "cat:cs.AI+OR+cat:cs.LG+OR+cat:cs.CV+OR+cat:cs.CL+OR+cat:cs.NE+OR+cat:cs.IT+OR+cat:cs.CR";
    const url = `${ARXIV_BASE_URL}?search_query=all:${encodeURIComponent(query)}+AND+(${csCategories})&start=0&max_results=${maxResults}&sortBy=submittedDate&sortOrder=descending`;

    const response = await axios.get(url);
    return await parseArxivXML(response.data);
  } catch (error) {
    console.error("Error fetching arXiv papers:", error.message);
    return [];
  }
};

// ============= SEMANTIC SCHOLAR API =============

export const fetchSemanticScholarPapers = async (
  query = "machine learning",
  limit = 20,
) => {
  try {
    const fields =
      "paperId,title,abstract,authors,year,citationCount,venue,externalIds,publicationDate,fieldsOfStudy,openAccessPdf";
    const url = `${SEMANTIC_SCHOLAR_BASE_URL}/paper/search?query=${encodeURIComponent(query)}&fields=${fields}&limit=${limit}&fieldsOfStudy=Computer Science&sort=publicationDate:desc`;

    const response = await axios.get(url, {
      headers: { Accept: "application/json" },
      timeout: 10000, // 10 second timeout
    });

    if (!response.data.data || response.data.data.length === 0) {
      return [];
    }

    // Filter for 2024+ papers
    return response.data.data
      .filter((paper) => {
        const year =
          paper.year || new Date(paper.publicationDate).getFullYear();
        return year >= 2024;
      })
      .map((paper) => ({
        id: paper.paperId || Math.random().toString(),
        title: paper.title || "Untitled",
        authors: paper.authors?.map((a) => a.name).filter(Boolean) || [],
        abstract: paper.abstract || paper.title || "",
        publishedDate: paper.publicationDate
          ? new Date(paper.publicationDate).toLocaleDateString()
          : paper.year?.toString() || "N/A",
        category: paper.fieldsOfStudy?.[0] || "Computer Science",
        url:
          paper.openAccessPdf?.url ||
          `https://www.semanticscholar.org/paper/${paper.paperId}`,
        source: "Semantic Scholar",
        doi: paper.externalIds?.DOI,
        citationCount: paper.citationCount || 0,
        venue: paper.venue,
      }));
  } catch (error) {
    // Handle rate limiting specifically
    if (error.response?.status === 429) {
      console.warn(
        "⚠️  Semantic Scholar rate limit hit. Try again in a few seconds or use other sources (arXiv, OpenAlex).",
      );
      return [];
    }
    console.error("Error fetching Semantic Scholar papers:", error.message);
    return [];
  }
};

// ============= CORE API =============

export const fetchCOREPapers = async (
  query = "computer science",
  limit = 20,
) => {
  try {
    const url = `${CORE_BASE_URL}/search/works?q=${encodeURIComponent(query + " computer science")}&limit=${limit}`;

    const response = await axios.get(url);

    if (!response.data.results || response.data.results.length === 0) {
      return [];
    }

    return response.data.results.map((paper) => ({
      id: paper.id || Math.random().toString(),
      title: paper.title || "Untitled",
      authors: paper.authors?.map((a) => a.name || a).filter(Boolean) || [],
      abstract: paper.abstract || paper.description || "",
      publishedDate: paper.publishedDate
        ? new Date(paper.publishedDate).toLocaleDateString()
        : paper.yearPublished?.toString() || "N/A",
      category: "Computer Science",
      url:
        paper.downloadUrl ||
        paper.sourceFulltextUrls?.[0] ||
        `https://core.ac.uk/works/${paper.id}`,
      source: "CORE",
      doi: paper.doi,
    }));
  } catch (error) {
    console.error("Error fetching CORE papers:", error.message);
    return [];
  }
};

// ============= OPENALEX API =============

export const fetchOpenAlexWorks = async (
  query = "artificial intelligence",
  page = 1,
) => {
  try {
    const url = `${OPENALEX_BASE_URL}/works?search=${encodeURIComponent(query)}&filter=concepts.id:C41008148,from_publication_date:2025-01-01&per-page=20&page=${page}&sort=publication_date:desc`;

    const response = await axios.get(url);

    if (!response.data.results || response.data.results.length === 0) {
      return [];
    }

    return response.data.results.map((work) => ({
      id: work.id,
      title: work.title || "Untitled",
      authors:
        work.authorships?.map((a) => a.author?.display_name).filter(Boolean) ||
        [],
      abstract: work.abstract || work.title || "",
      publishedDate: work.publication_date
        ? new Date(work.publication_date).toLocaleDateString()
        : "N/A",
      category:
        work.primary_topic?.display_name || work.type || "Computer Science",
      url: work.doi ? `https://doi.org/${work.doi}` : work.id,
      source: "OpenAlex",
      doi: work.doi,
      citationCount: work.cited_by_count || 0,
    }));
  } catch (error) {
    console.error("Error fetching OpenAlex works:", error.message);
    return [];
  }
};

// ============= CROSSREF API =============

export const fetchCrossRefJournals = async (
  query = "computer science",
  rows = 20,
) => {
  try {
    const url = `${CROSSREF_BASE_URL}/journals?query=${encodeURIComponent(query + " computer science technology")}&rows=${rows}`;

    const response = await axios.get(url);

    if (
      !response.data.message?.items ||
      response.data.message.items.length === 0
    ) {
      return [];
    }

    return response.data.message.items.map((journal) => {
      const directUrl =
        journal.URL ||
        (journal.ISSN?.[0]
          ? `https://portal.issn.org/resource/ISSN/${journal.ISSN[0]}`
          : null) ||
        `https://www.crossref.org/search/journals?q=${encodeURIComponent(journal.title)}`;

      return {
        id: journal.ISSN?.[0] || Math.random().toString(),
        title: journal.title || "Unknown Journal",
        publisher: journal.publisher || "Unknown Publisher",
        issn: journal.ISSN?.[0],
        subjects: journal.subjects || ["Computer Science"],
        url: directUrl,
        openAccess: false,
      };
    });
  } catch (error) {
    console.error("Error fetching CrossRef journals:", error.message);
    return [];
  }
};

export const fetchCrossRefPublications = async (
  query = "computer science",
  rows = 20,
) => {
  try {
    const url = `${CROSSREF_BASE_URL}/works?query=${encodeURIComponent(query + " computer science artificial intelligence")}&rows=${rows}&sort=published&order=desc`;

    const response = await axios.get(url);

    if (
      !response.data.message?.items ||
      response.data.message.items.length === 0
    ) {
      return [];
    }

    return response.data.message.items.map((work) => ({
      id: work.DOI || Math.random().toString(),
      title: work.title?.[0] || "Untitled",
      authors:
        work.author
          ?.map((a) => `${a.given || ""} ${a.family || ""}`)
          .filter(Boolean) || [],
      abstract: work.abstract || work.title?.[0] || "",
      publishedDate: work.published?.["date-parts"]?.[0]
        ? new Date(
            work.published["date-parts"][0].join("-"),
          ).toLocaleDateString()
        : "N/A",
      category: work.type || "Research Paper",
      url: work.URL || `https://doi.org/${work.DOI}`,
      source: "CrossRef",
      doi: work.DOI,
    }));
  } catch (error) {
    console.error("Error fetching CrossRef publications:", error.message);
    return [];
  }
};

// ============= DBLP API =============

export const fetchDblpPublications = async (
  query = "computer science",
  limit = 20,
) => {
  try {
    const url = `${DBLP_BASE_URL}?q=${encodeURIComponent(query)}&h=${limit}&format=json`;

    const response = await axios.get(url, {
      headers: { Accept: "application/json" },
      timeout: 10000,
    });

    const hits = response.data?.result?.hits?.hit || [];
    const normalizedHits = Array.isArray(hits) ? hits : [hits];

    return normalizedHits
      .map((hit, index) => {
        const info = hit?.info || {};

        const authorValue = info.authors?.author;
        const authors = Array.isArray(authorValue)
          ? authorValue.map((author) =>
              typeof author === "string"
                ? author
                : author?.text || author?.name,
            )
          : authorValue
            ? [
                typeof authorValue === "string"
                  ? authorValue
                  : authorValue?.text || authorValue?.name,
              ]
            : [];

        const publicationYear = info.year || "";
        const venue = info.venue || info.type || "Computer Science";
        const doi = typeof info.doi === "string" ? info.doi : undefined;
        const urlValue = info.url || (doi ? `https://doi.org/${doi}` : null);

        return {
          id: `${info.key || "dblp"}:${index}`,
          title: info.title || "Untitled",
          authors: authors.filter(Boolean),
          abstract: `${venue}${publicationYear ? ` (${publicationYear})` : ""}`,
          publishedDate: publicationYear || "N/A",
          category: venue,
          url:
            urlValue ||
            `https://dblp.org/search?q=${encodeURIComponent(query)}`,
          source: "DBLP",
          doi,
          venue,
        };
      })
      .filter((paper) => paper.title && paper.url);
  } catch (error) {
    console.error("Error fetching DBLP publications:", error.message);
    return [];
  }
};

// ============= GOOGLE BOOKS API =============

export const fetchGoogleBooks = async (
  query = "computer science",
  limit = 20,
) => {
  try {
    const url = `${GOOGLE_BOOKS_BASE_URL}?q=${encodeURIComponent(`${query} subject:computer science`)}&maxResults=${limit}&orderBy=newest&printType=books`;

    const response = await axios.get(url);
    return response.data.items || [];
  } catch (error) {
    console.error("Error fetching Google Books:", error.message);
    return [];
  }
};

// ============= HUGGING FACE API =============

export const fetchHuggingFaceModels = async (
  query = "text-generation",
  limit = 20,
) => {
  try {
    const url = `${HUGGING_FACE_BASE_URL}/models?search=${encodeURIComponent(query)}&limit=${limit}&sort=downloads&direction=-1&full=true`;

    const response = await axios.get(url);
    return response.data.map((model) => ({
      id: model._id,
      modelId: model.modelId,
      author: model.author,
      lastModified: model.lastModified,
      downloads: model.downloads,
      likes: model.likes,
      pipeline_tag: model.pipeline_tag,
      tags: model.tags,
    }));
  } catch (error) {
    console.error("Error fetching Hugging Face models:", error.message);
    return [];
  }
};

// ============= PROJECT OPPORTUNITIES =============

export const fetchProjectOpportunities = async (query = "conference") => {
  try {
    const openAlexUrl = `${OPENALEX_BASE_URL}/works?search=${encodeURIComponent(query)}&filter=from_publication_date:2025-01-01,concepts.id:C41008148&per-page=10&sort=publication_date:desc`;
    const crossRefUrl = `${CROSSREF_BASE_URL}/works?query=${encodeURIComponent(query)}+computer+science+conference&rows=10&sort=issued&order=desc&filter=from-pub-date:2025`;

    const [openAlexRes, crossRefRes] = await Promise.allSettled([
      axios.get(openAlexUrl),
      axios.get(crossRefUrl),
    ]);

    const opportunities = [];

    if (openAlexRes.status === "fulfilled" && openAlexRes.value.data.results) {
      opportunities.push(
        ...openAlexRes.value.data.results.map((work) => ({
          id: work.id,
          title: work.title,
          organization:
            work.primary_location?.source?.display_name ||
            "Unknown Organization",
          type: work.type || "Conference",
          date: work.publication_date,
          description: work.abstract_inverted_index
            ? "Abstract available"
            : "No description available",
          url: work.doi ? `https://doi.org/${work.doi}` : work.id,
          source: "OpenAlex",
        })),
      );
    }

    if (
      crossRefRes.status === "fulfilled" &&
      crossRefRes.value.data.message?.items
    ) {
      opportunities.push(
        ...crossRefRes.value.data.message.items.map((work) => ({
          id: work.DOI,
          title: work.title?.[0] || "Untitled",
          organization: work.publisher || "Unknown Publisher",
          type: work.type || "Conference Paper",
          date: work.issued?.["date-parts"]?.[0]?.join("-") || "2025",
          description: "Publication/Conference Record",
          url: work.URL || `https://doi.org/${work.DOI}`,
          source: "CrossRef",
        })),
      );
    }

    return opportunities;
  } catch (error) {
    console.error("Error fetching project opportunities:", error.message);
    return [];
  }
};

// ============= OPENALEX SOURCES =============

export const fetchOpenAlexSources = async (
  query = "computer science",
  type = null,
  limit = 20,
) => {
  try {
    let url = `${OPENALEX_BASE_URL}/sources?search=${encodeURIComponent(query)}&per-page=${limit}`;

    if (type) {
      url += `&filter=type:${type}`;
    }

    const response = await axios.get(url);

    const results = response.data.results || [];
    return results.map((source) => ({
      id: source.id,
      displayName: source.display_name,
      type: source.type,
      hostOrganization: source.host_organization_name,
      countryCode: source.country_code,
      url: source.homepage_url || source.url,
      worksCount: source.works_count,
      citedByCount: source.cited_by_count,
    }));
  } catch (error) {
    console.error("Error fetching OpenAlex sources:", error.message);
    return [];
  }
};

// ============= AGGREGATE SEARCH =============

export const searchAllSources = async (query, limit = 10) => {
  try {
    const csQuery =
      query.toLowerCase().includes("computer") ||
      query.toLowerCase().includes("software") ||
      query.toLowerCase().includes("ai") ||
      query.toLowerCase().includes("machine learning")
        ? query
        : `${query} computer science`;

    const [
      semanticResults,
      arxivResults,
      openAlexResults,
      coreResults,
      crossRefResults,
      dblpResults,
    ] = await Promise.allSettled([
      fetchSemanticScholarPapers(csQuery, limit),
      fetchArxivPapers(csQuery, limit),
      fetchOpenAlexWorks(csQuery, 1),
      fetchCOREPapers(csQuery, limit),
      fetchCrossRefPublications(csQuery, limit),
      fetchDblpPublications(csQuery, limit),
    ]);

    const allResults = [];

    if (semanticResults.status === "fulfilled")
      allResults.push(...semanticResults.value.slice(0, limit));
    if (arxivResults.status === "fulfilled")
      allResults.push(...arxivResults.value.slice(0, limit));
    if (openAlexResults.status === "fulfilled")
      allResults.push(...openAlexResults.value.slice(0, limit));
    if (coreResults.status === "fulfilled")
      allResults.push(...coreResults.value.slice(0, limit));
    if (crossRefResults.status === "fulfilled")
      allResults.push(...crossRefResults.value.slice(0, limit));
    if (dblpResults.status === "fulfilled")
      allResults.push(...dblpResults.value.slice(0, limit));

    // Remove duplicates based on title
    const uniqueResults = allResults.filter(
      (paper, index, self) =>
        index ===
        self.findIndex(
          (p) => p.title.toLowerCase() === paper.title.toLowerCase(),
        ),
    );

    // Sort by citation count and date
    return uniqueResults
      .sort((a, b) => (b.citationCount || 0) - (a.citationCount || 0))
      .slice(0, limit * 2);
  } catch (error) {
    console.error("Error searching all sources:", error.message);
    return [];
  }
};

// ============= TRENDING & STATS =============

export const getTrendingTopics = async () => {
  const topics = [
    "Machine Learning",
    "Artificial Intelligence",
    "Deep Learning",
    "Natural Language Processing",
    "Computer Vision",
    "Cybersecurity",
    "Cloud Computing",
    "Blockchain",
    "Data Science",
    "Neural Networks",
    "Reinforcement Learning",
    "Edge Computing",
  ];

  return topics.sort(() => Math.random() - 0.5).slice(0, 8);
};

export const getResearchStats = async () => {
  return {
    totalPapers: "2.5M+",
    totalJournals: "50K+",
    totalConferences: "15K+",
    activeCalls: "500+",
  };
};

export const searchAllAPIs = async (query) => {
  const [arxiv, crossref, openalex, dblp, semantic, core] = await Promise.all([
    fetchArxivPapers(query),
    fetchCrossRefPublications(query),
    fetchOpenAlexWorks(query),
    fetchDblpPublications(query),
    fetchSemanticScholarPapers(query),
    fetchCOREPapers(query),
  ]);

  return {
    arxiv,
    crossref,
    openalex,
    dblp,
    semantic,
    core,
  };
};
