"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  getSearchSafetyState,
  getSiteSearchIntent,
  getSiteSearchMatchRule,
  getSiteSearchScenario,
  normalizeSiteSearchText,
  rankSiteSearchItems,
  suggestSiteSearchCorrection,
  type SearchItem,
  type SearchSafetyState,
  type SiteSearchMatchRule,
} from "@/lib/siteSearch";
import { parseSafeSearchUrl, takePendingSearch } from "@/lib/searchTransfer";

const suggestions = ["급여", "Bond", "중고차", "비자 신체검사", "TFN", "전기 요금", "세후 급여", "영문 이력서", "커버레터", "이력서 양식", "공고 맞춤", "택스 리턴", "Super 환급", "통역", "교통"];
const emptyStateSuggestions = ["급여", "Bond", "중고차", "비자 신체검사"];

type QueryClass = "empty" | "known_intent" | "multi_intent" | "safety" | "unknown" | "malformed";
type ResultState = "ready" | "needs_clarification" | "zero" | "safety_override";
type RouteKind = "free_tool" | "free_guide" | "official_directory" | "pro";
type OfficialStatus = "official_source" | "official_directory" | "hoju_tool" | "not_official" | "unknown";
type Boundary = "free_first" | "explicit_paid_intent" | "no_paid_route";
type SearchNextAction = "open_000_now" | "open_help_directory" | "open_free_route" | "clarify_terms" | "try_corrected_query" | "open_explicit_pro" | "show_safe_zero_recovery";

type SearchNextActionOutcome = {
  query_class: QueryClass;
  safety_state: SearchSafetyState;
  match_rule: SiteSearchMatchRule;
  result_state: ResultState;
  primary_route: string;
  route_kind: RouteKind;
  official_status: OfficialStatus;
  boundary: Boundary;
  next_action: SearchNextAction;
};

const fieldLabels: Record<keyof SearchNextActionOutcome, string> = {
  query_class: "query_class",
  safety_state: "safety_state",
  match_rule: "match_rule",
  result_state: "result_state",
  primary_route: "primary_route",
  route_kind: "route_kind",
  official_status: "official_status",
  boundary: "boundary",
  next_action: "next_action",
};

const resumeOutcomeLabels: Partial<Record<string, string>> = {
  "/resume-builder": "저장 결과 · 브라우저 이력서 + 무료 PDF",
  "/resume-job-ad-checker": "증빙 결과 · 일치 표현 + 확인할 실제 근거",
  "/resume-pro": "재사용 결과 · 회사별 지원서 저장 + 다시 열기",
};

function itemMeta(item: SearchItem) {
  const paid = item.href === "/pro" || item.href.includes("-pro");
  if (item.href === "/help-directory") return { kind: "official_directory" as const, official: "official_directory" as const, boundary: "no_paid_route" as const, action: "공식 연락처 확인" };
  return {
    kind: paid ? "pro" as const : item.type === "도구" ? "free_tool" as const : "free_guide" as const,
    official: item.type === "도구" ? "hoju_tool" as const : "not_official" as const,
    boundary: paid ? "explicit_paid_intent" as const : "free_first" as const,
    action: paid ? "제품 조건 확인" : item.type === "도구" ? "무료로 확인하기" : "무료 안내 읽기",
  };
}

