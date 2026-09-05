"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  articleContentTypeLabels,
  articleRegionLabels,
  getArticleContentType,
  getArticleRegion,
  type Article,
  type ArticleRegionId,
} from "@/data/articles";
import { ARTICLE_READING_UPDATED_EVENT, readArticleHistory } from "@/lib/articleProgress";
import { getResourceRecoveryOptions, searchResources } from "@/lib/resourceSearch";
import { TopicIcon, type TopicIconName } from "@/components/ui/TopicIcon";

const filters = [
  { id: "all", label: "전체" },
  { id: "start", label: "도착·구직" },
  { id: "work", label: "일·급여" },
  { id: "home", label: "집·차" },
  { id: "money", label: "돈 관리" },
] as const;

type FilterId = (typeof filters)[number]["id"];
type RegionFilterId = "all" | ArticleRegionId;

function resourceIcon(category: string): TopicIconName {
  if (/구직|취업|이력서|일/.test(category)) return "work";
  if (/집|차|주거/.test(category)) return "home";
  if (/돈|급여|세금|생활비/.test(category)) return "money";
  if (/도착|정착|비자/.test(category)) return "arrival";
  return "guide";
}

export function ResourcesDirectory({ articles }: { articles: Article[] }) {
  const [active, setActive] = useState<FilterId>("all");
  const [activeRegion, setActiveRegion] = useState<RegionFilterId>("all");
  const [query, setQuery] = useState("");
  const [readHrefs, setReadHrefs] = useState<Set<string>>(new Set());

  useEffect(() => {
    const refresh = () => setReadHrefs(new Set(readArticleHistory().map((record) => record.href)));
    refresh();
    window.addEventListener("storage", refresh);
    window.addEventListener(ARTICLE_READING_UPDATED_EVENT, refresh);
    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener(ARTICLE_READING_UPDATED_EVENT, refresh);
    };
  }, []);

  const searchState = useMemo(() => ({ topic: active, region: activeRegion, query }), [active, activeRegion, query]);
  const visible = useMemo(() => searchResources(articles, searchState), [articles, searchState]);
  const recovery = getResourceRecoveryOptions(searchState);

  const regionFilters = useMemo(() => {
    const counts = articles.reduce((result, article) => {
      const region = getArticleRegion(article);
      result.set(region, (result.get(region) ?? 0) + 1);
      return result;
    }, new Map<ArticleRegionId, number>());

    return (["australia", "nsw", "vic", "qld", "wa", "sa", "tas"] as ArticleRegionId[])
      .filter((region) => counts.has(region))
      .map((region) => ({ id: region, label: articleRegionLabels[region], count: counts.get(region) ?? 0 }));
  }, [articles]);

  const reset = () => {
    setActive("all");
    setActiveRegion("all");
    setQuery("");
  };

  const activeFilters = [
    active !== "all" ? `주제 ${filters.find((filter) => filter.id === active)?.label}` : null,
    activeRegion !== "all" ? `지역 ${articleRegionLabels[activeRegion]}` : null,
    query.trim() ? `검색 “${query.trim()}”` : null,
  ].filter((filter): filter is string => Boolean(filter));

  return (
    <section className="mt-12" aria-labelledby="resource-directory-heading">
      <div className="grid gap-6 border-y border-navy/20 py-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-end">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">
            지금 궁금한 주제부터
          </p>
          <h2 id="resource-directory-heading" className="mt-1 text-xl font-semibold text-navy">
            지금 필요한 주제를 골라보세요
          </h2>
          <div className="mt-5 flex flex-wrap gap-2" role="group" aria-label="자료 주제 필터">
            {filters.map((filter) => (
              <button
                key={filter.id}
                type="button"
                aria-pressed={active === filter.id}
                onClick={() => setActive(filter.id)}
                className={`min-h-10 shrink-0 rounded-full border px-4 text-sm font-semibold transition ${
                  active === filter.id
                    ? "border-navy bg-navy text-white"
                    : "border-navy/15 bg-white text-muted hover:border-gold hover:text-navy"
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border/70 pt-4" role="group" aria-label="자료 지역 필터">
            <span className="shrink-0 text-xs font-semibold text-muted">지역</span>
            <button
              type="button"
              aria-pressed={activeRegion === "all"}
              onClick={() => setActiveRegion("all")}
              className={`min-h-9 shrink-0 rounded-full border px-3 text-xs font-semibold transition ${
                activeRegion === "all" ? "border-navy bg-navy text-white" : "border-border bg-white/50 text-muted hover:border-navy hover:text-navy"
              }`}
            >
              전체 {articles.length}
            </button>
            {regionFilters.map((filter) => (
              <button
                key={filter.id}
                type="button"
                aria-pressed={activeRegion === filter.id}
                onClick={() => setActiveRegion(filter.id)}
                className={`min-h-9 shrink-0 rounded-full border px-3 text-xs font-semibold transition ${
                  activeRegion === filter.id ? "border-navy bg-navy text-white" : "border-border bg-white/50 text-muted hover:border-navy hover:text-navy"
                }`}
              >
                {filter.label} {filter.count}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label htmlFor="resource-search" className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
            자료 검색
          </label>
          <div className="mt-2 flex rounded-xl border-2 border-navy/15 bg-white focus-within:border-navy focus-within:ring-2 focus-within:ring-navy/10">
            <span className="flex w-11 items-center justify-center text-muted" aria-hidden="true">
              ⌕
            </span>
            <input
              id="resource-search"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="예: 급여가 적게 들어왔어요"
              className="min-h-12 w-full bg-transparent pr-4 text-sm text-navy outline-none placeholder:text-muted/70"
            />
          </div>
        </div>
      </div>

      <div className="flex min-h-14 items-center justify-between gap-4 border-b border-border">
        <p className="text-sm text-muted" aria-live="polite">
          <strong className="font-semibold text-navy">{visible.length}개</strong>의 자료
        </p>
        {(active !== "all" || activeRegion !== "all" || query.trim()) && (
          <button type="button" onClick={reset} className="min-h-11 text-sm font-semibold text-navy underline decoration-gold underline-offset-4">
            필터 초기화
          </button>
        )}
      </div>

      {visible.length > 0 ? (
        <ol className="grid gap-4 py-6 lg:grid-cols-2" aria-label="실용 자료 목록">
          {visible.map((result, index) => {
            const display = result.kind === "article"
              ? {
                  href: `/resources/${result.article.slug}`,
                  category: result.article.category,
                  readingTime: result.article.readingTime,
                  region: getArticleRegion(result.article),
                  contentType: getArticleContentType(result.article),
                  title: result.article.title,
                  description: result.article.description,
                  summary: result.article.quickSummary[0],
                  sources: result.article.sources?.length ?? 0,
                }
              : {
                  href: result.href,
                  category: result.category,
                  readingTime: result.readingTime,
                  region: result.region,
                  contentType: result.contentType,
                  title: result.title,
                  description: result.description,
                  summary: result.quickSummary,
                  sources: 0,
                };
            const { href, category, readingTime, region, contentType, title, description, summary } = display;
            const hasRead = readHrefs.has(href);
            return (
              <li key={href}>
                <Link
                  href={href}
                  className="group grid h-full min-h-72 grid-rows-[auto_auto_auto_1fr_auto] rounded-2xl border-2 border-navy/10 bg-white p-5 shadow-[0_10px_26px_rgba(26,39,68,0.05)] transition hover:-translate-y-0.5 hover:border-gold hover:shadow-[0_16px_34px_rgba(26,39,68,0.1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy sm:p-7"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3"><TopicIcon name={resourceIcon(category)} size="sm" /><p className="text-xs font-semibold uppercase tracking-[0.13em] text-gold-ink">{category} · {readingTime}</p></div>
                    <span className="font-mono text-xs text-muted/70">
                      {String(index + 1).padStart(2, "0")} / {String(visible.length).padStart(2, "0")}
                    </span>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className="border border-border bg-white/60 px-2.5 py-1 text-[0.68rem] font-semibold text-navy">
                      {articleRegionLabels[region]}
                    </span>
                    <span className="border border-gold/50 bg-[#f7f0d9] px-2.5 py-1 text-[0.68rem] font-semibold text-navy">
                      {articleContentTypeLabels[contentType]}
                    </span>
                  </div>
                  <h3 className="mt-5 max-w-xl text-xl font-semibold leading-8 tracking-tight text-navy sm:text-2xl">
                    {title}
                  </h3>
                  <p className="mt-3 max-w-xl text-sm leading-6 text-muted">{description}</p>
                  <div className="mt-5 border-l-2 border-gold/70 pl-4">
                    <p className="text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-muted">이 글에서 바로 확인</p>
                    <p className="mt-1 text-sm leading-6 text-navy">{summary}</p>
                  </div>
                  <div className="mt-8 flex items-center justify-between gap-4 border-t border-border pt-4">
                    <span className="text-xs font-medium text-muted">
                      {hasRead ? "✓ 읽어본 글" : display.sources ? `한국어 설명 + 공식 출처 ${display.sources}개` : result.kind === "guide" ? "무료 행동 체크리스트" : "차근차근 읽는 한국어 안내"}
                    </span>
                    <span className="inline-flex min-h-10 shrink-0 items-center gap-2 whitespace-nowrap rounded-lg bg-navy px-4 text-sm font-semibold text-white">{result.kind === "guide" ? "가이드 열기" : "자료 읽기"} <span className="transition group-hover:translate-x-1" aria-hidden="true">→</span></span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ol>
      ) : (
        <div className="border-b border-navy/20 py-16 text-center">
          <p className="text-lg font-semibold text-navy">아직 맞는 자료를 찾지 못했어요.</p>
          <p className="mt-2 text-sm text-muted">검색어를 조금 짧게 쓰거나 다른 주제를 골라보세요.</p>
          {activeFilters.length > 0 && <p className="mt-3 text-xs leading-6 text-muted">적용 중: {activeFilters.join(" · ")}</p>}
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            {recovery.clearSearch && <button type="button" onClick={() => setQuery("")} className="min-h-11 rounded-xl border-2 border-navy px-5 text-sm font-semibold text-navy transition hover:bg-navy hover:text-white">검색만 지우기</button>}
            {recovery.clearRegion && <button type="button" onClick={() => setActiveRegion("all")} className="min-h-11 rounded-xl border-2 border-navy px-5 text-sm font-semibold text-navy transition hover:bg-navy hover:text-white">지역만 전체</button>}
            {recovery.resetAll && <button type="button" onClick={reset} className="min-h-11 rounded-xl bg-navy px-5 text-sm font-semibold text-white transition hover:bg-gold hover:text-navy">모든 필터 초기화</button>}
          </div>
        </div>
      )}
    </section>
  );
}
