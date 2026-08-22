export type SearchItem = {
  href: string;
  type: "도구" | "가이드" | "자료";
  title: string;
  description: string;
  keywords: string[];
};

export type SiteSearchIntent = "default" | "resume" | "resume-pro-direct";

const resumeIntentAliases = new Set([
  "이력서",
  "resume",
  "cv",
  "star예시",
  "selectioncriteria",
  "coverletter",
  "호주취업이력서",
]);

const resumeDiscoveryPriority = new Map([
  ["/resume-builder", 3],
  ["/resources/english-resume-achievement-examples", 2],
  ["/resume-pro", 1],
]);

export const normalizeSiteSearchText = (value: string) => value
  .toLocaleLowerCase("ko-KR")
  .replace(/\s+/g, "")
  .replace(/[·/–—-]/g, "");

export function getSiteSearchIntent(query: string): SiteSearchIntent {
  const normalized = normalizeSiteSearchText(query.trim());
  if (normalized === "resumepro") return "resume-pro-direct";
  return resumeIntentAliases.has(normalized) ? "resume" : "default";
}

function textRelevance(item: SearchItem, normalizedQuery: string) {
  if (normalizeSiteSearchText(item.title).includes(normalizedQuery)) return 3;
  if (item.keywords.some((keyword) => normalizeSiteSearchText(keyword).includes(normalizedQuery))) return 2;
  return 1;
}

export function rankSiteSearchItems(items: SearchItem[], query: string) {
  const normalizedQuery = normalizeSiteSearchText(query.trim());
  if (!normalizedQuery) return items;

  const intent = getSiteSearchIntent(query);
  const indexed = items.map((item, index) => ({ item, index }));
  const paid = (item: SearchItem) => item.href === "/pro" || item.href.includes("-pro");
  const searchable = (item: SearchItem) => normalizeSiteSearchText([item.title, item.description, ...item.keywords].join(" "));

  return indexed
    .filter(({ item }) => searchable(item).includes(normalizedQuery) || (intent === "resume" && resumeDiscoveryPriority.has(item.href)))
    .sort((left, right) => {
      const priority = (entry: typeof left) => {
        if (intent === "resume-pro-direct" && entry.item.href === "/resume-pro") return 10_000;
        if (intent === "resume") {
          const discoveryPriority = resumeDiscoveryPriority.get(entry.item.href);
          if (discoveryPriority) return 5_000 + discoveryPriority;
        }
        return textRelevance(entry.item, normalizedQuery) * 10 - Number(paid(entry.item)) * 2;
      };

      return priority(right) - priority(left)
        || left.index - right.index
        || left.item.href.localeCompare(right.item.href, "ko-KR");
    })
    .map(({ item }) => item);
}
