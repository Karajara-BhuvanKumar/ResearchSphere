import { useEffect, useMemo, useState } from "react";
import {
  Search,
  BookOpen,
  Users,
  ArrowRight,
  Globe,
  GraduationCap,
  ExternalLink,
  Bookmark,
  Bell,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
// import AssistantWidget from "@/components/AssistantWidget";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  matchJournals,
  searchHarvestedData,
  type HarvestItem,
  type JournalMatchItem,
} from "@/services/apiClient";
import {
  getPersonalizedItems,
  getInteractions,
  getReminders,
  getReminderStatusInfo,
  trackItemInteraction,
  trackSearchInteraction,
  removeReminderByItemId,
  removeWatchlistItem,
  getUserPreferences,
  getWatchlist,
} from "@/lib/personalization";

type QuickReminderFilter = "all" | "overdue" | "this-week" | "upcoming";

const GENERIC_NOISE_TAGS = new Set([
  "preprint",
  "article",
  "conference",
  "cfp",
  "call for papers",
  "paper",
  "research",
  "academic",
  "publication",
  "journal",
  "proceedings",
  "workshop",
  "symposium",
  "submit",
  "submission",
  "call",
  "open",
  "special",
  "issue",
  "volume",
  "international",
  "annual",
  "ieee",
  "acm",
  "springer",
  "computer science",
  "cs",
  "phd",
  "postdoc",
  "internship",
  "project-call",
  "project call",
  "fellowship",
  "scholarship",
  "jobs",
  "job",
  "call",
  "proposal",
  "proposals",
  "position",
  "positions",
  "research opportunity",
  "opportunity",
  "opportunities",
  "india",
  "global",
]);

const CURATED_RESEARCH_TOPICS = [
  "machine learning",
  "deep learning",
  "computer vision",
  "cybersecurity",
  "cloud computing",
  "natural language processing",
  "data science",
  "blockchain",
  "distributed systems",
  "quantum computing",
  "reinforcement learning",
  "human computer interaction",
];

const TOPIC_ALIASES: Record<string, string[]> = {
  "machine learning": ["machine learning", "ml"],
  "deep learning": ["deep learning"],
  "computer vision": ["computer vision", "vision"],
  cybersecurity: ["cybersecurity", "cyber security", "security"],
  "cloud computing": ["cloud", "cloud computing"],
  "natural language processing": [
    "natural language processing",
    "nlp",
    "language model",
    "large language model",
    "llm",
  ],
  "data science": ["data science", "data mining", "big data"],
  blockchain: ["blockchain"],
  "distributed systems": [
    "distributed systems",
    "distributed system",
    "systems",
  ],
  "quantum computing": ["quantum computing", "quantum"],
  "reinforcement learning": ["reinforcement learning", "rl"],
  "human computer interaction": ["human computer interaction", "hci"],
};

const INTEREST_ALIAS_OVERRIDES: Record<string, string[]> = {
  cybersecurity: ["cybersecurity", "cyber security", "security", "infosec"],
  cybersecuriyy: ["cybersecurity", "cyber security", "security", "infosec"],
  "machine learning": ["machine learning", "ml"],
  machinelearning: ["machine learning", "ml"],
  deeplearning: ["deep learning"],
};

