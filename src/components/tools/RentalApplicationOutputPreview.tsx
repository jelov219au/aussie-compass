"use client";

import { useState } from "react";
import { createRentalSummary, stageLabel } from "@/lib/rentalApplicationOutput";
import { rentalApplicationSample } from "@/lib/rentalApplicationSample";

const actionClass = "inline-flex min-h-11 items-center justify-center border border-navy px-4 py-2 text-center text-sm font-semibold text-navy focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-navy";
const summaryClass = "min-h-12 list-inside cursor-pointer px-4 py-3 text-sm font-semibold text-navy focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy";
const outputClass = "max-h-72 overflow-y-auto whitespace-pre-wrap break-words border-t border-border p-4 font-sans text-sm leading-6 text-navy focus-visible:outline-2 focus-visible:outline-navy";

export function RentalApplicationOutputPreview() {
  const [selectedId, setSelectedId] = useState("home-a");
  const active = rentalApplicationSample.applications.find((item) => item.id === selectedId)!;
  const summary = createRentalSummary(rentalApplicationSample, active);

  return <section id="rental-output-preview" aria-labelledby="rental-output-preview-heading" className="scroll-mt-24 border border-border bg-white p-5 sm:p-7">
    <p className="text-xs font-semibold tracking-wide text-[#806315]">결제 전 결과물 확인</p>
    <h2 id="rental-output-preview-heading" className="mt-2 text-2xl font-semibold text-navy">두 집의 준비와 연락이 어떻게 달라질까요?</h2>
    <p className="mt-3 text-sm leading-6 text-muted">가상 예시 · 실제 신청 아님. 집 이름·금액·날짜·연락 기록은 모두 예시이며, 날짜는 개인 재확인 일정입니다. 후보를 고르면 실제 작업공간과 같은 방식으로 만든 문구와 TXT를 볼 수 있습니다.</p>
    <div className="mt-5 grid gap-3 sm:grid-cols-2" aria-label="가상 집 후보 선택">
      {rentalApplicationSample.applications.map((item, index) => <button key={item.id} type="button" aria-pressed={active.id === item.id} aria-controls="rental-sample-panel" onClick={() => setSelectedId(item.id)} className={`min-h-20 border-2 p-4 text-left focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-navy ${active.id === item.id ? "border-gold bg-gold/10" : "border-border bg-white hover:bg-surface"}`}>
        <span className="flex items-center justify-between gap-2 text-sm font-semibold text-navy"><span>가상 후보 {index === 0 ? "A" : "B"} · {item.jurisdiction}</span>{active.id === item.id && <span className="text-xs text-[#806315]">선택됨</span>}</span>
        <span className="mt-2 block text-sm text-muted">{index === 0 ? "신청 후 확인 · 주 A$620 · 연락 1건" : "신청 준비 · 임대료 미입력 · 연락 없음"}</span>
      </button>)}
    </div>
    <div id="rental-sample-panel" key={active.id} className="mt-5">
      <p className="text-sm font-semibold text-navy" role="status">{active.propertyLabel} · {stageLabel(active.stage)}</p>
      <dl className="mt-4 grid gap-4 border-y border-border py-4 text-sm sm:grid-cols-3">
        <div><dt className="text-muted">입력한 주 임대료</dt><dd className="mt-1 font-semibold text-navy">{active.weeklyRent ? `A$${active.weeklyRent}` : "미입력 → Not set"}</dd></div>
        <div><dt className="text-muted">신청일</dt><dd className="mt-1 font-semibold text-navy">{active.applicationDate || "미입력 → Not set"}</dd></div>
        <div><dt className="text-muted">다음 재확인</dt><dd className="mt-1 font-semibold text-navy">{active.nextActionDate}</dd></div>
      </dl>
      <p className="mt-4 whitespace-pre-line text-sm leading-6 text-muted">{active.notes}</p>
      <div className="mt-5 flex flex-wrap gap-3">
        <a href={`/rental-application-pro/sample.txt?candidate=${active.id}`} download className={`${actionClass} bg-navy text-white`}>이 후보 TXT 내려받기</a>
        <a href={`/rental-application-pro/sample.json?candidate=${active.id}`} download className={actionClass}>집별 JSON 예시</a>
      </div>
      <p className="mt-3 text-xs leading-5 text-muted">원본 증빙은 포함되지 않습니다. 집별 JSON은 한 후보의 보관용 파일이며, 복원에는 작업공간의 ‘전체 백업’ 파일이 필요합니다.</p>
      <div className="mt-5 space-y-3">
        <details className="border border-border"><summary className={summaryClass}>영문 문구 보기 · {active.id === "home-a" ? "제출 후 확인" : "인스펙션 후 문의"}</summary><pre lang="en" tabIndex={0} aria-label="가상 영문 문구" className={outputClass}>{active.messages[active.id === "home-a" ? "followUp" : "inspection"]}</pre></details>
        <details className="border border-border"><summary className={summaryClass}>전체 TXT 보기 · 준비 상태와 영문 문구 3종</summary><pre tabIndex={0} aria-label="가상 후보 전체 TXT" className={outputClass}>{summary}</pre></details>
      </div>
    </div>
  </section>;
}
