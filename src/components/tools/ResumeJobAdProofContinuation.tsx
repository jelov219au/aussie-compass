"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import type { ResumeProEntry } from "@/lib/resumeProAttribution";
import {
  clearResumeJobAdProofSummary,
  readResumeJobAdProofSummary,
  type ResumeJobAdProofSummary,
} from "@/lib/resumeJobAdProofHandoff";

export function ResumeJobAdProofContinuation({ entry }: { entry: ResumeProEntry }) {
  const [summary, setSummary] = useState<ResumeJobAdProofSummary | null>(null);

  useEffect(() => {
    setSummary(entry === "job-ad-checker" ? readResumeJobAdProofSummary() : null);
  }, [entry]);

  if (!summary) return null;

  const dismiss = () => {
    clearResumeJobAdProofSummary();
    setSummary(null);
  };

  return (
    <section className="mt-4 border border-navy/15 bg-white p-4 sm:p-5" aria-labelledby="job-ad-proof-continuation-heading" aria-live="polite">
      <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-center">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#806515]">이 탭의 무료 점검 요약</p>
          <h2 id="job-ad-proof-continuation-heading" className="mt-2 text-lg font-semibold text-navy">
            문구 확인 {summary.matchedCount}개 · 실제 근거 확인 {summary.missingCount}개
          </h2>
          <p className="mt-2 max-w-3xl text-xs leading-5 text-muted">이력서·공고 원문은 저장하지 않았습니다. 표현 후보와 확인 상태만 현재 탭에 최대 30분 남으며, 결제 후 같은 탭의 Pro 작업공간에서 지원서에 불러올 수 있습니다. 서버·URL·분석 이벤트로는 전송되지 않습니다.</p>
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm font-semibold">
          <Link href="/resume-job-ad-checker" className="inline-flex min-h-11 items-center text-navy underline decoration-gold underline-offset-4">무료 점검 다시 보기</Link>
          <button type="button" onClick={dismiss} className="min-h-11 text-muted underline decoration-border underline-offset-4">요약 지우기</button>
        </div>
      </div>
    </section>
  );
}
