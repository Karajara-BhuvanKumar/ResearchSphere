import axios from "axios";
import xml2js from "xml2js";
import * as cheerio from "cheerio";

const REQUEST_TIMEOUT = 15000;
const DEFAULT_HEADERS = {
  "User-Agent":
    "ResearchSphereBot/1.0 (+https://researchsphere.local; educational project)",
  Accept: "text/html,application/xml,text/xml;q=0.9,*/*;q=0.8",
};

const BROWSER_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  Accept:
    "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
  Connection: "keep-alive",
};

const resolveAbsoluteUrl = (baseUrl, href) => {
  const normalizedHref = normalizeWhitespace(href);
  if (!normalizedHref) return null;

  try {
    return new URL(normalizedHref, baseUrl).toString();
  } catch {
    return null;
  }
};

const toAbsoluteUrl = (url) => {
  if (!url) return null;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  if (url.startsWith("//")) return `https:${url}`;
  return `https://www.jobs.ac.uk${url.startsWith("/") ? "" : "/"}${url}`;
};

const normalizeWhitespace = (value) =>
  (value || "").replace(/\s+/g, " ").trim();

const stripHtml = (value) =>
  cheerio
    .load(`<div>${value || ""}</div>`)("div")
    .text();

const parseWikiDescription = (description) => {
  const normalized = normalizeWhitespace(description);
  const bracketParts = [...normalized.matchAll(/\[([^\]]+)\]/g)].map(
    (m) => m[1],
  );
  const location = bracketParts[0] || null;
  const dateRange = bracketParts[1] || null;

  return {
    summary: normalized,
    location,
    eventDate: dateRange,
  };
};

const isComputerScienceRelevant = (text) => {
  const corpus = (text || "").toLowerCase();
  return [
    "computer science",
    "ai",
    "artificial intelligence",
    "machine learning",
    "deep learning",
    "software",
    "cyber",
    "data science",
    "informatics",
    "computing",
    "nlp",
    "vision",
    "network",
    "blockchain",
    "web3",
    "data mining",
    "big data",
    "cybersecurity",
    "cryptography",
    "machine intelligence",
    "deep neural",
    "analytics",
    "quantum computing",
    "database",
    "reinforcement learning",
    "large language model",
    "llm",
    "generative ai",
    "genai",
  ].some((term) => corpus.includes(term));
};

const isIndiaRelevant = (text) => {
  const corpus = (text || "").toLowerCase();
  return [
    "india",
    "indian",
    "delhi",
    "mumbai",
    "bengaluru",
    "bangalore",
    "hyderabad",
    "chennai",
    "pune",
    "kolkata",
    "iit",
    "nit",
    "iisc",
    "iiit",
    "surathkal",
    "warangal",
    "tiruchirappalli",
    "trichy",
    "nirf",
    "ugc",
    "inr",
  ].some((term) => corpus.includes(term));
};

const parseDayMonthToIso = (value) => {
  const normalized = normalizeWhitespace(value);
  const match = normalized.match(/^(\d{1,2})\s+([A-Za-z]{3,9})$/);
  if (!match) return null;

  const day = Number.parseInt(match[1], 10);
  const monthToken = match[2].slice(0, 3).toLowerCase();
  const monthMap = {
    jan: 0,
    feb: 1,
    mar: 2,
    apr: 3,
    may: 4,
    jun: 5,
    jul: 6,
    aug: 7,
    sep: 8,
    oct: 9,
    nov: 10,
    dec: 11,
  };

  if (!Number.isFinite(day) || day < 1 || day > 31) return null;
  if (!(monthToken in monthMap)) return null;

  const now = new Date();
  const candidate = new Date(
    Date.UTC(now.getFullYear(), monthMap[monthToken], day),
  );

  if (candidate.getTime() > now.getTime() + 1000 * 60 * 60 * 24 * 32) {
    candidate.setUTCFullYear(candidate.getUTCFullYear() - 1);
  }

  return candidate.toISOString();
};

const parseNaturalDateToIso = (value) => {
  const normalized = normalizeWhitespace(value);
  if (!normalized) return null;
  const parsed = Date.parse(normalized);
  if (Number.isNaN(parsed)) return null;
  return new Date(parsed).toISOString();
};

const extractDateFromText = (text) => {
  const normalized = normalizeWhitespace(text);
  if (!normalized) return { raw: null, iso: null };

  const patterns = [
    /\b([A-Za-z]{3,9}\s+\d{1,2},\s*\d{4})\b/,
    /\b(\d{1,2}\s+[A-Za-z]{3,9}\s+\d{4})\b/,
    /\b(\d{1,2}\/[\d]{1,2}\/[\d]{4})\b/,
  ];

  for (const pattern of patterns) {
    const match = normalized.match(pattern);
    if (!match) continue;

    const raw = normalizeWhitespace(match[1]);
    const iso = parseNaturalDateToIso(raw);
    if (iso) {
      return { raw, iso };
    }
  }

  return { raw: null, iso: null };
};

const isResearchFundingRelevant = (text) => {
  const corpus = (text || "").toLowerCase();
  return [
    "call for proposal",
    "call for proposals",
    "cfp",
    "fellowship",
    "grant",
    "funding",
    "research project",
    "scheme",
    "nominations",
    "applications invited",
    "project call",
  ].some((term) => corpus.includes(term));
};

