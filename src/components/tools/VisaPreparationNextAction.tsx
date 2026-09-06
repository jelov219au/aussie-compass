"use client";

import { useRef, useState } from "react";
import { buildVisaNextAction, VISA_ACTIONS, VISA_FAMILIES, VISA_PREREQUISITES, VISA_STAGES, VISA_STOPS, visaToday, type VisaInput, type VisaEvidence } from "@/lib/visaPreparationNextAction";

const initial: VisaInput = { stage: "", family: "", today: "" };
const control = "mt-1 min-h-11 w-full min-w-0 max-w-full rounded-lg border border-slate-400 bg-white px-3 py-2 text-sm text-navy focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy";
const evidenceLabels: Record<VisaEvidence, string> = { not_needed: "이 단계에서는 별도 사본이 필요하지 않아요", not_yet: "아직 외부 사본을 보관하지 않았어요", kept_outside_hoju_compass: "제품 밖의 안전한 장소에 직접 보관했어요" };
function dateLabel(value: string) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return `다시 확인할 날짜: ${value} · 개인 일정`;
  if (value === "UNKNOWN_FOLLOW_UP") return "기한 미확인 · 오늘 공식 계정에서 확인하세요";
  if (value === "request_letter_due") return "요청서 기한을 먼저 읽고 재확인할 날을 정하세요";
  return value.replace("request_letter_due;", "요청서 기한 미확인;").replace("request_letter_due:", "요청서 기한: ").replace("; next_check:", " · 다시 확인: ");
}
export function VisaPreparationNextAction() {
  const [input, setInput] = useState<VisaInput>(initial);
  const stageRef = useRef<HTMLSelectElement>(null), familyRef = useRef<HTMLSelectElement>(null);
  const update = (patch: Partial<VisaInput>) => setInput((previous) => ({ ...previous, ...patch, today: visaToday() }));
  const result = buildVisaNextAction(input);
  const activeStage = input.requestKind && input.requestKind !== "none" ? input.requestKind : input.stage;
  const requestStage = ["further_information_requested", "health_exam_requested", "biometrics_requested"].includes(activeStage);
  const actionKey = result?.stable_official_route.one_action ?? "";
  const actionLabel = actionKey.startsWith("retry_official_source_on_") ? VISA_ACTIONS.retry_official_source : VISA_ACTIONS[actionKey as keyof typeof VISA_ACTIONS];
  const evidence = result?.next_check_and_external_evidence.external_evidence_kept ?? "not_yet";
  const nextCheck = result?.next_check_and_external_evidence.next_check_date ?? "UNKNOWN_FOLLOW_UP";

  return <section aria-labelledby="visa-next-heading" data-visa-next-action className="mt-5 max-w-4xl rounded-2xl border-2 border-gold bg-white p-4 sm:p-6 print:hidden">
    <h2 id="visa-next-heading" className="text-lg font-semibold text-navy">내 단계에서 할 일 한 가지</h2>
    <div className="mt-3 grid gap-3 sm:grid-cols-2">
      <label className="min-w-0 text-sm font-semibold text-navy">현재 신청 단계<select ref={stageRef} value={input.stage} onChange={(event) => setInput({ ...initial, stage: event.target.value as VisaInput["stage"], family: input.family, today: visaToday() })} className={control}><option value="">직접 골라주세요</option>{Object.entries(VISA_STAGES).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
      <label className="min-w-0 text-sm font-semibold text-navy">신청 목적 · 넓은 분류<select ref={familyRef} value={input.family} onChange={(event) => setInput({ ...initial, stage: input.stage, family: event.target.value as VisaInput["family"], today: visaToday() })} className={control}><option value="">직접 골라주세요</option>{Object.entries(VISA_FAMILIES).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
    </div>
    {input.stage && input.family && <div className="mt-3 space-y-3">
      {input.stage === "submitted_waiting" && <>
        <label className="block text-sm font-semibold text-navy">제출 후 새 요청서<select value={input.requestKind ?? "none"} onChange={(event) => setInput({ ...initial, stage: input.stage, family: input.family, requestKind: event.target.value as VisaInput["requestKind"], today: visaToday() })} className={control}><option value="none">없거나 아직 확인하지 못했어요</option><option value="further_information_requested">추가 정보·서류 요청</option><option value="health_exam_requested">신체검사 요청</option><option value="biometrics_requested">생체정보 요청</option></select></label>
        {!requestStage && <label className="block text-sm font-semibold text-navy">지금 확인할 내용<select value={input.waiting ?? "status"} onChange={(event) => update({ waiting: event.target.value as VisaInput["waiting"] })} className={control}><option value="status">내 메시지·요청·상태</option><option value="times">일반적인 처리기간의 의미</option></select></label>}
      </>}
      {input.stage === "ready_to_submit" && <label className="flex min-h-11 cursor-pointer items-center gap-3 py-2 text-sm leading-6 text-navy"><input type="checkbox" checked={Boolean(input.reviewed)} onChange={(event) => update({ reviewed: event.target.checked })} className="h-5 w-5 shrink-0 accent-navy" />답변·첨부·신청자별 검토를 직접 마쳤어요</label>}
      {requestStage && <>
        <label className="flex min-h-11 cursor-pointer items-center gap-3 py-2 text-sm leading-6 text-navy"><input type="checkbox" checked={Boolean(input.requestVerified)} onChange={(event) => update({ requestVerified: event.target.checked, requestDue: "", nextCheck: "" })} className="h-5 w-5 shrink-0 accent-navy" />공식 ImmiAccount에서 요청서를 확인했어요</label>
        {input.requestVerified && <>
          <label className="block text-sm font-semibold text-navy">요청서에 적힌 기한 · 미확인이면 비워두세요<input type="date" value={input.requestDue ?? ""} onChange={(event) => update({ requestDue: event.target.value })} className={control} /></label>
          <p className="text-xs leading-5 text-slate-600">기한은 요청서 그대로 확인하세요. 아래 재확인일은 개인 일정이며 공식 기한을 연장하지 않아요.</p>
          {activeStage === "further_information_requested" && <label className="block text-sm font-semibold text-navy">추가 요청에서 확인할 내용<select value={input.requestTopic ?? "general"} onChange={(event) => update({ requestTopic: event.target.value as VisaInput["requestTopic"] })} className={control}><option value="general">요청 자료 제출 방법</option><option value="character">Character·Police 자료 요청</option><option value="processing">처리기간 안내와 요청 기한이 헷갈려요</option></select></label>}
          {activeStage === "health_exam_requested" && <label className="block text-sm font-semibold text-navy">신체검사 준비 상태<select value={input.health ?? "hap_missing"} onChange={(event) => update({ health: event.target.value as VisaInput["health"] })} className={control}><option value="hap_missing">HAP ID·Referral letter 미확인</option><option value="arrange">HAP ID 확인 · 요청받은 검사 예약 전</option><option value="outside_provider">호주 밖 승인된 검사기관 확인 필요</option><option value="examined">검사받음 · 결과 전송 여부 확인 필요</option><option value="privacy">식별번호·의료자료를 어디서 확인하나요?</option></select></label>}
          {activeStage === "biometrics_requested" && <label className="block text-sm font-semibold text-navy">요청서의 VLN 접두어 · 번호는 입력하지 마세요<select value={input.biometrics ?? "unknown"} onChange={(event) => update({ biometrics: event.target.value as VisaInput["biometrics"] })} className={control}><option value="unknown">아직 확인하지 못했어요</option><option value="aui">밖에서 AUI 시작·유효 여권 확인</option><option value="non_aui">밖에서 AUI로 시작하지 않음을 확인</option></select></label>}
          <label className="flex min-h-11 cursor-pointer items-center gap-3 py-2 text-sm leading-6 text-navy"><input type="checkbox" checked={Boolean(input.cannotMeetDue)} onChange={(event) => update({ cannotMeetDue: event.target.checked })} className="h-5 w-5 shrink-0 accent-navy" />요청서 기한 안에 이행하기 어려워요</label>
        </>}
      </>}
      {input.stage === "decision_received" && <>
        <label className="block text-sm font-semibold text-navy">제품 밖에서 확인한 결정문<select value={input.decision ?? "unknown"} onChange={(event) => update({ decision: event.target.value as VisaInput["decision"], requestDue: "", nextCheck: "", evidence: undefined })} className={control}><option value="unknown">서면 결정문 미확인 · 상태·메시지만 봄</option><option value="grant">공식 서면 승인 통지 확인</option><option value="refusal">공식 서면 거절 통지 확인 · 도움 필요</option></select></label>
        {input.decision === "refusal" && <p className="text-sm leading-6 text-navy">결정문에 적힌 권리·기한을 지금 확인하세요. 이 페이지는 재심 가능 여부나 기한을 계산하지 않아요.</p>}
      </>}
    </div>}
    {result ? <div data-visa-result={JSON.stringify(result)} className="mt-4 rounded-xl border border-navy/15 bg-background p-4">
      <p className="text-xs leading-5 text-slate-600"><span data-visa-field="applicant_selected_stage">{VISA_STAGES[result.applicant_selected_stage]}</span> · <span data-visa-field="applicant_selected_visa_family">{VISA_FAMILIES[result.applicant_selected_visa_family]}</span></p>
      <div data-visa-field="stable_official_route"><a href={result.stable_official_route.href} target="_blank" rel="noreferrer" referrerPolicy="no-referrer" className="mt-3 inline-flex min-h-11 max-w-full items-center rounded-lg bg-navy px-4 py-3 text-sm font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-navy">{actionLabel} <span className="ml-2" aria-hidden="true">↗</span><span className="sr-only"> (공식 사이트, 새 창)</span></a></div>
      <p role="status" aria-live="polite" aria-atomic="true" className="mt-3 text-sm font-semibold leading-6 text-navy">{dateLabel(nextCheck)}</p>
      <p className="mt-2 text-xs leading-5 text-slate-600">공식 사이트는 온라인 전용이에요. 여기 고른 단계·날짜·자료 상태는 보내지 않아요.</p>
      <div className="mt-4 border-t border-border pt-3" data-visa-field="prerequisites"><h3 className="text-sm font-semibold text-navy">열기 전에 준비할 것</h3><ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-6 text-slate-700">{result.prerequisites.map((key) => <li key={key}>{VISA_PREREQUISITES[key]}</li>)}</ul></div>
      <p data-visa-field="what_not_to_do" className="mt-3 border-l-4 border-gold pl-3 text-sm font-medium leading-6 text-navy"><strong>멈출 조건: </strong>{VISA_STOPS[result.what_not_to_do]}</p>
      <div data-visa-field="next_check_and_external_evidence" className="mt-3 text-xs leading-6 text-slate-600"><p>{dateLabel(nextCheck)}</p><p>외부 사본: {evidenceLabels[evidence]}</p></div>
    </div> : <div role="status" className="mt-4 rounded-xl bg-navy p-4 text-sm leading-6 text-white"><p>단계와 목적을 직접 고르면 공식 경로를 보여드려요.</p><button type="button" onClick={() => (!input.stage ? stageRef : familyRef).current?.focus()} className="mt-3 min-h-11 rounded-lg bg-gold px-4 font-semibold text-navy focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">단계·목적 선택하기</button></div>}
    <details className="mt-3 text-sm text-navy"><summary className="min-h-11 cursor-pointer py-3 font-semibold">재확인 일정·외부 사본·도움 설정</summary>
      <div className="space-y-3">
        <label className="block font-semibold">다시 확인할 날짜 · 이 화면에서만 유지<input type="date" value={input.nextCheck ?? ""} onChange={(event) => update({ nextCheck: event.target.value })} className={control} /></label>
        <label className="block font-semibold">외부 사본 보관 상태<select value={input.evidence ?? evidence} onChange={(event) => update({ evidence: event.target.value as VisaEvidence })} className={control}>{Object.entries(evidenceLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
        <label className="block font-semibold">도움이 필요한 상황<select value={input.help ?? "none"} onChange={(event) => update({ help: event.target.value as VisaInput["help"] })} className={control}><option value="none">위 단계의 공식 절차 확인</option><option value="agent">유료 이민대리인의 등록 확인</option><option value="scam">승인 보장·허위 자료·미등록 대행 의심</option></select></label>
        <label className="flex min-h-11 cursor-pointer items-center gap-3 py-2 leading-6"><input type="checkbox" checked={Boolean(input.sourceUnavailable)} onChange={(event) => update({ sourceUnavailable: event.target.checked })} className="h-5 w-5 shrink-0 accent-navy" />공식 페이지가 열리지 않거나 오래된 내용이에요</label>
      </div>
    </details>
    <p className="mt-3 text-xs leading-6 text-slate-600">이 카드의 선택·날짜는 저장·복사·전송하지 않고 새로고침하면 초기화돼요. 여권·TRN·HAP·VLN·MARN·로그인 정보나 문서·건강·범죄경력 원문은 입력하지 마세요. 아래 별도 체크리스트·비용표의 기기 저장과 연결되지 않아요.</p>
    <p className="mt-2 text-xs leading-6 text-slate-600">공식 경로 확인: 2026.09.07 · Home Affairs / OMARA. 링크 열기·체크·서류 보관·신청·검사 제출은 비자 결정이 아니에요. 기한이 급하면 재확인일까지 기다리지 말고 공식 계정·등록 전문가에게 확인하세요.</p>
  </section>;
}
