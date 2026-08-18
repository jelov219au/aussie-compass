"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  readWeeklyReadingGoal,
  saveWeeklyReadingGoal,
  type ReadArticleRecord,
  type WeeklyReadingTarget,
} from "@/lib/articleProgress";
import { WeeklyCalendarReminder } from "@/components/dashboard/WeeklyCalendarReminder";

export type ResourceSummary = {
  href: string;
  title: string;
  description: string;
  category: string;
  readingTime: string;
};

function getRecommendations(articles: ResourceSummary[], readHrefs: Set<string>, latestHref?: string) {
  const latestIndex = latestHref ? articles.findIndex((article) => article.href === latestHref) : -1;
  const ordered = latestIndex >= 0
    ? [...articles.slice(latestIndex + 1), ...articles.slice(0, latestIndex + 1)]
    : articles;

  return ordered.filter((article) => !readHrefs.has(article.href)).slice(0, 3);
}

function startOfThisWeek() {
  const now = new Date();
  const daysSinceMonday = (now.getDay() + 6) % 7;
  return new Date(now.getFullYear(), now.getMonth(), now.getDate() - daysSinceMonday).getTime();
}

export function ResourceReadingProgress({
  articles,
  readArticles,
}: {
  articles: ResourceSummary[];
  readArticles: ReadArticleRecord[];
}) {
  const [weeklyGoal, setWeeklyGoal] = useState<WeeklyReadingTarget>(3);

  useEffect(() => {
    setWeeklyGoal(readWeeklyReadingGoal());
  }, []);

  if (!articles.length) return null;

  const availableHrefs = new Set(articles.map((article) => article.href));
  const readHrefs = new Set(readArticles.map((article) => article.href).filter((href) => availableHrefs.has(href)));
  const completed = readHrefs.size;
  const progress = Math.round((completed / articles.length) * 100);
  const recommendations = getRecommendations(articles, readHrefs, readArticles[0]?.href);
  const weekStart = startOfThisWeek();
  const completedThisWeek = readArticles.filter((article) => {
    const completedAt = new Date(article.completedAt).getTime();
    return availableHrefs.has(article.href) && Number.isFinite(completedAt) && completedAt >= weekStart;
  }).length;
  const weeklyProgress = Math.min(100, Math.round((completedThisWeek / weeklyGoal) * 100));
  const weeklyGoalComplete = completedThisWeek >= weeklyGoal;
  const chooseWeeklyGoal = (target: WeeklyReadingTarget) => {
    setWeeklyGoal(target);
    saveWeeklyReadingGoal(target);
  };

  return (
    <section className="mt-12 grid border-y border-navy/20 lg:grid-cols-[18rem_minmax(0,1fr)]" aria-labelledby="reading-progress-heading">
      <div className="bg-navy p-7 text-white sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">지금까지 읽은 자료</p>
        <h2 id="reading-progress-heading" className="mt-2 text-2xl font-semibold">
          내 읽기 기록
        </h2>
        <p className="mt-5 font-mono text-4xl text-gold">
          {completed}<span className="text-lg text-white/45"> / {articles.length}</span>
        </p>
        <div
          className="mt-5 h-1.5 overflow-hidden rounded-full bg-white/15"
          role="progressbar"
          aria-label="실용 자료 완독률"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progress}
        >
          <span className="block h-full bg-gold transition-[width]" style={{ width: `${progress}%` }} />
        </div>
        <p className="mt-3 text-sm leading-6 text-white/65">
          글을 거의 다 읽으면 이 기기에 읽은 기록이 자동으로 남아요.
        </p>
        <Link href="/resources" className="mt-5 inline-flex min-h-11 items-center border-b border-gold text-sm font-semibold">
          전체 자료 보기 →
        </Link>

        <div className="mt-7 border-t border-white/15 pt-6">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gold">이번 주 목표</p>
              <h3 className="mt-1 text-lg font-semibold">이번 주 읽기 목표</h3>
            </div>
            <p className="font-mono text-sm text-white/65"><strong className="text-xl text-white">{completedThisWeek}</strong> / {weeklyGoal}</p>
          </div>
          <div className="mt-4 h-1 overflow-hidden rounded-full bg-white/15" aria-hidden="true">
            <span className="block h-full bg-gold transition-[width]" style={{ width: `${weeklyProgress}%` }} />
          </div>
          <fieldset className="mt-4">
            <legend className="sr-only">이번 주 읽을 자료 수</legend>
            <div className="flex gap-2">
              {([1, 3, 5] as WeeklyReadingTarget[]).map((target) => (
                <button
                  key={target}
                  type="button"
                  aria-pressed={weeklyGoal === target}
                  onClick={() => chooseWeeklyGoal(target)}
                  className={`min-h-10 flex-1 border px-2 text-xs font-semibold transition ${weeklyGoal === target ? "border-gold bg-gold text-navy" : "border-white/20 text-white/75 hover:border-white/50"}`}
                >
                  주 {target}개
                </button>
              ))}
            </div>
          </fieldset>
          <p className="mt-3 text-xs leading-5 text-white/60" aria-live="polite">
            {weeklyGoalComplete ? "이번 주 목표를 채웠어요. 천천히 잘 이어가고 있어요." : `이번 주에 ${weeklyGoal - completedThisWeek}개만 더 읽으면 목표를 채울 수 있어요.`}
          </p>
        </div>
        <WeeklyCalendarReminder />
      </div>

      <div className="p-7 sm:p-8 lg:pl-10">
        <div className="flex items-end justify-between gap-4 border-b border-border pb-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gold">다음으로 볼 자료</p>
            <h3 className="mt-1 text-xl font-semibold text-navy">
              {recommendations.length ? "이어서 읽어볼까요?" : "공개된 자료를 모두 읽었어요"}
            </h3>
          </div>
          {recommendations.length > 0 && <span className="font-mono text-xs text-muted">약 {recommendations.reduce((total, article) => total + Number.parseInt(article.readingTime, 10), 0)}분</span>}
        </div>

        {recommendations.length ? (
          <ol>
            {recommendations.map((article, index) => (
              <li key={article.href} className="border-b border-border last:border-b-0">
                <Link href={article.href} className="group grid gap-2 py-5 sm:grid-cols-[2rem_minmax(0,1fr)_auto] sm:items-start sm:gap-4">
                  <span className="font-mono text-xs text-gold">{String(index + 1).padStart(2, "0")}</span>
                  <span>
                    <span className="block text-xs font-semibold text-muted">{article.category} · {article.readingTime}</span>
                    <strong className="mt-1 block text-base leading-6 text-navy">{article.title}</strong>
                    <span className="mt-1 hidden text-sm leading-6 text-muted sm:block">{article.description}</span>
                  </span>
                  <span className="hidden text-lg text-navy transition group-hover:translate-x-1 sm:block" aria-hidden="true">→</span>
                </Link>
              </li>
            ))}
          </ol>
        ) : (
          <div className="py-8">
            <p className="text-lg font-semibold text-navy">여기까지 모두 읽었어요.</p>
            <p className="mt-2 text-sm leading-7 text-muted">새로운 자료가 올라오면 실용 자료 목록과 RSS에서 만날 수 있어요.</p>
            <Link href="/feed.xml" className="mt-4 inline-flex min-h-11 items-center text-sm font-semibold text-navy underline decoration-gold underline-offset-4">새 글 RSS 열기 →</Link>
          </div>
        )}
      </div>
    </section>
  );
}
