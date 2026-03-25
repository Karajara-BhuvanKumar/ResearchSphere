import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { chromium } from "playwright";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const outputRoot = path.resolve(__dirname, "../data/journal-finder-probe");

const parseArgs = () => {
  const args = process.argv.slice(2);
  const parsed = {
    provider: "both",
    query: "cloud computing",
    headless: false,
    timeoutMs: 90000,
  };
  const positional = [];

  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (arg === "--provider" && args[i + 1]) {
      parsed.provider = args[i + 1];
      i += 1;
      continue;
    }
    if (arg === "--query" && args[i + 1]) {
      parsed.query = args[i + 1];
      i += 1;
      continue;
    }
    if (arg === "--headed") {
      parsed.headless = false;
      continue;
    }
    if (arg === "--timeout" && args[i + 1]) {
      parsed.timeoutMs = Number.parseInt(args[i + 1], 10) || parsed.timeoutMs;
      i += 1;
      continue;
    }

    if (!arg.startsWith("--")) {
      positional.push(arg);
    }
  }

  if (positional[0] && ["springer", "elsevier", "both"].includes(positional[0])) {
    parsed.provider = positional[0];
  }
  if (positional.length > 1) {
    parsed.query = positional.slice(1).join(" ");
  }

  return parsed;
};

const slugify = (value) =>
  String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);

const nowStamp = () => new Date().toISOString().replace(/[:.]/g, "-");

const ensureDir = async (dirPath) => {
  await fs.mkdir(dirPath, { recursive: true });
};

const safeWriteJson = async (filePath, data) => {
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf8");
};

const normalizeWhitespace = (value) =>
  String(value ?? "")
    .replace(/\s+/g, " ")
    .trim();

const parseNumber = (value) => {
  if (value == null) return null;
  const cleaned = String(value).replace(/[^0-9.]+/g, "");
  if (!cleaned) return null;
  const parsed = Number.parseFloat(cleaned);
  return Number.isFinite(parsed) ? parsed : null;
};

const parseInteger = (value) => {
  const parsed = parseNumber(value);
  return parsed == null ? null : Math.round(parsed);
};

const stripHtml = (value) =>
  normalizeWhitespace(
    String(value ?? "")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/p>/gi, "\n")
      .replace(/<\/li>/gi, "\n")
      .replace(/<[^>]+>/g, " "),
  );