export const SOURCE_REGISTRY = [
  {
    id: "wikicfp-cs",
    name: "WikiCFP (Computer Science RSS)",
    kind: "conference",
    type: "rss",
    url: "http://www.wikicfp.com/cfp/rss?cat=computer%20science",
  },
  {
    id: "wikicfp-ml",
    name: "WikiCFP (Machine Learning RSS)",
    kind: "conference",
    subtype: "conference",
    type: "rss",
    url: "http://www.wikicfp.com/cfp/rss?cat=machine%20learning",
  },
  {
    id: "wikicfp-data-science",
    name: "WikiCFP (Data Science RSS)",
    kind: "conference",
    subtype: "conference",
    type: "rss",
    url: "http://www.wikicfp.com/cfp/rss?cat=data%20science",
  },
  {
    id: "wikicfp-data-mining",
    name: "WikiCFP (Data Mining RSS)",
    kind: "conference",
    subtype: "conference",
    type: "rss",
    url: "http://www.wikicfp.com/cfp/rss?cat=data%20mining",
  },
  {
    id: "wikicfp-blockchain",
    name: "WikiCFP (Blockchain RSS)",
    kind: "conference",
    subtype: "conference",
    type: "rss",
    url: "http://www.wikicfp.com/cfp/rss?cat=blockchain",
  },
  {
    id: "wikicfp-cybersecurity",
    name: "WikiCFP (Cybersecurity RSS)",
    kind: "conference",
    subtype: "conference",
    type: "rss",
    url: "http://www.wikicfp.com/cfp/rss?cat=cybersecurity",
  },
  {
    id: "wikicfp-nlp",
    name: "WikiCFP (NLP RSS)",
    kind: "conference",
    subtype: "conference",
    type: "rss",
    url: "http://www.wikicfp.com/cfp/rss?cat=natural%20language%20processing",
  },
  {
    id: "wikicfp-computer-vision",
    name: "WikiCFP (Computer Vision RSS)",
    kind: "conference",
    subtype: "conference",
    type: "rss",
    url: "http://www.wikicfp.com/cfp/rss?cat=computer%20vision",
  },
  {
    id: "wikicfp-big-data",
    name: "WikiCFP (Big Data RSS)",
    kind: "conference",
    subtype: "conference",
    type: "rss",
    url: "http://www.wikicfp.com/cfp/rss?cat=big%20data",
  },
  {
    id: "researchcom-cs-journals",
    name: "Research.com (Computer Science Journals)",
    kind: "journal",
    type: "html",
    url: "https://research.com/journals-rankings/computer-science?page=1",
  },
  {
    id: "allconferencealert-cs",
    name: "AllConferenceAlert (Computer Science)",
    kind: "conference",
    subtype: "conference",
    type: "html",
    url: "https://www.allconferencealert.com/computer-science.html",
  },
  {
    id: "conferenceindex-cs",
    name: "Conference Index (Computer Science)",
    kind: "conference",
    subtype: "conference",
    type: "html",
    url: "https://conferenceindex.org/conferences/computer-science",
  },
  {
    id: "call4paper-cs-events",
    name: "Call4Paper (Computer Science Events)",
    kind: "conference",
    subtype: "conference",
    type: "html",
    url: "https://www.call4paper.com/cfp/listBySubject?type=event&subject=2.21&count=count",
  },
  {
    id: "call4paper-cs-journals",
    name: "Call4Paper (Computer Science Journals)",
    kind: "journal",
    subtype: "journal",
    type: "html",
    url: "https://www.call4paper.com/cfp/listBySubject?type=journal&subject=2.21&count=count",
  },
  {
    id: "dst-project-calls",
    name: "DST India (Call for Proposals)",
    kind: "opportunity",
    subtype: "project-call",
    type: "html",
    indiaFocused: true,
    url: "https://dst.gov.in/call-for-proposals",
  },
  {
    id: "anrf-project-calls",
    name: "ANRF India (Proposal Calls)",
    kind: "opportunity",
    subtype: "project-call",
    type: "html",
    indiaFocused: true,
    url: "https://www.anrfonline.in/ANRF/HomePage",
  },
  {
    id: "icssr-fellowships-calls",
    name: "ICSSR India (Fellowships & Calls)",
    kind: "opportunity",
    subtype: "project-call",
    type: "html",
    indiaFocused: true,
    url: "https://www.icssr.org/announcements/call-project-proposals-under-scheme-major-and-minor-research-projects-2025-26",
    staticTitle:
      "Call for Project Proposals under the Scheme Major and Minor Research Projects (2025-26)",
    staticSummary:
      "ICSSR invites applications from Indian scholars, researchers, and academicians under its Major and Minor Research Projects schemes for the financial year 2025-2026.",
    staticPublishedDate: "2025-11-15",
    staticDeadlineDate: "2025-12-31",
    staticUrl:
      "https://www.icssr.org/announcements/call-project-proposals-under-scheme-major-and-minor-research-projects-2025-26",
  },
  {
    id: "meity-project-calls",
    name: "MeitY India (Calls & Announcements)",
    kind: "opportunity",
    subtype: "project-call",
    type: "html",
    indiaFocused: true,
    url: "https://www.meity.gov.in/",
    staticTitle: "Call for Proposal for Research & Development in Cyber Security",
    staticSummary:
      "MeitY invites research and development proposals in cyber security. The notice describes eligibility, thrust areas, selection criteria, and the proposal submission process.",
    staticPublishedDate: "2025-09-01",
    staticDeadlineDate: "2025-09-30",
    staticUrl:
      "https://www.meity.gov.in/static/uploads/2025/09/28864412dfd563823c16998f76486b09.pdf",
  },
  {
    id: "csir-project-calls",
    name: "CSIR India (Calls & Announcements)",
    kind: "opportunity",
    subtype: "project-call",
    type: "html",
    indiaFocused: true,
    url: "https://www.csir.res.in/en/news-calls-and-events",
  },
  {
    id: "isro-project-calls",
    name: "ISRO India (Project Proposals)",
    kind: "opportunity",
    subtype: "project-call",
    type: "html",
    indiaFocused: true,
    url: "https://www.isro.gov.in/ISRO_EN/RESPOND_BASKET_2025.html",
    staticTitle: "RESPOND Basket 2025 Research Proposal Call",
    staticSummary:
      "ISRO invites research proposals from recognized academic and R&D institutions under the RESPOND Basket 2025 programme in areas aligned with upcoming missions and national priorities.",
    staticPublishedDate: "2025-12-01",
    staticDeadlineDate: "2026-01-31",
    staticUrl: "https://www.isro.gov.in/ISRO_EN/RESPOND_BASKET_2025.html",
  },
  {
    id: "drdo-project-calls",
    name: "DRDO India (Extramural Research)",
    kind: "opportunity",
    subtype: "project-call",
    type: "html",
    indiaFocused: true,
    url: "https://www.drdo.gov.in/drdo/er-forms-for-projects",
    staticTitle: "Application for DRDO Extramural Research Grant",
    staticSummary:
      "DRDO publishes the application forms and guidance required for extramural research grant submissions, including the research proposal performa and supporting project documentation.",
    staticUrl: "https://www.drdo.gov.in/drdo/er-forms-for-projects",
  },
  {
    id: "nirf-project-calls",
    name: "NIRF India (Announcements)",
    kind: "opportunity",
    subtype: "project-call",
    type: "html",
    indiaFocused: true,
    url: "https://www.nirfindia.org/",
    staticTitle: "NIRF India Rankings 2026 Data Submission Notice",
    staticSummary:
      "The NIRF portal announces the active data capturing and submission window for India Rankings 2026, including research-category participation guidance and technical support details.",
    staticPublishedDate: "2026-01-06",
    staticDeadlineDate: "2026-03-16",
    staticUrl: "https://login.nirfindia.org/",
  },
  {
    id: "aicte-fellowships-calls",
    name: "AICTE India (Announcements & Fellowships)",
    kind: "opportunity",
    subtype: "project-call",
    type: "html",
    indiaFocused: true,
    url: "https://www.aicte.gov.in/",
  },
  {
    id: "jobsacuk-cs-phd",
    name: "Jobs.ac.uk (CS PhD Search)",
    kind: "opportunity",
    subtype: "phd",
    type: "html",
    url: "https://www.jobs.ac.uk/search/?keywords=computer+science+phd",
  },
  {
    id: "jobsacuk-cs-postdoc",
    name: "Jobs.ac.uk (CS Postdoc Search)",
    kind: "opportunity",
    subtype: "postdoc",
    type: "html",
    url: "https://www.jobs.ac.uk/search/?keywords=computer+science+postdoctoral",
  },
  {
    id: "jobsacuk-cs-internship",
    name: "Jobs.ac.uk (CS Internship Search)",
    kind: "opportunity",
    subtype: "internship",
    type: "html",
    url: "https://www.jobs.ac.uk/search/?keywords=computer+science+internship",
  },
  {
    id: "jobsacuk-ml",
    name: "Jobs.ac.uk (Machine Learning Opportunities)",
    kind: "opportunity",
    subtype: "research",
    type: "html",
    url: "https://www.jobs.ac.uk/search/?keywords=machine+learning",
  },
  {
    id: "jobsacuk-data-science",
    name: "Jobs.ac.uk (Data Science Opportunities)",
    kind: "opportunity",
    subtype: "research",
    type: "html",
    url: "https://www.jobs.ac.uk/search/?keywords=data+science",
  },
  {
    id: "jobsacuk-blockchain",
    name: "Jobs.ac.uk (Blockchain Opportunities)",
    kind: "opportunity",
    subtype: "research",
    type: "html",
    url: "https://www.jobs.ac.uk/search/?keywords=blockchain",
  },
  {
    id: "noticebard-cs-conference",
    name: "NoticeBard (CS Conference Feed)",
    kind: "conference",
    subtype: "conference",
    type: "rss",
    indiaFocused: true,
    url: "https://www.noticebard.com/tag/conference/feed/",
  },
  {
    id: "noticebard-cs-journal",
    name: "NoticeBard (CS Journal Feed)",
    kind: "journal",
    subtype: "journal",
    type: "rss",
    indiaFocused: true,
    url: "https://www.noticebard.com/tag/journal/feed/",
  },
  {
    id: "ijert-journal-feed",
    name: "IJERT (Indian Engineering Research Journal Feed)",
    kind: "journal",
    subtype: "journal",
    type: "rss",
    indiaFocused: true,
    url: "https://www.ijert.org/feed",
  },
  {
    id: "arxiv-ml",
    name: "arXiv (Machine Learning)",
    kind: "journal",
    subtype: "preprint",
    type: "atom",
    url: "https://export.arxiv.org/api/query?search_query=cat:cs.LG&start=0&max_results=80&sortBy=submittedDate&sortOrder=descending",
  },
  {
    id: "arxiv-ai",
    name: "arXiv (Artificial Intelligence)",
    kind: "journal",
    subtype: "preprint",
    type: "atom",
    url: "https://export.arxiv.org/api/query?search_query=cat:cs.AI&start=0&max_results=80&sortBy=submittedDate&sortOrder=descending",
  },
  {
    id: "arxiv-cv",
    name: "arXiv (Computer Vision)",
    kind: "journal",
    subtype: "preprint",
    type: "atom",
    url: "https://export.arxiv.org/api/query?search_query=cat:cs.CV&start=0&max_results=80&sortBy=submittedDate&sortOrder=descending",
  },
  {
    id: "arxiv-nlp",
    name: "arXiv (NLP)",
    kind: "journal",
    subtype: "preprint",
    type: "atom",
    url: "https://export.arxiv.org/api/query?search_query=cat:cs.CL&start=0&max_results=80&sortBy=submittedDate&sortOrder=descending",
  },
  {
    id: "arxiv-crypto-blockchain",
    name: "arXiv (Crypto & Blockchain Related)",
    kind: "journal",
    subtype: "preprint",
    type: "atom",
    url: "https://export.arxiv.org/api/query?search_query=all:blockchain+OR+cat:cs.CR&start=0&max_results=80&sortBy=submittedDate&sortOrder=descending",
  },
  {
    id: "arxiv-data-science",
    name: "arXiv (Data Science)",
    kind: "journal",
    subtype: "preprint",
    type: "atom",
    url: "https://export.arxiv.org/api/query?search_query=all:%22data+science%22+OR+cat:cs.DB&start=0&max_results=80&sortBy=submittedDate&sortOrder=descending",
  },
  {
    id: "arxiv-stat-ml",
    name: "arXiv (Statistical Machine Learning)",
    kind: "journal",
    subtype: "preprint",
    type: "atom",
    url: "https://export.arxiv.org/api/query?search_query=cat:stat.ML&start=0&max_results=80&sortBy=submittedDate&sortOrder=descending",
  },
  {
    id: "arxiv-software-eng",
    name: "arXiv (Software Engineering)",
    kind: "journal",
    subtype: "preprint",
    type: "atom",
    url: "https://export.arxiv.org/api/query?search_query=cat:cs.SE&start=0&max_results=80&sortBy=submittedDate&sortOrder=descending",
  },
  {
    id: "arxiv-databases",
    name: "arXiv (Databases)",
    kind: "journal",
    subtype: "preprint",
    type: "atom",
    url: "https://export.arxiv.org/api/query?search_query=cat:cs.DB&start=0&max_results=80&sortBy=submittedDate&sortOrder=descending",
  },
  {
    id: "paperswithcode-rss",
    name: "Papers With Code (Latest)",
    kind: "journal",
    subtype: "preprint",
    type: "rss",
    url: "https://paperswithcode.com/rss.xml",
  },
  {
    id: "kdnuggets-feed",
    name: "KDnuggets (Data Science Feed)",
    kind: "journal",
    subtype: "article",
    type: "rss",
    url: "https://www.kdnuggets.com/feed",
  },
  {
    id: "analytics-vidhya-feed",
    name: "Analytics Vidhya (AI/DS Feed)",
    kind: "journal",
    subtype: "article",
    type: "rss",
    indiaFocused: true,
    url: "https://www.analyticsvidhya.com/feed/",
  },
  {
    id: "tensorflow-blog-feed",
    name: "TensorFlow Blog (Official)",
    kind: "journal",
    subtype: "article",
    type: "rss",
    url: "https://blog.tensorflow.org/feeds/posts/default?alt=rss",
  },
  {
    id: "mlmastery-feed",
    name: "Machine Learning Mastery (Feed)",
    kind: "journal",
    subtype: "article",
    type: "rss",
    url: "https://machinelearningmastery.com/blog/feed/",
  },
  {
    id: "ai-news-feed",
    name: "AI News (Industry Feed)",
    kind: "journal",
    subtype: "article",
    type: "rss",
    url: "https://artificialintelligence-news.com/feed/",
  },
  {
    id: "ieee-spectrum-ai-feed",
    name: "IEEE Spectrum (AI Feed)",
    kind: "journal",
    subtype: "article",
    type: "rss",
    url: "https://spectrum.ieee.org/topic/artificial-intelligence.rss",
  },
  {
    id: "deeplearningai-batch-feed",
    name: "DeepLearning.AI - The Batch",
    kind: "journal",
    subtype: "article",
    type: "rss",
    url: "https://www.deeplearning.ai/the-batch/feed/",
  },
  {
    id: "openai-news-feed",
    name: "OpenAI News",
    kind: "journal",
    subtype: "article",
    type: "rss",
    url: "https://openai.com/news/rss.xml",
  },
  {
    id: "google-ai-blog-feed",
    name: "Google AI Blog",
    kind: "journal",
    subtype: "article",
    type: "rss",
    url: "https://blog.google/technology/ai/rss/",
  },
  {
    id: "towards-datascience-feed",
    name: "Towards Data Science",
    kind: "journal",
    subtype: "article",
    type: "rss",
    url: "https://towardsdatascience.com/feed",
  },
  {
    id: "huggingface-blog-feed",
    name: "Hugging Face Blog",
    kind: "journal",
    subtype: "article",
    type: "rss",
    url: "https://huggingface.co/blog/feed.xml",
  },
  {
    id: "researchtweet-phd-feed",
    name: "ResearchTweet (PhD Opportunities)",
    kind: "opportunity",
    subtype: "phd",
    type: "rss",
    url: "https://researchtweet.com/category/phd-opportunities/feed/",
  },
  {
    id: "researchtweet-postdoc-feed",
    name: "ResearchTweet (Postdoc Opportunities)",
    kind: "opportunity",
    subtype: "postdoc",
    type: "rss",
    url: "https://researchtweet.com/category/postdoc-opportunities/feed/",
  },
  {
    id: "researchtweet-internship-feed",
    name: "ResearchTweet (Internship Opportunities)",
    kind: "opportunity",
    subtype: "internship",
    type: "rss",
    url: "https://researchtweet.com/category/internship/feed/",
  },
  {
    id: "researchtweet-book-chapter-feed",
    name: "ResearchTweet (Call for Book Chapters)",
    kind: "opportunity",
    subtype: "book-chapter",
    type: "rss",
    url: "https://researchtweet.com/category/call-for-book-chapter/feed/",
  },
  {
    id: "noticebard-cs-phd",
    name: "NoticeBard (CS PhD Feed)",
    kind: "opportunity",
    subtype: "phd",
    type: "rss",
    indiaFocused: true,
    url: "https://www.noticebard.com/tag/phd/feed/",
  },
  {
    id: "noticebard-cs-postdoc",
    name: "NoticeBard (CS Postdoc Feed)",
    kind: "opportunity",
    subtype: "postdoc",
    type: "rss",
    indiaFocused: true,
    url: "https://www.noticebard.com/tag/post-doctoral-fellowship/feed/",
  },
  {
    id: "noticebard-cs-internship",
    name: "NoticeBard (CS Internship Feed)",
    kind: "opportunity",
    subtype: "internship",
    type: "rss",
    indiaFocused: true,
    url: "https://www.noticebard.com/tag/internship/feed/",
  },
  {
    id: "noticebard-book-chapter-feed",
    name: "NoticeBard (Call for Book Chapters)",
    kind: "opportunity",
    subtype: "book-chapter",
    type: "rss",
    indiaFocused: true,
    url: "https://www.noticebard.com/tag/call-for-book-chapters/feed/",
  },
  {
    id: "bookchapter-igi-search",
    name: "IGI Global (Book Chapters Calls)",
    kind: "opportunity",
    subtype: "book-chapter",
    type: "html",
    url: "https://www.igi-global.com/publish/call-for-papers/search/?dt=book-chapters",
  },
  {
    id: "bookchapter-informs-thread",
    name: "INFORMS Connect (Book Chapter Calls)",
    kind: "opportunity",
    subtype: "book-chapter",
    type: "html",
    url: "https://connect.informs.org/discussion/call-for-book-chapters-1",
  },
  {
    id: "bookchapter-informs-discussion",
    name: "INFORMS Connect (Book Chapter Discussion)",
    kind: "opportunity",
    subtype: "book-chapter",
    type: "html",
    url: "https://connect.informs.org/discussion/call-for-book-chapters?hlmlt=VT",
  },
  {
    id: "bookchapter-informs-library",
    name: "INFORMS Connect (Book Chapter Library Entry)",
    kind: "opportunity",
    subtype: "book-chapter",
    type: "html",
    url: "https://connect.informs.org/viewdocument/call-for-book-chapters?CommunityKey=1d5653fa-85c8-46b3-8176-869b140e5e3c&tab=librarydocuments&hlmlt=VT",
  },
  {
    id: "bookchapter-ky-publications",
    name: "KY Publications (Book Chapters Submission Open)",
    kind: "opportunity",
    subtype: "book-chapter",
    type: "html",
    indiaFocused: true,
    url: "http://kypublications.com/Call%20for%20Book%20Chapters-under%20Progress.html",
  },
  {
    id: "bookchapter-intechopen-federated-learning",
    name: "IntechOpen (Federated Learning Call for Chapters)",
    kind: "opportunity",
    subtype: "book-chapter",
    type: "static-book-chapter",
    url: "https://www.intechopen.com/welcome/1005084",
    staticTitle:
      "Federated Learning - Future of Next-Generation AI and Digital Transformation",
    staticSummary:
      "IntechOpen invites chapter proposals for an open access volume on federated learning, next-generation AI, and digital transformation, covering emerging methods, systems, privacy, and applications.",
    staticPublishedDate: "2026-03-01",
    staticDeadlineDate: "2026-03-26",
    staticOrganization: "IntechOpen",
    staticTags: ["computer-science", "ai", "machine-learning", "book-chapter"],
  },
  {
    id: "bookchapter-intechopen-gan",
    name: "IntechOpen (GANs Call for Chapters)",
    kind: "opportunity",
    subtype: "book-chapter",
    type: "static-book-chapter",
    url: "https://www.intechopen.com/welcome/1005517",
    staticTitle: "Generative Adversarial Networks (GAN) - From Theory to Practice",
    staticSummary:
      "IntechOpen invites chapter submissions for an open access book focused on generative adversarial networks, practical implementations, theory, evaluation, and real-world AI applications.",
    staticPublishedDate: "2026-03-01",
    staticDeadlineDate: "2026-04-20",
    staticOrganization: "IntechOpen",
    staticTags: ["computer-science", "ai", "deep-learning", "book-chapter"],
  },
  {
    id: "bookchapter-intechopen-intelligent-systems",
    name: "IntechOpen (Intelligent Systems Call for Chapters)",
    kind: "opportunity",
    subtype: "book-chapter",
    type: "static-book-chapter",
    url: "https://www.intechopen.com/welcome/1005790",
    staticTitle:
      "Intelligent Systems in Practice - Applied Analytics, Responsible AI and Real-World Impact",
    staticSummary:
      "IntechOpen invites chapter proposals for an open access volume on intelligent systems, applied analytics, responsible AI, and practical deployment in real-world settings.",
    staticPublishedDate: "2026-03-01",
    staticDeadlineDate: "2026-03-31",
    staticOrganization: "IntechOpen",
    staticTags: ["computer-science", "ai", "analytics", "book-chapter"],
  },
  {
    id: "bookchapter-intechopen-wsn",
    name: "IntechOpen (Wireless Sensor Networks Call for Chapters)",
    kind: "opportunity",
    subtype: "book-chapter",
    type: "static-book-chapter",
    url: "https://www.intechopen.com/welcome/1005487",
    staticTitle:
      "Wireless Sensor Networks - Future Evolution, Emerging Trends, Innovations, and Challenges",
    staticSummary:
      "IntechOpen invites chapter proposals for an open access book on wireless sensor networks, emerging architectures, security, privacy, machine learning, and future applications.",
    staticPublishedDate: "2026-03-01",
    staticDeadlineDate: "2026-03-27",
    staticOrganization: "IntechOpen",
    staticTags: ["computer-science", "networks", "iot", "book-chapter"],
  },
  {
    id: "iitd-cse-phd-admissions",
    name: "IIT Delhi CSE (PhD Admissions)",
    kind: "opportunity",
    subtype: "phd",
    type: "static-opportunity",
    indiaFocused: true,
    url: "https://homecse.iitd.ac.in/phd-admissions/",
    staticTitle: "Ph.D/MS(Research) Admissions - Computer Science and Engineering, IIT Delhi",
    staticSummary:
      "IIT Delhi CSE conducts PhD and MS(Research) admissions twice a year and publishes programme details, eligibility, timelines, and application guidance for prospective research students.",
    staticOrganization: "IIT Delhi",
    staticTags: ["computer-science", "phd", "india", "iit-delhi"],
  },
  {
    id: "iisc-eecs-phd-admissions",
    name: "IISc EECS (Research Admissions)",
    kind: "opportunity",
    subtype: "phd",
    type: "static-opportunity",
    indiaFocused: true,
    url: "https://eecs.iisc.ac.in/admissions/",
    staticTitle: "Research Programme Admissions - EECS, IISc Bengaluru",
    staticSummary:
      "The EECS division at IISc publishes admissions guidance for research programmes including PhD and MTech (Research) across computer science, data science, AI, and allied areas.",
    staticOrganization: "IISc Bengaluru",
    staticTags: ["computer-science", "phd", "india", "iisc"],
  },
  {
    id: "iisc-postdoctoral-fellowship",
    name: "IISc (Postdoctoral Fellowship)",
    kind: "opportunity",
    subtype: "postdoc",
    type: "static-opportunity",
    indiaFocused: true,
    url: "https://www.iisc.ac.in/careers/post-doctoral-fellowship/",
    staticTitle: "IISc Post-Doctoral Fellowship",
    staticSummary:
      "IISc invites applications from motivated researchers with strong publication records for institute post-doctoral fellowships across departments, centres, and interdisciplinary research areas.",
    staticOrganization: "IISc Bengaluru",
    staticTags: ["computer-science", "postdoc", "india", "iisc"],
  },
  {
    id: "iitd-cse-postdoc",
    name: "IIT Delhi CSE (Postdoctoral Fellows)",
    kind: "opportunity",
    subtype: "postdoc",
    type: "static-opportunity",
    indiaFocused: true,
    url: "https://www.phd.cse.iitd.ac.in/index.php/2011-12-29-23-14-30/alumni/101-post-doctoral-fellows",
    staticTitle: "Post-Doctoral Fellows - Department of Computer Science and Engineering, IIT Delhi",
    staticSummary:
      "The Department of Computer Science and Engineering at IIT Delhi publishes postdoctoral opportunities in systems, security, cloud computing, data analytics, computer vision, virtual reality, and related areas.",
    staticOrganization: "IIT Delhi",
    staticTags: ["computer-science", "postdoc", "india", "iit-delhi"],
  },
  {
    id: "isro-internship-schemes",
    name: "ISRO (Internship & Student Project Trainee Schemes)",
    kind: "opportunity",
    subtype: "internship",
    type: "static-opportunity",
    indiaFocused: true,
    url: "https://www.isro.gov.in/InternshipAndProjects.html",
    staticTitle: "DoS/ISRO Internship and Student Project Trainee Schemes",
    staticSummary:
      "ISRO offers internship and student project trainee opportunities for UG, PG, and PhD students in science and technology disciplines, subject to centre-wise availability and eligibility rules.",
    staticOrganization: "ISRO",
    staticTags: ["computer-science", "internship", "india", "isro"],
  },
  {
    id: "iisc-csa-sparks",
    name: "IISc CSA (SPARKS Research Programme)",
    kind: "opportunity",
    subtype: "internship",
    type: "static-opportunity",
    indiaFocused: true,
    url: "https://www.csa.iisc.ac.in/sparks-programme/",
    staticTitle: "SPARKS - Scholars Pursuing Advanced Research in Computer Science",
    staticSummary:
      "The CSA department at IISc invites applications to SPARKS, a research engagement programme for students and recent graduates in computer science, mathematics, and allied disciplines.",
    staticOrganization: "IISc Bengaluru",
    staticTags: ["computer-science", "internship", "india", "iisc"],
  },
  {
    id: "iisc-csa-degree-programs",
    name: "IISc CSA (Degree Programmes)",
    kind: "opportunity",
    subtype: "phd",
    type: "static-opportunity",
    indiaFocused: true,
    url: "https://www.csa.iisc.ac.in/academics-all/degree-programs/",
    staticTitle: "Research Degree Programmes - Computer Science and Automation, IISc Bengaluru",
    staticSummary:
      "The CSA department at IISc outlines PhD and MTech (Research) pathways in core computer science, systems, AI, formal methods, theory, security, and interdisciplinary computing.",
    staticOrganization: "IISc Bengaluru",
    staticTags: ["computer-science", "phd", "india", "iisc", "ai", "systems"],
  },
  {
    id: "iitm-dsai-msphd",
    name: "IIT Madras WSAI (MS/PhD Admissions)",
    kind: "opportunity",
    subtype: "phd",
    type: "static-opportunity",
    indiaFocused: true,
    url: "https://dsai.iitm.ac.in/academics/ms-phd-admissions/",
    staticTitle: "MS/PhD Admissions - Wadhwani School of Data Science and AI, IIT Madras",
    staticSummary:
      "The Wadhwani School of Data Science and AI at IIT Madras invites MS and PhD applicants in machine learning, deep learning, reinforcement learning, data systems, responsible AI, and related research areas.",
    staticOrganization: "IIT Madras",
    staticTags: ["data-science", "machine-learning", "ai", "phd", "india", "iit-madras"],
  },
  {
    id: "iitk-cse-admissions",
    name: "IIT Kanpur CSE (Admissions)",
    kind: "opportunity",
    subtype: "phd",
    type: "static-opportunity",
    indiaFocused: true,
    url: "https://www.cse.iitk.ac.in/users/admissions/",
    staticTitle: "Admissions - Department of Computer Science and Engineering, IIT Kanpur",
    staticSummary:
      "IIT Kanpur CSE publishes admissions guidance for research-oriented programmes including PhD, MS by Research, and advanced study in algorithms, systems, security, AI, robotics, and machine learning.",
    staticOrganization: "IIT Kanpur",
    staticTags: ["computer-science", "phd", "india", "iit-kanpur", "ai", "systems"],
  },
  {
    id: "iitk-dis-postdocs",
    name: "IIT Kanpur DIS (Prospective Postdocs)",
    kind: "opportunity",
    subtype: "postdoc",
    type: "static-opportunity",
    indiaFocused: true,
    url: "https://iitk.ac.in/dis/index.php/prospective-postdocs",
    staticTitle: "Prospective Postdoctoral Fellows - Department of Intelligent Systems, IIT Kanpur",
    staticSummary:
      "The Department of Intelligent Systems at IIT Kanpur invites prospective postdoctoral fellows in artificial intelligence, machine learning, data science, NLP, computer vision, robotics, security, and software systems.",
    staticOrganization: "IIT Kanpur",
    staticTags: ["postdoc", "india", "iit-kanpur", "artificial-intelligence", "machine-learning", "computer-vision"],
  },
  {
    id: "iitk-institute-postdoc",
    name: "IIT Kanpur (Institute Postdoctoral Fellowship)",
    kind: "opportunity",
    subtype: "postdoc",
    type: "static-opportunity",
    indiaFocused: true,
    url: "https://www.iitk.ac.in/dofa/index.php/institute-postdoctoral-fellowship",
    staticTitle: "Institute Postdoctoral Fellowship - IIT Kanpur",
    staticSummary:
      "IIT Kanpur offers institute postdoctoral fellowships across departments including Computer Science and Engineering, Intelligent Systems, AI, and allied computational research programmes.",
    staticOrganization: "IIT Kanpur",
    staticTags: ["postdoc", "india", "iit-kanpur", "computer-science", "ai"],
  },
  {
    id: "iitk-surge",
    name: "IIT Kanpur (SURGE Research Internship)",
    kind: "opportunity",
    subtype: "internship",
    type: "static-opportunity",
    indiaFocused: true,
    url: "https://surge.iitk.ac.in/index.php",
    staticTitle: "SURGE - Students-Undergraduate Research Graduate Excellence, IIT Kanpur",
    staticSummary:
      "SURGE at IIT Kanpur is a structured summer research internship programme that gives students exposure to faculty-led research in computer science, AI, data science, and other advanced technical areas.",
    staticOrganization: "IIT Kanpur",
    staticTags: ["internship", "india", "iit-kanpur", "computer-science", "research"],
  },
  {
    id: "iitk-sarip",
    name: "IIT Kanpur (SARIP Research Internship)",
    kind: "opportunity",
    subtype: "internship",
    type: "static-opportunity",
    indiaFocused: true,
    url: "https://sarip.iitk.ac.in/",
    staticTitle: "SARIP - Student Advance Research Internship Program, IIT Kanpur",
    staticSummary:
      "SARIP at IIT Kanpur is a postgraduate-oriented research internship programme designed for students interested in advanced interdisciplinary work across computing, engineering, and data-driven research.",
    staticOrganization: "IIT Kanpur",
    staticTags: ["internship", "india", "iit-kanpur", "data-science", "research"],
  },
  {
    id: "iitm-wsai-internships",
    name: "IIT Madras WSAI (Summer Internships)",
    kind: "opportunity",
    subtype: "internship",
    type: "static-opportunity",
    indiaFocused: true,
    url: "https://wsai.iitm.ac.in/internships/",
    staticTitle: "WSAI Summer Internships - Wadhwani School of Data Science and AI, IIT Madras",
    staticSummary:
      "The Wadhwani School of Data Science and AI at IIT Madras runs summer internships for students interested in AI, machine learning, data analytics, and societally relevant computing research.",
    staticOrganization: "IIT Madras",
    staticTags: ["internship", "india", "iit-madras", "machine-learning", "data-science", "ai"],
  },
  {
    id: "iitkgp-cse-internship",
    name: "IIT Kharagpur CSE (Summer Internship)",
    kind: "opportunity",
    subtype: "internship",
    type: "static-opportunity",
    indiaFocused: true,
    url: "https://cse.iitkgp.ac.in/othinterns/",
    staticTitle: "Call for Summer Internship - Department of Computer Science and Engineering, IIT Kharagpur",
    staticSummary:
      "IIT Kharagpur CSE periodically invites external students for faculty-guided summer research internships in core and applied computer science areas.",
    staticOrganization: "IIT Kharagpur",
    staticTags: ["internship", "india", "iit-kharagpur", "computer-science", "research"],
  },
  {
    id: "nitt-phd-admissions",
    name: "NIT Tiruchirappalli (PhD Admissions)",
    kind: "opportunity",
    subtype: "phd",
    type: "static-opportunity",
    indiaFocused: true,
    url: "https://www.nitt.edu/admissions/phd",
    staticTitle: "Ph.D. Admissions - NIT Tiruchirappalli",
    staticSummary:
      "NIT Tiruchirappalli publishes PhD admissions across engineering and computer-related departments, including full-time, externally funded, and scheme-based research scholar categories.",
    staticOrganization: "NIT Tiruchirappalli",
    staticTags: ["phd", "india", "nit", "nit-trichy", "computer-science", "information-technology"],
  },
  {
    id: "nitk-phd-research",
    name: "NIT Surathkal (PhD Research Programmes)",
    kind: "opportunity",
    subtype: "phd",
    type: "static-opportunity",
    indiaFocused: true,
    url: "https://www.nitk.ac.in/PHD_Research_Programmes",
    staticTitle: "Ph.D. Research Programmes - NITK Surathkal",
    staticSummary:
      "NITK Surathkal offers doctoral research opportunities across departments and interdisciplinary streams, including computing-oriented tracks relevant to computer science, cryptography, and data-driven research.",
    staticOrganization: "NITK Surathkal",
    staticTags: ["phd", "india", "nit", "nitk", "computer-science", "cryptography"],
  },
  {
    id: "nitw-visvesvaraya-postdoc",
    name: "NIT Warangal (Visvesvaraya Postdoctoral Scheme)",
    kind: "opportunity",
    subtype: "postdoc",
    type: "static-opportunity",
    indiaFocused: true,
    url: "https://admissions.nitw.ac.in/",
    staticTitle: "Visvesvaraya Postdoctoral Fellowship - NIT Warangal",
    staticSummary:
      "NIT Warangal announces Visvesvaraya postdoctoral opportunities for candidates from Computer Science and Engineering, Electronics, and allied digital technology areas.",
    staticOrganization: "NIT Warangal",
    staticTags: ["postdoc", "india", "nit", "nit-warangal", "computer-science", "digital-technologies"],
  },
  {
    id: "nitw-phd-admissions",
    name: "NIT Warangal (PhD Admissions)",
    kind: "opportunity",
    subtype: "phd",
    type: "static-opportunity",
    indiaFocused: true,
    url: "https://admissions.nitw.ac.in/phdphaseiii/",
    staticTitle: "Ph.D. Admissions - NIT Warangal",
    staticSummary:
      "NIT Warangal publishes institute PhD admissions schedules that include Computer Science and Engineering and other research departments relevant to computing and information technology.",
    staticOrganization: "NIT Warangal",
    staticTags: ["phd", "india", "nit", "nit-warangal", "computer-science", "information-technology"],
  },
  {
    id: "eth-ssrf",
    name: "ETH Zurich (Student Summer Research Fellowship)",
    kind: "opportunity",
    subtype: "internship",
    type: "static-opportunity",
    url: "https://inf.ethz.ch/studies/summer-research-fellowship.html",
    staticTitle: "ETH Student Summer Research Fellowship - Computer Science Department, ETH Zurich",
    staticSummary:
      "ETH Zurich's Computer Science Department offers a summer research fellowship in machine learning, security, systems, robotics, programming languages, HCI, visual computing, and theory for undergraduate and graduate students worldwide.",
    staticOrganization: "ETH Zurich",
    staticTags: ["internship", "global", "eth-zurich", "computer-science", "machine-learning", "research"],
  },
  {
    id: "cern-openlab-internship",
    name: "CERN openlab (Summer Student Programme)",
    kind: "opportunity",
    subtype: "internship",
    type: "static-opportunity",
    url: "https://openlab.web.cern.ch/cern-openlab-summer-student-programme/",
    staticTitle: "CERN openlab Summer Student Programme",
    staticSummary:
      "CERN openlab runs a summer student programme for bachelor's and master's students with strong computing profiles, covering advanced projects in computer science, software, data-intensive systems, and large-scale research infrastructure.",
    staticOrganization: "CERN",
    staticTags: ["internship", "global", "cern", "computer-science", "software", "research"],
  },
  {
    id: "kaust-vsrp",
    name: "KAUST (Visiting Student Research Program)",
    kind: "opportunity",
    subtype: "internship",
    type: "static-opportunity",
    url: "https://admissions.kaust.edu.sa/study/internships",
    staticTitle: "KAUST Visiting Student Research Program (VSRP)",
    staticSummary:
      "KAUST offers flexible research internships for bachelor's and master's students, with projects spanning computer science, AI, machine learning, data science, robotics, and computational research.",
    staticOrganization: "KAUST",
    staticTags: ["internship", "global", "kaust", "artificial-intelligence", "data-science", "computer-science"],
  },
  {
    id: "ista-scientific-internships",
    name: "ISTA (Scientific Internships)",
    kind: "opportunity",
    subtype: "internship",
    type: "static-opportunity",
    url: "https://phd.ista.ac.at/scientific-internships/",
    staticTitle: "Scientific Internships - Institute of Science and Technology Austria",
    staticSummary:
      "ISTA offers year-round scientific internships for bachelor's and master's students in computer science, mathematics, and related disciplines, with direct contact to research groups and flexible timing.",
    staticOrganization: "ISTA",
    staticTags: ["internship", "global", "ista", "computer-science", "mathematics", "research"],
  },
  {
    id: "microsoft-research-internships",
    name: "Microsoft Research (Internships)",
    kind: "opportunity",
    subtype: "internship",
    type: "static-opportunity",
    url: "https://www.microsoft.com/en-us/research/blog/Opportunities/internship/",
    staticTitle: "Research Internships - Microsoft Research",
    staticSummary:
      "Microsoft Research offers paid internships across global labs, with opportunities to work alongside researchers in machine learning, systems, HCI, security, programming languages, and applied AI.",
    staticOrganization: "Microsoft Research",
    staticTags: ["internship", "global", "microsoft-research", "machine-learning", "systems", "ai"],
  },
  {
    id: "findaphd-cs-feed",
    name: "FindAPhD (Computer Science Feed)",
    kind: "opportunity",
    subtype: "phd",
    type: "rss",
    url: "https://www.findaphd.com/rss/latest-phds.aspx?subject=computer-science",
  },
  {
    id: "findapostdoc-cs-feed",
    name: "FindAPostDoc (Computer Science Feed)",
    kind: "opportunity",
    subtype: "postdoc",
    type: "rss",
    url: "https://www.findapostdoc.com/rss/latest-postdocs.aspx?subject=computer-science",
  },
  {
    id: "academicpositions-research-jobs-feed",
    name: "Academic Positions (Research Jobs Feed)",
    kind: "opportunity",
    subtype: "research",
    type: "rss",
    url: "https://academicpositions.com/find-jobs.rss",
  },
  {
    id: "sciencecareers-compsci-feed",
    name: "Science Careers (Computer Science Jobs Feed)",
    kind: "opportunity",
    subtype: "research",
    type: "rss",
    url: "https://jobs.sciencecareers.org/jobsrss/?Discipline=Computer+Sciences",
  },
  {
    id: "sciencecareers-postdoc-feed",
    name: "Science Careers (Postdoc Jobs Feed)",
    kind: "opportunity",
    subtype: "postdoc",
    type: "rss",
    url: "https://jobs.sciencecareers.org/jobsrss/?Position=Postdoc",
  },
  {
    id: "sciencecareers-phd-feed",
    name: "Science Careers (PhD/Doctoral Jobs Feed)",
    kind: "opportunity",
    subtype: "phd",
    type: "rss",
    url: "https://jobs.sciencecareers.org/jobsrss/?Keywords=phd",
  },
  {
    id: "ajo-cs-feed",
    name: "AcademicJobsOnline (Computer Science)",
    kind: "opportunity",
    subtype: "research",
    type: "html",
    url: "https://academicjobsonline.org/ajo/cs",
  },
  {
    id: "ajo-postdoc-feed",
    name: "AcademicJobsOnline (Postdoc Listings)",
    kind: "opportunity",
    subtype: "postdoc",
    type: "html",
    url: "https://academicjobsonline.org/ajo?joblist-0-0-0----40-t--",
  },
];

