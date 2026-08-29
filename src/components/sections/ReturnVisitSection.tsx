"use client";

import { useEffect, useState } from "react";
import { TrackedLink } from "@/components/analytics/TrackedLink";
import { Container } from "@/components/ui/Container";
import { ARTICLE_READING_UPDATED_EVENT, readArticleHistory } from "@/lib/articleProgress";
import { RAIL_WORK_ALERT_STORAGE_KEY } from "@/lib/railWorkAlerts";
import { taxPrepRecordsStorageKey } from "@/lib/taxPrepStorage";

const progressKeys = [
  "visa-preparation-project",
  "arrival-first-30-days",
  "house-hunt-project",
  "moving-project",
  "leaving-australia-project",
  "aussie-compass-tax-return-checklist-v1",
  taxPrepRecordsStorageKey,
  "aussie-compass-job-tracker-v1",
  "aussie-compass-savings-goal-v1",
  "aussie-compass-resume-v1",
  "aussie-compass-salary-calculation",
  "aussie-compass-living-budget-v1",
  RAIL_WORK_ALERT_STORAGE_KEY,
  "aussie-compass-life-reminders-v1",
  "hoju-compass-personal-plan-v1",
];

function savedCount() {
  let count = progressKeys.reduce((total, key) => total + (localStorage.getItem(key) ? 1 : 0), 0);
  try {
    const bookmarks = JSON.parse(localStorage.getItem("aussie-compass-bookmarks-v1") ?? "[]");
    if (Array.isArray(bookmarks)) count += bookmarks.length;
  } catch {
    // An invalid local value should not hide the rest of the homepage.
  }
  count += readArticleHistory().length;
  return count;
}

export function ReturnVisitSection() {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    const refresh = () => setCount(savedCount());
    refresh();
    window.addEventListener("focus", refresh);
    window.addEventListener("storage", refresh);
    window.addEventListener(ARTICLE_READING_UPDATED_EVENT, refresh);
    return () => {
      window.removeEventListener("focus", refresh);
      window.removeEventListener("storage", refresh);
      window.removeEventListener(ARTICLE_READING_UPDATED_EVENT, refresh);
    };
  }, []);

  return (
    <section className="border-b border-border bg-surface py-6" aria-label="저장한 작업 이어가기">
      <Container>
        <div className="grid gap-5 rounded-2xl border border-border bg-white px-5 py-5 sm:grid-cols-[1fr_auto] sm:items-center sm:px-6">
          <div className="flex gap-4">
            <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface text-sm text-gold-ink" aria-hidden="true">↗</span>
            <div>
              <p className="font-semibold text-navy">
                {count && count > 0 ? `전에 보던 ${count}개의 기록이 이 기기에 남아 있어요.` : "오늘 시작한 일은 다음에 다시 이어볼 수 있어요."}
              </p>
              <p className="mt-1 text-sm leading-6 text-muted">
                체크리스트와 계산 결과, 이력서, 읽은 자료를 로그인 없이 한곳에서 모아볼 수 있어요.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm font-semibold">
            <TrackedLink href="/my-compass" eventName="Home Navigation" properties={{ section: "return_visit", destination: "my_compass" }} className="inline-flex min-h-11 items-center text-navy">이어서 보기 →</TrackedLink>
            <TrackedLink href="/install" eventName="Home Navigation" properties={{ section: "return_visit", destination: "install" }} className="inline-flex min-h-11 items-center text-muted hover:text-navy">홈 화면에 추가</TrackedLink>
          </div>
        </div>
      </Container>
    </section>
  );
}
