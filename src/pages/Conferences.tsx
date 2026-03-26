import { useState, useEffect, useMemo } from "react";
import {
  Search,
  MapPin,
  Calendar,
  ExternalLink,
  Globe,
  CheckCircle2,
} from "lucide-react";
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
import { useQuery } from "@tanstack/react-query";
import { searchHarvestedData, type HarvestItem } from "@/services/apiClient";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Skeleton } from "@/components/ui/skeleton";
import { trackSearchInteraction } from "@/lib/personalization";

const getCountryFromLocation = (location?: string | null) => {
  if (!location) return "Unknown";
  const normalized = String(location).trim();
  if (!normalized) return "Unknown";
  const parts = normalized
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
  return parts.length > 0 ? parts[parts.length - 1] : normalized;
};

const Conferences = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [locationFilter, setLocationFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const {
    data: conferences = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["conferences", debouncedQuery],
    queryFn: () =>
      searchHarvestedData({
        kind: "conference",
        query: debouncedQuery,
        year: new Date().getFullYear(),
        includePast: false,
        limit: 100,
      }),
    staleTime: 1000 * 60 * 10,
  });

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedQuery, locationFilter, sortBy]);

  useEffect(() => {
    const query = debouncedQuery.trim();
    if (query.length >= 3) {
      trackSearchInteraction(query, "conference");
    }
  }, [debouncedQuery]);

  const locationOptions = useMemo(() => {
    const countryCount = conferences.reduce<Record<string, number>>(
      (accumulator, item) => {
        const country = getCountryFromLocation(item.location);
        if (!country || country === "Unknown") return accumulator;
        accumulator[country] = (accumulator[country] || 0) + 1;
        return accumulator;
      },
      {},
    );

    const rankedCountries = Object.entries(countryCount).sort(
      (a, b) => b[1] - a[1] || a[0].localeCompare(b[0]),
    );

    const majorCountries = rankedCountries.filter(([, count]) => count >= 2);
    const finalCountries =
      majorCountries.length > 0 ? majorCountries : rankedCountries;

    return finalCountries.slice(0, 12).map(([country]) => country);
  }, [conferences]);

  const processedConferences = useMemo(() => {
    const filtered = conferences.filter((item) => {
      if (locationFilter !== "all") {
        return getCountryFromLocation(item.location) === locationFilter;
      }
      return true;
    });

    const parseDate = (value?: string | null) => {
      if (!value) return 0;
      const parsed = Date.parse(value);
      return Number.isNaN(parsed) ? 0 : parsed;
    };

    return [...filtered].sort((a, b) => {
      if (sortBy === "title-asc") {
        return a.title.localeCompare(b.title);
      }
      if (sortBy === "title-desc") {
        return b.title.localeCompare(a.title);
      }
      if (sortBy === "oldest") {
        return parseDate(a.eventDate) - parseDate(b.eventDate);
      }
      return parseDate(b.eventDate) - parseDate(a.eventDate);
    });
  }, [conferences, locationFilter, sortBy]);

  const totalPages = Math.max(
    1,
    Math.ceil(processedConferences.length / itemsPerPage),
  );
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentConferences = processedConferences.slice(
    startIndex,
    startIndex + itemsPerPage,
  );

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
                    Computer Science Conferences
                  </Badge>
                  <Badge variant="outline" className="px-4 py-1.5 text-xs font-medium rounded-full border-primary/20">
                    Upcoming venues and deadlines
                  </Badge>
                </div>
                <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground">
                  Discover Premier Conferences
                </h1>
                <p className="text-lg leading-relaxed text-muted-foreground">
                  Search upcoming conference venues, review dates and locations,
                  and jump directly to official conference pages and submission
                  information.
                </p>
              </div>
            </div>

            <div className="p-8 md:p-10 bg-card/50">
              <div className="rounded-2xl border border-border bg-background/80 backdrop-blur-sm p-6 md:p-8 shadow-inner">
                <div className="space-y-6">
                  <div className="relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <Input
                      placeholder="Try CVPR, NeurIPS, ICML, computer vision, systems..."
                      value={searchQuery}
                      onChange={(event) => setSearchQuery(event.target.value)}
                      className="h-14 rounded-xl pl-12 text-base border-muted-foreground/20 focus:border-primary transition-all shadow-sm"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground ml-1">
                        Sort By
                      </label>
                      <Select value={sortBy} onValueChange={setSortBy}>
                        <SelectTrigger className="h-12 rounded-xl border-muted-foreground/20">
                          <SelectValue placeholder="Sort conferences" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="newest">
                            Date: Newest first
                          </SelectItem>
                          <SelectItem value="oldest">
                            Date: Oldest first
                          </SelectItem>
                          <SelectItem value="title-asc">Title: A to Z</SelectItem>
                          <SelectItem value="title-desc">
                            Title: Z to A
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground ml-1">
                        Location
                      </label>
                      <Select
                        value={locationFilter}
                        onValueChange={setLocationFilter}
                      >
                        <SelectTrigger className="h-12 rounded-xl border-muted-foreground/20">
                          <SelectValue placeholder="All locations" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All locations</SelectItem>
                          {locationOptions.map((location) => (
                            <SelectItem key={location} value={location}>
                              {location}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <div className="flex items-center justify-between gap-4 border-b border-border pb-6 mb-8">
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              {isLoading
                ? "Finding conferences..."
                : `Showing ${startIndex + 1}-${Math.min(
                    startIndex + currentConferences.length,
                    processedConferences.length,
                  )} of ${processedConferences.length} results`}
            </h2>
          </div>

          {isLoading ? (
            <div className="space-y-5">
              {[1, 2, 3, 4].map((index) => (
                <Card key={index} className="overflow-hidden rounded-2xl">
                  <CardContent className="p-6">
                    <Skeleton className="h-8 w-3/4 mb-4" />
                    <Skeleton className="h-5 w-1/2 mb-3" />
                    <Skeleton className="h-5 w-1/3" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-500">
                Error loading conferences. Please try again later.
              </p>
            </div>
          ) : processedConferences.length === 0 ? (
            <div className="text-center py-12 bg-card rounded-2xl border border-dashed">
              <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">No conferences found</h3>
              <p className="text-muted-foreground">
                Try adjusting your search terms.
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-5">
                {currentConferences.map((conf: HarvestItem) => (
                  <Card
                    key={conf.id}
                    className="overflow-hidden rounded-2xl border border-border/80 bg-card shadow-sm"
                  >
                    <CardContent className="p-6 md:p-7">
                      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_320px] gap-6">
                        <div className="min-w-0">
                          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                            <div className="min-w-0">
                              <h3 className="text-[1.45rem] leading-tight font-semibold tracking-tight text-foreground">
                                {conf.title}
                              </h3>
                              <div className="flex flex-wrap items-center gap-2 mt-3">
                                <Badge variant="secondary" className="text-xs">
                                  {conf.subtype
                                    ? conf.subtype.toUpperCase()
                                    : "CONFERENCE"}
                                </Badge>
                                {conf.location && (
                                  <Badge variant="outline" className="text-xs">
                                    {getCountryFromLocation(conf.location)}
                                  </Badge>
                                )}
                                {conf.sourceName && (
                                  <span className="text-sm text-muted-foreground">
                                    {conf.sourceName}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-6">
                            <div className="rounded-xl border border-border/70 px-4 py-4">
                              <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                                Event date
                              </div>
                              <div className="mt-2 text-sm font-medium text-foreground flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                {conf.eventDate || "TBA"}
                              </div>
                            </div>
                            <div className="rounded-xl border border-border/70 px-4 py-4">
                              <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                                Location
                              </div>
                              <div className="mt-2 text-sm font-medium text-foreground flex items-center gap-2">
                                <MapPin className="h-4 w-4 text-muted-foreground" />
                                {conf.location || "TBA"}
                              </div>
                            </div>
                            <div className="rounded-xl border border-border/70 px-4 py-4">
                              <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                                Venue type
                              </div>
                              <div className="mt-2 text-sm font-medium text-foreground flex items-center gap-2">
                                <Globe className="h-4 w-4 text-muted-foreground" />
                                {conf.kind || "Conference"}
                              </div>
                            </div>
                          </div>

                          {conf.summary && (
                            <p className="mt-5 text-[15px] leading-7 text-muted-foreground">
                              {conf.summary}
                            </p>
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
                                  Review the venue page for deadlines, calls for
                                  papers, and submission instructions before
                                  planning your next conference submission.
                                </p>
                              </div>
                            </div>
                          </div>

                          {conf.url && (
                            <div className="mt-6">
                              <Button
                                size="lg"
                                className="w-full rounded-xl"
                                onClick={() => window.open(conf.url, "_blank")}
                              >
                                Visit conference website
                                <ExternalLink className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-12">
                  <Button
                    variant="outline"
                    onClick={() =>
                      setCurrentPage((prev) => Math.max(1, prev - 1))
                    }
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
                    onClick={() =>
                      setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                    }
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

export default Conferences;
