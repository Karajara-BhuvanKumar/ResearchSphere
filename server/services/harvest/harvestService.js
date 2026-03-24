import { readStore, writeStore, getStorePath } from "./store.js";
import { SOURCE_REGISTRY, runSourceHarvester } from "./sources.js";

const REFRESH_TTL_MS = 1000 * 60 * 60 * 6;
const MAX_RESULTS_DEFAULT = 50;
const MAX_RESULTS_HARD_LIMIT = 200;
const HARVEST_CONCURRENCY = 6;

let refreshPromise = null;

const nowIso = () => new Date().toISOString();

const normalizeKey = (item) =>
  `${(item.kind || "").toLowerCase()}|${(item.title || "").toLowerCase()}|${(item.url || "").toLowerCase()}`;

const isIndiaRelevantItem = (item) => {
  const corpus = [
    item.title,
    item.summary,
    item.location,
    item.organization,
    ...(item.tags || []),
  ]
    .join(" ")
    .toLowerCase();

  return [
    "india",
    "indian",
    "delhi",
    "mumbai",
    "bengaluru",
    "bangalore",
    "hyderabad",
    "chennai",
    "pune",
    "kolkata",
    "iit",
    "iisc",
    "iiit",
    "ugc",
    "inr",
  ].some((term) => corpus.includes(term));
};

const scoreItem = (item, query = "") => {
  let score = 0;
  const normalizedQuery = (query || "").toLowerCase().trim();
  const title = (item.title || "").toLowerCase();
  const summary = (item.summary || "").toLowerCase();

  if (!normalizedQuery) score += 5;
  if (normalizedQuery && title.includes(normalizedQuery)) score += 30;
  if (normalizedQuery && summary.includes(normalizedQuery)) score += 10;
  if (item.kind === "journal") score += 5;
  if (item.kind === "conference") score += 4;
  if (item.kind === "opportunity") score += 3;
  if (isIndiaRelevantItem(item)) score += 25;
  if ((item.sourceId || "").startsWith("noticebard-")) score += 8;

  const fetchedAt = Date.parse(item.fetchedAt || "");
  if (!Number.isNaN(fetchedAt)) {
    const ageHours = (Date.now() - fetchedAt) / (1000 * 60 * 60);
    score += Math.max(0, 20 - ageHours * 0.2);
  }

  const eventDate = Date.parse(item.eventDate || "");
  if (!Number.isNaN(eventDate)) {
    const ageDays = (Date.now() - eventDate) / (1000 * 60 * 60 * 24);
    score += Math.max(0, 15 - ageDays * 0.05);
  }

  return Number(score.toFixed(2));
};

const dedupeItems = (items) => {
  const map = new Map();

  for (const item of items) {
    const key = normalizeKey(item);
    if (!map.has(key)) {
      map.set(key, item);
      continue;
    }

    const existing = map.get(key);
    const existingScore = scoreItem(existing);
    const incomingScore = scoreItem(item);
    if (incomingScore >= existingScore) {
      map.set(key, { ...existing, ...item });
    }
  }

  return [...map.values()];
};

const hasFreshData = (store) => {
  if (!store?.updatedAt) return false;
  const updated = Date.parse(store.updatedAt);
  if (Number.isNaN(updated)) return false;
  return (
    Date.now() - updated < REFRESH_TTL_MS &&
    Array.isArray(store.items) &&
    store.items.length > 0
  );
};

export const refreshHarvestData = async ({ force = false } = {}) => {
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    const existing = await readStore();
    if (!force && hasFreshData(existing)) {
      return {
        refreshed: false,
        ...existing,
      };
    }

    const startedAt = Date.now();
    const results = new Array(SOURCE_REGISTRY.length);

    const runHarvestTask = async (index) => {
      const source = SOURCE_REGISTRY[index];
      const harvestedItems = await runSourceHarvester(source);
      return {
        sourceId: source.id,
        sourceName: source.name,
        sourceUrl: source.url,
        status: "ok",
        count: harvestedItems.length,
        durationMs: 0,
        harvestedItems,
      };
    };

    const workerCount = Math.max(
      1,
      Math.min(HARVEST_CONCURRENCY, SOURCE_REGISTRY.length),
    );
    let nextIndex = 0;

    await Promise.all(
      Array.from({ length: workerCount }, async () => {
        while (true) {
          const currentIndex = nextIndex;
          nextIndex += 1;

          if (currentIndex >= SOURCE_REGISTRY.length) {
            break;
          }

          results[currentIndex] = await Promise.resolve(
            runHarvestTask(currentIndex),
          )
            .then((value) => ({ status: "fulfilled", value }))
            .catch((reason) => ({ status: "rejected", reason }));
        }
      }),
    );

    const normalizedItems = [];
    const sourceReports = [];
    const fetchedAt = nowIso();
    const existingItems = Array.isArray(existing?.items) ? existing.items : [];

    results.forEach((result, index) => {
      const source = SOURCE_REGISTRY[index];

      if (result.status === "fulfilled") {
        const report = {
          sourceId: source.id,
          sourceName: source.name,
          sourceUrl: source.url,
          status: "ok",
          count: result.value.harvestedItems.length,
          fetchedAt,
        };
        sourceReports.push(report);

        result.value.harvestedItems.forEach((item) => {
          normalizedItems.push({
            id:
              item.externalId ||
              `${source.id}:${Math.random().toString(36).slice(2)}`,
            domain: "computer-science",
            fetchedAt,
            lastSeenAt: fetchedAt,
            sourceType: "website",
            ...item,
          });
        });
        return;
      }

      const fallbackItems = existingItems.filter(
        (cachedItem) => cachedItem.sourceId === source.id,
      );
      fallbackItems.forEach((cachedItem) => {
        normalizedItems.push({
          ...cachedItem,
          lastSeenAt: fetchedAt,
        });
      });

      sourceReports.push({
        sourceId: source.id,
        sourceName: source.name,
        sourceUrl: source.url,
        status: "error",
        count: 0,
        fallbackCount: fallbackItems.length,
        error: result.reason?.message || "Unknown harvesting error",
        fetchedAt,
      });
    });

    const deduped = dedupeItems(normalizedItems);
    const updatedStore = await writeStore({
      updatedAt: fetchedAt,
      durationMs: Date.now() - startedAt,
      sourceReports,
      items: deduped,
    });

    return {
      refreshed: true,
      ...updatedStore,
    };
  })();

  try {
    return await refreshPromise;
  } finally {
    refreshPromise = null;
  }
};