const fetchText = async (url, { preferBrowserHeaders = false } = {}) => {
  const primaryHeaders = preferBrowserHeaders
    ? BROWSER_HEADERS
    : DEFAULT_HEADERS;

  try {
    const response = await axios.get(url, {
      timeout: REQUEST_TIMEOUT,
      headers: primaryHeaders,
    });
    return response.data;
  } catch (error) {
    const status = error?.response?.status;
    const shouldRetryWithBrowserHeaders =
      !preferBrowserHeaders && [403, 406, 429].includes(status);

    if (!shouldRetryWithBrowserHeaders) {
      throw error;
    }

    const retryResponse = await axios.get(url, {
      timeout: REQUEST_TIMEOUT,
      headers: BROWSER_HEADERS,
    });
    return retryResponse.data;
  }
};

export const harvestWikiCfp = async (source) => {
  const xml = await fetchText(source.url);
  const parser = new xml2js.Parser({ explicitArray: false, trim: true });
  const parsed = await parser.parseStringPromise(xml);

  const rawItems = parsed?.rss?.channel?.item || [];
  const items = Array.isArray(rawItems) ? rawItems : [rawItems];

  return items
    .map((item) => {
      const title = normalizeWhitespace(item.title);
      const link = normalizeWhitespace(item.link);
      const guid = normalizeWhitespace(
        item.guid?._ || item.guid || link || title,
      );
      const description = normalizeWhitespace(item.description);
      const parsedDescription = parseWikiDescription(description);

      return {
        externalId: guid,
        kind: "conference",
        subtype: "conference",
        title,
        summary: parsedDescription.summary,
        location: parsedDescription.location,
        eventDate: parsedDescription.eventDate,
        deadline: null,
        organization: null,
        url: link,
        sourceId: source.id,
        sourceName: source.name,
        sourceUrl: source.url,
        tags: ["computer-science", "conference", "cfp"],
      };
    })
    .filter(
      (item) =>
        item.title &&
        item.url &&
        isComputerScienceRelevant(item.title + " " + item.summary),
    );
};

