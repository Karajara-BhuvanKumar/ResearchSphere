import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const probeRoot = path.resolve(__dirname, "../data/journal-finder-probe");

const STOP_WORDS = new Set([
  "a",
  "about",
  "across",
  "after",
  "all",
  "an",
  "and",
  "any",
  "are",
  "as",
  "at",
  "based",
  "be",
  "because",
  "been",
  "being",
  "between",
  "both",
  "by",
  "can",
  "from",
  "for",
  "how",
  "if",
  "in",
  "into",
  "is",
  "it",
  "its",
  "journal",
  "method",
  "methods",
  "of",
  "on",
  "or",
  "our",
  "paper",
  "research",
  "results",
  "study",
  "system",
  "systems",
  "that",
  "the",
  "their",
  "them",
  "these",
  "this",
  "those",
  "to",
  "using",
  "via",
  "we",
  "which",
  "with",
]);

const CORE_CS_TERMS = [
  "computer",
  "software",
  "information",
  "informatics",
  "artificial intelligence",
  "machine learning",
  "deep learning",
  "data science",
  "data mining",
  "computer vision",
  "natural language processing",
  "robotics",
  "network",
  "distributed",
  "cloud",
  "security",
  "cybersecurity",
  "blockchain",
  "edge computing",
  "internet of things",
];

let corpusCache = null;

const normalizeWhitespace = (value) =>
  String(value ?? "")
    .replace(/\s+/g, " ")
    .trim();

const normalizeKey = (value) => normalizeWhitespace(value).toLowerCase();

const tokenize = (value) =>
  normalizeKey(value)
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((token) => token.length > 2 && !STOP_WORDS.has(token));

const unique = (items) => [...new Set(items.filter(Boolean))];

const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));

const round = (value, decimals = 4) =>
  Number.parseFloat(Number(value).toFixed(decimals));