export const getHarvestStatus = async () => {
  const store = await readStore();
  return {
    updatedAt: store.updatedAt,
    storePath: getStorePath(),
    itemCount: store.items.length,
    sourceReports: store.sourceReports,
    sourcesConfigured: SOURCE_REGISTRY.length,
    sources: SOURCE_REGISTRY.map((source) => ({
      id: source.id,
      name: source.name,
      kind: source.kind,
      url: source.url,
    })),
  };
};

const parsePositiveInt = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed) || parsed <= 0) return fallback;
  return parsed;
};

const normalizeSearchText = (value = "") =>
  String(value)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const canonicalizeToken = (token) => {
  if (!token) return token;
  if (token.startsWith("machin")) return "machine";
  if (token.startsWith("learn")) return "learning";
  if (token === "ml") return "machine";
  if (token === "ai") return "artificial";
  if (token === "datasci") return "data";
  if (token === "block" || token === "chain") return "blockchain";
  if (token.startsWith("blockchain")) return "blockchain";
  return token;
};

const buildQueryTokens = (query = "") => {
  const normalized = normalizeSearchText(query);
  if (!normalized) return [];

  const baseTokens = normalized
    .split(" ")
    .filter(Boolean)
    .map(canonicalizeToken);

  const expandedTokens = new Set(baseTokens);
  if (baseTokens.includes("artificial")) expandedTokens.add("intelligence");
  if (baseTokens.includes("machine")) expandedTokens.add("learning");
  if (baseTokens.includes("data")) expandedTokens.add("science");
  if (baseTokens.includes("blockchain")) {
    expandedTokens.add("crypto");
    expandedTokens.add("ledger");
  }

  return [...expandedTokens];
};

const extractYear = (item) => {
  const eventDate = item?.eventDate || "";
  const title = item?.title || "";
  const summary = item?.summary || "";

  const parsedEvent = Date.parse(eventDate);
  if (!Number.isNaN(parsedEvent)) {
    return new Date(parsedEvent).getFullYear();
  }

  const combined = `${eventDate} ${title} ${summary}`;
  const yearMatch = combined.match(/\b(20\d{2})\b/);
  if (!yearMatch) return null;

  const year = Number.parseInt(yearMatch[1], 10);
  return Number.isNaN(year) ? null : year;
};

export const searchHarvestData = async (filters = {}) => {
  const {
    query = "",
    kind,
    subtype,
    sourceId,
    location,
    year,
    fromYear,
    includePast,
    limit,
    page,
  } = filters;

  const cache = await refreshHarvestData({ force: false });
  const requestedLimit = Math.min(
    parsePositiveInt(limit, MAX_RESULTS_DEFAULT),
    MAX_RESULTS_HARD_LIMIT,
  );
  const currentPage = parsePositiveInt(page, 1);
  const offset = (currentPage - 1) * requestedLimit;
  const normalizedQuery = normalizeSearchText(query);
  const normalizedLocation = (location || "").toLowerCase().trim();
  const queryTokens = buildQueryTokens(normalizedQuery);
  const requestedYear = parsePositiveInt(year, new Date().getFullYear());
  const minimumYear = parsePositiveInt(fromYear, null);
  const allowPastConferences =
    String(includePast || "false").toLowerCase() === "true";

  const filtered = cache.items
    .filter((item) => {
      if (kind && item.kind !== kind) return false;
      if (subtype && item.subtype !== subtype) return false;
      if (sourceId && item.sourceId !== sourceId) return false;

      if (item.kind === "conference" && !allowPastConferences) {
        const eventYear = extractYear(item);
        if (!eventYear || eventYear !== requestedYear) return false;
      }

      if (minimumYear) {
        const itemYear = extractYear(item);
        if (itemYear && itemYear < minimumYear) return false;
      }

      if (normalizedLocation) {
        const itemLocation = (item.location || "").toLowerCase();
        if (!itemLocation.includes(normalizedLocation)) return false;
      }

      if (!normalizedQuery) return true;
      const haystack = [
        item.title,
        item.summary,
        item.organization,
        item.location,
        ...(item.tags || []),
      ].join(" ");

      const normalizedHaystack = normalizeSearchText(haystack);
      if (normalizedHaystack.includes(normalizedQuery)) return true;

      if (!queryTokens.length) return false;
      return queryTokens.every((token) => normalizedHaystack.includes(token));
    })
    .map((item) => ({ ...item, score: scoreItem(item, normalizedQuery) }))
    .sort((a, b) => b.score - a.score);

  const paged = filtered.slice(offset, offset + requestedLimit);

  return {
    total: filtered.length,
    page: currentPage,
    limit: requestedLimit,
    results: paged,
    updatedAt: cache.updatedAt,
  };
};

export const initializeHarvestWarmup = async () => {
  try {
    await refreshHarvestData({ force: false });
  } catch (error) {
    console.error("Harvester warmup failed:", error.message);
  }
};
