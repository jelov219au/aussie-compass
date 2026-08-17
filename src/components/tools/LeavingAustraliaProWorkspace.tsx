"use client";

import { useEffect, useMemo, useState } from "react";

type TaskStatus = "todo" | "waiting" | "done";
type SettlementStatus = "expected" | "followup" | "received";
type Settlement = { id: string; kind: string; label: string; dueDate: string; amount: string; status: SettlementStatus; note: string };
type DepartureDraft = {
  departureDate: string;
  destination: string;
  statuses: Record<string, TaskStatus>;
  settlements: Settlement[];
  questions: string[];
};

const STORAGE_KEY = "hoju-compass-leaving-pro-v1";
const tasks = [
  { id: "final-pay", phase: "출국 전", title: "최종 급여·Payslip", detail: "마지막 급여일, 미사용 휴가와 고용주 Super 납입 시점을 서면 자료로 확인합니다." },
  { id: "income", phase: "출국 전", title: "Income statement·세금 자료", detail: "해외에서도 myGov와 ATO에 안전하게 접근할 수 있는지 확인하고 기록을 보관합니다." },
  { id: "bond", phase: "출국 전", title: "퇴거·Bond 반환", detail: "Condition report, 사진, 열쇠 반납과 관할 공식 Bond 청구 상태를 확인합니다." },
  { id: "utilities", phase: "출국 전", title: "전기·가스·인터넷 종료", detail: "최종 검침, 종료일, 장비 반납과 마지막 청구서 수령 방법을 기록합니다." },
  { id: "bank", phase: "출국 전", title: "호주 계좌 유지·해지 순서", detail: "Bond, 급여, 세금 또는 DASP 지급 방법을 확인하기 전에 계좌를 닫지 않습니다." },
  { id: "access", phase: "출국 전", title: "전화번호·2단계 인증", detail: "호주 번호 해지 전에 은행·myGov·이메일의 복구 수단을 해외에서 사용할 방법으로 바꿉니다." },
  { id: "super", phase: "출국 전", title: "모든 Super 계정 확인", detail: "펀드명과 연락처, 마지막 납입 여부를 본인의 안전한 기록에서 확인합니다." },
  { id: "departed", phase: "출국 후", title: "실제 출국 확인", detail: "DASP는 호주를 떠난 뒤에만 제출할 수 있습니다." },
  { id: "visa", phase: "출국 후", title: "임시비자 종료 확인", detail: "DASP 제출에는 비자가 더 이상 유효하지 않아야 합니다. 비자 취소 결정은 별도로 신중히 확인하세요." },
  { id: "dasp", phase: "출국 후", title: "DASP 신청·확인 메일", detail: "ATO 공식 시스템에서 신청하고 제출 확인과 지급 명세를 보관합니다." },
  { id: "tax", phase: "출국 후", title: "마지막 Tax return 일정", detail: "대부분 6월 30일 뒤 해외에서도 신고할 수 있습니다. 조기 신고 대상은 ATO 조건을 확인합니다." },
] as const;

const initialDraft: DepartureDraft = { departureDate: "", destination: "", statuses: {}, settlements: [], questions: [] };
const inputClass = "mt-1.5 min-h-11 w-full border border-border bg-white px-3 py-2 text-sm text-navy outline-none focus:border-navy focus:ring-2 focus:ring-navy/15";
const taskLabels: Record<TaskStatus, string> = { todo: "준비 전", waiting: "확인·입금 대기", done: "완료" };
const settlementLabels: Record<SettlementStatus, string> = { expected: "예정", followup: "확인 필요", received: "수령 완료" };

function newSettlement(): Settlement {
  return { id: crypto.randomUUID(), kind: "Bond", label: "", dueDate: "", amount: "", status: "expected", note: "" };
}

function safeAmount(value: string) {
  const amount = Number(value);
  return Number.isFinite(amount) && amount > 0 ? amount : 0;
}

function safeFileName(value: string) {
  return value.trim().replace(/[^a-z0-9가-힣]+/gi, "-").replace(/^-|-$/g, "").slice(0, 42) || "leaving-australia";
}

