import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Search,
  Calendar,
  MapPin,
  Users,
  BookOpen,
  Briefcase,
  ExternalLink,
  Bookmark,
  Bell,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import {
  matchJournals,
  searchHarvestedDataWithMeta,
  type HarvestItem,
  type HarvestSearchResponse,
  type JournalMatchItem,
} from "@/services/apiClient";
import {
  toggleReminderFromItem,
  addSavedSearch,
  getReminders,
  getSavedSearches,
  getWatchlist,
  trackItemInteraction,
  trackSearchInteraction,
  toggleWatchlistItem,
} from "@/lib/personalization";

type FinderKind = "conference" | "journal" | "opportunity";

const COMPACT_TERM_REPLACEMENTS: Array<[RegExp, string]> = [
  [/\bdeeplearning\b/g, "deep learning"],
  [/\bmachinelearning\b/g, "machine learning"],
  [/\bcomputervision\b/g, "computer vision"],
  [/\bcyber\s*security\b/g, "cybersecurity"],
  [/\bnlp\b/g, "natural language processing"],
  [/\bllm\b/g, "large language model"],
];

const KIND_HINTS: Record<FinderKind, string[]> = {
  journal: ["journal", "journals", "publication", "publications"],
  conference: ["conference", "conferences", "cfp", "workshop", "symposium"],
  opportunity: [
    "opportunity",
    "opportunities",
    "project",
    "projects",
    "phd",
    "postdoc",
    "internship",
    "fellowship",
    "grant",
    "grants",
  ],
};

const QUERY_NOISE = new Set([
  "in",
  "for",
  "the",
  "a",
  "an",
  "of",
  "on",
  "and",
  "or",
  "to",
  "show",
  "find",
  "search",
  "me",
  "about",
]);

const parseFinderIntent = (rawQuery: string) => {
  let normalized = rawQuery.toLowerCase();
  COMPACT_TERM_REPLACEMENTS.forEach(([pattern, replacement]) => {
    normalized = normalized.replace(pattern, replacement);
  });

  normalized = normalized
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const tokens = normalized.split(" ").filter(Boolean);
  const yearToken = tokens.find((token) => /^20\d{2}$/.test(token));
  const inferredYear = yearToken ? Number.parseInt(yearToken, 10) : undefined;

  let inferredKind: FinderKind | undefined;
  if (tokens.some((token) => KIND_HINTS.journal.includes(token))) {
    inferredKind = "journal";
  } else if (tokens.some((token) => KIND_HINTS.conference.includes(token))) {
    inferredKind = "conference";
  } else if (tokens.some((token) => KIND_HINTS.opportunity.includes(token))) {
    inferredKind = "opportunity";
  }

  const kindHintTokens = new Set([
    ...KIND_HINTS.journal,
    ...KIND_HINTS.conference,
    ...KIND_HINTS.opportunity,
  ]);

  const cleanTokens = tokens.filter(
    (token) =>
      !kindHintTokens.has(token) &&
      !QUERY_NOISE.has(token) &&
      !/^20\d{2}$/.test(token),
  );

  return {
    inferredKind,
    inferredYear,
    cleanQuery: cleanTokens.join(" "),
  };
};

