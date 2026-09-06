"use client";

import { useRef, useState } from "react";
import { buildJobEndDeadline, JOB_END_ACTIONS, jobEndDueLabel, jobEndToday, type JobEndInput, type JobEndResult } from "@/lib/jobEndDeadline";

const control = "mt-1 min-h-11 w-full min-w-0 max-w-full rounded-lg border border-slate-400 bg-white px-3 py-2 text-sm text-navy focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy";
const action = "mt-3 inline-flex min-h-11 max-w-full items-center justify-center rounded-lg bg-gold px-4 py-3 text-left text-sm font-semibold text-navy focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white";
const initial: JobEndInput = { event: "unknown", today: "" };

function guidance(r: JobEndResult): string {
  if (r.due_state === "official_source_unavailable") return "공식 내용을 확인할 수 없어 기한 계산을 멈췄어요. 기한이 임박했거나 생활비가 급하면 재확인일까지 기다리지 말고 해당 기관에 문의하세요.";
  if (r.due_state === "overdue_action_required") return "지급·서류 문제 또는 긴급한 생활비 상황을 직접 문의하세요. 이 안내는 위법·미지급액·신청 결과를 판정하지 않아요.";
  if (r.due_state === "certificate_due_14_days_from_request") return "확인한 요청일에 14일을 더했어요. 요청서에 적힌 기한도 대조하세요. 주말이라고 다음 영업일로 바꾸지 않아요.";
  if (r.due_state === "due_before_or_on_termination_day") return "확인한 통지수당에 적용하는 날짜예요. 다른 마지막 급여 항목의 7일 규칙과 구분하세요.";
  if (r.due_state === "instrument_due_verified") return "직접 확인한 적용 조항으로 계산했어요. 금액이 맞거나 실제 입금됐다는 뜻은 아니에요. 주말에도 날짜를 자동 연장하지 않아요.";
  if (r.due_state === "not_applicable") return "지금 고른 사건의 조건에만 해당해요. 다른 급여·서류·해고 신청기한은 따로 확인하세요.";
  return "조건이나 날짜가 확인되지 않으면 기한을 계산하지 않아요. 공식 안내와 실제 기록을 먼저 대조하세요.";
}

