import { readStore } from "../services/harvest/store.js";

const store = await readStore();
const counts = new Map();
for (const item of store.items) {
  counts.set(item.sourceId, (counts.get(item.sourceId) ?? 0) + 1);
}

const top = [...counts.entries()]
  .sort((a, b) => b[1] - a[1])
  .slice(0, 20)
  .map(([sourceId, count]) => ({ sourceId, count }));

const focusIds = [
  "allconferencealert-cs",
  "conferenceindex-cs",
  "call4paper-cs-events",
  "call4paper-cs-journals",
  "dst-project-calls",
  "anrf-project-calls",
  "icssr-fellowships-calls",
  "aicte-fellowships-calls",
];

const focus = focusIds.map((sourceId) => ({
  sourceId,
  count: counts.get(sourceId) ?? 0,
}));

console.log(
  JSON.stringify({ updatedAt: store.updatedAt, focus, top }, null, 2),
);
