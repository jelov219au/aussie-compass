"use client";

import { useState } from "react";

type Answer = "yes" | "no" | "unknown";
type ConditionId = "temporary" | "departed" | "ceased" | "status";

const conditions: Array<{ id: ConditionId; label: string; detail: string }> = [
  { id: "temporary", label: "임시비자로 일하며 Super가 적립됐나요?", detail: "Subclass 405·410 등 제외가 있으므로 과거 비자 종류와 ATO 자격 기준을 확인하세요." },
  { id: "departed", label: "이미 호주를 출국했나요?", detail: "호주 안에서는 준비할 수 있지만 DASP를 펀드로 제출할 수 없습니다." },
  { id: "ceased", label: "보유한 모든 호주 임시비자가 만료되거나 취소됐나요?", detail: "한 개의 과거 비자만이 아니라 다른 현재 유효 임시비자도 확인하세요. DASP만을 위해 비자 취소를 권하지 않습니다." },
  { id: "status", label: "호주·뉴질랜드 시민 또는 호주 영주권자가 아닌가요?", detail: "시민권·영주권 상태와 다른 지급 예외는 공식 Super 접근 조건에서 확인하세요." },
];

const answerLabels: Array<{ value: Answer; label: string }> = [
  { value: "yes", label: "예" },
  { value: "no", label: "아니요" },
  { value: "unknown", label: "잘 모름" },
];

export function DaspReadinessCheck() {
  const [answers, setAnswers] = useState<Partial<Record<ConditionId, Answer>>>({});
  const answeredCount = conditions.filter(({ id }) => answers[id]).length;
  const allMatched = conditions.every(({ id }) => answers[id] === "yes");
  const unknownConditions = conditions.filter(({ id }) => answers[id] === "unknown");

  return (
    <section id="dasp-conditions" className="scroll-mt-24 rounded-3xl border border-border bg-white p-5 shadow-sm sm:p-8" aria-labelledby="dasp-ready-heading">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-gold">신청 가능 시점 확인</p>
          <h2 id="dasp-ready-heading" className="mt-2 text-2xl font-semibold text-navy">DASP 기본 조건 점검</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">답변은 이 화면에만 있고 저장·분석·전송하지 않습니다. 자가 점검일 뿐 최종 자격 판정이 아니며, 공식 시스템이 실제 정보를 대조합니다.</p>
        </div>
        <span className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold ${allMatched ? "bg-emerald-100 text-emerald-800" : "bg-surface text-muted"}`}>{answeredCount}/{conditions.length} 답변</span>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {conditions.map((condition) => (
          <fieldset key={condition.id} className="min-w-0 rounded-xl border border-border p-4">
            <legend className="px-1 text-sm font-semibold leading-6 text-navy">{condition.label}</legend>
            <p className="mt-1 text-xs leading-5 text-muted">{condition.detail}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {answerLabels.map((option) => (
                <label key={option.value} className={`inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border px-3 text-sm font-medium ${answers[condition.id] === option.value ? "border-navy bg-navy text-white" : "border-border bg-white text-navy"}`}>
                  <input type="radio" name={`dasp-${condition.id}`} value={option.value} checked={answers[condition.id] === option.value} onChange={() => setAnswers((current) => ({ ...current, [condition.id]: option.value }))} className="h-4 w-4 accent-[var(--color-gold)]" />
                  {option.label}
                </label>
              ))}
            </div>
          </fieldset>
        ))}
      </div>

      <div className={`mt-6 rounded-xl p-4 text-sm leading-6 ${allMatched ? "border border-emerald-300 bg-emerald-50 text-emerald-950" : "bg-surface text-muted"}`} aria-live="polite">
        {answeredCount === 0 ? <p>각 항목에 예·아니요·잘 모름으로 답하면 확인할 조건과 다음 공식 경로를 구분해 보여드립니다.</p> : null}
        {allMatched ? <p>네 가지 기본 조건에 맞는 답을 선택했습니다. 이것은 신청 가능 확정이 아닙니다. <a href="https://applicant.tr.super.ato.gov.au/applicants/default.aspx?pid=1" target="_blank" rel="noreferrer" className="font-semibold text-navy underline decoration-gold underline-offset-4">무료 ATO DASP 온라인 시스템</a>에서 신원·모든 비자·Super 정보를 입력해 실제 자격을 확인하세요.</p> : null}
        {answers.status === "no" ? <p><strong className="text-navy">시민권·영주권 범주:</strong> 이 자가 점검의 일반 DASP 경로와 맞지 않습니다. 다른 예외 지급 자격을 여기서 판정하지 않으므로 <a href="https://www.ato.gov.au/individuals-and-families/super-for-individuals-and-families/super" target="_blank" rel="noreferrer" className="font-semibold text-navy underline decoration-gold underline-offset-4">ATO의 공식 Super 접근 조건</a>을 확인하세요.</p> : null}
        {answers.departed === "no" ? <p><strong className="text-navy">출국 전:</strong> 펀드명·ABN·회원정보, 해외 계정 접근, 지급 방법을 준비하세요. 아직 DASP 제출 완료로 표시하지 마세요.</p> : null}
        {answers.ceased === "no" ? <p><strong className="text-navy">유효 비자 있음:</strong> 모든 임시비자가 종료돼야 하는 기본 조건과 맞지 않습니다. 환급만을 위해 비자를 취소하지 말고 현재 비자와 향후 계획을 먼저 확인하세요.</p> : null}
        {answers.temporary === "no" ? <p><strong className="text-navy">임시비자·Super 조건 불일치:</strong> 기다리면 자동으로 충족된다고 볼 수 없습니다. 과거 비자 종류와 공식 DASP 또는 다른 Super 접근 조건을 확인하세요.</p> : null}
        {unknownConditions.length ? <div><p><strong className="text-navy">아직 확인할 항목:</strong> {unknownConditions.map(({ label }) => label.replace(/\?$/, "")).join(" · ")}</p><p className="mt-2">현재 유효한 비자는 <a href="https://immi.homeaffairs.gov.au/visas/already-have-a-visa/check-visa-details-and-conditions" target="_blank" rel="noreferrer" className="font-semibold text-navy underline decoration-gold underline-offset-4">VEVO</a>에서 확인하세요. VEVO가 모든 과거 비자 기록을 보여준다고 가정하지 말고, 필요한 경우 Home Affairs 기록과 <a href="https://immi.homeaffairs.gov.au/form-listing/forms/1194.pdf" target="_blank" rel="noreferrer" className="font-semibold text-navy underline decoration-gold underline-offset-4">Form 1194 안내</a>를 확인하세요.</p></div> : null}
        {answeredCount > 0 && !allMatched && unknownConditions.length === 0 && conditions.some(({ id }) => !answers[id]) ? <p>답하지 않은 항목을 마저 선택해 주세요. 선택하지 않은 항목을 ‘예’로 간주하지 않습니다.</p> : null}
      </div>

      {answeredCount > 0 ? <button type="button" onClick={() => setAnswers({})} className="mt-4 min-h-11 text-sm font-semibold text-muted underline decoration-border underline-offset-4">이 화면의 답변 초기화</button> : null}
    </section>
  );
}
