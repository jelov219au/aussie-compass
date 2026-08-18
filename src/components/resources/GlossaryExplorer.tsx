"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

export type GlossaryTerm = {
  term: string;
  korean: string;
  category: "일·급여" | "세금·연금" | "비자·정착" | "주거·교통";
  summary: string;
  check: string;
  href?: string;
  source?: string;
};

const categories = ["전체", "일·급여", "세금·연금", "비자·정착", "주거·교통"] as const;

function normalise(value: string) {
  return value.toLocaleLowerCase("ko-KR").replace(/[\s·()/+-]/g, "");
}

export function GlossaryExplorer({ terms }: { terms: GlossaryTerm[] }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<(typeof categories)[number]>("전체");

  const filtered = useMemo(() => {
    const keyword = normalise(query);
    return terms.filter((item) => {
      const matchesCategory = category === "전체" || item.category === category;
      const searchable = normalise(`${item.term} ${item.korean} ${item.summary} ${item.check}`);
      return matchesCategory && (!keyword || searchable.includes(keyword));
    });
  }, [category, query, terms]);

  return (
    <div className="mt-10">
      <section className="border-y border-navy/20 py-6" aria-labelledby="glossary-search-heading">
        <h2 id="glossary-search-heading" className="sr-only">용어 검색과 분야 선택</h2>
        <label htmlFor="glossary-search" className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">궁금한 용어 찾기</label>
        <div className="mt-3 flex items-center border-b-2 border-navy pb-3">
          <span className="mr-3 font-mono text-2xl text-gold" aria-hidden="true">⌕</span>
          <input id="glossary-search" type="search" autoComplete="off" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="예: TFN, 급여명세서, 보증금" className="min-h-12 w-full bg-transparent text-xl text-navy outline-none placeholder:text-muted/55 sm:text-2xl" />
          <span className="ml-3 shrink-0 font-mono text-xs text-muted" aria-live="polite">{filtered.length}개</span>
        </div>
        <div className="mt-5 flex flex-wrap gap-2" aria-label="용어 분야">
          {categories.map((item) => <button key={item} type="button" onClick={() => setCategory(item)} aria-pressed={category === item} className={`min-h-10 rounded-full border px-4 text-sm font-medium transition ${category === item ? "border-navy bg-navy text-white" : "border-border bg-white text-muted hover:border-gold hover:text-navy"}`}>{item}</button>)}
        </div>
      </section>

      {filtered.length ? (
        <dl className="mt-8 grid gap-x-8 lg:grid-cols-2">
          {filtered.map((item) => (
            <div key={item.term} className="border-b border-border py-7">
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <dt className="text-2xl font-semibold tracking-tight text-navy">{item.term}</dt>
                <dd className="text-sm font-medium text-gold">{item.korean}</dd>
              </div>
              <dd className="mt-1 text-xs font-semibold text-muted">{item.category}</dd>
              <dd className="mt-4 text-sm leading-7 text-muted">{item.summary}</dd>
              <dd className="mt-4 border-l-2 border-gold pl-4 text-sm leading-6 text-navy"><strong>확인할 것:</strong> {item.check}</dd>
              {(item.href || item.source) && <dd className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm font-semibold text-navy">{item.href && <Link href={item.href} className="underline decoration-gold decoration-2 underline-offset-4">관련 가이드 &rarr;</Link>}{item.source && <a href={item.source} target="_blank" rel="noreferrer" className="underline decoration-border underline-offset-4">공식 설명 &nearr;</a>}</dd>}
            </div>
          ))}
        </dl>
      ) : (
        <div className="mt-8 border-y border-border py-16 text-center">
          <p className="text-xl font-semibold text-navy">아직 맞는 용어를 찾지 못했어요.</p>
          <p className="mt-2 text-sm text-muted">단어를 조금 짧게 입력하거나 다른 분야를 골라보세요.</p>
          <button type="button" onClick={() => { setQuery(""); setCategory("전체"); }} className="mt-5 min-h-11 border-b-2 border-gold text-sm font-semibold text-navy">전체 용어 보기</button>
        </div>
      )}
    </div>
  );
}
