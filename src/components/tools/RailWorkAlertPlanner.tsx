"use client";

import { useEffect, useMemo, useState } from "react";
import {
  RAIL_WORK_ALERT_MAX_AREAS,
  RAIL_WORK_ALERT_SOURCES,
  RAIL_WORK_ALERT_STORAGE_KEY,
  type RailWorkAlertSupportedState,
} from "@/lib/railWorkAlerts";

type SupportedState = RailWorkAlertSupportedState;

type WatchArea = {
  id: string;
  label: string;
  place: string;
  state: SupportedState;
  lastCheckedAt: string;
  checks: Record<CheckId, boolean>;
};

type CheckId = "official" | "dates" | "alternative" | "accessibility";

const STORAGE_KEY = RAIL_WORK_ALERT_STORAGE_KEY;
const MAX_AREAS = RAIL_WORK_ALERT_MAX_AREAS;
const EMPTY_CHECKS: Record<CheckId, boolean> = { official: false, dates: false, alternative: false, accessibility: false };

const CHECKS: Array<{ id: CheckId; label: string }> = [
  { id: "official", label: "공식 공지 원문 열기" },
  { id: "dates", label: "시작·종료 날짜 다시 확인" },
  { id: "alternative", label: "대체 버스·우회 경로 확인" },
  { id: "accessibility", label: "접근성·막차 영향 확인" },
];

function isWatchArea(value: unknown): value is WatchArea {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<WatchArea>;
  return typeof item.id === "string" && typeof item.label === "string" && typeof item.place === "string"
    && (item.state === "NSW" || item.state === "VIC" || item.state === "QLD")
    && typeof item.lastCheckedAt === "string" && Boolean(item.checks) && typeof item.checks === "object";
}

function normalizeArea(item: WatchArea): WatchArea {
  return {
    ...item,
    label: item.label.slice(0, 40),
    place: item.place.slice(0, 80),
    checks: { ...EMPTY_CHECKS, ...item.checks },
  };
}

