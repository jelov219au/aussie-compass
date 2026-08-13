"use client";

import { useEffect, useMemo, useState } from "react";

type Status = "saved" | "applied" | "interview" | "offer" | "closed";
type Application = { id: string; company: string; role: string; status: Status; appliedDate: string; nextDate: string; link: string; notes: string; createdAt: string };

const STORAGE_KEY = "aussie-compass-job-tracker-v1";
const statusLabels: Record<Status, string> = { saved: "관심 공고", applied: "지원 완료", interview: "면접", offer: "오퍼", closed: "종료" };
const statusStyles: Record<Status, string> = { saved: "bg-slate-100 text-slate-700", applied: "bg-blue-50 text-blue-700", interview: "bg-amber-50 text-amber-800", offer: "bg-emerald-50 text-emerald-700", closed: "bg-rose-50 text-rose-700" };
const blankForm = { company: "", role: "", status: "saved" as Status, appliedDate: "", nextDate: "", link: "", notes: "" };
const inputClass = "mt-1.5 min-h-11 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-navy outline-none transition focus:border-navy focus:ring-2 focus:ring-navy/15";

function formatDate(value: string) { return value ? new Date(`${value}T00:00:00`).toLocaleDateString("ko-KR", { month: "short", day: "numeric" }) : "–"; }

