"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Container } from "@/components/ui/Container";

const progressKeys = [
  "visa-preparation-project",
  "arrival-first-30-days",
  "house-hunt-project",
  "moving-project",
  "leaving-australia-project",
  "aussie-compass-tax-return-checklist-v1",
  "aussie-compass-job-tracker-v1",
  "aussie-compass-savings-goal-v1",
  "aussie-compass-resume-v1",
  "aussie-compass-salary-calculation",
  "aussie-compass-living-budget-v1",
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
  return count;
}

export function ReturnVisitSection() {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    const refresh = () => setCount(savedCount());
    refresh();
    window.addEventListener("focus", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("focus", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  return (
    <section className="border-b border-navy/20 bg-navy py-6 text-white" aria-label="저장한 작업 이어가기">
      <Container>
        <div className="grid gap-5 sm:grid-cols-[1fr_auto] sm:items-center">
          <div className="flex gap-4">
            <span className="mt-0.5 font-mono text-sm text-gold" aria-hidden="true">↗</span>
            <div>
              <p className="font-semibold">
                {count && count > 0 ? `이 기기에 저장된 ${count}개의 작업이 있습니다.` : "오늘 시작한 일을 다음 방문에도 이어가세요."}
              </p>
              <p className="mt-1 text-sm leading-6 text-white/65">
                로그인 없이 체크리스트, 계산, 이력서와 저장한 페이지를 한곳에서 확인할 수 있습니다.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm font-semibold">
            <Link href="/my-compass" className="inline-flex min-h-11 items-center border-b border-gold">나의 진행 열기 →</Link>
            <Link href="/install" className="inline-flex min-h-11 items-center text-white/75 hover:text-white">홈 화면에 추가</Link>
          </div>
        </div>
      </Container>
    </section>
  );
}
