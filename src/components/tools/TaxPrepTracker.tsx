"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { taxPrepRecordsStorageKey } from "@/lib/taxPrepStorage";

type RecordKind = "income" | "expense";
type EvidenceStatus = "saved" | "available" | "missing";

type TaxRecord = {
  id: string;
  date: string;
  kind: RecordKind;
  category: string;
  description: string;
  amount: number;
  evidence: EvidenceStatus;
  createdAt: string;
};

const categories: Record<RecordKind, string[]> = {
  income: ["급여·Income statement", "은행 이자", "정부 지급금", "부업·플랫폼", "기타 소득"],
  expense: ["업무 장비·도구", "유니폼·세탁", "차량·출장", "재택근무", "교육·자격", "기부", "세무 비용", "기타 지출 후보"],
};

const evidenceLabels: Record<EvidenceStatus, string> = {
  saved: "증빙 저장함",
  available: "나중에 받을 수 있음",
  missing: "아직 없음",
};

function financialYearStart(date = new Date()) {
  return date.getMonth() >= 6 ? date.getFullYear() : date.getFullYear() - 1;
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD" }).format(value);
}

function csvCell(value: string | number) {
  return `"${String(value).replaceAll('"', '""')}"`;
}

export function TaxPrepTracker() {
  const [records, setRecords] = useState<TaxRecord[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [year, setYear] = useState(() => financialYearStart());
  const [kind, setKind] = useState<RecordKind>("expense");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [category, setCategory] = useState(categories.expense[0]);
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [evidence, setEvidence] = useState<EvidenceStatus>("saved");
  const [message, setMessage] = useState("");

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(taxPrepRecordsStorageKey) ?? "[]") as TaxRecord[];
      if (Array.isArray(saved)) setRecords(saved.filter((item) => item && typeof item.id === "string" && typeof item.amount === "number"));
    } catch {
      // Invalid local data is ignored; no record is sent elsewhere.
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try { localStorage.setItem(taxPrepRecordsStorageKey, JSON.stringify(records)); }
    catch { setMessage("브라우저 저장 공간을 사용할 수 없어 이번 변경은 자동 저장되지 않을 수 있어요."); }
  }, [records, loaded]);

  const yearRecords = useMemo(() => {
    const start = `${year}-07-01`;
    const end = `${year + 1}-06-30`;
    return records.filter((record) => record.date >= start && record.date <= end).sort((a, b) => b.date.localeCompare(a.date));
  }, [records, year]);

  const summary = useMemo(() => ({
    income: yearRecords.filter((record) => record.kind === "income").reduce((sum, record) => sum + record.amount, 0),
    expenses: yearRecords.filter((record) => record.kind === "expense").reduce((sum, record) => sum + record.amount, 0),
    missing: yearRecords.filter((record) => record.evidence === "missing").length,
    months: new Set(yearRecords.map((record) => record.date.slice(0, 7))).size,
  }), [yearRecords]);

  function changeKind(nextKind: RecordKind) {
    setKind(nextKind);
    setCategory(categories[nextKind][0]);
  }

  function addRecord(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const numericAmount = Number(amount);
    if (!date || !description.trim() || !Number.isFinite(numericAmount) || numericAmount <= 0) {
      setMessage("날짜, 내용과 0보다 큰 금액을 확인해 주세요.");
      return;
    }
    const nextRecord: TaxRecord = {
      id: crypto.randomUUID(),
      date,
      kind,
      category,
      description: description.trim().slice(0, 120),
      amount: Math.round(numericAmount * 100) / 100,
      evidence,
      createdAt: new Date().toISOString(),
    };
    setRecords((current) => [nextRecord, ...current]);
    setDescription("");
    setAmount("");
    setMessage("현재 브라우저에 기록했어요. 영수증 파일 자체는 저장하지 않습니다.");
  }

  function removeRecord(id: string) {
    if (!window.confirm("이 기록을 현재 브라우저에서 삭제할까요?")) return;
    setRecords((current) => current.filter((record) => record.id !== id));
  }

  function exportCsv() {
    const header = ["date", "type", "category", "description", "amount_aud", "evidence_status"];
    const rows = yearRecords.map((record) => [record.date, record.kind, record.category, record.description, record.amount.toFixed(2), evidenceLabels[record.evidence]]);
    const csv = `\uFEFF${[header, ...rows].map((row) => row.map(csvCell).join(",")).join("\r\n")}`;
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `hoju-compass-tax-prep-${year}-${year + 1}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    setMessage("선택한 회계연도 기록을 CSV로 저장했어요. 제출 전 원본 증빙과 대조하세요.");
  }

  return <section className="rounded-3xl border border-border bg-white p-5 shadow-sm sm:p-8" aria-labelledby="tax-prep-tracker-heading">
    <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
      <div>
        <p className="text-sm font-semibold text-gold">현재 브라우저에만 쌓이는 준비 장부</p>
        <h2 id="tax-prep-tracker-heading" className="mt-2 text-2xl font-semibold text-navy sm:text-3xl">택스 리턴 준비 기록</h2>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-muted">소득과 업무 관련 지출 후보, 증빙 보유 여부를 그때그때 적어두세요. 이 합계는 예상 환급액이나 공제 가능 금액이 아니며, 실제 신고 전 ATO 기준과 원본 자료를 확인해야 합니다.</p>
      </div>
      <label className="text-sm font-semibold text-navy">회계연도
        <select value={year} onChange={(event) => setYear(Number(event.target.value))} className="mt-2 block min-h-11 rounded-lg border border-border bg-white px-3">
          {[financialYearStart() - 2, financialYearStart() - 1, financialYearStart(), financialYearStart() + 1].map((item) => <option key={item} value={item}>{item}–{String(item + 1).slice(-2)}</option>)}
        </select>
      </label>
    </div>

    <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-4" aria-live="polite">
      <div className="rounded-xl bg-surface p-4"><p className="text-xs text-muted">기록한 소득</p><strong className="mt-1 block text-xl text-navy">{formatMoney(summary.income)}</strong></div>
      <div className="rounded-xl bg-surface p-4"><p className="text-xs text-muted">지출 후보 합계</p><strong className="mt-1 block text-xl text-navy">{formatMoney(summary.expenses)}</strong></div>
      <div className="rounded-xl bg-surface p-4"><p className="text-xs text-muted">증빙 없는 기록</p><strong className="mt-1 block text-xl text-navy">{summary.missing}건</strong></div>
      <div className="rounded-xl bg-surface p-4"><p className="text-xs text-muted">기록이 있는 달</p><strong className="mt-1 block text-xl text-navy">{summary.months}/12개월</strong></div>
    </div>

    <form onSubmit={addRecord} className="mt-8 rounded-2xl border border-border bg-surface p-5 sm:p-6">
      <div className="flex flex-wrap gap-2" aria-label="기록 종류">
        {(["expense", "income"] as RecordKind[]).map((item) => <button key={item} type="button" aria-pressed={kind === item} onClick={() => changeKind(item)} className={`min-h-11 rounded-full border px-4 text-sm font-semibold ${kind === item ? "border-navy bg-navy text-white" : "border-border bg-white text-navy"}`}>{item === "expense" ? "지출 후보" : "소득"}</button>)}
      </div>
      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <label className="text-sm font-medium text-navy">날짜<input type="date" required value={date} onChange={(event) => setDate(event.target.value)} className="mt-2 min-h-11 w-full rounded-lg border border-border bg-white px-3" /></label>
        <label className="text-sm font-medium text-navy">분류<select value={category} onChange={(event) => setCategory(event.target.value)} className="mt-2 min-h-11 w-full rounded-lg border border-border bg-white px-3">{categories[kind].map((item) => <option key={item}>{item}</option>)}</select></label>
        <label className="text-sm font-medium text-navy">금액 AUD<input type="number" inputMode="decimal" min="0.01" step="0.01" required value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="예: 45.90" className="mt-2 min-h-11 w-full rounded-lg border border-border bg-white px-3" /></label>
        <label className="text-sm font-medium text-navy sm:col-span-2">무엇이었나요?<input type="text" maxLength={120} required value={description} onChange={(event) => setDescription(event.target.value)} placeholder="예: 작업용 안전화 — 영수증은 이메일에 있음" className="mt-2 min-h-11 w-full rounded-lg border border-border bg-white px-3" /></label>
        <label className="text-sm font-medium text-navy">증빙 상태<select value={evidence} onChange={(event) => setEvidence(event.target.value as EvidenceStatus)} className="mt-2 min-h-11 w-full rounded-lg border border-border bg-white px-3">{Object.entries(evidenceLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
      </div>
      <div className="mt-5 flex flex-wrap items-center gap-4"><button type="submit" className="min-h-12 rounded-lg bg-gold px-5 text-sm font-semibold text-navy">이 브라우저에 기록</button><p className="text-xs leading-5 text-muted">TFN, 계좌번호, 카드번호나 영수증 이미지는 입력하지 마세요.</p></div>
    </form>

    <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div><h3 className="text-xl font-semibold text-navy">{year}–{String(year + 1).slice(-2)} 기록</h3><p className="mt-1 text-sm text-muted">{yearRecords.length ? `${yearRecords.length}건을 저장했습니다.` : "아직 기록이 없습니다. 한 달에 한 번만 정리해도 7월의 일을 줄일 수 있어요."}</p></div>
      <button type="button" disabled={!yearRecords.length} onClick={exportCsv} className="min-h-11 rounded-lg border border-navy px-4 text-sm font-semibold text-navy disabled:cursor-not-allowed disabled:opacity-40">CSV 백업·검토용 저장</button>
    </div>

    {yearRecords.length > 0 && <div className="mt-5 overflow-x-auto border-t border-navy/20"><table className="w-full min-w-[44rem] border-collapse text-left text-sm"><thead><tr className="border-b border-border"><th className="px-3 py-3 font-semibold text-navy">날짜</th><th className="px-3 py-3 font-semibold text-navy">종류·분류</th><th className="px-3 py-3 font-semibold text-navy">내용</th><th className="px-3 py-3 text-right font-semibold text-navy">금액</th><th className="px-3 py-3 font-semibold text-navy">증빙</th><th className="px-3 py-3"><span className="sr-only">삭제</span></th></tr></thead><tbody>{yearRecords.map((record) => <tr key={record.id} className="border-b border-border"><td className="px-3 py-4 text-muted">{record.date}</td><td className="px-3 py-4"><span className="block font-semibold text-navy">{record.kind === "expense" ? "지출 후보" : "소득"}</span><span className="mt-1 block text-xs text-muted">{record.category}</span></td><td className="max-w-sm px-3 py-4 text-navy">{record.description}</td><td className="px-3 py-4 text-right font-semibold text-navy">{formatMoney(record.amount)}</td><td className="px-3 py-4 text-muted">{evidenceLabels[record.evidence]}</td><td className="px-3 py-4 text-right"><button type="button" onClick={() => removeRecord(record.id)} className="min-h-10 px-2 text-xs font-semibold text-muted underline hover:text-navy">삭제</button></td></tr>)}</tbody></table></div>}

    {message && <p className="mt-5 border-l-2 border-gold pl-3 text-sm leading-6 text-muted" role="status">{message}</p>}
  </section>;
}
