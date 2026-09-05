"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { filterDirectoryTools } from "@/lib/toolsDirectorySearch";

export type DirectoryTool = {
  href: string;
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
    <div className="mt-10 border-y border-navy/15 py-5" aria-labelledby="tool-filter-heading">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">Find your next step</p><h2 id="tool-filter-heading" className="mt-1 text-lg font-semibold text-navy">지금 필요한 상황을 선택하세요</h2></div>
        <p id="tool-result-count" className="text-sm text-muted" role="status" aria-live="polite" aria-atomic={true}>전체 {tools.length}개 중 {visible.length}개 표시</p>
      </div>
      <div className="mt-5" role="search" aria-label="도구 검색">
        <label htmlFor="tool-search" className="block text-sm font-semibold text-navy">도구 검색</label>
        <div className="mt-2 flex flex-col gap-2 sm:flex-row">
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
            className="min-h-11 min-w-0 flex-1 border border-navy/25 bg-white px-3 py-2 text-base text-navy placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-2"
          />
          <button type="button" onClick={clearSearch} disabled={query.length === 0} className="min-h-11 shrink-0 border border-navy/25 px-4 py-2 text-sm font-semibold text-navy transition hover:bg-white disabled:cursor-default disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-2">검색어 지우기</button>
        </div>
        <p id="tool-search-help" className="mt-3 text-sm leading-6 text-muted">선택한 상황 안에서 제목·설명·기능·소개 문구를 검색합니다.</p>
        <p id="tool-search-privacy" className="mt-1 text-xs leading-5 text-muted">이 검색창은 검색어를 저장하거나 전송하지 않아요.</p>
      </div>
      <div className="mt-5 flex gap-x-6 gap-y-2 overflow-x-auto pb-2" role="group" aria-label="상황별 도구 필터">{filters.map((filter)=><button key={filter.id} type="button" aria-pressed={active===filter.id} onClick={()=>setActive(filter.id)} className={`min-h-10 shrink-0 border-b-2 px-0 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-navy ${active===filter.id?"border-gold text-navy":"border-transparent text-muted hover:border-border hover:text-navy"}`}>{filter.label}</button>)}</div>
    </div>

    {visible.length === 0 && <section className="mt-10 border border-navy/15 bg-white/60 px-6 py-8" aria-labelledby="tool-empty-heading">
      <h2 id="tool-empty-heading" className="text-xl font-semibold text-navy">검색 결과가 없어요</h2>
      <p className="mt-3 text-sm leading-6 text-muted">선택한 상황과 검색어에 모두 맞는 도구가 없어요. 검색어를 바꾸거나 지우고, 다른 상황을 선택해 보세요.</p>
      <button type="button" onClick={resetFilters} className="mt-5 inline-flex min-h-11 items-center justify-center border border-gold bg-gold px-5 py-2 text-sm font-semibold text-navy transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-2">전체 조건 초기화</button>
    </section>}

    {featuredTool && <article className="relative mt-10 overflow-hidden bg-navy text-white"><div className="absolute -right-16 -top-20 h-64 w-64 rounded-full border border-white/10"/><div className="absolute -right-4 -top-8 h-40 w-40 rounded-full border border-gold/30"/><div className="relative grid gap-8 px-6 py-9 sm:px-10 sm:py-11 lg:grid-cols-[7rem_1fr_auto] lg:items-end"><div className="font-mono text-5xl font-light text-gold">01<span className="text-lg text-white/30">/{String(visible.length).padStart(2,"0")}</span></div><div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">{featuredTool.eyebrow} · 대표 도구</p><h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">{featuredTool.title}</h2><p className="mt-4 max-w-2xl leading-7 text-white/70">{featuredTool.description}</p><p className="mt-5 text-sm text-white/55">{featuredTool.features.join("  ·  ")}</p></div><Link href={featuredTool.href} className="inline-flex min-h-12 items-center justify-center border border-gold bg-gold px-5 py-3 text-sm font-semibold text-navy transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white lg:min-w-48">{featuredTool.cta} <span className="ml-3" aria-hidden="true">↗</span></Link></div></article>}

    {listedTools.length > 0 && <ol className="mt-10 border-t border-navy/20" aria-label="도구 목록">
      {listedTools.map((tool,index) => <li key={tool.href} className="group border-b border-border"><Link href={tool.href} className="grid min-h-44 gap-5 py-7 transition hover:bg-white/60 focus-visible:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-navy sm:grid-cols-[4rem_1fr_auto] sm:px-4 lg:grid-cols-[6rem_minmax(14rem,0.8fr)_1.2fr_auto] lg:items-center">
        <span className="font-mono text-sm text-gold">{String(index+(featuredTool?2:1)).padStart(2,"0")}</span>
        <span><span className="block text-xs font-semibold uppercase tracking-[0.14em] text-muted">{tool.eyebrow}</span><span className="mt-2 block text-xl font-semibold tracking-tight text-navy sm:text-2xl">{tool.title}</span></span>
        <span><span className="block text-sm leading-6 text-muted">{tool.description}</span><span className="mt-3 block text-xs font-medium text-navy/65">{tool.features.join("  ·  ")}</span></span>
        <span className="hidden h-11 w-11 items-center justify-center border border-border text-xl text-navy transition group-hover:border-gold group-hover:bg-gold group-hover:translate-x-1 sm:flex" aria-hidden="true">→</span>
      </Link></li>)}
    </ol>}
  </>;
}
