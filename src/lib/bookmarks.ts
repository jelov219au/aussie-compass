import { safeInternalNavigationPath } from "@/lib/safeNavigation";
import { canonicalArticleHref } from "./articleAliases.mjs";
import { readLocalRecord, validIsoTimestamp, LOCAL_RECORD_UPDATED_EVENT } from "@/lib/localRecordState";
export type Bookmark = { href: string; title: string; savedAt: string };
export const bookmarkKey = "aussie-compass-bookmarks-v1";
export function parseBookmarks(raw: string): Bookmark[] | null {
  try {
    const value: unknown = JSON.parse(raw);
    if (!Array.isArray(value)) return null;
    const bookmarks: Bookmark[] = [], seen = new Set<string>();
    for (const entry of value) {
      if (!entry || typeof entry !== "object" || Array.isArray(entry) || typeof entry.title !== "string" || !entry.title.trim() || !validIsoTimestamp(entry.savedAt)) return null;
      const path = safeInternalNavigationPath(entry.href);
      if (!path) return null;
      const href = canonicalArticleHref(path);
      if (!seen.has(href)) { seen.add(href); bookmarks.push({ href, title: entry.title, savedAt: entry.savedAt }); }
    }
    return bookmarks;
  } catch { return null; }
}
export const readBookmarks = () => readLocalRecord(bookmarkKey, parseBookmarks);
export function toggleSavedPage(href: string, title: string) {
  const current = readBookmarks();
  if (current.status === "invalid" || current.status === "unavailable") return current;
  const path = safeInternalNavigationPath(href);
  if (!path || !title.trim()) return { status: "invalid" as const, raw: current.raw };
  const canonical = canonicalArticleHref(path), bookmarks = current.status === "valid" ? current.value : [];
  const removed = bookmarks.some(item => item.href === canonical);
  if (!removed && bookmarks.length >= 30) return { status: "full" as const, raw: current.raw };
  const next = removed ? bookmarks.filter(item => item.href !== canonical) : [{ href: canonical, title, savedAt: new Date().toISOString() }, ...bookmarks];
  try { localStorage.setItem(bookmarkKey, JSON.stringify(next)); }
  catch { return { status: "failed" as const, raw: current.raw }; }
  window.dispatchEvent(new Event(LOCAL_RECORD_UPDATED_EVENT));
  return { status: "saved" as const, removed, value: next };
}
