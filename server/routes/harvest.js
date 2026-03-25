import express from "express";
import {
  getHarvestStatus,
  refreshHarvestData,
  searchHarvestData,
} from "../services/harvest/harvestService.js";

const router = express.Router();

router.get("/search", async (req, res, next) => {
  try {
    const {
      query = "",
      kind,
      subtype,
      sourceId,
      location,
      year,
      fromYear,
      includePast,
      limit = "20",
      page,
    } = req.query;
    
    // 1. Fetch from local scraped data
    const localResult = await searchHarvestData({
      query, kind, subtype, sourceId, location, year, fromYear, includePast, limit, page,
    });
    
    let combinedResults = [...localResult.results];
    const limitNum = parseInt(limit, 10) || 20;

    // 2. Fetch from existing APIs (OpenAlex)
    try {
      const axios = await import("axios").then(m => m.default);
      let openAlexUrl = "";
      
      if (kind === "journal" || kind === "conference") {
        // Fetch Sources
        openAlexUrl = `https://api.openalex.org/sources?per-page=${limitNum}`;
        if (query) openAlexUrl += `&search=${encodeURIComponent(query)}`;
        openAlexUrl += `&filter=type:${kind}`;
        
        const response = await axios.get(openAlexUrl);
        const apiItems = (response.data.results || []).map(source => ({
          id: source.id,
          kind: kind,
          title: source.display_name || "Unknown Title",
          summary: source.summary_stats ? `Works count: ${source.summary_stats.works_count}` : null,
          location: source.country_code,
          organization: source.host_organization_name,
          url: source.homepage_url || source.id,
          sourceId: "openalex",
          sourceName: "OpenAlex",
          score: source.cited_by_count || 1,
        }));
        combinedResults = [...combinedResults, ...apiItems].slice(0, limitNum);
      } else {
        // Fetch Works
        openAlexUrl = `https://api.openalex.org/works?per-page=${limitNum}`;
        if (query) openAlexUrl += `&search=${encodeURIComponent(query)}`;
        if (year) openAlexUrl += `&filter=publication_year:${year}`;
        
        const response = await axios.get(openAlexUrl);
        const apiItems = (response.data.results || []).map(work => ({
          id: work.id,
          kind: 'opportunity',
          title: work.title || "Untitled Work",
          summary: 'Research publication',
          location: work.primary_location?.source?.country_code,
          organization: work.primary_location?.source?.host_organization_name,
          url: work.doi || work.id,
          sourceId: "openalex",
          sourceName: "OpenAlex",
          score: work.cited_by_count || 1,
        }));
        combinedResults = [...combinedResults, ...apiItems].slice(0, limitNum);
      }
    } catch (apiErr) {
      console.error("OpenAlex harvest fetch error:", apiErr.message);
    }

    res.json({
      success: true,
      data: combinedResults,
      meta: {
        total: combinedResults.length,
        page: parseInt(page, 10) || 1,
        limit: limitNum,
        updatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
});

router.post("/refresh", async (req, res, next) => {
  try {
    const force = String(req.query.force || "false").toLowerCase() === "true";
    const result = await refreshHarvestData({ force });
    res.json({
      success: true,
      message: result.refreshed
        ? "Harvest completed and cache updated."
        : "Cache is fresh; refresh skipped.",
      data: {
        refreshed: result.refreshed,
        updatedAt: result.updatedAt,
        itemCount: result.items?.length || 0,
        sourceReports: result.sourceReports || [],
      },
    });
  } catch (error) {
    next(error);
  }
});

router.get("/status", async (req, res, next) => {
  try {
    const status = await getHarvestStatus();
    res.json({ success: true, data: status });
  } catch (error) {
    next(error);
  }
});

export default router;