function buildOutcome({ query, malformed, safety, rule, results }: { query: string; malformed: boolean; safety: SearchSafetyState; rule: SiteSearchMatchRule; results: SearchItem[] }): SearchNextActionOutcome {
  if (malformed) return { query_class: "malformed", safety_state: "not_safety", match_rule: "none", result_state: "needs_clarification", primary_route: "/search", route_kind: "free_tool", official_status: "unknown", boundary: "no_paid_route", next_action: "show_safe_zero_recovery" };
  if (safety !== "not_safety") return { query_class: "safety", safety_state: safety, match_rule: "exact_alias", result_state: "safety_override", primary_route: safety === "emergency_000" || safety === "crisis_help" ? "tel:000" : "/help-directory", route_kind: "official_directory", official_status: "official_source", boundary: "no_paid_route", next_action: safety === "emergency_000" || safety === "crisis_help" ? "open_000_now" : "open_help_directory" };
  if (!query.trim()) return { query_class: "empty", safety_state: "not_safety", match_rule: "none", result_state: "needs_clarification", primary_route: "/tools", route_kind: "free_tool", official_status: "hoju_tool", boundary: "free_first", next_action: "clarify_terms" };
  if (rule === "typo_suggestion") return { query_class: "unknown", safety_state: "not_safety", match_rule: rule, result_state: "needs_clarification", primary_route: "/search", route_kind: "free_tool", official_status: "unknown", boundary: "free_first", next_action: "try_corrected_query" };
  if (!results.length) return { query_class: "unknown", safety_state: "not_safety", match_rule: "none", result_state: "zero", primary_route: "/help-directory", route_kind: "official_directory", official_status: "official_directory", boundary: "no_paid_route", next_action: "show_safe_zero_recovery" };
  const normalized = normalizeSiteSearchText(query);
  const primary = results[0];
  const explicitPaid = /\bpro\b/i.test(query) || normalized.endsWith("pro");
  if (primary.href === "/car-purchase-pro") return { query_class: "known_intent", safety_state: "not_safety", match_rule: rule, result_state: "ready", primary_route: primary.freeHref ?? "/used-car-comparison", route_kind: "free_tool", official_status: "hoju_tool", boundary: "no_paid_route", next_action: "open_free_route" };
  const meta = itemMeta(primary);
  const multiIntent = /(?:\sor\s|또는|혹은)/iu.test(query);
  const paidPrimary = meta.kind === "pro" && explicitPaid;
  const recommended = meta.kind === "pro" && !paidPrimary
    ? results.find((item) => itemMeta(item).kind !== "pro")
    : primary;
  const recommendedMeta = recommended ? itemMeta(recommended) : null;
  return {
    query_class: multiIntent ? "multi_intent" : getSiteSearchIntent(query) !== "default" || getSiteSearchScenario(query) ? "known_intent" : "unknown",
    safety_state: "not_safety",
    match_rule: rule,
    result_state: "ready",
    primary_route: recommended?.href ?? "/tools",
    route_kind: paidPrimary ? "pro" : recommendedMeta?.kind ?? "free_tool",
    official_status: paidPrimary ? meta.official : recommendedMeta?.official ?? "hoju_tool",
    boundary: paidPrimary ? "explicit_paid_intent" : "free_first",
    next_action: paidPrimary ? "open_explicit_pro" : "open_free_route",
  };
}

function ResultList({ items }: { items: SearchItem[] }) {
  return <ul>{items.map((item, index) => {
    const meta = itemMeta(item);
    return <li key={item.href} className="border-b border-border pb-4">
      <Link href={item.href} referrerPolicy="no-referrer" className="group grid min-h-11 gap-4 py-6 transition hover:bg-white/70 sm:grid-cols-[3rem_0.8fr_1.2fr_auto] sm:items-center sm:px-3">
        <span className="font-mono text-xs text-gold-ink">{String(index + 1).padStart(2, "0")}</span>
        <strong className="text-lg text-navy">{item.title}</strong>
        <span className="text-sm leading-6 text-muted">{item.description}
          {resumeOutcomeLabels[item.href] && <span className="mt-2 block text-xs font-semibold text-[#806515]" data-search-resume-outcome>{resumeOutcomeLabels[item.href]}</span>}
          {item.stateLabel && <span className="mt-2 block text-xs font-semibold text-[#806515]" data-search-product-state>{item.stateLabel}</span>}
          <span className="mt-2 flex flex-wrap gap-2 text-xs font-semibold text-navy" data-search-result-contract><span>{meta.kind}</span><span>· {meta.official}</span><span>· {meta.boundary}</span><span>· {meta.action}</span></span>
        </span>
        <span className="text-xl text-navy transition group-hover:translate-x-1" aria-hidden="true">→</span>
      </Link>
      {item.freeHref && item.freeLabel && <Link href={item.freeHref} referrerPolicy="no-referrer" className="ml-0 inline-flex min-h-11 items-center border-b-2 border-gold text-sm font-semibold text-navy sm:ml-[4.5rem]" data-search-free-path>{item.freeLabel} →</Link>}
    </li>;
  })}</ul>;
}

