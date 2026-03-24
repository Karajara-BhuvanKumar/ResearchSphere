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
  searchHarvestedDataWithMeta,
  type HarvestItem,
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

  const {
    data: searchResponse,
    isLoading,
    isFetching,
  } = useQuery({
    queryKey: [
      "finder-search",
      debouncedQuery,
      selectedKind,
      page,
      currentYear,
    ],
    queryFn: () =>
      searchHarvestedDataWithMeta({
        query: debouncedQuery,
        kind: selectedKind,
        year: selectedKind === "conference" ? currentYear : undefined,
        includePast: selectedKind === "conference" ? false : undefined,
        fromYear:
          selectedKind === "journal" ||
          selectedKind === "opportunity" ||
          selectedKind === undefined
            ? currentYear
            : undefined,
        page,
        limit: pageSize,
      }),
    staleTime: 1000 * 60 * 2,
  });

  const results = searchResponse?.data || [];
  const meta = searchResponse?.meta;
  const totalPages = meta ? Math.max(1, Math.ceil(meta.total / meta.limit)) : 1;
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
        {/* Inline header + search */}
        <section className="border-b border-border bg-background">
          <div className="container mx-auto px-4 py-8">
            <div className="mb-5">
              <h1 className="text-2xl font-semibold text-foreground tracking-tight">
                Finder
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Search across conferences, journals, and research opportunities.
              </p>
            </div>
            <div className="flex flex-col md:flex-row gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="machine learning, NeurIPS, postdoc, CFP..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleManualSearch()}
                  className="pl-9 h-10"
                />
              </div>
              <div className="flex gap-2">
                <Button className="h-10 px-6" onClick={handleManualSearch}>
                  Search
                </Button>
              </div>
            </div>
            <div className="mt-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <Tabs
                value={activeTab}
                onValueChange={(value) =>
                  setActiveTab(
                    value as "all" | "conference" | "journal" | "opportunity",
                  )
                }
              >
                <TabsList>
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="conference">Conferences</TabsTrigger>
                  <TabsTrigger value="journal">Journals</TabsTrigger>
                  <TabsTrigger value="opportunity">Opportunities</TabsTrigger>
                </TabsList>
              </Tabs>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="h-9 w-full md:w-52">
                  <SelectValue placeholder="Sort" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="relevance">Sort: Relevance</SelectItem>
                  <SelectItem value="date-newest">Date: Newest</SelectItem>
                  <SelectItem value="date-oldest">Date: Oldest</SelectItem>
                  <SelectItem value="title-asc">Title: A to Z</SelectItem>
                  <SelectItem value="title-desc">Title: Z to A</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {savedSearches.length > 0 && (
              <div className="mt-4 flex gap-2 flex-wrap">
                {savedSearches.slice(0, 6).map((saved) => (
                  <Badge
                    key={saved.id}
                    variant="secondary"
                    className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
                    onClick={() => {
                      setSearchQuery(saved.query);
                      setDebouncedQuery(saved.query);
                      if (
                        saved.kind &&
                        ["conference", "journal", "opportunity"].includes(
                          saved.kind,
                        )
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
            )}
          </div>
        </section>

        <div className="container mx-auto px-4 py-8 space-y-6">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {isFetching
                ? "Updating..."
                : `Showing ${sortedResults.length} of ${meta?.total || 0} results`}
            </p>
            <Button variant="outline" size="sm" onClick={saveCurrentSearch}>
              Save search
            </Button>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {[...Array(9)].map((_, i) => (
                <div
                  key={i}
                  className="bg-card border border-border rounded-lg p-4"
                >
                  <div className="h-4 shimmer rounded mb-3" />
                  <div className="h-3 shimmer rounded mb-2" />
                  <div className="h-3 shimmer rounded w-2/3" />
                </div>
              ))}
            </div>
          ) : results.length === 0 ? (
            <div className="text-center py-16">
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
                  className="bg-card border border-border rounded-lg p-4 hover:border-primary/40 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2.5">
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

                  <h3 className="font-medium text-sm text-foreground line-clamp-2 mb-2">
                    {item.title}
                  </h3>

                  <div className="space-y-1 text-xs text-muted-foreground mb-3">
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

                  <div className="mt-3 flex items-center gap-2 flex-wrap">
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
