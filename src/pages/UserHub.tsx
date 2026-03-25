import { useMemo, useState } from "react";
import { Bell, Bookmark, RefreshCw, Search, Settings, X } from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import PageHero from "@/components/PageHero";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { searchHarvestedData } from "@/services/apiClient";
import {
  getUserPreferences,
  saveUserPreferences,
  type TargetKind,
  type UserPreferences,
  getWatchlist,
  getReminders,
  getSavedSearches,
  removeWatchlistItem,
  removeReminderByItemId,
  removeSavedSearch,
  getReminderStatusInfo,
  getSavedSearchCheckpoints,
  upsertSavedSearchCheckpoint,
  trackSearchInteraction,
} from "@/lib/personalization";

type ReminderFilter = "all" | "overdue" | "this-week" | "upcoming";

const UserHub = () => {
  const [preferences, setPreferences] = useState<UserPreferences>(() =>
    getUserPreferences(),
  );
  const [interestsInput, setInterestsInput] = useState(
    preferences.interests.join(", "),
  );
  const [watchlist, setWatchlist] = useState(() => getWatchlist());
  const [reminders, setReminders] = useState(() => getReminders());
  const [savedSearches, setSavedSearches] = useState(() => getSavedSearches());
  const [searchCheckpoints, setSearchCheckpoints] = useState(() =>
    getSavedSearchCheckpoints(),
  );
  const [isRunningSearches, setIsRunningSearches] = useState(false);
  const [saved, setSaved] = useState(false);
  const [reminderFilter, setReminderFilter] = useState<ReminderFilter>("all");

  const checkpointBySearchId = useMemo(
    () =>
      new Map(
        searchCheckpoints.map((checkpoint) => [
          checkpoint.searchId,
          checkpoint,
        ]),
      ),
    [searchCheckpoints],
  );

  const totalNewMatches = useMemo(
    () =>
      savedSearches.reduce((total, search) => {
        return total + (checkpointBySearchId.get(search.id)?.newMatches || 0);
      }, 0),
    [checkpointBySearchId, savedSearches],
  );

  const runAllSavedSearches = async () => {
    if (!savedSearches.length || isRunningSearches) return;

    setIsRunningSearches(true);
    try {
      const nowIso = new Date().toISOString();

      await Promise.all(
        savedSearches.map(async (savedSearch) => {
          const results = await searchHarvestedData({
            query: savedSearch.query,
            kind: savedSearch.kind,
            limit: 50,
          });

          trackSearchInteraction(savedSearch.query, savedSearch.kind);

          const currentIds = results
            .map((item) => item.id || item.url || `${item.kind}:${item.title}`)
            .filter(Boolean);
          const previous = checkpointBySearchId.get(savedSearch.id);
          const previousSet = new Set(previous?.lastResultIds || []);

          const newMatches = currentIds.reduce((count, id) => {
            return previousSet.has(id) ? count : count + 1;
          }, 0);

          upsertSavedSearchCheckpoint({
            searchId: savedSearch.id,
            lastCheckedAt: nowIso,
            lastResultIds: currentIds.slice(0, 150),
            lastResultCount: results.length,
            newMatches,
          });
        }),
      );

      setSearchCheckpoints(getSavedSearchCheckpoints());
    } finally {
      setIsRunningSearches(false);
    }
  };

  const formatCheckedAt = (value?: string) => {
    if (!value) return "Never checked";
    const parsed = Date.parse(value);
    if (Number.isNaN(parsed)) return "Never checked";

    const diffMs = Date.now() - parsed;
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    if (diffMinutes < 1) return "Checked just now";
    if (diffMinutes < 60) return `Checked ${diffMinutes}m ago`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `Checked ${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `Checked ${diffDays}d ago`;
  };

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

      return {
        item,
        status,
        dueText,
      };
    });
  }, [reminders]);

  const filteredReminderRows = useMemo(() => {
    return reminderRows.filter(({ status }) => {
      if (reminderFilter === "all") return true;
      if (reminderFilter === "overdue") return status.state === "overdue";
      if (reminderFilter === "upcoming") {
        return status.state === "upcoming" || status.state === "today";
      }
      if (reminderFilter === "this-week") {
        return (
          status.daysUntil !== null &&
          status.daysUntil >= 0 &&
          status.daysUntil <= 7
        );
      }
      return true;
    });
  }, [reminderFilter, reminderRows]);

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

  const toggleTargetKind = (kind: TargetKind) => {
    setPreferences((prev) => {
      const nextKinds = prev.targetKinds.includes(kind)
        ? prev.targetKinds.filter((entry) => entry !== kind)
        : [...prev.targetKinds, kind];
      return {
        ...prev,
        targetKinds: nextKinds.length ? nextKinds : prev.targetKinds,
      };
    });
  };

  const savePreferences = () => {
    const cleaned: UserPreferences = {
      ...preferences,
      interests: interestsInput
        .split(",")
        .map((interest) => interest.trim())
        .filter(Boolean),
    };
    saveUserPreferences(cleaned);
    setPreferences(cleaned);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  const stats = useMemo(
    () => ({
      watchlist: watchlist.length,
      reminders: reminders.length,
      searches: savedSearches.length,
    }),
    [watchlist.length, reminders.length, savedSearches.length],
  );

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navigation />
      <div className="flex-1">
        <PageHero
          icon={Settings}
          title="User Hub"
          description="Manage your preferences, watchlist, reminders, and saved searches in one place."
        />

        <div className="container mx-auto px-4 py-8 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Card>
              <CardContent className="p-4 text-sm">
                <p className="text-muted-foreground">Watchlist</p>
                <p className="text-xl font-semibold mt-1">{stats.watchlist}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-sm">
                <p className="text-muted-foreground">Reminders</p>
                <p className="text-xl font-semibold mt-1">{stats.reminders}</p>
                {reminderCounts.overdue > 0 && (
                  <p className="text-[11px] text-muted-foreground mt-1">
                    {reminderCounts.overdue} overdue
                  </p>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-sm">
                <p className="text-muted-foreground">Saved searches</p>
                <p className="text-xl font-semibold mt-1">{stats.searches}</p>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="preferences" className="space-y-4">
            <TabsList>
              <TabsTrigger value="preferences">Preferences</TabsTrigger>
              <TabsTrigger value="watchlist">Watchlist</TabsTrigger>
              <TabsTrigger value="reminders">Reminders</TabsTrigger>
              <TabsTrigger value="searches">Saved Searches</TabsTrigger>
            </TabsList>

            <TabsContent value="preferences">
              <Card>
                <CardContent className="p-5 space-y-4">
                  <h2 className="text-base font-semibold">Preferences</h2>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="hub-name">Name</Label>
                      <Input
                        id="hub-name"
                        value={preferences.name}
                        onChange={(event) =>
                          setPreferences((prev) => ({
                            ...prev,
                            name: event.target.value,
                          }))
                        }
                        placeholder="Your name"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="hub-role">Role</Label>
                      <Input
                        id="hub-role"
                        value={preferences.role}
                        onChange={(event) =>
                          setPreferences((prev) => ({
                            ...prev,
                            role: event.target.value,
                          }))
                        }
                        placeholder="student / researcher / faculty"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="hub-interests">
                      Interests (comma-separated)
                    </Label>
                    <Input
                      id="hub-interests"
                      value={interestsInput}
                      onChange={(event) =>
                        setInterestsInput(event.target.value)
                      }
                      placeholder="ai, machine learning, distributed systems"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="hub-location">Preferred location</Label>
                    <Input
                      id="hub-location"
                      value={preferences.location}
                      onChange={(event) =>
                        setPreferences((prev) => ({
                          ...prev,
                          location: event.target.value,
                        }))
                      }
                      placeholder="Hyderabad, India"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Priority content types</Label>
                    <div className="flex gap-2 flex-wrap">
                      {(
                        ["conference", "journal", "opportunity"] as TargetKind[]
                      ).map((kind) => {
                        const selected = preferences.targetKinds.includes(kind);
                        return (
                          <Button
                            key={kind}
                            type="button"
                            variant={selected ? "default" : "outline"}
                            size="sm"
                            className="capitalize"
                            onClick={() => toggleTargetKind(kind)}
                          >
                            {kind}
                          </Button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Button onClick={savePreferences}>Save preferences</Button>
                    {saved && (
                      <span className="text-xs text-primary">Saved</span>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="watchlist">
              <Card>
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-center gap-2">
                    <Bookmark className="h-4 w-4 text-primary" />
                    <h3 className="text-sm font-semibold">Watchlist</h3>
                  </div>
                  {watchlist.length === 0 ? (
                    <p className="text-xs text-muted-foreground">
                      No watchlist items yet.
                    </p>
                  ) : (
                    watchlist.map((item) => (
                      <div
                        key={item.id}
                        className="border border-border rounded-md p-2 text-xs"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-medium hover:text-primary line-clamp-2"
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
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="reminders">
              <Card>
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-center gap-2">
                    <Bell className="h-4 w-4 text-primary" />
                    <h3 className="text-sm font-semibold">Reminders</h3>
                  </div>
                  {reminders.length > 0 && (
                    <div className="flex items-center gap-2 flex-wrap">
                      <Button
                        size="sm"
                        variant={
                          reminderFilter === "all" ? "default" : "outline"
                        }
                        onClick={() => setReminderFilter("all")}
                      >
                        All ({reminders.length})
                      </Button>
                      <Button
                        size="sm"
                        variant={
                          reminderFilter === "overdue" ? "default" : "outline"
                        }
                        onClick={() => setReminderFilter("overdue")}
                      >
                        Overdue ({reminderCounts.overdue})
                      </Button>
                      <Button
                        size="sm"
                        variant={
                          reminderFilter === "this-week" ? "default" : "outline"
                        }
                        onClick={() => setReminderFilter("this-week")}
                      >
                        This week ({reminderCounts.thisWeek})
                      </Button>
                      <Button
                        size="sm"
                        variant={
                          reminderFilter === "upcoming" ? "default" : "outline"
                        }
                        onClick={() => setReminderFilter("upcoming")}
                      >
                        Upcoming
                      </Button>
                    </div>
                  )}
                  {reminders.length === 0 ? (
                    <p className="text-xs text-muted-foreground">
                      No reminders set.
                    </p>
                  ) : (
                    filteredReminderRows.map(({ item, status, dueText }) => (
                      <div
                        key={item.id}
                        className="border border-border rounded-md p-2 text-xs"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-medium hover:text-primary line-clamp-2"
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
                    ))
                  )}
                  {reminders.length > 0 &&
                    filteredReminderRows.length === 0 && (
                      <p className="text-xs text-muted-foreground">
                        No reminders match this filter.
                      </p>
                    )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="searches">
              <Card>
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-center gap-2">
                    <Search className="h-4 w-4 text-primary" />
                    <h3 className="text-sm font-semibold">Saved searches</h3>
                  </div>
                  {savedSearches.length === 0 ? (
                    <p className="text-xs text-muted-foreground">
                      No saved searches yet.
                    </p>
                  ) : (
                    savedSearches.map((item) => (
                      <div
                        key={item.id}
                        className="border border-border rounded-md p-2 text-xs"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="font-medium line-clamp-2">
                            {item.query}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => {
                              setSavedSearches(removeSavedSearch(item.id));
                              setSearchCheckpoints(getSavedSearchCheckpoints());
                            }}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                        <div className="mt-1 flex items-center gap-2 flex-wrap">
                          <p className="text-muted-foreground">
                            {formatCheckedAt(
                              checkpointBySearchId.get(item.id)?.lastCheckedAt,
                            )}
                          </p>
                          <Badge variant="secondary" className="text-[10px]">
                            {checkpointBySearchId.get(item.id)?.newMatches || 0}{" "}
                            new
                          </Badge>
                          <Badge variant="outline" className="text-[10px]">
                            {checkpointBySearchId.get(item.id)
                              ?.lastResultCount || 0}{" "}
                            total
                          </Badge>
                        </div>
                        {item.kind && (
                          <Badge
                            variant="outline"
                            className="mt-1 text-[10px] capitalize"
                          >
                            {item.kind}
                          </Badge>
                        )}
                      </div>
                    ))
                  )}

                  {savedSearches.length > 0 && (
                    <div className="pt-2 border-t border-border flex items-center justify-between gap-2">
                      <Badge variant="secondary" className="text-xs">
                        New matches since last check: {totalNewMatches}
                      </Badge>
                      <Button
                        size="sm"
                        onClick={runAllSavedSearches}
                        disabled={isRunningSearches}
                      >
                        <RefreshCw
                          className={`h-3.5 w-3.5 mr-1 ${isRunningSearches ? "animate-spin" : ""}`}
                        />
                        {isRunningSearches
                          ? "Running saved searches..."
                          : "Run all saved searches"}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default UserHub;
