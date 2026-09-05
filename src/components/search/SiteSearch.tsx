"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { getSiteSearchIntent, getSiteSearchScenario, rankSiteSearchItems, type SearchItem } from "@/lib/siteSearch";
import { SEARCH_TRANSFER_STORAGE_KEY, sanitizeTransferredSearch } from "@/lib/searchTransfer";

const suggestions = ["급여", "Bond", "중고차", "비자 신체검사", "TFN", "전기 요금", "세후 급여", "영문 이력서", "커버레터", "이력서 양식", "공고 맞춤", "택스 리턴", "Super 환급", "통역", "교통"];
const emptyStateSuggestions = ["급여", "Bond", "중고차", "비자 신체검사"];

const resumeOutcomeLabels: Partial<Record<string, string>> = {
  "/resume-builder": "저장 결과 · 브라우저 이력서 + 무료 PDF",
  "/resume-job-ad-checker": "증빙 결과 · 일치 표현 + 확인할 실제 근거",
  "/resume-pro": "재사용 결과 · 회사별 지원서 저장 + 다시 열기",
};

function ResultList({ items }: { items: SearchItem[] }) {
  return (
    <ul>
      {items.map((item, index) => (
        <li key={item.href} className="border-b border-border pb-4">
          <Link href={item.href} className="group grid gap-4 py-6 transition hover:bg-white/70 sm:grid-cols-[3rem_0.8fr_1.2fr_auto] sm:items-center sm:px-3">
            <span className="font-mono text-xs text-gold-ink">{String(index + 1).padStart(2, "0")}</span>
            <strong className="text-lg text-navy">{item.title}</strong>
            <span className="text-sm leading-6 text-muted">
              {item.description}
              {resumeOutcomeLabels[item.href] && <span className="mt-2 block text-xs font-semibold text-[#806515]" data-search-resume-outcome>{resumeOutcomeLabels[item.href]}</span>}
              {item.stateLabel && <span className="mt-2 block text-xs font-semibold text-[#806515]" data-search-product-state>{item.stateLabel}</span>}
            </span>
            <span className="text-xl text-navy transition group-hover:translate-x-1" aria-hidden="true">→</span>
          </Link>
          {item.freeHref && item.freeLabel && (
            <Link href={item.freeHref} className="ml-0 inline-flex min-h-11 items-center border-b-2 border-gold text-sm font-semibold text-navy sm:ml-[4.5rem]" data-search-free-path>
              {item.freeLabel} →
            </Link>
          )}
        </li>
      ))}
    </ul>
  );
}

export function SiteSearch({ items }: { items: SearchItem[] }) {
  const [query, setQuery] = useState("");

  useEffect(() => {
    try {
      const transferredQuery = sessionStorage.getItem(SEARCH_TRANSFER_STORAGE_KEY);
      sessionStorage.removeItem(SEARCH_TRANSFER_STORAGE_KEY);
      if (transferredQuery) setQuery(sanitizeTransferredSearch(transferredQuery));
    } catch {
      // The search page remains usable when storage is blocked or unavailable.
    }
  }, []);

  const intent = getSiteSearchIntent(query);
  const scenario = getSiteSearchScenario(query);
  const results = useMemo(() => rankSiteSearchItems(items, query), [items, query]);
  const groups = ["도구", "가이드", "자료"] as const;

  return <>
    <section className="mt-10 border-y border-navy/20 py-6" aria-labelledby="site-search-label">
      <label id="site-search-label" htmlFor="site-search" className="text-xs font-semibold uppercase tracking-[0.18em] text-gold-ink">어떤 도움이 필요하세요?</label>
      <div className="mt-3 flex items-center border-b-2 border-navy pb-3">
        <span className="mr-3 font-mono text-2xl text-gold-ink" aria-hidden="true">⌕</span>
        <input id="site-search" type="search" autoComplete="off" autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="예: TFN, 집 구하기, Super 환급" className="min-h-12 w-full bg-transparent text-xl text-navy outline-none placeholder:text-muted/55 sm:text-2xl" />
        <span className="ml-3 shrink-0 font-mono text-xs text-muted" aria-live="polite">{results.length}개</span>
      </div>
      <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2">
        <span className="text-xs text-muted">많이 찾는 검색어</span>
        {suggestions.map((value) => <button key={value} type="button" onClick={() => setQuery(value)} className="min-h-8 border-b border-border text-xs font-semibold text-navy hover:border-gold">{value}</button>)}
      </div>
    </section>

    <div className="mt-10">
      {results.length ? intent === "resume" || intent === "resume-pro-direct" || scenario ? (
        <section className="mb-12" aria-labelledby="search-resume-recommendations">
          <div className="flex items-end justify-between border-b border-navy/20 pb-4">
            <h2 id="search-resume-recommendations" className="text-2xl font-semibold text-navy">{scenario ? "지금 상황에 맞는 추천 순서" : "이력서 준비 추천 순서"}</h2>
            <span className="font-mono text-xs text-muted">{String(results.length).padStart(2, "0")}</span>
          </div>
          <ResultList items={results} />
        </section>
      ) : groups.map((group) => {
        const groupItems = results.filter((item) => item.type === group);
        if (!groupItems.length) return null;
        return (
          <section key={group} className="mb-12" aria-labelledby={`search-${group}`}>
            <div className="flex items-end justify-between border-b border-navy/20 pb-4">
              <h2 id={`search-${group}`} className="text-2xl font-semibold text-navy">{group}</h2>
              <span className="font-mono text-xs text-muted">{String(groupItems.length).padStart(2, "0")}</span>
            </div>
            <ResultList items={groupItems} />
          </section>
        );
      }) : (
        <div className="border-y border-border py-16 text-center">
          <p className="text-xl font-semibold text-navy">아직 맞는 결과를 찾지 못했어요.</p>
          <p className="mt-2 text-sm text-muted">핵심 단어로 다시 찾아보거나 전체 목록을 확인해 보세요.</p>
          <div className="mt-5 flex flex-wrap justify-center gap-3" aria-label="핵심 검색어로 다시 찾기">
            {emptyStateSuggestions.map((value) => (
              <button key={value} type="button" onClick={() => setQuery(value)} className="min-h-11 rounded-full border border-navy/20 bg-white px-4 text-sm font-semibold text-navy hover:border-gold">{value}</button>
            ))}
          </div>
          <button type="button" onClick={() => setQuery("")} className="mt-5 min-h-11 border-b-2 border-gold text-sm font-semibold text-navy">전체 목록 보기</button>
        </div>
      )}
    </div>
  </>;
}
