import { environment } from "@raycast/api";
import fs from "fs";
import path from "path";
import { QuickLinksData, QuickLink } from "../utils/types";

const DATA_FILE = path.join(environment.supportPath, "quicklinks.json");
const TEMP_FILE = DATA_FILE + ".tmp";

const DEFAULT_DATA: QuickLinksData = {
  version: 1,
  items: [],
};

export async function loadData(): Promise<QuickLinksData> {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      return DEFAULT_DATA;
    }
    const raw = fs.readFileSync(DATA_FILE, "utf-8");
    const parsed = JSON.parse(raw) as QuickLinksData;
    if (parsed.version !== 1 || !Array.isArray(parsed.items)) {
      return DEFAULT_DATA;
    }
    return parsed;
  } catch {
    return DEFAULT_DATA;
  }
}

export async function saveData(data: QuickLinksData): Promise<void> {
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
  fs.writeFileSync(TEMP_FILE, JSON.stringify(data, null, 2), "utf-8");
  fs.renameSync(TEMP_FILE, DATA_FILE);
}

export async function exportData(): Promise<string> {
  const data = await loadData();
  return JSON.stringify(data, null, 2);
}

function validateItems(items: unknown): items is QuickLink[] {
  if (!Array.isArray(items)) return false;
  return items.every((item) => {
    if (typeof item !== "object" || item === null) return false;
    const obj = item as Record<string, unknown>;
    if (typeof obj.id !== "string" || typeof obj.name !== "string")
      return false;
    if (obj.isContainer && obj.children) {
      return validateItems(obj.children);
    }
    return true;
  });
}

export async function importData(json: string): Promise<QuickLinksData> {
  const parsed = JSON.parse(json);
  if (parsed.version !== 1 || !validateItems(parsed.items)) {
    throw new Error("Invalid quicklinks data format");
  }
  const data = parsed as QuickLinksData;
  await saveData(data);
  return data;
}
