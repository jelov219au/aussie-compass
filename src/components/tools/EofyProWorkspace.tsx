"use client";

import { type ChangeEvent, useEffect, useMemo, useState } from "react";
import {
  createEofyArchive,
  parseEofyArchive,
  type EofyArchive,
  type EofyDraft,
  type EofyExpenseRecord,
  type EofyStatus,
} from "@/lib/eofyProArchive";
import { assessEofyHandoff } from "@/lib/eofyProHandoff";

const STORAGE_KEY = "hoju-compass-eofy-pro-v1";
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
const inputClass = "mt-1.5 min-h-11 w-full border border-border bg-white px-3 py-2 text-sm text-navy outline-none transition placeholder:text-muted/60 focus:border-navy focus:ring-2 focus:ring-navy/15";

function newExpense(): EofyExpenseRecord {
  return { id: crypto.randomUUID(), category: categories[0], description: "", date: "", amount: "", workUse: "100", evidence: "receipt", reimbursed: false, note: "" };
}

function safeMoney(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

export function EofyProWorkspace() {
  const currentYear = new Date().getMonth() >= 6 ? new Date().getFullYear() : new Date().getFullYear() - 1;
  const [draft, setDraft] = useState<EofyDraft>({ taxYear: `${currentYear}–${String(currentYear + 1).slice(-2)}`, incomeStatuses: {}, expenses: [], questions: [] });
  const [questionInput, setQuestionInput] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [message, setMessage] = useState("");
  const [archiveMessage, setArchiveMessage] = useState("");
  const [archiveError, setArchiveError] = useState("");
  const [pendingArchive, setPendingArchive] = useState<EofyArchive | null>(null);
  const [reviewedDraftSignature, setReviewedDraftSignature] = useState("");

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
    }, 400);
    return () => window.clearTimeout(timer);
  }, [draft, loaded]);

  const incomeReady = incomeSources.filter((source) => draft.incomeStatuses[source.id] === "ready").length;
  const incomeReview = incomeSources.filter((source) => draft.incomeStatuses[source.id] === "review");
  const expenseReview = draft.expenses.filter((expense) => {
    const workUse = safeMoney(expense.workUse);
    return expense.evidence === "missing"
      || expense.reimbursed
      || !expense.description.trim()
      || !expense.date
      || safeMoney(expense.amount) <= 0
      || workUse <= 0
      || workUse > 100;
  });
  const candidateTotal = useMemo(() => draft.expenses.reduce((sum, expense) => sum + safeMoney(expense.amount), 0), [draft.expenses]);
  const handoffReview = useMemo(() => assessEofyHandoff(draft), [draft]);
  const draftSignature = useMemo(() => JSON.stringify(draft), [draft]);
  const handoffReviewed = reviewedDraftSignature === draftSignature;
  const progressParts = incomeSources.length + draft.expenses.length;
  const readyParts = incomeReady + draft.expenses.filter((expense) => !expenseReview.some((review) => review.id === expense.id)).length;
  const progress = progressParts ? Math.round((readyParts / progressParts) * 100) : 0;

  const setIncomeStatus = (id: string, status: EofyStatus) => setDraft((current) => ({ ...current, incomeStatuses: { ...current.incomeStatuses, [id]: status } }));
  const updateExpense = <K extends keyof EofyExpenseRecord>(id: string, field: K, value: EofyExpenseRecord[K]) => setDraft((current) => ({ ...current, expenses: current.expenses.map((expense) => expense.id === id ? { ...expense, [field]: value } : expense) }));
  const addExpense = () => setDraft((current) => ({ ...current, expenses: [...current.expenses, newExpense()] }));
  const removeExpense = (id: string) => setDraft((current) => ({ ...current, expenses: current.expenses.filter((expense) => expense.id !== id) }));
  const expenseName = (id: string) => {
    const index = draft.expenses.findIndex((expense) => expense.id === id);
    const expense = draft.expenses[index];
    return expense ? `${index + 1}. ${expense.description || expense.category}` : id;
  };

  const addQuestion = () => {
    const question = questionInput.trim();
    if (!question) return;
    setDraft((current) => ({ ...current, questions: [...current.questions, question].slice(0, 20) }));
    setQuestionInput("");
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
    const url = URL.createObjectURL(new Blob([lines.join("\r\n")], { type: "text/plain;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `hoju-compass-eofy-pack-${draft.taxYear.replace("–", "-")}.txt`;
    anchor.click();
    URL.revokeObjectURL(url);
    setMessage("검토 결과가 포함된 EOFY 회계사 전달 요약을 저장했습니다.");
  };

  const downloadArchive = () => {
    setArchiveError("");
    try {
      const archive = createEofyArchive(draft);
      const url = URL.createObjectURL(new Blob([JSON.stringify(archive, null, 2)], { type: "application/json" }));
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `hoju-compass-eofy-archive-${draft.taxYear.replace("–", "-")}.json`;
      anchor.click();
      URL.revokeObjectURL(url);
      setArchiveMessage("이 회계연도의 Pro 작업 내용을 JSON 백업으로 저장했습니다.");
    } catch {
      setArchiveError("현재 기록에 백업할 수 없는 값이 있습니다. 날짜, 금액과 업무 사용 비율을 다시 확인해 주세요.");
    }
  };

  const reviewArchive = async (event: ChangeEvent<HTMLInputElement>) => {
    const input = event.currentTarget;
    const file = input.files?.[0];
    input.value = "";
    setPendingArchive(null);
    setArchiveMessage("");
    setArchiveError("");
    if (!file) return;
    if (file.size > 512 * 1024) {
      setArchiveError("백업 파일이 너무 큽니다. 512KB 이하의 EOFY Pack Pro JSON 파일을 선택해 주세요.");
      return;
    }
    try {
      const archive = parseEofyArchive(JSON.parse(await file.text()));
      if (!archive) throw new Error("Invalid EOFY archive");
      setPendingArchive(archive);
      setArchiveMessage("백업을 확인했습니다. 아래 회계연도와 항목 수를 검토한 뒤 교체를 확정하세요.");
    } catch {
      setArchiveError("파일을 읽을 수 없습니다. EOFY Pack Pro에서 내려받은 원본 JSON 백업인지 확인해 주세요.");
    }
  };

  const restoreArchive = () => {
    if (!pendingArchive) return;
    setDraft(pendingArchive.draft);
    setPendingArchive(null);
    setArchiveError("");
    setArchiveMessage("백업으로 현재 EOFY 작업을 교체했습니다. 이 브라우저에 자동 저장됩니다.");
  };

  return <div className="grid items-start gap-8 xl:grid-cols-[minmax(0,0.9fr)_minmax(34rem,1.1fr)]">
    <div className="space-y-8">
      <section className="border-t border-navy/20 pt-6" aria-labelledby="eofy-income-heading"><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">Income cross-check</p><h2 id="eofy-income-heading" className="mt-2 text-2xl font-semibold text-navy">소득 자료 준비</h2></div><label className="text-sm font-medium text-navy">회계연도<select className={`${inputClass} min-w-36`} value={draft.taxYear} onChange={(event) => setDraft((current) => ({ ...current, taxYear: event.target.value }))}>{[currentYear - 1, currentYear, currentYear + 1].map((year) => <option key={year}>{year}–{String(year + 1).slice(-2)}</option>)}</select></label></div><p className="mt-4 text-sm leading-6 text-muted">Pre-fill도 최종 신고 내용과 일치하는지 직접 확인해야 합니다. 금액은 이 화면에 입력하지 않고 상태만 기록하세요.</p>
        <ol className="mt-6 divide-y divide-border border-y border-navy/20">{incomeSources.map((source, index) => <li key={source.id} className="grid gap-3 py-5 sm:grid-cols-[2rem_1fr_8rem]"><span className="font-mono text-xs text-gold">{String(index + 1).padStart(2, "0")}</span><div><h3 className="font-semibold text-navy">{source.title}</h3><p className="mt-2 text-sm leading-6 text-muted">{source.detail}</p></div><label className="text-xs font-medium text-muted">상태<select className="mt-1 min-h-10 w-full border border-border bg-white px-2 text-sm text-navy" value={draft.incomeStatuses[source.id] ?? "todo"} onChange={(event) => setIncomeStatus(source.id, event.target.value as EofyStatus)}><option value="todo">확인 전</option><option value="review">확인 필요</option><option value="ready">준비 완료</option></select></label></li>)}</ol>
      </section>

      <section className="border border-border bg-white p-5 sm:p-7" aria-labelledby="golden-rules-heading"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">ATO basic rules</p><h2 id="golden-rules-heading" className="mt-2 text-xl font-semibold text-navy">업무 관련 비용 세 가지 기본 확인</h2><ol className="mt-5 space-y-3 text-sm leading-6 text-muted"><li className="border-l-2 border-gold pl-3"><strong className="text-navy">1. 내가 지출했고 환급받지 않았는가</strong></li><li className="border-l-2 border-gold pl-3"><strong className="text-navy">2. 소득을 얻는 업무와 직접 관련되는가</strong></li><li className="border-l-2 border-gold pl-3"><strong className="text-navy">3. 지출과 계산 방식을 입증할 기록이 있는가</strong></li></ol><p className="mt-4 text-xs leading-5 text-muted">업무와 개인 사용이 섞였다면 업무 관련 부분만 검토합니다. 이 도구는 세 조건 충족 여부를 판정하지 않습니다.</p></section>

      <section className="border border-border bg-surface p-5 sm:p-7" aria-labelledby="eofy-questions-heading"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">Accountant handoff</p><h2 id="eofy-questions-heading" className="mt-2 text-xl font-semibold text-navy">확인할 질문 모으기</h2><div className="mt-5 flex flex-col gap-3 sm:flex-row"><label className="flex-1 text-sm font-medium text-navy">질문<input className={inputClass} value={questionInput} onChange={(event) => setQuestionInput(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); addQuestion(); } }} placeholder="예: 두 직장을 오갈 때 차량 비용 기록은 어떻게 구분하나요?" /></label><button type="button" onClick={addQuestion} className="min-h-11 self-end bg-navy px-4 text-sm font-semibold text-white">질문 추가</button></div>{draft.questions.length ? <ol className="mt-5 divide-y divide-border border-y border-navy/20">{draft.questions.map((question, index) => <li key={`${question}-${index}`} className="flex gap-3 py-4"><span className="font-mono text-xs text-gold">{String(index + 1).padStart(2, "0")}</span><p className="min-w-0 flex-1 text-sm leading-6 text-navy">{question}</p><button type="button" onClick={() => setDraft((current) => ({ ...current, questions: current.questions.filter((_, itemIndex) => itemIndex !== index) }))} className="min-h-10 text-xs font-medium text-muted hover:text-red-700">삭제</button></li>)}</ol> : <p className="mt-5 text-sm text-muted">아직 추가한 질문이 없습니다.</p>}</section>
    </div>

    <div className="space-y-8 xl:sticky xl:top-24">
      <section className="border border-border bg-white p-5 shadow-sm sm:p-7" aria-labelledby="expense-register-heading"><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">Evidence register</p><h2 id="expense-register-heading" className="mt-2 text-xl font-semibold text-navy">공제 후보 기록</h2></div><div className="text-right"><p className="font-mono text-2xl text-navy">A${candidateTotal.toFixed(2)}</p><p className="text-xs text-muted">기록한 지출 합계 · 공제액 아님</p></div></div>
        <div className="mt-5 border-l-2 border-gold bg-gold/8 p-4 text-xs leading-5 text-muted">영수증 원본은 업로드하지 않습니다. 금액은 개인 준비용이며 공제 가능성이나 환급액을 뜻하지 않습니다.</div>
        <div className="mt-6 space-y-5">{draft.expenses.map((expense, index) => <article key={expense.id} className="border border-border p-4 sm:p-5"><div className="flex items-start justify-between gap-4"><div><p className="font-mono text-xs text-gold">ITEM {String(index + 1).padStart(2, "0")}</p><h3 className="mt-1 font-semibold text-navy">{expense.description || "새 공제 후보"}</h3></div><button type="button" onClick={() => removeExpense(expense.id)} className="min-h-10 text-xs font-medium text-muted hover:text-red-700">삭제</button></div><div className="mt-4 grid gap-4 sm:grid-cols-2"><label className="text-sm font-medium text-navy">분류<select className={inputClass} value={expense.category} onChange={(event) => updateExpense(expense.id, "category", event.target.value)}>{categories.map((category) => <option key={category}>{category}</option>)}</select></label><label className="text-sm font-medium text-navy">지출일<input type="date" className={inputClass} value={expense.date} onChange={(event) => updateExpense(expense.id, "date", event.target.value)} /></label><label className="text-sm font-medium text-navy sm:col-span-2">항목 설명<input className={inputClass} value={expense.description} onChange={(event) => updateExpense(expense.id, "description", event.target.value)} placeholder="예: 업무용 안전화" /></label><label className="text-sm font-medium text-navy">지출 금액 A$<input type="number" min="0" step="0.01" className={inputClass} value={expense.amount} onChange={(event) => updateExpense(expense.id, "amount", event.target.value)} /></label><label className="text-sm font-medium text-navy">업무 사용 비율 메모 %<input type="number" min="0" max="100" className={inputClass} value={expense.workUse} onChange={(event) => updateExpense(expense.id, "workUse", event.target.value)} /></label><label className="text-sm font-medium text-navy">증빙 상태<select className={inputClass} value={expense.evidence} onChange={(event) => updateExpense(expense.id, "evidence", event.target.value as EofyExpenseRecord["evidence"])}>{Object.entries(evidenceLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><label className="flex min-h-11 items-center gap-3 self-end border border-border bg-white px-3 text-sm text-navy"><input type="checkbox" checked={expense.reimbursed} onChange={(event) => updateExpense(expense.id, "reimbursed", event.target.checked)} className="h-5 w-5 accent-[var(--color-gold)]" />고용주 등이 환급함</label><label className="text-sm font-medium text-navy sm:col-span-2">업무 관련성·계산 메모<textarea className={`${inputClass} min-h-20 resize-y`} value={expense.note} onChange={(event) => updateExpense(expense.id, "note", event.target.value)} placeholder="개인 사용분과 업무 사용분을 어떻게 구분했는지 적으세요." /></label></div>{expenseReview.some((review) => review.id === expense.id) ? <p className="mt-4 border-l-2 border-gold pl-3 text-xs leading-5 text-[#755b20]">날짜·설명·금액·증빙·환급 여부·사용 비율을 다시 확인하세요. 환급받은 비용은 일반적으로 그대로 공제 후보로 보지 않습니다.</p> : null}</article>)}
        </div><button type="button" onClick={addExpense} className="mt-5 min-h-11 border-b-2 border-gold text-sm font-semibold text-navy">+ 공제 후보 추가</button>
      </section>

      <section className="border border-border bg-surface p-5 sm:p-7" aria-labelledby="eofy-handoff-review-heading"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">Accountant handoff review</p><h2 id="eofy-handoff-review-heading" className="mt-2 text-xl font-semibold text-navy">전달 전에 따로 볼 항목</h2></div><p className="font-mono text-2xl text-navy">{handoffReview.totalFlags}</p></div><p className="mt-3 text-sm leading-6 text-muted">같은 항목이 여러 범주에 표시될 수 있습니다. 이 분류는 공제 가능 여부를 판단하지 않고, 상담 전에 확인할 기록을 놓치지 않도록 돕습니다.</p>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {[
            { title: "증빙 확인 필요", detail: "영수증·계산 기록이 아직 없다고 표시한 항목", ids: handoffReview.missingEvidence },
            { title: "환급받은 항목", detail: "고용주 등이 환급했다고 표시한 항목", ids: handoffReview.reimbursed },
            { title: "개인 사용분 계산 공백", detail: "100% 미만인데 계산 기록 또는 구분 메모가 없는 항목", ids: handoffReview.privateUseGaps },
            { title: "기본 기록 미완성", detail: "설명·날짜·금액·사용 비율을 다시 채워야 하는 항목", ids: handoffReview.incompleteDetails },
          ].map((group) => <article key={group.title} className="border border-border bg-white p-4"><div className="flex items-start justify-between gap-3"><div><h3 className="text-sm font-semibold text-navy">{group.title}</h3><p className="mt-1 text-xs leading-5 text-muted">{group.detail}</p></div><span className="font-mono text-lg text-gold">{group.ids.length}</span></div>{group.ids.length ? <ul className="mt-3 space-y-1 border-t border-border pt-3">{group.ids.map((id) => <li key={id} className="text-xs leading-5 text-navy">{expenseName(id)}</li>)}</ul> : <p className="mt-3 border-t border-border pt-3 text-xs text-muted">표시된 항목 없음</p>}</article>)}
        </div>
        <p className="mt-4 text-xs leading-5 text-muted">소득 자료 미완료: {handoffReview.incomeNotReady.length}개 · 표시된 지출 후보: {handoffReview.flaggedExpenseCount}개</p>
        <button type="button" onClick={() => { setReviewedDraftSignature(draftSignature); setMessage("현재 기록의 전달 준비 검토를 확인했습니다. 이제 요약을 저장할 수 있습니다."); }} className={`mt-5 min-h-11 px-4 text-sm font-semibold ${handoffReviewed ? "border border-navy text-navy" : "bg-navy text-white hover:bg-navy-light"}`}>{handoffReviewed ? "현재 기록 검토 완료" : "현재 기록 검토 확인"}</button>
        {handoffReviewed ? <p className="mt-3 text-xs leading-5 text-muted">기록을 수정하면 검토 상태가 자동으로 만료되고 다시 확인해야 합니다.</p> : null}
      </section>

      <section className="bg-navy p-5 text-white sm:p-7" aria-labelledby="eofy-summary-heading"><div className="flex items-end justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">Preparation summary</p><h2 id="eofy-summary-heading" className="mt-2 text-xl font-semibold">{draft.taxYear} 준비 현황</h2></div><p className="font-mono text-3xl text-gold">{progress}%</p></div><dl className="mt-6 grid grid-cols-3 gap-px bg-white/15 text-center"><div className="bg-navy p-3"><dt className="text-xs text-white/55">소득 준비</dt><dd className="mt-1 text-xl font-semibold">{incomeReady}/{incomeSources.length}</dd></div><div className="bg-navy p-3"><dt className="text-xs text-white/55">지출 후보</dt><dd className="mt-1 text-xl font-semibold">{draft.expenses.length}</dd></div><div className="bg-navy p-3"><dt className="text-xs text-white/55">질문</dt><dd className="mt-1 text-xl font-semibold">{draft.questions.length}</dd></div></dl>{incomeReview.length + expenseReview.length > 0 ? <p className="mt-5 text-sm leading-6 text-white/70">현재 확인 필요 항목 {incomeReview.length + expenseReview.length}개가 있습니다. 파일로 저장하기 전에 증빙과 질문을 검토하세요.</p> : <p className="mt-5 text-sm leading-6 text-white/70">확인 필요로 표시된 항목이 없습니다. 실제 신고 전 ATO 원문 또는 등록 세무사에게 최종 확인하세요.</p>}<button type="button" onClick={downloadSummary} className="mt-5 min-h-11 bg-gold px-4 text-sm font-semibold text-navy hover:bg-white">EOFY 준비 요약 저장</button><p className="mt-4 min-h-5 text-xs leading-5 text-white/60" aria-live="polite">{message}</p></section>

      <section className="border border-border bg-white p-5 sm:p-7" aria-labelledby="eofy-archive-heading"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">Year archive</p><h2 id="eofy-archive-heading" className="mt-2 text-xl font-semibold text-navy">회계연도 백업과 복원</h2><p className="mt-3 text-sm leading-6 text-muted">소득 준비 상태, 공제 후보와 질문만 버전형 JSON으로 옮깁니다. TFN, 계좌번호, 로그인 정보와 영수증 파일은 포함하지 않습니다.</p><div className="mt-5 grid gap-3 sm:grid-cols-2"><button type="button" onClick={downloadArchive} className="min-h-11 bg-navy px-4 text-sm font-semibold text-white hover:bg-navy-light">현재 연도 JSON 백업</button><label className="inline-flex min-h-11 cursor-pointer items-center justify-center border border-navy px-4 text-sm font-semibold text-navy hover:bg-surface"><input type="file" accept="application/json,.json" onChange={reviewArchive} className="sr-only" />백업 파일 검토</label></div>{pendingArchive ? <div className="mt-5 border border-gold/50 bg-gold/8 p-4"><p className="font-semibold text-navy">{pendingArchive.draft.taxYear} 백업</p><p className="mt-2 text-xs leading-5 text-muted">지출 후보 {pendingArchive.draft.expenses.length}개 · 질문 {pendingArchive.draft.questions.length}개 · 저장 시각 {new Date(pendingArchive.exportedAt).toLocaleString("ko-KR")}</p><p className="mt-2 text-xs leading-5 text-[#755b20]">아직 현재 작업은 바뀌지 않았습니다. 아래 확정 버튼을 누르면 이 브라우저의 현재 EOFY 작업을 백업 내용으로 교체합니다.</p><div className="mt-4 flex flex-wrap gap-3"><button type="button" onClick={restoreArchive} className="min-h-11 bg-gold px-4 text-sm font-semibold text-navy">검토한 백업으로 교체</button><button type="button" onClick={() => { setPendingArchive(null); setArchiveMessage(""); }} className="min-h-11 border border-border px-4 text-sm font-semibold text-muted">취소</button></div></div> : null}<p className={`mt-4 min-h-5 text-xs leading-5 ${archiveError ? "text-red-700" : "text-muted"}`} aria-live="polite">{archiveError || archiveMessage}</p></section>
    </div>
  </div>;
}
