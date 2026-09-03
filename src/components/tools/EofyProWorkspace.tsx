"use client";

import { type ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  createEofyArchive,
  parseEofyArchive,
  eofyQuestionLimit,
  eofyQuestionMaxLength,
  eofyExpenseLimit,
  eofyExpenseDescriptionMaxLength,
  eofyExpenseNoteMaxLength,
  eofyArchiveMaxBytes,
  eofyDocumentLimit,
  eofyDocumentLabelMaxLength,
  eofyDocumentNoteMaxLength,
  getEofyDocumentArchiveIssues,
  getEofyExpenseArchiveIssues,
  getEofyAmountCents,
  type EofyArchive,
  type EofyDraft,
  type EofyExpenseRecord,
  type EofyStatus,
  type EofyDocumentRecord,
} from "@/lib/eofyProArchive";
import { assessEofyHandoff } from "@/lib/eofyProHandoff";
import { readEofyDraft, writeEofyDraft } from "@/lib/eofyProDeviceStorage";
import { requestEofyDownload } from "@/lib/eofyProDownload";

const incomeSources = [
  { id: "employment", title: "모든 고용주의 Income statement", detail: "myGov의 ATO 서비스에서 각 고용주 자료가 Tax ready인지 확인합니다." },
  { id: "interest", title: "은행 이자와 공동계좌", detail: "사용 빈도가 낮은 계좌와 공동계좌의 이자도 Pre-fill과 대조합니다." },
  { id: "government", title: "정부 지급금·수당", detail: "신고 대상 여부와 Pre-fill 내용을 ATO 원문에서 확인합니다." },
  { id: "gig", title: "부업·플랫폼·현금 소득", detail: "고용소득과 별도로 받은 금액과 관련 기록을 빠뜨리지 않습니다." },
  { id: "complex", title: "투자·가상자산·임대·해외 소득", detail: "해당된다면 거래·환율·비용 자료를 분리하고 전문가 상담 필요 여부를 확인합니다." },
];
const categories = ["업무용 장비·도구", "의류·세탁", "차량·업무 이동", "재택근무", "자기계발", "조합비·전문가 비용", "기부", "세무 비용", "기타 확인 항목"];
const statusLabels: Record<EofyStatus, string> = { todo: "확인 전", review: "확인 필요", ready: "준비 완료" };
const evidenceLabels = { receipt: "영수증·인보이스", calculation: "계산·사용기록", missing: "증빙 확인 필요" } as const;
const expenseArchiveIssueLabels: Record<keyof EofyExpenseRecord, string> = {
  id: "항목 식별자 확인 필요",
  category: "분류: 1~100자",
  description: `항목 설명: ${eofyExpenseDescriptionMaxLength}자 이내`,
  date: "지출일: YYYY-MM-DD 형식의 실제 존재하는 날짜",
  amount: "지출 금액: 0~9,999,999.99, 소수 둘째 자리까지",
  workUse: "업무 사용 비율: 0~100, 소수 둘째 자리까지",
  evidence: "증빙 상태 확인 필요",
  reimbursed: "환급 여부 확인 필요",
  note: `업무 관련성·계산 메모: ${eofyExpenseNoteMaxLength}자 이내`,
};
const inputClass = "mt-1.5 min-h-11 w-full border border-border bg-white px-3 py-2 text-sm text-navy outline-none transition placeholder:text-muted/60 focus:border-navy focus:ring-2 focus:ring-navy/15";

function newExpense(): EofyExpenseRecord {
  return { id: crypto.randomUUID(), category: categories[0], description: "", date: "", amount: "", workUse: "100", evidence: "receipt", reimbursed: false, note: "" };
}

function recordedAmountLabel(value: string) {
  const cents = getEofyAmountCents(value);
  return cents === null ? (value ? `Unvalidated input: ${value}` : "Not set") : `A$${(cents / 100).toFixed(2)}`;
}

function requestDownload(blob: Blob, filename: string) {
  return requestEofyDownload(() => ({ urls: URL, document }), blob, filename);
}

