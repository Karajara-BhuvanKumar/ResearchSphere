import { answerAssistantQuery } from "../services/assistantService.js";

const standalone = await answerAssistantQuery("conferences in may");

console.log(
  JSON.stringify(
    {
      text: standalone.text,
      total: standalone.meta?.total,
      parsed: standalone.parsed,
      sample: (standalone.results || []).slice(0, 5).map((item) => ({
        title: item.title,
        location: item.location,
        eventDate: item.eventDate,
      })),
    },
    null,
    2,
  ),
);