const normalizeTopicText = (value: string) =>
  value
    .toLowerCase()
    .replace(/[-_/]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const extractTopicMatches = (value: string): string[] => {
  const normalized = ` ${normalizeTopicText(value)} `;
  const matches: string[] = [];

  Object.entries(TOPIC_ALIASES).forEach(([topic, aliases]) => {
    if (aliases.some((alias) => normalized.includes(` ${normalizeTopicText(alias)} `))) {
      matches.push(topic);
    }
  });

  return matches;
};

const buildInterestMatchers = (interests: string[]): string[] => {
  const matchers = new Set<string>();

  interests.forEach((interest) => {
    const normalized = normalizeTopicText(interest);
    if (!normalized) return;

    const overridden = INTEREST_ALIAS_OVERRIDES[normalized] || [normalized];
    overridden.forEach((alias) => {
      const compact = normalizeTopicText(alias);
      if (compact.length >= 2) {
        matchers.add(compact);
      }
    });

    // Also add token-level terms for flexible matching of custom interests.
    normalized.split(" ").forEach((token) => {
      if (token.length >= 4) {
        matchers.add(token);
      }
    });
  });

  return [...matchers];
};

const Index = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [quickPanelOpen, setQuickPanelOpen] = useState(false);
  const [quickPanelType, setQuickPanelType] = useState<
    "watchlist" | "reminders"
  >("watchlist");
  const navigate = useNavigate();
  const location = useLocation();
  const currentYear = new Date().getFullYear();
  const [preferences, setPreferences] = useState(() => getUserPreferences());
  const [watchlist, setWatchlist] = useState(() => getWatchlist());
  const [reminders, setReminders] = useState(() => getReminders());
  const [interactionEvents, setInteractionEvents] = useState(() =>
    getInteractions(),
  );
  const [quickReminderFilter, setQuickReminderFilter] =
    useState<QuickReminderFilter>("all");

  useEffect(() => {
    const sync = () => {
      setPreferences(getUserPreferences());
      setWatchlist(getWatchlist());
      setReminders(getReminders());
      setInteractionEvents(getInteractions());
    };

    window.addEventListener("focus", sync);
    window.addEventListener("storage", sync);

    return () => {
      window.removeEventListener("focus", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  useEffect(() => {
    setPreferences(getUserPreferences());
    setWatchlist(getWatchlist());
    setReminders(getReminders());
    setInteractionEvents(getInteractions());
  }, [location.pathname]);

  const { data: featuredConferences = [], isLoading: conferencesLoading } =
    useQuery({
      queryKey: ["home-featured-conferences", currentYear],
      queryFn: () =>
        searchHarvestedData({
          kind: "conference",
          year: currentYear,
          includePast: false,
          limit: 6,
        }),
      staleTime: 1000 * 60 * 10,
    });

  const { data: featuredJournals = [], isLoading: journalsLoading } = useQuery({
    queryKey: ["home-featured-journals", "machine-learning", "keyword"],
    queryFn: async () => {
      const response = await matchJournals({
        query: "machine learning",
        mode: "keyword",
        provider: "all",
        limit: 6,
      });

      return response.data;
    },
    staleTime: 1000 * 60 * 5,
  });

  const journalIntentQuery = useMemo(() => {
    const interest = preferences.interests
      .map((item) => item.trim())
      .find(Boolean);
    return interest || "machine learning";
  }, [preferences.interests]);

  const { data: matchedPersonalizedJournals = [] } = useQuery({
    queryKey: ["home-personalized-journals", journalIntentQuery],
    queryFn: async () => {
      const response = await matchJournals({
        query: journalIntentQuery,
        mode: "keyword",
        provider: "all",
        limit: 20,
      });

      return response.data;
    },
    staleTime: 1000 * 60 * 5,
  });

  const { data: featuredOpportunities = [], isLoading: opportunitiesLoading } =
    useQuery({
      queryKey: ["home-featured-opportunities", currentYear],
      queryFn: () =>
        searchHarvestedData({
          kind: "opportunity",
          fromYear: currentYear,
          limit: 6,
        }),
      staleTime: 1000 * 60 * 10,
    });

  const { data: homepageItems = [] } = useQuery({
    queryKey: ["home-items", currentYear],
    queryFn: () =>
      searchHarvestedData({
        fromYear: currentYear,
        limit: 120,
      }),
    staleTime: 1000 * 60 * 10,
  });

  const trendingTopics = useMemo(() => {
    const frequency = new Map<string, number>();

    const addTopicScore = (topic: string, score: number) => {
      frequency.set(topic, (frequency.get(topic) || 0) + score);
    };

    interactionEvents.forEach((event) => {
      const signalText = [event.query || "", event.title || "", ...(event.tags || [])]
        .join(" ")
        .trim();

      if (!signalText) return;

      extractTopicMatches(signalText).forEach((topic) => {
        addTopicScore(topic, event.type === "search" ? 5 : 2);
      });
    });

    homepageItems.forEach((item: HarvestItem) => {
      (item.tags || []).forEach((tag) => {
        const normalized = normalizeTopicText(tag);
        if (
          !normalized ||
          normalized === item.kind?.toLowerCase() ||
          normalized === (item.subtype || "").toLowerCase() ||
          GENERIC_NOISE_TAGS.has(normalized) ||
          normalized.length < 3
        ) {
          return;
        }

        const topicMatches = extractTopicMatches(normalized);
        if (topicMatches.length > 0) {
          topicMatches.forEach((topic) => addTopicScore(topic, 3));
          return;
        }

        if (
          normalized.includes("learning") ||
          normalized.includes("vision") ||
          normalized.includes("security") ||
          normalized.includes("cloud") ||
          normalized.includes("blockchain") ||
          normalized.includes("computing")
        ) {
          addTopicScore(normalized, 1);
        }
      });
    });

    CURATED_RESEARCH_TOPICS.forEach((topic) => {
      addTopicScore(topic, 0.25);
    });

    const ranked = [...frequency.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([topic]) => topic)
      .slice(0, 10);

    if (ranked.length < 5) {
      CURATED_RESEARCH_TOPICS.forEach((topic) => {
        if (!ranked.includes(topic) && ranked.length < 10) {
          ranked.push(topic);
        }
      });
    }

    return ranked;
  }, [homepageItems, interactionEvents]);

  const personalizedItems = useMemo(() => {
    const interestMatchers = buildInterestMatchers(preferences.interests);
    const interestScopedItems =
      interestMatchers.length > 0
        ? homepageItems.filter((item) => {
            const haystack = normalizeTopicText(
              [item.title, item.summary || "", ...(item.tags || [])].join(" "),
            );
            return interestMatchers.some((matcher) => haystack.includes(matcher));
          })
        : homepageItems;

    const candidateItems =
      interestScopedItems.length >= 3 ? interestScopedItems : homepageItems;

    const matchedJournalItems: HarvestItem[] = matchedPersonalizedJournals.map(
      (journal, index) => {
        const provider = (journal.provider || "").trim();
        const providerLabel = provider
          ? provider.charAt(0).toUpperCase() + provider.slice(1)
          : "Journal";

        return {
          id: `home-personalized-journal-${journal.issn || journal.title}-${index}`,
          kind: "journal",
          subtype: "journal",
          title: journal.title,
          summary: journal.scopeSnippet || journal.scope || null,
          organization: providerLabel,
          sourceName: providerLabel,
          url:
            journal.submissionLink ||
            journal.guideForAuthors ||
            journal.sourceUrl ||
            "/journals",
          tags: journal.subjectAreas || journal.topicSeeds || [],
          score: journal.score,
        };
      },
    );

    const combinedItems = [
      ...candidateItems.filter((item) => item.kind !== "journal"),
      ...matchedJournalItems,
    ];

    const selected: HarvestItem[] = [];
    const seen = new Set<string>();

    const pushUnique = (item?: HarvestItem) => {
      if (!item || seen.has(item.id)) return;
      selected.push(item);
      seen.add(item.id);
    };

    const topJournal = getPersonalizedItems(
      matchedJournalItems,
      preferences,
      1,
    )[0];
    const topConference = getPersonalizedItems(
      combinedItems.filter((item) => item.kind === "conference"),
      preferences,
      1,
    )[0];

    // Ensure baseline mix before filling remaining slots.
    pushUnique(topJournal);
    pushUnique(topConference);

    getPersonalizedItems(combinedItems, preferences, 12).forEach(pushUnique);

    if (selected.length < 4) {
      combinedItems.forEach(pushUnique);
    }

    return selected.slice(0, 4);
  }, [homepageItems, preferences, matchedPersonalizedJournals]);

  const reminderRows = useMemo(() => {
    return reminders.map((item) => {
      const status = getReminderStatusInfo(item);
      const dueText =
        status.daysUntil === null
          ? "Date unavailable"
          : status.daysUntil < 0
            ? `${Math.abs(status.daysUntil)} day${Math.abs(status.daysUntil) === 1 ? "" : "s"} overdue`
            : status.daysUntil === 0
              ? "Due today"
              : `Due in ${status.daysUntil} day${status.daysUntil === 1 ? "" : "s"}`;

      return { item, status, dueText };
    });
  }, [reminders]);

  const reminderCounts = useMemo(
    () => ({
      overdue: reminderRows.filter(({ status }) => status.state === "overdue")
        .length,
      thisWeek: reminderRows.filter(
        ({ status }) =>
          status.daysUntil !== null &&
          status.daysUntil >= 0 &&
          status.daysUntil <= 7,
      ).length,
    }),
    [reminderRows],
  );

  const filteredReminderRows = useMemo(() => {
    return reminderRows.filter(({ status }) => {
      if (quickReminderFilter === "all") return true;
      if (quickReminderFilter === "overdue") return status.state === "overdue";
      if (quickReminderFilter === "upcoming") {
        return status.state === "upcoming" || status.state === "today";
      }
      if (quickReminderFilter === "this-week") {
        return (
          status.daysUntil !== null &&
          status.daysUntil >= 0 &&
          status.daysUntil <= 7
        );
      }
      return true;
    });
  }, [quickReminderFilter, reminderRows]);

  const handleSearch = () => {
    const normalized = searchQuery.trim();
    if (normalized) {
      trackSearchInteraction(normalized);
      navigate(`/general-finder?q=${encodeURIComponent(normalized)}`);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const getJournalLink = (journal: JournalMatchItem) =>
    journal.submissionLink || journal.guideForAuthors || journal.sourceUrl || "/journals";

  const getJournalSource = (journal: JournalMatchItem) => {
    if (!journal.provider) return "Journal";
    return journal.provider.charAt(0).toUpperCase() + journal.provider.slice(1);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />

      <div className="flex-1">
        {/* Hero */}
        <section className="gradient-hero border-b border-border">
          <div className="container mx-auto px-4 py-12 md:py-20">
            <div className="grid lg:grid-cols-[1.3fr_0.7fr] gap-12 items-start">
              <div className="space-y-6">
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  ResearchSphere &mdash; {currentYear}
                </p>
                <h1 className="heading-display text-5xl md:text-6xl lg:text-[5rem] text-foreground leading-[1.08]">
                  Find conferences,
                  <br className="hidden md:block" />
                  journals &amp;
                  <br className="hidden md:block" />
                  research opportunities.
                </h1>
                <p className="text-base text-muted-foreground max-w-lg leading-relaxed">
                  A centralized research discovery platform for CS professionals
                  &mdash; covering conferences, journals, PhD and postdoc calls.
                </p>
                <div className="flex flex-wrap gap-3">
                  <Button
                    size="lg"
                    onClick={() => navigate("/general-finder")}
                    className="h-11 px-6"
                  >
                    Open General Finder
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={() => navigate("/conferences")}
                    className="h-11 px-6"
                  >
                    Browse Conferences
                  </Button>
                </div>
              </div>

              <div className="lg:pt-14">
                <div className="bg-card/95 border border-border rounded-2xl p-5 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                    Quick Search
                  </p>
                  <div className="flex flex-col gap-2.5">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="e.g. NeurIPS, machine learning, postdoc..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyPress={handleKeyPress}
                        className="pl-9 h-10"
                      />
                    </div>
                    <Button onClick={handleSearch} className="h-10 w-full">
                      Search
                    </Button>
                  </div>
                  <div className="mt-4 pt-4 border-t border-border/60">
                    <p className="text-xs text-muted-foreground mb-2">
                      Common searches
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        "machine learning",
                        "phd 2026",
                        "NeurIPS",
                        "data science",
                      ].map((topic) => (
                        <button
                          key={topic}
                          type="button"
                          onClick={() =>
                            navigate(
                              `/general-finder?q=${encodeURIComponent(topic)}`,
                            )
                          }
                          className="text-xs px-2.5 py-1 rounded-md bg-secondary text-secondary-foreground hover:bg-primary hover:text-primary-foreground transition-colors"
                        >
                          {topic}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Quick navigation strip */}
        <section className="border-b border-border">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-border">
              <Link
                to="/conferences"
                className="group flex items-center gap-3 px-4 py-5 hover:bg-muted/40 transition-colors first:pl-0"
              >
                <div className="p-2 rounded-lg bg-primary/10 text-primary flex-shrink-0">
                  <Users className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-sm text-foreground">
                    Conferences
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {currentYear} venues &amp; CFPs
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 ml-auto text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
              </Link>
              <Link
                to="/journals"
                className="group flex items-center gap-3 px-4 py-5 hover:bg-muted/40 transition-colors"
              >
                <div className="p-2 rounded-lg bg-primary/10 text-primary flex-shrink-0">
                  <BookOpen className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-sm text-foreground">
                    Journals &amp; Preprints
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Latest research streams
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 ml-auto text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
              </Link>
              <Link
                to="/project-calls"
                className="group flex items-center gap-3 px-4 py-5 hover:bg-muted/40 transition-colors last:pr-0"
              >
                <div className="p-2 rounded-lg bg-primary/10 text-primary flex-shrink-0">
                  <GraduationCap className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-sm text-foreground">
                    Research Opportunities
                  </p>
                  <p className="text-xs text-muted-foreground">
                    PhD, postdoc, internships
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 ml-auto text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
              </Link>
            </div>
          </div>
        </section>

        {/* Trending topics */}
        <section className="container mx-auto px-4 py-10">
          <div className="flex items-baseline gap-3 mb-5">
            <h2 className="text-base font-semibold text-foreground">
              Trending Research Areas
            </h2>
            <span className="text-xs text-muted-foreground">
              Based on recent activity
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {(trendingTopics.length > 0
              ? trendingTopics
              : [
                  "machine learning",
                  "large language models",
                  "blockchain",
                  "data science",
                  "computer vision",
                  "cybersecurity",
                  "generative ai",
                  "cloud computing",
                  "deep learning",
                  "quantum computing",
                ]
            ).map((topic, i) => (
              <button
                key={topic}
                type="button"
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-border bg-background text-sm text-foreground hover:border-primary hover:text-primary transition-colors"
                onClick={() =>
                  navigate(`/general-finder?q=${encodeURIComponent(topic)}`)
                }
              >
                <span className="text-[10px] font-mono text-muted-foreground">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="capitalize">{topic}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Featured Conferences */}
        <section className="bg-muted/30 border-y border-border py-10">
          <div className="container mx-auto px-4">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-base font-semibold text-foreground">
                  Featured Conferences
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {currentYear} upcoming venues
                </p>
              </div>
              <Link to="/conferences">
                <Button variant="ghost" size="sm" className="gap-1 text-xs h-8">
                  View all <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>

            {conferencesLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {[...Array(6)].map((_, i) => (
                  <div
                    key={i}
                    className="h-28 bg-card border border-border rounded-lg shimmer"
                  />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {featuredConferences.map((item: HarvestItem) => (
                  <a
                    key={item.id}
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group block bg-card border border-border rounded-lg p-4 hover:border-primary/50 hover:shadow-sm transition-all"
                  >
                    <h3 className="font-medium text-sm text-foreground line-clamp-2 mb-2 group-hover:text-primary transition-colors">
                      {item.title}
                    </h3>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      {item.location && (
                        <span className="flex items-center gap-1">
                          <Globe className="h-3 w-3" /> {item.location}
                        </span>
                      )}
                      {item.eventDate && <span>{item.eventDate}</span>}
                    </div>
                    <div className="mt-3 flex items-center gap-1 text-xs text-primary font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                      Open <ExternalLink className="h-3 w-3" />
                    </div>
                  </a>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="container mx-auto px-4 py-10">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-semibold text-foreground">For You</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Personalized using your interests and preferred location.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setQuickPanelType("watchlist");
                  setQuickPanelOpen(true);
                }}
              >
                <Badge
                  variant="outline"
                  className="text-xs cursor-pointer hover:border-primary"
                >
                  <Bookmark className="h-3 w-3 mr-1" />
                  {watchlist.length} watchlist
                </Badge>
              </button>
              <button
                type="button"
                onClick={() => {
                  setQuickPanelType("reminders");
                  setQuickReminderFilter("all");
                  setQuickPanelOpen(true);
                }}
              >
                <Badge
                  variant="outline"
                  className="text-xs cursor-pointer hover:border-primary"
                >
                  <Bell className="h-3 w-3 mr-1" />
                  {reminders.length} reminders
                </Badge>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {personalizedItems.map((item) => (
              <a
                key={item.id}
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group block bg-card border border-border rounded-xl p-4 hover:border-primary/50 hover:shadow-sm transition-all"
                onClick={() => trackItemInteraction(item, "open")}
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <Badge variant="outline" className="text-xs capitalize">
                    {item.kind}
                  </Badge>
                  {item.subtype && (
                    <span className="text-xs text-muted-foreground">
                      {item.subtype}
                    </span>
                  )}
                </div>
                <h3 className="font-medium text-sm text-foreground line-clamp-2 mb-2 group-hover:text-primary transition-colors">
                  {item.title}
                </h3>
                <p className="text-xs text-muted-foreground line-clamp-1">
                  {item.location ||
                    item.organization ||
                    item.sourceName ||
                    "Research update"}
                </p>
              </a>
            ))}
          </div>
        </section>

        {/* Journals + Opportunities side by side */}
        <section className="container mx-auto px-4 py-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="rounded-2xl border border-border bg-card shadow-sm p-4 md:p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-semibold text-foreground">
                  Latest Journals
                </h2>
                <Link to="/journals">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1 text-xs h-8"
                  >
                    View all <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </Link>
              </div>
              <div className="bg-background border border-border rounded-xl divide-y divide-border overflow-hidden">
                {journalsLoading
                  ? [...Array(5)].map((_, i) => (
                      <div key={i} className="px-4 py-3.5">
                        <div className="h-4 shimmer rounded w-3/4 mb-1.5" />
                        <div className="h-3 shimmer rounded w-1/3" />
                      </div>
                    ))
                  : featuredJournals.map((item: JournalMatchItem, index: number) => (
                      <a
                        key={`${item.title}-${index}`}
                        href={getJournalLink(item)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group flex items-center justify-between gap-3 px-4 py-3.5 hover:bg-muted/40 transition-colors"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                            {item.title}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {getJournalSource(item)}
                          </p>
                        </div>
                        <Badge variant="secondary" className="text-[11px] flex-shrink-0">
                          journal
                        </Badge>
                      </a>
                    ))}
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card shadow-sm p-4 md:p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-semibold text-foreground">
                  Latest Opportunities
                </h2>
                <Link to="/project-calls">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1 text-xs h-8"
                  >
                    View all <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </Link>
              </div>
              <div className="bg-background border border-border rounded-xl divide-y divide-border overflow-hidden">
                {opportunitiesLoading
                  ? [...Array(5)].map((_, i) => (
                      <div key={i} className="px-4 py-3.5">
                        <div className="h-4 shimmer rounded w-3/4 mb-1.5" />
                        <div className="h-3 shimmer rounded w-1/3" />
                      </div>
                    ))
                  : featuredOpportunities.map((item: HarvestItem) => (
                      <a
                        key={item.id}
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group flex items-center justify-between gap-3 px-4 py-3.5 hover:bg-muted/40 transition-colors"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                            {item.title}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {item.organization ||
                              item.sourceName ||
                              "Research Opportunity"}
                          </p>
                        </div>
                        <Badge variant="secondary" className="text-[11px] flex-shrink-0">
                          {item.subtype || "opportunity"}
                        </Badge>
                      </a>
                    ))}
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="border-t border-border py-12 md:py-14">
          <div className="container mx-auto px-4">
            <div className="max-w-xl">
                <h2 className="heading-display text-3xl md:text-4xl text-foreground mb-3">
                  Everything in one place.
                </h2>
                <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
                  Use General Finder to search across all sources &mdash;
                  conferences, journals, PhD positions, postdoc calls, and more.
                </p>
                <div className="flex flex-wrap gap-3">
                  <Link to="/general-finder">
                    <Button className="gap-2 h-10">
                      Open General Finder
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Link to="/project-calls">
                    <Button variant="outline" className="h-10">
                      View Opportunities
                    </Button>
                  </Link>
                </div>
            </div>
          </div>
        </section>
      </div>

      <Footer />
      {/* <AssistantWidget /> */}

      <Sheet open={quickPanelOpen} onOpenChange={setQuickPanelOpen}>
        <SheetContent side="right" className="w-[420px] sm:max-w-[420px]">
          <SheetHeader>
            <SheetTitle>
              {quickPanelType === "watchlist" ? "Watchlist" : "Reminders"}
            </SheetTitle>
            <SheetDescription>
              Quick view and remove actions. Use User Hub for full management.
            </SheetDescription>
          </SheetHeader>

          <div className="mt-4 space-y-3 max-h-[70vh] overflow-y-auto pr-1">
            {quickPanelType === "watchlist" ? (
              watchlist.length ? (
                watchlist.map((item) => (
                  <div
                    key={item.id}
                    className="border border-border rounded-md p-3 text-xs"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium line-clamp-2 hover:text-primary"
                      >
                        {item.title}
                      </a>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() =>
                          setWatchlist(removeWatchlistItem(item.id))
                        }
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                    <p className="text-muted-foreground mt-1 capitalize">
                      {item.kind}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">
                  No watchlist items yet.
                </p>
              )
            ) : reminders.length ? (
              <>
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant={
                      quickReminderFilter === "all" ? "default" : "outline"
                    }
                    onClick={() => setQuickReminderFilter("all")}
                  >
                    All ({reminders.length})
                  </Button>
                  <Button
                    size="sm"
                    variant={
                      quickReminderFilter === "overdue" ? "default" : "outline"
                    }
                    onClick={() => setQuickReminderFilter("overdue")}
                  >
                    Overdue ({reminderCounts.overdue})
                  </Button>
                  <Button
                    size="sm"
                    variant={
                      quickReminderFilter === "this-week"
                        ? "default"
                        : "outline"
                    }
                    onClick={() => setQuickReminderFilter("this-week")}
                  >
                    This week ({reminderCounts.thisWeek})
                  </Button>
                  <Button
                    size="sm"
                    variant={
                      quickReminderFilter === "upcoming" ? "default" : "outline"
                    }
                    onClick={() => setQuickReminderFilter("upcoming")}
                  >
                    Upcoming
                  </Button>
                </div>

                {filteredReminderRows.map(({ item, status, dueText }) => (
                  <div
                    key={item.id}
                    className="border border-border rounded-md p-3 text-xs"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium line-clamp-2 hover:text-primary"
                      >
                        {item.title}
                      </a>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() =>
                          setReminders(removeReminderByItemId(item.itemId))
                        }
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="mt-1 flex items-center gap-2 flex-wrap">
                      <Badge
                        variant={
                          status.state === "overdue"
                            ? "destructive"
                            : status.state === "today"
                              ? "default"
                              : "secondary"
                        }
                        className="text-[10px] capitalize"
                      >
                        {status.state === "today" ? "today" : status.state}
                      </Badge>
                      <p className="text-muted-foreground">{dueText}</p>
                      <p className="text-muted-foreground">• {item.date}</p>
                    </div>
                  </div>
                ))}

                {filteredReminderRows.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    No reminders match this filter.
                  </p>
                )}
              </>
            ) : (
              <p className="text-sm text-muted-foreground">No reminders set.</p>
            )}
          </div>

          <div className="mt-5 pt-4 border-t border-border flex items-center justify-between">
            <Button
              variant="outline"
              onClick={() => {
                setQuickPanelOpen(false);
                navigate("/user-hub");
              }}
            >
              Manage all in User Hub
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default Index;
