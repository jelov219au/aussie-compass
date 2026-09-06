"use client";

import { useMemo, useState } from "react";
import { deriveOneSuperPaydayNextAction, type EarningsBasis, type EvidenceState, type SuperPaydayInput, type WorkerScope, verifiedJuly2026Calendar } from "@/lib/superPaydayNextAction";

type Context = NonNullable<SuperPaydayInput["contributionContext"]>;

const workerOptions: Array<[WorkerScope, string]> = [
  ["employee_18_plus", "만 18세 이상 employee"],
  ["under_18_over_30_hours", "만 18세 미만 · 그 주 30시간 초과"],
  ["under_18_not_over_30_hours", "만 18세 미만 · 그 주 30시간 이하"],
  ["private_domestic", "개인 가정의 가사 근로"],
  ["labour_contractor", "계약이 주로 내 개인 노동·기술인 contractor"],
  ["other_or_unknown", "구분이 확실하지 않음"],
];
const earningOptions: Array<[EarningsBasis | "award", string]> = [
  ["qe_or_ote_categories_confirmed", "ordinary pay 등 OTE/QE 항목을 구분함"],
  ["categories_incomplete", "일부 항목만 알아 추가 확인 필요"],
  ["award", "award·agreement의 추가 Super 조항 확인 필요"],
  ["unknown", "아직 항목을 구분하지 못함"],
];
const contextOptions: Array<[Context, string]> = [
  ["ordinary", "기존 직원 · 같은 적격 fund의 일반 납부"],
  ["new_employee_first", "새 직원의 첫 적격 납부"],
  ["new_fund_first", "기존 직원이 새 적격 fund로 바꾼 뒤 첫 납부"],
  ["employer_internal_first", "고용주가 단지 ‘첫 송금’이라고만 설명"],
  ["transition_q4", "2026년 4–6월 마지막 분기분"],
  ["exception_or_unknown", "비정기 지급·겹친 기한·예외 여부 불명"],
];
const evidenceOptions = [
  ["unknown", "아직 payslip·fund를 대조하지 않음"],
  ["payslip_only", "payslip 또는 고용주 ‘보냄’만 확인"],
  ["fund_received", "fund의 receipt·allocation을 확인"],
  ["fund_missing", "fund에 없고 고용주·fund 확인 전"],
  ["fund_missing_checked", "기한 뒤 고용주·fund 모두 확인했지만 없음/잘못된 fund"],
  ["rejected_or_returned", "fund가 reject·return·member-match 문제를 확인"],
  ["mygov_only", "myGov/ATO 표시만 확인"],
  ["evidence_conflict", "payslip·fund·myGov 표시가 서로 다름"],
] as const;

const fields = ["payday_scope", "worker_scope", "earnings_basis", "rate_and_estimate", "receipt_deadline", "evidence_state", "role_and_handoff", "privacy_boundary", "next_action"] as const;
const actionCopy = {
  compare_one_payday: ["한 급여일 기록을 나란히 비교하세요", "payslip 금액, fund receipt·allocation 날짜를 한 급여일 기준으로 맞춰 보세요."],
  wait_until_due: ["표시된 확인일까지 기다린 뒤 fund를 다시 보세요", "payslip이나 고용주의 ‘보냄’은 fund 수령과 다릅니다."],
  ask_employer_payroll: ["Employer·Payroll에 한 급여일 정보를 물어보세요", "QE 항목, 12% 계산 기준, 실제 송금일, fund, 거래번호 마지막 8자, reject·return 여부만 요청하세요."],
  ask_fund: ["Fund에 실제 수령·배정 상태를 물어보세요", "해당 급여일의 receipt date, allocation date, member-match, reject·return 상태만 확인하세요."],
  check_mygov: ["myGov의 ATO Super 화면을 보조 확인하세요", "표시 시차가 있을 수 있으므로 fund 거래내역과 함께 확인하세요."],
  report_to_ato: ["ATO unpaid super 절차에서 신고 가능 범위를 확인하세요", "신고는 미납액 확정이나 회수 성공을 뜻하지 않습니다."],
  check_award_agreement: ["Fair Work에서 payslip·award·agreement 범위를 확인하세요", "법정 SG 집행은 ATO가 담당하며, award·agreement에는 추가 Super 조항이 있을 수 있습니다."],
  seek_advice: ["ATO 또는 등록 전문가에게 적용 범위를 확인하세요", "ABN이나 낮은 월소득 하나만으로 자격·미납액을 결론 내리지 마세요."],
  cannot_conclude: ["빠진 정보를 확인하기 전에는 결론 내리지 마세요", "자격, 계산 대상, 기한 또는 실제 fund 수령 중 하나 이상이 아직 불명확합니다."],
} as const;