export const harvestGenericRss = async (source) => {
  const xml = await fetchText(source.url);
  const parser = new xml2js.Parser({ explicitArray: false, trim: true });
  const parsed = await parser.parseStringPromise(xml);

  const rawItems = parsed?.rss?.channel?.item || [];
  const items = Array.isArray(rawItems) ? rawItems : [rawItems];

  return items
    .map((item) => {
      const title = normalizeWhitespace(item.title);
      const link = normalizeWhitespace(item.link);
      const guid = normalizeWhitespace(
        item.guid?._ || item.guid || link || title,
      );
      const description = normalizeWhitespace(
        stripHtml(item.description || item["content:encoded"] || ""),
      );
      const dateRaw = normalizeWhitespace(
        item.pubDate || item.published || null,
      );

      const summaryCorpus = `${title} ${description}`;
      const isBookChapterListing =
        /(book\s+chapter|book\s+chapters|call\s+for\s+chapters?)/i.test(
          summaryCorpus,
        );
      if (
        source.kind !== "journal" &&
        !isComputerScienceRelevant(summaryCorpus) &&
        !isBookChapterListing
      ) {
        return null;
      }

      return {
        externalId: guid,
        kind: source.kind,
        subtype: source.subtype || source.kind,
        title,
        summary: description.slice(0, 420),
        location: isIndiaRelevant(summaryCorpus) ? "India" : null,
        eventDate: dateRaw || null,
        deadline: null,
        organization: source.name,
        url: link,
        sourceId: source.id,
        sourceName: source.name,
        sourceUrl: source.url,
        tags: [
          "computer-science",
          source.kind,
          source.subtype || source.kind,
          source.indiaFocused ? "india" : "global",
        ],
      };
    })
    .filter((item) => item && item.title && item.url);
};