const GeneralFinder = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentYear = new Date().getFullYear();

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [activeTab, setActiveTab] = useState<
    "all" | "conference" | "journal" | "opportunity"
  >("all");
  const [sortBy, setSortBy] = useState("relevance");
  const [page, setPage] = useState(1);
  const [savedSearches, setSavedSearches] = useState(() => getSavedSearches());
  const [watchlist, setWatchlist] = useState(() => getWatchlist());
  const [reminders, setReminders] = useState(() => getReminders());

  const pageSize = 18;

  useEffect(() => {
    const q = searchParams.get("q") || "";
    setSearchQuery(q);
    setDebouncedQuery(q);
  }, [searchParams]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
      setPage(1);
    }, 400);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    setPage(1);
  }, [activeTab]);

  const selectedKind = activeTab === "all" ? undefined : activeTab;
  const parsedIntent = useMemo(
    () => parseFinderIntent(debouncedQuery),
    [debouncedQuery],
  );
  const effectiveKind = selectedKind || parsedIntent.inferredKind;
  const effectiveQuery = parsedIntent.cleanQuery;
  const effectiveYear = parsedIntent.inferredYear;

  const mapMatchedJournalToFinderItem = (
    journal: JournalMatchItem,
    index: number,
  ): HarvestItem => {
    const provider = (journal.provider || "journal").trim();
    const sourceName = provider
      ? provider.charAt(0).toUpperCase() + provider.slice(1)
      : "Journal";

    return {
      id: `journal-match-${provider.toLowerCase()}-${journal.issn || index}`,
      kind: "journal",
      subtype: "journal",
      title: journal.title,
      summary: journal.scopeSnippet || journal.scope || null,
      organization: sourceName,
      sourceName,
      url:
        journal.submissionLink ||
        journal.guideForAuthors ||
        journal.sourceUrl ||
        "/journals",
      tags: journal.subjectAreas || journal.topicSeeds || [],
      score: journal.score,
    };
  };

  const {
    data: searchResponse,
    isLoading,
    isFetching,
  } = useQuery({
    queryKey: [
      "finder-search",
      effectiveQuery,
      effectiveKind,
      effectiveYear,
      page,
      currentYear,
    ],
    queryFn: async (): Promise<HarvestSearchResponse> => {
      if (selectedKind === undefined && effectiveQuery) {
        const [harvestedResponse, matchedJournals] = await Promise.all([
          searchHarvestedDataWithMeta({
            query: effectiveQuery,
            includePast: true,
            fromYear: effectiveYear,
            page: 1,
            limit: 200,
          }),
          matchJournals({
            query: effectiveQuery,
            mode: "keyword",
            provider: "all",
            limit: 100,
          }),
        ]);

        const journalItems = matchedJournals.data.map(
          mapMatchedJournalToFinderItem,
        );
        const merged = [...(harvestedResponse.data || []), ...journalItems];
        const dedupedMap = new Map<string, HarvestItem>();

        merged.forEach((item) => {
          const dedupeKey = `${(item.url || "").toLowerCase()}|${(item.title || "").toLowerCase()}`;
          const existing = dedupedMap.get(dedupeKey);
          if (!existing || (item.score || 0) >= (existing.score || 0)) {
            dedupedMap.set(dedupeKey, item);
          }
        });

        const combined = [...dedupedMap.values()].sort(
          (a, b) => (b.score || 0) - (a.score || 0),
        );
        const pageStart = (page - 1) * pageSize;
        const pageData = combined.slice(pageStart, pageStart + pageSize);

        return {
          data: pageData,
          meta: {
            total: combined.length,
            page,
            limit: pageSize,
            updatedAt: harvestedResponse.meta?.updatedAt,
          },
        };
      }

      if (effectiveKind === "journal") {
        const matchResponse = await matchJournals({
          query: effectiveQuery || "machine learning",
          mode: "keyword",
          provider: "all",
          limit: 100,
        });

        const mapped = matchResponse.data.map(mapMatchedJournalToFinderItem);
        const pageStart = (page - 1) * pageSize;
        const pageData = mapped.slice(pageStart, pageStart + pageSize);

        return {
          data: pageData,
          meta: {
            total: mapped.length,
            page,
            limit: pageSize,
          },
        };
      }

      return searchHarvestedDataWithMeta({
        query: effectiveQuery,
        kind: effectiveKind,
        year:
          effectiveKind === "conference"
            ? effectiveYear || currentYear
            : undefined,
        includePast:
          effectiveKind === "conference"
            ? false
            : effectiveKind === undefined
              ? true
              : undefined,
        fromYear:
          effectiveKind === "opportunity"
            ? effectiveYear || currentYear
            : effectiveKind === undefined
              ? effectiveYear
              : undefined,
        page,
        limit: pageSize,
      });
    },
    staleTime: 1000 * 60 * 2,
  });

  const results = searchResponse?.data || [];
  const meta = searchResponse?.meta;
  const totalPages = meta ? Math.max(1, Math.ceil(meta.total / meta.limit)) : 1;
  const pageStart =
    meta && meta.total > 0 ? (meta.page - 1) * meta.limit + 1 : 0;
  const pageEnd = meta && meta.total > 0 ? pageStart + results.length - 1 : 0;
  const watchlistIds = new Set(watchlist.map((item) => item.id));
  const reminderIds = new Set(reminders.map((item) => item.itemId));

  const sortedResults = useMemo(() => {
    const baseResults = searchResponse?.data || [];

    const parseDate = (value?: string | null) => {
      if (!value) return 0;
      const parsed = Date.parse(value);
      return Number.isNaN(parsed) ? 0 : parsed;
    };

    if (sortBy === "relevance") return baseResults;

    return [...baseResults].sort((a, b) => {
      if (sortBy === "title-asc") return a.title.localeCompare(b.title);
      if (sortBy === "title-desc") return b.title.localeCompare(a.title);
      if (sortBy === "date-oldest") {
        return (
          parseDate(a.eventDate || a.deadline) -
          parseDate(b.eventDate || b.deadline)
        );
      }
      return (
        parseDate(b.eventDate || b.deadline) -
        parseDate(a.eventDate || a.deadline)
      );
    });
  }, [searchResponse?.data, sortBy]);

  const handleManualSearch = () => {
    setDebouncedQuery(searchQuery);
    setPage(1);

    if (searchQuery.trim()) {
      setSearchParams({ q: searchQuery.trim() });
    } else {
      setSearchParams({});
    }
  };

  const saveCurrentSearch = () => {
    if (!searchQuery.trim() && activeTab === "all") return;
    trackSearchInteraction(
      searchQuery.trim() || activeTab,
      activeTab === "all" ? undefined : activeTab,
    );
    setSavedSearches(
      addSavedSearch({
        query: searchQuery.trim() || activeTab,
        kind: activeTab === "all" ? undefined : activeTab,
      }),
    );
  };

  const toggleWatchlist = (item: HarvestItem) => {
    trackItemInteraction(item, "save");
    setWatchlist(toggleWatchlistItem(item));
  };

  const addReminder = (item: HarvestItem) => {
    trackItemInteraction(item, "remind");
    setReminders(toggleReminderFromItem(item));
  };

  const getItemIcon = (item: HarvestItem) => {
    if (item.kind === "conference") return <Users className="h-4 w-4" />;
    if (item.kind === "journal") return <BookOpen className="h-4 w-4" />;
    return <Briefcase className="h-4 w-4" />;
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />

      <div className="flex-1">
        <div className="container mx-auto max-w-[1380px] px-5 py-8 md:px-6 md:py-10 space-y-8">
          <section className="rounded-[28px] border border-border bg-card shadow-sm overflow-hidden">
            <div className="border-b border-border bg-gradient-to-r from-slate-100 via-white to-slate-50 px-6 py-6 md:px-8 md:py-7">
              <div className="max-w-4xl">
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <Badge variant="secondary" className="px-3 py-1 text-xs">
                    Unified Research Finder
                  </Badge>
                  <Badge variant="outline" className="px-3 py-1 text-xs">
                    Conferences, journals, and opportunities
                  </Badge>
                </div>
                <p className="text-[15px] leading-7 text-muted-foreground md:text-base">
                  Discover relevant calls and venues quickly with one search,
                  then narrow by category and sort by relevance, date, or title.
                </p>
              </div>
            </div>

            <div className="p-6 md:p-8">
              <div className="rounded-2xl border border-border bg-background p-4 md:p-5">
                <div className="space-y-4">
                  <div className="flex flex-col md:flex-row gap-3">
                    <div className="flex-1 relative">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <Input
                        placeholder="Try machine learning, CVPR, postdoc, cybersecurity..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) =>
                          e.key === "Enter" && handleManualSearch()
                        }
                        className="h-12 rounded-xl pl-12 text-[15px] md:text-base"
                      />
                    </div>
                    <Button
                      className="h-12 px-7 rounded-xl"
                      onClick={handleManualSearch}
                    >
                      Search
                    </Button>
                  </div>

                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <Tabs
                      value={activeTab}
                      onValueChange={(value) =>
                        setActiveTab(
                          value as
                            | "all"
                            | "conference"
                            | "journal"
                            | "opportunity",
                        )
                      }
                    >
                      <TabsList>
                        <TabsTrigger value="all">All</TabsTrigger>
                        <TabsTrigger value="conference">
                          Conferences
                        </TabsTrigger>
                        <TabsTrigger value="journal">Journals</TabsTrigger>
                        <TabsTrigger value="opportunity">
                          Opportunities
                        </TabsTrigger>
                      </TabsList>
                    </Tabs>

                    <div className="flex items-center gap-2">
                      <Select value={sortBy} onValueChange={setSortBy}>
                        <SelectTrigger className="h-10 w-full md:w-56 rounded-xl">
                          <SelectValue placeholder="Sort" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="relevance">
                            Sort: Relevance
                          </SelectItem>
                          <SelectItem value="date-newest">
                            Date: Newest
                          </SelectItem>
                          <SelectItem value="date-oldest">
                            Date: Oldest
                          </SelectItem>
                          <SelectItem value="title-asc">
                            Title: A to Z
                          </SelectItem>
                          <SelectItem value="title-desc">
                            Title: Z to A
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={saveCurrentSearch}
                      >
                        Save search
                      </Button>
                    </div>
                  </div>

                  {savedSearches.length > 0 && (
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground mb-2">
                        Recent saved searches
                      </p>
                      <div className="flex gap-2 overflow-x-auto whitespace-nowrap pb-1 pr-1 custom-scrollbar">
                        {savedSearches.slice(0, 8).map((saved) => (
                          <Badge
                            key={saved.id}
                            variant="secondary"
                            className="cursor-pointer shrink-0 hover:bg-primary hover:text-primary-foreground"
                            onClick={() => {
                              setSearchQuery(saved.query);
                              setDebouncedQuery(saved.query);
                              if (
                                saved.kind &&
                                [
                                  "conference",
                                  "journal",
                                  "opportunity",
                                ].includes(saved.kind)
                              ) {
                                setActiveTab(
                                  saved.kind as
                                    | "conference"
                                    | "journal"
                                    | "opportunity",
                                );
                              }
                              setPage(1);
                            }}
                          >
                            {saved.query}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>

          <div className="flex items-center justify-between gap-4 border-b border-border pb-4">
            <p className="text-2xl font-semibold tracking-tight text-foreground">
              {isFetching
                ? "Updating results..."
                : meta && meta.total > 0
                  ? `Showing ${pageStart}-${pageEnd} of ${meta.total} results`
                  : "Showing 0 results"}
            </p>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {[...Array(9)].map((_, i) => (
                <div
                  key={i}
                  className="bg-card border border-border rounded-2xl p-5 shadow-sm"
                >
                  <div className="h-4 shimmer rounded mb-3" />
                  <div className="h-3 shimmer rounded mb-2" />
                  <div className="h-3 shimmer rounded w-2/3" />
                </div>
              ))}
            </div>
          ) : results.length === 0 ? (
            <div className="text-center py-16 rounded-2xl border border-dashed border-border bg-card/50">
              <Search className="h-10 w-10 mx-auto text-muted-foreground opacity-50 mb-3" />
              <h3 className="text-lg font-semibold mb-1">No results found</h3>
              <p className="text-sm text-muted-foreground">
                Try a broader keyword or switch the category filter.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {sortedResults.map((item: HarvestItem) => (
                <div
                  key={item.id}
                  className="bg-card border border-border/80 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-primary/40 transition-all"
                >
                  <div className="flex items-center justify-between mb-3">
                    <Badge
                      variant="outline"
                      className="flex items-center gap-1 text-xs"
                    >
                      {getItemIcon(item)}
                      {item.kind}
                    </Badge>
                    {item.subtype && item.subtype !== "general" && (
                      <span className="text-xs text-muted-foreground">
                        {item.subtype}
                      </span>
                    )}
                  </div>

                  <h3 className="font-medium text-sm text-foreground line-clamp-2 mb-2.5 leading-relaxed">
                    {item.title}
                  </h3>

                  <div className="space-y-1.5 text-xs text-muted-foreground mb-4 min-h-[64px]">
                    {(item.organization || item.sourceName) && (
                      <p className="truncate">
                        {item.organization || item.sourceName}
                      </p>
                    )}
                    {(item.eventDate || item.deadline) && (
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3 w-3 flex-shrink-0" />
                        <span>{item.eventDate || item.deadline}</span>
                      </div>
                    )}
                    {item.location && (
                      <div className="flex items-center gap-1.5">
                        <MapPin className="h-3 w-3 flex-shrink-0" />
                        <span className="truncate">{item.location}</span>
                      </div>
                    )}
                  </div>

                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                    onClick={() => trackItemInteraction(item, "open")}
                  >
                    Open source <ExternalLink className="h-3 w-3" />
                  </a>

                  <div className="mt-4 flex items-center gap-2 flex-wrap">
                    <Button
                      type="button"
                      variant={
                        watchlistIds.has(item.id) ? "default" : "outline"
                      }
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => toggleWatchlist(item)}
                    >
                      <Bookmark className="h-3 w-3 mr-1" />
                      {watchlistIds.has(item.id) ? "Saved" : "Watchlist"}
                    </Button>
                    <Button
                      type="button"
                      variant={reminderIds.has(item.id) ? "default" : "outline"}
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => addReminder(item)}
                      disabled={!item.deadline && !item.eventDate}
                    >
                      <Bell className="h-3 w-3 mr-1" />
                      {reminderIds.has(item.id) ? "Unset reminder" : "Remind"}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-3 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((prev) => prev - 1)}
                disabled={page <= 1}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((prev) => prev + 1)}
                disabled={page >= totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default GeneralFinder;