export function LeavingAustraliaProWorkspace() {
  const [draft, setDraft] = useState<DepartureDraft>(initialDraft);
  const [loaded, setLoaded] = useState(false);
  const [question, setQuestion] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved) setDraft((current) => ({ ...current, ...JSON.parse(saved) }));
    } catch {}
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    const timer = window.setTimeout(() => {
      try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(draft)); } catch {}
    }, 350);
    return () => window.clearTimeout(timer);
  }, [draft, loaded]);

  const completed = tasks.filter((task) => draft.statuses[task.id] === "done").length;
  const waiting = tasks.filter((task) => draft.statuses[task.id] === "waiting");
  const progress = Math.round((completed / tasks.length) * 100);
  const outstandingTotal = useMemo(() => draft.settlements.filter((item) => item.status !== "received").reduce((sum, item) => sum + safeAmount(item.amount), 0), [draft.settlements]);
  const daysUntilDeparture = useMemo(() => {
    if (!draft.departureDate) return null;
    const target = new Date(`${draft.departureDate}T12:00:00`);
    return Math.ceil((target.getTime() - Date.now()) / 86400000);
  }, [draft.departureDate]);

  const updateSettlement = <K extends keyof Settlement>(id: string, key: K, value: Settlement[K]) => setDraft((current) => ({ ...current, settlements: current.settlements.map((item) => item.id === id ? { ...item, [key]: value } : item) }));
  const addQuestion = () => {
    const value = question.trim();
    if (!value) return;
    setDraft((current) => ({ ...current, questions: [...current.questions, value] }));
    setQuestion("");
  };

  const downloadSummary = () => {
    const lines = [
      "HOJU COMPASS — LEAVING AUSTRALIA PREPARATION SUMMARY",
      `Departure date: ${draft.departureDate || "Not set"}`,
      `Destination label: ${draft.destination || "Not set"}`,
      `Task progress: ${completed}/${tasks.length}`,
      "",
      "TASKS",
      ...tasks.map((task) => `- [${taskLabels[draft.statuses[task.id] ?? "todo"]}] ${task.phase} / ${task.title}`),
      "",
      "EXPECTED PAYMENTS — user-entered tracking amounts only",
      ...(draft.settlements.length ? draft.settlements.flatMap((item) => [`- ${item.kind}: ${item.label || "Untitled"} | ${settlementLabels[item.status]} | Due ${item.dueDate || "not set"} | A$${safeAmount(item.amount).toFixed(2)}`, `  Note: ${item.note || "None"}`]) : ["- None recorded"]),
      "",
      "QUESTIONS TO CONFIRM",
      ...(draft.questions.length ? draft.questions.map((item, index) => `${index + 1}. ${item}`) : ["- None recorded"]),
      "",
      "This is a personal preparation summary, not migration, tax, superannuation or legal advice. Amounts are not verified. Do not add TFN, passport, bank, visa or super membership numbers.",
    ];
    const url = URL.createObjectURL(new Blob([lines.join("\r\n")], { type: "text/plain;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${safeFileName(draft.destination)}-departure-pack.txt`;
    anchor.click();
    URL.revokeObjectURL(url);
    setMessage("귀국 준비 현황을 텍스트 파일로 저장했습니다.");
  };

  return <div className="grid items-start gap-8 xl:grid-cols-[minmax(0,1fr)_minmax(31rem,0.9fr)]">
    <div className="space-y-8">
      <section className="border-t border-navy/20 pt-6" aria-labelledby="departure-brief-heading"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">Departure brief</p><h2 id="departure-brief-heading" className="mt-2 text-2xl font-semibold text-navy">출국 기준일</h2><p className="mt-3 text-sm leading-6 text-muted">정확한 한국 주소, 항공편과 여권 정보는 입력하지 마세요. 날짜와 내가 알아볼 수 있는 목적지 별칭만 저장합니다.</p><div className="mt-5 grid gap-4 sm:grid-cols-2"><label className="text-sm font-medium text-navy">출국 예정일<input type="date" className={inputClass} value={draft.departureDate} onChange={(event) => setDraft((current) => ({ ...current, departureDate: event.target.value }))} /></label><label className="text-sm font-medium text-navy">목적지 별칭<input className={inputClass} value={draft.destination} onChange={(event) => setDraft((current) => ({ ...current, destination: event.target.value }))} placeholder="예: 한국 귀국" /></label></div>{daysUntilDeparture !== null ? <p className="mt-4 border-l-2 border-gold pl-3 text-sm text-muted">{daysUntilDeparture >= 0 ? `출국일까지 약 ${daysUntilDeparture}일 남았습니다.` : `입력한 출국일로부터 ${Math.abs(daysUntilDeparture)}일 지났습니다.`}</p> : null}</section>

      <section className="border border-border bg-white p-5 sm:p-7" aria-labelledby="departure-task-heading"><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">Ordered handoff</p><h2 id="departure-task-heading" className="mt-2 text-xl font-semibold text-navy">출국 전후 준비 순서</h2></div><div className="text-right"><p className="font-mono text-3xl text-navy">{progress}%</p><p className="text-xs text-muted">{completed}/{tasks.length} 완료</p></div></div><div className="mt-5 h-1.5 bg-surface"><div className="h-full bg-gold transition-all" style={{ width: `${progress}%` }} /></div><ol className="mt-6 divide-y divide-border border-y border-navy/20">{tasks.map((task, index) => { const status = draft.statuses[task.id] ?? "todo"; return <li key={task.id} className="py-5"><div className="grid gap-3 sm:grid-cols-[2rem_1fr_9rem] sm:items-start"><span className="font-mono text-xs text-gold">{String(index + 1).padStart(2, "0")}</span><div><p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">{task.phase}</p><h3 className="mt-1 font-semibold text-navy">{task.title}</h3><p className="mt-2 text-sm leading-6 text-muted">{task.detail}</p></div><label className="text-xs font-medium text-muted">상태<select className="mt-1 min-h-10 w-full border border-border bg-white px-2 text-sm text-navy" value={status} onChange={(event) => setDraft((current) => ({ ...current, statuses: { ...current.statuses, [task.id]: event.target.value as TaskStatus } }))}><option value="todo">준비 전</option><option value="waiting">확인·입금 대기</option><option value="done">완료</option></select></label></div></li>; })}</ol></section>
    </div>

    <div className="space-y-8">
      <section className="border border-border bg-white p-5 shadow-sm sm:p-7" aria-labelledby="settlement-heading"><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">Settlement tracker</p><h2 id="settlement-heading" className="mt-2 text-xl font-semibold text-navy">받을 돈·마지막 정산</h2></div><div className="text-right"><p className="font-mono text-2xl text-navy">A${outstandingTotal.toFixed(2)}</p><p className="text-xs text-muted">입력한 미수령 예상액 · 검증 안 됨</p></div></div><p className="mt-4 border-l-2 border-gold pl-3 text-xs leading-5 text-muted">계좌번호, TFN, Super 회원번호는 적지 마세요. 금액은 일정 추적용이며 실제 지급액이나 DASP 예상액이 아닙니다.</p><div className="mt-5 space-y-4">{draft.settlements.map((item, index) => <article key={item.id} className="border border-border p-4"><div className="flex items-start justify-between gap-3"><p className="font-mono text-xs text-gold">PAYMENT {String(index + 1).padStart(2, "0")}</p><button type="button" onClick={() => setDraft((current) => ({ ...current, settlements: current.settlements.filter((entry) => entry.id !== item.id) }))} className="min-h-9 text-xs font-medium text-muted hover:text-red-700">삭제</button></div><div className="mt-3 grid gap-3 sm:grid-cols-2"><label className="text-xs font-medium text-navy">종류<select className={inputClass} value={item.kind} onChange={(event) => updateSettlement(item.id, "kind", event.target.value)}><option>Bond</option><option>Final pay</option><option>Tax refund</option><option>DASP</option><option>Utility credit</option><option>Other</option></select></label><label className="text-xs font-medium text-navy">별칭<input className={inputClass} value={item.label} onChange={(event) => updateSettlement(item.id, "label", event.target.value)} placeholder="예: 마지막 직장 급여" /></label><label className="text-xs font-medium text-navy">확인 예정일<input type="date" className={inputClass} value={item.dueDate} onChange={(event) => updateSettlement(item.id, "dueDate", event.target.value)} /></label><label className="text-xs font-medium text-navy">예상 금액 A$<input type="number" min="0" step="0.01" className={inputClass} value={item.amount} onChange={(event) => updateSettlement(item.id, "amount", event.target.value)} /></label><label className="text-xs font-medium text-navy sm:col-span-2">상태<select className={inputClass} value={item.status} onChange={(event) => updateSettlement(item.id, "status", event.target.value as SettlementStatus)}>{Object.entries(settlementLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><label className="text-xs font-medium text-navy sm:col-span-2">후속 조치 메모<textarea className={`${inputClass} min-h-20 resize-y`} value={item.note} onChange={(event) => updateSettlement(item.id, "note", event.target.value)} placeholder="어디에 언제 확인할지 적으세요. 민감정보는 제외하세요." /></label></div></article>)}</div><button type="button" onClick={() => setDraft((current) => ({ ...current, settlements: [...current.settlements, newSettlement()] }))} className="mt-5 min-h-11 border-b-2 border-gold text-sm font-semibold text-navy">+ 정산 항목 추가</button></section>

      <section className="border border-border bg-white p-5 shadow-sm sm:p-7" aria-labelledby="departure-question-heading"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">Questions to confirm</p><h2 id="departure-question-heading" className="mt-2 text-xl font-semibold text-navy">확인할 질문</h2><label className="mt-5 block text-sm font-medium text-navy">질문<textarea className={`${inputClass} min-h-20 resize-y`} value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="예: 해외에서 마지막 Tax return을 언제 신고해야 하나요?" /></label><button type="button" onClick={addQuestion} className="mt-3 min-h-11 bg-navy px-4 text-sm font-semibold text-white">질문 추가</button>{draft.questions.length ? <ol className="mt-5 space-y-3">{draft.questions.map((item, index) => <li key={`${item}-${index}`} className="flex gap-3 border-t border-border pt-3"><span className="font-mono text-xs text-gold">{String(index + 1).padStart(2, "0")}</span><p className="flex-1 text-sm leading-6 text-navy">{item}</p><button type="button" onClick={() => setDraft((current) => ({ ...current, questions: current.questions.filter((_, itemIndex) => itemIndex !== index) }))} className="min-h-9 text-xs text-muted">삭제</button></li>)}</ol> : <p className="mt-5 text-sm text-muted">아직 추가한 질문이 없습니다.</p>}</section>

      <section className="bg-navy p-5 text-white sm:p-7" aria-labelledby="departure-summary-heading"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">Departure summary</p><h2 id="departure-summary-heading" className="mt-2 text-xl font-semibold">개인 인계 요약</h2><dl className="mt-5 grid grid-cols-3 gap-px bg-white/15 text-center"><div className="bg-navy p-3"><dt className="text-xs text-white/55">완료</dt><dd className="mt-1 text-xl font-semibold">{completed}</dd></div><div className="bg-navy p-3"><dt className="text-xs text-white/55">대기</dt><dd className="mt-1 text-xl font-semibold">{waiting.length}</dd></div><div className="bg-navy p-3"><dt className="text-xs text-white/55">정산</dt><dd className="mt-1 text-xl font-semibold">{draft.settlements.length}</dd></div></dl><button type="button" onClick={downloadSummary} className="mt-5 min-h-11 bg-gold px-4 text-sm font-semibold text-navy hover:bg-white">귀국 준비 요약 저장</button><p className="mt-4 min-h-5 text-xs leading-5 text-white/60" aria-live="polite">{message}</p></section>
    </div>
  </div>;
}
