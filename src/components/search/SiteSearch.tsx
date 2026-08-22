"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

export type SearchItem = { href: string; type: "도구" | "가이드" | "자료"; title: string; description: string; keywords: string[] };

const suggestions = ["TFN", "Bond", "전기 요금", "세후 급여", "영문 이력서", "택스 리턴", "Super 환급", "중고거래", "통역", "교통"];
const normalize = (value: string) => value.toLocaleLowerCase("ko-KR").replace(/\s+/g, "").replace(/[·/–—-]/g, "");

export function SiteSearch({ items, initialQuery = "" }: { items: SearchItem[]; initialQuery?: string }) {
  const [query, setQuery] = useState(initialQuery);
  const normalized = normalize(query.trim());
  const results = useMemo(() => {
    if (!normalized) return items;
    const relevance = (item: SearchItem) => {
      if (normalize(item.title).includes(normalized)) return 3;
      if (item.keywords.some((keyword) => normalize(keyword).includes(normalized))) return 2;
      return 1;
    };
    const paid = (item: SearchItem) => item.href === "/pro" || item.href.includes("-pro");
    const rank = (item: SearchItem) => relevance(item) * 2 - Number(paid(item)) * 2;
    return items
      .filter((item) => normalize([item.title, item.description, ...item.keywords].join(" ")).includes(normalized))
      .sort((a, b) => rank(b) - rank(a));
  }, [items, normalized]);
  const groups = normalized === normalize("STAR") ? ["자료", "도구", "가이드"] as const : ["도구", "가이드", "자료"] as const;

  return <>
    <section className="mt-10 border-y border-navy/20 py-6" aria-labelledby="site-search-label"><label id="site-search-label" htmlFor="site-search" className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">어떤 도움이 필요하세요?</label><div className="mt-3 flex items-center border-b-2 border-navy pb-3"><span className="mr-3 font-mono text-2xl text-gold" aria-hidden="true">⌕</span><input id="site-search" type="search" autoComplete="off" autoFocus value={query} onChange={(event)=>setQuery(event.target.value)} placeholder="예: TFN, 집 구하기, Super 환급" className="min-h-12 w-full bg-transparent text-xl text-navy outline-none placeholder:text-muted/55 sm:text-2xl"/><span className="ml-3 shrink-0 font-mono text-xs text-muted" aria-live="polite">{results.length}개</span></div><div className="mt-4 flex flex-wrap gap-x-5 gap-y-2"><span className="text-xs text-muted">많이 찾는 검색어</span>{suggestions.map((value)=><button key={value} type="button" onClick={()=>setQuery(value)} className="min-h-8 border-b border-border text-xs font-semibold text-navy hover:border-gold">{value}</button>)}</div></section>

    <div className="mt-10">{results.length ? groups.map((group) => { const groupItems=results.filter((item)=>item.type===group); if(!groupItems.length)return null; return <section key={group} className="mb-12" aria-labelledby={`search-${group}`}><div className="flex items-end justify-between border-b border-navy/20 pb-4"><h2 id={`search-${group}`} className="text-2xl font-semibold text-navy">{group}</h2><span className="font-mono text-xs text-muted">{String(groupItems.length).padStart(2,"0")}</span></div><ul>{groupItems.map((item,index)=><li key={item.href} className="border-b border-border"><Link href={item.href} className="group grid gap-4 py-6 transition hover:bg-white/70 sm:grid-cols-[3rem_0.8fr_1.2fr_auto] sm:items-center sm:px-3"><span className="font-mono text-xs text-gold">{String(index+1).padStart(2,"0")}</span><strong className="text-lg text-navy">{item.title}</strong><span className="text-sm leading-6 text-muted">{item.description}</span><span className="text-xl text-navy transition group-hover:translate-x-1" aria-hidden="true">→</span></Link></li>)}</ul></section> }) : <div className="border-y border-border py-16 text-center"><p className="text-xl font-semibold text-navy">아직 맞는 결과를 찾지 못했어요.</p><p className="mt-2 text-sm text-muted">단어를 조금 짧게 입력하거나 위 추천 검색어를 골라보세요.</p><button type="button" onClick={()=>setQuery("")} className="mt-5 min-h-11 border-b-2 border-gold text-sm font-semibold text-navy">전체 목록 보기</button></div>}</div>
  </>;
}
