"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { evidenceLabels, financialYearLabel, financialYearPeriod, financialYearStart, parseTaxRecords, recordAmount, recordTotals, serializeTaxRecords, taxPrepRecordsStorageKey, taxRecordsCsv, validRecordDate, type EvidenceStatus, type RecordKind, type TaxRecord } from "@/lib/taxPrepStorage";
import { todayDate } from "@/lib/lifeReminders";
import { useLocalPlan } from "@/lib/useLocalPlan";
import { TaxStorageNotice } from "./TaxStorageNotice";
const categories: Record<RecordKind, string[]> = {
  income: ["급여·Income statement", "은행 이자", "정부 지급금", "부업·플랫폼", "기타 소득"],
  expense: ["업무 장비·도구", "유니폼·세탁", "차량·출장", "재택근무", "교육·자격", "기부", "세무 비용", "기타 지출 후보"],
};

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD" }).format(value);
}

export function TaxPrepTracker() {
  const { data: records, update: setRecords, storage, saveState } = useLocalPlan<TaxRecord[]>(taxPrepRecordsStorageKey, [], parseTaxRecords, serializeTaxRecords, { initial: "아직 저장한 기록 없음", reset: "기록 초기화" });
  const [year, setYear] = useState(() => financialYearStart());
  const [kind, setKind] = useState<RecordKind>("expense");
  const [date, setDate] = useState("");
  const [category, setCategory] = useState(categories.expense[0]);
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [evidence, setEvidence] = useState<EvidenceStatus>("missing");
  const [message, setMessage] = useState("");
  const [exportFallback, setExportFallback] = useState<string | null>(null);

  useEffect(() => { setDate(todayDate()); setYear(financialYearStart()); }, []);

  const yearRecords = useMemo(() => {
    const start = `${year}-07-01`;
    const end = `${year + 1}-06-30`;
    return records.filter((record) => record.date >= start && record.date <= end).sort((a, b) => b.date.localeCompare(a.date));
  }, [records, year]);

  const summary = useMemo(() => recordTotals(yearRecords), [yearRecords]);
  const years = [...new Set([year, financialYearStart() - 2, financialYearStart() - 1, financialYearStart(), financialYearStart() + 1, ...records.map(record => financialYearStart(record.date))])].sort((a, b) => b - a);

  function changeKind(nextKind: RecordKind) {
    setKind(nextKind);
    setCategory(categories[nextKind][0]);
  }

  function addRecord(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (storage === "loading") return;
    const numericAmount = recordAmount(amount);
    if (!validRecordDate(date) || !description.trim() || numericAmount === null) {
      setMessage("1900~2101년의 실제 날짜, 내용과 센트 반올림 후 0보다 큰 유효한 금액을 확인해 주세요.");
      return;
    }
    const nextRecord: TaxRecord = {
      id: crypto.randomUUID(),
      date,
      kind,
      category,
      description: description.trim(),
      amount: numericAmount,
      evidence,
      createdAt: new Date().toISOString(),
    };
    const nextRecords = [nextRecord, ...records];
    if (!parseTaxRecords(JSON.stringify(nextRecords))) { setMessage("기록 형식이나 합계 범위를 확인하세요. 최대 5,000건이며 금액은 센트 단위로 정확히 계산 가능한 범위여야 합니다."); return; }
    setRecords(nextRecords);
    const recordYear = financialYearStart(date);
    setYear(recordYear);
    setDescription("");
    setAmount("");
    setMessage(`화면에 기록을 추가했습니다.${recordYear !== year ? ` ${financialYearLabel(recordYear)} 목록으로 이동했습니다.` : ""} 실제 저장 상태는 위 안내를 확인하세요. 영수증 파일 자체는 저장하지 않습니다.`);
  }

  function removeRecord(id: string) {
    if (storage === "loading" || !window.confirm("이 기록을 화면에서 삭제할까요? 저장 실패 시 기존 브라우저 저장본에는 남을 수 있습니다.")) return;
    setRecords((current) => current.filter((record) => record.id !== id));
    setMessage("화면에서 삭제했습니다. 브라우저 저장 반영 여부는 위 저장 상태를 확인하세요.");
  }

  function exportCsv() {
    if (!yearRecords.length) return;
    const csv = taxRecordsCsv(yearRecords);
    try {
      const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
      try { const link = document.createElement("a"); link.href = url; link.download = "hoju-compass-tax-prep-" + year + "-" + (year + 1) + ".csv"; link.click(); }
      finally { URL.revokeObjectURL(url); }
      setExportFallback(null); setMessage("화면에 보이는 선택 연도 기록의 CSV 다운로드를 요청했습니다. 파일을 확인해 원본 증빙과 대조하세요. 이 도구에는 CSV 재가져오기 기능이 없습니다.");
    } catch { setExportFallback(csv); setMessage("파일을 내려받지 못했습니다. 아래 CSV 내용을 선택해 따로 보관하세요."); }
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
          {years.map((item) => <option key={item} value={item}>{item}–{String(item + 1).slice(-2)}</option>)}
        </select>
      </label>
    </div>

    <p className="mt-4 text-sm leading-6 text-muted">선택 기간: {financialYearPeriod(year)}. 기본은 현재 진행 중인 회계연도 장부입니다. 종료된 연도의 신고 자료는 회계연도를 바꿔 확인하세요.</p>
    <TaxStorageNotice storageKey={taxPrepRecordsStorageKey} storage={storage} saveState={saveState} />

    <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-4" aria-live="polite">
      <div className="rounded-xl bg-surface p-4"><p className="text-xs text-muted">기록한 소득</p><strong className="mt-1 block text-xl text-navy">{summary ? formatMoney(summary.income) : "합계 확인 필요"}</strong></div>
      <div className="rounded-xl bg-surface p-4"><p className="text-xs text-muted">지출 후보 합계</p><strong className="mt-1 block text-xl text-navy">{summary ? formatMoney(summary.expenses) : "합계 확인 필요"}</strong></div>
      <div className="rounded-xl bg-surface p-4"><p className="text-xs text-muted">증빙 없는 기록</p><strong className="mt-1 block text-xl text-navy">{summary?.missing ?? "—"}건</strong></div>
      <div className="rounded-xl bg-surface p-4"><p className="text-xs text-muted">기록이 있는 달</p><strong className="mt-1 block text-xl text-navy">{summary?.months ?? "—"}/12개월</strong></div>
    </div>

    <form onSubmit={addRecord} className="mt-8 rounded-2xl border border-border bg-surface p-5 sm:p-6">
      <fieldset disabled={storage === "loading"}><legend className="sr-only">소득·지출 기록 입력</legend>
      <div className="flex flex-wrap gap-2" aria-label="기록 종류">
        {(["expense", "income"] as RecordKind[]).map((item) => <button key={item} type="button" aria-pressed={kind === item} onClick={() => changeKind(item)} className={`min-h-11 rounded-full border px-4 text-sm font-semibold ${kind === item ? "border-navy bg-navy text-white" : "border-border bg-white text-navy"}`}>{item === "expense" ? "지출 후보" : "소득"}</button>)}
      </div>
      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <label className="text-sm font-medium text-navy">날짜<input type="date" min="1900-01-01" max="2101-12-31" required value={date} onChange={(event) => setDate(event.target.value)} className="mt-2 min-h-11 w-full rounded-lg border border-border bg-white px-3" /></label>
        <label className="text-sm font-medium text-navy">분류<select value={category} onChange={(event) => setCategory(event.target.value)} className="mt-2 min-h-11 w-full rounded-lg border border-border bg-white px-3">{categories[kind].map((item) => <option key={item}>{item}</option>)}</select></label>
        <label className="text-sm font-medium text-navy">금액 AUD<input type="number" inputMode="decimal" min="0.01" step="0.01" required value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="예: 45.90" className="mt-2 min-h-11 w-full rounded-lg border border-border bg-white px-3" /></label>
        <label className="text-sm font-medium text-navy sm:col-span-2">무엇이었나요?<input type="text" maxLength={120} required value={description} onChange={(event) => setDescription(event.target.value)} placeholder="예: 작업용 안전화 — 영수증은 이메일에 있음" className="mt-2 min-h-11 w-full rounded-lg border border-border bg-white px-3" /></label>
        <label className="text-sm font-medium text-navy">증빙 상태<select value={evidence} onChange={(event) => setEvidence(event.target.value as EvidenceStatus)} className="mt-2 min-h-11 w-full rounded-lg border border-border bg-white px-3">{Object.entries(evidenceLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
      </div>
      <div className="mt-5 flex flex-wrap items-center gap-4"><button type="submit" className="min-h-12 rounded-lg bg-gold px-5 text-sm font-semibold text-navy">화면에 기록 추가</button><p className="text-xs leading-5 text-muted">TFN, 계좌번호, 카드번호나 영수증 이미지는 입력하지 마세요.</p></div>
      </fieldset>
    </form>

    <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div><h3 className="text-xl font-semibold text-navy">{year}–{String(year + 1).slice(-2)} 기록</h3><p className="mt-1 text-sm text-muted">{yearRecords.length ? `${yearRecords.length}건이 화면에 있습니다. 저장 상태는 위 안내를 확인하세요.` : "아직 기록이 없습니다. 한 달에 한 번만 정리해도 7월의 일을 줄일 수 있어요."}</p></div>
      <button type="button" disabled={!yearRecords.length} onClick={exportCsv} className="min-h-11 rounded-lg border border-navy px-4 text-sm font-semibold text-navy disabled:cursor-not-allowed disabled:opacity-40">CSV 백업·검토용 저장</button>
    </div>

    <p className="mt-3 text-xs leading-6 text-muted">CSV는 화면 기록의 백업·검토용이며 이 도구에 다시 가져올 수 없습니다. 브라우저 저장 실패 중에도 화면의 남은 기록은 내보낼 수 있습니다. 원본 영수증은 별도로 보관하고 그 위치를 내용에 적으세요.</p>
    {exportFallback !== null && <label className="mt-3 block text-sm text-navy">따로 보관할 CSV<textarea readOnly value={exportFallback} rows={6} onFocus={event => event.target.select()} className="mt-2 w-full rounded-lg border border-border p-3 font-mono text-xs" /></label>}

    {yearRecords.length > 0 && <div className="mt-5 overflow-x-auto border-t border-navy/20" role="region" aria-label="선택 연도 준비 기록 표" tabIndex={0}><table className="w-full min-w-[44rem] border-collapse text-left text-sm"><thead><tr className="border-b border-border"><th className="px-3 py-3 font-semibold text-navy">날짜</th><th className="px-3 py-3 font-semibold text-navy">종류·분류</th><th className="px-3 py-3 font-semibold text-navy">내용</th><th className="px-3 py-3 text-right font-semibold text-navy">금액</th><th className="px-3 py-3 font-semibold text-navy">증빙</th><th className="px-3 py-3">작업</th></tr></thead><tbody>{yearRecords.map((record) => <tr key={record.id} className="border-b border-border"><td className="px-3 py-4 text-muted">{record.date}</td><td className="px-3 py-4"><span className="block font-semibold text-navy">{record.kind === "expense" ? "지출 후보" : "소득"}</span><span className="mt-1 block text-xs text-muted">{record.category}</span></td><td className="max-w-sm px-3 py-4 text-navy">{record.description}</td><td className="px-3 py-4 text-right font-semibold text-navy">{formatMoney(record.amount)}</td><td className="px-3 py-4 text-muted">{evidenceLabels[record.evidence]}</td><td className="px-3 py-4 text-right"><button type="button" onClick={() => removeRecord(record.id)} className="min-h-11 px-2 text-xs font-semibold text-muted underline hover:text-navy">삭제</button></td></tr>)}</tbody></table></div>}

    {message && <p className="mt-5 border-l-2 border-gold pl-3 text-sm leading-6 text-muted" role="status">{message}</p>}
  </section>;
}
