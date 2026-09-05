"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  readWeeklyReadingGoalState,
  saveWeeklyReadingGoal,
  readingThisWeek,
  ARTICLE_READING_UPDATED_EVENT,
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

export function ResourceReadingProgress({
  articles,
  readArticles,
}: {
  articles: ResourceSummary[];
  readArticles: ReadArticleRecord[];
}) {
  const [weeklyGoal, setWeeklyGoal] = useState<WeeklyReadingTarget>(3);
  const [goalMessage, setGoalMessage] = useState("");
  const [goalBlocked, setGoalBlocked] = useState(false);
  const [goalRaw, setGoalRaw] = useState<string | null>(null);
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    const refresh = () => {
      const result = readWeeklyReadingGoalState();
      setNow(new Date());
      setWeeklyGoal(result.status === "valid" ? result.value : 3);
      const blocked = result.status === "invalid" || result.status === "unavailable";
      setGoalBlocked(blocked); setGoalRaw(blocked ? result.raw : null);
      setGoalMessage(blocked ? "저장 목표를 확인하지 못했습니다. 화면에는 기본 3개를 표시하며 원문은 교체하지 않았습니다." : result.status === "valid" ? "기기에 저장한 목표를 불러왔습니다." : "기본 목표입니다. 원하는 수를 선택하면 기기 저장을 시도합니다.");
    };
    refresh(); window.addEventListener("focus", refresh); window.addEventListener("storage", refresh); window.addEventListener(ARTICLE_READING_UPDATED_EVENT, refresh);
    return () => { window.removeEventListener("focus", refresh); window.removeEventListener("storage", refresh); window.removeEventListener(ARTICLE_READING_UPDATED_EVENT, refresh); };
  }, []);

  if (!articles.length) return null;

  const availableHrefs = new Set(articles.map((article) => article.href));
  const readHrefs = new Set(readArticles.filter(article => now && Date.parse(article.completedAt) <= now.getTime()).map((article) => article.href).filter((href) => availableHrefs.has(href)));
  const completed = readHrefs.size;
  const progress = Math.round((completed / articles.length) * 100);
  const recommendations = getRecommendations(articles, readHrefs, readArticles[0]?.href);
  const completedThisWeek = now ? readingThisWeek(readArticles.filter(article => availableHrefs.has(article.href)), now) : 0;
  const weeklyProgress = Math.min(100, Math.round((completedThisWeek / weeklyGoal) * 100));
  const weeklyGoalComplete = completedThisWeek >= weeklyGoal;
  const chooseWeeklyGoal = (target: WeeklyReadingTarget, replaceInvalid = false) => {
    setWeeklyGoal(target);
    const result = saveWeeklyReadingGoal(target, replaceInvalid);
    if (result.status === "saved") { setGoalMessage("목표를 기기에 저장했습니다."); setGoalBlocked(false); setGoalRaw(null); }
    else { setGoalMessage("화면 선택은 바뀌었지만 기기에 저장되지 않았습니다. 기존 목표 원문은 유지됩니다."); setGoalRaw(result.raw); setGoalBlocked(result.status === "invalid" || result.status === "unavailable"); }
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
          aria-label="실용 자료 아래까지 본 비율"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progress}
        >
          <span className="block h-full bg-gold transition-[width]" style={{ width: `${progress}%` }} />
        </div>
        <p className="mt-3 text-sm leading-6 text-white/65">
          본문을 90% 이상 내려 보고 기기 저장에 성공한 기록입니다. 이해나 행동 완료를 뜻하지 않습니다.
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
          <p className="mt-3 text-xs leading-5 text-white/75" role="status">{goalMessage}</p>
          {goalRaw !== null && <label className="mt-2 block text-xs">주간 목표 원문 백업<textarea readOnly value={goalRaw} onFocus={event => event.target.select()} className="mt-1 min-h-20 w-full border bg-white p-2 text-navy" /></label>}
          <button type="button" onClick={() => { if (goalBlocked && !window.confirm("필요한 원문을 백업했나요? 기존 기기 목표를 현재 선택으로 교체합니다.")) return; chooseWeeklyGoal(weeklyGoal, goalBlocked); }} className="mt-2 min-h-11 text-xs underline">{goalBlocked ? "현재 선택으로 목표 저장 복구" : "현재 목표 저장 다시 확인"}</button>
          <p className="mt-3 text-xs leading-5 text-white/60" aria-live="polite">
            {weeklyGoalComplete ? "이번 주 아래까지 본 기록이 목표 수에 도달했습니다." : `이번 주 목표까지 아래까지 본 기록 ${weeklyGoal - completedThisWeek}개가 남았습니다.`}
          </p>
        </div>
        <WeeklyCalendarReminder />
      </div>

      <div className="p-7 sm:p-8 lg:pl-10">
        <div className="flex items-end justify-between gap-4 border-b border-border pb-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gold">다음으로 볼 자료</p>
            <h3 className="mt-1 text-xl font-semibold text-navy">
              {recommendations.length ? "이어서 읽어볼까요?" : "모든 자료에 아래까지 본 기록이 있어요"}
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
            <p className="text-lg font-semibold text-navy">모든 자료를 아래까지 살펴본 기록이 있어요.</p>
            <p className="mt-2 text-sm leading-7 text-muted">새로운 자료가 올라오면 실용 자료 목록과 RSS에서 만날 수 있어요.</p>
            <Link href="/feed.xml" className="mt-4 inline-flex min-h-11 items-center text-sm font-semibold text-navy underline decoration-gold underline-offset-4">새 글 RSS 열기 →</Link>
          </div>
        )}
      </div>
    </section>
  );
}
