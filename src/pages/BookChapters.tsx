import { useEffect, useMemo, useState } from "react";
import {
  BookOpen,
  Calendar,
  CheckCircle2,
  ExternalLink,
  Search,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { searchHarvestedData, type HarvestItem } from "@/services/apiClient";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const PRIORITY_BOOK_CHAPTER_SOURCES = [
  "IGI Global",
  "INFORMS Connect",
  "IntechOpen",
  "ResearchTweet",
  "NoticeBard",
  "KY Publications",
];

const getCanonicalSourceLabel = (
  item: Pick<HarvestItem, "sourceId" | "sourceName">,
) => {
  const sourceId = (item.sourceId || "").toLowerCase();
  const sourceName = (item.sourceName || "").trim();
  const normalizedName = sourceName.toLowerCase();

  if (sourceId.startsWith("bookchapter-informs-") || normalizedName.includes("informs")) {
    return "INFORMS Connect";
  }
  if (sourceId.startsWith("bookchapter-igi-") || normalizedName.includes("igi global")) {
    return "IGI Global";
  }
  if (sourceId.startsWith("bookchapter-intechopen-") || normalizedName.includes("intechopen")) {
    return "IntechOpen";
  }
  if (sourceId.startsWith("researchtweet-") || normalizedName.includes("researchtweet")) {
    return "ResearchTweet";
  }
  if (sourceId.startsWith("noticebard-") || normalizedName.includes("noticebard")) {
    return "NoticeBard";
  }
  if (sourceId.startsWith("bookchapter-ky-") || normalizedName.includes("ky publications")) {
    return "KY Publications";
  }

  return sourceName || "Unknown source";
};

const parseDate = (value?: string | null) => {
  if (!value) return 0;
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? 0 : parsed;
};

const formatDate = (value?: string | null) => {
  if (!value) return "Not specified";
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) return value;
  return new Date(parsed).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const BookChapters = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [sortBy, setSortBy] = useState("date-newest");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 450);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const {
    data: bookChapterCalls = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["book-chapter-calls", debouncedQuery],
    queryFn: () =>
      searchHarvestedData({
        kind: "opportunity",
        subtype: "book-chapter",
        query: debouncedQuery,
        includePast: true,
        limit: 150,
      }),
    staleTime: 1000 * 60 * 30,
  });

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedQuery, sourceFilter, sortBy]);

  const sourceOptions = useMemo(() => {
    const unique = new Set(
      bookChapterCalls
        .map((item) => getCanonicalSourceLabel(item))
        .filter(Boolean),
    );
    PRIORITY_BOOK_CHAPTER_SOURCES.forEach((source) => unique.add(source));

    return Array.from(unique).sort((left, right) => left.localeCompare(right));
  }, [bookChapterCalls]);

  const processedCalls = useMemo(() => {
    const isBookChapterCall = (item: HarvestItem) => {
      const corpus = `${item.title || ""} ${item.summary || ""} ${(item.tags || []).join(" ")}`.toLowerCase();
      const hasChapterSignal =
        item.subtype === "book-chapter" ||
        item.tags?.includes("book-chapter") ||
        /(book\s+chapter|book\s+chapters|chapter\s+proposal|chapter\s+submission|chapter\s+submissions|chapter\s+proposals|call\s+for\s+chapters?)/.test(
          corpus,
        );
      const looksLikeConferenceOnly =
        corpus.includes("conference") &&
        !/(book\s+chapter|book\s+chapters|chapter\s+proposal|chapter\s+submission|call\s+for\s+chapters?)/.test(
          corpus,
        );

      return hasChapterSignal && !looksLikeConferenceOnly;
    };

    const freshnessThreshold = new Date();
    freshnessThreshold.setFullYear(freshnessThreshold.getFullYear() - 1);
    const minFreshTime = freshnessThreshold.getTime();

    const isFreshEnough = (item: HarvestItem) => {
      const timestamp = parseDate(item.deadline) || parseDate(item.eventDate);
      if (!timestamp) return true;
      return timestamp >= minFreshTime;
    };

    const filtered = bookChapterCalls
      .filter(isBookChapterCall)
      .filter(isFreshEnough)
      .filter((item) => {
        if (sourceFilter !== "all") {
          return getCanonicalSourceLabel(item) === sourceFilter;
        }
        return true;
      });

    return [...filtered].sort((left, right) => {
      if (sortBy === "title-asc") return left.title.localeCompare(right.title);
      if (sortBy === "title-desc") return right.title.localeCompare(left.title);
      if (sortBy === "date-oldest") {
        return (
          parseDate(left.deadline || left.eventDate) -
          parseDate(right.deadline || right.eventDate)
        );
      }
      return (
        parseDate(right.deadline || right.eventDate) -
        parseDate(left.deadline || left.eventDate)
      );
    });
  }, [bookChapterCalls, sourceFilter, sortBy]);

  const totalPages = Math.max(1, Math.ceil(processedCalls.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentCalls = processedCalls.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navigation />

      <div className="flex-1">
        <div className="container mx-auto max-w-[1380px] px-5 py-8 md:px-6 md:py-10">
          <section className="rounded-[28px] border border-border bg-card shadow-sm overflow-hidden">
            <div className="border-b border-border bg-gradient-to-r from-slate-100 via-white to-slate-50 px-6 py-6 md:px-8 md:py-7">
              <div className="max-w-4xl">
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <Badge variant="secondary" className="px-3 py-1 text-xs">
                    Book Chapter Calls
                  </Badge>
                  <Badge variant="outline" className="px-3 py-1 text-xs">
                    Edited volumes and chapter opportunities
                  </Badge>
                </div>
                <p className="text-[15px] leading-7 text-muted-foreground md:text-base">
                  Explore current calls for chapters across curated academic
                  sources, compare deadlines quickly, and open the original call
                  page for full contributor guidance.
                </p>
              </div>
            </div>

            <div className="p-6 md:p-8">
              <div className="rounded-2xl border border-border bg-background p-4 md:p-5">
                <div className="space-y-4">
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      placeholder="Try artificial intelligence, cybersecurity, data science, IoT..."
                      value={searchQuery}
                      onChange={(event) => setSearchQuery(event.target.value)}
                      className="h-14 rounded-xl pl-12 text-[15px] md:text-base"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr] gap-3">
                    <Select value={sourceFilter} onValueChange={setSourceFilter}>
                      <SelectTrigger className="h-12 rounded-xl">
                        <SelectValue placeholder="All sources" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All sources</SelectItem>
                        {sourceOptions.map((source) => (
                          <SelectItem key={source} value={source}>
                            {source}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select value={sortBy} onValueChange={setSortBy}>
                      <SelectTrigger className="h-12 rounded-xl">
                        <SelectValue placeholder="Sort chapter calls" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="date-newest">Date: Newest first</SelectItem>
                        <SelectItem value="date-oldest">Date: Oldest first</SelectItem>
                        <SelectItem value="title-asc">Title: A to Z</SelectItem>
                        <SelectItem value="title-desc">Title: Z to A</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <div className="mt-8 mb-5 flex items-center justify-between gap-4 border-b border-border pb-4">
            <div className="text-2xl font-semibold tracking-tight text-foreground">
              {isLoading
                ? "Finding chapter calls..."
                : `Showing ${startIndex + 1}-${Math.min(
                    startIndex + currentCalls.length,
                    processedCalls.length,
                  )} of ${processedCalls.length} results`}
            </div>
          </div>

          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4].map((item) => (
                <Card key={item} className="rounded-[24px] border border-border shadow-sm">
                  <CardContent className="p-6 md:p-7">
                    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_260px]">
                      <div className="space-y-4">
                        <Skeleton className="h-7 w-3/4" />
                        <Skeleton className="h-5 w-1/3" />
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <Skeleton className="h-20 rounded-2xl" />
                          <Skeleton className="h-20 rounded-2xl" />
                          <Skeleton className="h-20 rounded-2xl" />
                        </div>
                      </div>
                      <Skeleton className="h-full min-h-[180px] rounded-3xl" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : error ? (
            <div className="rounded-3xl border border-destructive/20 bg-destructive/5 px-6 py-10 text-center text-destructive">
              Failed to load book chapter calls. Please try again.
            </div>
          ) : currentCalls.length === 0 ? (
            <div className="rounded-3xl border border-border bg-card px-6 py-12 text-center text-muted-foreground">
              No book chapter calls found for your current search and filters.
            </div>
          ) : (
            <div className="space-y-4">
              {currentCalls.map((call) => {
                const sourceLabel = getCanonicalSourceLabel(call);
                const displayDate = formatDate(call.deadline || call.eventDate);

                return (
                  <Card
                    key={call.id}
                    className="rounded-[24px] border border-border shadow-sm transition-shadow duration-200 hover:shadow-md"
                  >
                    <CardContent className="p-6 md:p-7">
                      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_260px]">
                        <div className="space-y-5">
                          <div className="space-y-3">
                            <div className="flex flex-wrap items-center gap-2">
                              <Badge
                                variant="secondary"
                                className="rounded-full px-3 py-1 text-xs font-medium"
                              >
                                {sourceLabel}
                              </Badge>
                              <Badge
                                variant="outline"
                                className="rounded-full px-3 py-1 text-xs font-medium"
                              >
                                Call for chapters
                              </Badge>
                            </div>

                            <h2 className="text-[1.45rem] font-semibold tracking-tight text-foreground">
                              {call.title}
                            </h2>
                          </div>

                          <p className="max-w-4xl text-sm leading-7 text-muted-foreground md:text-[15px]">
                            {call.summary || "Open the source page for full chapter themes, contributor guidelines, and submission requirements."}
                          </p>

                          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                            <div className="rounded-2xl border border-border bg-background px-4 py-4">
                              <div className="text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
                                Source
                              </div>
                              <div className="mt-2 text-sm font-medium text-foreground">
                                {sourceLabel}
                              </div>
                            </div>

                            <div className="rounded-2xl border border-border bg-background px-4 py-4">
                              <div className="text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
                                Publisher / community
                              </div>
                              <div className="mt-2 text-sm font-medium text-foreground">
                                {call.organization || sourceLabel}
                              </div>
                            </div>

                            <div className="rounded-2xl border border-border bg-background px-4 py-4">
                              <div className="text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
                                Deadline / update
                              </div>
                              <div className="mt-2 inline-flex items-center gap-2 text-sm font-medium text-foreground">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                {displayDate}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="rounded-[28px] border border-border bg-slate-50 px-5 py-5">
                          <div className="flex h-full flex-col justify-between gap-5">
                            <div className="space-y-3 text-sm leading-6 text-muted-foreground">
                              <div className="inline-flex items-center gap-2 text-foreground">
                                <CheckCircle2 className="h-4 w-4 text-primary" />
                                Contributor guidance
                              </div>
                              <p>
                                Review the chapter themes, scope, formatting
                                rules, and important dates on the original
                                source page before preparing your proposal.
                              </p>
                            </div>

                            <Button
                              asChild
                              className="h-11 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90"
                            >
                              <a
                                href={call.url}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                View chapter call
                                <ExternalLink className="ml-2 h-4 w-4" />
                              </a>
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}

              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setCurrentPage((previous) => Math.max(1, previous - 1))
                    }
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>

                  <div className="rounded-full border border-border px-4 py-2 text-sm text-muted-foreground">
                    Page {currentPage} of {totalPages}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setCurrentPage((previous) =>
                        Math.min(totalPages, previous + 1),
                      )
                    }
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default BookChapters;