export function EofyProWorkspace() {
  const currentYear = new Date().getMonth() >= 6 ? new Date().getFullYear() : new Date().getFullYear() - 1;
  const [draft, setDraft] = useState<EofyDraft>({ taxYear: `${currentYear}–${String(currentYear + 1).slice(-2)}`, incomeStatuses: {}, expenses: [], questions: [] });
  const [knownTaxYears, setKnownTaxYears] = useState<string[]>([]);
  const taxYearOptions = [...new Set([
    ...[currentYear - 1, currentYear, currentYear + 1].map((year) => `${year}–${String(year + 1).slice(-2)}`),
    ...knownTaxYears,
    draft.taxYear,
  ])];
  const [questionInput, setQuestionInput] = useState("");
  const [questionMessage, setQuestionMessage] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [message, setMessage] = useState("");
  const [archiveMessage, setArchiveMessage] = useState("");
  const [archiveError, setArchiveError] = useState("");
  const [archiveReading, setArchiveReading] = useState(false);
  const [pendingArchive, setPendingArchive] = useState<EofyArchive | null>(null);
  const [reviewedDraftSignature, setReviewedDraftSignature] = useState("");
  const [storageBlocked, setStorageBlocked] = useState(false);
  const [originalStoredValue, setOriginalStoredValue] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<"loading" | "pending" | "saved" | "failed">("loading");
  const didInitialise = useRef(false);
  const saveTimer = useRef<number | null>(null);
  const lastSavedDraft = useRef<EofyDraft | null>(null);
  const archiveReadSequence = useRef(0);

  useEffect(() => () => { archiveReadSequence.current += 1; }, []);

  useEffect(() => {
    if (didInitialise.current) return;
    didInitialise.current = true;
    const result = readEofyDraft(() => window.localStorage);
    if (result.kind === "ready") {
      lastSavedDraft.current = result.draft;
      setDraft(result.draft);
      setKnownTaxYears([result.draft.taxYear]);
      setSaveState("saved");
    } else if (result.kind === "blocked") {
      setOriginalStoredValue(result.original);
      setStorageBlocked(true);
      setSaveState("failed");
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded || storageBlocked) return;
    if (lastSavedDraft.current === draft) return;
    setSaveState("pending");
    const timer = window.setTimeout(() => {
      saveTimer.current = null;
      if (writeEofyDraft(() => window.localStorage, draft)) {
        lastSavedDraft.current = draft;
        setSaveState("saved");
      } else {
        setSaveState("failed");
      }
    }, 400);
    saveTimer.current = timer;
    return () => {
      window.clearTimeout(timer);
      if (saveTimer.current === timer) saveTimer.current = null;
    };
  }, [draft, loaded, storageBlocked]);

  const cancelPendingSave = () => {
    if (saveTimer.current !== null) window.clearTimeout(saveTimer.current);
    saveTimer.current = null;
  };

  const retrySave = () => {
    if (!loaded) return;
    if (storageBlocked && !window.confirm("저장 원본을 현재 화면 내용으로 덮어쓰고 저장을 재개할까요? 먼저 저장 원본과 현재 화면을 각각 내려받아 확인하세요.")) return;
    cancelPendingSave();
    if (!writeEofyDraft(() => window.localStorage, draft)) {
      setSaveState("failed");
      return;
    }
    lastSavedDraft.current = draft;
    setStorageBlocked(false);
    setOriginalStoredValue(null);
    setSaveState("saved");
  };

  const downloadStoredOriginal = () => {
    if (originalStoredValue === null) return;
    try {
      const requested = requestDownload(new Blob([originalStoredValue], { type: "text/plain;charset=utf-8" }), "hoju-compass-eofy-storage-original.txt");
      setMessage(requested ? "저장 원본 내려받기를 요청했습니다. 파일이 실제로 저장됐는지 확인하세요." : "다운로드를 시작하지 못했습니다. 저장 원본은 유지했습니다. 브라우저 권한을 확인한 뒤 다시 시도하세요.");
    } catch {
      setMessage("다운로드를 시작하지 못했습니다. 저장 원본은 유지했습니다. 브라우저 권한을 확인한 뒤 다시 시도하세요.");
    }
  };

  const incomeReady = incomeSources.filter((source) => draft.incomeStatuses[source.id] === "ready").length;
  const incomeReview = incomeSources.filter((source) => draft.incomeStatuses[source.id] !== "ready");
  const handoffReview = useMemo(() => assessEofyHandoff(draft), [draft]);
  const expenseReviewIds = new Set([...handoffReview.missingEvidence, ...handoffReview.reimbursed, ...handoffReview.privateUseGaps, ...handoffReview.incompleteDetails]);
  const expenseReview = draft.expenses.filter((expense) => expenseReviewIds.has(expense.id));
  const amountTotals = useMemo(() => {
    const amounts = draft.expenses.map((expense) => getEofyAmountCents(expense.amount));
    return { cents: amounts.reduce<number>((sum, cents) => sum + (cents ?? 0), 0), excluded: amounts.filter((cents) => cents === null).length };
  }, [draft.expenses]);
  const candidateTotal = amountTotals.cents / 100;
  const expenseArchiveIssues = useMemo(() => draft.expenses.map(getEofyExpenseArchiveIssues), [draft.expenses]);
  const documents = draft.documents ?? [];
  const documentArchiveIssues = documents.map(getEofyDocumentArchiveIssues);
  const documentsToReview = documents.filter((item, index) => item.status !== "ready" || !item.label.trim() || !item.checkedOn || documentArchiveIssues[index].length);
  const draftSignature = useMemo(() => JSON.stringify(draft), [draft]);
  const handoffReviewed = reviewedDraftSignature === draftSignature;
  const progressParts = incomeSources.length + draft.expenses.length + documents.length;
  const readyParts = incomeReady + draft.expenses.length - expenseReview.length + documents.length - documentsToReview.length;
  const progress = readyParts === progressParts ? 100 : Math.min(99, Math.round((readyParts / progressParts) * 100));

  const setIncomeStatus = (id: string, status: EofyStatus) => setDraft((current) => ({ ...current, incomeStatuses: { ...current.incomeStatuses, [id]: status } }));
  const updateDocument = <K extends keyof EofyDocumentRecord>(id: string, field: K, value: EofyDocumentRecord[K]) => setDraft((current) => ({ ...current, documents: (current.documents ?? []).map((item) => item.id === id ? { ...item, [field]: value } : item) }));
  const addDocument = () => {
    if (documents.length >= eofyDocumentLimit) return;
    const item: EofyDocumentRecord = { id: crypto.randomUUID(), sourceId: "employment", label: "", status: "todo", checkedOn: "", note: "" };
    setDraft((current) => (current.documents ?? []).length >= eofyDocumentLimit ? current : { ...current, documents: [...(current.documents ?? []), item] });
  };
  const updateExpense = <K extends keyof EofyExpenseRecord>(id: string, field: K, value: EofyExpenseRecord[K]) => setDraft((current) => ({ ...current, expenses: current.expenses.map((expense) => expense.id === id ? { ...expense, [field]: value } : expense) }));
  const addExpense = () => {
    if (draft.expenses.length >= eofyExpenseLimit) return;
    const expense = newExpense();
    setDraft((current) => current.expenses.length >= eofyExpenseLimit ? current : { ...current, expenses: [...current.expenses, expense] });
  };
  const removeExpense = (id: string) => setDraft((current) => ({ ...current, expenses: current.expenses.filter((expense) => expense.id !== id) }));
  const expenseName = (id: string) => {
    const index = draft.expenses.findIndex((expense) => expense.id === id);
    const expense = draft.expenses[index];
    return expense ? `${index + 1}. ${expense.description || expense.category}` : id;
  };

  const addQuestion = () => {
    const question = questionInput.trim();
    if (!question) return;
    if (draft.questions.length >= eofyQuestionLimit) {
      setQuestionMessage("질문이 가득 찼습니다. 입력은 유지됩니다. 기존 질문을 직접 삭제한 뒤 다시 추가하세요.");
      return;
    }
    if (question.length > eofyQuestionMaxLength) {
      setQuestionMessage("백업에 담을 수 있도록 질문을 500자 이내로 줄여 주세요. 입력은 삭제하지 않았습니다.");
      return;
    }
    setDraft((current) => ({ ...current, questions: [...current.questions, question] }));
    setQuestionInput("");
    setQuestionMessage("질문을 추가했습니다. 브라우저 저장 상태도 확인하세요.");
  };

  const downloadSummary = () => {
    if (!handoffReviewed) {
      setMessage("먼저 현재 기록의 회계사 전달 준비 검토를 확인해 주세요.");
      return;
    }
    const expenseLabel = (id: string) => {
      const index = draft.expenses.findIndex((expense) => expense.id === id);
      const expense = draft.expenses[index];
      return expense ? `${index + 1}. ${expense.category} — ${expense.description || "No description"}` : id;
    };
    const expenseReviewLines = (title: string, ids: string[]) => [
      title,
      ...(ids.length ? ids.map((id) => `- ${expenseLabel(id)}`) : ["- None flagged"]),
      "",
    ];
    const lines = [
      `HOJU COMPASS — EOFY PACK ${draft.taxYear}`,
      "Preparation summary only — not a tax return or deduction calculation",
      "",
      "ACCOUNTANT HANDOFF READINESS REVIEW",
      `Review flags: ${handoffReview.totalFlags} across ${handoffReview.flaggedExpenseCount} expense candidate(s)`,
      "",
      "INCOME SOURCES NOT READY",
      ...(handoffReview.incomeNotReady.length
        ? handoffReview.incomeNotReady.map((id) => `- ${incomeSources.find((source) => source.id === id)?.title ?? id}`)
        : ["- None flagged"]),
      "",
      ...expenseReviewLines("MISSING EVIDENCE", handoffReview.missingEvidence),
      ...expenseReviewLines("REIMBURSED ITEMS — KEEP SEPARATE FOR REVIEW", handoffReview.reimbursed),
      ...expenseReviewLines("PRIVATE-USE CALCULATION GAPS", handoffReview.privateUseGaps),
      ...expenseReviewLines("INCOMPLETE RECORD DETAILS", handoffReview.incompleteDetails),
      "These are preparation flags, not findings about deductibility or tax treatment.",
      "",
      "INCOME SOURCES",
      ...incomeSources.map((source) => `- [${statusLabels[draft.incomeStatuses[source.id] ?? "todo"]}] ${source.title}`),
      "",
      `INDIVIDUAL DOCUMENT RECORDS (${documents.length}; ${documentsToReview.length} to review)`,
      "User-recorded preparation status only; not confirmation of ATO Tax ready or tax treatment.",
      ...(documents.length ? documents.flatMap((item, index) => [
        `${index + 1}. ${item.label || "No document label"} | ${incomeSources.find(source => source.id === item.sourceId)?.title ?? item.sourceId}`,
        `   Status: ${statusLabels[item.status]} | Checked on (user entry): ${item.checkedOn || "Not recorded"}`,
        `   Next check / question: ${item.note || "Not recorded"}`,
        ...(documentArchiveIssues[index].length ? ["   Archive validation: review this record before JSON backup"] : []),
      ]) : ["- None recorded"]),
      "",
      `EXPENSE CANDIDATES (${draft.expenses.length})`,
      ...draft.expenses.flatMap((expense, index) => [
        `${index + 1}. ${expense.category} — ${expense.description || "No description"}`,
        `   Date: ${expense.date || "Not set"} | Amount recorded: ${recordedAmountLabel(expense.amount)} | Work-use note: ${expense.workUse || "Not set"}%`,
        `   Evidence: ${evidenceLabels[expense.evidence]} | Reimbursed: ${expense.reimbursed ? "Yes — review before claiming" : "No"}`,
        expense.note ? `   Note: ${expense.note}` : "",
      ].filter(Boolean)),
      "",
      `TOTAL VALID RECORDED CANDIDATE SPEND: A$${candidateTotal.toFixed(2)}`,
      `AMOUNT ENTRIES EXCLUDED FROM TOTAL: ${amountTotals.excluded} (blank or unvalidated; original input retained above)`,
      "This is not the deductible amount. Eligibility, private-use portions, reimbursements and special substantiation rules must be checked separately.",
      "",
      "QUESTIONS FOR MYTAX OR A REGISTERED TAX AGENT",
      ...(draft.questions.length ? draft.questions.map((question) => `- ${question}`) : ["- None added"]),
      "",
      "Do not add TFN, bank account numbers, myGov credentials or receipt images to this file.",
    ];
    try {
      const requested = requestDownload(new Blob([lines.join("\r\n")], { type: "text/plain;charset=utf-8" }), `hoju-compass-eofy-pack-${draft.taxYear.replace("–", "-")}.txt`);
      setMessage(requested ? "EOFY 회계사 전달 요약 내려받기를 요청했습니다. 파일이 실제로 저장됐는지 확인하세요." : "다운로드를 시작하지 못했습니다. 기록과 검토 상태는 유지했습니다. 브라우저 권한을 확인한 뒤 다시 시도하세요.");
    } catch {
      setMessage("다운로드를 시작하지 못했습니다. 기록과 검토 상태는 유지했습니다. 브라우저 권한을 확인한 뒤 다시 시도하세요.");
    }
  };

  const downloadArchive = () => {
    setArchiveError("");
    setArchiveMessage("");
    if (documents.length > eofyDocumentLimit || documentArchiveIssues.some(issues => issues.length)) {
      setArchiveError("백업을 만들지 않았습니다. 문서별 기록의 개수·입력 한도와 확인일을 확인하세요. 현재 입력은 그대로 유지했습니다.");
      return;
    }
    if (draft.expenses.length > eofyExpenseLimit || expenseArchiveIssues.some((issues) => issues.length)) {
      setArchiveError("백업을 만들지 않았습니다. 공제 후보 기록에 표시된 개수·입력 한도를 확인하세요. 현재 입력은 그대로 유지했습니다.");
      return;
    }
    let archive: EofyArchive;
    try {
      archive = createEofyArchive(draft);
    } catch {
      setArchiveError("현재 기록에 백업할 수 없는 값이 있습니다. 회계연도, 문서, 질문과 지출 항목을 다시 확인해 주세요.");
      return;
    }
    try {
      const blob = new Blob([JSON.stringify(archive, null, 2)], { type: "application/json" });
      if (blob.size > eofyArchiveMaxBytes) {
        setArchiveError("백업 파일이 가져오기 한도인 512KB를 넘습니다. 입력은 그대로 유지했습니다. 설명·메모를 별도로 보관한 뒤 길이를 줄여 다시 시도하세요.");
        return;
      }
      const requested = requestDownload(blob, `hoju-compass-eofy-archive-${draft.taxYear.replace("–", "-")}.json`);
      if (requested) setArchiveMessage("이 회계연도의 JSON 백업 내려받기를 요청했습니다. 파일이 실제로 저장됐는지 확인하세요.");
      else setArchiveError("다운로드를 시작하지 못했습니다. 검증한 백업 내용과 현재 기록은 유지했습니다. 브라우저 권한을 확인한 뒤 다시 시도하세요.");
    } catch {
      setArchiveError("다운로드를 시작하지 못했습니다. 현재 기록은 유지했습니다. 브라우저 권한을 확인한 뒤 다시 시도하세요.");
    }
  };

  const reviewArchive = async (event: ChangeEvent<HTMLInputElement>) => {
    const readSequence = ++archiveReadSequence.current;
    const input = event.currentTarget;
    const file = input.files?.[0];
    input.value = "";
    setPendingArchive(null);
    setArchiveMessage("");
    setArchiveError("");
    setArchiveReading(false);
    if (!file) return;
    if (file.size > eofyArchiveMaxBytes) {
      setArchiveError("백업 파일이 너무 큽니다. 512KB 이하의 EOFY Pack Pro JSON 파일을 선택해 주세요.");
      return;
    }
    setArchiveReading(true);
    setArchiveMessage("백업 파일을 읽고 있습니다. 다른 파일을 선택하거나 읽기를 취소할 수 있습니다.");
    try {
      const archive = parseEofyArchive(JSON.parse(await file.text()));
      if (readSequence !== archiveReadSequence.current) return;
      if (!archive) throw new Error("Invalid EOFY archive");
      setPendingArchive(archive);
      setArchiveMessage("백업을 확인했습니다. 아래 회계연도와 항목 수를 검토한 뒤 교체를 확정하세요.");
    } catch {
      if (readSequence !== archiveReadSequence.current) return;
      setArchiveMessage("");
      setArchiveError("파일을 읽을 수 없습니다. EOFY Pack Pro에서 내려받은 원본 JSON 백업인지 확인해 주세요.");
    } finally {
      if (readSequence === archiveReadSequence.current) setArchiveReading(false);
    }
  };

  const cancelArchiveReview = () => {
    archiveReadSequence.current += 1;
    setArchiveReading(false);
    setPendingArchive(null);
    setArchiveError("");
    setArchiveMessage("");
  };

  const restoreArchive = () => {
    if (!loaded || !pendingArchive) return;
    // Persist first: a denied/full store must not replace the visible draft or discard the reviewed backup.
    cancelPendingSave();
    if (!writeEofyDraft(() => window.localStorage, pendingArchive.draft)) {
      setSaveState(lastSavedDraft.current === draft ? "saved" : "failed");
      setArchiveMessage("");
      setArchiveError("백업을 확인했지만 브라우저에 저장하지 못했습니다. 현재 작업과 검토한 백업을 유지했습니다. 저장 공간이나 권한을 확인한 뒤 다시 시도하거나 취소하세요.");
      return;
    }
    lastSavedDraft.current = pendingArchive.draft;
    setDraft(pendingArchive.draft);
    setKnownTaxYears((current) => [...new Set([...current, pendingArchive.draft.taxYear])]);
    setStorageBlocked(false);
    setOriginalStoredValue(null);
    setSaveState("saved");
    setReviewedDraftSignature("");
    setMessage("");
    setPendingArchive(null);
    setArchiveError("");
    setArchiveMessage("백업으로 현재 EOFY 작업을 교체하고 이 브라우저에 저장했습니다. 회계사 전달 전 복원한 기록을 다시 검토하세요.");
  };

  return <div className="grid items-start gap-8 xl:grid-cols-[minmax(0,0.9fr)_minmax(34rem,1.1fr)]">
    <section aria-label="브라우저 저장 상태" className="border border-border bg-surface p-5 xl:col-span-2">
      <p role="status" className="text-sm font-semibold text-navy">{storageBlocked ? "저장 원본 보호 중 · 자동 저장을 중단했습니다." : saveState === "failed" ? "저장 실패 · 최근 수정은 이 브라우저에 저장되지 않았습니다." : saveState === "loading" ? "저장 내용을 확인하는 중입니다." : saveState === "saved" ? "현재 작업을 이 브라우저에 저장했습니다." : "최근 수정을 저장하는 중입니다."}</p>
      <p className="mt-2 text-xs leading-5 text-muted">{storageBlocked ? "원본을 안전하게 읽지 못해 현재 화면은 저장 원본과 다를 수 있습니다. 원본과 현재 화면을 각각 내려받아 확인한 뒤 저장 재개를 선택하거나 아래에서 검토한 백업을 복원하세요." : "저장 내용은 이 기기·브라우저에만 남으며 자동으로 동기화되지 않습니다. 저장 실패 시 공간·권한을 확인하고, 페이지를 닫기 전에 현재 화면을 백업하거나 다시 저장하세요."} 아직 추가하지 않은 질문 입력은 백업에 포함되지 않습니다.</p>
      {storageBlocked || saveState === "failed" ? <div className="mt-4 flex flex-wrap gap-3">
        <button type="button" onClick={downloadArchive} className="min-h-11 border border-navy px-4 text-sm font-semibold text-navy">현재 화면 JSON 백업</button>
        {storageBlocked ? <button type="button" onClick={downloadStoredOriginal} disabled={originalStoredValue === null} className="min-h-11 border border-navy px-4 text-sm font-semibold text-navy disabled:opacity-50">저장 원본 내려받기</button> : null}
        <button type="button" onClick={retrySave} className="min-h-11 bg-navy px-4 text-sm font-semibold text-white">{storageBlocked ? "현재 화면으로 저장 재개" : "저장 다시 시도"}</button>
      </div> : null}
    </section>
    <div className="space-y-8">
      <section className="border-t border-navy/20 pt-6" aria-labelledby="eofy-income-heading"><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">Income cross-check</p><h2 id="eofy-income-heading" className="mt-2 text-2xl font-semibold text-navy">소득 자료 준비</h2></div><label className="text-sm font-medium text-navy">회계연도<select className={`${inputClass} min-w-36`} value={draft.taxYear} onChange={(event) => setDraft((current) => ({ ...current, taxYear: event.target.value }))}>{taxYearOptions.map((year) => <option key={year} value={year}>{year || "저장된 연도 없음 · 선택 필요"}</option>)}</select></label></div><p className="mt-4 text-sm leading-6 text-muted">Pre-fill도 최종 신고 내용과 일치하는지 직접 확인해야 합니다. 금액은 이 화면에 입력하지 않고 상태만 기록하세요.</p>
        <ol className="mt-6 divide-y divide-border border-y border-navy/20">{incomeSources.map((source, index) => <li key={source.id} className="grid gap-3 py-5 sm:grid-cols-[2rem_1fr_8rem]"><span className="font-mono text-xs text-gold">{String(index + 1).padStart(2, "0")}</span><div><h3 className="font-semibold text-navy">{source.title}</h3><p className="mt-2 text-sm leading-6 text-muted">{source.detail}</p></div><label className="text-xs font-medium text-muted">상태<select className="mt-1 min-h-10 w-full border border-border bg-white px-2 text-sm text-navy" value={draft.incomeStatuses[source.id] ?? "todo"} onChange={(event) => setIncomeStatus(source.id, event.target.value as EofyStatus)}><option value="todo">확인 전</option><option value="review">확인 필요</option><option value="ready">준비 완료</option></select></label></li>)}</ol>
      </section>

      <section className="border border-border bg-white p-5 sm:p-7" aria-labelledby="eofy-documents-heading">
        <h2 id="eofy-documents-heading" className="text-xl font-semibold text-navy">고용주·문서별 확인 기록</h2>
        <p id="eofy-document-help" className="mt-3 text-sm leading-6 text-muted">같은 종류의 자료가 여러 개면 문서마다 별칭을 붙이세요. 예: 가상 직장 A · Income statement. 파일을 올리거나 금액·TFN·계좌번호·로그인 정보를 적지 않습니다. 다음 확인 질문은 회계사 TXT와 JSON 백업에도 포함됩니다.</p>
        <p id="eofy-document-limit" className="mt-3 text-xs leading-5 text-muted">{documents.length} / {eofyDocumentLimit}개 · 확인할 문서 {documentsToReview.length}개. 문서 상태는 위 소득 종류의 상태와 별개이며, ATO의 Tax ready 여부나 신고 자격을 판정하지 않습니다.</p>
        <p className="mt-2 text-xs leading-5 text-muted">기존 v1 백업도 복원할 수 있습니다. 문서 기록을 담은 v2 백업은 구버전에서 열리지 않으므로 최신 사이트에서 복원하세요.</p>
        <div className="mt-5 space-y-4">{documents.map((item, index) => <fieldset key={item.id} className="min-w-0 border border-border p-4" aria-describedby={`eofy-document-help eofy-document-issues-${index}`}>
          <legend className="px-1 text-sm font-semibold text-navy">문서 {index + 1}</legend>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-medium text-navy">소득 종류<select className={inputClass} value={item.sourceId} onChange={event => updateDocument(item.id, "sourceId", event.target.value)}>{!incomeSources.some(source => source.id === item.sourceId) ? <option value={item.sourceId}>저장된 분류 확인 필요: {item.sourceId}</option> : null}{incomeSources.map(source => <option key={source.id} value={source.id}>{source.title}</option>)}</select></label>
            <label className="text-sm font-medium text-navy">고용주·문서 별칭<input className={inputClass} value={item.label} aria-invalid={documentArchiveIssues[index].includes("label")} aria-describedby={`eofy-document-issues-${index}`} onChange={event => updateDocument(item.id, "label", event.target.value)} /><span className="mt-1 block text-xs font-normal text-muted">{item.label.length} / {eofyDocumentLabelMaxLength}자</span></label>
            <label className="text-sm font-medium text-navy">문서 준비 상태<select className={inputClass} value={item.status} onChange={event => updateDocument(item.id, "status", event.target.value as EofyStatus)}>{Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
            <label className="text-sm font-medium text-navy">직접 확인한 날짜<input type="text" className={inputClass} value={item.checkedOn} placeholder="YYYY-MM-DD · 미확인은 빈칸" aria-invalid={documentArchiveIssues[index].includes("checkedOn")} aria-describedby={`eofy-document-issues-${index}`} onChange={event => updateDocument(item.id, "checkedOn", event.target.value)} /></label>
            <label className="text-sm font-medium text-navy sm:col-span-2">다음 확인·회계사 질문<textarea className={`${inputClass} min-h-20 resize-y`} value={item.note} aria-invalid={documentArchiveIssues[index].includes("note")} aria-describedby={`eofy-document-issues-${index}`} onChange={event => updateDocument(item.id, "note", event.target.value)} /><span className="mt-1 block text-xs font-normal text-muted">{item.note.length} / {eofyDocumentNoteMaxLength}자</span></label>
          </div>
          <p id={`eofy-document-issues-${index}`} aria-live="polite" className="mt-3 text-xs leading-5 text-muted">{documentArchiveIssues[index].length ? "백업 전 별칭 120자·질문 500자 한도, 소득 종류와 실제 날짜(YYYY-MM-DD)를 확인하세요. 입력 원문은 유지합니다." : "빈 별칭·확인일이나 미완료 상태는 문서 확인 목록에 남습니다."}</p>
          <button type="button" aria-label={`문서 ${index + 1} 삭제`} className="mt-2 min-h-11 min-w-11 text-sm text-muted hover:text-red-700" onClick={() => setDraft(current => ({ ...current, documents: (current.documents ?? []).filter(document => document.id !== item.id) }))}>삭제</button>
        </fieldset>)}</div>
        <button type="button" onClick={addDocument} disabled={!loaded || documents.length >= eofyDocumentLimit} aria-describedby="eofy-document-limit" className="mt-5 min-h-11 border-b-2 border-gold text-sm font-semibold text-navy disabled:cursor-not-allowed disabled:opacity-50">+ 문서 기록 추가</button>
      </section>

      <section className="border border-border bg-white p-5 sm:p-7" aria-labelledby="golden-rules-heading"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">ATO basic rules</p><h2 id="golden-rules-heading" className="mt-2 text-xl font-semibold text-navy">업무 관련 비용 세 가지 기본 확인</h2><ol className="mt-5 space-y-3 text-sm leading-6 text-muted"><li className="border-l-2 border-gold pl-3"><strong className="text-navy">1. 내가 지출했고 환급받지 않았는가</strong></li><li className="border-l-2 border-gold pl-3"><strong className="text-navy">2. 소득을 얻는 업무와 직접 관련되는가</strong></li><li className="border-l-2 border-gold pl-3"><strong className="text-navy">3. 지출과 계산 방식을 입증할 기록이 있는가</strong></li></ol><p className="mt-4 text-xs leading-5 text-muted">업무와 개인 사용이 섞였다면 업무 관련 부분만 검토합니다. 이 도구는 세 조건 충족 여부를 판정하지 않습니다.</p></section>

      <section className="border border-border bg-surface p-5 sm:p-7" aria-labelledby="eofy-questions-heading">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">Accountant handoff</p><h2 id="eofy-questions-heading" className="mt-2 text-xl font-semibold text-navy">확인할 질문 모으기</h2>
        <p id="eofy-question-limit" className="mt-3 text-xs leading-5 text-muted">현재 {draft.questions.length} / {eofyQuestionLimit}개 · 입력 {questionInput.trim().length} / {eofyQuestionMaxLength}자. 한도에 도달하면 기존 질문을 직접 삭제하거나 입력을 줄여 주세요. 아직 추가하지 않은 입력은 저장·백업에 포함되지 않습니다.</p>
        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <label className="min-w-0 flex-1 text-sm font-medium text-navy">질문<input className={inputClass} value={questionInput} aria-describedby="eofy-question-limit" onChange={(event) => { setQuestionInput(event.target.value); setQuestionMessage(""); }} onKeyDown={(event) => { if (event.key === "Enter" && !event.nativeEvent.isComposing && event.nativeEvent.keyCode !== 229) { event.preventDefault(); addQuestion(); } }} placeholder="예: 두 직장을 오갈 때 차량 비용 기록은 어떻게 구분하나요?" /></label>
          <button type="button" onClick={addQuestion} disabled={draft.questions.length >= eofyQuestionLimit || questionInput.trim().length > eofyQuestionMaxLength || !questionInput.trim()} aria-describedby="eofy-question-limit" className="min-h-11 self-end bg-navy px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50">질문 추가</button>
        </div>
        <p role="status" className="mt-3 min-h-5 text-xs leading-5 text-muted">{questionMessage}</p>
        {draft.questions.length ? <ol className="mt-5 divide-y divide-border border-y border-navy/20">{draft.questions.map((question, index) => <li key={`${question}-${index}`} className="flex gap-3 py-4"><span className="font-mono text-xs text-gold">{String(index + 1).padStart(2, "0")}</span><p className="min-w-0 flex-1 break-words text-sm leading-6 text-navy">{question}</p><button type="button" aria-label={`질문 ${index + 1} 삭제`} onClick={() => { setDraft((current) => ({ ...current, questions: current.questions.filter((_, itemIndex) => itemIndex !== index) })); setQuestionMessage("선택한 질문을 삭제했습니다. 입력 중인 질문은 유지됩니다."); }} className="min-h-11 min-w-11 text-xs font-medium text-muted hover:text-red-700">삭제</button></li>)}</ol> : <p className="mt-5 text-sm text-muted">아직 추가한 질문이 없습니다.</p>}
      </section>
    </div>

    <div className="space-y-8 xl:sticky xl:top-24">
      <section className="border border-border bg-white p-5 shadow-sm sm:p-7" aria-labelledby="expense-register-heading"><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">Evidence register</p><h2 id="expense-register-heading" className="mt-2 text-xl font-semibold text-navy">공제 후보 기록</h2></div><div className="text-right"><p className="font-mono text-2xl text-navy">A${candidateTotal.toFixed(2)}</p><p className="text-xs text-muted">유효한 금액 합계 · 공제액 아님</p>{amountTotals.excluded ? <p className="mt-1 text-xs text-red-700">합계 미포함 {amountTotals.excluded}개 · 미입력 또는 확인 필요</p> : null}</div></div>
        <div className="mt-5 border-l-2 border-gold bg-gold/8 p-4 text-xs leading-5 text-muted">영수증 원본은 업로드하지 않습니다. 금액은 개인 준비용이며 공제 가능성이나 환급액을 뜻하지 않습니다.</div>
        <p id="eofy-expense-limit" className="mt-4 text-xs leading-5 text-muted">현재 {draft.expenses.length} / {eofyExpenseLimit}개 · 백업 파일은 512KB 이하여야 합니다. 한도에 도달하면 추가만 중단하며 기존 기록은 자동 삭제하지 않습니다.</p>
        <div className="mt-6 space-y-5">{draft.expenses.map((expense, index) => <article key={expense.id} aria-label={`공제 후보 ${index + 1}`} className="border border-border p-4 sm:p-5">
          <div className="flex items-start justify-between gap-4"><div className="min-w-0"><p className="font-mono text-xs text-gold">ITEM {String(index + 1).padStart(2, "0")}</p><h3 className="mt-1 break-words font-semibold text-navy">{expense.description || "새 공제 후보"}</h3></div><button type="button" aria-label={`지출 항목 ${index + 1} 삭제`} onClick={() => removeExpense(expense.id)} className="min-h-11 min-w-11 shrink-0 text-xs font-medium text-muted hover:text-red-700">삭제</button></div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-medium text-navy">분류<select className={inputClass} value={expense.category} onChange={(event) => updateExpense(expense.id, "category", event.target.value)}>{categories.map((category) => <option key={category}>{category}</option>)}</select></label>
            <label className="text-sm font-medium text-navy">지출일<input type="date" className={inputClass} value={expense.date} aria-invalid={expenseArchiveIssues[index].includes("date")} aria-describedby={`eofy-expense-issues-${index}`} onChange={(event) => updateExpense(expense.id, "date", event.target.value)} /></label>
            <label className="text-sm font-medium text-navy sm:col-span-2">항목 설명<input className={inputClass} value={expense.description} aria-invalid={expenseArchiveIssues[index].includes("description")} aria-describedby={`eofy-description-limit-${index} eofy-expense-issues-${index}`} onChange={(event) => updateExpense(expense.id, "description", event.target.value)} placeholder="예: 업무용 안전화" /><span id={`eofy-description-limit-${index}`} className="mt-1 block text-xs font-normal text-muted">{expense.description.length} / {eofyExpenseDescriptionMaxLength}자 · 초과 입력은 유지되며 백업 전 수정이 필요합니다.</span></label>
            <label className="text-sm font-medium text-navy">지출 금액 A$<input type="number" min="0" max="9999999.99" step="0.01" className={inputClass} value={expense.amount} aria-invalid={expenseArchiveIssues[index].includes("amount")} aria-describedby={`eofy-expense-issues-${index}`} onChange={(event) => updateExpense(expense.id, "amount", event.target.value)} /></label>
            <label className="text-sm font-medium text-navy">업무 사용 비율 메모 %<input type="number" min="0" max="100" step="0.01" className={inputClass} value={expense.workUse} aria-invalid={expenseArchiveIssues[index].includes("workUse")} aria-describedby={`eofy-expense-issues-${index}`} onChange={(event) => updateExpense(expense.id, "workUse", event.target.value)} /></label>
            <label className="text-sm font-medium text-navy">증빙 상태<select className={inputClass} value={expense.evidence} onChange={(event) => updateExpense(expense.id, "evidence", event.target.value as EofyExpenseRecord["evidence"])}>{Object.entries(evidenceLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
            <label className="flex min-h-11 items-center gap-3 self-end border border-border bg-white px-3 text-sm text-navy"><input type="checkbox" checked={expense.reimbursed} onChange={(event) => updateExpense(expense.id, "reimbursed", event.target.checked)} className="h-5 w-5 accent-[var(--color-gold)]" />고용주 등이 환급함</label>
            <label className="text-sm font-medium text-navy sm:col-span-2">업무 관련성·계산 메모<textarea className={`${inputClass} min-h-20 resize-y`} value={expense.note} aria-invalid={expenseArchiveIssues[index].includes("note")} aria-describedby={`eofy-note-limit-${index} eofy-expense-issues-${index}`} onChange={(event) => updateExpense(expense.id, "note", event.target.value)} placeholder="개인 사용분과 업무 사용분을 어떻게 구분했는지 적으세요." /><span id={`eofy-note-limit-${index}`} className="mt-1 block text-xs font-normal text-muted">{expense.note.length} / {eofyExpenseNoteMaxLength}자 · 초과 입력은 유지되며 백업 전 수정이 필요합니다.</span></label>
          </div>
          <div id={`eofy-expense-issues-${index}`} aria-live="polite">{expenseArchiveIssues[index].includes("date") ? <p className="mt-3 break-all text-xs leading-5 text-red-700">기록된 지출일: {expense.date} · 원문은 유지했습니다. 날짜를 다시 선택해 주세요.</p> : null}{expenseArchiveIssues[index].length ? <div className="mt-4 border-l-2 border-red-700 pl-3 text-xs leading-5 text-red-700"><p>백업 전에 확인하세요. 입력은 삭제하지 않았습니다.</p><ul>{expenseArchiveIssues[index].map((field) => <li key={field}>{expenseArchiveIssueLabels[field]}</li>)}</ul></div> : null}</div>
          {expenseReview.some((review) => review.id === expense.id) ? <p className="mt-4 border-l-2 border-gold pl-3 text-xs leading-5 text-[#755b20]">날짜·설명·금액·증빙·환급 여부·사용 비율을 다시 확인하세요. 환급받은 비용은 일반적으로 그대로 공제 후보로 보지 않습니다.</p> : null}
        </article>)}</div>
        <button type="button" onClick={addExpense} disabled={draft.expenses.length >= eofyExpenseLimit} aria-describedby="eofy-expense-limit" className="mt-5 min-h-11 border-b-2 border-gold text-sm font-semibold text-navy disabled:cursor-not-allowed disabled:opacity-50">+ 공제 후보 추가</button>
      </section>

      <section className="border border-border bg-surface p-5 sm:p-7" aria-labelledby="eofy-handoff-review-heading"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">Accountant handoff review</p><h2 id="eofy-handoff-review-heading" className="mt-2 text-xl font-semibold text-navy">전달 전에 따로 볼 항목</h2></div><p className="font-mono text-2xl text-navy">{handoffReview.totalFlags + documentsToReview.length}</p></div><p className="mt-3 text-sm leading-6 text-muted">같은 항목이 여러 범주에 표시될 수 있습니다. 이 분류는 공제 가능 여부를 판단하지 않고, 상담 전에 확인할 기록을 놓치지 않도록 돕습니다.</p>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {[
            { title: "증빙 확인 필요", detail: "영수증·계산 기록이 아직 없다고 표시한 항목", ids: handoffReview.missingEvidence },
            { title: "환급받은 항목", detail: "고용주 등이 환급했다고 표시한 항목", ids: handoffReview.reimbursed },
            { title: "개인 사용분 계산 공백", detail: "100% 미만인데 계산 기록 또는 구분 메모가 없는 항목", ids: handoffReview.privateUseGaps },
            { title: "기본 기록 미완성", detail: "설명·날짜·금액·사용 비율을 다시 채워야 하는 항목", ids: handoffReview.incompleteDetails },
          ].map((group) => <article key={group.title} className="border border-border bg-white p-4"><div className="flex items-start justify-between gap-3"><div><h3 className="text-sm font-semibold text-navy">{group.title}</h3><p className="mt-1 text-xs leading-5 text-muted">{group.detail}</p></div><span className="font-mono text-lg text-gold">{group.ids.length}</span></div>{group.ids.length ? <ul className="mt-3 space-y-1 border-t border-border pt-3">{group.ids.map((id) => <li key={id} className="text-xs leading-5 text-navy">{expenseName(id)}</li>)}</ul> : <p className="mt-3 border-t border-border pt-3 text-xs text-muted">표시된 항목 없음</p>}</article>)}
        </div>
        <p className="mt-4 text-xs leading-5 text-muted">소득 자료 미완료: {handoffReview.incomeNotReady.length}개 · 표시된 지출 후보: {handoffReview.flaggedExpenseCount}개 · 별도 확인할 문서: {documentsToReview.length}개</p>
        {documentsToReview.length ? <div className="mt-4 border border-border bg-white p-4"><h3 className="text-sm font-semibold text-navy">다시 확인할 개별 문서</h3><ul className="mt-2 space-y-2">{documentsToReview.map(item => <li key={item.id} className="break-words text-xs leading-5 text-muted"><strong className="text-navy">{item.label || "별칭 미입력 문서"}</strong> · {statusLabels[item.status]} · 확인일 {item.checkedOn || "미기록"}<br />{item.note || "다음 확인 내용 미기록"}</li>)}</ul></div> : null}
        <button type="button" onClick={() => { setReviewedDraftSignature(draftSignature); setMessage("현재 기록의 전달 준비 검토를 확인했습니다. 이제 요약을 저장할 수 있습니다."); }} className={`mt-5 min-h-11 px-4 text-sm font-semibold ${handoffReviewed ? "border border-navy text-navy" : "bg-navy text-white hover:bg-navy-light"}`}>{handoffReviewed ? "현재 기록 검토 완료" : "현재 기록 검토 확인"}</button>
        {handoffReviewed ? <p className="mt-3 text-xs leading-5 text-muted">기록을 수정하면 검토 상태가 자동으로 만료되고 다시 확인해야 합니다.</p> : null}
      </section>

      <section className="bg-navy p-5 text-white sm:p-7" aria-labelledby="eofy-summary-heading"><div className="flex items-end justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">Preparation summary</p><h2 id="eofy-summary-heading" className="mt-2 text-xl font-semibold">{draft.taxYear} 준비 현황</h2></div><p className="font-mono text-3xl text-gold">{progress}%</p></div><dl className="mt-6 grid grid-cols-3 gap-px bg-white/15 text-center"><div className="bg-navy p-3"><dt className="text-xs text-white/55">소득 준비</dt><dd className="mt-1 text-xl font-semibold">{incomeReady}/{incomeSources.length}</dd></div><div className="bg-navy p-3"><dt className="text-xs text-white/55">지출 후보</dt><dd className="mt-1 text-xl font-semibold">{draft.expenses.length}</dd></div><div className="bg-navy p-3"><dt className="text-xs text-white/55">질문</dt><dd className="mt-1 text-xl font-semibold">{draft.questions.length}</dd></div></dl>{incomeReview.length + expenseReview.length + documentsToReview.length > 0 ? <p className="mt-5 text-sm leading-6 text-white/70">현재 확인 필요 항목 {incomeReview.length + expenseReview.length + documentsToReview.length}개가 있습니다. 파일로 저장하기 전에 증빙과 질문을 검토하세요.</p> : <p className="mt-5 text-sm leading-6 text-white/70">확인 필요로 표시된 항목이 없습니다. 실제 신고 전 ATO 원문 또는 등록 세무사에게 최종 확인하세요.</p>}<button type="button" onClick={downloadSummary} className="mt-5 min-h-11 bg-gold px-4 text-sm font-semibold text-navy hover:bg-white">EOFY 준비 요약 저장</button><p className="mt-4 min-h-5 text-xs leading-5 text-white/60" aria-live="polite">{message}</p></section>

      <section className="border border-border bg-white p-5 sm:p-7" aria-labelledby="eofy-archive-heading"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">Year archive</p><h2 id="eofy-archive-heading" className="mt-2 text-xl font-semibold text-navy">회계연도 백업과 복원</h2><p className="mt-3 text-sm leading-6 text-muted">소득 준비 상태, 문서별 별칭·확인 기록, 공제 후보와 질문을 버전형 JSON으로 옮깁니다. 문서 원본·구매 권한은 포함하지 않습니다. 자유 입력에 TFN·계좌번호·로그인 정보를 적지 말고 파일을 안전하게 보관하세요. 웹·설치 앱·기기 간 자동 동기화가 아니며 JSON으로 수동 이동합니다.</p><div className="mt-5 grid gap-3 sm:grid-cols-2"><button type="button" onClick={downloadArchive} className="min-h-11 bg-navy px-4 text-sm font-semibold text-white hover:bg-navy-light">현재 연도 JSON 백업</button><label className="inline-flex min-h-11 cursor-pointer items-center justify-center border border-navy px-4 text-sm font-semibold text-navy hover:bg-surface"><input type="file" accept="application/json,.json" onChange={reviewArchive} className="sr-only" />백업 파일 검토</label></div>{archiveReading ? <button type="button" onClick={cancelArchiveReview} className="mt-4 min-h-11 border border-border px-4 text-sm font-semibold text-muted">파일 읽기 취소</button> : null}{pendingArchive ? <div className="mt-5 border border-gold/50 bg-gold/8 p-4"><p className="font-semibold text-navy">{pendingArchive.draft.taxYear} 백업</p><p className="mt-2 text-xs leading-5 text-muted">문서 {(pendingArchive.draft.documents ?? []).length}개 · 지출 후보 {pendingArchive.draft.expenses.length}개 · 질문 {pendingArchive.draft.questions.length}개 · 저장 시각 {new Date(pendingArchive.exportedAt).toLocaleString("ko-KR")}</p><p className="mt-2 text-xs leading-5 text-[#755b20]">아직 현재 작업은 바뀌지 않았습니다. 아래 확정 버튼을 누르면 이 브라우저의 현재 EOFY 작업을 백업 내용으로 교체합니다.</p><div className="mt-4 flex flex-wrap gap-3"><button type="button" onClick={restoreArchive} className="min-h-11 bg-gold px-4 text-sm font-semibold text-navy">검토한 백업으로 교체</button><button type="button" onClick={cancelArchiveReview} className="min-h-11 border border-border px-4 text-sm font-semibold text-muted">취소</button></div></div> : null}<p className={`mt-4 min-h-5 text-xs leading-5 ${archiveError ? "text-red-700" : "text-muted"}`} aria-live="polite">{archiveError || archiveMessage}</p></section>
    </div>
  </div>;
}
