import { canonicalArticleHref } from "./articleAliases.mjs";

export const ARTICLE_READ_HISTORY_KEY = "aussie-compass-read-articles-v1";
export const ARTICLE_READING_UPDATED_EVENT = "hoju-compass:reading-updated";
export const WEEKLY_READING_GOAL_KEY = "hoju-compass-weekly-reading-goal-v1";

export type WeeklyReadingTarget = 1 | 3 | 5;

export type ReadArticleRecord = {
  href: string;
  title: string;
  completedAt: string;
};

export function readArticleHistory(): ReadArticleRecord[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(ARTICLE_READ_HISTORY_KEY) ?? "[]");
    if (!Array.isArray(parsed)) return [];

    const seen = new Set<string>();
    return parsed.filter((entry): entry is ReadArticleRecord => {
      if (!entry || typeof entry !== "object") return false;
      const record = entry as Partial<ReadArticleRecord>;
      return typeof record.href === "string"
        && record.href.startsWith("/resources/")
        && typeof record.title === "string"
        && typeof record.completedAt === "string";
    }).map((record) => ({ ...record, href: canonicalArticleHref(record.href) }))
      .filter((record) => {
        if (seen.has(record.href)) return false;
        seen.add(record.href);
        return true;
      }).slice(0, 50);
  } catch {
    return [];
  }
}

export function markArticleAsRead(article: { href: string; title: string }) {
  const canonicalArticle = { ...article, href: canonicalArticleHref(article.href) };
  const current = readArticleHistory();
  if (current.some((record) => record.href === canonicalArticle.href)) return current;

  const next = [{ ...canonicalArticle, completedAt: new Date().toISOString() }, ...current].slice(0, 50);
  localStorage.setItem(ARTICLE_READ_HISTORY_KEY, JSON.stringify(next));
  window.dispatchEvent(new Event(ARTICLE_READING_UPDATED_EVENT));
  return next;
}

export function readWeeklyReadingGoal(): WeeklyReadingTarget {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(WEEKLY_READING_GOAL_KEY) ?? "null");
    if (!parsed || typeof parsed !== "object") return 3;
    const target = (parsed as { target?: unknown }).target;
    return target === 1 || target === 3 || target === 5 ? target : 3;
  } catch {
    return 3;
  }
}

export function saveWeeklyReadingGoal(target: WeeklyReadingTarget) {
  localStorage.setItem(WEEKLY_READING_GOAL_KEY, JSON.stringify({ target, updatedAt: new Date().toISOString() }));
}