const officialRoutes = {
  compare_one_payday: ["ATO SG 비율·기준", "https://www.ato.gov.au/tax-rates-and-codes/key-superannuation-rates-and-thresholds/super-guarantee"],
  wait_until_due: ["ATO Payday Super 납부기한", "https://www.ato.gov.au/businesses-and-organisations/super-for-employers/paying-super-on-payday/payment-deadlines-for-payday-super"],
  ask_employer_payroll: ["Fair Work payslip·기록 안내", "https://www.fairwork.gov.au/tools-and-resources/fact-sheets/rights-and-obligations/record-keeping-pay-slips"],
  ask_fund: ["ATO 미납 Super 확인 순서", "https://www.ato.gov.au/individuals-and-families/super-for-individuals-and-families/super/growing-and-keeping-track-of-your-super/unpaid-super-from-your-employer"],
  check_mygov: ["myGov에서 ATO 연결", "https://my.gov.au/en/about/help/mygov-website/link-services-to-your-account/link-the-australian-taxation-office"],
  report_to_ato: ["ATO unpaid super 절차", "https://www.ato.gov.au/individuals-and-families/super-for-individuals-and-families/super/growing-and-keeping-track-of-your-super/unpaid-super-from-your-employer"],
  check_award_agreement: ["Fair Work Tax and super", "https://www.fairwork.gov.au/pay-and-wages/tax-and-superannuation"],
  seek_advice: ["ATO contractor Super 기준", "https://www.ato.gov.au/businesses-and-organisations/super-for-employers/work-out-if-you-have-to-pay-super/super-for-independent-contractors"],
  cannot_conclude: ["ATO SG 자격·비율 안내", "https://www.ato.gov.au/tax-rates-and-codes/key-superannuation-rates-and-thresholds/super-guarantee"],
} as const;