const dedupeBy = (items, getKey) => {
  const seen = new Set();
  return items.filter((item) => {
    const key = getKey(item);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const toAbsoluteUrl = (value, baseUrl) => {
  if (!value) return null;
  try {
    return new URL(value, baseUrl).toString();
  } catch {
    return null;
  }
};

const buildSpringerSubmissionUrl = (journalUrl) => {
  if (!journalUrl) return null;
  try {
    const url = new URL(journalUrl);
    url.search = "";
    url.hash = "";
    const journalId = url.pathname.split("/").filter(Boolean).pop();
    return journalId ? `https://www.springer.com/journal/${journalId}/submission-guidelines` : url.toString();
  } catch {
    return journalUrl;
  }
};

const dismissCommonOverlays = async (page) => {
  const bannerSelectors = [
    '[data-cc-banner]',
    ".cc-banner",
    'dialog[open].cc-banner',
  ];

  for (const selector of bannerSelectors) {
    const banner = page.locator(selector).first();
    const count = await banner.count().catch(() => 0);
    if (!count) continue;

    const buttons = [
      banner.getByRole("button", { name: /accept/i }),
      banner.getByRole("button", { name: /agree/i }),
      banner.getByRole("button", { name: /allow/i }),
      banner.locator('button:has-text("Accept")'),
      banner.locator('button:has-text("Accept all")'),
      banner.locator('button:has-text("I agree")'),
    ];

    for (const button of buttons) {
      const buttonCount = await button.count().catch(() => 0);
      if (!buttonCount) continue;

      try {
        await button.first().click({ timeout: 3000 });
        await page.waitForTimeout(1500);
        return;
      } catch {
        // keep trying
      }
    }
  }

  const dismissLabels = [
    "Accept",
    "Accept all",
    "I agree",
    "Agree",
    "Continue",
    "OK",
  ];

  for (const label of dismissLabels) {
    const button = page.getByRole("button", { name: new RegExp(`^${label}$`, "i") });
    const count = await button.count().catch(() => 0);
    if (!count) continue;

    try {
      await button.first().click({ timeout: 2000 });
      await page.waitForTimeout(1000);
      return;
    } catch {
      // Ignore and keep trying the next pattern.
    }
  }
};

const resolveSpringerInput = async (page) => {
  const selectors = [
    'textarea[name="userInput"]',
    'textarea[data-component-form-abstract-input]',
    '#manuscript-abstract',
    'textarea',
  ];

  for (const selector of selectors) {
    const locator = page.locator(selector).first();
    const count = await locator.count().catch(() => 0);
    if (!count) continue;

    try {
      await locator.waitFor({ state: "visible", timeout: 5000 });
      return locator;
    } catch {
      // Keep trying fallback selectors.
    }
  }

  return null;
};

const collectJsonResponse = async (response) => {
  try {
    const contentType = response.headers()["content-type"] || "";
    if (!contentType.includes("application/json")) return null;
    return await response.json();
  } catch {
    return null;
  }
};

const attachPageLogging = (page, prefix = "PAGE") => {
  page.on("console", (msg) => console.log(`${prefix} LOG:`, msg.text()));
  page.on("pageerror", (error) =>
    console.log(`${prefix} ERROR:`, error.message),
  );
  page.on("response", (response) => {
    if (response.status() >= 400) {
      console.log(`${prefix} HTTP ERROR:`, response.status(), response.url());
    }
  });
};

const extractSpringerJournals = async (page) => {
  const journals = await page
    .locator(".app-card-open")
    .evaluateAll((cards) =>
      cards.map((card, index) => {
        const link = card.querySelector('a[href*="/journal/"]');
        const title = link?.textContent?.trim() || "";
        const href = link?.getAttribute("href") || "";
        const metadata = {};

        card.querySelectorAll("dl .app-card-open__metadata-list-title").forEach((dt) => {
          const key = dt.textContent?.trim();
          const value = dt.nextElementSibling?.textContent?.trim() || "";
          if (key) {
            metadata[key] = value;
          }
        });

        const subjects = Array.from(
          card.querySelectorAll(".app-journal-snt-list__subject"),
        )
          .map((node) => node.textContent?.trim() || "")
          .filter(Boolean);

        const fundingText = Array.from(
          card.querySelectorAll(".app-suggester-journal-overview__funding-msg p"),
        )
          .map((node) => node.textContent?.trim() || "")
          .filter(Boolean);

        return {
          rank: index + 1,
          title,
          journalUrl: href,
          publishingModel: metadata["Publishing Model"] || null,
          impactFactorText: metadata["Journal Impact Factor"] || null,
          downloadsText: metadata["Downloads"] || null,
          decisionTimeText:
            metadata["Submission to first decision (median)"] || null,
          subjectAreas: subjects,
          fundingNotes: fundingText,
        };
      }),
    )
    .catch(() => []);

  return journals
    .map((journal) => {
      const journalUrl = toAbsoluteUrl(
        journal.journalUrl,
        "https://link.springer.com",
      );

      return {
        provider: "springer",
        rank: journal.rank,
        title: normalizeWhitespace(journal.title),
        sourceUrl: journalUrl,
        submissionLink: buildSpringerSubmissionUrl(journalUrl),
        guideForAuthors: buildSpringerSubmissionUrl(journalUrl),
        publishingModel: normalizeWhitespace(journal.publishingModel) || null,
        openAccessType: normalizeWhitespace(journal.publishingModel) || null,
        impactFactor: parseNumber(journal.impactFactorText),
        impactFactorText: normalizeWhitespace(journal.impactFactorText) || null,
        downloads: parseInteger(journal.downloadsText),
        decisionDays: parseInteger(journal.decisionTimeText),
        decisionTimeText: normalizeWhitespace(journal.decisionTimeText) || null,
        subjectAreas: journal.subjectAreas.map(normalizeWhitespace),
        scope: journal.subjectAreas.map(normalizeWhitespace).join(", ") || null,
        fundingNotes: journal.fundingNotes.map(normalizeWhitespace),
      };
    })
    .filter((journal) => journal.title && journal.sourceUrl);
};

const extractElsevierJournals = (networkEvents) => {
  const resultSets = networkEvents
    .filter((event) => event.url.includes("/journals/keywords-search"))
    .flatMap((event) =>
      Array.isArray(event.json?.results) ? event.json.results : [],
    );

  return dedupeBy(
    resultSets.map((item, index) => ({
      provider: "elsevier",
      rank: item.ranking ?? index + 1,
      title: normalizeWhitespace(item.title),
      sourceUrl:
        toAbsoluteUrl(item.links?.guideForAuthors, "https://www.elsevier.com") ||
        toAbsoluteUrl(item.links?.submission, "https://www.elsevier.com"),
      submissionLink:
        toAbsoluteUrl(item.links?.submission, "https://www.elsevier.com"),
      guideForAuthors:
        toAbsoluteUrl(item.links?.guideForAuthors, "https://www.elsevier.com"),
      acronym: normalizeWhitespace(item.acronym) || null,
      issn: normalizeWhitespace(item.issn) || null,
      publishingModel: normalizeWhitespace(item.openAccessType) || null,
      openAccessType: normalizeWhitespace(item.openAccessType) || null,
      impactFactor: item.insights?.impactFactor?.value ?? null,
      citeScore: item.insights?.citeScore?.value ?? null,
      decisionDays: item.insights?.timeToFirstDecision?.value ?? null,
      acceptanceDays: item.insights?.timeToAcceptance?.value ?? null,
      subjectAreas: Array.isArray(item.subjectAreas)
        ? item.subjectAreas.map(normalizeWhitespace).filter(Boolean)
        : [],
      articleTypes: Array.isArray(item.articleTypes)
        ? item.articleTypes.map(normalizeWhitespace).filter(Boolean)
        : [],
      scope: stripHtml(item.scope),
      editorInChief: normalizeWhitespace(item.editorInChief) || null,
      goldOpenAccessFee: item.goldOpenAccessFee?.value ?? null,
      goldOpenAccessCurrency:
        normalizeWhitespace(item.goldOpenAccessFee?.currency) || null,
      coverImage: toAbsoluteUrl(item.cover, "https://www.elsevier.com"),
      hasAgreements:
        typeof item.hasAgreements === "boolean" ? item.hasAgreements : null,
    })),
    (item) => item.issn || `${item.provider}:${item.title.toLowerCase()}`,
  );
};

const writeNormalizedOutputs = async (runDir, query, resultsByProvider) => {
  const springerJournals = resultsByProvider.springer ?? [];
  const elsevierJournals = resultsByProvider.elsevier ?? [];
  const mergedJournals = [...springerJournals, ...elsevierJournals].sort(
    (left, right) => {
      if (left.provider === right.provider) {
        return (left.rank ?? Number.MAX_SAFE_INTEGER) - (right.rank ?? Number.MAX_SAFE_INTEGER);
      }
      return left.provider.localeCompare(right.provider);
    },
  );

  await safeWriteJson(
    path.join(runDir, "springer-journals.json"),
    springerJournals,
  );
  await safeWriteJson(
    path.join(runDir, "elsevier-journals.json"),
    elsevierJournals,
  );
  await safeWriteJson(path.join(runDir, "journals-merged.json"), mergedJournals);

  return {
    query,
    springerCount: springerJournals.length,
    elsevierCount: elsevierJournals.length,
    mergedCount: mergedJournals.length,
    files: {
      springer: path.join(runDir, "springer-journals.json"),
      elsevier: path.join(runDir, "elsevier-journals.json"),
      merged: path.join(runDir, "journals-merged.json"),
    },
  };
};

const scrapeSpringer = async (page, query, runDir) => {
  const networkEvents = [];

  page.on("response", async (response) => {
    const url = response.url();
    if (!url.includes("link.springer.com")) return;

    const json = await collectJsonResponse(response);
    if (!json) return;

    networkEvents.push({
      url,
      status: response.status(),
      json,
    });
  });

  await page.goto("https://link.springer.com/journals/journal-finder", {
    waitUntil: "domcontentloaded",
    timeout: 90000,
  });

  await dismissCommonOverlays(page);
  const input = await resolveSpringerInput(page);
  if (!input) {
    throw new Error("Could not find the Springer journal finder input textarea.");
  }

  await input.scrollIntoViewIfNeeded().catch(() => {});
  await input.fill(query, { timeout: 10000 });

  await Promise.all([
    page.locator('button[data-test="main-button"]').click(),
    page.waitForTimeout(8000),
  ]);

  const finalUrl = page.url();
  const html = await page.content();
  const text = await page.locator("body").innerText().catch(() => "");
  const journals = await extractSpringerJournals(page);

  await fs.writeFile(path.join(runDir, "springer-page.html"), html, "utf8");
  await fs.writeFile(path.join(runDir, "springer-page.txt"), text, "utf8");
  await safeWriteJson(path.join(runDir, "springer-network.json"), networkEvents);

  return {
    provider: "springer",
    finalUrl,
    recommendationCount: journals.length,
    networkCaptureCount: networkEvents.length,
    journals,
  };
};

const buildElsevierResultsUrl = (query) => {
  const params = new URLSearchParams({
    goldOpenAccess: "true",
    subscription: "true",
    sortBy: "default",
    sortOrder: "desc",
    query,
    mode: "search",
    ecrId: "",
    agreementsFilter: "all-journals",
  });

  return `https://journalfinder.elsevier.com/results?${params.toString()}`;
};

const scrapeElsevier = async (page, query, runDir) => {
  const networkEvents = [];

  page.on("response", async (response) => {
    const url = response.url();
    if (
      !url.includes("authorhub.elsevier.com/api/v1") &&
      !url.includes("/api/")
    ) {
      return;
    }

    const json = await collectJsonResponse(response);
    if (!json) return;

    networkEvents.push({
      url,
      status: response.status(),
      json,
    });
  });

  const url = buildElsevierResultsUrl(query);
  await page.goto(url, {
    waitUntil: "domcontentloaded",
    timeout: 90000,
  });

  await page.waitForTimeout(12000);

  const finalUrl = page.url();
  const html = await page.content();
  const text = await page.locator("body").innerText().catch(() => "");
  const journals = extractElsevierJournals(networkEvents);

  await fs.writeFile(path.join(runDir, "elsevier-page.html"), html, "utf8");
  await fs.writeFile(path.join(runDir, "elsevier-page.txt"), text, "utf8");
  await safeWriteJson(path.join(runDir, "elsevier-network.json"), networkEvents);

  return {
    provider: "elsevier",
    finalUrl,
    networkCaptureCount: networkEvents.length,
    recommendationCount: journals.length,
    journals,
  };
};

const main = async () => {
  const options = parseArgs();
  const runDir = path.join(
    outputRoot,
    `${nowStamp()}-${slugify(options.provider)}-${slugify(options.query)}`,
  );
  await ensureDir(runDir);

  const browser = await chromium.launch({ headless: options.headless });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1200 },
    locale: "en-US",
    timezoneId: "Asia/Kolkata",
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  });
  const page = await context.newPage();
  page.setDefaultTimeout(options.timeoutMs);
  attachPageLogging(page, "SPRINGER");

  const summary = {
    query: options.query,
    provider: options.provider,
    runDir,
    results: [],
  };
  const resultsByProvider = {};

  try {
    if (options.provider === "springer" || options.provider === "both") {
      try {
        const result = await scrapeSpringer(page, options.query, runDir);
        resultsByProvider.springer = result.journals;
        summary.results.push({
          provider: result.provider,
          finalUrl: result.finalUrl,
          recommendationCount: result.recommendationCount,
          networkCaptureCount: result.networkCaptureCount,
          outputFile: path.join(runDir, "springer-journals.json"),
        });
      } catch (error) {
        summary.results.push({
          provider: "springer",
          error: error.message,
        });
      }
    }

    if (options.provider === "elsevier" || options.provider === "both") {
      const elsevierPage = await context.newPage();
      elsevierPage.setDefaultTimeout(options.timeoutMs);
      attachPageLogging(elsevierPage, "ELSEVIER");

      try {
        const result = await scrapeElsevier(elsevierPage, options.query, runDir);
        resultsByProvider.elsevier = result.journals;
        summary.results.push({
          provider: result.provider,
          finalUrl: result.finalUrl,
          recommendationCount: result.recommendationCount,
          networkCaptureCount: result.networkCaptureCount,
          outputFile: path.join(runDir, "elsevier-journals.json"),
        });
      } catch (error) {
        summary.results.push({
          provider: "elsevier",
          error: error.message,
        });
      } finally {
        await elsevierPage.close().catch(() => {});
      }
    }

    summary.normalized = await writeNormalizedOutputs(
      runDir,
      options.query,
      resultsByProvider,
    );
    await safeWriteJson(path.join(runDir, "summary.json"), summary);
    console.log(JSON.stringify(summary, null, 2));
  } finally {
    await context.close();
    await browser.close();
  }
};

main().catch((error) => {
  console.error("Journal finder probe failed:");
  console.error(error);
  process.exitCode = 1;
});