export const harvestArxivAtom = async (source) => {
  const xml = await fetchText(source.url);
  const parser = new xml2js.Parser({ explicitArray: false, trim: true });
  const parsed = await parser.parseStringPromise(xml);

  const rawEntries = parsed?.feed?.entry || [];
  const entries = Array.isArray(rawEntries) ? rawEntries : [rawEntries];

  return entries
    .map((entry) => {
      const title = normalizeWhitespace(entry.title);
      const summary = normalizeWhitespace(stripHtml(entry.summary || ""));
      const id = normalizeWhitespace(entry.id || `${source.id}:${title}`);
      const published = normalizeWhitespace(
        entry.published || entry.updated || null,
      );

      let url = null;
      const links = entry.link
        ? Array.isArray(entry.link)
          ? entry.link
          : [entry.link]
        : [];
      const htmlLink =
        links.find((link) => link?.$?.type === "text/html") || links[0];
      if (htmlLink?.$?.href) {
        url = normalizeWhitespace(htmlLink.$.href);
      }

      if (!title || !url) return null;

      return {
        externalId: id,
        kind: source.kind,
        subtype: source.subtype || "preprint",
        title,
        summary: summary.slice(0, 420),
        location: null,
        eventDate: published,
        deadline: null,
        organization: source.name,
        url,
        sourceId: source.id,
        sourceName: source.name,
        sourceUrl: source.url,
        tags: ["computer-science", "journal", "preprint"],
      };
    })
    .filter((item) => item && item.title && item.url);
};