const snippet = (value, maxLength = 260) => {
  const text = normalizeWhitespace(value);
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 3)}...`;
};

const pickBetterNumber = (left, right) => {
  if (left == null) return right ?? null;
  if (right == null) return left ?? null;
  return Math.max(left, right);
};

const pickLowerNumber = (left, right) => {
  if (left == null) return right ?? null;
  if (right == null) return left ?? null;
  return Math.min(left, right);
};

const toAbsoluteField = (value) => normalizeWhitespace(value);

const buildNGrams = (tokens, size) => {
  const grams = [];
  for (let index = 0; index <= tokens.length - size; index += 1) {
    grams.push(tokens.slice(index, index + size).join(" "));
  }
  return grams;
};

const idf = (term, docFreq, docCount) => {
  const df = docFreq.get(term) || 0;
  return Math.log(1 + (docCount - df + 0.5) / (df + 0.5));
};

const countOccurrences = (tokens) => {
  const counts = new Map();
  for (const token of tokens) {
    counts.set(token, (counts.get(token) || 0) + 1);
  }
  return counts;
};

const average = (values) =>
  values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;

const hasAnyCoreCsTerm = (value) => {
  const text = normalizeKey(value);
  return CORE_CS_TERMS.some((term) => text.includes(term));
};

const buildJournalProfileText = (journal) =>
  [
    journal.title,
    journal.scope,
    ...(journal.subjectAreas || []),
    ...(journal.topicSeeds || []),
    journal.provider,
    journal.publishingModel,
  ]
    .map(normalizeWhitespace)
    .filter(Boolean)
    .join(" ");

const toCorpusJournal = (item, topicSeed, sourceRun) => ({
  provider: item.provider,
  title: toAbsoluteField(item.title),
  sourceUrl: item.sourceUrl || null,
  submissionLink: item.submissionLink || null,
  guideForAuthors: item.guideForAuthors || null,
  acronym: item.acronym || null,
  issn: item.issn || null,
  publishingModel: item.publishingModel || null,
  openAccessType: item.openAccessType || null,
  impactFactor: item.impactFactor ?? null,
  citeScore: item.citeScore ?? null,
  decisionDays: item.decisionDays ?? null,
  acceptanceDays: item.acceptanceDays ?? null,
  subjectAreas: Array.isArray(item.subjectAreas) ? item.subjectAreas : [],
  articleTypes: Array.isArray(item.articleTypes) ? item.articleTypes : [],
  scope: toAbsoluteField(item.scope),
  editorInChief: item.editorInChief || null,
  goldOpenAccessFee: item.goldOpenAccessFee ?? null,
  goldOpenAccessCurrency: item.goldOpenAccessCurrency || null,
  coverImage: item.coverImage || null,
  hasAgreements: item.hasAgreements ?? null,
  topicSeeds: unique([topicSeed]),
  sourceRuns: unique([sourceRun]),
  rank: item.rank ?? null,
});

const mergeJournalRecords = (current, incoming, topicSeed) => ({
  ...current,
  title: current.title || incoming.title,
  sourceUrl: current.sourceUrl || incoming.sourceUrl,
  submissionLink: current.submissionLink || incoming.submissionLink,
  guideForAuthors: current.guideForAuthors || incoming.guideForAuthors,
  acronym: current.acronym || incoming.acronym || null,
  issn: current.issn || incoming.issn || null,
  publishingModel: current.publishingModel || incoming.publishingModel || null,
  openAccessType: current.openAccessType || incoming.openAccessType || null,
  impactFactor: pickBetterNumber(current.impactFactor, incoming.impactFactor),
  citeScore: pickBetterNumber(current.citeScore, incoming.citeScore),
  decisionDays: pickLowerNumber(current.decisionDays, incoming.decisionDays),
  acceptanceDays: pickLowerNumber(
    current.acceptanceDays,
    incoming.acceptanceDays,
  ),
  subjectAreas: unique([
    ...(current.subjectAreas || []),
    ...(incoming.subjectAreas || []),
  ]),
  articleTypes: unique([
    ...(current.articleTypes || []),
    ...(incoming.articleTypes || []),
  ]),
  scope:
    normalizeWhitespace(current.scope).length >=
    normalizeWhitespace(incoming.scope).length
      ? current.scope
      : incoming.scope,
  editorInChief: current.editorInChief || incoming.editorInChief || null,
  goldOpenAccessFee:
    current.goldOpenAccessFee ?? incoming.goldOpenAccessFee ?? null,
  goldOpenAccessCurrency:
    current.goldOpenAccessCurrency || incoming.goldOpenAccessCurrency || null,
  coverImage: current.coverImage || incoming.coverImage || null,
  hasAgreements:
    current.hasAgreements ?? incoming.hasAgreements ?? null,
  topicSeeds: unique([...(current.topicSeeds || []), topicSeed]),
  sourceRuns: unique([...(current.sourceRuns || []), ...(incoming.sourceRuns || [])]),
  rank: Math.min(
    current.rank || Number.MAX_SAFE_INTEGER,
    incoming.rank || Number.MAX_SAFE_INTEGER,
  ),
});

const listCorpusRuns = async () => {
  const entries = await fs.readdir(probeRoot, { withFileTypes: true }).catch(() => []);
  return entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name);
};

const readRunSummary = async (runName) => {
  const summaryPath = path.join(probeRoot, runName, "summary.json");
  const mergedPath = path.join(probeRoot, runName, "journals-merged.json");
  const [summaryText, mergedText] = await Promise.all([
    fs.readFile(summaryPath, "utf8"),
    fs.readFile(mergedPath, "utf8"),
  ]);

  return {
    runName,
    summary: JSON.parse(summaryText),
    journals: JSON.parse(mergedText),
  };
};

const prepareJournal = (journal, stats) => {
  const fieldTexts = {
    title: normalizeKey(journal.title),
    scope: normalizeKey(journal.scope),
    subjects: normalizeKey((journal.subjectAreas || []).join(" ")),
    topicSeeds: normalizeKey((journal.topicSeeds || []).join(" ")),
  };

  const fieldTokens = {
    title: tokenize(fieldTexts.title),
    scope: tokenize(fieldTexts.scope),
    subjects: tokenize(fieldTexts.subjects),
    topicSeeds: tokenize(fieldTexts.topicSeeds),
  };

  return {
    ...journal,
    profileText: buildJournalProfileText(journal),
    fieldTexts,
    fieldTokens,
    tokenCounts: {
      title: countOccurrences(fieldTokens.title),
      scope: countOccurrences(fieldTokens.scope),
      subjects: countOccurrences(fieldTokens.subjects),
      topicSeeds: countOccurrences(fieldTokens.topicSeeds),
    },
    fieldLengths: {
      title: Math.max(fieldTokens.title.length, 1),
      scope: Math.max(fieldTokens.scope.length, 1),
      subjects: Math.max(fieldTokens.subjects.length, 1),
      topicSeeds: Math.max(fieldTokens.topicSeeds.length, 1),
    },
    csSignal:
      hasAnyCoreCsTerm(journal.title) ||
      hasAnyCoreCsTerm(journal.scope) ||
      (journal.subjectAreas || []).some((subject) => hasAnyCoreCsTerm(subject)),
    avgFieldLength: stats.avgFieldLength,
  };
};

const buildCorpusStats = (journals, topics) => {
  const fields = ["title", "scope", "subjects", "topicSeeds"];
  const tokenDf = new Map();
  const fieldDf = Object.fromEntries(fields.map((field) => [field, new Map()]));
  const fieldLengths = Object.fromEntries(fields.map((field) => [field, []]));

  for (const journal of journals) {
    const fieldTokens = {
      title: tokenize(journal.title),
      scope: tokenize(journal.scope),
      subjects: tokenize((journal.subjectAreas || []).join(" ")),
      topicSeeds: tokenize((journal.topicSeeds || []).join(" ")),
    };

    const seenGlobal = new Set();
    for (const field of fields) {
      const seenField = new Set(fieldTokens[field]);
      fieldLengths[field].push(fieldTokens[field].length || 1);
      for (const token of seenField) {
        fieldDf[field].set(token, (fieldDf[field].get(token) || 0) + 1);
        if (!seenGlobal.has(token)) {
          tokenDf.set(token, (tokenDf.get(token) || 0) + 1);
          seenGlobal.add(token);
        }
      }
    }
  }

  const avgFieldLength = Object.fromEntries(
    fields.map((field) => [field, average(fieldLengths[field]) || 1]),
  );

  return {
    fields,
    topics,
    docCount: Math.max(journals.length, 1),
    tokenDf,
    fieldDf,
    avgFieldLength,
  };
};

const extractQueryFeatures = (query, mode, stats) => {
  const normalized = normalizeWhitespace(query);
  const tokens = tokenize(normalized);
  const counts = countOccurrences(tokens);
  const uniqueTokens = unique(tokens);

  const tokenWeights = uniqueTokens
    .map((token) => ({
      token,
      weight: idf(token, stats.tokenDf, stats.docCount) * (counts.get(token) || 1),
    }))
    .sort((left, right) => right.weight - left.weight);

  const weightedTokens = tokenWeights
    .slice(0, mode === "abstract" ? 24 : 14)
    .map((item) => item.token);

  const grams = unique([
    ...buildNGrams(tokens, 2),
    ...buildNGrams(tokens, 3),
  ]);
  const phraseWeights = grams
    .map((phrase) => ({
      phrase,
      weight: average(
        phrase.split(" ").map((token) => idf(token, stats.tokenDf, stats.docCount)),
      ),
    }))
    .sort((left, right) => right.weight - left.weight);

  const phrases = phraseWeights
    .slice(0, mode === "abstract" ? 12 : 8)
    .map((item) => item.phrase);

  return {
    normalized: normalizeKey(normalized),
    tokens: weightedTokens,
    tokenWeights: new Map(tokenWeights.map((item) => [item.token, item.weight])),
    phrases,
  };
};

const bm25FieldScore = (queryTokens, journal, field, stats, weight) => {
  const k1 = 1.2;
  const b = 0.75;
  const counts = journal.tokenCounts[field];
  const fieldLength = journal.fieldLengths[field];
  const avgLength = stats.avgFieldLength[field] || 1;
  const fieldDf = stats.fieldDf[field];

  let score = 0;
  for (const token of queryTokens) {
    const tf = counts.get(token) || 0;
    if (!tf) continue;
    const termIdf = idf(token, fieldDf, stats.docCount);
    const numerator = tf * (k1 + 1);
    const denominator = tf + k1 * (1 - b + b * (fieldLength / avgLength));
    score += termIdf * (numerator / denominator);
  }

  return score * weight;
};

const routeQueryToTopics = (queryFeatures, stats) => {
  const routed = stats.topics
    .map((topic) => {
      const topicTokens = unique(tokenize(topic));
      const overlap = queryFeatures.tokens.filter((token) => topicTokens.includes(token));
      const phraseBoost = queryFeatures.phrases.some((phrase) => normalizeKey(topic).includes(phrase))
        ? 0.4
        : 0;
      const coverage = overlap.length / Math.max(topicTokens.length, 1);
      return {
        topic,
        score: coverage + phraseBoost,
      };
    })
    .filter((item) => item.score >= 0.35)
    .sort((left, right) => right.score - left.score)
    .slice(0, 4);

  return routed;
};

const computeSeedAlignment = (journal, routedTopics) => {
  if (!routedTopics.length || !(journal.topicSeeds || []).length) return 0;

  let best = 0;
  for (const routed of routedTopics) {
    for (const seed of journal.topicSeeds || []) {
      const routedTokens = unique(tokenize(routed.topic));
      const seedTokens = unique(tokenize(seed));
      const overlap = routedTokens.filter((token) => seedTokens.includes(token));
      const overlapRatio = overlap.length / Math.max(routedTokens.length, 1);
      best = Math.max(best, overlapRatio * routed.score);
    }
  }

  return clamp(best);
};

const computePhraseScore = (journal, phrases) => {
  if (!phrases.length) return 0;
  let score = 0;
  for (const phrase of phrases) {
    if (journal.fieldTexts.title.includes(phrase)) score += 0.45;
    if (journal.fieldTexts.topicSeeds.includes(phrase)) score += 0.45;
    if (journal.fieldTexts.subjects.includes(phrase)) score += 0.35;
    if (journal.fieldTexts.scope.includes(phrase)) score += 0.2;
  }
  return clamp(score / Math.max(phrases.length, 1));
};

const computeTokenCoverage = (journal, queryFeatures) => {
  const profileTokens = new Set([
    ...journal.fieldTokens.title,
    ...journal.fieldTokens.scope,
    ...journal.fieldTokens.subjects,
    ...journal.fieldTokens.topicSeeds,
  ]);

  const matched = queryFeatures.tokens.filter((token) => profileTokens.has(token));
  const totalWeight = queryFeatures.tokens.reduce(
    (sum, token) => sum + (queryFeatures.tokenWeights.get(token) || 0),
    0,
  );
  const matchedWeight = matched.reduce(
    (sum, token) => sum + (queryFeatures.tokenWeights.get(token) || 0),
    0,
  );

  return {
    matchedTokens: matched,
    coverage: totalWeight ? matchedWeight / totalWeight : 0,
  };
};

const buildReasons = (journal, matchedTokens, routedTopics) => {
  const reasons = [];

  const routedMatches = routedTopics.filter((item) =>
    (journal.topicSeeds || []).some((seed) => normalizeKey(seed) === normalizeKey(item.topic)),
  );
  if (routedMatches.length) {
    reasons.push(`Strong topical fit: ${routedMatches.slice(0, 2).map((item) => item.topic).join(", ")}`);
  }

  if ((journal.subjectAreas || []).length) {
    reasons.push(
      `Subject areas: ${(journal.subjectAreas || []).slice(0, 3).join(", ")}`,
    );
  }

  if (matchedTokens.length) {
    reasons.push(`Matched concepts: ${matchedTokens.slice(0, 5).join(", ")}`);
  }

  if (journal.decisionDays != null) {
    reasons.push(`First decision: ${journal.decisionDays} days`);
  }

  return unique(reasons).slice(0, 3);
};

const scoreJournal = (journal, queryFeatures, mode, stats) => {
  if (!queryFeatures.tokens.length) return null;

  const bm25 =
    bm25FieldScore(queryFeatures.tokens, journal, "title", stats, 3.2) +
    bm25FieldScore(queryFeatures.tokens, journal, "topicSeeds", stats, 2.7) +
    bm25FieldScore(queryFeatures.tokens, journal, "subjects", stats, 2.0) +
    bm25FieldScore(queryFeatures.tokens, journal, "scope", stats, mode === "abstract" ? 2.6 : 1.8);

  const routedTopics = routeQueryToTopics(queryFeatures, stats);
  const seedAlignment = computeSeedAlignment(journal, routedTopics);
  const phraseScore = computePhraseScore(journal, queryFeatures.phrases);
  const { matchedTokens, coverage } = computeTokenCoverage(journal, queryFeatures);
  const csBoost = journal.csSignal ? 0.06 : 0;
  const impactBoost = clamp((journal.impactFactor || 0) / 25, 0, 0.08);
  const decisionBoost =
    journal.decisionDays != null
      ? clamp((60 - journal.decisionDays) / 60, 0, 1) * 0.04
      : 0;

  const normalizedBm25 = clamp(bm25 / (mode === "abstract" ? 30 : 24));

  const score =
    mode === "abstract"
      ? normalizedBm25 * 0.4 +
        coverage * 0.24 +
        seedAlignment * 0.18 +
        phraseScore * 0.1 +
        impactBoost +
        decisionBoost +
        csBoost
      : normalizedBm25 * 0.34 +
        coverage * 0.2 +
        seedAlignment * 0.24 +
        phraseScore * 0.12 +
        impactBoost +
        decisionBoost +
        csBoost;

  const bounded = clamp(score);
  const minimum = mode === "abstract" ? 0.22 : 0.18;
  if (bounded < minimum) return null;

  return {
    ...journal,
    score: round(bounded),
    scopeSnippet: snippet(journal.scope),
    matchReasons: buildReasons(journal, matchedTokens, routedTopics),
    routedTopics: routedTopics.map((item) => item.topic),
  };
};

const loadAndPrepareCorpus = async () => {
  if (corpusCache) return corpusCache;

  const runs = await listCorpusRuns();
  const loadedRuns = await Promise.allSettled(runs.map(readRunSummary));
  const byKey = new Map();
  const topics = new Set();

  for (const loaded of loadedRuns) {
    if (loaded.status !== "fulfilled") continue;
    const { runName, summary, journals } = loaded.value;
    const topicSeed = normalizeWhitespace(summary.query || "").toLowerCase();
    if (topicSeed) topics.add(topicSeed);

    for (const item of journals) {
      const normalized = toCorpusJournal(item, topicSeed, runName);
      const key = normalized.issn
        ? `${normalized.provider}:${normalized.issn}`
        : `${normalized.provider}:${normalizeKey(normalized.title)}`;

      if (byKey.has(key)) {
        byKey.set(key, mergeJournalRecords(byKey.get(key), normalized, topicSeed));
      } else {
        byKey.set(key, normalized);
      }
    }
  }

  const rawJournals = [...byKey.values()];
  const stats = buildCorpusStats(rawJournals, [...topics].sort());
  const journals = rawJournals
    .map((journal) => prepareJournal(journal, stats))
    .sort((left, right) => left.title.localeCompare(right.title));

  corpusCache = {
    journals,
    stats,
    topics: [...topics].sort(),
    totalRuns: loadedRuns.filter((run) => run.status === "fulfilled").length,
  };

  return corpusCache;
};

export const loadJournalCorpus = async () => {
  const corpus = await loadAndPrepareCorpus();
  return {
    journals: corpus.journals,
    topics: corpus.topics,
    totalRuns: corpus.totalRuns,
  };
};

export const searchJournalCorpus = async ({
  mode = "keyword",
  query = "",
  limit = 20,
  provider = "all",
}) => {
  const normalizedQuery = normalizeWhitespace(query);
  if (!normalizedQuery) {
    return {
      items: [],
      topics: [],
      totalCorpus: 0,
      mode,
    };
  }

  const corpus = await loadAndPrepareCorpus();
  const queryFeatures = extractQueryFeatures(normalizedQuery, mode, corpus.stats);
  const filtered =
    provider === "all"
      ? corpus.journals
      : corpus.journals.filter((journal) => journal.provider === provider);

  const items = filtered
    .map((journal) => scoreJournal(journal, queryFeatures, mode, corpus.stats))
    .filter(Boolean)
    .sort((left, right) => {
      if (right.score !== left.score) return right.score - left.score;
      return (right.impactFactor || 0) - (left.impactFactor || 0);
    })
    .slice(0, limit);

  return {
    items,
    topics: corpus.topics,
    totalCorpus: corpus.journals.length,
    mode,
  };
};