export function RailWorkAlertPlanner() {
  const [areas, setAreas] = useState<WatchArea[]>([]);
  const [label, setLabel] = useState("");
  const [place, setPlace] = useState("");
  const [state, setState] = useState<SupportedState>("NSW");
  const [loaded, setLoaded] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    try {
      const parsed: unknown = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "[]");
      if (Array.isArray(parsed)) setAreas(parsed.filter(isWatchArea).slice(0, MAX_AREAS).map(normalizeArea));
    } catch {
      setMessage("이 브라우저에서 저장한 관심 지역을 불러오지 못했습니다.");
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(areas));
    } catch {
      setMessage("이 브라우저에 변경 내용을 저장하지 못했습니다.");
    }
  }, [areas, loaded]);

  const completedChecks = useMemo(
    () => areas.reduce((total, area) => total + Object.values(area.checks).filter(Boolean).length, 0),
    [areas],
  );

  const addArea = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!label.trim() || !place.trim() || areas.length >= MAX_AREAS) return;
    setAreas((current) => [...current, {
      id: crypto.randomUUID(),
      label: label.trim().slice(0, 40),
      place: place.trim().slice(0, 80),
      state,
      lastCheckedAt: "",
      checks: { ...EMPTY_CHECKS },
    }]);
    setLabel("");
    setPlace("");
    setMessage("관심 지역을 현재 브라우저에 저장했습니다.");
  };

  const updateArea = (id: string, update: (area: WatchArea) => WatchArea) => {
    setAreas((current) => current.map((area) => area.id === id ? update(area) : area));
  };

  return <section className="border border-border bg-white p-5 shadow-sm sm:p-8" aria-labelledby="rail-watch-heading">
    <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-end">
      <div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">Local watch areas</p><h2 id="rail-watch-heading" className="mt-2 text-2xl font-semibold text-navy">철도 작업 확인 지역을 저장하세요.</h2><p className="mt-3 max-w-3xl text-sm leading-6 text-muted">정확한 집 주소 대신 동네·역 이름만 저장하세요. Hoju Compass가 실시간 작업 정보를 자동 수집하지는 않으며, 지도와 공식 출처는 버튼을 누를 때만 새 탭에서 열립니다.</p></div>
      <p className="font-mono text-xs text-muted" aria-live="polite">관심 지역 {areas.length}/{MAX_AREAS} · 확인 {completedChecks}/{areas.length * CHECKS.length}</p>
    </div>

    <form onSubmit={addArea} className="mt-6 grid gap-4 bg-surface p-4 sm:grid-cols-2 lg:grid-cols-[0.8fr_1.2fr_0.6fr_auto] lg:items-end">
      <label className="text-sm font-medium text-navy">내가 알아볼 이름<input value={label} maxLength={40} onChange={(event) => setLabel(event.target.value)} placeholder="예: 출근역" className="mt-2 min-h-12 w-full border border-border bg-white px-3" /></label>
      <label className="text-sm font-medium text-navy">동네·역 이름<input value={place} maxLength={80} onChange={(event) => setPlace(event.target.value)} placeholder="예: Strathfield Station" className="mt-2 min-h-12 w-full border border-border bg-white px-3" /></label>
      <label className="text-sm font-medium text-navy">주<select value={state} onChange={(event) => setState(event.target.value as SupportedState)} className="mt-2 min-h-12 w-full border border-border bg-white px-3"><option>NSW</option><option>VIC</option><option>QLD</option></select></label>
      <button type="submit" disabled={!label.trim() || !place.trim() || areas.length >= MAX_AREAS} className="min-h-12 bg-navy px-5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40">지역 저장</button>
    </form>

    {areas.length ? <ol className="mt-6 grid gap-4 lg:grid-cols-2" aria-label="저장한 철도 작업 확인 지역">
      {areas.map((area, index) => {
        const source = RAIL_WORK_ALERT_SOURCES[area.state];
        const mapHref = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${area.place} railway station`)}`;
        return <li key={area.id} className="border border-border p-5">
          <div className="flex items-start justify-between gap-4"><div><span className="font-mono text-xs text-gold">{String(index + 1).padStart(2, "0")} · {area.state}</span><h3 className="mt-1 text-lg font-semibold text-navy">{area.label}</h3><p className="mt-1 text-sm text-muted">{area.place}</p></div><button type="button" onClick={() => setAreas((current) => current.filter((item) => item.id !== area.id))} className="min-h-11 px-2 text-xs font-semibold text-muted">삭제</button></div>
          <div className="mt-4 grid gap-2 sm:grid-cols-2"><a href={mapHref} target="_blank" rel="noreferrer" className="inline-flex min-h-12 items-center justify-center border border-navy px-3 text-center text-sm font-semibold text-navy">지도에서 위치 확인 ↗</a><a href={source.href} target="_blank" rel="noreferrer" className="inline-flex min-h-12 items-center justify-center bg-gold px-3 text-center text-sm font-semibold text-navy">{source.label} ↗</a></div>
          <fieldset className="mt-5"><legend className="text-sm font-semibold text-navy">출발 전 확인</legend><div className="mt-2 grid gap-2">{CHECKS.map((check) => <label key={check.id} className="flex min-h-11 items-center gap-3 border-b border-border py-2 text-sm text-navy"><input type="checkbox" checked={area.checks[check.id]} onChange={(event) => updateArea(area.id, (current) => ({ ...current, checks: { ...current.checks, [check.id]: event.target.checked } }))} className="h-5 w-5" /><span>{check.label}</span></label>)}</div></fieldset>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3"><p className="text-xs text-muted">마지막 확인: {area.lastCheckedAt || "아직 확인하지 않음"}</p><button type="button" onClick={() => updateArea(area.id, (current) => ({ ...current, lastCheckedAt: new Date().toLocaleDateString("en-CA") }))} className="min-h-11 border-b-2 border-gold text-sm font-semibold text-navy">오늘 공식 공지 확인 완료</button></div>
        </li>;
      })}
    </ol> : <div className="mt-6 border border-dashed border-border p-6 text-center"><p className="font-semibold text-navy">저장한 관심 지역이 없습니다.</p><p className="mt-2 text-sm leading-6 text-muted">통근·통학에 자주 쓰는 역 하나부터 저장하고 공식 공지를 확인하세요.</p></div>}
    <p className="mt-4 min-h-5 text-sm text-muted" aria-live="polite">{message}</p>
  </section>;
}
