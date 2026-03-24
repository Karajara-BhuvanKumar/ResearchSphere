import { useEffect, useMemo, useState } from "react";
import {
  Building2,
  Calendar,
  CheckCircle2,
  ExternalLink,
  Search,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
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

const getCanonicalSourceLabel = (item: Pick<HarvestItem, "sourceName" | "sourceId">) => {
  const sourceId = (item.sourceId || "").toLowerCase();
  const sourceName = (item.sourceName || "").trim();
  const normalizedName = sourceName.toLowerCase();

  if (sourceId.startsWith("jobsacuk-") || normalizedName.includes("jobs.ac.uk")) {
    return "Jobs.ac.uk";
  }
  if (
    sourceId.startsWith("sciencecareers-") ||
    normalizedName.includes("science careers") ||
    normalizedName.includes("sciencecareers")
  ) {
    return "Science Careers";
  }
  if (sourceId.includes("anrf") || normalizedName.includes("anrf")) {
    return "ANRF";
  }
  if (sourceId.includes("dst") || normalizedName.includes("department of science") || normalizedName.includes("dst")) {
    return "DST";
  }
  if (sourceId.includes("meity") || normalizedName.includes("meity")) {
    return "MeitY";
  }
  if (sourceId.includes("csir") || normalizedName.includes("csir")) {
    return "CSIR";
  }
  if (sourceId.includes("isro") || normalizedName.includes("isro")) {
    return "ISRO";
  }
  if (sourceId.includes("drdo") || normalizedName.includes("drdo")) {
    return "DRDO";
  }
  if (
    sourceId.includes("icssr") ||
    normalizedName.includes("icssr") ||
    normalizedName.includes("icsr")
  ) {
    return "ICSSR";
  }
  if (sourceId.includes("nirf") || normalizedName.includes("nirf")) {
    return "NIRF";
  }
  if (sourceId.includes("aicte") || normalizedName.includes("aicte")) {
    return "AICTE";
  }

  return sourceName || "Unknown source";
};

const formatDisplayDate = (value?: string | null) => {
  if (!value) return "Not specified";
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) return value;
  return new Date(parsed).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const parseSortableDate = (value?: string | null) => {
  if (!value) return 0;
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? 0 : parsed;
};

const PRIORITY_PROJECT_CALL_SOURCES = [
  "ANRF",
  "DST",
  "MeitY",
  "CSIR",
  "ISRO",
  "DRDO",
  "ICSSR",
  "NIRF",
];

const ProjectCalls = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get("q") || "";
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery);
  const [sourceFilter, setSourceFilter] = useState("all");
  const [sortBy, setSortBy] = useState("date-newest");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
      if (searchQuery.trim()) {
        setSearchParams({ q: searchQuery.trim() });
      } else {
        setSearchParams({});
      }
    }, 450);

    return () => clearTimeout(timer);
  }, [searchQuery, setSearchParams]);

  const {
    data: projects = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["project-opportunities", debouncedQuery],
    queryFn: () =>
      searchHarvestedData({
        kind: "opportunity",
        subtype: "project-call",
        query: debouncedQuery,
        fromYear: new Date().getFullYear(),
        limit: 120,
      }),
    staleTime: 1000 * 60 * 5,
  });

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedQuery, sourceFilter, sortBy]);

  const sourceOptions = useMemo(() => {
    const unique = new Set(
      projects.map((item) => getCanonicalSourceLabel(item)).filter(Boolean),
    );
    PRIORITY_PROJECT_CALL_SOURCES.forEach((source) => unique.add(source));

    return Array.from(unique).sort((left, right) =>
      left.localeCompare(right),
    );
  }, [projects]);

  const processedProjects = useMemo(() => {
    const filtered = projects.filter((item) => {
      if (
        sourceFilter !== "all" &&
        getCanonicalSourceLabel(item) !== sourceFilter
      ) {
        return false;
      }

      return true;
    });

    return [...filtered].sort((left, right) => {
      if (sortBy === "title-asc") {
        return left.title.localeCompare(right.title);
      }
      if (sortBy === "title-desc") {
        return right.title.localeCompare(left.title);
      }
      if (sortBy === "date-oldest") {
        return (
          parseSortableDate(left.eventDate || left.deadline) -
          parseSortableDate(right.eventDate || right.deadline)
        );
      }

      return (
        parseSortableDate(right.eventDate || right.deadline) -
        parseSortableDate(left.eventDate || left.deadline)
      );
    });
  }, [projects, sourceFilter, sortBy]);

  const totalPages = Math.max(
    1,
    Math.ceil(processedProjects.length / itemsPerPage),
  );
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentProjects = processedProjects.slice(
    startIndex,
    startIndex + itemsPerPage,
  );

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
                    Research Project Calls
                  </Badge>
                  <Badge variant="outline" className="px-3 py-1 text-xs">
                    Grants, proposals, and funding notices
                  </Badge>
                </div>
                <p className="text-[15px] leading-7 text-muted-foreground md:text-base">
                  Search active project calls, fellowships, and official
                  funding announcements across major research sources, then
                  jump straight to the source page for full submission details.
                </p>
              </div>
            </div>

            <div className="p-6 md:p-8">
              <div className="rounded-2xl border border-border bg-background p-4 md:p-5">
                <div className="space-y-4">
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      placeholder="Try quantum computing, AI, cybersecurity, grants, fellowships..."
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
                        <SelectValue placeholder="Sort opportunities" />
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
                ? "Finding project calls..."
                : `Showing ${startIndex + 1}-${Math.min(
                    startIndex + currentProjects.length,
                    processedProjects.length,
                  )} of ${processedProjects.length} results`}
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
              Error loading project calls. Please try again later.
            </div>
          ) : processedProjects.length === 0 ? (
            <div className="rounded-3xl border border-border bg-card px-6 py-12 text-center text-muted-foreground">
              No project calls found for "{debouncedQuery || "your current filters"}".
            </div>
          ) : (
            <div className="space-y-4">
              {currentProjects.map((project) => {
                const sourceLabel = getCanonicalSourceLabel(project);
                const displayDate = formatDisplayDate(
                  project.deadline || project.eventDate,
                );

                return (
                  <Card
                    key={project.id}
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
                                Project call
                              </Badge>
                            </div>

                            <h2 className="text-[1.45rem] font-semibold tracking-tight text-foreground">
                              {project.title}
                            </h2>

                            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
                              <span className="inline-flex items-center gap-2">
                                <Building2 className="h-4 w-4" />
                                {project.organization || sourceLabel}
                              </span>
                              <span className="inline-flex items-center gap-2">
                                <Calendar className="h-4 w-4" />
                                {displayDate}
                              </span>
                            </div>
                          </div>

                          <p className="max-w-4xl text-sm leading-7 text-muted-foreground md:text-[15px]">
                            {project.summary || "Open the official source for full call details and application instructions."}
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
                                Category
                              </div>
                              <div className="mt-2 text-sm font-medium text-foreground capitalize">
                                Project call
                              </div>
                            </div>

                            <div className="rounded-2xl border border-border bg-background px-4 py-4">
                              <div className="text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
                                Deadline / update
                              </div>
                              <div className="mt-2 text-sm font-medium text-foreground">
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
                                Official source guidance
                              </div>
                              <p>
                                Review the source notice, eligibility, funding
                                terms, and submission instructions before
                                preparing your application.
                              </p>
                            </div>

                            <Button
                              asChild
                              className="h-11 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90"
                            >
                              <a
                                href={project.url}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                View official call
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

export default ProjectCalls;
