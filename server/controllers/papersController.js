import {
  fetchArxivPapers,
  fetchOpenAlexWorks,
  fetchCrossRefPublications,
  fetchSemanticScholarPapers,
} from "../services/apiService.js";

// Controller for arXiv papers
export const getArxivPapers = async (req, res, next) => {
  try {
    const { query = "artificial intelligence", maxResults = 20 } = req.query;
    const papers = await fetchArxivPapers(query, parseInt(maxResults));
    res.json({ success: true, data: papers, count: papers.length });
  } catch (error) {
    next(error);
  }
};

// Controller for OpenAlex works
export const getOpenAlexWorks = async (req, res, next) => {
  try {
    const { query = "artificial intelligence", page = 1 } = req.query;
    const works = await fetchOpenAlexWorks(query, parseInt(page));
    res.json({ success: true, data: works, count: works.length });
  } catch (error) {
    next(error);
  }
};

// Controller for CrossRef publications
export const getCrossRefPublications = async (req, res, next) => {
  try {
    const { query = "computer science", rows = 20 } = req.query;
    const publications = await fetchCrossRefPublications(query, parseInt(rows));
    res.json({ success: true, data: publications, count: publications.length });
  } catch (error) {
    next(error);
  }
};

// Controller for Semantic Scholar papers
export const getSemanticScholarPapers = async (req, res, next) => {
  try {
    const { query = "machine learning", limit = 20 } = req.query;
    const papers = await fetchSemanticScholarPapers(query, parseInt(limit));
    res.json({ success: true, data: papers, count: papers.length });
  } catch (error) {
    next(error);
  }
};