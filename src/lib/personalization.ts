import type { AssistantAnswer, HarvestItem } from "@/services/apiClient";

export type TargetKind = "conference" | "journal" | "opportunity";

export interface UserPreferences {
  name: string;
  role: string;
  interests: string[];
  location: string;
  targetKinds: TargetKind[];
}

export interface WatchlistItem {
  id: string;
  title: string;
  kind: string;
  subtype?: string;
  url: string;
  location?: string | null;
  eventDate?: string | null;
  deadline?: string | null;
  savedAt: string;
}

export interface SavedSearchItem {
  id: string;
  query: string;
  kind?: string;
  createdAt: string;
}

export interface SavedSearchCheckpoint {
  searchId: string;
  lastCheckedAt: string;
  lastResultIds: string[];
  lastResultCount: number;
  newMatches: number;
}

export interface ReminderItem {
  id: string;
  itemId: string;
  title: string;
  date: string;
  url: string;
  createdAt: string;
}

export type ReminderState = "overdue" | "today" | "upcoming" | "unknown";

export interface ReminderStatusInfo {
  state: ReminderState;
  daysUntil: number | null;
}

export type InteractionType = "open" | "save" | "remind" | "search";

export interface InteractionEvent {
  id: string;
  type: InteractionType;
  itemId?: string;
  kind?: string;
  title?: string;
  tags?: string[];
  query?: string;
  createdAt: string;
}

const STORAGE_KEYS = {
  profile: "researchsphere:user-profile",
  watchlist: "researchsphere:watchlist",
  searches: "researchsphere:saved-searches",
  reminders: "researchsphere:reminders",
  searchCheckpoints: "researchsphere:saved-search-checkpoints",
  interactions: "researchsphere:interactions",
} as const;

const defaultPreferences: UserPreferences = {
  name: "",
  role: "",
  interests: [],
  location: "",
  targetKinds: ["conference", "journal", "opportunity"],
};

const safeRead = <T>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
};

const safeWrite = (key: string, value: unknown) => {
  localStorage.setItem(key, JSON.stringify(value));
};

export const getUserPreferences = (): UserPreferences => {
  const stored = safeRead<UserPreferences>(
    STORAGE_KEYS.profile,
    defaultPreferences,
  );
  return {
    ...defaultPreferences,
    ...stored,
    interests: Array.isArray(stored.interests)
      ? stored.interests.filter(Boolean).map((interest) => interest.trim())
      : [],
    targetKinds:
      Array.isArray(stored.targetKinds) && stored.targetKinds.length
        ? stored.targetKinds
        : defaultPreferences.targetKinds,
  };
};

export const saveUserPreferences = (preferences: UserPreferences) => {
  safeWrite(STORAGE_KEYS.profile, preferences);
};

export const getWatchlist = (): WatchlistItem[] => {
  return safeRead<WatchlistItem[]>(STORAGE_KEYS.watchlist, []);
};

const toWatchlistItem = (item: HarvestItem): WatchlistItem => ({
  id: item.id,
  title: item.title,
  kind: item.kind,
  subtype: item.subtype,
  url: item.url,
  location: item.location,
  eventDate: item.eventDate,
  deadline: item.deadline,
  savedAt: new Date().toISOString(),
});

export const toggleWatchlistItem = (item: HarvestItem): WatchlistItem[] => {
  const current = getWatchlist();
  const exists = current.some((entry) => entry.id === item.id);
  const updated = exists
    ? current.filter((entry) => entry.id !== item.id)
    : [toWatchlistItem(item), ...current].slice(0, 100);

  safeWrite(STORAGE_KEYS.watchlist, updated);
  return updated;
};

export const isInWatchlist = (itemId: string): boolean => {
  return getWatchlist().some((item) => item.id === itemId);
};

export const removeWatchlistItem = (itemId: string): WatchlistItem[] => {
  const updated = getWatchlist().filter((item) => item.id !== itemId);
  safeWrite(STORAGE_KEYS.watchlist, updated);
  return updated;
};

export const getSavedSearches = (): SavedSearchItem[] => {
  return safeRead<SavedSearchItem[]>(STORAGE_KEYS.searches, []);
};

