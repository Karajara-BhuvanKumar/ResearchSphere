import { useMemo, useState } from "react";
import {
  Bot,
  Send,
  User,
  Sparkles,
  ExternalLink,
  Calendar,
  MapPin,
  Bookmark,
  Bell,
} from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import PageHero from "@/components/PageHero";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  queryResearchAssistant,
  type AssistantAnswer,
  type HarvestItem,
} from "@/services/apiClient";
import type { AssistantContext } from "@/services/apiClient";
import {
  toggleReminderFromItem,
  addSavedSearch,
  buildAppliedFilterChips,
  getReminders,
  getSavedSearches,
  getWatchlist,
  trackItemInteraction,
  trackSearchInteraction,
  toggleWatchlistItem,
} from "@/lib/personalization";

type ChatTurn = {
  id: string;
  role: "user" | "assistant";
  text: string;
  answer?: AssistantAnswer;
};

const starterPrompts = [
  "Find machine learning conferences around mid March",
  "Show me recent blockchain research papers",
  "I want conferences in Hyderabad",
  "Find phd opportunities in AI",
];

const formatDate = (value?: string | null) => {
  if (!value) return null;
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) return value;
  return new Date(parsed).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const ResultCard = ({
  item,
  inWatchlist,
  hasReminder,
  onToggleWatchlist,
  onAddReminder,
  onOpenSource,
}: {
  item: HarvestItem;
  inWatchlist: boolean;
  hasReminder: boolean;
  onToggleWatchlist: (item: HarvestItem) => void;
  onAddReminder: (item: HarvestItem) => void;
  onOpenSource: (item: HarvestItem) => void;
}) => {
  const dateLabel = formatDate(item.eventDate || item.deadline || undefined);

  return (
    <Card className="border border-border hover:border-primary/40 transition-colors">
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-2 mb-2">
          <Badge variant="outline" className="text-xs capitalize">
            {item.kind}
            {item.subtype ? ` · ${item.subtype}` : ""}
          </Badge>
          {item.sourceName && (
            <span className="text-xs text-muted-foreground truncate">
              {item.sourceName}
            </span>
          )}
        </div>

        <h4 className="text-sm font-semibold text-foreground line-clamp-2 mb-2">
          {item.title}
        </h4>

        <div className="space-y-1 mb-3 text-xs text-muted-foreground">
          {dateLabel && (
            <p className="flex items-center gap-1.5">
              <Calendar className="h-3 w-3" />
              {dateLabel}
            </p>
          )}
          {item.location && (
            <p className="flex items-center gap-1.5">
              <MapPin className="h-3 w-3" />
              {item.location}
            </p>
          )}
        </div>

        <a
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
          onClick={() => onOpenSource(item)}
        >
          Open source <ExternalLink className="h-3 w-3" />
        </a>

        <div className="mt-3 flex items-center gap-2 flex-wrap">
          <Button
            type="button"
            variant={inWatchlist ? "default" : "outline"}
            size="sm"
            className="h-7 text-xs"
            onClick={() => onToggleWatchlist(item)}
          >
            <Bookmark className="h-3 w-3 mr-1" />
            {inWatchlist ? "Saved" : "Watchlist"}
          </Button>
          <Button
            type="button"
            variant={hasReminder ? "default" : "outline"}
            size="sm"
            className="h-7 text-xs"
            onClick={() => onAddReminder(item)}
            disabled={!item.deadline && !item.eventDate}
          >
            <Bell className="h-3 w-3 mr-1" />
            {hasReminder ? "Unset reminder" : "Remind me"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

const Assistant = () => {
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [context, setContext] = useState<AssistantContext>({});
  const [savedSearches, setSavedSearches] = useState(() => getSavedSearches());
  const [watchlist, setWatchlist] = useState(() => getWatchlist());
  const [reminders, setReminders] = useState(() => getReminders());
  const [chat, setChat] = useState<ChatTurn[]>([
    {
      id: "welcome",
      role: "assistant",
      text: "Ask me anything about conferences, journals, papers, book chapters, project calls, or PhD/postdoc/internship opportunities on ResearchSphere.",
    },
  ]);

  const latestAnswer = useMemo(() => {
    for (let index = chat.length - 1; index >= 0; index -= 1) {
      if (chat[index].role === "assistant" && chat[index].answer) {
        return chat[index].answer;
      }
    }
    return undefined;
  }, [chat]);

  const appliedChips = useMemo(
    () => buildAppliedFilterChips(latestAnswer?.parsed),
    [latestAnswer?.parsed],
  );

  const watchlistIds = useMemo(
    () => new Set(watchlist.map((item) => item.id)),
    [watchlist],
  );

  const reminderIds = useMemo(
    () => new Set(reminders.map((item) => item.itemId)),
    [reminders],
  );

  const submitQuery = async (rawQuery: string) => {
    const trimmed = rawQuery.trim();
    if (!trimmed || isLoading) return;

    setIsLoading(true);
    const userTurn: ChatTurn = {
      id: `u-${Date.now()}`,
      role: "user",
      text: trimmed,
    };
    setChat((prev) => [...prev, userTurn]);
    setQuery("");
    trackSearchInteraction(trimmed);

    try {
      const answer = await queryResearchAssistant(trimmed, context);
      setContext((prev) => ({
        ...prev,
        lastParsed: answer.parsed,
      }));
      const assistantTurn: ChatTurn = {
        id: `a-${Date.now()}`,
        role: "assistant",
        text: answer.text,
        answer,
      };
      setChat((prev) => [...prev, assistantTurn]);
    } catch (error) {
      const assistantTurn: ChatTurn = {
        id: `a-${Date.now()}`,
        role: "assistant",
        text: "I couldn’t process that request right now. Please try again in a moment.",
      };
      setChat((prev) => [...prev, assistantTurn]);
      console.error("Assistant query failed", error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveLatestSearch = () => {
    const latestUserQuery = [...chat]
      .reverse()
      .find((turn) => turn.role === "user")?.text;
    const sourceQuery = query.trim() || latestUserQuery || "";
    if (!sourceQuery) return;
    trackSearchInteraction(sourceQuery, latestAnswer?.parsed?.kind);
    setSavedSearches(
      addSavedSearch({
        query: sourceQuery,
        kind: latestAnswer?.parsed?.kind,
      }),
    );
  };

  const handleToggleWatchlist = (item: HarvestItem) => {
    trackItemInteraction(item, "save");
    setWatchlist(toggleWatchlistItem(item));
  };

  const handleReminder = (item: HarvestItem) => {
    trackItemInteraction(item, "remind");
    setReminders(toggleReminderFromItem(item));
  };

  const handleOpenSource = (item: HarvestItem) => {
    trackItemInteraction(item, "open");
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navigation />

      <div className="flex-1">
        <PageHero
          icon={Sparkles}
          title="Research Assistant"
          description="A grounded assistant that answers using your ResearchSphere data and returns directly verifiable source links."
        />

        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 xl:grid-cols-[1.25fr_1fr] gap-6 items-start">
            <Card className="border border-border self-start">
              <CardContent className="p-4 md:p-5">
                <div className="space-y-3 max-h-[65vh] overflow-y-auto pr-1">
                  {chat.map((turn) => (
                    <div
                      key={turn.id}
                      className={`flex gap-3 ${turn.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      {turn.role === "assistant" && (
                        <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                          <Bot className="h-4 w-4" />
                        </div>
                      )}
                      <div
                        className={`max-w-[88%] rounded-lg px-3 py-2 text-sm ${
                          turn.role === "user"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-foreground"
                        }`}
                      >
                        {turn.text}
                      </div>
                      {turn.role === "user" && (
                        <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0">
                          <User className="h-4 w-4" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="mt-4 border-t border-border pt-4 space-y-3">
                  <div className="flex gap-2 flex-wrap">
                    {starterPrompts.map((prompt) => (
                      <Button
                        key={prompt}
                        variant="outline"
                        size="sm"
                        className="text-xs"
                        onClick={() => submitQuery(prompt)}
                        disabled={isLoading}
                      >
                        {prompt}
                      </Button>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <Input
                      placeholder="Ask: ‘ML conference in Hyderabad in March’"
                      value={query}
                      onChange={(event) => setQuery(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          submitQuery(query);
                        }
                      }}
                      disabled={isLoading}
                    />
                    <Button
                      onClick={() => submitQuery(query)}
                      disabled={isLoading}
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-border">
              <CardContent className="p-4 md:p-5 space-y-4">
                <div>
                  <h3 className="text-base font-semibold">Matched Results</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    The assistant only returns records already available on your
                    platform.
                  </p>
                </div>

                {latestAnswer?.meta?.total !== undefined && (
                  <div className="flex gap-2 items-center flex-wrap">
                    <Badge variant="secondary" className="text-xs">
                      {latestAnswer.meta.total} total matches
                    </Badge>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs"
                      onClick={saveLatestSearch}
                    >
                      Save search
                    </Button>
                  </div>
                )}

                {appliedChips.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">
                      Applied filters
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {appliedChips.map((chip) => (
                        <Badge
                          key={chip}
                          variant="outline"
                          className="text-[11px]"
                        >
                          {chip}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {latestAnswer?.results?.length ? (
                  <div className="space-y-3 max-h-[65vh] overflow-y-auto pr-1">
                    {latestAnswer.results.map((item) => (
                      <ResultCard
                        key={item.id}
                        item={item}
                        inWatchlist={watchlistIds.has(item.id)}
                        hasReminder={reminderIds.has(item.id)}
                        onToggleWatchlist={handleToggleWatchlist}
                        onAddReminder={handleReminder}
                        onOpenSource={handleOpenSource}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground py-8 text-center border border-dashed rounded-md">
                    Ask a query to see matched resources here.
                  </div>
                )}

                {latestAnswer?.suggestions?.length ? (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">
                      Try next
                    </p>
                    <div className="flex gap-2 flex-wrap">
                      {latestAnswer.suggestions.map((suggestion) => (
                        <Button
                          key={suggestion}
                          variant="ghost"
                          size="sm"
                          className="text-xs h-7"
                          onClick={() => submitQuery(suggestion)}
                          disabled={isLoading}
                        >
                          {suggestion}
                        </Button>
                      ))}
                    </div>
                  </div>
                ) : null}

                {savedSearches.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">
                      Saved searches
                    </p>
                    <div className="flex gap-2 flex-wrap">
                      {savedSearches.slice(0, 4).map((saved) => (
                        <Button
                          key={saved.id}
                          variant="ghost"
                          size="sm"
                          className="text-xs h-7"
                          onClick={() => submitQuery(saved.query)}
                          disabled={isLoading}
                        >
                          {saved.query}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Assistant;
