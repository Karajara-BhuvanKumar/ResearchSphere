import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, "../../data");
const STORE_PATH = path.join(DATA_DIR, "harvest-cache.json");

const defaultStore = () => ({
  updatedAt: null,
  items: [],
  sourceReports: [],
});

export const getStorePath = () => STORE_PATH;

export const readStore = async () => {
  try {
    const content = await fs.readFile(STORE_PATH, "utf-8");
    const parsed = JSON.parse(content);
    return {
      ...defaultStore(),
      ...parsed,
      items: Array.isArray(parsed.items) ? parsed.items : [],
      sourceReports: Array.isArray(parsed.sourceReports)
        ? parsed.sourceReports
        : [],
    };
  } catch (error) {
    if (error.code === "ENOENT") {
      return defaultStore();
    }
    throw error;
  }
};

export const writeStore = async (data) => {
  await fs.mkdir(DATA_DIR, { recursive: true });
  const normalized = {
    ...defaultStore(),
    ...data,
    items: Array.isArray(data.items) ? data.items : [],
    sourceReports: Array.isArray(data.sourceReports) ? data.sourceReports : [],
  };

  await fs.writeFile(STORE_PATH, JSON.stringify(normalized, null, 2), "utf-8");
  return normalized;
};
