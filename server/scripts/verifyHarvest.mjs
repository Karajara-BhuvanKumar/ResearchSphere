import { refreshHarvestData } from "../services/harvest/harvestService.js";

const result = await refreshHarvestData({ force: true });

const counts = result.items.reduce((accumulator, item) => {
  accumulator[item.kind] = (accumulator[item.kind] ?? 0) + 1;

  const subtype = item.subtype ?? "unknown";
  const key = `${item.kind}:${subtype}`;
  accumulator[key] = (accumulator[key] ?? 0) + 1;

  return accumulator;
}, {});

const errors = (result.sourceReports ?? [])
  .filter((report) => report.status === "error")
  .map((report) => ({
    sourceId: report.sourceId,
    fallbackCount: report.fallbackCount ?? 0,
    error: report.error,
  }));

console.log(
  JSON.stringify(
    {
      refreshed: result.refreshed,
      updatedAt: result.updatedAt,
      totalItems: result.items.length,
      counts,
      errorCount: errors.length,
      errors: errors.slice(0, 20),
    },
    null,
    2,
  ),
);
