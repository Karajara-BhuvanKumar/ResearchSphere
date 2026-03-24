import { searchHarvestData } from "./harvest/harvestService.js";

const MONTHS = {
  january: 0,
  jan: 0,
  february: 1,
  feb: 1,
  march: 2,
  mar: 2,
  april: 3,
  apr: 3,
  may: 4,
  june: 5,
  jun: 5,
  july: 6,
  jul: 6,
  august: 7,
  aug: 7,
  september: 8,
  sep: 8,
  october: 9,
  oct: 9,
  november: 10,
  nov: 10,
  december: 11,
  dec: 11,
};

const LOCATION_HINTS = [
  "hyderabad",
  "bangalore",
  "bengaluru",
  "delhi",
  "mumbai",
  "chennai",
  "pune",
  "kolkata",
  "india",
  "singapore",
  "london",
  "paris",
  "tokyo",
  "new york",
  "dubai",
  "indian",
];

const STOPWORDS = new Set([
  "i",
  "want",
  "to",
  "look",
  "for",
  "a",
  "an",
  "the",
  "around",
  "near",
  "in",
  "on",
  "at",
  "mid",
  "early",
  "late",
  "this",
  "next",
  "please",
  "find",
  "me",
  "show",
  "need",
  "read",
  "am",
  "looking",
  "now",
  "only",
  "also",
  "same",
  "there",
  "those",
  "them",
  "instead",
  "more",
  "filter",
  "narrow",
  "broaden",
  "opportunity",
  "opportunities",
  "conference",
  "conferences",
  "paper",
  "papers",
  "journal",
  "journals",
  "phd",
  "postdoc",
  "internship",
]);

const normalizeText = (value = "") =>
  String(value)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const tokenize = (value = "") =>
  normalizeText(value).split(" ").filter(Boolean);

const buildTopicTokens = (topicQuery = "") => {
  const base = tokenize(topicQuery).filter((token) => token.length >= 2);
  const expanded = new Set(base);

  if (expanded.has("ai")) {
    expanded.add("artificial");
    expanded.add("intelligence");
  }

  if (expanded.has("ml")) {
    expanded.add("machine");
    expanded.add("learning");
  }

  return [...expanded];
};

const detectKindAndSubtype = (normalized) => {
  if (/\b(phd|doctoral)\b/.test(normalized)) {
    return { kind: "opportunity", subtype: "phd" };
  }

  if (/\b(postdoc|post doctoral|post-doctoral)\b/.test(normalized)) {
    return { kind: "opportunity", subtype: "postdoc" };
  }

  if (/\b(internship|intern)\b/.test(normalized)) {
    return { kind: "opportunity", subtype: "internship" };
  }

  if (/\b(book chapter|book chapters|call for chapters)\b/.test(normalized)) {
    return { kind: "opportunity", subtype: "book-chapter" };
  }

  if (
    /\b(project call|project calls|grant|grants|funding|fellowship|fellowships|scheme|schemes|proposal|proposals)\b/.test(
      normalized,
    )
  ) {
    return { kind: "opportunity", subtype: "project-call" };
  }

  if (
    /\b(conference|conferences|workshop|workshops|symposium|symposia|summit|summits|cfp)\b/.test(
      normalized,
    )
  ) {
    return { kind: "conference", subtype: undefined };
  }

  if (
    /\b(paper|papers|publication|publications|preprint|preprints|journal|journals|article|articles)\b/.test(
      normalized,
    )
  ) {
    return { kind: "journal", subtype: undefined };
  }

  return { kind: undefined, subtype: undefined };
};

const detectLocation = (normalized) => {
  const direct = LOCATION_HINTS.find((candidate) =>
    normalized.includes(candidate),
  );
  if (direct) return direct;

  const prepositionMatch = normalized.match(
    /\b(?:in|at|near)\s+([a-z\s]{3,40})/,
  );
  if (!prepositionMatch) return undefined;

  const raw = prepositionMatch[1]
    .replace(/\b(on|for|with|from|during|about|around)\b.*$/, "")
    .trim();

  if (!raw || raw.split(" ").length > 3) return undefined;

  const cleaned = normalizeText(raw);
  if (!cleaned) return undefined;
  if (
    /\b(early|mid|middle|late|today|tomorrow|week|month|year)\b/.test(cleaned)
  ) {
    return undefined;
  }

  if (cleaned.split(" ").some((token) => token in MONTHS)) {
    return undefined;
  }

  return raw;
};

