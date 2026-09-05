import { canonicalArticleHref } from "./articleAliases.mjs";
import { readLocalRecord, validIsoTimestamp, LOCAL_RECORD_UPDATED_EVENT } from "@/lib/localRecordState";

export const ARTICLE_READ_HISTORY_KEY = "aussie-compass-read-articles-v1";
export const ARTICLE_READING_UPDATED_EVENT = "hoju-compass:reading-updated";
export const WEEKLY_READING_GOAL_KEY = "hoju-compass-weekly-reading-goal-v1";

export type WeeklyReadingTarget = 1 | 3 | 5;

export type ReadArticleRecord = {
  href: string;
  title: string;
  completedAt: string;
};

export function parseArticleHistory(raw: string): ReadArticleRecord[] | null {
  try {
    const data: unknown = JSON.parse(raw);
    if (!Array.isArray(data)) return null;
    const records = new Map<string, ReadArticleRecord>();
    for (const entry of data) {
      if (!entry || typeof entry !== "object" || Array.isArray(entry) || typeof entry.href !== "string" || !/^\/resources\/[a-z0-9]+(?:-[a-z0-9]+)*$/.test(entry.href)
        || typeof entry.title !== "string" || !entry.title.trim() || !validIsoTimestamp(entry.completedAt)) return null;
      const href = canonicalArticleHref(entry.href), previous = records.get(href);
      const time = Date.parse(entry.completedAt), previousTime = previous ? Date.parse(previous.completedAt) : 0, now = Date.now();
      // Prefer the latest observed past visit, independent of array order. A
      // future duplicate must never hide a valid earlier observation.
      if (!previous || (time <= now ? previousTime > now || time > previousTime : previousTime > now && time < previousTime)) records.set(href, { href, title: entry.title, completedAt: entry.completedAt });
    }
    return [...records.values()].sort((a, b) => Date.parse(b.completedAt) - Date.parse(a.completedAt));
  } catch { return null; }
}
export const readArticleHistoryState = () => readLocalRecord(ARTICLE_READ_HISTORY_KEY, parseArticleHistory);
/** Compatibility reader for read-only directory badges; writers use the stateful reader. */
export function readArticleHistory(): ReadArticleRecord[] { const result = readArticleHistoryState(); return result.status === "valid" ? result.value : []; }

export function markArticleAsRead(article: { href: string; title: string }, now = new Date()) {
  const current = readArticleHistoryState();
  if (current.status === "invalid" || current.status === "unavailable") return current;
  const entry = { ...article, href: canonicalArticleHref(article.href), completedAt: now.toISOString() };
  if (!parseArticleHistory(JSON.stringify([entry]))) return { status: "invalid" as const, raw: current.raw };
  const records = current.status === "valid" ? current.value : [];
  if (records.some(record => record.href === entry.href && record.completedAt <= entry.completedAt)) return { status: "saved" as const, value: records };
  const next = [entry, ...records.filter(record => record.href !== entry.href)];
  try { localStorage.setItem(ARTICLE_READ_HISTORY_KEY, JSON.stringify(next)); }
  catch { return { status: "failed" as const, raw: current.raw }; }
  window.dispatchEvent(new Event(ARTICLE_READING_UPDATED_EVENT));
  window.dispatchEvent(new Event(LOCAL_RECORD_UPDATED_EVENT));
  return { status: "saved" as const, value: next };
}

export function parseWeeklyReadingGoal(raw: string): WeeklyReadingTarget | null {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;
    const value = parsed as Record<string, unknown>;
    return (value.target === 1 || value.target === 3 || value.target === 5) && (value.updatedAt === undefined || validIsoTimestamp(value.updatedAt)) ? value.target : null;
  } catch { return null; }
}
export const readWeeklyReadingGoalState = () => readLocalRecord(WEEKLY_READING_GOAL_KEY, parseWeeklyReadingGoal);
export function readWeeklyReadingGoal(): WeeklyReadingTarget { const result = readWeeklyReadingGoalState(); return result.status === "valid" ? result.value : 3; }
export function saveWeeklyReadingGoal(target: WeeklyReadingTarget, replaceInvalid = false) {
  const current = readWeeklyReadingGoalState();
  if ((current.status === "invalid" || current.status === "unavailable") && !replaceInvalid) return current;
  if (![1, 3, 5].includes(target)) return { status: "invalid" as const, raw: current.raw };
  try { localStorage.setItem(WEEKLY_READING_GOAL_KEY, JSON.stringify({ target, updatedAt: new Date().toISOString() })); }
  catch { return { status: "failed" as const, raw: current.raw }; }
  window.dispatchEvent(new Event(ARTICLE_READING_UPDATED_EVENT));
  window.dispatchEvent(new Event(LOCAL_RECORD_UPDATED_EVENT));
  return { status: "saved" as const, value: target };
}
export function readingThisWeek(records: ReadArticleRecord[], now = new Date()) {
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (now.getDay() + 6) % 7).getTime();
  return new Set(records.filter(r => { const time = Date.parse(r.completedAt); return validIsoTimestamp(r.completedAt) && time >= start && time <= now.getTime(); }).map(r => canonicalArticleHref(r.href))).size;
}