export const harvestResearchComJournals = async (source) => {
  const html = await fetchText(source.url);
  const $ = cheerio.load(html);
  const journals = [];

  $('a[href^="https://research.com/journal/"]').each((_, anchor) => {
    const title = normalizeWhitespace($(anchor).text());
    const url = normalizeWhitespace($(anchor).attr("href"));
    if (!title || !url) return;

    journals.push({
      externalId: `${source.id}:${title.toLowerCase()}`,
      kind: "journal",
      subtype: "journal",
      title,
      summary: "Computer Science journal ranking entry.",
      location: null,
      eventDate: null,
      deadline: null,
      organization: "Research.com",
      url,
      sourceId: source.id,
      sourceName: source.name,
      sourceUrl: source.url,
      tags: ["computer-science", "journal", "ranking"],
    });
  });

  return journals.filter((item, index, arr) => {
    const firstIndex = arr.findIndex(
      (candidate) => candidate.title.toLowerCase() === item.title.toLowerCase(),
    );
    return firstIndex === index;
  });
};

const uniqueByUrl = (items) =>
  items.filter((item, index, arr) => {
    const firstIndex = arr.findIndex((candidate) => candidate.url === item.url);
    return firstIndex === index;
  });

const harvestConferenceLinksByPatterns = async (
  source,
  {
    hrefPattern,
    titleMustIncludePattern = /(conference|symposium|summit|workshop|forum)/i,
  },
) => {
  const html = await fetchText(source.url);
  const $ = cheerio.load(html);
  const opportunities = [];

  $("a[href]").each((_, anchor) => {
    const title = normalizeWhitespace($(anchor).text());
    const href = normalizeWhitespace($(anchor).attr("href"));
    const url = resolveAbsoluteUrl(source.url, href);

    if (!title || !url) return;
    if (!hrefPattern.test(url)) return;

    const contextText = normalizeWhitespace(
      $(anchor).closest("li, tr, article, div").text() ||
        $(anchor).parent().text(),
    );
    const summaryCorpus = `${title} ${contextText}`;

    if (
      !titleMustIncludePattern.test(summaryCorpus) &&
      !isComputerScienceRelevant(summaryCorpus)
    ) {
      return;
    }

    const extractedDate = extractDateFromText(summaryCorpus);

    opportunities.push({
      externalId: `${source.id}:${url}`,
      kind: source.kind,
      subtype: source.subtype || "conference",
      title,
      summary: contextText.slice(0, 420),
      location: isIndiaRelevant(summaryCorpus) ? "India" : null,
      eventDate: extractedDate.iso,
      deadline: extractedDate.raw,
      organization: source.name,
      url,
      sourceId: source.id,
      sourceName: source.name,
      sourceUrl: source.url,
      tags: ["computer-science", source.kind, source.subtype || source.kind],
    });
  });

  return uniqueByUrl(opportunities);
};

export const harvestAllConferenceAlert = async (source) =>
  harvestConferenceLinksByPatterns(source, {
    hrefPattern: /allconferencealert\.com\//i,
  });

export const harvestConferenceIndex = async (source) =>
  harvestConferenceLinksByPatterns(source, {
    hrefPattern: /conferenceindex\.org\/event\//i,
    titleMustIncludePattern: /(conference|workshop|symposium|summit)/i,
  });