export function JobApplicationTracker() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [form, setForm] = useState(blankForm);
  const [filter, setFilter] = useState<Status | "all">("all");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => { try { const stored = localStorage.getItem(STORAGE_KEY); if (stored) setApplications(JSON.parse(stored)); } catch {} setLoaded(true); }, []);
  useEffect(() => { if (!loaded) return; const timer = window.setTimeout(() => { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(applications)); setSaved(true); window.setTimeout(() => setSaved(false), 1400); } catch {} }, 400); return () => window.clearTimeout(timer); }, [applications, loaded]);

  const visible = useMemo(() => applications.filter((item) => filter === "all" || item.status === filter).sort((a, b) => (b.appliedDate || b.createdAt).localeCompare(a.appliedDate || a.createdAt)), [applications, filter]);
  const upcoming = useMemo(() => applications.filter((item) => item.nextDate && item.status !== "closed").sort((a, b) => a.nextDate.localeCompare(b.nextDate))[0], [applications]);
  const counts = useMemo(() => ({ applied: applications.filter((item) => item.status !== "saved").length, interview: applications.filter((item) => item.status === "interview").length, offer: applications.filter((item) => item.status === "offer").length }), [applications]);

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.company.trim() || !form.role.trim()) return;
    if (editingId) setApplications((items) => items.map((item) => item.id === editingId ? { ...item, ...form } : item));
    else setApplications((items) => [{ id: `job-${Date.now()}`, ...form, createdAt: new Date().toISOString() }, ...items]);
    setForm(blankForm); setEditingId(null);
  };

  const edit = (item: Application) => { setEditingId(item.id); setForm({ company: item.company, role: item.role, status: item.status, appliedDate: item.appliedDate, nextDate: item.nextDate, link: item.link, notes: item.notes }); window.scrollTo({ top: 0, behavior: "smooth" }); };
  const remove = (item: Application) => { if (window.confirm(`${item.company}의 ${item.role} 기록을 삭제할까요?`)) setApplications((items) => items.filter((entry) => entry.id !== item.id)); };
  const exportBackup = () => { const url = URL.createObjectURL(new Blob([JSON.stringify(applications, null, 2)], { type: "application/json" })); const anchor = document.createElement("a"); anchor.href = url; anchor.download = "aussie-compass-job-applications.json"; anchor.click(); URL.revokeObjectURL(url); };

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-border bg-white p-5 shadow-sm sm:p-7" aria-labelledby="application-form-heading">
        <div className="flex items-start justify-between gap-4"><div><h2 id="application-form-heading" className="text-xl font-semibold text-navy">{editingId ? "지원 기록 수정" : "지원할 회사 추가"}</h2><p className="mt-1 text-sm leading-6 text-muted">입력 내용은 이 브라우저에만 저장되며 서버로 전송되지 않습니다.</p></div><span className="text-xs text-muted" aria-live="polite">{saved ? "저장됨" : "자동 저장"}</span></div>
        <form onSubmit={submit} className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <label className="text-sm font-medium text-navy">회사명 *<input className={inputClass} required value={form.company} onChange={(e) => setForm((current) => ({ ...current, company: e.target.value }))} placeholder="Compass Cafe" /></label>
          <label className="text-sm font-medium text-navy">직무 *<input className={inputClass} required value={form.role} onChange={(e) => setForm((current) => ({ ...current, role: e.target.value }))} placeholder="Barista" /></label>
          <label className="text-sm font-medium text-navy">진행 상태<select className={inputClass} value={form.status} onChange={(e) => setForm((current) => ({ ...current, status: e.target.value as Status }))}>{Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
          <label className="text-sm font-medium text-navy">지원일<input className={inputClass} type="date" value={form.appliedDate} onChange={(e) => setForm((current) => ({ ...current, appliedDate: e.target.value }))} /></label>
          <label className="text-sm font-medium text-navy">다음 일정<input className={inputClass} type="date" value={form.nextDate} onChange={(e) => setForm((current) => ({ ...current, nextDate: e.target.value }))} /></label>
          <label className="text-sm font-medium text-navy sm:col-span-2">공고 링크<input className={inputClass} type="url" value={form.link} onChange={(e) => setForm((current) => ({ ...current, link: e.target.value }))} placeholder="https://..." /></label>
          <label className="text-sm font-medium text-navy sm:col-span-2 lg:col-span-4">메모<textarea className={`${inputClass} min-h-24 resize-y`} value={form.notes} onChange={(e) => setForm((current) => ({ ...current, notes: e.target.value }))} placeholder="담당자, 면접 준비 사항, 후속 연락 내용 등을 기록하세요." /></label>
          <div className="flex flex-wrap gap-3 sm:col-span-2 lg:col-span-4"><button type="submit" className="min-h-11 rounded-lg bg-navy px-5 py-2 text-sm font-semibold text-white hover:bg-navy-light">{editingId ? "수정 저장" : "지원 기록 추가"}</button>{editingId && <button type="button" onClick={() => { setEditingId(null); setForm(blankForm); }} className="min-h-11 rounded-lg border border-border px-4 py-2 text-sm text-navy">취소</button>}<button type="button" onClick={exportBackup} disabled={!applications.length} className="min-h-11 rounded-lg border border-border px-4 py-2 text-sm text-navy disabled:opacity-40">기록 백업</button></div>
        </form>
      </section>

      <section aria-labelledby="application-dashboard-heading">
        <h2 id="application-dashboard-heading" className="sr-only">구직 현황</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><div className="rounded-2xl bg-navy p-5 text-white"><p className="text-sm text-white/65">전체 지원</p><p className="mt-1 text-3xl font-semibold">{counts.applied}</p></div><div className="rounded-2xl border border-border bg-white p-5"><p className="text-sm text-muted">진행 중인 면접</p><p className="mt-1 text-3xl font-semibold text-navy">{counts.interview}</p></div><div className="rounded-2xl border border-border bg-white p-5"><p className="text-sm text-muted">받은 오퍼</p><p className="mt-1 text-3xl font-semibold text-navy">{counts.offer}</p></div><div className="rounded-2xl border border-gold/40 bg-gold/5 p-5"><p className="text-sm text-muted">가장 가까운 일정</p><p className="mt-1 font-semibold text-navy">{upcoming ? `${formatDate(upcoming.nextDate)} · ${upcoming.company}` : "등록된 일정 없음"}</p></div></div>
      </section>

      <section className="rounded-2xl border border-border bg-white p-5 sm:p-7" aria-labelledby="applications-heading">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><h2 id="applications-heading" className="text-xl font-semibold text-navy">지원 목록</h2><p className="mt-1 text-sm text-muted">{visible.length}개의 기록</p></div><div className="flex flex-wrap gap-2" role="group" aria-label="진행 상태 필터">{(["all", "saved", "applied", "interview", "offer", "closed"] as const).map((value) => <button key={value} type="button" onClick={() => setFilter(value)} className={`min-h-11 rounded-lg border px-3 py-2 text-sm ${filter === value ? "border-navy bg-navy text-white" : "border-border text-muted"}`} aria-pressed={filter === value}>{value === "all" ? "전체" : statusLabels[value]}</button>)}</div></div>
        {visible.length ? <ul className="mt-6 space-y-3">{visible.map((item) => <li key={item.id} className="rounded-xl border border-border p-4 sm:p-5"><div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div><div className="flex flex-wrap items-center gap-2"><h3 className="font-semibold text-navy">{item.role}</h3><span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusStyles[item.status]}`}>{statusLabels[item.status]}</span></div><p className="mt-1 text-sm text-muted">{item.company} · 지원 {formatDate(item.appliedDate)} · 다음 일정 {formatDate(item.nextDate)}</p>{item.notes && <p className="mt-3 whitespace-pre-line text-sm leading-6 text-muted">{item.notes}</p>}{item.link && <a href={item.link} target="_blank" rel="noreferrer" className="mt-3 inline-flex min-h-11 items-center text-sm font-semibold text-navy underline decoration-gold decoration-2 underline-offset-4">채용 공고 열기</a>}</div><div className="flex shrink-0 gap-2"><button type="button" onClick={() => edit(item)} className="min-h-11 px-3 text-sm font-medium text-navy underline underline-offset-4">수정</button><button type="button" onClick={() => remove(item)} className="min-h-11 px-3 text-sm text-muted underline underline-offset-4">삭제</button></div></div></li>)}</ul> : <div className="mt-6 rounded-xl bg-surface p-8 text-center"><p className="font-medium text-navy">아직 표시할 지원 기록이 없습니다.</p><p className="mt-2 text-sm text-muted">관심 있는 공고부터 추가해 구직 활동을 한곳에서 관리하세요.</p></div>}
      </section>
    </div>
  );
}
