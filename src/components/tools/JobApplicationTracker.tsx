"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { safeExternalHttpUrl } from "@/lib/safeNavigation";
import { todayDate, displayDate } from "@/lib/lifeReminders";
import { applicationFormError, applicationSchedule, jobBackup, jobStorageKey, newJobLimits, parseApplications, serializeApplications, statusLabels, type Application, type JobStatus as Status } from "@/lib/jobApplications";
import { useLocalPlan } from "@/lib/useLocalPlan";
import { TaxStorageNotice as LocalStorageNotice } from "./TaxStorageNotice";

const statusStyles: Record<Status, string> = { saved: "bg-slate-100 text-slate-700", applied: "bg-blue-50 text-blue-700", interview: "bg-amber-50 text-amber-800", offer: "bg-emerald-50 text-emerald-700", closed: "bg-rose-50 text-rose-700" };
const blankForm = { company: "", role: "", status: "saved" as Status, appliedDate: "", nextDate: "", link: "", notes: "" };
const inputClass = "mt-1.5 min-h-11 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-navy outline-none transition focus:border-navy focus:ring-2 focus:ring-navy/15";

function formatDate(value: string) { return value ? displayDate(value) : "–"; }

export function JobApplicationTracker() {
  const { data: applications, update: setApplications, storage, saveState } = useLocalPlan<Application[]>(jobStorageKey, [], parseApplications, serializeApplications, { initial: "아직 저장한 기록 없음", reset: "기록 초기화" });
  const [form, setForm] = useState(blankForm);
  const [filter, setFilter] = useState<Status | "all">("all");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [today, setToday] = useState("");
  const [message, setMessage] = useState("");
  const [backupFallback, setBackupFallback] = useState<string | null>(null);
  useEffect(() => { const refresh = () => setToday(todayDate()); refresh(); window.addEventListener("focus", refresh); return () => window.removeEventListener("focus", refresh); }, []);

  const visible = useMemo(() => applications.filter((item) => filter === "all" || item.status === filter).sort((a, b) => (b.appliedDate || b.createdAt).localeCompare(a.appliedDate || a.createdAt)), [applications, filter]);
  const schedule = useMemo(() => applicationSchedule(applications, today), [applications, today]);
  const counts = useMemo(() => ({ applied: applications.filter((item) => item.status !== "saved").length, interview: applications.filter((item) => item.status === "interview").length, offer: applications.filter((item) => item.status === "offer").length }), [applications]);

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (storage === "loading") return;
    const original = applications.find(item => item.id === editingId);
    if (editingId && !original) { setMessage("수정할 기록을 찾지 못했습니다. 목록에서 다시 선택하세요."); return; }
    const error = applicationFormError(form, original);
    if (error) { setMessage(error); return; }
    if (!editingId && applications.length >= newJobLimits.records) { setMessage("새 기록은 500건까지 추가할 수 있습니다. 기존 500건 초과 자료는 자르지 않고 유지하며 수정·내보내기는 가능합니다."); return; }
    const safeForm = { ...form, company: form.company === original?.company ? form.company : form.company.trim(), role: form.role === original?.role ? form.role : form.role.trim(), link: form.link === original?.link ? form.link : form.link.trim() ? safeExternalHttpUrl(form.link)! : "" };
    const next = editingId ? applications.map(item => item.id === editingId ? { ...item, ...safeForm } : item) : [{ id: crypto.randomUUID(), ...safeForm, createdAt: new Date().toISOString() }, ...applications];
    if (!parseApplications(JSON.stringify(next))) { setMessage("기록 형식을 확인해 주세요. 기존 목록은 변경하지 않았습니다."); return; }
    setApplications(next); setFilter("all"); setMessage("화면의 기록을 변경했습니다. 브라우저 저장 여부는 위 상태를 확인하세요.");
    setForm(blankForm); setEditingId(null);
  };

  const edit = (item: Application) => { setEditingId(item.id); setMessage(""); setForm({ company: item.company, role: item.role, status: item.status, appliedDate: item.appliedDate, nextDate: item.nextDate, link: item.link, notes: item.notes }); window.scrollTo({ top: 0, behavior: "smooth" }); };
  const remove = (item: Application) => { if (window.confirm(`${item.company}의 ${item.role} 기록을 삭제할까요? 저장 실패 시 기존 브라우저 저장본에는 남을 수 있습니다.`)) { setApplications((items) => items.filter((entry) => entry.id !== item.id)); if (editingId === item.id) { setEditingId(null); setForm(blankForm); } setMessage("화면에서 삭제했습니다. 실제 저장 상태를 확인하세요."); } };
  const exportBackup = () => {
    if (!applications.length) return;
    const envelope = JSON.stringify(jobBackup(applications, window.location.origin), null, 2);
    const reviewOnly = new Blob([envelope]).size > 2 * 1024 * 1024;
    const body = reviewOnly ? JSON.stringify(applications, null, 2) : envelope;
    try {
      const url = URL.createObjectURL(new Blob([body], { type: "application/json" }));
      try { const anchor = document.createElement("a"); anchor.href = url; anchor.download = reviewOnly ? "hoju-compass-job-applications-review.json" : "hoju-compass-job-device-backup.json"; anchor.click(); }
      finally { URL.revokeObjectURL(url); }
      setBackupFallback(null); setMessage(reviewOnly ? "복원 파일의 2MB 한도를 넘었습니다. 전체 화면 기록을 검토용 JSON으로 내려받습니다. 이 파일은 그대로 자동 복원할 수 없습니다." : "화면의 구직 기록 백업 다운로드를 요청했습니다. 파일을 확인한 뒤 기록 이전 페이지의 ‘JSON 백업 선택하기’에서 선택하세요. 기존 기록 유지 모드에서는 이미 있는 구직 기록을 건너뜁니다.");
    } catch { setBackupFallback(body); setMessage("백업 다운로드에 실패했습니다. 아래 전체 내용을 텍스트 파일로 따로 보관하세요." + (reviewOnly ? " 2MB를 넘어 자동 복원할 수 없는 검토용 JSON입니다." : " .json 파일로 저장하면 기록 이전 페이지에서 확인할 수 있습니다.")); }
  };

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-border bg-white p-5 shadow-sm sm:p-7" aria-labelledby="application-form-heading">
        <div className="flex items-start justify-between gap-4"><div><h2 id="application-form-heading" className="text-xl font-semibold text-navy">{editingId ? "지원 기록 수정" : "지원할 회사 추가"}</h2><p className="mt-1 text-sm leading-6 text-muted">입력 내용은 이 브라우저에만 저장되며 서버로 전송되지 않습니다.</p></div></div>
        <LocalStorageNotice storageKey={jobStorageKey} storage={storage} saveState={saveState} />
        <p className="mt-3 text-xs leading-6 text-muted">새 기록은 500건, 새로 입력·수정하는 회사명·직무는 160자, 메모는 4,000자, 링크는 2,048자까지입니다. 기존 초과 내용은 자동으로 자르지 않습니다.</p>
        <form onSubmit={submit} className="mt-6"><fieldset disabled={storage === "loading"} className="grid min-w-0 gap-4 sm:grid-cols-2 lg:grid-cols-4"><legend className="sr-only">구직 기록 입력</legend>
          <label className="text-sm font-medium text-navy">회사명 *<input className={inputClass} required value={form.company} onChange={(e) => setForm((current) => ({ ...current, company: e.target.value }))} placeholder="Compass Cafe" /></label>
          <label className="text-sm font-medium text-navy">직무 *<input className={inputClass} required value={form.role} onChange={(e) => setForm((current) => ({ ...current, role: e.target.value }))} placeholder="Barista" /></label>
          <label className="text-sm font-medium text-navy">진행 상태<select className={inputClass} value={form.status} onChange={(e) => setForm((current) => ({ ...current, status: e.target.value as Status }))}>{Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
          <label className="text-sm font-medium text-navy">지원일<input className={inputClass} type="date" value={form.appliedDate} onChange={(e) => setForm((current) => ({ ...current, appliedDate: e.target.value }))} /></label>
          <label className="text-sm font-medium text-navy">다음 일정<input className={inputClass} type="date" value={form.nextDate} onChange={(e) => setForm((current) => ({ ...current, nextDate: e.target.value }))} /></label>
          <label className="text-sm font-medium text-navy sm:col-span-2">공고 링크<input className={inputClass} type="url" pattern="https?://.+" title="http:// 또는 https:// 주소를 입력하세요." value={form.link} onChange={(e) => setForm((current) => ({ ...current, link: e.target.value }))} placeholder="https://..." /></label>
          <label className="text-sm font-medium text-navy sm:col-span-2 lg:col-span-4">메모<textarea className={`${inputClass} min-h-24 resize-y`} value={form.notes} onChange={(e) => setForm((current) => ({ ...current, notes: e.target.value }))} placeholder="담당자, 면접 준비 사항, 후속 연락 내용 등을 기록하세요." /></label>
          <div className="flex flex-wrap gap-3 sm:col-span-2 lg:col-span-4"><button type="submit" className="min-h-11 rounded-lg bg-navy px-5 py-2 text-sm font-semibold text-white hover:bg-navy-light">{editingId ? "수정 저장" : "지원 기록 추가"}</button>{editingId && <button type="button" onClick={() => { setEditingId(null); setForm(blankForm); }} className="min-h-11 rounded-lg border border-border px-4 py-2 text-sm text-navy">취소</button>}<button type="button" onClick={exportBackup} disabled={!applications.length} className="min-h-11 rounded-lg border border-border px-4 py-2 text-sm text-navy disabled:opacity-40">기록 이전용 백업</button></div>
        </fieldset></form>
        {message && <p role="status" className="mt-4 text-sm leading-6 text-navy">{message}</p>}
        <p className="mt-3 text-xs leading-6 text-muted">백업은 현재 화면의 기록을 담습니다. <Link href="/data-transfer" className="font-semibold text-navy underline">기록 이전</Link>에서 JSON 파일을 불러오고 구직 지원 현황을 확인하세요. 이전에 받은 검토용 JSON은 검토용으로만 보관하고, 복원용 파일은 이 버튼 또는 기록 이전의 구직 지원 현황 선택 후 만드세요. 개인 메모가 포함되므로 본인이 안전하게 보관하세요.</p>
        {backupFallback !== null && <label className="mt-3 block text-sm text-navy">따로 보관할 전체 JSON<textarea readOnly value={backupFallback} rows={6} onFocus={event => event.target.select()} className="mt-2 w-full rounded-lg border border-border p-3 font-mono text-xs" /></label>}
      </section>

      <section aria-labelledby="application-dashboard-heading">
        <h2 id="application-dashboard-heading" className="sr-only">구직 현황</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><div className="rounded-2xl bg-navy p-5 text-white"><p className="text-sm text-white/65">관심 외 진행·종료 기록</p><p className="mt-1 text-3xl font-semibold">{counts.applied}</p></div><div className="rounded-2xl border border-border bg-white p-5"><p className="text-sm text-muted">진행 중인 면접</p><p className="mt-1 text-3xl font-semibold text-navy">{counts.interview}</p></div><div className="rounded-2xl border border-border bg-white p-5"><p className="text-sm text-muted">받은 오퍼</p><p className="mt-1 text-3xl font-semibold text-navy">{counts.offer}</p></div><div className="rounded-2xl border border-gold/40 bg-gold/5 p-5"><p className="text-sm text-muted">가장 가까운 미래 일정</p><p className="mt-1 break-words font-semibold text-navy">{schedule.next ? `${formatDate(schedule.next.nextDate)} · ${schedule.next.company}` : "미래 일정 없음"}</p></div></div>
        <p className="mt-3 text-xs leading-6 text-muted">관심 외 집계는 지원 완료·면접·오퍼·종료 상태의 기록 수이며 실제 지원 횟수를 추정하지 않습니다. 다음 일정은 개인 메모이며 알림이나 이메일을 보내지 않습니다. 종료 상태의 일정은 제외합니다.</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">{[{ label: "오늘 확인", items: schedule.today }, { label: "지난 일정 확인", items: schedule.past }].map(({ label, items }) => <div key={label} className="min-w-0 rounded-xl border border-border bg-white p-4"><h3 className="font-semibold text-navy">{label}</h3>{items.length ? <ul className="mt-2 space-y-2 text-sm text-muted">{items.map(item => <li key={item.id} className="break-words">{formatDate(item.nextDate)} · {item.company} · {item.role}<button type="button" onClick={() => edit(item)} className="ml-2 min-h-11 px-2 font-semibold text-navy underline">기록 확인</button></li>)}</ul> : <p className="mt-2 text-sm text-muted">해당 일정 없음</p>}</div>)}</div>
      </section>

      <section className="rounded-2xl border border-border bg-white p-5 sm:p-7" aria-labelledby="applications-heading">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><h2 id="applications-heading" className="text-xl font-semibold text-navy">지원 목록</h2><p className="mt-1 text-sm text-muted">{visible.length}개의 기록</p></div><div className="flex flex-wrap gap-2" role="group" aria-label="진행 상태 필터">{(["all", "saved", "applied", "interview", "offer", "closed"] as const).map((value) => <button key={value} type="button" onClick={() => setFilter(value)} className={`min-h-11 rounded-lg border px-3 py-2 text-sm ${filter === value ? "border-navy bg-navy text-white" : "border-border text-muted"}`} aria-pressed={filter === value}>{value === "all" ? "전체" : statusLabels[value]}</button>)}</div></div>
        {visible.length ? <ul className="mt-6 space-y-3">{visible.map((item) => <li key={item.id} className="rounded-xl border border-border p-4 sm:p-5"><div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h3 className="min-w-0 break-words font-semibold text-navy">{item.role}</h3><span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusStyles[item.status]}`}>{statusLabels[item.status]}</span></div><p className="mt-1 break-words text-sm text-muted">{item.company} · 지원 {formatDate(item.appliedDate)} · 다음 일정 {formatDate(item.nextDate)}</p>{item.notes && <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-6 text-muted">{item.notes}</p>}{item.link && <a href={item.link} target="_blank" rel="noreferrer" className="mt-3 inline-flex min-h-11 items-center text-sm font-semibold text-navy underline decoration-gold decoration-2 underline-offset-4">채용 공고 열기</a>}</div><div className="flex shrink-0 gap-2"><button type="button" onClick={() => edit(item)} className="min-h-11 px-3 text-sm font-medium text-navy underline underline-offset-4">수정</button><button type="button" onClick={() => remove(item)} className="min-h-11 px-3 text-sm text-muted underline underline-offset-4">삭제</button></div></div></li>)}</ul> : <div className="mt-6 rounded-xl bg-surface p-8 text-center"><p className="font-medium text-navy">아직 표시할 지원 기록이 없습니다.</p><p className="mt-2 text-sm text-muted">관심 있는 공고부터 추가해 구직 활동을 한곳에서 관리하세요.</p></div>}
      </section>
    </div>
  );
}
