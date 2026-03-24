import { answerAssistantQuery } from "../services/assistantService.js";

const response = await answerAssistantQuery(
  "conference around mid march on machine learning in hyderabad",
);

console.log(
  JSON.stringify(
    {
      text: response.text,
      total: response.meta?.total,
      first: response.results?.[0]?.title ?? null,
      parsed: response.parsed,
    },
    null,
    2,
  ),
);
