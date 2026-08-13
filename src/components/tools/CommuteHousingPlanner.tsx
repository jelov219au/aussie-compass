"use client";

import { useEffect, useMemo, useState } from "react";

type Candidate = {
  id: string;
  name: string;
  origin: string;
  weeklyRent: string;
  commuteMinutes: string;
  walkMinutes: string;
};

const storageKey = "aussie-compass-commute-housing-v1";
const makeCandidate = (index: number): Candidate => ({ id: `${Date.now()}-${index}`, name: "", origin: "", weeklyRent: "", commuteMinutes: "", walkMinutes: "" });
const number = (value: string) => { const parsed = Number(value); return Number.isFinite(parsed) && parsed > 0 ? parsed : 0; };
const mapsDirections = (origin: string, destination: string) => `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&travelmode=transit`;
const mapsSearch = (query: string, origin: string) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${query} near ${origin}`)}`;

export function CommuteHousingPlanner() {
  const [destination, setDestination] = useState("");
  const [weeklyBudget, setWeeklyBudget] = useState("");
  const [daysPerWeek, setDaysPerWeek] = useState("5");
  const [candidates, setCandidates] = useState<Candidate[]>([makeCandidate(0), makeCandidate(1)]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved) as { destination?: string; weeklyBudget?: string; daysPerWeek?: string; candidates?: Candidate[] };
        setDestination(parsed.destination ?? "");
        setWeeklyBudget(parsed.weeklyBudget ?? "");
        setDaysPerWeek(parsed.daysPerWeek ?? "5");
        if (parsed.candidates?.length) setCandidates(parsed.candidates.slice(0, 3));
      }
    } catch {}
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try { localStorage.setItem(storageKey, JSON.stringify({ destination, weeklyBudget, daysPerWeek, candidates })); } catch {}
  }, [loaded, destination, weeklyBudget, daysPerWeek, candidates]);

  const update = (id: string, field: keyof Candidate, value: string) => setCandidates((current) => current.map((candidate) => candidate.id === id ? { ...candidate, [field]: value } : candidate));
  const results = useMemo(() => candidates.map((candidate) => {
    const rent = number(candidate.weeklyRent);
    const commute = number(candidate.commuteMinutes);
    const days = number(daysPerWeek);
    return { ...candidate, rent, monthlyRent: rent * 52 / 12, budgetGap: number(weeklyBudget) - rent, weeklyCommuteHours: commute * 2 * days / 60 };
  }), [candidates, daysPerWeek, weeklyBudget]);

  return <section className="rounded-3xl border border-border bg-white p-5 shadow-sm sm:p-8" aria-labelledby="commute-planner-heading">
    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between"><div><p className="text-sm font-semibold text-gold">주거비와 통학시간을 한 화면에서</p><h2 id="commute-planner-heading" className="mt-2 text-2xl font-semibold text-navy">생활권 후보 비교표</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-muted">정확한 호수나 개인 주소 대신 역·동네·건물 이름만 입력하세요. 입력 내용은 이 브라우저에 저장되며, 지도 버튼을 누를 때 해당 검색어가 Google Maps로 전달됩니다.</p></div>{candidates.length < 3 && <button type="button" onClick={() => setCandidates((current) => [...current, makeCandidate(current.length)])} className="min-h-11 rounded-lg bg-navy px-4 text-sm font-semibold text-white">후보 추가</button>}</div>

    <div className="mt-7 grid gap-4 rounded-2xl bg-surface p-5 md:grid-cols-3">
      <label className="text-sm font-medium text-navy">학교·직장 목적지<input value={destination} maxLength={120} onChange={(event) => setDestination(event.target.value)} placeholder="예: University of Sydney" className="mt-2 min-h-11 w-full rounded-lg border border-border bg-white px-3" /></label>
      <label className="text-sm font-medium text-navy">주당 감당 가능한 주거비 ($)<input type="number" min="0" inputMode="decimal" value={weeklyBudget} onChange={(event) => setWeeklyBudget(event.target.value)} placeholder="예: 350" className="mt-2 min-h-11 w-full rounded-lg border border-border bg-white px-3" /></label>
      <label className="text-sm font-medium text-navy">주당 통학·출근 일수<input type="number" min="1" max="7" inputMode="numeric" value={daysPerWeek} onChange={(event) => setDaysPerWeek(event.target.value)} className="mt-2 min-h-11 w-full rounded-lg border border-border bg-white px-3" /></label>
    </div>

    <div className="mt-6 grid gap-5 xl:grid-cols-3">{results.map((candidate, index) => <article key={candidate.id} className="rounded-2xl border border-border p-5">
      <div className="flex items-center justify-between"><span className="text-xs font-semibold text-gold">후보 {index + 1}</span>{candidates.length > 2 && <button type="button" onClick={() => setCandidates((current) => current.filter((item) => item.id !== candidate.id))} className="text-xs font-semibold text-muted">삭제</button>}</div>
      <label className="mt-3 block text-sm font-medium text-navy">후보 이름<input value={candidate.name} maxLength={60} onChange={(event) => update(candidate.id, "name", event.target.value)} placeholder="예: Strathfield 쉐어" className="mt-2 min-h-11 w-full rounded-lg border border-border px-3" /></label>
      <label className="mt-3 block text-sm font-medium text-navy">출발 동네·역<input value={candidate.origin} maxLength={120} onChange={(event) => update(candidate.id, "origin", event.target.value)} placeholder="예: Strathfield NSW" className="mt-2 min-h-11 w-full rounded-lg border border-border px-3" /></label>
      <div className="mt-3 grid grid-cols-3 gap-2">
        <label className="text-xs font-medium text-navy">주세 ($)<input type="number" min="0" inputMode="decimal" value={candidate.weeklyRent} onChange={(event) => update(candidate.id, "weeklyRent", event.target.value)} className="mt-1 min-h-11 w-full rounded-lg border border-border px-2" /></label>
        <label className="text-xs font-medium text-navy">편도 (분)<input type="number" min="0" inputMode="numeric" value={candidate.commuteMinutes} onChange={(event) => update(candidate.id, "commuteMinutes", event.target.value)} className="mt-1 min-h-11 w-full rounded-lg border border-border px-2" /></label>
        <label className="text-xs font-medium text-navy">정류장 도보 (분)<input type="number" min="0" inputMode="numeric" value={candidate.walkMinutes} onChange={(event) => update(candidate.id, "walkMinutes", event.target.value)} className="mt-1 min-h-11 w-full rounded-lg border border-border px-2" /></label>
      </div>
      <div className="mt-5 rounded-xl bg-navy p-4 text-white"><div className="flex justify-between text-sm"><span className="text-white/70">월 주거비 환산</span><strong>${Math.round(candidate.monthlyRent).toLocaleString()}</strong></div><div className="mt-2 flex justify-between text-sm"><span className="text-white/70">주당 통학시간</span><strong>{candidate.weeklyCommuteHours.toFixed(1)}시간</strong></div>{number(weeklyBudget) > 0 && <div className="mt-2 flex justify-between text-sm"><span className="text-white/70">주거비 예산 대비</span><strong>{candidate.budgetGap >= 0 ? `$${candidate.budgetGap.toLocaleString()} 여유` : `$${Math.abs(candidate.budgetGap).toLocaleString()} 초과`}</strong></div>}</div>
      <div className="mt-4 grid gap-2"><a href={candidate.origin && destination ? mapsDirections(candidate.origin, destination) : undefined} target="_blank" rel="noreferrer" aria-disabled={!candidate.origin || !destination} className={`inline-flex min-h-11 items-center justify-center rounded-lg px-3 text-sm font-semibold ${candidate.origin && destination ? "bg-gold text-navy" : "pointer-events-none bg-surface text-muted"}`}>Google Maps 대중교통 경로 ↗</a>{candidate.origin && <div className="grid grid-cols-2 gap-2">{[["한국 식료품점", "Korean grocery"], ["병원·GP", "medical centre"], ["도서관", "library"], ["슈퍼마켓", "supermarket"]].map(([label, query]) => <a key={label} href={mapsSearch(query, candidate.origin)} target="_blank" rel="noreferrer" className="inline-flex min-h-10 items-center justify-center rounded-lg border border-border px-2 text-center text-xs font-semibold text-navy">{label} ↗</a>)}</div>}</div>
    </article>)}</div>
    <div className="mt-6 flex flex-wrap gap-3"><button type="button" onClick={() => { setDestination(""); setWeeklyBudget(""); setDaysPerWeek("5"); setCandidates([makeCandidate(0), makeCandidate(1)]); }} className="min-h-11 rounded-lg border border-border px-4 text-sm font-semibold text-navy">비교표 초기화</button><p className="self-center text-xs leading-5 text-muted">실시간 운행시간·요금은 출발 시각과 서비스 변경에 따라 달라집니다. 지도와 지역 교통기관에서 다시 확인하세요.</p></div>
  </section>;
}