export const harvestCall4Paper = async (source) => {
  const html = await fetchText(source.url);
  const $ = cheerio.load(html);
  const opportunities = [];

  const detailPath = source.id.includes("journals")
    ? "/cfp/detail/journal/"
    : "/cfp/detail/event/";

  $("a[href]").each((_, anchor) => {
    const title = normalizeWhitespace($(anchor).text());
    const href = normalizeWhitespace($(anchor).attr("href"));
    const url = resolveAbsoluteUrl(source.url, href);
    if (!title || !url) return;
    if (!url.includes(detailPath)) return;

    const contextText = normalizeWhitespace(
      $(anchor).closest("li, tr, article, div").text() ||
        $(anchor).parent().text(),
    );
    const summaryCorpus = `${title} ${contextText}`;
    if (!isComputerScienceRelevant(summaryCorpus)) return;

    const extractedDate = extractDateFromText(summaryCorpus);

    opportunities.push({
      externalId: `${source.id}:${url}`,
      kind: source.kind,
      subtype: source.subtype || source.kind,
      title,
      summary: contextText.slice(0, 420),
      location: isIndiaRelevant(summaryCorpus) ? "India" : null,
      eventDate: extractedDate.iso,
      deadline: extractedDate.raw,
      organization: "Call4Paper",
      url,
      sourceId: source.id,
      sourceName: source.name,
      sourceUrl: source.url,
      tags: ["computer-science", source.kind, source.subtype || source.kind],
    });
  });

  return uniqueByUrl(opportunities);
};

export const harvestIndiaProjectCalls = async (source) => {
  const opportunities = [];

  const pushSeedItem = (title, url, summary, publishedDate, deadlineDate) => {
    const normalizedTitle = normalizeWhitespace(title);
    const normalizedUrl = normalizeWhitespace(url);
    const normalizedSummary = normalizeWhitespace(summary);
    if (!normalizedTitle || !normalizedUrl) return;

    const deadlineExtract = extractDateFromText(
      deadlineDate || normalizedSummary,
    );
    const publishExtract = extractDateFromText(
      publishedDate || normalizedSummary,
    );
    const eventIso = deadlineExtract.iso || publishExtract.iso;
    const deadlineRaw = deadlineExtract.raw || null;

    opportunities.push({
      externalId: `${source.id}:${normalizedUrl}`,
      kind: "opportunity",
      subtype: "project-call",
      title: normalizedTitle,
      summary: normalizedSummary.slice(0, 420),
      location: "India",
      eventDate: eventIso,
      deadline: deadlineRaw,
      organization: source.name,
      url: normalizedUrl,
      sourceId: source.id,
      sourceName: source.name,
      sourceUrl: source.url,
      tags: ["opportunity", "project-call", "india", "research"],
    });
  };

  const emitItem = (title, url, summary, publishedDate, deadlineDate) => {
    const corpus = `${normalizeWhitespace(title)} ${normalizeWhitespace(summary)}`;
    if (!isResearchFundingRelevant(corpus)) return;
    pushSeedItem(title, url, summary, publishedDate, deadlineDate);
  };

  if (source.staticTitle && source.staticUrl) {
    pushSeedItem(
      source.staticTitle,
      source.staticUrl,
      source.staticSummary || source.staticTitle,
      source.staticPublishedDate || null,
      source.staticDeadlineDate || null,
    );
  }

  let $ = cheerio.load("");
  try {
    const html = await fetchText(source.url);
    $ = cheerio.load(html);
  } catch (error) {
    if (opportunities.length > 0) {
      return uniqueByUrl(opportunities);
    }
    throw error;
  }

  if (source.id === "dst-project-calls") {
    $("table tr").each((_, row) => {
      const cells = $(row).find("td");
      if (cells.length < 3) return;

      const linkEl = $(row).find("a[href]").first();
      const title = normalizeWhitespace($(cells[0]).text());
      const href = normalizeWhitespace(linkEl.attr("href"));
      const url = resolveAbsoluteUrl(source.url, href || source.url);
      const openDate = normalizeWhitespace($(cells[cells.length - 2]).text());
      const closeDate = normalizeWhitespace($(cells[cells.length - 1]).text());
      const summary = `${title}. Open: ${openDate}. Close: ${closeDate}.`;

      emitItem(title, url, summary, openDate, closeDate);
    });

    return uniqueByUrl(opportunities);
  }

  if (
    source.id === "isro-project-calls" ||
    source.id === "drdo-project-calls" ||
    source.id === "nirf-project-calls"
  ) {
    const pageTitle =
      normalizeWhitespace($("h1").first().text()) ||
      normalizeWhitespace($("h2").first().text()) ||
      source.name;
    const pageText = normalizeWhitespace(
      $("main").text() || $("article").text() || $("body").text(),
    );

    if (pageTitle && pageText) {
      const summary = pageText.slice(0, 900);
      if (source.id === "nirf-project-calls") {
        pushSeedItem(pageTitle, source.url, summary, summary, summary);
      } else {
        emitItem(pageTitle, source.url, summary, summary, summary);
      }
    }
  }

  $("a[href]").each((_, anchor) => {
    const title = normalizeWhitespace($(anchor).text());
    const href = normalizeWhitespace($(anchor).attr("href"));
    const url = resolveAbsoluteUrl(source.url, href);
    if (!title || !url) return;

    const contextText = normalizeWhitespace(
      $(anchor).closest("li, tr, article, div, p").text() ||
        $(anchor).parent().text(),
    );
    emitItem(title, url, contextText, contextText, contextText);
  });

  return uniqueByUrl(opportunities);
};

const classifyOpportunitySubtype = (sourceSubtype, title) => {
  const normalizedTitle = (title || "").toLowerCase();
  if (
    normalizedTitle.includes("book chapter") ||
    normalizedTitle.includes("book chapters") ||
    normalizedTitle.includes("call for chapters")
  ) {
    return "book-chapter";
  }
  if (sourceSubtype) return sourceSubtype;
  if (normalizedTitle.includes("phd")) return "phd";
  if (normalizedTitle.includes("postdoc")) return "postdoc";
  return "research";
};

export const harvestJobsAcUk = async (source) => {
  const html = await fetchText(source.url);
  const $ = cheerio.load(html);
  const opportunities = [];

  $('a[href*="/job/"]').each((_, anchor) => {
    const title = normalizeWhitespace($(anchor).text());
    const rawHref = normalizeWhitespace($(anchor).attr("href"));
    const url = toAbsoluteUrl(rawHref);
    if (!title || !url) return;

    const blockText = normalizeWhitespace($(anchor).parent().text());
    if (!isComputerScienceRelevant(`${title} ${blockText}`)) return;

    const locationMatch = blockText.match(/Location:\s*([^\n]+?)\s+Salary:/i);
    const deadlineMatch = blockText.match(
      /(?:Closes|Expires)\s*([\d]{1,2}\s+[A-Za-z]{3}|[\d]{1,2}\s+[A-Za-z]+)/i,
    );
    const datePlacedMatch = blockText.match(
      /Date Placed:\s*([\d]{1,2}\s+[A-Za-z]{3,9})/i,
    );
    const postedAt = parseDayMonthToIso(datePlacedMatch?.[1] || "");

    opportunities.push({
      externalId: `${source.id}:${url}`,
      kind: "opportunity",
      subtype: classifyOpportunitySubtype(source.subtype, title),
      title,
      summary: blockText.slice(0, 320),
      location: normalizeWhitespace(locationMatch?.[1] || null),
      eventDate: postedAt,
      deadline: normalizeWhitespace(deadlineMatch?.[1] || null),
      organization: null,
      url,
      sourceId: source.id,
      sourceName: source.name,
      sourceUrl: source.url,
      tags: ["computer-science", "opportunity", source.subtype || "research"],
    });
  });

  return opportunities.filter((item, index, arr) => {
    const firstIndex = arr.findIndex((candidate) => candidate.url === item.url);
    return firstIndex === index;
  });
};

export const harvestAcademicJobsOnline = async (source) => {
  const html = await fetchText(source.url);
  const $ = cheerio.load(html);
  const opportunities = [];

  $('a[href*="/ajo/jobs/"]').each((_, anchor) => {
    const title = normalizeWhitespace($(anchor).text());
    const rawHref = normalizeWhitespace($(anchor).attr("href"));
    const url = rawHref.startsWith("http")
      ? rawHref
      : `https://academicjobsonline.org${rawHref.startsWith("/") ? "" : "/"}${rawHref}`;

    if (!title || !url) return;

    const blockText = normalizeWhitespace(
      $(anchor).closest("li, p, div").text(),
    );
    const summaryCorpus = `${title} ${blockText}`;
    if (!isComputerScienceRelevant(summaryCorpus)) return;

    opportunities.push({
      externalId: `${source.id}:${url}`,
      kind: "opportunity",
      subtype: classifyOpportunitySubtype(source.subtype, title),
      title,
      summary: blockText.slice(0, 320) || "AcademicJobsOnline listing.",
      location: isIndiaRelevant(summaryCorpus) ? "India" : null,
      eventDate: null,
      deadline: null,
      organization: "AcademicJobsOnline",
      url,
      sourceId: source.id,
      sourceName: source.name,
      sourceUrl: source.url,
      tags: ["computer-science", "opportunity", source.subtype || "research"],
    });
  });

  return opportunities.filter((item, index, arr) => {
    const firstIndex = arr.findIndex((candidate) => candidate.url === item.url);
    return firstIndex === index;
  });
};

