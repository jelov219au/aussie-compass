export const ARTICLE_READ_HISTORY_KEY = "aussie-compass-read-articles-v1";
export const ARTICLE_READING_UPDATED_EVENT = "hoju-compass:reading-updated";

export type ReadArticleRecord = {
  href: string;
  title: string;
  completedAt: string;
};

export function readArticleHistory(): ReadArticleRecord[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(ARTICLE_READ_HISTORY_KEY) ?? "[]");
    if (!Array.isArray(parsed)) return [];

    return parsed.filter((entry): entry is ReadArticleRecord => {
      if (!entry || typeof entry !== "object") return false;
      const record = entry as Partial<ReadArticleRecord>;
      return typeof record.href === "string"
        && record.href.startsWith("/resources/")
        && typeof record.title === "string"
        && typeof record.completedAt === "string";
    }).slice(0, 50);
  } catch {
    return [];
  }
}

export function markArticleAsRead(article: { href: string; title: string }) {
  const current = readArticleHistory();
  if (current.some((record) => record.href === article.href)) return current;

  const next = [{ ...article, completedAt: new Date().toISOString() }, ...current].slice(0, 50);
  localStorage.setItem(ARTICLE_READ_HISTORY_KEY, JSON.stringify(next));
  window.dispatchEvent(new Event(ARTICLE_READING_UPDATED_EVENT));
  return next;
}
