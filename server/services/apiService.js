import axios from "axios";
import xml2js from "xml2js";

// API Base URLs
const ARXIV_BASE_URL = "http://export.arxiv.org/api/query";
const OPENALEX_BASE_URL = "https://api.openalex.org";
const CROSSREF_BASE_URL = "https://api.crossref.org";
const SEMANTIC_SCHOLAR_BASE_URL = "https://api.semanticscholar.org/graph/v1";

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
