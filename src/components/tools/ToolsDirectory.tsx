"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { filterDirectoryTools } from "@/lib/toolsDirectorySearch";

export type DirectoryToolKind = "가이드" | "계산기" | "체크리스트" | "기록 도구" | "작성 도구" | "점검 도구" | "비교 도구" | "탐색 도구" | "백업 도구";

export type DirectoryTool = {
  href: string;
  kind: DirectoryToolKind;
  eyebrow: string;
  title: string;
  description: string;
  features: string[];
  cta: string;
  categories: string[];
  featured?: boolean;
};

const filters = [
  { id: "all", label: "전체" },
  { id: "arrival", label: "도착·첫 생활" },
  { id: "work", label: "취업·급여" },
  { id: "money", label: "돈 관리" },
  { id: "home", label: "집·이동·생활" },
  { id: "annual", label: "세금·정기 점검" },
  { id: "departure", label: "귀국 준비" },
];

export function ToolsDirectory({ tools }: { tools: DirectoryTool[] }) {
  const [active, setActive] = useState("all");
  const [query, setQuery] = useState("");
  const searchInput = useRef<HTMLInputElement>(null);
  const visible = filterDirectoryTools(tools, active, query);
  const featuredTool = active === "all" ? visible.find((tool) => tool.featured) : undefined;
  const listedTools = featuredTool ? visible.filter((tool) => tool.href !== featuredTool.href) : visible;

  function clearSearch() {
    setQuery("");
    searchInput.current?.focus();
  }

  function resetFilters() {
    setActive("all");
    clearSearch();
  }

  return <>
    <div className="mt-6 rounded-xl border border-border bg-white p-4 sm:p-6" aria-labelledby="tool-filter-heading">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold-ink">무료 도구 찾기</p><h2 id="tool-filter-heading" className="mt-1 text-lg font-semibold text-navy">지금 필요한 상황을 선택하세요</h2></div>
        <div className="text-sm leading-6 text-muted sm:text-right"><p id="tool-result-count" role="status" aria-live="polite" aria-atomic={true}>전체 {tools.length}개 중 {visible.length}개 표시</p><p>{tools.length}개 모두 무료 도구·가이드 · <Link href="/pro" className="inline-flex min-h-11 items-center font-semibold text-navy underline decoration-gold underline-offset-4">Pro 도구 별도 비교 →</Link></p></div>
      </div>
      <div className="mt-5" role="search" aria-label="도구 검색">
        <label htmlFor="tool-search" className="block text-sm font-semibold text-navy">도구 검색</label>
        <div className="mt-2 flex flex-wrap gap-2">
          <input
            ref={searchInput}
            id="tool-search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="예: 급여, 이력서, 중고차"
            autoComplete="off"
            spellCheck={false}
            aria-describedby="tool-search-help tool-search-privacy"
            className="min-h-12 min-w-0 flex-1 basis-44 rounded-lg border border-navy/25 bg-white px-3 py-2 text-base text-navy placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-2"
          />
          <button type="button" onClick={clearSearch} disabled={query.length === 0} className="min-h-12 shrink-0 rounded-lg border border-navy/25 px-4 py-2 text-sm font-semibold text-navy transition hover:bg-white disabled:cursor-default disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-2">검색어 지우기</button>
        </div>
        <p id="tool-search-help" className="mt-3 text-sm leading-6 text-muted">선택한 상황 안에서 제목·설명·기능·소개 문구를 검색합니다.</p>
        <p id="tool-search-privacy" className="mt-1 text-xs leading-5 text-muted">이 검색창은 검색어를 저장하거나 전송하지 않아요.</p>
      </div>
      <p id="tool-filter-scroll-help" className="mt-4 text-xs text-muted sm:hidden">상황 필터는 옆으로 밀어 더 볼 수 있어요.</p>
      <div className="mt-2 flex gap-2 overflow-x-auto pb-2 sm:mt-5" role="group" aria-label="상황별 도구 필터" aria-describedby="tool-filter-scroll-help">{filters.map((filter)=><button key={filter.id} type="button" aria-pressed={active===filter.id} onClick={()=>setActive(filter.id)} className={`min-h-11 shrink-0 rounded-lg border px-3 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-navy ${active===filter.id?"border-navy bg-navy text-white":"border-border bg-white text-muted hover:border-navy hover:text-navy"}`}>{filter.label}</button>)}</div>
    </div>

    {visible.length === 0 && <section className="mt-10 border border-navy/15 bg-white/60 px-6 py-8" aria-labelledby="tool-empty-heading">
      <h2 id="tool-empty-heading" className="text-xl font-semibold text-navy">검색 결과가 없어요</h2>
      <p className="mt-3 text-sm leading-6 text-muted">선택한 상황과 검색어에 모두 맞는 도구가 없어요. 검색어를 바꾸거나 지우고, 다른 상황을 선택해 보세요.</p>
      <button type="button" onClick={resetFilters} className="mt-5 inline-flex min-h-11 items-center justify-center border border-gold bg-gold px-5 py-2 text-sm font-semibold text-navy transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-2">전체 조건 초기화</button>
    </section>}

    {featuredTool && <article className="mt-6 grid gap-4 rounded-xl bg-navy p-5 text-white sm:grid-cols-[1fr_auto] sm:items-center sm:p-6">
      <div><p className="text-xs font-semibold text-gold">무료 {featuredTool.kind} · {featuredTool.eyebrow} · 대표</p><h2 className="mt-2 text-xl font-semibold">{featuredTool.title}</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-white/75">{featuredTool.description}</p></div>
      <Link href={featuredTool.href} className="inline-flex min-h-11 items-center justify-center rounded-lg bg-white px-5 py-3 text-sm font-semibold text-navy">{featuredTool.cta} <span className="ml-3" aria-hidden="true">→</span></Link>
    </article>}

    {listedTools.length > 0 && <ol className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3" aria-label="도구 목록">
      {listedTools.map(tool => <li key={tool.href}><Link href={tool.href} className="site-card group flex h-full flex-col p-5 sm:p-6">
        <span className="text-xs font-semibold text-gold-ink">무료 {tool.kind} · {tool.eyebrow}</span>
        <strong className="mt-3 text-lg font-semibold tracking-tight text-navy">{tool.title}</strong>
        <span className="mt-2 text-sm leading-6 text-muted">{tool.description}</span>
        <span className="mt-auto flex min-h-11 items-center justify-between gap-3 pt-4 text-sm font-semibold text-navy">{tool.cta}<span aria-hidden="true">→</span></span>
      </Link></li>)}
    </ol>}
  </>;
}
