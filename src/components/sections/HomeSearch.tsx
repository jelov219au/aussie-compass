"use client";

import { track } from "@vercel/analytics";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { actionClass } from "@/components/ui/actionStyles";
import { sanitizeTransferredSearch, setPendingSearch } from "@/lib/searchTransfer";

const popularSituations = [
  { label: "퇴사·마지막 급여 확인", situation: "job_ending", href: "/resources/australia-job-ending-final-pay-dismissal-guide" },
  { label: "택스리턴 준비물 확인", situation: "tax", href: "/tax-return-guide" },
  { label: "집 방문·계약 체크", situation: "rent", href: "/property-inspection-checklist" },
  { label: "급여가 이상할 때", situation: "pay", href: "/underpayment-guide" },
  { label: "중고차 구매 전 확인", situation: "used_car", href: "/used-car-comparison" },
  { label: "귀국 준비 순서", situation: "leaving", href: "/leaving-australia-guide" },
] as const;

const searchTopics = [
  { topic: "tax", terms: ["세금", "택스", "tax", "tfn", "ato", "bas", "gst", "공제", "환급"] },
  { topic: "pay", terms: ["급여", "월급", "시급", "연봉", "임금", "salary", "wage", "payslip", "최저임금"] },
  { topic: "super", terms: ["super", "연금", "dasp"] },
  { topic: "housing", terms: ["집", "주거", "렌트", "쉐어", "보증금", "rent", "bond", "inspection"] },
  { topic: "jobs", terms: ["취업", "구직", "이력서", "이력서 양식", "공고 맞춤", "커버레터", "면접", "일자리", "resume", "resume template", "ATS", "job ad", "cover letter", "selection criteria", "job", "career", "award"] },
  { topic: "arrival", terms: ["도착", "정착", "은행", "유심", "교통", "운전", "bank", "sim", "licence"] },
  { topic: "visa", terms: ["비자", "워홀", "학생", "visa", "working holiday"] },
  { topic: "safety", terms: ["사기", "안전", "응급", "도움", "체불", "scam", "emergency", "underpayment"] },
  { topic: "leaving", terms: ["귀국", "출국", "퇴거", "leaving", "departure"] },
] as const;

function classifySearch(value: string) {
  const normalized = value.trim().toLocaleLowerCase("ko-KR");
  return searchTopics.find(({ terms }) => terms.some((term) => normalized.includes(term)))?.topic ?? "other";
}

export function HomeSearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");

  function openSearch(value: string, topic: string) {
    const transferredQuery = sanitizeTransferredSearch(value);
    setPendingSearch(transferredQuery);
    try {
      track("Home Search", { topic, entry: "free_text" });
    } catch {
      // Analytics failures must not interrupt the private, queryless navigation.
    }
    router.push("/search");
  }

  function trackSituation(situation: string, destination: string) {
    try {
      track("Home Situation Opened", { situation, destination, surface: "hero_situation" });
    } catch {
      // Fixed navigation must remain available when optional analytics fails.
    }
  }

  return (
    <section className="mt-4" aria-label="지금 할 일과 검색">
            <div className="grid grid-cols-2 gap-2" aria-label="바로 시작하는 여섯 상황">
              {popularSituations.map(({ label, situation, href }) => (
                <Link
                  key={label}
                  href={href}
                  onClick={() => trackSituation(situation, href.slice(1))}
                  className="inline-flex min-h-14 items-center justify-between gap-2 rounded-xl border border-navy/20 bg-white px-3 py-3 text-left text-sm font-semibold leading-6 text-navy transition hover:border-gold hover:bg-gold/5"
                >
                  {label}<span aria-hidden="true">→</span>
                </Link>
              ))}
            </div>
        <details className="mt-4 border-t border-border pt-2">
          <summary className="flex min-h-11 cursor-pointer items-center text-sm font-semibold text-navy">찾는 일이 없나요? 직접 검색하기</summary>
        <form onSubmit={(event) => {
          event.preventDefault();
          openSearch(query, classifySearch(query));
        }} className="min-w-0">
          <div className="sr-only">
            <p className="text-xs font-semibold tracking-[0.14em] text-gold-ink">바로 찾아보기</p>
            <h2 id="home-search-heading" className="mt-2 text-xl font-semibold tracking-tight text-navy sm:text-2xl">
              지금 궁금한 말을 그대로 입력하세요.
            </h2>
          </div>
          <div className="min-w-0">
            <label htmlFor="home-search" className="sr-only">호주 생활 정보 검색</label>
            <div className="flex min-h-14 items-center rounded-2xl border border-navy/25 bg-white p-1.5 shadow-sm transition focus-within:border-navy focus-within:ring-2 focus-within:ring-navy/10">
              <input
                id="home-search"
                type="search"
                autoComplete="off"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="예: 집 구하기"
                className="min-w-0 flex-1 rounded-lg bg-transparent px-2 py-3 text-base text-navy outline-none placeholder:text-muted"
              />
              <button type="submit" className={actionClass("primary", "ml-1 min-h-11 shrink-0 px-4 py-2")}>
                검색
              </button>
            </div>


          </div>
        </form>
        </details>
    </section>
  );
}
