export const SEARCH_TRANSFER_MAX_LENGTH = 120;

const SEARCH_TRANSFER_SLOT = Symbol.for("hoju-compass.search.pending");

function searchMemory() {
  return globalThis as typeof globalThis & Record<PropertyKey, unknown>;
}

export function sanitizeTransferredSearch(value: string) {
  return value.trim().slice(0, SEARCH_TRANSFER_MAX_LENGTH);
}

export function setPendingSearch(value: string) {
  const sanitized = sanitizeTransferredSearch(value);
  if (sanitized) searchMemory()[SEARCH_TRANSFER_SLOT] = sanitized;
  else delete searchMemory()[SEARCH_TRANSFER_SLOT];
}

export function takePendingSearch() {
  const value = searchMemory()[SEARCH_TRANSFER_SLOT];
  delete searchMemory()[SEARCH_TRANSFER_SLOT];
  return typeof value === "string" ? value : "";
}

export type SafeSearchUrl = {
  query: string;
  malformed: boolean;
};

export function parseSafeSearchUrl(value: string, expectedOrigin: string): SafeSearchUrl {
  try {
    const url = new URL(value);
    if ((url.protocol !== "https:" && url.protocol !== "http:") || url.origin !== expectedOrigin || url.hash) {
      return { query: "", malformed: true };
    }
    const keys = [...url.searchParams.keys()];
    if (!keys.length) return { query: "", malformed: false };
    if (keys.some((key) => key !== "q") || url.searchParams.getAll("q").length !== 1) {
      return { query: "", malformed: true };
    }
    const rawQuery = url.searchParams.get("q") ?? "";
    const query = sanitizeTransferredSearch(rawQuery);
    if (!query || rawQuery.trim().length > SEARCH_TRANSFER_MAX_LENGTH) return { query: "", malformed: true };
    return { query, malformed: false };
  } catch {
    return { query: "", malformed: true };
  }
}
