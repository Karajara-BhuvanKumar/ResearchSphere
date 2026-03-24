import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { spawn } from "child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");
const dataRoot = path.join(projectRoot, "data");
const probeRoot = path.join(dataRoot, "journal-finder-probe");
const defaultTopicsFile = path.join(dataRoot, "journal-topic-seeds.json");
const probeScript = path.join(__dirname, "journalFinderProbe.mjs");

const normalizeWhitespace = (value) =>
  String(value ?? "")
    .replace(/\s+/g, " ")
    .trim();

const slugify = (value) =>
  normalizeWhitespace(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

const parseArgs = () => {
  const args = process.argv.slice(2);
  const parsed = {
    provider: "both",
    topicsFile: defaultTopicsFile,
    force: false,
    headless: false,
    timeoutMs: 90000,
    topics: [],
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === "--provider" && args[index + 1]) {
      parsed.provider = args[index + 1];
      index += 1;
      continue;
    }
    if (arg === "--topics-file" && args[index + 1]) {
      parsed.topicsFile = path.resolve(projectRoot, args[index + 1]);
      index += 1;
      continue;
    }
    if (arg === "--topic" && args[index + 1]) {
      parsed.topics.push(args[index + 1]);
      index += 1;
      continue;
    }
    if (arg === "--force") {
      parsed.force = true;
      continue;
    }
    if (arg === "--headless") {
      parsed.headless = true;
      continue;
    }
    if (arg === "--timeout" && args[index + 1]) {
      parsed.timeoutMs = Number.parseInt(args[index + 1], 10) || parsed.timeoutMs;
      index += 1;
    }
  }

  return parsed;
};

const ensureDir = async (dirPath) => {
  await fs.mkdir(dirPath, { recursive: true });
};

const safeReadJson = async (filePath) => {
  try {
    return JSON.parse(await fs.readFile(filePath, "utf8"));
  } catch {
    return null;
  }
};

const listRunDirectories = async () => {
  const entries = await fs.readdir(probeRoot, { withFileTypes: true }).catch(() => []);
  return entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name);
};

const findLatestRunByQuery = async (query) => {
  const runs = await listRunDirectories();
  let latest = null;

  for (const runName of runs) {
    const summary = await safeReadJson(path.join(probeRoot, runName, "summary.json"));
    if (!summary) continue;

    if (normalizeWhitespace(summary.query).toLowerCase() !== query.toLowerCase()) {
      continue;
    }

    const current = {
      runName,
      summary,
    };

    if (!latest || runName > latest.runName) {
      latest = current;
    }
  }

  return latest;
};

const loadTopics = async (options) => {
  if (options.topics.length > 0) {
    return options.topics.map(normalizeWhitespace).filter(Boolean);
  }

  const topics = await safeReadJson(options.topicsFile);
  if (!Array.isArray(topics)) {
    throw new Error(`Could not read topic list from ${options.topicsFile}`);
  }

  return topics.map(normalizeWhitespace).filter(Boolean);
};

const runProbeForTopic = (topic, options) =>
  new Promise((resolve, reject) => {
    const args = [
      probeScript,
      "--provider",
      options.provider,
      "--query",
      topic,
      "--timeout",
      String(options.timeoutMs),
    ];

    if (!options.headless) {
      args.push("--headed");
    }

    const child = spawn(process.execPath, args, {
      cwd: projectRoot,
      stdio: "inherit",
    });

    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Probe exited with code ${code}`));
      }
    });
  });

const main = async () => {
  const options = parseArgs();
  await ensureDir(probeRoot);

  const topics = await loadTopics(options);
  const batchResults = [];

  for (const topic of topics) {
    const topicKey = topic.toLowerCase();
    const existing = await findLatestRunByQuery(topicKey);

    if (existing && !options.force) {
      batchResults.push({
        topic,
        status: "skipped",
        runName: existing.runName,
        reason: "Existing run found",
      });
      continue;
    }

    try {
      console.log(`\n=== Building journal corpus for: ${topic} ===`);
      await runProbeForTopic(topic, options);
      const latest = await findLatestRunByQuery(topicKey);
      batchResults.push({
        topic,
        status: "completed",
        runName: latest?.runName || null,
      });
    } catch (error) {
      batchResults.push({
        topic,
        status: "failed",
        error: error.message,
      });
    }
  }

  const summary = {
    provider: options.provider,
    createdAt: new Date().toISOString(),
    topicCount: topics.length,
    completedCount: batchResults.filter((item) => item.status === "completed").length,
    skippedCount: batchResults.filter((item) => item.status === "skipped").length,
    failedCount: batchResults.filter((item) => item.status === "failed").length,
    topics,
    results: batchResults,
  };

  const outputFile = path.join(
    probeRoot,
    `batch-summary-${new Date().toISOString().replace(/[:.]/g, "-")}-${slugify(options.provider)}.json`,
  );
  await fs.writeFile(outputFile, JSON.stringify(summary, null, 2), "utf8");
  console.log(`\nBatch summary written to ${outputFile}`);
  console.log(JSON.stringify(summary, null, 2));
};

main().catch((error) => {
  console.error("Journal corpus build failed:");
  console.error(error);
  process.exitCode = 1;
});
