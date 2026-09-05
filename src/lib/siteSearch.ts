export type SearchItem = {
  href: string;
  type: "도구" | "가이드" | "자료";
  title: string;
  description: string;
  keywords: string[];
  stateLabel?: string;
  freeHref?: string;
  freeLabel?: string;
};

export type SiteSearchIntent = "default" | "resume" | "resume-pro-direct";
export type SiteSearchScenario = "pay-underpayment" | "bond-exit" | "used-car-follow-up" | "leaving-australia" | "visa-medical";

const resumeIntentAliases = new Set([
  "이력서",
  "resume",
  "cv",
  "star예시",
  "starexamples",
  "selectioncriteria",
  "coverletter",
  "커버레터",
  "이력서양식",
  "resumetemplate",
  "ats",
  "ats이력서",
  "공고맞춤",
  "이력서공고맞춤",
  "jobad",
  "jobadchecker",
  "호주취업이력서",
]);

const resumeDiscoveryPriority = new Map([
  ["/resume-builder", 5],
  ["/resources/australia-resume-template-submission-checklist", 4],
  ["/resume-job-ad-checker", 3],
  ["/resources/english-resume-achievement-examples", 2],
  ["/resume-pro", 1],
]);

const jobAdCheckerAliases = new Set(["ats", "ats이력서", "공고맞춤", "이력서공고맞춤", "jobad", "jobadchecker"]);
const jobAdCheckerDiscoveryPriority = new Map([
  ["/resume-job-ad-checker", 5],
  ["/resume-builder", 4],
  ["/resources/australia-resume-template-submission-checklist", 3],
  ["/resources/english-resume-achievement-examples", 2],
  ["/resume-pro", 1],
]);

const coverLetterDiscoveryPriority = new Map([
  ["/resume-builder", 4],
  ["/resources/australia-cover-letter-job-ad-checklist", 3],
  ["/resume-pro", 2],
  ["/resources/english-resume-achievement-examples", 1],
]);

const queryStopWords = new Set(["호주", "지금", "관련", "정보", "뭐", "해야", "해요", "하고", "싶어요", "전에", "후", "중", "대한", "어떻게", "좀", "주세요", "해주세요"]);

const scenarioPriorities = [
  { id: "pay-underpayment", matches: (query: string) => query.includes("급여") && ["적게", "차이", "미지급", "못받", "안들어"].some((term) => query.includes(term)), priorities: [["/underpayment-guide", 6], ["/pay-evidence-pro", 5], ["/payslip-guide", 4]] },
  { id: "bond-exit", matches: (query: string) => ["보증금", "bond"].some((term) => query.includes(term)) && ["못", "안", "분쟁", "반환", "돌려"].some((term) => query.includes(term)), priorities: [["/resources/australia-rental-moving-out-bond-refund-guide", 6], ["/moving-checklist", 5], ["/property-inspection-checklist", 4]] },
  { id: "used-car-follow-up", matches: (query: string) => ["중고차", "차량"].some((term) => query.includes(term)) && ["검사", "수리", "약속", "보고서", "ppsr", "비교"].some((term) => query.includes(term)), priorities: [["/resources/used-car-inspection-report-next-steps", 7], ["/used-car-comparison", 6], ["/car-purchase-pro", 5], ["/resources/used-car-ppsr-purchase-day-checklist", 4]] },
  { id: "leaving-australia", matches: (query: string) => ["떠나", "귀국", "출국"].some((term) => query.includes(term)), priorities: [["/leaving-australia-guide", 6], ["/leaving-australia-pro", 4]] },
  { id: "visa-medical", matches: (query: string) => ["비자", "visa"].some((term) => query.includes(term)) && ["신체검사", "건강검진", "hap", "예약"].some((term) => query.includes(term)), priorities: [["/visa-preparation-guide", 6]] },
] as const;

export const normalizeSiteSearchText = (value: string) => value
  .toLocaleLowerCase("ko-KR")
  .replace(/\s+/g, "")
  .replace(/[·/–—-]/g, "");