export function SuperPaydayNextAction() {
  const [step, setStep] = useState(0);
  const [payday, setPayday] = useState("");
  const [workerScope, setWorkerScope] = useState<WorkerScope | "">("");
  const [earnings, setEarnings] = useState<EarningsBasis | "award" | "">("");
  const [context, setContext] = useState<Context | "">("");
  const [evidenceChoice, setEvidenceChoice] = useState<(typeof evidenceOptions)[number][0] | "">("");
  const result = useMemo(() => {
    if (!payday || !workerScope || !earnings || !context || !evidenceChoice) return null;
    const evidenceState: EvidenceState = evidenceChoice === "fund_missing_checked" ? "fund_missing" : evidenceChoice;
    const checked = evidenceChoice === "fund_missing_checked";
    return deriveOneSuperPaydayNextAction({
      payday,
      asOf: new Date().toISOString().slice(0, 10),
      workerScope,
      earningsBasis: earnings === "award" ? "categories_incomplete" : earnings,
      awardOrAgreementExtra: earnings === "award",
      contributionContext: context,
      evidenceState,
      employerAsked: checked,
      fundChecked: checked,
      minimumRecordsReady: checked,
      contractorFactsUncertain: workerScope === "other_or_unknown" && context === "exception_or_unknown",
    }, verifiedJuly2026Calendar);
  }, [context, earnings, evidenceChoice, payday, workerScope]);

  const reset = () => { setStep(0); setPayday(""); setWorkerScope(""); setEarnings(""); setContext(""); setEvidenceChoice(""); };
  const selectClass = "mt-3 min-h-12 w-full rounded-lg border border-navy/30 bg-white px-3 text-base text-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy";
  const route = result
    ? result.outcome.next_action === "seek_advice" && result.outcome.worker_scope !== "labour_contractor"
      ? ["ATO SG 자격·비율 안내", "https://www.ato.gov.au/tax-rates-and-codes/key-superannuation-rates-and-thresholds/super-guarantee"] as const
      : officialRoutes[result.outcome.next_action]
    : null;
  const exactDate = result?.nextCheckDate;

  return <section data-super-next-action data-step={step} data-outcome={result?.outcome.next_action ?? "not_ready"} className="mb-8 border-2 border-navy bg-white p-4 shadow-sm sm:p-6" aria-labelledby="one-super-payday-heading">
    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gold-ink">one_super_payday_next_action</p>
    <h2 id="one-super-payday-heading" className="mt-1 text-xl font-semibold text-navy">한 급여일만 골라 다음 확인을 정하세요</h2>
    <p className="mt-2 text-sm leading-6 text-muted">계정·업로드·자동 저장 없이 이 화면의 메모리에서만 판단합니다. 새로고침하면 선택은 사라집니다.</p>

    {step === 0 && <div className="mt-4"><button type="button" onClick={() => setStep(1)} className="inline-flex min-h-12 w-full items-center justify-center rounded-lg bg-navy px-5 text-sm font-semibold text-white sm:w-auto">한 급여일 비교 시작 →</button><p className="mt-3 text-xs leading-5 text-muted">근무일이나 급여기간 종료일 대신 실제 지급일을 사용하세요.</p></div>}
    {step === 1 && <Step label="1 / 5 · 실제 지급일" note="2026-07-01 이전은 OTE·분기 규칙, 당일 이후는 QE·Payday Super 규칙으로 나눕니다."><input aria-label="실제 지급일" type="date" value={payday} onChange={e => setPayday(e.target.value)} className={selectClass} /><Next disabled={!payday} onClick={() => setStep(2)} /></Step>}
    {step === 2 && <Step label="2 / 5 · 근로자 범위" note="만 18세 미만은 그 주 30시간 ‘초과’와 30시간 이하를 구분합니다."><Select ariaLabel="근로자 범위" value={workerScope} onChange={v => setWorkerScope(v as WorkerScope)} options={workerOptions} className={selectClass} /><Next disabled={!workerScope} onClick={() => setStep(3)} /></Step>}
    {step === 3 && <Step label="3 / 5 · OTE/QE 항목" note="전체 gross에 자동으로 12%를 곱하지 않습니다. 월 A$450 기준은 2022-07-01부터 폐지됐습니다."><Select ariaLabel="OTE 또는 QE 항목 확인 상태" value={earnings} onChange={v => setEarnings(v as EarningsBasis | "award")} options={earningOptions} className={selectClass} /><Next disabled={!earnings} onClick={() => setStep(4)} /></Step>}
    {step === 4 && <Step label="4 / 5 · 납부 기한 범위" note="새 직원·새 적격 fund의 첫 납부만 20영업일일 수 있습니다. 고용주의 내부 ‘첫 송금’은 해당하지 않습니다."><Select ariaLabel="납부 기한 범위" value={context} onChange={v => setContext(v as Context)} options={contextOptions} className={selectClass} /><Next disabled={!context} onClick={() => setStep(5)} /></Step>}
    {step === 5 && <Step label="5 / 5 · 지금 가진 증거" note="payslip 표시·고용주 송금·clearing 처리·fund 수령·myGov 표시는 서로 다른 상태입니다."><Select ariaLabel="현재 증거 상태" value={evidenceChoice} onChange={v => setEvidenceChoice(v as typeof evidenceChoice)} options={evidenceOptions.map(([v,l]) => [v,l])} className={selectClass} /><Next disabled={!evidenceChoice} onClick={() => setStep(6)} label="한 행동 보기" /></Step>}

    {step === 6 && result && route && <div className="mt-4 border-t border-navy/20 pt-4" aria-live="polite">
      <p className="text-xs font-semibold text-gold-ink">{result.outcomeStatus}</p>
      <h3 className="mt-1 text-lg font-semibold text-navy">{actionCopy[result.outcome.next_action][0]}</h3>
      <p className="mt-2 text-sm leading-6 text-muted">{actionCopy[result.outcome.next_action][1]}</p>
      {exactDate ? <p className="mt-2 text-sm font-semibold text-navy">확인 기준일: {exactDate}{result.outcome.receipt_deadline === "transition_2026_07_28" ? " · 마지막 2026 Q4 fund 수령일" : " · 주말을 제외한 검증 fixture 기준"}</p> : <p className="mt-2 text-sm font-semibold text-navy">정확한 개인 기한은 공식 달력·예외를 확인하기 전 UNKNOWN입니다.</p>}
      <a href={route[1]} target="_blank" rel="noreferrer" className="mt-4 inline-flex min-h-12 w-full items-center justify-between rounded-lg bg-navy px-5 text-sm font-semibold text-white sm:w-auto sm:min-w-80"><span>{route[0]}</span><span aria-hidden="true">↗</span></a>
      <p className="mt-3 text-xs leading-5 text-muted">확인일 2026-09-07 · 외부 공식 사이트는 인터넷 연결이 필요합니다. 링크를 열거나 질문을 작성해도 제출·수령·해결로 바뀌지 않습니다.</p>
      <p className="mt-2 border-l-4 border-gold bg-surface p-3 text-xs leading-5 text-navy">TFN, 전체 회원·계좌번호, myGov 비밀번호·OTP, 전체 payslip·statement·contract 원문은 이 사이트나 일반 이메일에 입력하지 마세요. 거래 참조는 마지막 8자만 남기세요.</p>
      <details className="mt-2 text-sm"><summary className="flex min-h-11 cursor-pointer items-center font-semibold text-navy">9개 판정 필드 보기</summary><dl className="grid gap-2 sm:grid-cols-3">{fields.map(field => <div key={field} className="border border-border bg-surface p-3"><dt className="font-mono text-xs text-muted">{field}</dt><dd className="mt-1 break-words text-sm font-semibold text-navy">{result.outcome[field]}</dd></div>)}</dl></details>
      <button type="button" onClick={reset} className="mt-3 inline-flex min-h-11 items-center border-b-2 border-navy text-sm font-semibold text-navy">다른 급여일로 다시 확인</button>
    </div>}
  </section>;
}

function Step({ label, note, children }: { label: string; note: string; children: React.ReactNode }) {
  return <div className="mt-4"><p className="text-sm font-semibold text-navy">{label}</p><p className="mt-1 text-xs leading-5 text-muted">{note}</p>{children}</div>;
}

function Select({ ariaLabel, value, onChange, options, className }: { ariaLabel: string; value: string; onChange: (value: string) => void; options: ReadonlyArray<readonly [string,string]>; className: string }) {
  return <select aria-label={ariaLabel} value={value} onChange={e => onChange(e.target.value)} className={className}><option value="">선택하세요</option>{options.map(([id,label]) => <option key={id} value={id}>{label}</option>)}</select>;
}

function Next({ disabled, onClick, label = "계속" }: { disabled: boolean; onClick: () => void; label?: string }) {
  return <button type="button" disabled={disabled} onClick={onClick} className="mt-3 inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-navy px-5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-45 sm:w-auto">{label} →</button>;
}
