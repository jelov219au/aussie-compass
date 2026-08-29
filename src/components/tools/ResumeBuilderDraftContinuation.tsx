"use client";

import { useEffect, useState } from "react";

import { resumeStorageKey } from "@/lib/resumeProDeviceStorage";
import { summarizeResumeBuilderDraft, type ResumeBuilderDraftSummary } from "@/lib/resumeBuilderDraftSummary";

export function ResumeBuilderDraftContinuation({ checkoutAvailable }: { checkoutAvailable: boolean }) {
  const [summary, setSummary] = useState<ResumeBuilderDraftSummary | null>(null);

  useEffect(() => {
    try {
      setSummary(summarizeResumeBuilderDraft(window.localStorage.getItem(resumeStorageKey)));
    } catch {
      // Private or unavailable browser storage must not interrupt the offer page.
    }
  }, []);

  if (!summary) return null;

  return (
    <section className="mt-5 border-l-2 border-[#3f6d5c] bg-[#3f6d5c]/8 px-5 py-4 sm:px-6" aria-labelledby="resume-builder-draft-continuation-heading">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#315f4e]">같은 브라우저에서 바로 이어서</p>
      <h2 id="resume-builder-draft-continuation-heading" className="mt-2 text-xl font-semibold text-navy">이 기기에 저장된 무료 이력서를 확인했어요.</h2>
      <p className="mt-3 font-mono text-xs text-navy" aria-label={`기본 항목 7개 중 ${summary.essentialCount}개, 경력 ${summary.experienceCount}개, 기술 ${summary.skillCount}개 저장됨`}>
        기본 항목 {summary.essentialCount}/7 · 경력 {summary.experienceCount}개 · Skills {summary.skillCount}개
      </p>
      <p className="mt-3 max-w-3xl text-sm leading-6 text-muted">
        {checkoutAvailable ? "결제 후" : "판매가 시작된 뒤"} 같은 브라우저에서 Resume Pro 작업공간에 자동 연결돼, 이름과 경력을 다시 입력하지 않아도 됩니다.
      </p>
      <p className="mt-2 max-w-3xl text-xs leading-5 text-muted">항목 수만 이 화면에서 계산합니다. 이력서 원문·이름·연락처는 서버, URL 또는 분석 이벤트로 보내지 않습니다.</p>
    </section>
  );
}
