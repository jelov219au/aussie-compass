"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Status = "todo" | "review" | "ready";
type ExpenseRecord = {
  id: string;
  category: string;
  description: string;
  date: string;
  amount: string;
  workUse: string;
  evidence: "receipt" | "calculation" | "missing";
  reimbursed: boolean;
  note: string;
};
type EofyDraft = {
  taxYear: string;
  incomeStatuses: Record<string, Status>;
  incomeNotes: Record<string, string>;
  expenses: ExpenseRecord[];
  questions: string[];
};

type EofyBackup = {
  version: 1 | 2;
  product: "eofy_pro";
  exportedAt: string;
  draft: EofyDraft;
};

const STORAGE_KEY = "hoju-compass-eofy-pro-v1";
const incomeSources = [
  { id: "employment", title: "모든 고용주의 Income statement", detail: "myGov의 ATO 서비스에서 각 고용주 자료가 Tax ready인지 확인합니다." },
  { id: "interest", title: "은행 이자와 공동계좌", detail: "사용 빈도가 낮은 계좌와 공동계좌의 이자도 Pre-fill과 대조합니다." },
  { id: "government", title: "정부 지급금·수당", detail: "신고 대상 여부와 Pre-fill 내용을 ATO 원문에서 확인합니다." },
  { id: "gig", title: "부업·플랫폼·현금 소득", detail: "고용소득과 별도로 받은 금액과 관련 기록을 빠뜨리지 않습니다." },
  { id: "complex", title: "투자·가상자산·임대·해외 소득", detail: "해당된다면 거래·환율·비용 자료를 분리하고 전문가 상담 필요 여부를 확인합니다." },
];
const categories = ["업무용 장비·도구", "의류·세탁", "차량·업무 이동", "재택근무", "자기계발", "조합비·전문가 비용", "기부", "세무 비용", "기타 확인 항목"];
const statusLabels: Record<Status, string> = { todo: "확인 전", review: "확인 필요", ready: "준비 완료" };
const evidenceLabels = { receipt: "영수증·인보이스", calculation: "계산·사용기록", missing: "증빙 확인 필요" } as const;
const inputClass = "mt-1.5 min-h-11 w-full border border-border bg-white px-3 py-2 text-sm text-navy outline-none transition placeholder:text-muted/60 focus:border-navy focus:ring-2 focus:ring-navy/15";
const questionStarters = [
  "여러 고용주의 Income statement 중 Tax ready가 아닌 자료는 언제까지 기다려야 하나요?",
  "업무와 개인 사용이 섞인 비용은 어떤 기록으로 사용 비율을 설명해야 하나요?",
  "고용주에게 일부 환급받은 비용은 신고 준비 목록에서 어떻게 구분해야 하나요?",
  "부업이나 플랫폼 소득과 관련 비용은 어떤 자료로 따로 정리해야 하나요?",
];

function createInitialDraft(currentYear: number): EofyDraft {
  return { taxYear: `${currentYear}–${String(currentYear + 1).slice(-2)}`, incomeStatuses: {}, incomeNotes: {}, expenses: [], questions: [] };
}

function newExpense(): ExpenseRecord {
  return { id: crypto.randomUUID(), category: categories[0], description: "", date: "", amount: "", workUse: "100", evidence: "receipt", reimbursed: false, note: "" };
}

