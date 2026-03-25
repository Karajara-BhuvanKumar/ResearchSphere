import { answerAssistantQuery } from "../services/assistantService.js";

const response = await answerAssistantQuery(
  "machine learning conference in india",
);

const uniqueLocations = [
  ...new Set(
    (response.results || []).map((item) => item.location || "Unknown"),
  ),
];

console.log(
  JSON.stringify(
    {
      text: response.text,
      total: response.meta?.total,
      locations: uniqueLocations.slice(0, 12),
      sampleTitles: (response.results || [])
        .slice(0, 5)
        .map((item) => item.title),
    },
    null,
    2,
  ),
);
