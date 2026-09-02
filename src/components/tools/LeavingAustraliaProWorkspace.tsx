"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { assessLeavingDependencies } from "@/lib/leavingAustraliaDependencies";
import { describeLeavingAmount, formatLeavingCents, parseLeavingAmount, summarizeLeavingAmounts } from "@/lib/leavingAustraliaProAmounts";
import { createLeavingArchive, leavingArchiveMaxBytes, parseLeavingArchive, readLeavingDraft, requestLeavingDownload, writeLeavingDraft, type DepartureDraft, type Settlement, type SettlementStatus, type TaskStatus } from "@/lib/leavingAustraliaProStorage";
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
const taskTitles = new Map<string, string>(tasks.map((task) => [task.id, task.title]));

const initialDraft: DepartureDraft = { departureDate: "", destination: "", statuses: {}, settlements: [], questions: [] };
const inputClass = "mt-1.5 min-h-11 w-full border border-border bg-white px-3 py-2 text-sm text-navy outline-none focus:border-navy focus:ring-2 focus:ring-navy/15";
const taskLabels: Record<TaskStatus, string> = { todo: "준비 전", waiting: "확인·입금 대기", done: "완료" };
const settlementLabels: Record<SettlementStatus, string> = { expected: "예정", followup: "확인 필요", received: "수령 완료" };

function newSettlement(): Settlement {
  return { id: crypto.randomUUID(), kind: "Bond", label: "", dueDate: "", amount: "", status: "expected", note: "" };
}

function safeFileName(value: string) {
  return value.trim().replace(/[^a-z0-9가-힣]+/gi, "-").replace(/^-|-$/g, "").slice(0, 42) || "leaving-australia";
}

