import {
  getArticleRegion,
  getArticleTopic,
  type Article,
  type ArticleContentTypeId,
  type ArticleRegionId,
  type ArticleTopicId,
} from "@/data/articles";
import {
  getSiteSearchScenario,
  meaningfulSiteSearchTokens,
  normalizeSiteSearchText,
  type SiteSearchScenario,
} from "@/lib/siteSearch";

export type ResourceTopicFilter = "all" | ArticleTopicId;
export type ResourceRegionFilter = "all" | ArticleRegionId;

export type ResourceSearchGuide = {
  kind: "guide";
  href: string;
  title: string;
  description: string;
  category: string;
  topic: ArticleTopicId;
  region: ArticleRegionId;
  contentType: ArticleContentTypeId;
  readingTime: string;
  quickSummary: string;
  keywords: string[];
};

export type ResourceSearchResult =
  | { kind: "article"; article: Article }
  | ResourceSearchGuide;

export type ResourceSearchState = {
  topic: ResourceTopicFilter;
  region: ResourceRegionFilter;
  query: string;
};

export const resourceSearchGuides: ResourceSearchGuide[] = [
  {
    kind: "guide",
    href: "/visa-preparation-guide",
    title: "호주 비자 신청, 공식 절차를 따라 준비하세요",
    description: "ImmiAccount 요청, HAP ID, 지정 의료기관 예약과 검사 결과 제출 상태를 단계별로 확인하세요.",
    category: "비자",
    topic: "start",
    region: "australia",
    contentType: "official",
    readingTime: "무료 체크리스트",
    quickSummary: "검사 예약이 요청서 기한보다 늦을 때 알릴 내용과 예약·제출 상태를 구분해 확인해요.",
    keywords: ["비자", "visa", "신체검사", "건강검진", "medical", "health examination", "HAP ID", "예약", "검사 지연"],
  },
  {
    kind: "guide",
    href: "/leaving-australia-guide",
    title: "귀국 준비부터 Super DASP 신청까지",
    description: "호주를 떠나기 전 퇴사, 렌트, 공과금과 계정을 정리하고 출국 후 DASP 신청 순서를 확인하세요.",
    category: "저축과 생활비",
    topic: "money",
    region: "australia",
    contentType: "official",
    readingTime: "무료 체크리스트",
    quickSummary: "출국 전 준비와 출국·비자 종료 뒤 DASP 신청을 서로 다른 단계로 나눠 확인해요.",
    keywords: ["호주 떠나기", "귀국", "출국", "leaving australia", "departing australia", "DASP", "super 환급"],
  },
];

const scenarioResultPriorities: Record<SiteSearchScenario, string[]> = {
  "pay-underpayment": ["article:first-payslip-checklist-australia", "article:australia-job-ending-final-pay-dismissal-guide"],
  "bond-exit": ["article:australia-rental-moving-out-bond-refund-guide"],
  "used-car-follow-up": ["article:used-car-inspection-report-next-steps", "article:used-car-ppsr-purchase-day-checklist"],
  "visa-medical": ["guide:/visa-preparation-guide", "article:korea-working-holiday-visa-2026-fact-check"],
  "leaving-australia": ["guide:/leaving-australia-guide", "article:australia-rental-moving-out-bond-refund-guide"],
};

const exactResultPriorities = new Map<string, string>([
  ["payslip", "article:first-payslip-checklist-australia"],
  ["tfn", "article:tfn-application-after-arrival-australia"],
  ["bond", "article:australia-rental-moving-out-bond-refund-guide"],
  ["dasp", "guide:/leaving-australia-guide"],
  ["ppsr", "article:used-car-ppsr-purchase-day-checklist"],
]);

function resultKey(result: ResourceSearchResult) {
  return result.kind === "article" ? `article:${result.article.slug}` : `guide:${result.href}`;
}

function resultTopic(result: ResourceSearchResult) {
  return result.kind === "article" ? getArticleTopic(result.article.category) : result.topic;
}

function resultRegion(result: ResourceSearchResult) {
  return result.kind === "article" ? getArticleRegion(result.article) : result.region;
}

function resultSearchParts(result: ResourceSearchResult) {
  if (result.kind === "guide") {
    return [result.title, result.description, result.category, result.quickSummary, ...result.keywords];
  }

  const { article } = result;
  const sectionText = article.sections.flatMap((section) => [
    section.heading,
    ...(section.paragraphs ?? []),
    ...(section.bullets ?? []),
  ]);
  return [article.title, article.description, article.category, ...article.quickSummary, ...sectionText];
}

function matchesFilters(result: ResourceSearchResult, state: ResourceSearchState) {
  return (state.topic === "all" || resultTopic(result) === state.topic)
    && (state.region === "all" || resultRegion(result) === state.region);
}

export function searchResources(articles: Article[], state: ResourceSearchState): ResourceSearchResult[] {
  const trimmedQuery = state.query.trim();
  const articleResults: ResourceSearchResult[] = articles.map((article) => ({ kind: "article", article }));
  const candidates = (trimmedQuery ? [...articleResults, ...resourceSearchGuides] : articleResults)
    .filter((result) => matchesFilters(result, state));

  if (!trimmedQuery) return candidates;

  const normalizedQuery = normalizeSiteSearchText(trimmedQuery);
  const tokens = meaningfulSiteSearchTokens(trimmedQuery);
  if (normalizedQuery.length < 2 || tokens.length === 0) return [];

  const scenario = getSiteSearchScenario(trimmedQuery);
  const scenarioOrder = scenario ? scenarioResultPriorities[scenario] : [];
  const exactPriority = exactResultPriorities.get(normalizedQuery);
  const minimumTokenMatches = tokens.length > 1 ? Math.min(2, tokens.length) : 1;

  return candidates
    .map((result, index) => {
      const parts = resultSearchParts(result);
      const normalizedParts = parts.map(normalizeSiteSearchText);
      const searchable = normalizeSiteSearchText(parts.join(" "));
      const title = normalizeSiteSearchText(result.kind === "article" ? result.article.title : result.title);
      const directMatch = searchable.includes(normalizedQuery);
      const tokenMatches = tokens.filter((token) => searchable.includes(normalizeSiteSearchText(token))).length;
      const key = resultKey(result);
      const scenarioIndex = scenarioOrder.indexOf(key);
      const priority = key === exactPriority
        ? 10_000
        : scenarioIndex >= 0
          ? 9_000 - scenarioIndex
          : title.includes(normalizedQuery)
            ? 800
            : normalizedParts.some((part) => part.includes(normalizedQuery))
              ? 600
              : tokenMatches * 100;

      return { result, index, directMatch, tokenMatches, priority };
    })
    .filter(({ result, directMatch, tokenMatches }) => {
      const key = resultKey(result);
      return key === exactPriority
        || scenarioOrder.includes(key)
        || directMatch
        || tokenMatches >= minimumTokenMatches;
    })
    .sort((left, right) => right.priority - left.priority || left.index - right.index)
    .map(({ result }) => result);
}

export function getResourceRecoveryOptions(state: ResourceSearchState) {
  const hasQuery = state.query.trim().length > 0;
  const hasRegion = state.region !== "all";
  const hasAnyFilter = state.topic !== "all" || hasRegion || hasQuery;

  return {
    clearSearch: hasQuery,
    clearRegion: hasRegion,
    resetAll: hasAnyFilter,
  };
}
