"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { articleTopicCategories, type Article, type ArticleTopicId } from "@/data/articles";
import { ARTICLE_READING_UPDATED_EVENT, readArticleHistory } from "@/lib/articleProgress";

const filters = [
  { id: "all", label: "전체" },
  { id: "start", label: "도착·구직" },
  { id: "work", label: "일·급여" },
  { id: "home", label: "집·차" },
  { id: "money", label: "돈 관리" },
] as const;

type FilterId = (typeof filters)[number]["id"];

function searchableText(article: Article) {
  const sectionText = article.sections.flatMap((section) => [
    section.heading,
    ...(section.paragraphs ?? []),
    ...(section.bullets ?? []),
  ]);

  return [article.title, article.description, article.category, ...article.quickSummary, ...sectionText]
    .join(" ")
    .toLocaleLowerCase("ko-KR");
}

export function ResourcesDirectory({ articles }: { articles: Article[] }) {
  const [active, setActive] = useState<FilterId>("all");
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

  const visible = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("ko-KR");

    return articles.filter((article) => {
      const matchesCategory =
        active === "all" || articleTopicCategories[active as ArticleTopicId].includes(article.category);
      const matchesQuery =
        normalizedQuery.length === 0 || searchableText(article).includes(normalizedQuery);

      return matchesCategory && matchesQuery;
    });
  }, [active, articles, query]);

  const reset = () => {
    setActive("all");
    setQuery("");
  };

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
          <div className="mt-5 flex gap-x-6 gap-y-2 overflow-x-auto pb-1" role="group" aria-label="자료 주제 필터">
            {filters.map((filter) => (
              <button
                key={filter.id}
                type="button"
                aria-pressed={active === filter.id}
                onClick={() => setActive(filter.id)}
                className={`min-h-10 shrink-0 border-b-2 text-sm font-semibold transition ${
                  active === filter.id
                    ? "border-gold text-navy"
                    : "border-transparent text-muted hover:border-border hover:text-navy"
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label htmlFor="resource-search" className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
            자료 검색
          </label>
          <div className="mt-2 flex border-b border-navy bg-white/55 focus-within:border-gold">
            <span className="flex w-11 items-center justify-center text-muted" aria-hidden="true">
              ⌕
            </span>
            <input
              id="resource-search"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="예: payslip, 집, 생활비"
              className="min-h-12 w-full bg-transparent pr-4 text-sm text-navy outline-none placeholder:text-muted/70"
            />
          </div>
        </div>
      </div>

      <div className="flex min-h-14 items-center justify-between gap-4 border-b border-border">
        <p className="text-sm text-muted" aria-live="polite">
          <strong className="font-semibold text-navy">{visible.length}개</strong>의 자료
        </p>
        {(active !== "all" || query) && (
          <button type="button" onClick={reset} className="min-h-11 text-sm font-semibold text-navy underline decoration-gold underline-offset-4">
            필터 초기화
          </button>
        )}
      </div>

      {visible.length > 0 ? (
        <ol className="grid border-b border-navy/20 lg:grid-cols-2" aria-label="실용 자료 목록">
          {visible.map((article, index) => {
            const href = `/resources/${article.slug}`;
            const hasRead = readHrefs.has(href);
            return (
              <li key={article.slug} className="border-b border-border last:border-b-0 lg:[&:nth-last-child(-n+2)]:border-b-0 lg:odd:border-r">
                <Link
                  href={href}
                  className="group grid h-full min-h-72 grid-rows-[auto_auto_auto_1fr_auto] px-1 py-8 transition hover:bg-white/60 focus-visible:bg-white focus-visible:outline-none sm:px-6 lg:p-8"
                >
                  <div className="flex items-center justify-between gap-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.13em] text-gold">
                      {article.category} · {article.readingTime}
                    </p>
                    <span className="font-mono text-xs text-muted/70">
                      {String(index + 1).padStart(2, "0")} / {String(visible.length).padStart(2, "0")}
                    </span>
                  </div>
                  <h3 className="mt-5 max-w-xl text-xl font-semibold leading-8 tracking-tight text-navy sm:text-2xl">
                    {article.title}
                  </h3>
                  <p className="mt-3 max-w-xl text-sm leading-6 text-muted">{article.description}</p>
                  <div className="mt-5 border-l-2 border-gold/70 pl-4">
                    <p className="text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-muted">이 글에서 바로 확인</p>
                    <p className="mt-1 text-sm leading-6 text-navy">{article.quickSummary[0]}</p>
                  </div>
                  <div className="mt-8 flex items-end justify-between gap-4 border-t border-border pt-4">
                    <span className="text-xs font-medium text-muted">
                      {hasRead ? "✓ 읽어본 글" : article.sources?.length ? `한국어 설명 + 공식 출처 ${article.sources.length}개` : "차근차근 읽는 한국어 안내"}
                    </span>
                    <span className="flex h-10 w-10 items-center justify-center border border-border text-lg text-navy transition group-hover:translate-x-1 group-hover:border-gold group-hover:bg-gold" aria-hidden="true">
                      →
                    </span>
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
          <button type="button" onClick={reset} className="mt-6 min-h-11 border border-navy px-5 text-sm font-semibold text-navy transition hover:bg-navy hover:text-white">
            전체 자료 보기
          </button>
        </div>
      )}
    </section>
  );
}
