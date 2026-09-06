"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { departureJurisdictions, departureTasks, taskRoute } from "@/data/departureNextActions";
import {
  departureActionValid,
  departureStages,
  emptyDepartureNextAction,
  parseDepartureNextAction,
  serializeDepartureNextAction,
  type ActionStatus,
  type Applicability,
  type DepartureTaskId,
  type EvidenceStatus,
} from "@/lib/departureNextAction";
import { useLocalPlan } from "@/lib/useLocalPlan";
import { TaxStorageNotice as LocalStorageNotice } from "./TaxStorageNotice";

const applicabilityOptions: Array<{ value: Applicability; label: string }> = [
  { value: "pending", label: "아직 판단 전" },
  { value: "applicable", label: "해당함" },
  { value: "not_applicable", label: "해당 없음" },
];
const statusOptions: Array<{ value: ActionStatus; label: string }> = [
  { value: "prepare", label: "준비 전" },
  { value: "requested_or_submitted", label: "요청·신청함" },
  { value: "awaiting_confirmation", label: "기관 확인 대기" },
  { value: "received_or_final_bill_reconciled", label: "실수령·final bill 대조" },
  { value: "blocked_or_disputed", label: "중단·분쟁" },
  { value: "not_applicable", label: "해당 없음" },
];
const evidenceOptions: Array<{ value: EvidenceStatus; label: string }> = [
  { value: "not_needed", label: "아직 필요 없음" },
  { value: "location_chosen", label: "외부 보관 위치 정함" },
  { value: "copy_saved", label: "사본 보관함" },
  { value: "receipt_saved", label: "접수 증거 보관함" },
];
const statusActions: Record<ActionStatus, string> = {
  prepare: "공식 안내를 열고 필요한 조건과 준비물을 확인하세요.",
  requested_or_submitted: "요청·신청 사실만 기록하고 접수 증거와 다시 확인할 날을 남기세요.",
  awaiting_confirmation: "기관이 필요한 자료를 모두 받았는지, 다음 결과일이 언제인지 확인하세요.",
  received_or_final_bill_reconciled: "실제 입금·명세·final bill을 서로 대조하고 차이가 없는지 확인하세요.",
  blocked_or_disputed: "공식 complaint·dispute 경로와 중단 이유를 확인하세요.",
  not_applicable: "해당 없음인 작업은 가장 임박한 작업으로 선택할 수 없습니다.",
};