const isIndiaLocationRequest = (location) => {
  const normalizedLocation = normalizeText(location || "");
  return normalizedLocation === "india" || normalizedLocation === "indian";
};

const detectTimeWindow = (normalized) => {
  const yearMatch = normalized.match(/\b(20\d{2})\b/);
  const year = yearMatch
    ? Number.parseInt(yearMatch[1], 10)
    : new Date().getFullYear();
  const hasExplicitYear = Boolean(yearMatch);

  let monthIndex;
  let hasExplicitMonth = false;
  for (const [token, idx] of Object.entries(MONTHS)) {
    if (normalized.includes(token)) {
      monthIndex = idx;
      hasExplicitMonth = true;
      break;
    }
  }

  let part = "any";
  let hasExplicitPart = false;
  if (/\bearly\b/.test(normalized)) part = "early";
  if (/\bearly\b/.test(normalized)) hasExplicitPart = true;
  if (/\bmid|middle\b/.test(normalized)) {
    part = "mid";
    hasExplicitPart = true;
  }
  if (/\blate\b/.test(normalized)) part = "late";
  if (/\blate\b/.test(normalized)) hasExplicitPart = true;

  return {
    year,
    monthIndex,
    part,
    hasExplicitYear,
    hasExplicitMonth,
    hasExplicitPart,
  };
};

const shouldDropLocation = (normalized) =>
  /\b(anywhere|global|no location|online only|remote only)\b/.test(normalized);

