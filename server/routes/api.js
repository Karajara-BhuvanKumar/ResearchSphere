import express from "express";
import * as researchService from "../services/researchService.js";
import * as journalMatcherService from "../services/journalMatcherService.js";
import collaborationRoutes from "./collaboration.js";
import harvestRoutes from "./harvest.js";
import { answerAssistantQuery } from "../services/assistantService.js";

const router = express.Router();

// Collaboration routes
router.use("/collaboration", collaborationRoutes);
router.use("/harvest", harvestRoutes);

// ============= PAPERS & PUBLICATIONS =============

// Search papers across all sources
router.get("/papers/search", async (req, res, next) => {
  try {
    const { query = "artificial intelligence", limit = 10 } = req.query;
    const results = await researchService.searchAllSources(
      query,
      parseInt(limit),
    );
    res.json({ success: true, data: results, count: results.length });
  } catch (error) {
    next(error);
  }
});

// arXiv papers
router.get("/papers/arxiv", async (req, res, next) => {
  try {
    const { query = "artificial intelligence", maxResults = 20 } = req.query;
    const papers = await researchService.fetchArxivPapers(
      query,
      parseInt(maxResults),
    );
    res.json({ success: true, data: papers, count: papers.length });
  } catch (error) {
    next(error);
  }
});

// Semantic Scholar papers
router.get("/papers/semantic-scholar", async (req, res, next) => {
  try {
    const { query = "machine learning", limit = 20 } = req.query;
    const papers = await researchService.fetchSemanticScholarPapers(
      query,
      parseInt(limit),
    );
    res.json({ success: true, data: papers, count: papers.length });
  } catch (error) {
    next(error);
  }
});

// CORE papers
router.get("/papers/core", async (req, res, next) => {
  try {
    const { query = "computer science", limit = 20 } = req.query;
    const papers = await researchService.fetchCOREPapers(
      query,
      parseInt(limit),
    );
    res.json({ success: true, data: papers, count: papers.length });
  } catch (error) {
    next(error);
  }
});

// OpenAlex works
router.get("/papers/openalex", async (req, res, next) => {
  try {
    const { query = "artificial intelligence", page = 1 } = req.query;
    const papers = await researchService.fetchOpenAlexWorks(
      query,
      parseInt(page),
    );
    res.json({ success: true, data: papers, count: papers.length });
  } catch (error) {
    next(error);
  }
});

// CrossRef publications
router.get("/papers/crossref", async (req, res, next) => {
  try {
    const { query = "computer science", rows = 20 } = req.query;
    const papers = await researchService.fetchCrossRefPublications(
      query,
      parseInt(rows),
    );
    res.json({ success: true, data: papers, count: papers.length });
  } catch (error) {
    next(error);
  }
});

// DBLP publications
router.get("/papers/dblp", async (req, res, next) => {
  try {
    const { query = "computer science", limit = 20 } = req.query;
    const papers = await researchService.fetchDblpPublications(
      query,
      parseInt(limit),
    );
    res.json({ success: true, data: papers, count: papers.length });
  } catch (error) {
    next(error);
  }
});

// ============= JOURNALS =============

router.get("/journals", async (req, res, next) => {
  try {
    const { query = "computer science", rows = 20 } = req.query;
    const journals = await researchService.fetchCrossRefJournals(
      query,
      parseInt(rows),
    );
    res.json({ success: true, data: journals, count: journals.length });
  } catch (error) {
    next(error);
  }
});

router.get("/journals/match", async (req, res, next) => {
  try {
    const {
      query = "",
      mode = "keyword",
      limit = 20,
      provider = "all",
    } = req.query;

    const result = await journalMatcherService.searchJournalCorpus({
      query: String(query),
      mode: mode === "abstract" ? "abstract" : "keyword",
      limit: Number.parseInt(limit, 10) || 20,
      provider: provider === "springer" || provider === "elsevier" ? provider : "all",
    });

    res.json({
      success: true,
      data: result.items,
      meta: {
        topics: result.topics,
        totalCorpus: result.totalCorpus,
        mode: result.mode,
      },
      count: result.items.length,
    });
  } catch (error) {
    next(error);
  }
});

// ============= CONFERENCES =============

router.get("/conferences", async (req, res, next) => {
  try {
    const { query = "computer science", limit = 20 } = req.query;
    const conferences = await researchService.fetchOpenAlexSources(
      query,
      "conference",
      parseInt(limit),
    );
    res.json({ success: true, data: conferences, count: conferences.length });
  } catch (error) {
    next(error);
  }
});

// ============= BOOKS =============

router.get("/books", async (req, res, next) => {
  try {
    const { query = "computer science", limit = 20 } = req.query;
    const books = await researchService.fetchGoogleBooks(
      query,
      parseInt(limit),
    );
    res.json({ success: true, data: books, count: books.length });
  } catch (error) {
    next(error);
  }
});

// ============= HUGGING FACE MODELS =============

router.get("/models/huggingface", async (req, res, next) => {
  try {
    const { query = "text-generation", limit = 20 } = req.query;
    const models = await researchService.fetchHuggingFaceModels(
      query,
      parseInt(limit),
    );
    res.json({ success: true, data: models, count: models.length });
  } catch (error) {
    next(error);
  }
});

// ============= PROJECT OPPORTUNITIES =============

router.get("/projects/opportunities", async (req, res, next) => {
  try {
    const { query = "conference" } = req.query;
    const opportunities =
      await researchService.fetchProjectOpportunities(query);
    res.json({
      success: true,
      data: opportunities,
      count: opportunities.length,
    });
  } catch (error) {
    next(error);
  }
});

// ============= SOURCES (Conferences & Journals) =============

router.get("/sources", async (req, res, next) => {
  try {
    const { query = "computer science", type = null, limit = 20 } = req.query;
    const validType = type === "conference" || type === "journal" ? type : null;
    const sources = await researchService.fetchOpenAlexSources(
      query,
      validType,
      parseInt(limit),
    );
    res.json({ success: true, data: sources, count: sources.length });
  } catch (error) {
    next(error);
  }
});

// ============= TRENDING & STATS =============

router.get("/trending", async (req, res, next) => {
  try {
    const topics = await researchService.getTrendingTopics();
    res.json({ success: true, data: topics });
  } catch (error) {
    next(error);
  }
});

router.get("/stats", async (req, res, next) => {
  try {
    const stats = await researchService.getResearchStats();
    res.json({ success: true, data: stats });
  } catch (error) {
    next(error);
  }
});

// ============= COMBINED SEARCH =============

router.get("/search/all", async (req, res, next) => {
  try {
    const { query = "artificial intelligence" } = req.query;
    const results = await researchService.searchAllAPIs(query);
    res.json({ success: true, data: results });
  } catch (error) {
    next(error);
  }
});

// ============= RESEARCH ASSISTANT =============

router.post("/assistant/query", async (req, res, next) => {
  try {
    const query = String(req.body?.query || "").trim();
    const context = req.body?.context || {};

    const response = await answerAssistantQuery(query, context);
    res.json({ success: true, data: response });
  } catch (error) {
    next(error);
  }
});

export default router;