export function SiteSearch({ items }: { items: SearchItem[] }) {
  const [query, setQuery] = useState("");
  const [malformed, setMalformed] = useState(false);
  const transferRead = useRef(false);

  useEffect(() => {
    // The in-memory hand-off is consumed once, including Strict Mode effect replay.
    if (transferRead.current) return;
    transferRead.current = true;
    const parsed = parseSafeSearchUrl(window.location.href, window.location.origin);
    try {
      window.history.replaceState(window.history.state, "", "/search");
    } catch {
      // The strict-origin response policy and no-referrer result links remain fail-closed.
    }
    const transferredQuery = takePendingSearch();
    setMalformed(parsed.malformed);
    setQuery(parsed.query || (!parsed.malformed ? transferredQuery : ""));
  }, []);

  const safety = getSearchSafetyState(query);
  const correction = suggestSiteSearchCorrection(query);
  const intent = getSiteSearchIntent(query);
  const scenario = getSiteSearchScenario(query);
  const results = useMemo(() => safety === "not_safety" && !correction ? rankSiteSearchItems(items, query) : [], [correction, items, query, safety]);
  const rule = getSiteSearchMatchRule(items, query);
  const outcome = buildOutcome({ query, malformed, safety, rule, results });
  const groups = ["도구", "가이드", "자료"] as const;
  const replaceQuery = (value: string) => { setMalformed(false); setQuery(value); };

  return <>
    <section className="mt-8 border-y border-navy/20 py-6" aria-labelledby="site-search-label">
      <label id="site-search-label" htmlFor="site-search" className="text-xs font-semibold uppercase tracking-[0.18em] text-gold-ink">어떤 도움이 필요하세요?</label>
      <div className="mt-3 flex items-center border-b-2 border-navy pb-3">
        <span className="mr-3 font-mono text-2xl text-gold-ink" aria-hidden="true">⌕</span>
        <input id="site-search" type="search" autoComplete="off" autoFocus value={query} onChange={(event) => replaceQuery(event.target.value)} placeholder="예: TFN, 집 구하기, Super 환급" className="min-h-12 w-full bg-transparent text-xl text-navy outline-none placeholder:text-muted/55 sm:text-2xl" />
        <span className="ml-3 shrink-0 font-mono text-xs text-muted" aria-live="polite">{safety !== "not_safety" ? "안전 우선" : `${results.length}개`}</span>
      </div>
      <div className={`mt-4 border-2 p-4 ${safety !== "not_safety" ? "border-red-700 bg-red-50" : "border-navy bg-white"}`} aria-labelledby="search-next-action-heading">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gold-ink">search_next_action</p>
        <h2 id="search-next-action-heading" className="mt-1 text-lg font-semibold text-navy">{safety !== "not_safety" ? "검색 결과보다 지금의 안전을 먼저 확인하세요." : outcome.result_state === "zero" ? "검색어를 바꾸거나 안전한 전체 경로를 여세요." : "첫 행동을 확인하세요."}</h2>
        {safety !== "not_safety" ? <div className="mt-3 grid gap-2 sm:grid-cols-3">
          <a href="tel:000" className="inline-flex min-h-12 items-center justify-center rounded-lg bg-red-800 px-4 text-sm font-semibold text-white">즉시 위험하면 000에 전화</a>
          {safety === "crisis_help" && <a href="tel:131114" className="inline-flex min-h-12 items-center justify-center rounded-lg border border-red-800 bg-white px-4 text-sm font-semibold text-red-900">Lifeline 13 11 14</a>}
          <Link href="/help-directory" referrerPolicy="no-referrer" className="inline-flex min-h-12 items-center justify-center rounded-lg border border-navy bg-white px-4 text-sm font-semibold text-navy">공식 도움 연락처 보기</Link>
        </div> : correction ? <button type="button" onClick={() => replaceQuery(correction)} className="mt-3 inline-flex min-h-12 items-center justify-center rounded-lg bg-navy px-5 text-sm font-semibold text-white">“{correction}”로 다시 검색</button> : results.length ? <Link href={outcome.primary_route} referrerPolicy="no-referrer" className="mt-3 inline-flex min-h-12 items-center justify-center rounded-lg bg-navy px-5 text-sm font-semibold text-white">첫 추천 경로 열기 →</Link> : query.trim() ? <Link href="/help-directory" referrerPolicy="no-referrer" className="mt-3 inline-flex min-h-12 items-center justify-center rounded-lg bg-navy px-5 text-sm font-semibold text-white">공식 도움 연락처에서 찾기 →</Link> : <Link href="/tools" referrerPolicy="no-referrer" className="mt-3 inline-flex min-h-12 items-center justify-center rounded-lg bg-navy px-5 text-sm font-semibold text-white">전체 무료 도구 보기 →</Link>}
        <p className="mt-3 text-xs leading-5 text-muted">규칙: 안전 표현 → 정확한 별칭·상황 → 모든 핵심 단어 → 일부 단어 결과 → 오타 제안 → 안전한 0건 복구. Pro는 제품명을 명시한 경우에만 첫 경로가 될 수 있습니다.</p>
        {rule === "any_term_fallback" && <p className="mt-2 text-sm font-semibold text-navy" role="status">모든 단어와 맞는 결과가 없어 일부 핵심 단어 결과를 보여드립니다.</p>}
        {malformed && <p className="mt-2 text-sm font-semibold text-red-900" role="alert">안전하게 읽을 수 없는 검색 주소를 지우고 빈 검색으로 돌아왔습니다.</p>}
        <details className="mt-3 text-sm text-muted"><summary className="flex min-h-11 cursor-pointer items-center font-semibold text-navy">9개 판정 필드 보기</summary><dl className="mt-2 grid gap-2 md:grid-cols-3">{(Object.keys(fieldLabels) as Array<keyof SearchNextActionOutcome>).map((field) => <div key={field} className="border border-border bg-surface p-3"><dt className="font-mono text-xs text-muted">{fieldLabels[field]}</dt><dd className="mt-1 break-words text-sm font-semibold text-navy">{outcome[field]}</dd></div>)}</dl></details>
      </div>
      <div className="mt-4 flex flex-wrap gap-2"><span className="flex min-h-11 items-center text-xs text-muted">많이 찾는 검색어</span>{suggestions.map((value) => <button key={value} type="button" onClick={() => replaceQuery(value)} className="min-h-11 rounded-full border border-border px-3 text-xs font-semibold text-navy hover:border-gold">{value}</button>)}</div>
    </section>

    <div className="mt-10">
      {safety !== "not_safety" ? null : results.length ? intent === "resume" || intent === "resume-pro-direct" || scenario ? <section className="mb-12" aria-labelledby="search-resume-recommendations"><div className="flex items-end justify-between border-b border-navy/20 pb-4"><h2 id="search-resume-recommendations" className="text-2xl font-semibold text-navy">{scenario ? "지금 상황에 맞는 추천 순서" : "이력서 준비 추천 순서"}</h2><span className="font-mono text-xs text-muted">{String(results.length).padStart(2, "0")} · {rule}</span></div><ResultList items={results} /></section> : groups.map((group) => {
        const groupItems = results.filter((item) => item.type === group);
        if (!groupItems.length) return null;
        return <section key={group} className="mb-12" aria-labelledby={`search-${group}`}><div className="flex items-end justify-between border-b border-navy/20 pb-4"><h2 id={`search-${group}`} className="text-2xl font-semibold text-navy">{group}</h2><span className="font-mono text-xs text-muted">{String(groupItems.length).padStart(2, "0")} · {rule}</span></div><ResultList items={groupItems} /></section>;
      }) : <div className="border-y border-border py-12 text-center"><p className="text-xl font-semibold text-navy">아직 맞는 결과를 찾지 못했어요.</p><p className="mt-2 text-sm text-muted">오타를 확인하거나 핵심 단어 하나로 다시 찾아보세요.</p><div className="mt-5 flex flex-wrap justify-center gap-3" aria-label="핵심 검색어로 다시 찾기">{emptyStateSuggestions.map((value) => <button key={value} type="button" onClick={() => replaceQuery(value)} className="min-h-11 rounded-full border border-navy/20 bg-white px-4 text-sm font-semibold text-navy hover:border-gold">{value}</button>)}</div><div className="mt-5 flex flex-wrap justify-center gap-3"><button type="button" onClick={() => replaceQuery("")} className="min-h-11 border-b-2 border-gold px-3 text-sm font-semibold text-navy">전체 목록 보기</button><Link href="/help-directory" referrerPolicy="no-referrer" className="inline-flex min-h-11 items-center border-b-2 border-gold px-3 text-sm font-semibold text-navy">공식 도움 연락처 보기</Link></div></div>}
    </div>
  </>;
}
