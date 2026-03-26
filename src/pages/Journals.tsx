import { useEffect, useMemo, useState } from "react";
import {
  Award,
  CheckCircle2,
  ExternalLink,
  Search,
  Sparkles,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { matchJournals, type JournalMatchItem } from "@/services/apiClient";
import { trackSearchInteraction } from "@/lib/personalization";

const DEFAULT_KEYWORD_QUERY = "";
const DEFAULT_MIXED_QUERY = "computer science";
const DEFAULT_ABSTRACT_QUERY =
  "We propose a federated learning framework for edge-cloud environments that reduces communication cost while preserving model accuracy for distributed computer vision workloads.";
const ALWAYS_VISIBLE_POPULAR_TOPIC = "machine learning";

const Journals = () => {
  const [searchMode, setSearchMode] = useState<"keyword" | "abstract">(
    "keyword",
  );
  const [keywordQuery, setKeywordQuery] = useState(DEFAULT_KEYWORD_QUERY);
  const [abstractQuery, setAbstractQuery] = useState(DEFAULT_ABSTRACT_QUERY);
  const [submittedQuery, setSubmittedQuery] = useState(DEFAULT_MIXED_QUERY);
  const [providerFilter, setProviderFilter] = useState<
    "all" | "springer" | "elsevier"
  >("all");
  const [sortBy, setSortBy] = useState("score");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const activeQuery = searchMode === "abstract" ? abstractQuery : keywordQuery;
  const dynamicMatchLimit = useMemo(() => {
    if (searchMode === "abstract") return 70;
    if (providerFilter !== "all") return 90;
    return 120;
  }, [searchMode, providerFilter]);

  useEffect(() => {
    setSubmittedQuery(activeQuery.trim() || DEFAULT_MIXED_QUERY);
    setCurrentPage(1);
  }, [searchMode]);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: [
      "journal-match",
      submittedQuery,
      searchMode,
      providerFilter,
      dynamicMatchLimit,
    ],
    queryFn: () =>
      matchJournals({
        query: submittedQuery,
        mode: searchMode,
        provider: providerFilter,
        limit: dynamicMatchLimit,
      }),
    enabled: Boolean(submittedQuery.trim()),
    staleTime: 1000 * 60 * 5,
  });

  const journals = data?.data ?? [];
  const topics = data?.meta?.topics ?? [];
  const popularSearchTopics = useMemo(() => {
    const filtered = topics.filter(
      (topic) =>
        !["federated learning", "distributed systems"].includes(
          topic.toLowerCase(),
        ),
    );

    return filtered
      .filter((topic) => topic.toLowerCase() !== ALWAYS_VISIBLE_POPULAR_TOPIC)
      .slice(0, 7);
  }, [topics]);

  const processedJournals = useMemo(() => {
    const sorted = [...journals];

    sorted.sort((left, right) => {
      if (sortBy === "impact") {
        return (right.impactFactor || 0) - (left.impactFactor || 0);
      }
      if (sortBy === "decision") {
        const leftValue = left.decisionDays ?? Number.MAX_SAFE_INTEGER;
        const rightValue = right.decisionDays ?? Number.MAX_SAFE_INTEGER;
        return leftValue - rightValue;
      }
      if (sortBy === "title") {
        return left.title.localeCompare(right.title);
      }
      return (right.score || 0) - (left.score || 0);
    });

    return sorted;
  }, [journals, sortBy]);

  useEffect(() => {
    setCurrentPage(1);
  }, [submittedQuery, searchMode, providerFilter, sortBy]);

  const totalPages = Math.ceil(processedJournals.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentJournals = processedJournals.slice(
    startIndex,
    startIndex + itemsPerPage,
  );

  const runSearch = () => {
    const normalized = activeQuery.trim() || DEFAULT_MIXED_QUERY;
    setSubmittedQuery(normalized);
    if (normalized.length >= 3) {
      trackSearchInteraction(normalized, "journal");
    }
    setCurrentPage(1);
  };

  const openLink = (url?: string | null) => {
    if (!url) return;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const buildPrimaryLink = (journal: JournalMatchItem) =>
    journal.submissionLink ||
    journal.guideForAuthors ||
    journal.sourceUrl ||
    null;

  const buildSecondaryLink = (journal: JournalMatchItem) => {
    const primary = buildPrimaryLink(journal);
    const secondary = journal.sourceUrl || journal.guideForAuthors || null;
    return secondary && secondary !== primary ? secondary : null;
  };

  return (
    <div className="min-h-screen flex flex-col bg-background/50">
      <Navigation />

      <main className="flex-1">
        <div className="container mx-auto max-w-7xl px-4 py-12 md:py-16">
          <section className="rounded-3xl border border-border bg-card shadow-xl shadow-primary/5 overflow-hidden mb-12">
            <div className="border-b border-border bg-gradient-to-br from-primary/5 via-card to-background px-8 py-10 md:px-12 md:py-12">
              <div className="max-w-3xl space-y-6">
                <div className="flex flex-wrap items-center gap-3">
                  <Badge variant="secondary" className="px-4 py-1.5 text-xs font-semibold rounded-full bg-primary/10 text-primary border-none">
                    Computer Science Journals
                  </Badge>
                  <Badge variant="outline" className="px-4 py-1.5 text-xs font-medium rounded-full border-primary/20">
                    Refined recommendations
                  </Badge>
                </div>
                <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground">
                  Find Your Perfect Journal
                </h1>
                <p className="text-lg leading-relaxed text-muted-foreground">
                  Search by keyword for quick discovery, or paste an abstract to
                  surface journals with strong topical alignment, editorial fit,
                  and submission-ready details.
                </p>
              </div>
            </div>

            <div className="p-8 md:p-10 bg-card/50">
              <div className="rounded-2xl border border-border bg-background/80 backdrop-blur-sm p-6 md:p-8 shadow-inner">
                <div className="flex flex-col gap-6">
                  <div className="flex flex-col md:flex-row md:items-center gap-6 md:gap-12">
                    <button
                      type="button"
                      onClick={() => setSearchMode("abstract")}
                      className="inline-flex items-center gap-4 text-left group transition-all"
                    >
                      <span
                        className={`flex h-6 w-6 items-center justify-center rounded-full border-2 transition-all ${
                          searchMode === "abstract"
                            ? "border-primary bg-primary shadow-lg shadow-primary/20"
                            : "border-muted-foreground/30 group-hover:border-primary/50"
                        }`}
                      >
                        {searchMode === "abstract" && (
                          <span className="h-2.5 w-2.5 rounded-full bg-white" />
                        )}
                      </span>
                      <span className={`text-base font-semibold transition-colors ${
                        searchMode === "abstract" ? "text-foreground" : "text-muted-foreground group-hover:text-foreground/80"
                      }`}>
                        Match my abstract
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSearchMode("keyword")}
                      className="inline-flex items-center gap-4 text-left group transition-all"
                    >
                      <span
                        className={`flex h-6 w-6 items-center justify-center rounded-full border-2 transition-all ${
                          searchMode === "keyword"
                            ? "border-primary bg-primary shadow-lg shadow-primary/20"
                            : "border-muted-foreground/30 group-hover:border-primary/50"
                        }`}
                      >
                        {searchMode === "keyword" && (
                          <span className="h-2.5 w-2.5 rounded-full bg-white" />
                        )}
                      </span>
                      <span className={`text-base font-semibold transition-colors ${
                        searchMode === "keyword" ? "text-foreground" : "text-muted-foreground group-hover:text-foreground/80"
                      }`}>
                        Search by keywords
                      </span>
                    </button>
                  </div>

                  {searchMode === "keyword" ? (
                    <div className="space-y-4">
                      <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <Input
                          placeholder="Try machine learning, cloud computing, blockchain, cybersecurity..."
                          value={keywordQuery}
                          onChange={(event) =>
                            setKeywordQuery(event.target.value)
                          }
                          onKeyDown={(event) => {
                            if (event.key === "Enter") runSearch();
                          }}
                          className="h-14 rounded-xl pl-12 text-base border-muted-foreground/20 focus:border-primary transition-all shadow-sm"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <Textarea
                        value={abstractQuery}
                        onChange={(event) =>
                          setAbstractQuery(event.target.value)
                        }
                        placeholder="Paste your abstract and we’ll rank the journals most aligned with your manuscript."
                        className="min-h-[170px] rounded-xl text-[15px] md:text-base"
                      />
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-[1.1fr_1.1fr_auto] gap-3 mt-4">
                    <Select value={sortBy} onValueChange={setSortBy}>
                      <SelectTrigger className="h-12 rounded-xl">
                        <SelectValue placeholder="Sort results" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="score">Relevance</SelectItem>
                        <SelectItem value="impact">Impact factor</SelectItem>
                        <SelectItem value="decision">
                          Editorial speed
                        </SelectItem>
                        <SelectItem value="title">Journal name</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select
                      value={providerFilter}
                      onValueChange={(value: "all" | "springer" | "elsevier") =>
                        setProviderFilter(value)
                      }
                    >
                      <SelectTrigger className="h-12 rounded-xl">
                        <SelectValue placeholder="All publishers" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All publishers</SelectItem>
                        <SelectItem value="springer">Springer</SelectItem>
                        <SelectItem value="elsevier">Elsevier</SelectItem>
                      </SelectContent>
                    </Select>

                    <Button
                      onClick={runSearch}
                      size="lg"
                      className="h-12 rounded-xl px-7"
                    >
                      <Sparkles className="h-4 w-4" />
                      Update results
                    </Button>
                  </div>

                  <div className="mt-5">
                    <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground mb-3">
                      Popular searches
                    </p>
                    <div className="flex gap-2.5 overflow-x-auto whitespace-nowrap pb-1 pr-1 custom-scrollbar">
                      <Badge
                        variant="outline"
                        className="cursor-pointer rounded-full px-3.5 py-2 text-xs shrink-0"
                        onClick={() => {
                          setSearchMode("keyword");
                          setKeywordQuery(ALWAYS_VISIBLE_POPULAR_TOPIC);
                          setSubmittedQuery(ALWAYS_VISIBLE_POPULAR_TOPIC);
                        }}
                      >
                        {ALWAYS_VISIBLE_POPULAR_TOPIC}
                      </Badge>
                      {popularSearchTopics.map((topic) => (
                        <Badge
                          key={topic}
                          variant="outline"
                          className="cursor-pointer rounded-full px-3.5 py-2 text-xs shrink-0"
                          onClick={() => {
                            setSearchMode("keyword");
                            setKeywordQuery(topic);
                            setSubmittedQuery(topic);
                          }}
                        >
                          {topic}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <div className="mt-8 mb-5 flex items-center justify-between gap-4 border-b border-border pb-4">
            <div className="text-2xl font-semibold tracking-tight text-foreground">
              {isLoading || isFetching
                ? "Finding journals..."
                : `Showing ${startIndex + 1}-${Math.min(
                    startIndex + currentJournals.length,
                    processedJournals.length,
                  )} of ${processedJournals.length} results`}
            </div>
          </div>

          {isLoading ? (
            <div className="space-y-5">
              {[...Array(6)].map((_, index) => (
                <Card key={index} className="overflow-hidden rounded-2xl">
                  <CardContent className="p-6">
                    <div className="h-8 shimmer rounded mb-4"></div>
                    <div className="h-5 shimmer rounded mb-3 w-2/3"></div>
                    <div className="h-5 shimmer rounded w-1/2"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : currentJournals.length === 0 ? (
            <div className="text-center py-20">
              <h3 className="text-2xl font-bold mb-2">No journals found</h3>
              <p className="text-muted-foreground mb-6">
                Try a broader topic or a more descriptive abstract.
              </p>
              <Button
                onClick={() => {
                  setSearchMode("keyword");
                  setKeywordQuery("");
                  setSubmittedQuery(DEFAULT_MIXED_QUERY);
                }}
              >
                Try "{DEFAULT_MIXED_QUERY}"
              </Button>
            </div>
          ) : (
            <>
              <div className="space-y-5">
                {currentJournals.map((journal: JournalMatchItem) => {
                  const primaryLink = buildPrimaryLink(journal);
                  const secondaryLink = buildSecondaryLink(journal);
                  const subjectAreas = journal.subjectAreas || [];

                  return (
                    <Card
                      key={`${journal.provider}-${journal.issn || journal.title}`}
                      className="overflow-hidden rounded-2xl border border-border/80 bg-card shadow-sm"
                    >
                      <CardContent className="p-6 md:p-7">
                        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_320px] gap-6">
                          <div className="min-w-0">
                            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                              <div className="min-w-0">
                                <h3 className="text-[1.45rem] leading-tight font-semibold tracking-tight text-foreground">
                                  {journal.title}
                                </h3>
                                <div className="flex flex-wrap items-center gap-2 mt-3">
                                  <Badge
                                    variant="secondary"
                                    className="capitalize text-xs"
                                  >
                                    {journal.provider}
                                  </Badge>
                                  {journal.openAccessType && (
                                    <Badge
                                      variant="outline"
                                      className="text-xs"
                                    >
                                      {journal.openAccessType}
                                    </Badge>
                                  )}
                                  {journal.issn && (
                                    <span className="text-sm text-muted-foreground">
                                      ISSN {journal.issn}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
                              <div className="rounded-xl border border-border/70 px-4 py-4">
                                <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                                  Publishing model
                                </div>
                                <div className="mt-2 text-sm font-medium text-foreground">
                                  {journal.openAccessType ||
                                    journal.publishingModel ||
                                    "N/A"}
                                </div>
                              </div>
                              <div className="rounded-xl border border-border/70 px-4 py-4">
                                <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                                  Impact factor
                                </div>
                                <div className="mt-2 text-sm font-medium text-foreground">
                                  {journal.impactFactor ?? "N/A"}
                                </div>
                              </div>
                              <div className="rounded-xl border border-border/70 px-4 py-4">
                                <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                                  CiteScore
                                </div>
                                <div className="mt-2 text-sm font-medium text-foreground">
                                  {journal.citeScore ?? "N/A"}
                                </div>
                              </div>
                              <div className="rounded-xl border border-border/70 px-4 py-4">
                                <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                                  First decision
                                </div>
                                <div className="mt-2 text-sm font-medium text-foreground">
                                  {journal.decisionDays != null
                                    ? `${journal.decisionDays} days`
                                    : "N/A"}
                                </div>
                              </div>
                            </div>

                            {subjectAreas.length > 0 && (
                              <div className="mt-5">
                                <div className="flex flex-wrap gap-2">
                                  {subjectAreas.slice(0, 6).map((subject) => (
                                    <Badge
                                      key={subject}
                                      variant="outline"
                                      className="rounded-md border-slate-300 px-3 py-1.5 text-xs"
                                    >
                                      {subject}
                                    </Badge>
                                  ))}
                                  {subjectAreas.length > 6 && (
                                    <Badge
                                      variant="outline"
                                      className="rounded-md border-slate-300 px-3 py-1.5 text-xs"
                                    >
                                      +{subjectAreas.length - 6} more
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>

                          <div className="rounded-2xl bg-slate-50/90 border border-slate-200 p-6 flex flex-col justify-between">
                            <div>
                              <div className="flex items-start gap-3">
                                <div className="mt-0.5 rounded-xl bg-white p-2 border border-slate-200">
                                  <CheckCircle2 className="h-5 w-5 text-slate-700" />
                                </div>
                                <div>
                                  <p className="text-sm md:text-[15px] leading-7 text-slate-700">
                                    Review journal details and submission
                                    guidance before moving forward with your
                                    manuscript.
                                  </p>
                                </div>
                              </div>
                            </div>

                            <div className="mt-6 space-y-3">
                              {primaryLink && (
                                <Button
                                  variant="default"
                                  size="lg"
                                  onClick={() => openLink(primaryLink)}
                                  className="w-full rounded-xl"
                                >
                                  View journal
                                  <ExternalLink className="h-4 w-4" />
                                </Button>
                              )}

                              {secondaryLink && (
                                <Button
                                  variant="outline"
                                  size="lg"
                                  onClick={() => openLink(secondaryLink)}
                                  className="w-full rounded-xl"
                                >
                                  Submission details
                                  <ExternalLink className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-12">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentPage((page) => page - 1)}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>

                  {Array.from(
                    { length: Math.min(totalPages, 5) },
                    (_, index) => {
                      let page = index + 1;
                      if (totalPages > 5) {
                        if (currentPage <= 3) page = index + 1;
                        else if (currentPage >= totalPages - 2) {
                          page = totalPages - 4 + index;
                        } else {
                          page = currentPage - 2 + index;
                        }
                      }

                      return (
                        <Button
                          key={page}
                          variant={page === currentPage ? "default" : "outline"}
                          className="w-10"
                          onClick={() => setCurrentPage(page)}
                        >
                          {page}
                        </Button>
                      );
                    },
                  )}

                  <Button
                    variant="outline"
                    onClick={() => setCurrentPage((page) => page + 1)}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Journals;
