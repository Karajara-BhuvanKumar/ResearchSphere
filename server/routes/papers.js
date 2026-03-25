import express from "express";
import {
  getArxivPapers,
  getOpenAlexWorks,
  getCrossRefPublications,
  getSemanticScholarPapers,
} from "../controllers/papersController.js";

const router = express.Router();

// GET /api/papers/arxiv
router.get("/arxiv", getArxivPapers);

// GET /api/papers/openalex
router.get("/openalex", getOpenAlexWorks);

// GET /api/papers/crossref
router.get("/crossref", getCrossRefPublications);

// GET /api/papers/semantic
router.get("/semantic", getSemanticScholarPapers);

export default router;