export function DepartureNextAction() {
  const { data, update, storage, saveState } = useLocalPlan(
    "leaving-departure-next-action-v1",
    emptyDepartureNextAction,
    parseDepartureNextAction,
    serializeDepartureNextAction,
    { initial: "아직 저장한 다음 행동 없음", reset: "다음 행동 초기화" },
  );
  const [officialOpened, setOfficialOpened] = useState(false);
  const task = useMemo(() => departureTasks.find((item) => item.id === data.task), [data.task]);
  const stage = departureStages.find((item) => item.value === data.stage);
  const officialRoute = task ? taskRoute(task, data.jurisdiction) : "";
  const valid = departureActionValid(data) && Boolean(task && officialRoute);

  const setApplicability = (id: DepartureTaskId, value: Applicability) => {
    setOfficialOpened(false);
    update((current) => ({
      ...current,
      applicability: { ...current.applicability, [id]: value },
      task: current.task === id && value !== "applicable" ? "" : current.task,
    }));
  };

  return (
    <section id="departure-next-action" className="mt-6 scroll-mt-20 rounded-3xl border-2 border-navy bg-white p-5 shadow-sm sm:p-8" aria-labelledby="departure-next-action-heading">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-navy">무료 첫 결과 · departure_next_action</p>
      <h2 id="departure-next-action-heading" className="mt-2 text-2xl font-semibold text-navy">가장 임박한 출국 업무 하나부터 시작하세요</h2>
      <p className="mt-2 max-w-4xl text-sm leading-6 text-muted">출국 시점, 해당 범주와 현재 상태를 고르면 공식 경로와 다음 행동 한 개를 만듭니다. 선택한 enum과 개인 확인일만 이 브라우저에 저장하며 기관명·금액·계정번호·문서 원문은 받지 않습니다.</p>
      <LocalStorageNotice storageKey="leaving-departure-next-action-v1" storage={storage} saveState={saveState} />

      <fieldset disabled={storage === "loading"} className="mt-4">
        <legend className="text-base font-semibold text-navy">1. 지금 출국 시점</legend>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
          {departureStages.map((item) => {
            const active = data.stage === item.value;
            return <button key={item.value} type="button" aria-pressed={active} onClick={() => { setOfficialOpened(false); update((current) => ({ ...current, stage: item.value })); }} className={`${active ? "border-gold bg-gold/15 text-navy" : "border-border bg-white text-muted"} min-h-12 rounded-xl border-2 px-3 py-2 text-left text-sm font-semibold`}>{item.label}</button>;
          })}
        </div>
      </fieldset>

      <fieldset disabled={storage === "loading"} className="mt-6">
        <legend className="text-base font-semibold text-navy">2. 핵심 범주 해당 여부</legend>
        <p className="mt-1 text-xs leading-5 text-muted">각 범주를 ‘해당함·해당 없음·아직 판단 전’으로 구분하세요. 이유나 상세 내용은 입력하지 않습니다.</p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {departureTasks.map((item) => (
            <label key={item.id} className="rounded-xl border border-border p-3 text-sm font-semibold text-navy">
              {item.label}
              <select value={data.applicability[item.id]} onChange={(event) => setApplicability(item.id, event.target.value as Applicability)} className="mt-2 min-h-11 w-full rounded-lg border border-border bg-white px-2 text-sm font-normal text-navy">
                {applicabilityOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="mt-6 grid gap-4 rounded-2xl bg-surface p-4 sm:grid-cols-2 lg:grid-cols-4">
        <label className="text-sm font-semibold text-navy">3. 가장 임박한 작업
          <select value={data.task} onChange={(event) => { setOfficialOpened(false); update((current) => ({ ...current, task: event.target.value as "" | DepartureTaskId })); }} className="mt-2 min-h-12 w-full rounded-lg border border-border bg-white px-3 text-sm font-normal">
            <option value="">해당함 중 하나 선택</option>
            {departureTasks.filter((item) => data.applicability[item.id] === "applicable").map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
          </select>
        </label>
        <label className="text-sm font-semibold text-navy">4. 현재 상태
          <select value={data.status} onChange={(event) => { setOfficialOpened(false); update((current) => ({ ...current, status: event.target.value as ActionStatus })); }} className="mt-2 min-h-12 w-full rounded-lg border border-border bg-white px-3 text-sm font-normal">
            {statusOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </label>
        <label className="text-sm font-semibold text-navy">5. 개인 재확인일
          <input type="date" min="0001-01-01" max="9999-12-30" value={data.recheckDate} onChange={(event) => update((current) => ({ ...current, recheckDate: event.target.value }))} className="mt-2 min-h-12 w-full rounded-lg border border-border bg-white px-3 text-sm font-normal" />
          <span className="mt-1 block text-xs font-normal text-muted">법정 deadline이 아닌 개인 follow-up 날짜</span>
        </label>
        <label className="text-sm font-semibold text-navy">6. 증거 사본 상태
          <select value={data.evidence} onChange={(event) => update((current) => ({ ...current, evidence: event.target.value as EvidenceStatus }))} className="mt-2 min-h-12 w-full rounded-lg border border-border bg-white px-3 text-sm font-normal">
            {evidenceOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
          <span className="mt-1 block text-xs font-normal text-muted">원문은 개인 저장소에 보관</span>
        </label>
      </div>

      {task?.needsJurisdiction ? (
        <label className="mt-4 block max-w-sm text-sm font-semibold text-navy">차량·Bond 관할
          <select value={data.jurisdiction} onChange={(event) => { setOfficialOpened(false); update((current) => ({ ...current, jurisdiction: event.target.value as typeof data.jurisdiction })); }} className="mt-2 min-h-12 w-full rounded-lg border border-border bg-white px-3 text-sm font-normal">
            <option value="">주·준주 선택</option>
            {departureJurisdictions.map((item) => <option key={item}>{item}</option>)}
          </select>
        </label>
      ) : null}

      {!valid ? (
        <p className="mt-5 rounded-xl border border-dashed border-navy/30 p-4 text-sm leading-6 text-muted" role="status">출국 시점, ‘해당함’으로 표시한 가장 임박한 작업, 현재 상태, 개인 재확인일{task?.needsJurisdiction ? ", 관할" : ""}을 선택하면 결과가 만들어집니다. ‘해당 없음’ 상태로는 결과를 만들지 않습니다.</p>
      ) : task && stage ? (
        <article id="departure-next-action-result" className="mt-6 rounded-2xl border-2 border-gold bg-white p-5 sm:p-6" aria-live="polite">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-navy">Departure next action</p>
          <div className="mt-3 grid gap-4 lg:grid-cols-[1fr_auto] lg:items-start">
            <div>
              <p className="text-sm font-semibold text-muted">출국 시점 · {stage.label} / 다시 확인 · {data.recheckDate}</p>
              <h3 className="mt-1 text-2xl font-semibold text-navy">지금 할 일 · {task.label}</h3>
              <p className="mt-2 text-sm leading-7 text-navy">{task.fixedAction}</p>
              <p className="mt-2 text-sm leading-6 text-muted"><strong className="text-navy">현재 상태의 다음 행동:</strong> {statusActions[data.status]}</p>
            </div>
            <a href={officialRoute} target="_blank" rel="noreferrer" onClick={() => setOfficialOpened(true)} className="inline-flex min-h-12 items-center justify-center rounded-lg bg-navy px-5 text-center text-sm font-semibold text-white">{task.routeLabel} 열기 ↗</a>
          </div>
          <div className="mt-5 grid gap-3 bg-surface p-4 text-sm leading-6 text-muted sm:grid-cols-3">
            <p><strong className="text-navy">재확인 기준</strong><br />{stage.band}. 선택 날짜는 개인 확인일이며 법정 기한을 대신하지 않습니다.</p>
            <p><strong className="text-navy">증거 상태</strong><br />{evidenceOptions.find((item) => item.value === data.evidence)?.label}. 실제 파일·금액·번호는 외부 개인 저장소에 둡니다.</p>
            <p><strong className="text-navy">연결 실패 시</strong><br />{task.fallback}</p>
          </div>
          {task.secondary ? <a href={task.secondary.href} target="_blank" rel="noreferrer" onClick={() => setOfficialOpened(true)} className="mt-3 inline-flex min-h-11 items-center text-sm font-semibold text-navy underline decoration-gold underline-offset-4">{task.secondary.label} ↗</a> : null}
          <p className="mt-4 border-t border-border pt-4 text-xs leading-5 text-muted">요청·신청, 접수 이메일 또는 화면에 신청서가 보이는 것만으로 실수령·처리 완료가 되지 않습니다. 실제 입금·명세·Bond 반환액·final bill을 대조하세요.</p>
        </article>
      ) : null}

      {officialOpened && valid ? (
        <aside className="mt-5 border border-navy/20 bg-white p-5" aria-labelledby="leaving-pro-cta">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-navy">공식 첫 행동 뒤 선택 사항</p>
          <h3 id="leaving-pro-cta" className="mt-2 text-xl font-semibold text-navy">여러 기관의 정산을 반복 추적해야 하나요?</h3>
          <p className="mt-2 text-sm leading-6 text-muted">무료 결과는 한 작업의 공식 출발점까지 제공합니다. Bond·final pay·utility credit·tax refund·DASP를 여러 번 확인하고 기록해야 할 때 Leaving Australia Pack Pro의 범위와 구매 조건을 확인하세요.</p>
          <Link href="/leaving-australia-pro" className="mt-4 inline-flex min-h-12 items-center justify-center bg-navy px-5 text-sm font-semibold text-white">정산 기록 기능·구매 조건 보기 →</Link>
        </aside>
      ) : null}
    </section>
  );
}