const hasMonthAsLocationPhrase = (normalized) =>
  /\b(?:in|at|near)\s+(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\b/.test(
    normalized,
  );

const isValidLocationValue = (value) => {
  const normalized = normalizeText(value || "");
  if (!normalized) return false;
  if (tokenize(normalized).some((token) => token in MONTHS)) return false;
  if (/^20\d{2}$/.test(normalized)) return false;
  if (
    /\b(early|mid|middle|late|today|tomorrow|week|month|year)\b/.test(
      normalized,
    )
  ) {
    return false;
  }
  return true;
};

const isRefinementQuery = (normalized) =>
  /\b(also|now|only|instead|same|there|that|those|them|filter|narrow|broaden|more)\b/.test(
    normalized,
  );

const shouldIncludePastResults = (normalized) =>
  /\b(past|previous|historical|archive|archived|last year|all years|any year|older)\b/.test(
    normalized,
  );

const mergeWithContext = ({
  normalized,
  detected,
  location,
  topicQuery,
  timeWindow,
  context,
}) => {
  const previous = context?.lastParsed || {};
  const previousLocation = isValidLocationValue(previous.location)
    ? previous.location
    : undefined;
  const refinement = isRefinementQuery(normalized);
  const standalone = Boolean(detected.kind) && !refinement;
  const switchedKind =
    Boolean(detected.kind) &&
    Boolean(previous.kind) &&
    detected.kind !== previous.kind;

  const merged = {
    kind: detected.kind || previous.kind,
    subtype: detected.subtype || (detected.kind ? undefined : previous.subtype),
    location: location,
    topicQuery,
    timeWindow,
  };

  if (standalone && !location) {
    merged.location = undefined;
  } else if (shouldDropLocation(normalized)) {
    merged.location = undefined;
  } else if (location && !isValidLocationValue(location)) {
    merged.location = undefined;
  } else if (hasMonthAsLocationPhrase(normalized)) {
    merged.location = undefined;
  } else if (!location && !switchedKind) {
    merged.location = previousLocation;
  }

  if (standalone && !topicQuery) {
    merged.topicQuery = "";
  } else if (!topicQuery && !switchedKind) {
    merged.topicQuery = previous.topicQuery;
  }

  const explicitTime =
    timeWindow.hasExplicitMonth ||
    timeWindow.hasExplicitYear ||
    timeWindow.hasExplicitPart;

  if (
    !explicitTime &&
    !switchedKind &&
    (isRefinementQuery(normalized) || !detected.kind)
  ) {
    merged.timeWindow = previous.timeWindow || timeWindow;
  }

  return merged;
};

const extractTopicQuery = (normalized, location) => {
  const locationTokens = new Set(
    normalizeText(location || "")
      .split(" ")
      .filter(Boolean),
  );

  const tokens = normalized
    .split(" ")
    .map((token) => token.trim())
    .filter(Boolean)
    .filter((token) => !STOPWORDS.has(token))
    .filter((token) => !locationTokens.has(token))
    .filter((token) => !(token in MONTHS))
    .filter((token) => !/^20\d{2}$/.test(token));

  return tokens.slice(0, 7).join(" ");
};

const isWithinMonthWindow = (item, timeWindow) => {
  if (timeWindow.monthIndex === undefined) return true;

  const dateCandidate = item.eventDate || item.deadline;
  if (!dateCandidate) return false;

  const normalizedDateText = normalizeText(dateCandidate);
  const monthsInText = new Set();
  for (const [token, idx] of Object.entries(MONTHS)) {
    if (token.length < 3) continue;
    if (normalizedDateText.includes(token)) {
      monthsInText.add(idx);
    }
  }

  if (monthsInText.size > 0 && !monthsInText.has(timeWindow.monthIndex)) {
    return false;
  }

  const parsed = Date.parse(dateCandidate);
  if (Number.isNaN(parsed)) {
    return monthsInText.size > 0 && monthsInText.has(timeWindow.monthIndex);
  }

  const date = new Date(parsed);
  if (date.getFullYear() !== timeWindow.year) return false;
  if (date.getMonth() !== timeWindow.monthIndex) return false;

  if (timeWindow.part === "any") return true;
  const day = date.getDate();
  if (timeWindow.part === "early") return day <= 10;
  if (timeWindow.part === "mid") return day >= 11 && day <= 20;
  return day >= 21;
};

const filterByLocation = (item, location) => {
  if (!location) return true;
  const corpus = normalizeText(
    [item.location, item.summary, item.title].join(" "),
  );
  const normalizedLocation = normalizeText(location);

  if (isIndiaLocationRequest(normalizedLocation)) {
    return [
      "india",
      "indian",
      "hyderabad",
      "bangalore",
      "bengaluru",
      "delhi",
      "mumbai",
      "chennai",
      "pune",
      "kolkata",
    ].some((term) => corpus.includes(term));
  }

  return corpus.includes(normalizedLocation);
};

const filterByTopic = (item, topicQuery) => {
  if (!topicQuery) return true;

  const normalizedTopic = normalizeText(topicQuery);
  const corpusText = normalizeText(
    [item.title, item.summary, item.tags?.join(" ")].join(" "),
  );

  if (corpusText.includes(normalizedTopic)) {
    return true;
  }

  const topicTokens = buildTopicTokens(topicQuery);
  if (topicTokens.length === 0) return true;

  const corpusTokens = new Set(tokenize(corpusText));
  const matchedTokens = topicTokens.filter((token) => corpusTokens.has(token));

  if (topicTokens.length <= 2) {
    return matchedTokens.length === topicTokens.length;
  }

  const ratio = matchedTokens.length / topicTokens.length;
  return ratio >= 0.75;
};

const buildResponseText = ({ parsed, resultCount, shownCount }) => {
  const segments = [];

  if (parsed.kind) {
    segments.push(`I searched your ${parsed.kind} data`);
  } else {
    segments.push("I searched across all platform resources");
  }

  if (parsed.topicQuery) {
    segments.push(`for “${parsed.topicQuery}”`);
  }

  if (parsed.location) {
    segments.push(`in or around ${parsed.location}`);
  }

  if (parsed.timeWindow.monthIndex !== undefined) {
    const monthName = new Date(
      parsed.timeWindow.year,
      parsed.timeWindow.monthIndex,
      1,
    ).toLocaleString("en-US", { month: "long" });
    const partLabel =
      parsed.timeWindow.part === "any"
        ? monthName
        : `${parsed.timeWindow.part} ${monthName}`;
    segments.push(`around ${partLabel} ${parsed.timeWindow.year}`);
  }

  const header = `${segments.join(" ")}.`;
  const tail = ` Found ${resultCount} matches, showing top ${shownCount}.`;
  return `${header}${tail}`;
};

const buildFollowups = (parsed, resultCount) => {
  const suggestions = [];

  if (!parsed.kind) {
    suggestions.push(
      "Try specifying: conference, journal, or phd opportunity.",
    );
  }

  if (!parsed.topicQuery) {
    suggestions.push(
      "Add a topic like machine learning, blockchain, cybersecurity, or NLP.",
    );
  }

  if (!parsed.location && parsed.kind === "conference") {
    suggestions.push("Add a location like Hyderabad, Bangalore, or India.");
  }

  if (resultCount === 0) {
    suggestions.push(
      "Try removing date/location constraints or use broader keywords.",
    );
  }

  return suggestions.slice(0, 3);
};

export const answerAssistantQuery = async (query, context = {}) => {
  const normalized = normalizeText(query);
  const includePastRequested = shouldIncludePastResults(normalized);
  if (!normalized) {
    return {
      text: "Please ask a specific question, for example: ‘ML conference in Hyderabad in March’ or ‘blockchain research papers’.",
      results: [],
      parsed: {},
      suggestions: [
        "Find machine learning conferences in March",
        "Show blockchain papers",
        "Find PhD opportunities in AI",
      ],
    };
  }

  const detected = detectKindAndSubtype(normalized);
  const location = detectLocation(normalized);
  const timeWindow = detectTimeWindow(normalized);
  const topicQuery = extractTopicQuery(normalized, location);

  const merged = mergeWithContext({
    normalized,
    detected,
    location,
    topicQuery,
    timeWindow,
    context,
  });

  const resolvedQuery = merged.topicQuery || (!merged.kind ? normalized : "");

  const searchFilters = {
    query: resolvedQuery,
    kind: merged.kind,
    subtype: merged.subtype,
    location: merged.location,
    limit: 120,
    page: 1,
  };

  if (merged.kind === "conference") {
    searchFilters.year = merged.timeWindow?.year || new Date().getFullYear();
    searchFilters.includePast = includePastRequested;
  } else {
    searchFilters.fromYear = Math.max(
      2024,
      (merged.timeWindow?.year || new Date().getFullYear()) - 1,
    );
  }

  const search = await searchHarvestData(searchFilters);

  let refined = (search.results || [])
    .filter((item) => filterByTopic(item, merged.topicQuery))
    .filter((item) => filterByLocation(item, merged.location))
    .filter((item) =>
      isWithinMonthWindow(item, merged.timeWindow || timeWindow),
    );

  if (refined.length === 0) {
    const broadened = await searchHarvestData({
      query: resolvedQuery,
      kind: merged.kind,
      subtype: merged.subtype,
      limit: 120,
      page: 1,
      includePast:
        merged.kind === "conference" ? includePastRequested : undefined,
      year: merged.kind === "conference" ? merged.timeWindow?.year : undefined,
      fromYear:
        merged.kind !== "conference"
          ? Math.max(
              2024,
              (merged.timeWindow?.year || new Date().getFullYear()) - 1,
            )
          : undefined,
    });

    refined = (broadened.results || [])
      .filter((item) => filterByTopic(item, merged.topicQuery))
      .filter((item) => filterByLocation(item, merged.location))
      .filter((item) =>
        isWithinMonthWindow(item, merged.timeWindow || timeWindow),
      )
      .slice(0, 20);
  }

  const topResults = refined.slice(0, 12);

  const parsed = {
    kind: merged.kind,
    subtype: merged.subtype,
    location: merged.location,
    topicQuery: merged.topicQuery,
    timeWindow: merged.timeWindow,
    filters: searchFilters,
  };

  return {
    text: buildResponseText({
      parsed,
      resultCount: refined.length,
      shownCount: topResults.length,
    }),
    results: topResults,
    parsed,
    suggestions: buildFollowups(parsed, refined.length),
    meta: {
      total: refined.length,
      updatedAt: search.updatedAt,
    },
  };
};