export const harvestIgiBookChapters = async (source) => {
  const response = await axios.get(source.url, {
    timeout: REQUEST_TIMEOUT,
    headers: {
      ...DEFAULT_HEADERS,
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
      Referer: "https://www.igi-global.com/",
      "Accept-Language": "en-US,en;q=0.9",
    },
  });
  const html = response.data;
  const $ = cheerio.load(html);
  const opportunities = [];

  $('a[href*="/publish/call-for-papers/call-details/"]').each((_, anchor) => {
    const title = normalizeWhitespace($(anchor).text());
    const rawHref = normalizeWhitespace($(anchor).attr("href"));
    const url = rawHref.startsWith("http")
      ? rawHref
      : `https://www.igi-global.com${rawHref.startsWith("/") ? "" : "/"}${rawHref}`;

    if (!title || !url) return;

    const containerText = normalizeWhitespace(
      $(anchor).closest("li, tr, article, div").text() ||
        $(anchor).parent().text(),
    );
    const summaryCorpus = `${title} ${containerText}`;

    const deadlineMatch = summaryCorpus.match(
      /Proposal\s+Submission\s+Deadline:\s*([A-Za-z]+\s+\d{1,2},\s*\d{4})/i,
    );
    const deadlineRaw = normalizeWhitespace(deadlineMatch?.[1] || null);
    const deadlineIso = parseNaturalDateToIso(deadlineRaw);

    opportunities.push({
      externalId: `${source.id}:${url}`,
      kind: "opportunity",
      subtype: "book-chapter",
      title,
      summary: containerText.slice(0, 420) || "IGI Global call for chapters.",
      location: null,
      eventDate: deadlineIso,
      deadline: deadlineRaw,
      organization: "IGI Global",
      url,
      sourceId: source.id,
      sourceName: source.name,
      sourceUrl: source.url,
      tags: ["computer-science", "opportunity", "book-chapter", "global"],
    });
  });

  return opportunities.filter((item, index, arr) => {
    const firstIndex = arr.findIndex((candidate) => candidate.url === item.url);
    return firstIndex === index;
  });
};

export const harvestInformsBookChapters = async (source) => {
  const html = await fetchText(source.url);
  const $ = cheerio.load(html);

  $("script, style, noscript, iframe").remove();

  const heading = normalizeWhitespace(
    $(
      'h1:contains("Call for Book Chapters"), h2:contains("Call for Book Chapters")',
    )
      .first()
      .text(),
  );
  const title = heading || "Call for Book Chapters";

  const bodyText = normalizeWhitespace($("body").text());
  const cleanedText = normalizeWhitespace(bodyText.replace(/<[^>]+>/g, " "));
  const markerIndex = cleanedText
    .toLowerCase()
    .indexOf("call for book chapters");
  const summaryStart = markerIndex >= 0 ? markerIndex : 0;
  const summary =
    cleanedText.slice(summaryStart, summaryStart + 420) ||
    "INFORMS community call for book chapters and contributor details.";

  const deadlineMatch =
    cleanedText.match(
      /([A-Za-z]+\s+\d{1,2},\s*\d{4})\s*:\s*Proposal\s+submission\s+deadline/i,
    ) ||
    cleanedText.match(
      /Proposal\s+submission\s+deadline\s*[:\-]?\s*([A-Za-z]+\s+\d{1,2},\s*\d{4})/i,
    ) ||
    cleanedText.match(/deadline\s*[:\-]?\s*([A-Za-z]+\s+\d{1,2},\s*\d{4})/i);
  const deadlineRaw = normalizeWhitespace(
    deadlineMatch?.[1] || deadlineMatch?.[0] || null,
  )
    .replace(/:\s*proposal\s+submission\s+deadline/i, "")
    .trim();
  const deadlineIso = parseNaturalDateToIso(deadlineRaw);

  return [
    {
      externalId: `${source.id}:${source.url}`,
      kind: "opportunity",
      subtype: "book-chapter",
      title,
      summary,
      location: null,
      eventDate: deadlineIso,
      deadline: deadlineRaw,
      organization: "INFORMS Connect",
      url: source.url,
      sourceId: source.id,
      sourceName: source.name,
      sourceUrl: source.url,
      tags: ["computer-science", "opportunity", "book-chapter", "global"],
    },
  ];
};

export const harvestKyBookChapters = async (source) => {
  const html = await fetchText(source.url);
  const $ = cheerio.load(html);

  const pageTitle = normalizeWhitespace(
    $("h1, h2, h3, title")
      .filter((_, el) =>
        /call for book chapters|submission open/i.test($(el).text()),
      )
      .first()
      .text(),
  );

  const summaryText = normalizeWhitespace($("body").text());

  return [
    {
      externalId: `${source.id}:${source.url}`,
      kind: "opportunity",
      subtype: "book-chapter",
      title:
        pageTitle || "KY Publications: Call for Book Chapters Submission Open",
      summary:
        summaryText.slice(0, 420) ||
        "Submission open for book chapters/articles with KY Publications.",
      location: "India",
      eventDate: null,
      deadline: null,
      organization: "KY Publications",
      url: source.url,
      sourceId: source.id,
      sourceName: source.name,
      sourceUrl: source.url,
      tags: ["computer-science", "opportunity", "book-chapter", "india"],
    },
  ];
};

export const harvestStaticBookChapter = async (source) => {
  const deadlineIso = parseNaturalDateToIso(source.staticDeadlineDate || null);
  const publishedIso = parseNaturalDateToIso(source.staticPublishedDate || null);

  return [
    {
      externalId: `${source.id}:${source.url}`,
      kind: "opportunity",
      subtype: "book-chapter",
      title: source.staticTitle || source.name,
      summary:
        source.staticSummary ||
        "Open access book chapter opportunity from a curated academic source.",
      location: null,
      eventDate: deadlineIso || publishedIso,
      deadline: source.staticDeadlineDate || null,
      organization: source.staticOrganization || source.name,
      url: source.url,
      sourceId: source.id,
      sourceName: source.name,
      sourceUrl: source.url,
      tags: source.staticTags || [
        "computer-science",
        "opportunity",
        "book-chapter",
      ],
    },
  ];
};

export const harvestStaticOpportunity = async (source) => {
  const deadlineIso = parseNaturalDateToIso(source.staticDeadlineDate || null);
  const publishedIso = parseNaturalDateToIso(source.staticPublishedDate || null);

  return [
    {
      externalId: `${source.id}:${source.url}`,
      kind: "opportunity",
      subtype: source.subtype || "research",
      title: source.staticTitle || source.name,
      summary:
        source.staticSummary ||
        "Curated official opportunity source.",
      location: source.indiaFocused ? "India" : null,
      eventDate: deadlineIso || publishedIso || null,
      deadline: source.staticDeadlineDate || null,
      organization: source.staticOrganization || source.name,
      url: source.url,
      sourceId: source.id,
      sourceName: source.name,
      sourceUrl: source.url,
      tags: source.staticTags || [
        "computer-science",
        "opportunity",
        source.subtype || "research",
      ],
    },
  ];
};

export const runSourceHarvester = async (source) => {
  if (source.id === "wikicfp-cs") {
    return harvestWikiCfp(source);
  }

  if (source.id.startsWith("wikicfp-")) {
    return harvestWikiCfp(source);
  }

  if (source.type === "atom") {
    return harvestArxivAtom(source);
  }

  if (source.type === "rss") {
    return harvestGenericRss(source);
  }

  if (source.id === "researchcom-cs-journals") {
    return harvestResearchComJournals(source);
  }

  if (source.id === "allconferencealert-cs") {
    return harvestAllConferenceAlert(source);
  }

  if (source.id === "conferenceindex-cs") {
    return harvestConferenceIndex(source);
  }

  if (source.id.startsWith("call4paper-")) {
    return harvestCall4Paper(source);
  }

  if (
    source.id === "dst-project-calls" ||
    source.id === "anrf-project-calls" ||
    source.id === "icssr-fellowships-calls" ||
    source.id === "meity-project-calls" ||
    source.id === "csir-project-calls" ||
    source.id === "isro-project-calls" ||
    source.id === "drdo-project-calls" ||
    source.id === "nirf-project-calls" ||
    source.id === "aicte-fellowships-calls"
  ) {
    return harvestIndiaProjectCalls(source);
  }

  if (source.id.startsWith("jobsacuk-")) {
    return harvestJobsAcUk(source);
  }

  if (source.id.startsWith("ajo-")) {
    return harvestAcademicJobsOnline(source);
  }

  if (source.id === "bookchapter-igi-search") {
    return harvestIgiBookChapters(source);
  }

  if (source.id.startsWith("bookchapter-informs-")) {
    return harvestInformsBookChapters(source);
  }

  if (source.id === "bookchapter-ky-publications") {
    return harvestKyBookChapters(source);
  }

  if (source.type === "static-book-chapter") {
    return harvestStaticBookChapter(source);
  }

  if (source.type === "static-opportunity") {
    return harvestStaticOpportunity(source);
  }

  return [];
};
