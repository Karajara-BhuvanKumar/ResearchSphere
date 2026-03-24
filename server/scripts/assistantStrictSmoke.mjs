import { answerAssistantQuery } from "../services/assistantService.js";

const tests = [
  "machine learning conference in india in march",
  "ai conferences in march",
  "blockchain papers",
];

for (const query of tests) {
  const result = await answerAssistantQuery(query);
  console.log("\n===", query, "===");
  console.log(
    JSON.stringify(
      {
        text: result.text,
        total: result.meta?.total,
        sample: (result.results || []).slice(0, 5).map((item) => ({
          title: item.title,
          location: item.location,
          eventDate: item.eventDate,
        })),
      },
      null,
      2,
    ),
  );
}
