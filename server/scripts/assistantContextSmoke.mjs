import { answerAssistantQuery } from "../services/assistantService.js";

const first = await answerAssistantQuery(
  "machine learning conferences in march",
);
const second = await answerAssistantQuery("only in hyderabad", {
  lastParsed: first.parsed,
});
const third = await answerAssistantQuery("now show phd", {
  lastParsed: second.parsed,
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
      },
      third: {
        text: third.text,
        total: third.meta?.total,
        parsed: third.parsed,
      },
    },
    null,
    2,
  ),
);
