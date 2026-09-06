type SearchableDirectoryTool = {
  href: string;
  title: string;
  description: string;
  features: readonly string[];
  eyebrow: string;
  categories: readonly string[];
};

const categoryPriority: Record<string, readonly string[]> = {
  work: [
    "/resources/australia-job-ending-final-pay-dismissal-guide",
    "/underpayment-guide",
    "/salary-calculator",
  ],
  money: ["/tax-return-guide", "/underpayment-guide", "/used-car-comparison"],
  home: ["/property-inspection-checklist", "/used-car-comparison"],
  annual: ["/tax-return-guide"],
  departure: ["/leaving-australia-guide"],
};

const tokenSynonyms: Record<string, readonly string[]> = {
  job: ["job", "일자리", "직장", "고용"],
  일자리: ["일자리", "job", "직장", "고용"],
  ending: ["ending", "종료", "퇴사", "해고", "final pay"],
  종료: ["종료", "ending", "퇴사", "해고", "final pay"],
  tax: ["tax", "세금", "택스"],
  세금: ["세금", "tax", "택스"],
  return: ["return", "신고", "리턴"],
  신고: ["신고", "return", "리턴"],
  rent: ["rent", "rental", "렌트", "집", "쉐어하우스"],
  rental: ["rental", "rent", "렌트", "집", "쉐어하우스"],
  렌트: ["렌트", "rent", "rental", "집", "쉐어하우스"],
  inspection: ["inspection", "점검", "방문", "검사"],
  pay: ["pay", "급여", "임금", "payslip", "입금액"],
  급여가: ["급여", "pay", "임금", "payslip", "입금액"],
  급여: ["급여", "pay", "임금", "payslip", "입금액"],
  difference: ["difference", "차이", "다름", "underpayment"],
  다름: ["다름", "차이", "difference", "underpayment"],
  차이: ["차이", "다름", "difference", "underpayment"],
  used: ["used", "중고"],
  중고차: ["중고차", "used car", "중고", "차량"],
  car: ["car", "차", "차량", "자동차"],
  leaving: ["leaving", "출국", "귀국", "마무리"],
  출국: ["출국", "leaving", "귀국", "마무리"],
  australia: ["australia", "호주"],
};

function normalize(value: string) {
  return value
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

function matchesQuery(tool: SearchableDirectoryTool, query: string) {
  const tokens = normalize(query).split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return true;

  const searchableText = normalize([
    tool.href,
    tool.title,
    tool.description,
    ...tool.features,
    tool.eyebrow,
  ].join(" "));

  return tokens.every((token) => {
    const aliases = tokenSynonyms[token] ?? [token];
    return aliases.some((alias) => searchableText.includes(normalize(alias)));
  });
}

function queryPriority(query: string) {
  const tokens = new Set(normalize(query).split(/\s+/).filter(Boolean));
  const has = (...values: string[]) => values.some((value) => tokens.has(value));

  if (has("job", "일자리") && has("ending", "종료")) return "/resources/australia-job-ending-final-pay-dismissal-guide";
  if (has("tax", "세금") && has("return", "신고")) return "/tax-return-guide";
  if (has("rental", "rent", "렌트") && (tokens.size === 1 || has("inspection", "점검"))) return "/property-inspection-checklist";
  if (has("pay", "급여", "급여가") && has("difference", "차이", "다름")) return "/underpayment-guide";
  if (has("used", "중고차", "중고") && (tokens.size === 1 || has("car", "차"))) return "/used-car-comparison";
  if (has("leaving", "출국") && (tokens.size === 1 || has("australia", "호주"))) return "/leaving-australia-guide";
  return undefined;
}

// Search stays entirely in the browser: no query is stored or sent anywhere.
// Whitespace-separated tokens use AND matching; fixed aliases cover common
// Korean and English ways people describe the same situation.
export function filterDirectoryTools<T extends SearchableDirectoryTool>(
  tools: readonly T[],
  category: string,
  query: string,
): T[] {
  const filtered = tools.filter((tool) => {
    if (category !== "all" && !tool.categories.includes(category)) return false;
    return matchesQuery(tool, query);
  });

  const preferredHref = queryPriority(query);
  const priority = [...new Set([
    ...(preferredHref ? [preferredHref] : []),
    ...(categoryPriority[category] ?? []),
  ])];
  if (priority.length === 0) return filtered;

  const order = new Map(priority.map((href, index) => [href, index]));
  return filtered
    .map((tool, index) => ({ tool, index }))
    .sort((a, b) => {
      const aRank = order.get(a.tool.href) ?? Number.MAX_SAFE_INTEGER;
      const bRank = order.get(b.tool.href) ?? Number.MAX_SAFE_INTEGER;
      return aRank - bRank || a.index - b.index;
    })
    .map(({ tool }) => tool);
}