export const addSavedSearch = (
  search: Omit<SavedSearchItem, "id" | "createdAt">,
) => {
  const current = getSavedSearches();
  const normalizedQuery = search.query.trim();
  if (!normalizedQuery) return current;

  const withoutDuplicate = current.filter(
    (entry) =>
      !(
        entry.query.toLowerCase() === normalizedQuery.toLowerCase() &&
        entry.kind === search.kind
      ),
  );

  const updated: SavedSearchItem[] = [
    {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      query: normalizedQuery,
      kind: search.kind,
      createdAt: new Date().toISOString(),
    },
    ...withoutDuplicate,
  ].slice(0, 20);

  safeWrite(STORAGE_KEYS.searches, updated);
  return updated;
};

export const removeSavedSearch = (searchId: string): SavedSearchItem[] => {
  const updated = getSavedSearches().filter((entry) => entry.id !== searchId);
  safeWrite(STORAGE_KEYS.searches, updated);

  const checkpoints = getSavedSearchCheckpoints().filter(
    (entry) => entry.searchId !== searchId,
  );
  safeWrite(STORAGE_KEYS.searchCheckpoints, checkpoints);

  return updated;
};

export const getSavedSearchCheckpoints = (): SavedSearchCheckpoint[] => {
  return safeRead<SavedSearchCheckpoint[]>(STORAGE_KEYS.searchCheckpoints, []);
};

export const upsertSavedSearchCheckpoint = (
  checkpoint: SavedSearchCheckpoint,
): SavedSearchCheckpoint[] => {
  const current = getSavedSearchCheckpoints();
  const updated = [
    checkpoint,
    ...current.filter((entry) => entry.searchId !== checkpoint.searchId),
  ].slice(0, 100);
  safeWrite(STORAGE_KEYS.searchCheckpoints, updated);
  return updated;
};

export const getReminders = (): ReminderItem[] => {
  return safeRead<ReminderItem[]>(STORAGE_KEYS.reminders, []);
};

const getDateForItem = (item: HarvestItem): string | null => {
  return item.deadline || item.eventDate || null;
};

export const addReminderFromItem = (item: HarvestItem): ReminderItem[] => {
  const itemDate = getDateForItem(item);
  if (!itemDate) return getReminders();

  const current = getReminders();
  const exists = current.some((entry) => entry.itemId === item.id);
  if (exists) return current;

  const updated: ReminderItem[] = [
    {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      itemId: item.id,
      title: item.title,
      date: itemDate,
      url: item.url,
      createdAt: new Date().toISOString(),
    },
    ...current,
  ].slice(0, 100);

  safeWrite(STORAGE_KEYS.reminders, updated);
  return updated;
};

export const toggleReminderFromItem = (item: HarvestItem): ReminderItem[] => {
  const itemDate = getDateForItem(item);
  if (!itemDate) return getReminders();

  const current = getReminders();
  const exists = current.some((entry) => entry.itemId === item.id);

  const updated = exists
    ? current.filter((entry) => entry.itemId !== item.id)
    : [
        {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          itemId: item.id,
          title: item.title,
          date: itemDate,
          url: item.url,
          createdAt: new Date().toISOString(),
        },
        ...current,
      ].slice(0, 100);

  safeWrite(STORAGE_KEYS.reminders, updated);
  return updated;
};

export const removeReminderByItemId = (itemId: string): ReminderItem[] => {
  const updated = getReminders().filter((entry) => entry.itemId !== itemId);
  safeWrite(STORAGE_KEYS.reminders, updated);
  return updated;
};

const toStartOfDay = (date: Date) => {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
};

const parseReminderDate = (value: string): Date | null => {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
};

export const getReminderStatusInfo = (
  reminder: ReminderItem,
  now = new Date(),
): ReminderStatusInfo => {
  const due = parseReminderDate(reminder.date);
  if (!due) return { state: "unknown", daysUntil: null };

  const today = toStartOfDay(now);
  const dueDay = toStartOfDay(due);
  const diffMs = dueDay.getTime() - today.getTime();
  const daysUntil = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (daysUntil < 0) return { state: "overdue", daysUntil };
  if (daysUntil === 0) return { state: "today", daysUntil };
  return { state: "upcoming", daysUntil };
};

const tokenize = (value: string): string[] => {
  return value
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .map((token) => token.trim())
    .filter((token) => token.length >= 3);
};

export const getInteractions = (): InteractionEvent[] => {
  return safeRead<InteractionEvent[]>(STORAGE_KEYS.interactions, []);
};

const addInteraction = (
  event: Omit<InteractionEvent, "id" | "createdAt">,
): InteractionEvent[] => {
  const current = getInteractions();
  const updated: InteractionEvent[] = [
    {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      createdAt: new Date().toISOString(),
      ...event,
    },
    ...current,
  ].slice(0, 400);

  safeWrite(STORAGE_KEYS.interactions, updated);
  return updated;
};

