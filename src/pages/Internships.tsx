import { useState, useEffect, useMemo } from "react";
import {
  Search,
  MapPin,
  Users,
  ExternalLink,
  Microscope,
  CalendarDays,
  Building2,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { useSearchParams } from "react-router-dom";
import { searchHarvestedData, type HarvestItem } from "@/services/apiClient";

const getCanonicalSourceLabel = (
  item: Pick<HarvestItem, "sourceId" | "sourceName">,
) => {
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
  if (sourceId.startsWith("researchtweet-") || normalizedName.includes("researchtweet")) {
    return "ResearchTweet";
  }
  if (sourceId.startsWith("noticebard-") || normalizedName.includes("noticebard")) {
    return "NoticeBard";
  }
  if (normalizedName.includes("iit kanpur")) {
    return "IIT Kanpur";
  }
  if (normalizedName.includes("iisc")) {
    return "IISc Bengaluru";
  }
  if (normalizedName.includes("iit madras")) {
    return "IIT Madras";
  }
  if (normalizedName.includes("iit kharagpur")) {
    return "IIT Kharagpur";
  }
  if (normalizedName.includes("isro")) {
    return "ISRO";
  }
  if (normalizedName.includes("eth zurich")) {
    return "ETH Zurich";
  }
  if (normalizedName.includes("microsoft research")) {
    return "Microsoft Research";
  }

  return sourceName || "Unknown source";
};

const formatDisplayDate = (value?: string | null) => {
  if (!value) return null;
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) return value;
  return new Date(parsed).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const Internships = () => {
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
      if (searchQuery) {
        setSearchParams({ q: searchQuery });
      } else {
        setSearchParams({});
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery, setSearchParams]);

  const {
    data: internships = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["internships", debouncedQuery],
    queryFn: () =>
      searchHarvestedData({
        kind: "opportunity",
        subtype: "internship",
        query: debouncedQuery,
        fromYear: new Date().getFullYear(),
        limit: 100,
      }),
    staleTime: 1000 * 60 * 10,
  });

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedQuery, sourceFilter, sortBy]);

  const sourceOptions = useMemo(() => {
    const unique = new Set(
      internships.map((item) => getCanonicalSourceLabel(item)).filter(Boolean),
    );
    return Array.from(unique).sort((a, b) => String(a).localeCompare(String(b)));
  }, [internships]);

  const processedInternships = useMemo(() => {
    const parseDate = (value?: string | null) => {
      if (!value) return 0;
      const parsed = Date.parse(value);
      return Number.isNaN(parsed) ? 0 : parsed;
    };

    const filtered = internships.filter((item) => {
      if (sourceFilter !== "all") {
        return getCanonicalSourceLabel(item) === sourceFilter;
      }
      return true;
    });

    return [...filtered].sort((a, b) => {
      if (sortBy === "title-asc") return a.title.localeCompare(b.title);
      if (sortBy === "title-desc") return b.title.localeCompare(a.title);
      if (sortBy === "date-oldest") {
        return parseDate(a.eventDate || a.deadline) - parseDate(b.eventDate || b.deadline);
      }
      return parseDate(b.eventDate || b.deadline) - parseDate(a.eventDate || a.deadline);
    });
  }, [internships, sourceFilter, sortBy]);

  const totalPages = Math.max(1, Math.ceil(processedInternships.length / itemsPerPage));
  const currentInternships = processedInternships.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  return (
    <div className="min-h-screen flex flex-col bg-[hsl(var(--background))]">
      <Navigation />

      <main className="flex-1">
        <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
          <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-violet-50/60 shadow-[0_24px_70px_-50px_rgba(15,23,42,0.45)]">
            <div className="border-b border-slate-200/80 px-5 py-5 sm:px-8 sm:py-7">
              <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                <span className="rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-violet-700">
                  Research opportunities
                </span>
                <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-slate-600">
                  Internships
                </span>
              </div>
              <div className="mt-4 max-w-3xl">
                <h1 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-[2.1rem]">
                  Find research internships across India and international labs
                </h1>
                <p className="mt-3 text-[15px] leading-7 text-slate-600 sm:text-base">
                  Browse research internships in computer science, AI, machine learning,
                  data science, systems, and adjacent fields from academic institutions,
                  research labs, and curated global programs.
                </p>
              </div>
            </div>

            <div className="px-5 py-5 sm:px-8 sm:py-7">
              <div className="rounded-[24px] border border-slate-200 bg-white/90 p-4 shadow-sm sm:p-6">
                <div className="grid gap-4 lg:grid-cols-[minmax(0,1.55fr)_240px_220px]">
                  <div className="space-y-2">
                    <div className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                      Search openings
                    </div>
                    <div className="relative">
                      <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                      <Input
                        placeholder="Search by research area, lab, institution, or internship program"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="h-14 rounded-2xl border-slate-200 pl-12 text-[15px] shadow-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                      Source
                    </div>
                    <Select value={sourceFilter} onValueChange={setSourceFilter}>
                      <SelectTrigger className="h-14 rounded-2xl border-slate-200 text-[15px]">
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
                  </div>

                  <div className="space-y-2">
                    <div className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                      Sort by
                    </div>
                    <Select value={sortBy} onValueChange={setSortBy}>
                      <SelectTrigger className="h-14 rounded-2xl border-slate-200 text-[15px]">
                        <SelectValue placeholder="Sort" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="date-newest">Date: Newest</SelectItem>
                        <SelectItem value="date-oldest">Date: Oldest</SelectItem>
                        <SelectItem value="title-asc">Title: A to Z</SelectItem>
                        <SelectItem value="title-desc">Title: Z to A</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

              </div>
            </div>
          </section>

          <section className="mt-8">
            <div className="flex flex-col gap-2 border-b border-slate-200 pb-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Research experience opportunities</p>
                <h2 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">
                  {processedInternships.length} internships found
                </h2>
              </div>
              <p className="text-sm text-slate-500">
                Programs from Indian institutes, global universities, and research labs.
              </p>
            </div>

            {isLoading ? (
              <div className="py-16 text-center text-muted-foreground">
                Loading internship opportunities...
              </div>
            ) : error ? (
              <div className="py-16 text-center text-red-500">
                Error loading internship opportunities. Please try again later.
              </div>
            ) : processedInternships.length === 0 ? (
              <div className="py-16 text-center text-muted-foreground text-lg">
                No internships found matching "{searchQuery}"
              </div>
            ) : (
              <div className="mt-6 space-y-5">
                {currentInternships.map((internship: HarvestItem) => {
                  const sourceLabel = getCanonicalSourceLabel(internship);
                  const startDate = formatDisplayDate(internship.eventDate);
                  const deadline = formatDisplayDate(internship.deadline) || internship.deadline;

                  return (
                    <Card
                      key={internship.id}
                      className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_18px_48px_-38px_rgba(15,23,42,0.4)] transition-all duration-200 hover:border-violet-200 hover:shadow-[0_24px_60px_-42px_rgba(139,92,246,0.35)]"
                    >
                      <CardContent className="p-0">
                        <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_280px]">
                          <div className="p-5 sm:p-6">
                            <div className="flex flex-wrap items-center gap-2">
                              <Badge className="rounded-full bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-700 hover:bg-violet-50">
                                Research internship
                              </Badge>
                              <Badge
                                variant="secondary"
                                className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-700"
                              >
                                {sourceLabel}
                              </Badge>
                              {internship.location && (
                                <Badge
                                  variant="secondary"
                                  className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-700"
                                >
                                  <MapPin className="mr-1.5 h-3.5 w-3.5" />
                                  {internship.location}
                                </Badge>
                              )}
                            </div>

                            <h3 className="mt-4 text-[1.45rem] font-semibold leading-tight tracking-tight text-slate-950">
                              {internship.title}
                            </h3>

                            <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-slate-600">
                              <span className="inline-flex items-center gap-2">
                                <Building2 className="h-4 w-4 text-slate-400" />
                                {internship.organization || sourceLabel}
                              </span>
                              {startDate && (
                                <span className="inline-flex items-center gap-2">
                                  <CalendarDays className="h-4 w-4 text-slate-400" />
                                  Starts {startDate}
                                </span>
                              )}
                            </div>

                            {internship.summary && (
                              <p className="mt-4 max-w-4xl text-[15px] leading-7 text-slate-600 line-clamp-3">
                                {internship.summary}
                              </p>
                            )}

                            <div className="mt-5 grid gap-3 sm:grid-cols-3">
                              <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                                <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                                  Opportunity type
                                </div>
                                <div className="mt-2 text-sm font-medium text-slate-900">
                                  Research internship
                                </div>
                              </div>
                              <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                                <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                                  Deadline
                                </div>
                                <div className="mt-2 text-sm font-medium text-slate-900">
                                  {deadline || "Check source"}
                                </div>
                              </div>
                              <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                                <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                                  Source
                                </div>
                                <div className="mt-2 text-sm font-medium text-slate-900">
                                  {sourceLabel}
                                </div>
                              </div>
                            </div>

                            {internship.tags && internship.tags.length > 0 && (
                              <div className="mt-5 flex flex-wrap gap-2">
                                {internship.tags.slice(0, 6).map((tag) => (
                                  <Badge
                                    key={tag}
                                    variant="secondary"
                                    className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700"
                                  >
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>

                          <aside className="border-t border-slate-200 bg-slate-50/70 p-5 sm:p-6 lg:border-l lg:border-t-0">
                            <div className="flex h-full flex-col justify-between gap-5">
                              <div>
                                <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-100 text-violet-700">
                                  <Microscope className="h-5 w-5" />
                                </div>
                                <h4 className="mt-4 text-base font-semibold text-slate-950">
                                  Review the program details before applying
                                </h4>
                                <p className="mt-2 text-sm leading-6 text-slate-600">
                                  Confirm eligibility, duration, stipend or funding support,
                                  project area, and required materials directly from the source page.
                                </p>
                              </div>

                              <Button
                                className="h-11 rounded-xl text-sm font-medium"
                                asChild
                              >
                                <a href={internship.url} target="_blank" rel="noopener noreferrer">
                                  View internship <ExternalLink className="ml-1 h-4 w-4" />
                                </a>
                              </Button>
                            </div>
                          </aside>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}

                {totalPages > 1 && (
                  <div className="flex justify-center items-center gap-2 pt-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      Page {currentPage} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                )}
              </div>
            )}
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Internships;