export function LeavingAustraliaProWorkspace() {
  const [draft, setDraft] = useState<DepartureDraft>(initialDraft);
  const [loaded, setLoaded] = useState(false);
  const [question, setQuestion] = useState("");
  const [message, setMessage] = useState("");
  const [reviewedDraftSignature, setReviewedDraftSignature] = useState("");
  const [saveStatus, setSaveStatus] = useState<"loading" | "saved" | "pending" | "failed" | "blocked">("loading");
  const [original, setOriginal] = useState<string | null>(null);
  const [archiveDraft, setArchiveDraft] = useState<DepartureDraft | null>(null);
  const [readingArchive, setReadingArchive] = useState(false);
  const [storageMessage, setStorageMessage] = useState("");
  const initialized = useRef(false);
  const protectedStorage = useRef(false);
  const expectedStored = useRef<string | null>(null);
  const lastSavedDraft = useRef(initialDraft);
  const saveTimer = useRef<number | null>(null);
  const readSequence = useRef(0);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    const result = readLeavingDraft(() => window.localStorage);
    expectedStored.current = result.original;
    setOriginal(result.original);
    protectedStorage.current = result.kind === "blocked";
    if (result.kind === "ready") { setDraft(result.draft); lastSavedDraft.current = result.draft; }
    setSaveStatus(result.kind === "blocked" ? "blocked" : "saved");
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded || protectedStorage.current || draft === lastSavedDraft.current) return;
    setSaveStatus("pending");
    saveTimer.current = window.setTimeout(() => {
      saveTimer.current = null;
      const result = writeLeavingDraft(() => window.localStorage, draft, expectedStored.current);
      if (result.kind === "saved") {
        expectedStored.current = result.original;
        lastSavedDraft.current = draft;
        setSaveStatus("saved");
      } else if (result.kind === "conflict") {
        protectedStorage.current = true;
        expectedStored.current = result.original;
        setOriginal(result.original);
        setSaveStatus("blocked");
        setStorageMessage("다른 화면에서 저장본이 변경되거나 삭제되어 자동 저장을 멈췄습니다. 현재 화면을 백업한 뒤 확인해 주세요.");
      } else setSaveStatus("failed");
    }, 350);
    return () => { if (saveTimer.current !== null) window.clearTimeout(saveTimer.current); saveTimer.current = null; };
  }, [draft, loaded]);

  useEffect(() => () => { readSequence.current++; }, []);

  const persistDraft = (next: DepartureDraft) => {
    if (!loaded) return false;
    if (saveTimer.current !== null) window.clearTimeout(saveTimer.current);
    saveTimer.current = null;
    if (protectedStorage.current) {
      // Re-read before asking to replace, then compare again after the confirmation.
      const stored = readLeavingDraft(() => window.localStorage);
      if (stored.kind === "blocked" && stored.original === null) {
        setStorageMessage("저장 공간을 읽을 수 없어 원본 보호를 유지합니다. 권한을 확인한 뒤 다시 시도해 주세요.");
        return false;
      }
      expectedStored.current = stored.original;
      setOriginal(stored.original);
      if (!window.confirm("보호 중인 저장본을 선택한 기록으로 교체합니다. 이전 기록은 되돌릴 수 없습니다. 필요한 원본을 내려받았나요?")) return false;
    }
    const result = writeLeavingDraft(() => window.localStorage, next, expectedStored.current);
    if (result.kind !== "saved") {
      if (result.kind === "conflict") {
        protectedStorage.current = true;
        expectedStored.current = result.original;
        setOriginal(result.original);
      }
      setSaveStatus(protectedStorage.current ? "blocked" : "failed");
      setStorageMessage("저장하지 못했습니다. 현재 화면과 복원 후보는 유지됩니다. 저장 공간·권한 또는 다른 화면의 변경을 확인한 뒤 다시 시도해 주세요.");
      return false;
    }
    expectedStored.current = result.original;
    lastSavedDraft.current = next;
    protectedStorage.current = false;
    setOriginal(null);
    setSaveStatus("saved");
    setStorageMessage("이 브라우저에 저장했습니다. 다른 기기로 옮기려면 백업 파일이 필요합니다.");
    return true;
  };

  const downloadBackup = () => {
    try {
      const text = createLeavingArchive(draft);
      const requested = requestLeavingDownload(text, "hoju-compass-leaving-backup.json", "application/json;charset=utf-8");
      setStorageMessage(requested ? "백업 다운로드를 요청했습니다. 파일이 실제로 저장되었는지 확인하세요." : "백업 다운로드를 시작하지 못했습니다. 기록은 유지됩니다. 다시 시도해 주세요.");
    } catch (error) { setStorageMessage(error instanceof Error ? error.message : "백업을 만들지 못했습니다. 기록은 유지됩니다."); }
  };

  const reviewArchive = async (file?: File) => {
    const sequence = ++readSequence.current;
    setArchiveDraft(null);
    setReadingArchive(false);
    if (!file) return;
    if (file.size > leavingArchiveMaxBytes) { setStorageMessage("1 MiB 이하의 Leaving 백업 파일을 선택해 주세요."); return; }
    setReadingArchive(true);
    setStorageMessage("백업을 읽고 있습니다. 아직 현재 기록은 바뀌지 않았습니다.");
    try {
      const text = await file.text();
      if (sequence !== readSequence.current) return;
      const candidate = parseLeavingArchive(text);
      setArchiveDraft(candidate);
      setStorageMessage("복원 후보를 확인해 주세요. 아래 교체 버튼을 누르기 전에는 현재 기록이 바뀌지 않습니다.");
    } catch (error) {
      if (sequence === readSequence.current) setStorageMessage(error instanceof Error ? error.message : "파일을 읽지 못했습니다. 현재 기록은 유지됩니다.");
    } finally { if (sequence === readSequence.current) setReadingArchive(false); }
  };

  const restoreArchive = () => {
    if (!archiveDraft || !persistDraft(archiveDraft)) return;
    readSequence.current++;
    setDraft(archiveDraft);
    setQuestion("");
    setReviewedDraftSignature("");
    setArchiveDraft(null);
    setMessage("");
    setStorageMessage("백업을 이 브라우저에 저장한 뒤 복원했습니다. 출국 정리 순서를 다시 검토해 주세요.");
  };

  const completed = tasks.filter((task) => draft.statuses[task.id] === "done").length;
  const waiting = tasks.filter((task) => draft.statuses[task.id] === "waiting");
  const progress = Math.round((completed / tasks.length) * 100);
  const outstanding = useMemo(() => summarizeLeavingAmounts(draft.settlements), [draft.settlements]);
  const outstandingDisplay = outstanding.pending === 0 ? "미수령 항목 없음" : outstanding.valid === 0 ? "합산 가능한 금액 없음" : formatLeavingCents(outstanding.cents);
  const amountCoverage = `미수령 ${outstanding.pending}건 중 포함 ${outstanding.valid}건 · 미입력 ${outstanding.blank}건 · 입력 중 ${outstanding.incomplete}건 · 오류 ${outstanding.invalid}건 · 수령 완료 ${outstanding.received}건은 소계 제외`;
  const dependencyReview = useMemo(() => assessLeavingDependencies(draft), [draft]);
  const draftSignature = useMemo(() => JSON.stringify(draft), [draft]);
  const dependencyReviewed = reviewedDraftSignature === draftSignature;
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
    if (!dependencyReviewed) {
      setMessage("먼저 현재 기록의 출국 정리 의존성 검토를 확인해 주세요.");
      return;
    }
    const settlementLabel = (id: string) => {
      const item = draft.settlements.find((settlement) => settlement.id === id);
      return item ? `${item.kind}: ${item.label || "Untitled"}` : id;
    };
    const lines = [
      "HOJU COMPASS — LEAVING AUSTRALIA PREPARATION SUMMARY",
      `Departure date: ${draft.departureDate || "Not set"}`,
      `Destination label: ${draft.destination || "Not set"}`,
      `Task progress: ${completed}/${tasks.length}`,
      "",
      "CLOSURE ORDER REVIEW",
      `Review flags: ${dependencyReview.totalFlags}`,
      "BANK CLOSURE DEPENDENCIES",
      ...(dependencyReview.bankDependencies.length
        ? dependencyReview.bankDependencies.map((id) => `- ${taskTitles.get(id) ?? id}`)
        : ["- Task dependencies complete"]),
      ...(dependencyReview.pendingSettlementIds.length
        ? dependencyReview.pendingSettlementIds.map((id) => `- Pending payment: ${settlementLabel(id)}`)
        : ["- No pending payment records"]),
      "",
      "DASP SEQUENCE RECORDS",
      ...(dependencyReview.daspPrerequisites.length
        ? dependencyReview.daspPrerequisites.map((id) => `- ${taskTitles.get(id) ?? id}`)
        : ["- Recorded prerequisites complete"]),
      "",
      `OVERSEAS ACCESS CONTINUITY: ${dependencyReview.accessContinuityReady ? "Recorded complete" : "Needs review"}`,
      `STATUS CONFLICTS: ${dependencyReview.bankMarkedDoneTooEarly || dependencyReview.daspMarkedDoneTooEarly ? "Review task statuses" : "None flagged"}`,
      "These are sequencing flags based on your entries, not a bank-closure, visa, tax, Super or DASP eligibility decision.",
      "",
      "TASKS",
      ...tasks.map((task) => `- [${taskLabels[draft.statuses[task.id] ?? "todo"]}] ${task.phase} / ${task.title}`),
      "",
      "EXPECTED PAYMENTS — user-entered tracking amounts only",
      `미수령 유효 입력 소계 · 검증 안 됨: ${outstandingDisplay}`,
      amountCoverage,
      "합계는 유효한 입력만 포함한 소계이며 실제 지급액이나 확정액이 아닙니다. 수령 완료로 표시해도 입력 금액이 검증되지는 않습니다.",
      ...(draft.settlements.length ? draft.settlements.flatMap((item) => [`- ${item.kind}: ${item.label || "Untitled"} | ${settlementLabels[item.status]} | Due ${item.dueDate || "not set"} | ${describeLeavingAmount(item.amount)}${item.status === "received" ? " | 미수령 소계 제외 (수령 완료)" : ""}`, `  Note: ${item.note || "None"}`]) : ["- None recorded"]),
      "",
      "QUESTIONS TO CONFIRM",
      ...(draft.questions.length ? draft.questions.map((item, index) => `${index + 1}. ${item}`) : ["- None recorded"]),
      "",
      "This is a personal preparation summary, not migration, tax, superannuation or legal advice. Amounts are not verified. Do not add TFN, passport, bank, visa or super membership numbers.",
    ];
    const requested = requestLeavingDownload(lines.join("\r\n"), `${safeFileName(draft.destination)}-departure-pack.txt`, "text/plain;charset=utf-8");
    setMessage(requested ? "귀국 준비 요약 다운로드를 요청했습니다. 실제 파일 저장 여부를 확인하세요." : "요약 다운로드를 시작하지 못했습니다. 기록과 검토 확인은 유지됩니다. 다시 시도해 주세요.");
  };

  return <div className="grid items-start gap-8 xl:grid-cols-[minmax(0,1fr)_minmax(31rem,0.9fr)]">
    <div className="space-y-8">
      <section className="border border-border bg-surface p-5 sm:p-7" aria-labelledby="departure-storage-heading">
        <h2 id="departure-storage-heading" className="text-xl font-semibold text-navy">기록 저장·백업</h2>
        <p role="status" className="mt-3 text-sm leading-6 text-navy">{saveStatus === "loading" ? "저장 기록을 확인하고 있습니다." : saveStatus === "blocked" ? "원본 보호 중 · 저장본을 안전하게 읽지 못했거나 다른 화면에서 변경되어 자동 저장을 멈췄습니다." : saveStatus === "failed" ? "저장 실패 · 화면의 변경이 아직 이 브라우저에 저장되지 않았습니다." : saveStatus === "pending" ? "변경 내용을 저장하고 있습니다. 완료 전 화면을 닫지 마세요." : "이 브라우저의 저장 상태를 확인했습니다. 변경 내용은 자동 저장됩니다."}</p>
        <p className="mt-3 text-xs leading-5 text-muted">백업에는 화면에 추가한 날짜·별칭·작업 상태·정산·질문만 담습니다. 아직 추가하지 않은 질문, 원본 서류, 구매 권한·복구 코드는 포함하지 않습니다. 민감한 번호를 적지 말고 파일을 안전하게 보관하세요. 브라우저와 설치 앱의 저장 공간은 다를 수 있습니다.</p>
        <div className="mt-4 flex flex-wrap gap-3">
          <button type="button" disabled={!loaded} onClick={downloadBackup} className="min-h-11 border border-navy px-4 text-sm font-semibold text-navy disabled:opacity-50">현재 기록 백업</button>
          {saveStatus === "failed" || saveStatus === "blocked" ? <button type="button" onClick={() => persistDraft(draft)} className="min-h-11 border border-navy px-4 text-sm font-semibold text-navy">{saveStatus === "blocked" ? "현재 화면으로 저장 재개" : "저장 다시 시도"}</button> : null}
          {saveStatus === "blocked" && original !== null ? <button type="button" onClick={() => setStorageMessage(requestLeavingDownload(original, "hoju-compass-leaving-storage-original.txt", "text/plain;charset=utf-8") ? "원본 다운로드를 요청했습니다. 파일 저장을 확인하세요. 원본에는 읽지 못한 정보가 포함될 수 있으니 공유하지 마세요." : "원본 다운로드를 시작하지 못했습니다. 원본 보호는 유지됩니다.")} className="min-h-11 border border-navy px-4 text-sm font-semibold text-navy">저장 원본 내려받기</button> : null}
        </div>
        <label className="mt-5 block text-sm font-medium text-navy">백업 파일 검토 (JSON · 최대 1 MiB)<input type="file" accept=".json,application/json" disabled={!loaded} className={`${inputClass} file:mr-3 file:min-h-11`} onChange={(event) => { const file = event.currentTarget.files?.[0]; event.currentTarget.value = ""; void reviewArchive(file); }} /></label>
        {archiveDraft ? <div className="mt-4 border border-border bg-white p-4"><h3 className="font-semibold text-navy">복원 후보</h3><p className="mt-2 break-words text-sm text-muted">목적지 {archiveDraft.destination || "미입력"} · 출국일 {archiveDraft.departureDate || "미입력"} · 정산 {archiveDraft.settlements.length}개 · 질문 {archiveDraft.questions.length}개</p><p className="mt-2 text-xs leading-5 text-muted">현재 화면의 기록과 입력 중인 질문을 교체합니다. 필요하면 먼저 현재 기록을 백업하세요. 저장에 성공한 경우에만 화면을 바꿉니다.</p><button type="button" onClick={restoreArchive} className="mt-3 min-h-11 bg-navy px-4 text-sm font-semibold text-white">확인한 백업으로 현재 기록 교체</button></div> : null}
        {readingArchive || archiveDraft ? <button type="button" onClick={() => { readSequence.current++; setReadingArchive(false); setArchiveDraft(null); setStorageMessage("복원 검토를 취소했습니다. 현재 기록은 유지됩니다."); }} className="mt-3 min-h-11 border-b-2 border-gold text-sm font-semibold text-navy">복원 검토 취소</button> : null}
        <p aria-live="polite" className="mt-3 min-h-5 text-sm leading-6 text-muted">{storageMessage}</p>
      </section>
      <section className="border-t border-navy/20 pt-6" aria-labelledby="departure-brief-heading"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">Departure brief</p><h2 id="departure-brief-heading" className="mt-2 text-2xl font-semibold text-navy">출국 기준일</h2><p className="mt-3 text-sm leading-6 text-muted">정확한 한국 주소, 항공편과 여권 정보는 입력하지 마세요. 날짜와 내가 알아볼 수 있는 목적지 별칭만 저장합니다.</p><div className="mt-5 grid gap-4 sm:grid-cols-2"><label className="text-sm font-medium text-navy">출국 예정일<input type="date" className={inputClass} value={draft.departureDate} onChange={(event) => setDraft((current) => ({ ...current, departureDate: event.target.value }))} /></label><label className="text-sm font-medium text-navy">목적지 별칭<input className={inputClass} value={draft.destination} onChange={(event) => setDraft((current) => ({ ...current, destination: event.target.value }))} placeholder="예: 한국 귀국" /></label></div>{daysUntilDeparture !== null ? <p className="mt-4 border-l-2 border-gold pl-3 text-sm text-muted">{daysUntilDeparture >= 0 ? `출국일까지 약 ${daysUntilDeparture}일 남았습니다.` : `입력한 출국일로부터 ${Math.abs(daysUntilDeparture)}일 지났습니다.`}</p> : null}</section>

      <section className="border border-border bg-white p-5 sm:p-7" aria-labelledby="departure-task-heading"><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">Ordered handoff</p><h2 id="departure-task-heading" className="mt-2 text-xl font-semibold text-navy">출국 전후 준비 순서</h2></div><div className="text-right"><p className="font-mono text-3xl text-navy">{progress}%</p><p className="text-xs text-muted">{completed}/{tasks.length} 완료</p></div></div><div className="mt-5 h-1.5 bg-surface"><div className="h-full bg-gold transition-all" style={{ width: `${progress}%` }} /></div><ol className="mt-6 divide-y divide-border border-y border-navy/20">{tasks.map((task, index) => { const status = draft.statuses[task.id] ?? "todo"; return <li key={task.id} className="py-5"><div className="grid gap-3 sm:grid-cols-[2rem_1fr_9rem] sm:items-start"><span className="font-mono text-xs text-gold">{String(index + 1).padStart(2, "0")}</span><div><p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">{task.phase}</p><h3 className="mt-1 font-semibold text-navy">{task.title}</h3><p className="mt-2 text-sm leading-6 text-muted">{task.detail}</p></div><label className="text-xs font-medium text-muted">상태<select className="mt-1 min-h-10 w-full border border-border bg-white px-2 text-sm text-navy" value={status} onChange={(event) => setDraft((current) => ({ ...current, statuses: { ...current.statuses, [task.id]: event.target.value as TaskStatus } }))}><option value="todo">준비 전</option><option value="waiting">확인·입금 대기</option><option value="done">완료</option></select></label></div></li>; })}</ol></section>
    </div>

    <div className="space-y-8">
      <section className="border border-border bg-white p-5 shadow-sm sm:p-7" aria-labelledby="settlement-heading">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">Settlement tracker</p><h2 id="settlement-heading" className="mt-2 text-xl font-semibold text-navy">받을 돈·마지막 정산</h2></div>
          <div className="min-w-0 max-w-full text-right"><p className="break-words font-mono text-2xl text-navy">{outstandingDisplay}</p><p className="text-xs text-muted">미수령 유효 입력 소계 · 검증 안 됨</p></div>
        </div>
        <p className="mt-3 text-xs leading-5 text-muted">{amountCoverage}</p>
        <p className="mt-4 border-l-2 border-gold pl-3 text-xs leading-5 text-muted">계좌번호, TFN, Super 회원번호는 적지 마세요. 금액은 받을 돈의 일정 추적용이며 실제 지급액이나 DASP 예상액이 아닙니다. 수령 완료로 표시해도 입력 금액이 검증되지는 않습니다.</p>
        <p id="settlement-amount-help" className="mt-3 text-xs leading-5 text-muted">0은 명시적인 입력입니다. 빈값·입력 중·오류 금액은 합계에 넣지 않습니다. 음수는 합산하지 않으며, 센트 미만 금액은 반올림하지 않습니다. 예: 1234.56 (쉼표·통화기호 제외). 원문은 저장·백업에 그대로 유지됩니다.</p>
        <div className="mt-5 space-y-4">{draft.settlements.map((item, index) => {
          const amount = parseLeavingAmount(item.amount);
          const amountStatusId = `settlement-amount-status-${index}`;
          return <article key={item.id} className="border border-border p-4">
            <div className="flex items-start justify-between gap-3"><p className="font-mono text-xs text-gold">PAYMENT {String(index + 1).padStart(2, "0")}</p><button type="button" onClick={() => setDraft((current) => ({ ...current, settlements: current.settlements.filter((entry) => entry.id !== item.id) }))} className="min-h-9 text-xs font-medium text-muted hover:text-red-700">삭제</button></div>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <label className="text-xs font-medium text-navy">종류<select className={inputClass} value={item.kind} onChange={(event) => updateSettlement(item.id, "kind", event.target.value)}><option>Bond</option><option>Final pay</option><option>Tax refund</option><option>DASP</option><option>Utility credit</option><option>Other</option></select></label>
              <label className="text-xs font-medium text-navy">별칭<input className={inputClass} value={item.label} onChange={(event) => updateSettlement(item.id, "label", event.target.value)} placeholder="예: 마지막 직장 급여" /></label>
              <label className="text-xs font-medium text-navy">확인 예정일<input type="date" className={inputClass} value={item.dueDate} onChange={(event) => updateSettlement(item.id, "dueDate", event.target.value)} /></label>
              <div className="min-w-0">
                <label className="text-xs font-medium text-navy">예상 금액 A$<input type="text" inputMode="decimal" aria-invalid={amount.kind === "invalid" || amount.kind === "incomplete"} aria-describedby={`settlement-amount-help ${amountStatusId}`} className={inputClass} value={item.amount} onChange={(event) => updateSettlement(item.id, "amount", event.target.value)} /></label>
                <p id={amountStatusId} className={`mt-2 whitespace-pre-wrap break-all text-xs leading-5 ${amount.kind === "invalid" || amount.kind === "incomplete" ? "text-red-800" : "text-muted"}`}>{describeLeavingAmount(item.amount)}{item.status === "received" ? " · 미수령 소계 제외 (수령 완료)" : ""}</p>
              </div>
              <label className="text-xs font-medium text-navy sm:col-span-2">상태<select className={inputClass} value={item.status} onChange={(event) => updateSettlement(item.id, "status", event.target.value as SettlementStatus)}>{Object.entries(settlementLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
              <label className="text-xs font-medium text-navy sm:col-span-2">후속 조치 메모<textarea className={`${inputClass} min-h-20 resize-y`} value={item.note} onChange={(event) => updateSettlement(item.id, "note", event.target.value)} placeholder="어디에 언제 확인할지 적으세요. 민감정보는 제외하세요." /></label>
            </div>
          </article>;
        })}</div>
        <button type="button" onClick={() => setDraft((current) => ({ ...current, settlements: [...current.settlements, newSettlement()] }))} className="mt-5 min-h-11 border-b-2 border-gold text-sm font-semibold text-navy">+ 정산 항목 추가</button>
      </section>

      <section className="border border-border bg-white p-5 shadow-sm sm:p-7" aria-labelledby="departure-question-heading"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">Questions to confirm</p><h2 id="departure-question-heading" className="mt-2 text-xl font-semibold text-navy">확인할 질문</h2><label className="mt-5 block text-sm font-medium text-navy">질문<textarea className={`${inputClass} min-h-20 resize-y`} value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="예: 해외에서 마지막 Tax return을 언제 신고해야 하나요?" /></label><button type="button" onClick={addQuestion} className="mt-3 min-h-11 bg-navy px-4 text-sm font-semibold text-white">질문 추가</button>{draft.questions.length ? <ol className="mt-5 space-y-3">{draft.questions.map((item, index) => <li key={`${item}-${index}`} className="flex gap-3 border-t border-border pt-3"><span className="font-mono text-xs text-gold">{String(index + 1).padStart(2, "0")}</span><p className="flex-1 text-sm leading-6 text-navy">{item}</p><button type="button" onClick={() => setDraft((current) => ({ ...current, questions: current.questions.filter((_, itemIndex) => itemIndex !== index) }))} className="min-h-9 text-xs text-muted">삭제</button></li>)}</ol> : <p className="mt-5 text-sm text-muted">아직 추가한 질문이 없습니다.</p>}</section>

      <section className="border border-border bg-surface p-5 sm:p-7" aria-labelledby="departure-dependency-heading">
        <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">Closure order review</p><h2 id="departure-dependency-heading" className="mt-2 text-xl font-semibold text-navy">너무 일찍 닫지 않기</h2></div><p className="font-mono text-2xl text-navy">{dependencyReview.totalFlags}</p></div>
        <p className="mt-3 text-sm leading-6 text-muted">현재 입력을 바탕으로 계좌 해지, DASP 순서와 해외 접근 수단을 서로 대조합니다. 실제 지급 방식이나 자격을 판정하지 않습니다.</p>
        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          <article className="border border-border bg-white p-4"><h3 className="text-sm font-semibold text-navy">호주 계좌 해지 전</h3><p className="mt-2 text-xs leading-5 text-muted">미완료 작업 {dependencyReview.bankDependencies.length}개 · 미수령 정산 {dependencyReview.pendingSettlementIds.length}개</p><ul className="mt-3 space-y-1 border-t border-border pt-3">{dependencyReview.bankDependencies.map((id) => <li key={id} className="text-xs leading-5 text-navy">{taskTitles.get(id) ?? id}</li>)}{dependencyReview.pendingSettlementIds.map((id) => { const item = draft.settlements.find((settlement) => settlement.id === id); return <li key={id} className="text-xs leading-5 text-navy">미수령 · {item?.label || item?.kind || id}</li>; })}{!dependencyReview.bankDependencies.length && !dependencyReview.pendingSettlementIds.length ? <li className="text-xs leading-5 text-muted">기록상 남은 항목 없음</li> : null}</ul></article>
          <article className="border border-border bg-white p-4"><h3 className="text-sm font-semibold text-navy">DASP 순서 기록</h3><p className="mt-2 text-xs leading-5 text-muted">출국·비자 종료·Super 확인 중 미완료 {dependencyReview.daspPrerequisites.length}개</p><ul className="mt-3 space-y-1 border-t border-border pt-3">{dependencyReview.daspPrerequisites.map((id) => <li key={id} className="text-xs leading-5 text-navy">{taskTitles.get(id) ?? id}</li>)}{!dependencyReview.daspPrerequisites.length ? <li className="text-xs leading-5 text-muted">기록상 전제 순서 완료</li> : null}</ul></article>
          <article className="border border-border bg-white p-4"><h3 className="text-sm font-semibold text-navy">해외 접근 수단</h3><p className="mt-2 text-xs leading-5 text-muted">{dependencyReview.accessContinuityReady ? "은행·myGov·이메일 복구 수단 변경을 완료로 기록했습니다." : "호주 번호 해지 전에 해외에서 쓸 복구 수단을 확인하세요."}</p>{dependencyReview.bankMarkedDoneTooEarly || dependencyReview.daspMarkedDoneTooEarly ? <p className="mt-3 border-l-2 border-red-600 pl-3 text-xs leading-5 text-red-800">완료로 표시한 작업과 남은 전제 기록이 충돌합니다. 상태를 다시 확인하세요.</p> : null}</article>
        </div>
        <button type="button" onClick={() => { setReviewedDraftSignature(draftSignature); setMessage("현재 기록의 출국 정리 의존성을 확인했습니다. 이제 요약을 저장할 수 있습니다."); }} className={dependencyReviewed ? "mt-5 min-h-11 border border-navy px-4 text-sm font-semibold text-navy" : "mt-5 min-h-11 bg-navy px-4 text-sm font-semibold text-white hover:bg-navy-light"}>{dependencyReviewed ? "현재 순서 검토 완료" : "현재 순서 검토 확인"}</button>
        {dependencyReviewed ? <p className="mt-3 text-xs leading-5 text-muted">상태나 정산 기록을 수정하면 검토 확인이 자동으로 만료됩니다.</p> : null}
      </section>
      <section className="bg-navy p-5 text-white sm:p-7" aria-labelledby="departure-summary-heading"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">Departure summary</p><h2 id="departure-summary-heading" className="mt-2 text-xl font-semibold">개인 인계 요약</h2><dl className="mt-5 grid grid-cols-3 gap-px bg-white/15 text-center"><div className="bg-navy p-3"><dt className="text-xs text-white/55">완료</dt><dd className="mt-1 text-xl font-semibold">{completed}</dd></div><div className="bg-navy p-3"><dt className="text-xs text-white/55">대기</dt><dd className="mt-1 text-xl font-semibold">{waiting.length}</dd></div><div className="bg-navy p-3"><dt className="text-xs text-white/55">정산</dt><dd className="mt-1 text-xl font-semibold">{draft.settlements.length}</dd></div></dl><button type="button" onClick={downloadSummary} className="mt-5 min-h-11 bg-gold px-4 text-sm font-semibold text-navy hover:bg-white">귀국 준비 요약 저장</button><p className="mt-4 min-h-5 text-xs leading-5 text-white/60" aria-live="polite">{message}</p></section>
    </div>
  </div>;
}
