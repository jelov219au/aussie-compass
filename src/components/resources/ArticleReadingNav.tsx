"use client";

import { useEffect, useState } from "react";
import { markArticleAsRead, readArticleHistory } from "@/lib/articleProgress";

type ReadingSection = { id: string; label: string };
type ReadingArticle = { href: string; title: string };

export function ArticleReadingNav({ sections, article }: { sections: ReadingSection[]; article: ReadingArticle }) {
  const { href: articleHref, title: articleTitle } = article;
  const [activeId, setActiveId] = useState(sections[0]?.id ?? "");
  const [progress, setProgress] = useState(0);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    setCompleted(readArticleHistory().some((record) => record.href === articleHref));
  }, [articleHref]);

  useEffect(() => {
    if (progress < 90 || completed) return;
    markArticleAsRead({ href: articleHref, title: articleTitle });
    setCompleted(true);
  }, [articleHref, articleTitle, completed, progress]);

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
    window.addEventListener("resize", onScroll);
    updateProgress();

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
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
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gold">In this guide</p>
          <div className="flex items-center gap-3">
            {completed && <span className="text-xs font-semibold text-navy">✓ 읽음 완료</span>}
            <p className="font-mono text-xs text-muted" role="progressbar" aria-label="읽기 진행률" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress}>
              {String(progress).padStart(2, "0")}%
            </p>
          </div>
        </div>
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
