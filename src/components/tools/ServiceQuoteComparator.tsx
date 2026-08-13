"use client";

import { useEffect, useMemo, useState } from "react";

type Quote = {
  id: string;
  provider: string;
  callout: string;
  labour: string;
  materials: string;
  other: string;
  gstIncluded: boolean;
  writtenScope: boolean;
  abnChecked: boolean;
  licenceChecked: boolean;
  insuranceChecked: boolean;
  timelineConfirmed: boolean;
  warrantyConfirmed: boolean;
};

const storageKey = "aussie-compass-service-quotes-v1";

function createQuote(index: number): Quote {
  return { id: `${Date.now()}-${index}`, provider: "", callout: "", labour: "", materials: "", other: "", gstIncluded: false, writtenScope: false, abnChecked: false, licenceChecked: false, insuranceChecked: false, timelineConfirmed: false, warrantyConfirmed: false };
}

function amount(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

function quoteTotal(quote: Quote) {
  return amount(quote.callout) + amount(quote.labour) + amount(quote.materials) + amount(quote.other);
}

const checks: Array<{ key: keyof Quote; label: string; detail: string }> = [
  { key: "writtenScope", label: "작업 범위가 서면으로 명확함", detail: "포함·제외 작업과 추가 비용 조건" },
  { key: "abnChecked", label: "ABN 상태 확인", detail: "ABN Lookup에서 업체명과 활성 상태 확인" },
  { key: "licenceChecked", label: "필요 면허 확인", detail: "직종과 주·준주에 적용되는 등록·면허" },
  { key: "insuranceChecked", label: "보험 여부 확인", detail: "업무에 적합한 보험 보유 여부" },
  { key: "timelineConfirmed", label: "시작·완료 일정 확인", detail: "지연 시 연락 및 일정 변경 방식" },
  { key: "warrantyConfirmed", label: "보증·사후조치 확인", detail: "문제 발생 시 수정 범위와 연락 방법" },
];

export function ServiceQuoteComparator() {
  const [quotes, setQuotes] = useState<Quote[]>([createQuote(0), createQuote(1)]);
  const [loaded, setLoaded] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(storageKey);
      if (saved) setQuotes(JSON.parse(saved));
    } catch { /* Keep an unsaved working copy. */ }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try { window.localStorage.setItem(storageKey, JSON.stringify(quotes)); } catch { /* Storage is optional. */ }
  }, [quotes, loaded]);

  const lowestTotal = useMemo(() => Math.min(...quotes.map(quoteTotal).filter((total) => total > 0)), [quotes]);

  function update(id: string, key: keyof Quote, value: string | boolean) {
    setQuotes((current) => current.map((quote) => quote.id === id ? { ...quote, [key]: value } : quote));
  }

  function addQuote() {
    if (quotes.length < 3) setQuotes((current) => [...current, createQuote(current.length)]);
  }

  async function copySummary() {
    const lines = quotes.map((quote, index) => {
      const complete = checks.filter((check) => Boolean(quote[check.key])).length;
      return `${index + 1}. ${quote.provider || "업체명 미입력"}: $${quoteTotal(quote).toFixed(2)} / 확인 ${complete}/${checks.length} / GST ${quote.gstIncluded ? "포함" : "미확인"}`;
    });
    await navigator.clipboard.writeText(["서비스 견적 비교", ...lines, "※ 금액만이 아니라 작업 범위, 면허, 보험, 일정과 보증을 함께 확인하세요."].join("\n"));
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return <section className="rounded-3xl border border-border bg-white p-5 shadow-sm sm:p-8" aria-labelledby="quote-comparator-heading">
    <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
      <div><p className="text-sm font-semibold text-gold">내 브라우저에만 저장</p><h2 id="quote-comparator-heading" className="mt-2 text-2xl font-semibold text-navy">서비스 견적 비교표</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-muted">업체 연락처나 주소 대신 비교에 필요한 정보만 기록하세요. 이 점검표는 업체의 품질이나 적법성을 보증하지 않습니다.</p></div>
      <div className="flex gap-2"><button type="button" onClick={copySummary} className="min-h-11 rounded-lg border border-navy px-4 py-2 text-sm font-semibold text-navy hover:bg-surface">{copied ? "복사됨" : "요약 복사"}</button>{quotes.length < 3 && <button type="button" onClick={addQuote} className="min-h-11 rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-white hover:bg-navy-light">견적 추가</button>}</div>
    </div>

    <div className="mt-8 grid gap-5 xl:grid-cols-3">
      {quotes.map((quote, index) => {
        const total = quoteTotal(quote);
        const completed = checks.filter((check) => Boolean(quote[check.key])).length;
        const isLowest = total > 0 && total === lowestTotal && Number.isFinite(lowestTotal);
        return <article key={quote.id} className="rounded-2xl border border-border p-5">
          <div className="flex items-start justify-between gap-3"><div><p className="text-xs font-semibold text-gold">견적 {index + 1}</p><h3 className="mt-1 text-lg font-semibold text-navy">{quote.provider || "업체명 미입력"}</h3></div>{quotes.length > 2 && <button type="button" onClick={() => setQuotes((current) => current.filter((item) => item.id !== quote.id))} className="min-h-10 px-2 text-xs font-semibold text-muted hover:text-navy">삭제</button>}</div>
          <label className="mt-4 block text-sm font-medium text-navy">업체명 또는 구분명<input value={quote.provider} onChange={(event) => update(quote.id, "provider", event.target.value)} maxLength={60} placeholder="예: 견적 A" className="mt-2 min-h-11 w-full rounded-lg border border-border px-3 outline-none focus:border-navy" /></label>
          <div className="mt-4 grid grid-cols-2 gap-3">
            {([['callout','출장비'],['labour','인건비'],['materials','자재비'],['other','기타 비용']] as const).map(([key, label]) => <label key={key} className="text-xs font-medium text-navy">{label} ($)<input type="number" min="0" step="0.01" inputMode="decimal" value={quote[key]} onChange={(event) => update(quote.id, key, event.target.value)} className="mt-1 min-h-11 w-full rounded-lg border border-border px-3 text-sm outline-none focus:border-navy" /></label>)}
          </div>
          <label className="mt-4 flex cursor-pointer items-center gap-3 rounded-lg bg-surface p-3 text-sm text-navy"><input type="checkbox" checked={quote.gstIncluded} onChange={(event) => update(quote.id, "gstIncluded", event.target.checked)} className="h-5 w-5 accent-[var(--color-gold)]" />총액에 GST 포함 확인</label>
          <div className="mt-5 rounded-xl bg-navy p-4 text-white"><div className="flex items-end justify-between"><span className="text-sm text-white/70">입력 합계</span><strong className="text-2xl">${total.toFixed(2)}</strong></div><div className="mt-2 flex justify-between text-xs text-white/70"><span>확인 항목 {completed}/{checks.length}</span>{isLowest && <span className="font-semibold text-gold">현재 최저 입력 금액</span>}</div></div>
          <div className="mt-5 space-y-3">{checks.map((check) => <label key={check.key} className="flex cursor-pointer gap-3"><input type="checkbox" checked={Boolean(quote[check.key])} onChange={(event) => update(quote.id, check.key, event.target.checked)} className="mt-0.5 h-5 w-5 shrink-0 accent-[var(--color-gold)]" /><span><span className="block text-sm font-medium text-navy">{check.label}</span><span className="block text-xs leading-5 text-muted">{check.detail}</span></span></label>)}</div>
        </article>;
      })}
    </div>
    <button type="button" onClick={() => setQuotes([createQuote(0), createQuote(1)])} className="mt-6 min-h-11 rounded-lg border border-border px-4 py-2 text-sm font-semibold text-navy hover:bg-surface">모든 입력 초기화</button>
  </section>;
}