export function JobEndDeadlineNextAction() {
  const [input, setInput] = useState<JobEndInput>(initial);
  const eventRef = useRef<HTMLSelectElement>(null);
  const update = (patch: Partial<JobEndInput>) => setInput((previous) => ({ ...previous, ...patch, today: jobEndToday() }));
  const result = buildJobEndDeadline(input);
  const isFinal = input.event === "final_pay_under_instrument";
  const isNotice = input.event === "payment_in_lieu";
  const isCertificate = input.event === "requested_employment_certificate";
  const requested = ["recipientRequested", "employerEmployeeRequest", "employerAgencyRequest"].includes(input.certificate ?? "");
  const recipient = input.certificate === "recipientRequested";
  const payItem = !input.finalItem || input.finalItem === "pay";

  function checkbox(key: "paymentMissing" | "publicHolidayRuleUnknown" | "certificateOutstanding" | "cannotGetCertificate" | "hardship" | "urgentLoss" | "sourceUnavailable", label: string) {
    return <label className="flex min-h-11 cursor-pointer items-center gap-3 py-2 text-sm leading-6 text-navy"><input type="checkbox" checked={Boolean(input[key])} onChange={(event) => update({ [key]: event.target.checked })} className="h-5 w-5 shrink-0 accent-navy" />{label}</label>;
  }

  return (
    <section className="mt-5 rounded-2xl border-2 border-gold bg-white p-4 sm:p-6" data-job-end-deadline aria-labelledby="job-end-heading">
      <h2 id="job-end-heading" className="text-lg font-semibold text-navy">지금 확인할 기한 한 가지</h2>
      <label className="mt-3 block text-sm font-semibold text-navy">돈·서류 종류
        <select ref={eventRef} value={input.event} onChange={(event) => setInput({ ...initial, event: event.target.value as JobEndInput["event"], today: jobEndToday() })} className={control}>
          <option value="unknown">아직 구분하기 어려워요</option>
          <option value="final_pay_under_instrument">마지막 급여 · Final pay</option>
          <option value="payment_in_lieu">통지 대신 지급하는 수당 · Payment in lieu</option>
          <option value="requested_employment_certificate">고용 종료 증명서 · Separation Certificate</option>
        </select>
      </label>
      {isFinal && <div className="mt-3 space-y-3">
        <label className="block text-sm font-semibold text-navy">확인할 급여 항목
          <select value={input.finalItem ?? "pay"} onChange={(event) => update({ finalItem: event.target.value as JobEndInput["finalItem"] })} className={control}>
            <option value="pay">마지막 급여 지급일</option><option value="redundancy">Redundancy 수당</option><option value="annualLeave">미사용 연차·Leave loading</option><option value="sickLeave">병가·돌봄 휴가</option><option value="super">Super 납부</option>
          </select>
        </label>
        {payItem && <>
          <label className="block text-sm font-semibold text-navy">직접 확인한 적용 조항
            <select value={input.instrument ?? "unknown"} onChange={(event) => update({ instrument: event.target.value as JobEndInput["instrument"], verifiedDue: "", publicHolidayRuleUnknown: false })} className={control}>
              <option value="unknown">아직 확인하지 못했어요</option><option value="award_unknown">Award 적용 여부를 몰라요</option><option value="agreement_unknown">Agreement는 있지만 조항을 몰라요</option><option value="contract_only">Contract만 봤고 최소 권리는 미확인</option><option value="award_free">Award가 없고 지급 조항도 미확인</option><option value="verified7">적용 조항의 종료 뒤 7일을 확인했어요</option><option value="verifiedDate">적용 조항의 특정 지급일을 확인했어요</option>
            </select>
          </label>
          <p className="text-xs leading-5 text-slate-600">Award·Agreement와 NES 우선 적용을 함께 확인한 조항만 선택하세요. ‘대부분 7일’이라는 일반 설명만으로는 부족해요.</p>
          {input.instrument === "verifiedDate" ? <label className="block text-sm font-semibold text-navy">조항으로 확인한 지급일<input type="date" value={input.verifiedDue ?? ""} onChange={(event) => update({ verifiedDue: event.target.value })} className={control} /></label> : <label className="block text-sm font-semibold text-navy">확정된 고용 종료일 · 모르면 비워두세요<input type="date" value={input.terminationDate ?? ""} onChange={(event) => update({ terminationDate: event.target.value })} className={control} /></label>}
          {checkbox("publicHolidayRuleUnknown", "예정일이 공휴일인데 날짜 이동 조항은 확인하지 못했어요")}
          {checkbox("paymentMissing", "실제 입금이 없거나 급여명세·입금·항목에 차이가 있어요")}
        </>}
      </div>}
      {isNotice && <div className="mt-3 space-y-3">
        <label className="block text-sm font-semibold text-navy">통지기간 처리 방식
          <select value={input.notice ?? "unknown"} onChange={(event) => update({ notice: event.target.value as JobEndInput["notice"] })} className={control}>
            <option value="unknown">적용 여부·처리 방식이 미확인이에요</option><option value="payout">고용주가 통지기간 대신 지급 · 적용 확인</option><option value="partial">일부 근무하고 나머지 지급 · 적용 확인</option><option value="worked">통지기간을 모두 근무 · 대체 지급 없음</option>
          </select>
        </label>
        {input.notice !== "worked" && <><label className="block text-sm font-semibold text-navy">확정된 고용 종료일 · 서로 다르면 비워두세요<input type="date" value={input.terminationDate ?? ""} onChange={(event) => update({ terminationDate: event.target.value })} className={control} /></label>{checkbox("paymentMissing", "실제 지급 또는 지급 기록을 받지 못했어요")}</>}
      </div>}
      {isCertificate && <div className="mt-3 space-y-3">
        <label className="block text-sm font-semibold text-navy">요청과 수급 조건
          <select value={input.certificate ?? "unknown"} onChange={(event) => update({ certificate: event.target.value as JobEndInput["certificate"], requestDate: "", certificateOutstanding: false, cannotGetCertificate: false, hardship: false })} className={control}>
            <option value="unknown">누가 요청했는지·조건을 아직 몰라요</option><option value="recipientRequested">현재 수급 중이며 서류 요청을 받았어요</option><option value="newClaim">새로 신청 중 · 아직 서류 요청 없음</option><option value="noRequest">수급·신청·서류 요청 모두 없어요</option><option value="employerEmployeeRequest">고용주 입장 · 직원에게 요청받았어요</option><option value="employerAgencyRequest">고용주 입장 · Services Australia 요청</option>
          </select>
        </label>
        {requested && <><label className="block text-sm font-semibold text-navy">실제 서류 요청일 · 모르면 비워두세요<input type="date" value={input.requestDate ?? ""} onChange={(event) => update({ requestDate: event.target.value })} className={control} /></label>{checkbox("certificateOutstanding", "아직 서류를 제출·제공하지 못했어요")}</>}
        {recipient && <>{checkbox("cannotGetCertificate", "이전 고용주에게 Certificate를 받을 수 없어요")}{checkbox("hardship", "이 서류 문제와 함께 긴급한 생활비 어려움이 있어요")}</>}
      </div>}
      {input.event !== "unknown" && !isCertificate && checkbox("urgentLoss", "오늘 필수 생활비를 충당할 수 없고 급여를 받지 못했어요")}
      <div className="mt-4 rounded-xl bg-navy p-4 text-white" data-job-end-result={JSON.stringify(result)}>
        <div role="status" aria-live="polite" aria-atomic="true"><p className="font-semibold leading-6">{jobEndDueLabel(result)}</p><p className="mt-2 text-sm leading-6 text-white/90">{guidance(result)}</p></div>
        {result.next_action === "choose_event_type" ? <button type="button" className={action} onClick={() => eventRef.current?.focus()}>{JOB_END_ACTIONS[result.next_action]}</button> : <a href={result.official_route} target="_blank" rel="noreferrer" referrerPolicy="no-referrer" className={action}>{JOB_END_ACTIONS[result.next_action]} <span className="ml-2" aria-hidden="true">↗</span><span className="sr-only"> (공식 사이트, 새 창)</span></a>}
        {result.next_action !== "choose_event_type" && <p className="mt-2 text-xs leading-5 text-white/90">공식 사이트는 인터넷 연결이 필요해요. 여기 입력한 날짜·선택값은 보내지 않아요.</p>}
      </div>
      <details className="mt-3 text-sm text-navy"><summary className="min-h-11 cursor-pointer py-3 font-semibold">자료 확인 상태·연결 문제</summary>
        {input.event === "unknown" && checkbox("urgentLoss", "오늘 필수 생활비를 충당할 수 없고 급여를 받지 못했어요")}
        {checkbox("sourceUnavailable", "공식 페이지가 열리지 않거나 오래된 내용을 보여요")}
        <label className="mt-2 block font-semibold">제품 밖에서 확인한 자료 상태<select value={input.evidence ?? "not_checked"} onChange={(event) => update({ evidence: event.target.value as JobEndInput["evidence"] })} className={control}><option value="not_checked">아직 확인하지 않았어요</option><option value="requested">자료를 요청했어요</option><option value="received_not_verified">받았지만 내용 확인 전이에요</option><option value="verified_by_user_outside_product">제품 밖에서 직접 확인했어요</option><option value="unavailable">자료를 확보할 수 없어요</option></select></label>
        <p className="mt-3 text-xs leading-6 text-slate-600">링크 열기·자료 상태 선택은 지급, 제출 또는 해결 완료가 아니에요. 선택과 날짜는 이 화면에만 남고 새로고침하면 초기화돼요. 파일·신원정보를 입력하지 마세요.</p>
        <p className="mt-2 text-xs leading-6 text-slate-600">기한 분기 출처 확인: 2026.09.07 · Fair Work Ombudsman / Services Australia. 해고 신청 등 본문의 다른 기한은 별도예요.</p>
      </details>
    </section>
  );
}
