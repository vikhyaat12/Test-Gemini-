import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";

const DATA_DIR = join(process.cwd(), "data");
const DB_FILE = join(DATA_DIR, "local-db.json");

export interface LocalDbSchema {
  users?: Array<Record<string, unknown>>;
  products?: Array<Record<string, unknown>>;
  blogPosts?: Array<Record<string, unknown>>;
  employees?: Array<Record<string, unknown>>;
  coupons?: Array<Record<string, unknown>>;
  b2bApplications?: Array<Record<string, unknown>>;
  affiliates?: Array<Record<string, unknown>>;
  affiliateLinks?: Array<Record<string, unknown>>;
  affiliateClicks?: Array<Record<string, unknown>>;
  affiliateCommissions?: Array<Record<string, unknown>>;
  affiliateWithdrawals?: Array<Record<string, unknown>>;
  orders?: Array<Record<string, unknown>>;
  homepageSections?: Array<Record<string, unknown>>;
  settings?: Array<Record<string, unknown>>;
  banners?: Array<Record<string, unknown>>;
  faqs?: Array<Record<string, unknown>>;
  testimonials?: Array<Record<string, unknown>>;
  media?: Array<Record<string, unknown>>;
  doctors?: Array<Record<string, unknown>>;
}

let cachedData: LocalDbSchema | null = null;

export const fileDb = {
  get(): LocalDbSchema {
    if (cachedData) return cachedData;
    try {
      if (!existsSync(DATA_DIR)) {
        mkdirSync(DATA_DIR, { recursive: true });
      }
      if (existsSync(DB_FILE)) {
        const raw = readFileSync(DB_FILE, "utf-8");
        cachedData = JSON.parse(raw);
        return cachedData || {};
      }
    } catch {
      // ignore
    }
    cachedData = {};
    return cachedData;
  },

  save(partial: Partial<LocalDbSchema>) {
    const current = this.get();
    cachedData = { ...current, ...partial };
    try {
      if (!existsSync(DATA_DIR)) {
        mkdirSync(DATA_DIR, { recursive: true });
      }
      writeFileSync(DB_FILE, JSON.stringify(cachedData, null, 2), "utf-8");
    } catch {
      // ignore
    }
  },
};