function safeMoney(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

function expenseReviewReasons(expense: ExpenseRecord) {
  const reasons: string[] = [];
  const workUse = safeMoney(expense.workUse);
  if (!expense.description.trim()) reasons.push("항목 설명");
  if (!expense.date) reasons.push("지출일");
  if (safeMoney(expense.amount) <= 0) reasons.push("금액");
  if (expense.evidence === "missing") reasons.push("증빙");
  if (expense.reimbursed) reasons.push("환급 여부");
  if (workUse <= 0 || workUse > 100) reasons.push("업무 사용 비율");
  if (!expense.note.trim()) reasons.push("업무 관련성 메모");
  return reasons;
}

function downloadFile(contents: string, filename: string, type: string) {
  const url = URL.createObjectURL(new Blob([contents], { type }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function csvCell(value: string | number | boolean) {
  return `"${String(value).replaceAll('"', '""')}"`;
}

function normaliseDraft(value: unknown, fallback: EofyDraft): EofyDraft | null {
  if (!value || typeof value !== "object") return null;
  const source = value as Partial<EofyDraft>;
  const validStatuses = new Set<Status>(["todo", "review", "ready"]);
  const validEvidence = new Set<ExpenseRecord["evidence"]>(["receipt", "calculation", "missing"]);
  const incomeStatuses = Object.fromEntries(Object.entries(source.incomeStatuses ?? {}).filter((entry): entry is [string, Status] => typeof entry[1] === "string" && validStatuses.has(entry[1] as Status)));
  const incomeNotes = Object.fromEntries(Object.entries(source.incomeNotes ?? {}).filter((entry): entry is [string, string] => typeof entry[1] === "string").map(([key, note]) => [key, note.slice(0, 500)]));
  const expenses = Array.isArray(source.expenses) ? source.expenses.slice(0, 200).flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const expense = item as Partial<ExpenseRecord>;
    return [{
      id: typeof expense.id === "string" && expense.id ? expense.id : crypto.randomUUID(),
      category: typeof expense.category === "string" && categories.includes(expense.category) ? expense.category : categories[0],
      description: typeof expense.description === "string" ? expense.description.slice(0, 200) : "",
      date: typeof expense.date === "string" ? expense.date.slice(0, 10) : "",
      amount: typeof expense.amount === "string" ? expense.amount.slice(0, 20) : "",
      workUse: typeof expense.workUse === "string" ? expense.workUse.slice(0, 6) : "100",
      evidence: typeof expense.evidence === "string" && validEvidence.has(expense.evidence as ExpenseRecord["evidence"]) ? expense.evidence as ExpenseRecord["evidence"] : "missing",
      reimbursed: expense.reimbursed === true,
      note: typeof expense.note === "string" ? expense.note.slice(0, 1000) : "",
    }];
  }) : [];
  return {
    taxYear: typeof source.taxYear === "string" && /^\d{4}–\d{2}$/.test(source.taxYear) ? source.taxYear : fallback.taxYear,
    incomeStatuses,
    incomeNotes,
    expenses,
    questions: Array.isArray(source.questions) ? source.questions.filter((question): question is string => typeof question === "string").map((question) => question.slice(0, 500)).slice(0, 20) : [],
  };
}

export function EofyProWorkspace() {
  const currentYear = new Date().getMonth() >= 6 ? new Date().getFullYear() : new Date().getFullYear() - 1;
  const initialDraft = useMemo(() => createInitialDraft(currentYear), [currentYear]);
  const [draft, setDraft] = useState<EofyDraft>(() => createInitialDraft(currentYear));
  const [questionInput, setQuestionInput] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [message, setMessage] = useState("");
  const backupInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const restored = normaliseDraft(JSON.parse(saved), initialDraft);
        if (restored) setDraft(restored);
      }
    } catch {}
    setLoaded(true);
  }, [initialDraft]);

  useEffect(() => {
    if (!loaded) return;
    const timer = window.setTimeout(() => {
      try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(draft)); } catch {}
    }, 400);
    return () => window.clearTimeout(timer);
  }, [draft, loaded]);

  const incomeReady = incomeSources.filter((source) => draft.incomeStatuses[source.id] === "ready").length;
  const expenseReview = draft.expenses.filter((expense) => expenseReviewReasons(expense).length > 0);
  const candidateTotal = useMemo(() => draft.expenses.reduce((sum, expense) => sum + safeMoney(expense.amount), 0), [draft.expenses]);
  const progressParts = incomeSources.length + draft.expenses.length;
  const readyParts = incomeReady + draft.expenses.filter((expense) => !expenseReview.some((review) => review.id === expense.id)).length;
  const progress = progressParts ? Math.round((readyParts / progressParts) * 100) : 0;

  const setIncomeStatus = (id: string, status: Status) => setDraft((current) => ({ ...current, incomeStatuses: { ...current.incomeStatuses, [id]: status } }));
  const setIncomeNote = (id: string, note: string) => setDraft((current) => ({ ...current, incomeNotes: { ...current.incomeNotes, [id]: note.slice(0, 500) } }));
  const updateExpense = <K extends keyof ExpenseRecord>(id: string, field: K, value: ExpenseRecord[K]) => setDraft((current) => ({ ...current, expenses: current.expenses.map((expense) => expense.id === id ? { ...expense, [field]: value } : expense) }));
  const addExpense = () => setDraft((current) => ({ ...current, expenses: [...current.expenses, newExpense()] }));
  const removeExpense = (id: string) => setDraft((current) => ({ ...current, expenses: current.expenses.filter((expense) => expense.id !== id) }));

  const addQuestion = () => {
    const question = questionInput.trim();
    if (!question) return;
    setDraft((current) => ({ ...current, questions: [...current.questions, question].slice(0, 20) }));
    setQuestionInput("");
  };

  const addSuggestedQuestion = (question: string) => {
    if (draft.questions.includes(question)) {
      setMessage("이미 질문 목록에 들어 있어요.");
      return;
    }
    setDraft((current) => ({ ...current, questions: [...current.questions, question].slice(0, 20) }));
    setMessage("질문 목록에 추가했습니다.");
  };

  const reviewQueue = [
    ...incomeSources.flatMap((source) => {
      const status = draft.incomeStatuses[source.id] ?? "todo";
      if (status === "ready") return [];
      return [{ id: `income-${source.id}`, label: source.title, detail: status === "review" ? draft.incomeNotes[source.id]?.trim() || "확인할 이유나 질문을 메모해 두세요." : "자료 상태를 아직 확인하지 않았어요." }];
    }),
    ...expenseReview.map((expense, index) => ({ id: `expense-${expense.id}`, label: expense.description.trim() || `공제 후보 ${index + 1}`, detail: `${expenseReviewReasons(expense).join(" · ")} 확인이 필요해요.` })),
  ];

  const downloadSummary = () => {
    const lines = [
      `HOJU COMPASS — EOFY PACK ${draft.taxYear}`,
      "Preparation summary only — not a tax return or deduction calculation",
      "",
      "INCOME SOURCES",
      ...incomeSources.map((source) => `- [${statusLabels[draft.incomeStatuses[source.id] ?? "todo"]}] ${source.title}`),
      "",
      `EXPENSE CANDIDATES (${draft.expenses.length})`,
      ...draft.expenses.flatMap((expense, index) => [
        `${index + 1}. ${expense.category} — ${expense.description || "No description"}`,
        `   Date: ${expense.date || "Not set"} | Amount recorded: A$${safeMoney(expense.amount).toFixed(2)} | Work-use note: ${expense.workUse || "Not set"}%`,
        `   Evidence: ${evidenceLabels[expense.evidence]} | Reimbursed: ${expense.reimbursed ? "Yes — review before claiming" : "No"}`,
        expense.note ? `   Note: ${expense.note}` : "",
      ].filter(Boolean)),
      "",
      `TOTAL RECORDED CANDIDATE SPEND: A$${candidateTotal.toFixed(2)}`,
      "This is not the deductible amount. Eligibility, private-use portions, reimbursements and special substantiation rules must be checked separately.",
      "",
      "QUESTIONS FOR MYTAX OR A REGISTERED TAX AGENT",
      ...(draft.questions.length ? draft.questions.map((question) => `- ${question}`) : ["- None added"]),
      "",
      "Do not add TFN, bank account numbers, myGov credentials or receipt images to this file.",
    ];
    downloadFile(lines.join("\r\n"), `hoju-compass-eofy-pack-${draft.taxYear.replace("–", "-")}.txt`, "text/plain;charset=utf-8");
    setMessage("EOFY 준비 요약을 텍스트 파일로 저장했습니다.");
  };

  const downloadCsv = () => {
    const rows = [
      ["record_type", "category", "description", "date", "amount_aud", "work_use_percent", "evidence_or_status", "reimbursed", "note"],
      ...incomeSources.map((source) => ["income", "소득 자료", source.title, "", "", "", statusLabels[draft.incomeStatuses[source.id] ?? "todo"], "", draft.incomeNotes[source.id] ?? ""]),
      ...draft.expenses.map((expense) => ["expense_candidate", expense.category, expense.description, expense.date, safeMoney(expense.amount).toFixed(2), expense.workUse, evidenceLabels[expense.evidence], expense.reimbursed ? "yes" : "no", expense.note]),
      ...draft.questions.map((question) => ["question", "회계사 확인 질문", question, "", "", "", "", "", ""]),
    ];
    const csv = `\uFEFF${rows.map((row) => row.map(csvCell).join(",")).join("\r\n")}`;
    downloadFile(csv, `hoju-compass-accountant-handoff-${draft.taxYear.replace("–", "-")}.csv`, "text/csv;charset=utf-8");
    setMessage("회계사 전달용 CSV를 저장했습니다. 보내기 전에 민감한 내용이 없는지 확인하세요.");
  };

  const downloadBackup = () => {
    const backup: EofyBackup = { version: 2, product: "eofy_pro", exportedAt: new Date().toISOString(), draft };
    downloadFile(JSON.stringify(backup, null, 2), `hoju-compass-eofy-backup-${draft.taxYear.replace("–", "-")}.json`, "application/json;charset=utf-8");
    setMessage("기기 이동용 백업 파일을 저장했습니다. 원본 영수증과 TFN은 포함되지 않습니다.");
  };

  const restoreBackup = async (file: File | undefined) => {
    if (!file) return;
    try {
      if (file.size > 1024 * 1024) throw new Error("백업 파일은 1MB 이하여야 합니다.");
      const parsed = JSON.parse(await file.text()) as Partial<EofyBackup>;
      if (parsed.product !== "eofy_pro" || (parsed.version !== 1 && parsed.version !== 2)) throw new Error("EOFY Pack Pro 백업 파일이 아닙니다.");
      const restored = normaliseDraft(parsed.draft, initialDraft);
      if (!restored) throw new Error("백업 내용을 읽을 수 없습니다.");
      setDraft(restored);
      setMessage(`${restored.taxYear} 백업을 이 기기에 불러왔습니다.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "백업 파일을 불러오지 못했습니다.");
    } finally {
      if (backupInputRef.current) backupInputRef.current.value = "";
    }
  };

  const resetDraft = () => {
    if (!window.confirm("이 기기에 저장된 EOFY 작성 내용을 모두 지울까요? 다운로드한 백업 파일은 삭제되지 않습니다.")) return;
    setDraft(createInitialDraft(currentYear));
    setQuestionInput("");
    setMessage("이 기기의 EOFY 작성 내용을 비웠습니다.");
  };

  return <div className="grid items-start gap-8 xl:grid-cols-[minmax(0,0.9fr)_minmax(34rem,1.1fr)]">
    <div className="space-y-8">
      <section className="border-t border-navy/20 pt-6" aria-labelledby="eofy-income-heading"><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">Income cross-check</p><h2 id="eofy-income-heading" className="mt-2 text-2xl font-semibold text-navy">소득 자료 준비</h2></div><label className="text-sm font-medium text-navy">회계연도<select className={`${inputClass} min-w-36`} value={draft.taxYear} onChange={(event) => setDraft((current) => ({ ...current, taxYear: event.target.value }))}>{[currentYear - 1, currentYear, currentYear + 1].map((year) => <option key={year}>{year}–{String(year + 1).slice(-2)}</option>)}</select></label></div><p className="mt-4 text-sm leading-6 text-muted">Pre-fill도 최종 신고 내용과 일치하는지 직접 확인해야 합니다. 금액은 이 화면에 입력하지 않고 상태만 기록하세요.</p>
        <ol className="mt-6 divide-y divide-border border-y border-navy/20">{incomeSources.map((source, index) => <li key={source.id} className="grid gap-3 py-5 sm:grid-cols-[2rem_1fr]"><span className="font-mono text-xs text-gold">{String(index + 1).padStart(2, "0")}</span><div><h3 className="font-semibold text-navy">{source.title}</h3><p className="mt-2 text-sm leading-6 text-muted">{source.detail}</p><div className="mt-3 grid gap-3 sm:grid-cols-[8rem_1fr]"><label className="text-xs font-medium text-muted">상태<select className="mt-1 min-h-10 w-full border border-border bg-white px-2 text-sm text-navy" value={draft.incomeStatuses[source.id] ?? "todo"} onChange={(event) => setIncomeStatus(source.id, event.target.value as Status)}><option value="todo">확인 전</option><option value="review">확인 필요</option><option value="ready">준비 완료</option></select></label><label className="text-xs font-medium text-muted">확인 메모<input className="mt-1 min-h-10 w-full border border-border bg-white px-3 text-sm text-navy outline-none focus:border-navy" value={draft.incomeNotes[source.id] ?? ""} onChange={(event) => setIncomeNote(source.id, event.target.value)} placeholder="예: 두 번째 고용주 자료가 아직 Tax ready가 아님" /></label></div></div></li>)}</ol>
      </section>

      <section className="border border-border bg-white p-5 sm:p-7" aria-labelledby="golden-rules-heading"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">ATO basic rules</p><h2 id="golden-rules-heading" className="mt-2 text-xl font-semibold text-navy">업무 관련 비용 세 가지 기본 확인</h2><ol className="mt-5 space-y-3 text-sm leading-6 text-muted"><li className="border-l-2 border-gold pl-3"><strong className="text-navy">1. 내가 지출했고 환급받지 않았는가</strong></li><li className="border-l-2 border-gold pl-3"><strong className="text-navy">2. 소득을 얻는 업무와 직접 관련되는가</strong></li><li className="border-l-2 border-gold pl-3"><strong className="text-navy">3. 지출과 계산 방식을 입증할 기록이 있는가</strong></li></ol><p className="mt-4 text-xs leading-5 text-muted">업무와 개인 사용이 섞였다면 업무 관련 부분만 검토합니다. 이 도구는 세 조건 충족 여부를 판정하지 않습니다.</p></section>

      <section className="border border-border bg-surface p-5 sm:p-7" aria-labelledby="eofy-questions-heading"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">Accountant handoff</p><h2 id="eofy-questions-heading" className="mt-2 text-xl font-semibold text-navy">확인할 질문 모으기</h2><p className="mt-3 text-sm leading-6 text-muted">무엇을 물어봐야 할지 막막하다면 아래 예시에서 내 상황과 가까운 질문부터 골라보세요.</p><div className="mt-4 grid gap-2">{questionStarters.map((question) => <button key={question} type="button" onClick={() => addSuggestedQuestion(question)} className="min-h-11 border border-border bg-white px-3 py-2 text-left text-sm leading-6 text-navy hover:border-gold"><span className="mr-2 text-gold">+</span>{question}</button>)}</div><div className="mt-5 flex flex-col gap-3 sm:flex-row"><label className="flex-1 text-sm font-medium text-navy">직접 적기<input className={inputClass} value={questionInput} onChange={(event) => setQuestionInput(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); addQuestion(); } }} placeholder="예: 두 직장을 오갈 때 차량 비용 기록은 어떻게 구분하나요?" /></label><button type="button" onClick={addQuestion} className="min-h-11 self-end bg-navy px-4 text-sm font-semibold text-white">질문 추가</button></div>{draft.questions.length ? <ol className="mt-5 divide-y divide-border border-y border-navy/20">{draft.questions.map((question, index) => <li key={`${question}-${index}`} className="flex gap-3 py-4"><span className="font-mono text-xs text-gold">{String(index + 1).padStart(2, "0")}</span><p className="min-w-0 flex-1 text-sm leading-6 text-navy">{question}</p><button type="button" onClick={() => setDraft((current) => ({ ...current, questions: current.questions.filter((_, itemIndex) => itemIndex !== index) }))} className="min-h-10 text-xs font-medium text-muted hover:text-red-700">삭제</button></li>)}</ol> : <p className="mt-5 text-sm text-muted">아직 추가한 질문이 없습니다.</p>}</section>

      <section className="border border-navy/15 bg-white p-5 sm:p-7" aria-labelledby="eofy-archive-heading"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">Year archive</p><h2 id="eofy-archive-heading" className="mt-2 text-xl font-semibold text-navy">기기 이동용 백업</h2><p className="mt-3 text-sm leading-6 text-muted">작성 내용은 계정이 아니라 이 브라우저에 저장됩니다. 다른 기기에서 이어서 쓰거나 브라우저 기록을 지우기 전에는 JSON 백업을 받아두세요.</p><div className="mt-5 flex flex-wrap gap-3"><button type="button" onClick={downloadBackup} className="min-h-11 bg-navy px-4 py-2 text-sm font-semibold text-white">백업 파일 저장</button><button type="button" onClick={() => backupInputRef.current?.click()} className="min-h-11 border border-navy px-4 py-2 text-sm font-semibold text-navy">백업 불러오기</button><button type="button" onClick={resetDraft} className="min-h-11 px-2 py-2 text-sm font-semibold text-muted hover:text-red-700">이 기기 기록 비우기</button><input ref={backupInputRef} type="file" accept="application/json,.json" className="sr-only" onChange={(event) => void restoreBackup(event.target.files?.[0])} /></div><p className="mt-4 text-xs leading-5 text-muted">백업에는 이 화면에 적은 내용만 들어갑니다. TFN, 계좌번호, myGov 정보나 영수증 원본은 적거나 첨부하지 마세요.</p></section>
    </div>

    <div className="space-y-8">
      <section className="border border-border bg-white p-5 shadow-sm sm:p-7" aria-labelledby="expense-register-heading"><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">Evidence register</p><h2 id="expense-register-heading" className="mt-2 text-xl font-semibold text-navy">공제 후보 기록</h2></div><div className="text-right"><p className="font-mono text-2xl text-navy">A${candidateTotal.toFixed(2)}</p><p className="text-xs text-muted">기록한 지출 합계 · 공제액 아님</p></div></div>
        <div className="mt-5 border-l-2 border-gold bg-gold/8 p-4 text-xs leading-5 text-muted">영수증 원본은 업로드하지 않습니다. 금액은 개인 준비용이며 공제 가능성이나 환급액을 뜻하지 않습니다.</div>
        <div className="mt-6 space-y-5">{draft.expenses.map((expense, index) => <article key={expense.id} className="border border-border p-4 sm:p-5"><div className="flex items-start justify-between gap-4"><div><p className="font-mono text-xs text-gold">ITEM {String(index + 1).padStart(2, "0")}</p><h3 className="mt-1 font-semibold text-navy">{expense.description || "새 공제 후보"}</h3></div><button type="button" onClick={() => removeExpense(expense.id)} className="min-h-10 text-xs font-medium text-muted hover:text-red-700">삭제</button></div><div className="mt-4 grid gap-4 sm:grid-cols-2"><label className="text-sm font-medium text-navy">분류<select className={inputClass} value={expense.category} onChange={(event) => updateExpense(expense.id, "category", event.target.value)}>{categories.map((category) => <option key={category}>{category}</option>)}</select></label><label className="text-sm font-medium text-navy">지출일<input type="date" className={inputClass} value={expense.date} onChange={(event) => updateExpense(expense.id, "date", event.target.value)} /></label><label className="text-sm font-medium text-navy sm:col-span-2">항목 설명<input className={inputClass} value={expense.description} onChange={(event) => updateExpense(expense.id, "description", event.target.value)} placeholder="예: 업무용 안전화" /></label><label className="text-sm font-medium text-navy">지출 금액 A$<input type="number" min="0" step="0.01" className={inputClass} value={expense.amount} onChange={(event) => updateExpense(expense.id, "amount", event.target.value)} /></label><label className="text-sm font-medium text-navy">업무 사용 비율 메모 %<input type="number" min="0" max="100" className={inputClass} value={expense.workUse} onChange={(event) => updateExpense(expense.id, "workUse", event.target.value)} /></label><label className="text-sm font-medium text-navy">증빙 상태<select className={inputClass} value={expense.evidence} onChange={(event) => updateExpense(expense.id, "evidence", event.target.value as ExpenseRecord["evidence"])}>{Object.entries(evidenceLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><label className="flex min-h-11 items-center gap-3 self-end border border-border bg-white px-3 text-sm text-navy"><input type="checkbox" checked={expense.reimbursed} onChange={(event) => updateExpense(expense.id, "reimbursed", event.target.checked)} className="h-5 w-5 accent-[var(--color-gold)]" />고용주 등이 환급함</label><label className="text-sm font-medium text-navy sm:col-span-2">업무 관련성·계산 메모<textarea className={`${inputClass} min-h-20 resize-y`} value={expense.note} onChange={(event) => updateExpense(expense.id, "note", event.target.value)} placeholder="개인 사용분과 업무 사용분을 어떻게 구분했는지 적으세요." /></label></div>{expenseReviewReasons(expense).length ? <p className="mt-4 border-l-2 border-gold pl-3 text-xs leading-5 text-[#755b20]"><strong>{expenseReviewReasons(expense).join(" · ")}</strong> 항목을 다시 확인하세요. 모두 채워도 공제 가능 여부가 자동으로 확정되지는 않습니다.</p> : <p className="mt-4 border-l-2 border-emerald-600 pl-3 text-xs leading-5 text-emerald-800">준비 메모가 채워졌어요. 실제 신고 전 기록과 적용 규칙을 한 번 더 확인하세요.</p>}</article>)}
        </div><button type="button" onClick={addExpense} className="mt-5 min-h-11 border-b-2 border-gold text-sm font-semibold text-navy">+ 공제 후보 추가</button>
      </section>

      <section className="border border-border bg-surface p-5 sm:p-7" aria-labelledby="eofy-review-heading"><div className="flex items-end justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">Review queue</p><h2 id="eofy-review-heading" className="mt-2 text-xl font-semibold text-navy">먼저 확인할 것</h2></div><span className="font-mono text-2xl text-navy">{reviewQueue.length}</span></div>{reviewQueue.length ? <ol className="mt-5 divide-y divide-border border-y border-navy/20">{reviewQueue.slice(0, 12).map((item, index) => <li key={item.id} className="grid grid-cols-[2rem_1fr] gap-2 py-4"><span className="font-mono text-xs text-gold">{String(index + 1).padStart(2, "0")}</span><div><p className="text-sm font-semibold text-navy">{item.label}</p><p className="mt-1 text-xs leading-5 text-muted">{item.detail}</p></div></li>)}</ol> : <p className="mt-5 border-l-2 border-emerald-600 pl-3 text-sm leading-6 text-emerald-800">이 화면에서 확인할 준비 항목을 모두 채웠어요. 신고 전 공식 안내나 등록 세무사와 최종 대조하세요.</p>}{reviewQueue.length > 12 && <p className="mt-3 text-xs text-muted">그 밖에 {reviewQueue.length - 12}개 항목이 더 있습니다.</p>}</section>

      <section className="bg-navy p-5 text-white sm:p-7" aria-labelledby="eofy-summary-heading"><div className="flex items-end justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">Preparation summary</p><h2 id="eofy-summary-heading" className="mt-2 text-xl font-semibold">{draft.taxYear} 준비 현황</h2></div><p className="font-mono text-3xl text-gold">{progress}%</p></div><dl className="mt-6 grid grid-cols-3 gap-px bg-white/15 text-center"><div className="bg-navy p-3"><dt className="text-xs text-white/55">소득 준비</dt><dd className="mt-1 text-xl font-semibold">{incomeReady}/{incomeSources.length}</dd></div><div className="bg-navy p-3"><dt className="text-xs text-white/55">지출 후보</dt><dd className="mt-1 text-xl font-semibold">{draft.expenses.length}</dd></div><div className="bg-navy p-3"><dt className="text-xs text-white/55">질문</dt><dd className="mt-1 text-xl font-semibold">{draft.questions.length}</dd></div></dl>{reviewQueue.length > 0 ? <p className="mt-5 text-sm leading-6 text-white/70">현재 먼저 확인할 항목 {reviewQueue.length}개가 있습니다. 파일로 저장하기 전에 상태와 메모를 검토하세요.</p> : <p className="mt-5 text-sm leading-6 text-white/70">이 화면에서 확인할 준비 항목이 남아 있지 않습니다. 실제 신고 전 공식 안내 또는 등록 세무사에게 최종 확인하세요.</p>}<div className="mt-5 grid gap-2 sm:grid-cols-2"><button type="button" onClick={downloadSummary} className="min-h-11 bg-gold px-4 text-sm font-semibold text-navy hover:bg-white">읽기 쉬운 요약 저장</button><button type="button" onClick={downloadCsv} className="min-h-11 border border-white/40 px-4 text-sm font-semibold text-white hover:border-gold hover:text-gold">회계사 전달용 CSV</button></div><p className="mt-4 min-h-5 text-xs leading-5 text-white/60" aria-live="polite">{message}</p></section>
    </div>
  </div>;
}
