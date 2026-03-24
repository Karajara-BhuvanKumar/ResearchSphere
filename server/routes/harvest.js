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
      query,
      kind,
      subtype,
      sourceId,
      location,
      year,
      fromYear,
      includePast,
      limit,
      page,
    } = req.query;
    const result = await searchHarvestData({
      query,
      kind,
      subtype,
      sourceId,
      location,
      year,
      fromYear,
      includePast,
      limit,
      page,
    });

    res.json({
      success: true,
      data: result.results,
      meta: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        updatedAt: result.updatedAt,
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
