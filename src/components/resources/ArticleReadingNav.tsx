"use client";

import { useCallback, useEffect, useState } from "react";
import { markArticleAsRead, readArticleHistoryState, ARTICLE_READING_UPDATED_EVENT } from "@/lib/articleProgress";
import { canonicalArticleHref } from "@/lib/articleAliases.mjs";

type ReadingSection = { id: string; label: string };
type ReadingArticle = { href: string; title: string };

export function ArticleReadingNav({ sections, article }: { sections: ReadingSection[]; article: ReadingArticle }) {
  return <ArticleReadingNavState key={canonicalArticleHref(article.href)} sections={sections} article={article} />;
}

function ArticleReadingNavState({ sections, article }: { sections: ReadingSection[]; article: ReadingArticle }) {
  const { href: articleHref, title: articleTitle } = article;
  const [activeId, setActiveId] = useState(sections[0]?.id ?? "");
  const [progress, setProgress] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [observedScroll, setObservedScroll] = useState(false);
  const [attempted, setAttempted] = useState(false);
  const [issue, setIssue] = useState("");
  const [rawBackup, setRawBackup] = useState<string | null>(null);

  useEffect(() => {
    const refresh = () => {
      const result = readArticleHistoryState();
      setCompleted(result.status === "valid" && result.value.some(record => record.href === canonicalArticleHref(articleHref) && Date.parse(record.completedAt) <= Date.now()));
      if (result.status === "invalid" || result.status === "unavailable") {
        setIssue("기존 읽기 기록을 확인하지 못했습니다. 본문은 계속 볼 수 있으며 원문을 덮어쓰지 않습니다.");
        setRawBackup(result.raw);
      }
    };
    refresh();
    window.addEventListener("focus", refresh);
    window.addEventListener("storage", refresh);
    window.addEventListener(ARTICLE_READING_UPDATED_EVENT, refresh);
    return () => { window.removeEventListener("focus", refresh); window.removeEventListener("storage", refresh); window.removeEventListener(ARTICLE_READING_UPDATED_EVENT, refresh); };
  }, [articleHref]);

  const saveReading = useCallback(() => {
    const result = markArticleAsRead({ href: articleHref, title: articleTitle });
    if (result.status === "saved") { setCompleted(true); setIssue(""); setRawBackup(null); }
    else { setCompleted(false); setIssue("아래까지 보았지만 기기에 기록하지 못했습니다. 원문을 보관하고 저장소 복구 후 다시 확인하세요."); setRawBackup(result.raw); }
  }, [articleHref, articleTitle]);

  useEffect(() => {
    if (progress < 90 || completed || attempted || !observedScroll) return;
    setAttempted(true);
    saveReading();
  }, [attempted, completed, observedScroll, progress, saveReading]);

  useEffect(() => {
    const articleBody = document.getElementById("article-body");
    if (!articleBody) return;

    let frame = 0;
    const updateProgress = () => {
      const rect = articleBody.getBoundingClientRect();
      const start = window.scrollY + rect.top;
      const end = start + articleBody.offsetHeight - window.innerHeight * 0.45;
      const current = window.scrollY + window.innerHeight * 0.3;
      const next = end <= start ? 1 : Math.min(1, Math.max(0, (current - start) / (end - start)));
      setProgress(Math.round(next * 100));
    };

    const onScroll = () => {
      setObservedScroll(true);
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(updateProgress);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActiveId(visible[0].target.id);
      },
      { rootMargin: "-18% 0px -65% 0px", threshold: 0 },
    );

    sections.forEach((section) => {
      const element = document.getElementById(section.id);
      if (element) observer.observe(element);
    });
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", updateProgress);
    updateProgress();

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", updateProgress);
      window.cancelAnimationFrame(frame);
    };
  }, [sections]);

  return (
    <>
      <div className="fixed left-0 right-0 top-16 z-40 h-0.5 bg-border/70" aria-hidden="true">
        <div className="h-full bg-gold transition-[width] duration-150" style={{ width: `${progress}%` }} />
      </div>
      <nav className="mt-8 border-y border-navy/20 py-5" aria-label="이 글의 목차">
        <div className="flex items-center justify-between gap-5">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gold">이 글에서 다루는 내용</p>
          <div className="flex items-center gap-3">
            {completed && <span className="text-xs font-semibold text-navy">✓ 아래까지 본 기록 저장됨</span>}
            <p className="font-mono text-xs text-muted" role="progressbar" aria-label="본문 스크롤 위치" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress}>
              {String(progress).padStart(2, "0")}%
            </p>
          </div>
        </div>
        <p className="mt-2 text-xs text-muted">90% 이상 내려 본 위치를 기록합니다. 내용을 이해하거나 필요한 행동을 마쳤다는 뜻은 아닙니다.</p>
        {issue && <div className="mt-3 rounded border border-amber-400 bg-amber-50 p-3 text-xs"><p role="status">{issue}</p>{rawBackup !== null && <label className="mt-2 block">읽기 기록 원문 백업<textarea readOnly value={rawBackup} onFocus={event => event.target.select()} className="mt-1 min-h-24 w-full border bg-white p-2" /></label>}{progress >= 90 && observedScroll && <button type="button" onClick={saveReading} className="mt-2 min-h-11 font-semibold underline">기록 저장 다시 확인</button>}</div>}
        <ol className="mt-4 grid gap-x-8 gap-y-2 sm:grid-cols-2">
          {sections.map((section, index) => (
            <li key={section.id}>
              <a
                href={`#${section.id}`}
                aria-current={activeId === section.id ? "location" : undefined}
                className={`group flex min-h-10 items-start gap-3 py-2 text-sm leading-6 transition ${
                  activeId === section.id ? "font-semibold text-navy" : "text-muted hover:text-navy"
                }`}
              >
                <span className={`font-mono text-xs ${activeId === section.id ? "text-gold" : "text-muted/60"}`}>
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span>{section.label}</span>
              </a>
            </li>
          ))}
        </ol>
      </nav>
    </>
  );
}
