import { answerAssistantQuery } from "../services/assistantService.js";

const first = await answerAssistantQuery(
  "machine learning conference in india",
);
const second = await answerAssistantQuery("conferences in may", {
  lastParsed: first.parsed,
});

console.log(
  JSON.stringify(
    {
      first: {
        text: first.text,
        total: first.meta?.total,
        parsed: first.parsed,
      },
      second: {
        text: second.text,
        total: second.meta?.total,
        parsed: second.parsed,
        sample: (second.results || []).slice(0, 5).map((item) => ({
          title: item.title,
          location: item.location,
          eventDate: item.eventDate,
        })),
      },
    },
    null,
    2,
  ),
);
