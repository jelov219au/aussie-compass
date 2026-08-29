"use client";

import { track } from "@vercel/analytics";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Container } from "@/components/ui/Container";
import { actionClass } from "@/components/ui/actionStyles";
import { SEARCH_TRANSFER_STORAGE_KEY, sanitizeTransferredSearch } from "@/lib/searchTransfer";

const popularSearches = [
  { label: "워홀 준비", topic: "visa" },
  { label: "호주 도착 준비", topic: "arrival" },
  { label: "집 구하기", topic: "housing" },
  { label: "TFN", topic: "tax" },
  { label: "이력서 양식", topic: "jobs" },
  { label: "첫 일자리", topic: "jobs" },
  { label: "택스 리턴", topic: "tax" },
  { label: "세후 급여", topic: "pay" },
];

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

  function openSearch(value: string, topic: string, entry: "free_text" | "popular") {
    const transferredQuery = sanitizeTransferredSearch(value);

    try {
      if (transferredQuery) {
        sessionStorage.setItem(SEARCH_TRANSFER_STORAGE_KEY, transferredQuery);
      } else {
        sessionStorage.removeItem(SEARCH_TRANSFER_STORAGE_KEY);
      }
    } catch {
      // Search terms never fall back to URLs or network requests when storage is unavailable.
    }

    try {
      track("Home Search", { topic, entry });
    } catch {
      // Analytics failures must not interrupt the private, queryless navigation.
    }
    router.push("/search");
  }

  return (
    <section className="border-b border-border bg-white" aria-labelledby="home-search-heading">
      <Container className="py-7 sm:py-8">
        <form onSubmit={(event) => {
          event.preventDefault();
          openSearch(query, classifySearch(query), "free_text");
        }} className="grid min-w-0 gap-4 lg:grid-cols-[minmax(14rem,0.55fr)_minmax(0,1.45fr)] lg:items-end lg:gap-8">
          <div className="min-w-0">
            <p className="text-xs font-semibold tracking-[0.14em] text-gold-ink">바로 찾아보기</p>
            <h2 id="home-search-heading" className="mt-2 text-xl font-semibold tracking-tight text-navy sm:text-2xl">
              지금 궁금한 말을 그대로 입력하세요.
            </h2>
          </div>
          <div className="min-w-0">
            <label htmlFor="home-search" className="sr-only">호주 생활 정보 검색</label>
            <div className="flex min-h-16 items-center rounded-2xl border-2 border-navy/15 bg-background px-4 transition focus-within:border-navy focus-within:ring-2 focus-within:ring-navy/10 sm:px-5">
              <span className="mr-3 text-xl text-gold-ink" aria-hidden="true">⌕</span>
              <input
                id="home-search"
                type="search"
                autoComplete="off"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="예: Bond를 돌려받지 못했어요"
                className="min-w-0 flex-1 bg-transparent py-3 text-base text-navy outline-none placeholder:text-muted/60"
              />
              <button type="submit" className={actionClass("primary", "ml-3 min-h-11 shrink-0 px-4 py-2")}>
                검색 <span aria-hidden="true">→</span>
              </button>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
              <span className="text-xs text-muted">처음이라면 여기부터</span>
              {popularSearches.map(({ label, topic }) => (
                <button
                  type="button"
                  key={label}
                  onClick={() => openSearch(label, topic, "popular")}
                  className="inline-flex min-h-9 items-center rounded-full border border-navy/15 bg-surface px-3 text-xs font-semibold text-navy transition hover:border-gold hover:bg-white"
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </form>
      </Container>
    </section>
  );
}
