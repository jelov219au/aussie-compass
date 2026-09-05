"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  RAIL_WORK_ALERT_MAX_AREAS,
  RAIL_WORK_ALERT_SOURCES,
  RAIL_WORK_ALERT_JOURNEY_PLANNERS,
  RAIL_WORK_ALERT_STORAGE_KEY,
  type RailWorkAlertSupportedState,
} from "@/lib/railWorkAlerts";

import { CHECKS, EMPTY_CHECKS, canCompleteRailReview, checkedCount, completeRailReview, parseWatchAreas, railMapHref, serializeWatchAreas, startRailReview, type WatchArea } from "@/lib/railWorkWatch";
import { todayDate } from "@/lib/lifeReminders";
import { useLocalPlan } from "@/lib/useLocalPlan";
import { TaxStorageNotice as LocalStorageNotice } from "./TaxStorageNotice";
type SupportedState = RailWorkAlertSupportedState;

const STORAGE_KEY = RAIL_WORK_ALERT_STORAGE_KEY;
const MAX_AREAS = RAIL_WORK_ALERT_MAX_AREAS;

export function RailWorkAlertPlanner() {
  const { data: areas, update: setAreas, storage, saveState } = useLocalPlan<WatchArea[]>(STORAGE_KEY, [], parseWatchAreas, serializeWatchAreas, { initial: "아직 저장한 관심 지역 없음", reset: "관심 지역 초기화" });
  const [label, setLabel] = useState("");
  const [place, setPlace] = useState("");
  const [state, setState] = useState<SupportedState>("NSW");
  const [today, setToday] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => { const refresh = () => setToday(todayDate()); refresh(); window.addEventListener("focus", refresh); return () => window.removeEventListener("focus", refresh); }, []);

  const completedChecks = useMemo(
    () => areas.reduce((total, area) => total + checkedCount(area), 0),
    [areas],
  );

  const addArea = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (storage === "loading") return;
    const next: WatchArea[] = [...areas, {
      id: crypto.randomUUID(),
      label: label.trim(),
      place: place.trim(),
      state,
      lastCheckedAt: "",
      checks: { ...EMPTY_CHECKS }, reviewStartedAt: todayDate(),
    }];
    if (!parseWatchAreas(JSON.stringify(next))) { setMessage("구분명40자·동네/역80자·지원 주를 확인하세요. 새 관심 지역은 최대 5곳입니다. 기존 원문은 자르지 않습니다."); return; }
    setAreas(next);
    setToday(todayDate());
    setLabel("");
    setPlace("");
    setMessage("관심 지역을 화면에 추가했습니다. 실제 브라우저 저장 상태는 위 안내를 확인하세요.");
  };

  const updateArea = (id: string, update: (area: WatchArea) => WatchArea) => {
    setAreas((current) => current.map((area) => area.id === id ? update(area) : area));
  };

  function beginReview(area: WatchArea) {
    if (checkedCount(area) && !window.confirm("이전 체크 표시를 비우고 이번 출발 점검을 시작할까요? 마지막 확인 날짜는 유지됩니다.")) return;
    const currentDate = todayDate();
    setToday(currentDate);
    updateArea(area.id, current => startRailReview(current, currentDate)); setMessage("이번 출발 점검을 시작했습니다. 날짜·경로와 영향 여부를 다시 확인하세요.");
  }
  function finishReview(area: WatchArea) {
    const next = completeRailReview(area);
    if (!next) { setMessage("이번 출발 점검을 시작하고 4개 항목을 모두 검토한 뒤 오늘 확인을 기록하세요."); return; }
    updateArea(area.id, () => next); setMessage("오늘 검토했다고 화면에 기록했습니다. 저장 상태를 확인하세요. 그날 계속 정상 운행한다는 보장은 아닙니다.");
  }
  return <section className="border border-border bg-white p-5 shadow-sm sm:p-8" aria-labelledby="rail-watch-heading">
    <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-end">
      <div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">Local watch areas</p><h2 id="rail-watch-heading" className="mt-2 text-2xl font-semibold text-navy">철도 작업 확인 지역을 저장하세요.</h2><p className="mt-3 max-w-3xl text-sm leading-6 text-muted">정확한 집 주소 대신 동네·역 이름만 저장하세요. Hoju Compass가 실시간 작업 정보를 자동 수집하지는 않으며, 지도와 공식 출처는 버튼을 누를 때만 새 탭에서 열립니다.</p></div>
      <p className="font-mono text-xs text-muted" aria-live="polite">관심 지역 {areas.length}/{MAX_AREAS} · 보관된 체크 {completedChecks}/{areas.length * CHECKS.length}</p>
    </div>

    <LocalStorageNotice storageKey={STORAGE_KEY} storage={storage} saveState={saveState} />
    <form onSubmit={addArea} className="mt-6 bg-surface p-4"><fieldset disabled={storage === "loading"} className="grid min-w-0 gap-4 sm:grid-cols-2 lg:grid-cols-[0.8fr_1.2fr_0.6fr_auto] lg:items-end"><legend className="sr-only">관심 지역 입력</legend>
      <label className="text-sm font-medium text-navy">내가 알아볼 이름<input value={label} maxLength={40} onChange={(event) => setLabel(event.target.value)} placeholder="예: 출근역" className="mt-2 min-h-12 w-full border border-border bg-white px-3" /></label>
      <label className="text-sm font-medium text-navy">동네·역 이름<input value={place} maxLength={80} onChange={(event) => setPlace(event.target.value)} placeholder="예: Strathfield Station" className="mt-2 min-h-12 w-full border border-border bg-white px-3" /></label>
      <label className="text-sm font-medium text-navy">주<select value={state} onChange={(event) => setState(event.target.value as SupportedState)} className="mt-2 min-h-12 w-full border border-border bg-white px-3"><option>NSW</option><option>VIC</option><option>QLD</option></select></label>
      <button type="submit" disabled={!label.trim() || !place.trim() || areas.length >= MAX_AREAS} className="min-h-12 bg-navy px-5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40">지역 추가</button>
    </fieldset></form>

    {areas.length ? <ol className="mt-6 grid gap-4 lg:grid-cols-2" aria-label="저장한 철도 작업 확인 지역">
      {areas.map((area, index) => {
        const source = RAIL_WORK_ALERT_SOURCES[area.state];
        const mapHref = railMapHref(area);
        const journey = RAIL_WORK_ALERT_JOURNEY_PLANNERS[area.state];
        const activeReview = area.reviewStartedAt === today;
        return <li key={area.id} className="border border-border p-5">
          <div className="flex items-start justify-between gap-4"><div><span className="font-mono text-xs text-gold">{String(index + 1).padStart(2, "0")} · {area.state}</span><h3 className="mt-1 text-lg font-semibold text-navy">{area.label}</h3><p className="mt-1 text-sm text-muted">{area.place}</p></div><button type="button" onClick={() => { if (window.confirm("이 관심 지역과 체크 기록을 삭제할까요?")) { setAreas(current => current.filter(item => item.id !== area.id)); setMessage("화면에서 삭제했습니다. 실제 저장 상태를 확인하세요."); } }} className="min-h-11 px-2 text-xs font-semibold text-muted">삭제</button></div>
          <div className="mt-4 grid gap-2 sm:grid-cols-2"><a href={mapHref} target="_blank" rel="noreferrer" className="inline-flex min-h-12 items-center justify-center border border-navy px-3 text-center text-sm font-semibold text-navy">지도에서 위치 확인 ↗</a><a href={source.href} target="_blank" rel="noreferrer" className="inline-flex min-h-12 items-center justify-center bg-gold px-3 text-center text-sm font-semibold text-navy">{source.label} ↗</a></div>
          {journey && <a href={journey.href} target="_blank" rel="noreferrer" className="mt-2 inline-flex min-h-12 w-full items-center justify-center border border-navy px-3 text-center text-sm font-semibold text-navy">{journey.label} ↗</a>}
          <p className="mt-2 text-xs leading-6 text-muted">지도 버튼을 누를 때 동네·역과 주, Australia 검색어가 Google로 전달됩니다.</p>
          <p className="mt-4 rounded-lg bg-surface p-3 text-sm leading-6 text-navy">{area.lastCheckedAt && area.lastCheckedAt < today ? "지난 확인 기록 · 이번 출발 전에 다시 확인하세요." : area.lastCheckedAt > today ? "확인 날짜가 미래입니다. 기록을 다시 확인하세요." : area.lastCheckedAt === today ? "오늘 사용자가 남긴 확인 기록 · 현재 운행 보장 아님" : "아직 완료 날짜를 기록하지 않았습니다."} 보관된 체크 {checkedCount(area)}/4{!activeReview ? " · 이전 체크는 이번 점검 완료로 보지 않습니다." : " · 이번 점검 진행 중"}</p>
          <button type="button" onClick={() => beginReview(area)} className="mt-3 min-h-11 rounded-lg border border-navy px-3 text-sm font-semibold text-navy">이번 출발 점검 시작</button>
          <fieldset disabled={!activeReview} className="mt-5"><legend className="text-sm font-semibold text-navy">출발 전 확인</legend><div className="mt-2 grid gap-2">{CHECKS.map((check) => <label key={check.id} className="flex min-h-11 items-center gap-3 border-b border-border py-2 text-sm text-navy"><input type="checkbox" checked={area.checks[check.id]} onChange={(event) => { if (area.reviewStartedAt !== todayDate()) { setMessage("오늘의 출발 점검을 먼저 시작하세요."); return; } updateArea(area.id, current => ({ ...current, checks: { ...current.checks, [check.id]: event.target.checked } })); }} className="h-5 w-5" /><span>{check.label}</span></label>)}</div></fieldset>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3"><p className="text-xs text-muted">사용자가 남긴 마지막 확인: {area.lastCheckedAt || "아직 확인하지 않음"} · 자동 원문 조회 아님</p><button type="button" disabled={!canCompleteRailReview(area, today)} onClick={() => finishReview(area)} className="min-h-11 border-b-2 border-gold text-sm font-semibold text-navy disabled:opacity-40">4항목 검토 후 오늘 확인 기록</button></div>
        </li>;
      })}
    </ol> : <div className="mt-6 border border-dashed border-border p-6 text-center"><p className="font-semibold text-navy">저장한 관심 지역이 없습니다.</p><p className="mt-2 text-sm leading-6 text-muted">통근·통학에 자주 쓰는 역 하나부터 저장하고 공식 공지를 확인하세요.</p></div>}
    <p className="mt-4 min-h-5 text-sm text-muted" role="status">{message}</p>
    <div className="mt-4 flex flex-col gap-2 border-t border-border pt-4 text-sm sm:flex-row sm:items-center sm:justify-between">
      <p className="leading-6 text-muted">일반 브라우저와 홈 화면 앱의 저장 공간은 서로 다를 수 있습니다.</p>
      <Link href="/data-transfer" className="inline-flex min-h-11 items-center font-semibold text-navy underline decoration-gold decoration-2 underline-offset-4">관심 지역 백업·이전 →</Link>
    </div>
  </section>;
}