export function meaningfulSiteSearchTokens(value: string) {
  return value
    .toLocaleLowerCase("ko-KR")
    .replace(/[^\p{L}\p{N}+#.]+/gu, " ")
    .trim()
    .split(/\s+/)
    .map((token) => token.replace(/(에서|에게|으로|부터|까지|처럼|보다|하고|이랑|랑|은|는|이|가|을|를|의|도|만)$/u, ""))
    .filter((token) => token.length >= 2 && !queryStopWords.has(token));
}

function scenarioPriority(query: string) {
  const rule = scenarioPriorities.find(({ matches }) => matches(query));
  return new Map<string, number>(rule?.priorities.map(([href, priority]) => [href, priority]) ?? []);
}

export function getSiteSearchScenario(query: string): SiteSearchScenario | null {
  const normalized = normalizeSiteSearchText(query.trim());
  return scenarioPriorities.find(({ matches }) => matches(normalized))?.id ?? null;
}

export function getSiteSearchIntent(query: string): SiteSearchIntent {
  const normalized = normalizeSiteSearchText(query.trim());
  if (normalized === "resumepro") return "resume-pro-direct";
  return resumeIntentAliases.has(normalized) ? "resume" : "default";
}

function textRelevance(item: SearchItem, normalizedQuery: string, tokens: string[]) {
  if (normalizeSiteSearchText(item.title).includes(normalizedQuery)) return 3;
  if (item.keywords.some((keyword) => normalizeSiteSearchText(keyword).includes(normalizedQuery))) return 2;
  const searchable = normalizeSiteSearchText([item.title, item.description, ...item.keywords].join(" "));
  return tokens.filter((token) => searchable.includes(normalizeSiteSearchText(token))).length;
}

export function rankSiteSearchItems(items: SearchItem[], query: string) {
  const normalizedQuery = normalizeSiteSearchText(query.trim());
  if (!normalizedQuery) return items;

  const intent = getSiteSearchIntent(query);
  const tokens = meaningfulSiteSearchTokens(query);
  const situationalPriority = intent === "default" ? scenarioPriority(normalizedQuery) : new Map<string, number>();
  const discoveryPriority = normalizedQuery === "coverletter" || normalizedQuery === "커버레터"
    ? coverLetterDiscoveryPriority
    : jobAdCheckerAliases.has(normalizedQuery)
      ? jobAdCheckerDiscoveryPriority
      : resumeDiscoveryPriority;
  const indexed = items.map((item, index) => ({ item, index }));
  const paid = (item: SearchItem) => item.href === "/pro" || item.href.includes("-pro");
  const searchable = (item: SearchItem) => normalizeSiteSearchText([item.title, item.description, ...item.keywords].join(" "));
  const directMatch = (item: SearchItem) => normalizedQuery.length >= 2 && (
    normalizeSiteSearchText(item.title).includes(normalizedQuery)
    || item.keywords.some((keyword) => normalizeSiteSearchText(keyword).includes(normalizedQuery))
  );
  const tokenMatches = (item: SearchItem) => tokens.filter((token) => searchable(item).includes(normalizeSiteSearchText(token))).length;
  const minimumTokenMatches = tokens.length > 1 ? Math.min(2, tokens.length) : 1;

  return indexed
    .filter(({ item }) => situationalPriority.has(item.href) || directMatch(item) || tokenMatches(item) >= minimumTokenMatches || (intent === "resume" && discoveryPriority.has(item.href)))
    .sort((left, right) => {
      const priority = (entry: typeof left) => {
        if (intent === "resume-pro-direct" && entry.item.href === "/resume-pro") return 10_000;
        if (intent === "resume") {
          const itemPriority = discoveryPriority.get(entry.item.href);
          if (itemPriority) return 5_000 + itemPriority;
        }
        const situation = situationalPriority.get(entry.item.href);
        if (situation) return 4_000 + situation;
        return textRelevance(entry.item, normalizedQuery, tokens) * 10 - Number(paid(entry.item)) * 2;
      };

      return priority(right) - priority(left)
        || left.index - right.index
        || left.item.href.localeCompare(right.item.href, "ko-KR");
    })
    .map(({ item }) => item);
}