export const trackItemInteraction = (
  item: HarvestItem,
  type: "open" | "save" | "remind",
) => {
  addInteraction({
    type,
    itemId: item.id,
    kind: item.kind,
    title: item.title,
    tags: item.tags || [],
  });
};

export const trackSearchInteraction = (query: string, kind?: string) => {
  const normalized = query.trim();
  if (!normalized) return;
  addInteraction({
    type: "search",
    query: normalized,
    kind,
  });
};

type InteractionProfile = {
  kindWeights: Map<string, number>;
  termWeights: Map<string, number>;
  itemWeights: Map<string, number>;
};

const buildInteractionProfile = (now = Date.now()): InteractionProfile => {
  const kindWeights = new Map<string, number>();
  const termWeights = new Map<string, number>();
  const itemWeights = new Map<string, number>();
  const events = getInteractions();

  const baseWeightByType: Record<InteractionType, number> = {
    open: 2,
    save: 4,
    remind: 5,
    search: 3,
  };

  for (const event of events) {
    const eventTime = Date.parse(event.createdAt);
    const ageDays = Number.isNaN(eventTime)
      ? 30
      : Math.max(0, (now - eventTime) / (1000 * 60 * 60 * 24));
    const recency = 1 / (1 + ageDays / 7);
    const base = baseWeightByType[event.type] * recency;

    if (event.kind) {
      kindWeights.set(event.kind, (kindWeights.get(event.kind) || 0) + base);
    }

    if (event.itemId) {
      itemWeights.set(
        event.itemId,
        (itemWeights.get(event.itemId) || 0) + base,
      );
    }

    const terms = [
      ...(event.title ? tokenize(event.title) : []),
      ...(event.query ? tokenize(event.query) : []),
      ...(event.tags || []).flatMap((tag) => tokenize(tag)),
    ];

    for (const term of terms) {
      termWeights.set(term, (termWeights.get(term) || 0) + base);
    }
  }

  return { kindWeights, termWeights, itemWeights };
};

export const getPersonalizedItems = (
  items: HarvestItem[],
  preferences: UserPreferences,
  limit = 6,
): HarvestItem[] => {
  const interests = preferences.interests.map((interest) =>
    interest.toLowerCase(),
  );
  const preferredLocation = preferences.location.trim().toLowerCase();
  const preferredKinds = new Set(preferences.targetKinds);
  const interactionProfile = buildInteractionProfile();

  const scopedItems = items.filter((item) => {
    if (!preferredKinds.size) return true;
    return preferredKinds.has(item.kind as TargetKind);
  });

  const scored = scopedItems
    .map((item) => {
      const text = [item.title, item.summary || "", ...(item.tags || [])]
        .join(" ")
        .toLowerCase();
      const location = (item.location || "").toLowerCase();

      let score = 0;
      if (preferredKinds.has(item.kind as TargetKind)) score += 2;
      if (preferredLocation && location.includes(preferredLocation)) score += 3;
      interests.forEach((interest) => {
        if (interest && text.includes(interest)) score += 2;
      });

      score += interactionProfile.kindWeights.get(item.kind) || 0;
      score += interactionProfile.itemWeights.get(item.id) || 0;

      interactionProfile.termWeights.forEach((weight, term) => {
        if (text.includes(term)) score += Math.min(2.5, weight * 0.35);
      });

      return { item, score };
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((entry) => entry.item);

  if (scored.length) return scored;
  return scopedItems.slice(0, limit);
};

export const buildAppliedFilterChips = (
  parsed?: AssistantAnswer["parsed"],
): string[] => {
  if (!parsed) return [];
  const chips: string[] = [];

  if (parsed.kind) chips.push(`Type: ${parsed.kind}`);
  if (parsed.subtype) chips.push(`Subtype: ${parsed.subtype}`);
  if (parsed.location) chips.push(`Location: ${parsed.location}`);
  if (parsed.timeWindow?.monthIndex !== undefined) {
    const month = new Date(
      2024,
      parsed.timeWindow.monthIndex,
      1,
    ).toLocaleString(undefined, {
      month: "short",
    });
    chips.push(`Month: ${month}`);
  }
  if (parsed.timeWindow?.year) chips.push(`Year: ${parsed.timeWindow.year}`);
  if (parsed.topicQuery) chips.push(`Topic: ${parsed.topicQuery}`);

  return chips;
};
