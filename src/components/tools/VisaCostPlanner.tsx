"use client";

import { useEffect, useState } from "react";
import { parseVisaCostStorage, summarizeVisaCosts, visaCostFields } from "@/lib/visaCostPlan";

const storageKey = "aussie-compass-visa-cost-plan-v1";

export function VisaCostPlanner() {
  const [values, setValues] = useState<Record<string, string>>({});
  const [storageState, setStorageState] = useState<"loading" | "ready" | "blocked">("loading");
  const [changed, setChanged] = useState(false);
  const [saveFailed, setSaveFailed] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved !== null) {
        const restored = parseVisaCostStorage(saved);
        if (restored === null) {
          setStorageState("blocked");
          return;
        }
        setValues(restored);
      }
      setStorageState("ready");
    } catch {
      setStorageState("blocked");
    }
  }, []);

  useEffect(() => {
    if (storageState !== "ready" || !changed) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify(values));
      setSaveFailed(false);
    } catch {
      setSaveFailed(true);
    }
  }, [values, changed, storageState]);

  const { total, entered, errors, totalValid } = summarizeVisaCosts(values);
  const hasErrors = Object.keys(errors).length > 0;
  const summaryLabel = entered === visaCostFields.length ? "입력한 비용 합계" : "입력한 비용 소계";

  return (
    <section className="rounded-3xl border border-border bg-white p-5 shadow-sm sm:p-8" aria-labelledby="visa-cost-heading">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-gold">고정 금액 대신 내 견적 입력</p>
          <h2 id="visa-cost-heading" className="mt-2 text-2xl font-semibold text-navy">비자 준비 비용 정리</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">비자와 신체검사 비용은 신청 시점, 검사 코드, 국가와 개인 상황에 따라 달라집니다. 공식 화면에서 확인한 금액만 AUD로 입력하세요. 해외 견적은 직접 확인한 AUD 환산 금액을 사용합니다.</p>
        </div>
        <div className="rounded-xl bg-navy px-5 py-4 text-white" aria-live="polite" aria-atomic="true">
          <span className="text-xs text-white/65">{storageState === "loading" ? "저장한 비용 확인 중" : entered === 0 ? "아직 입력한 비용이 없어요" : summaryLabel}</span>
          <strong className="mt-1 block text-xl">{storageState === "loading" ? "잠시 기다려 주세요" : !totalValid ? "합산 가능한 금액을 초과했어요" : entered === 0 ? "확인한 금액부터 입력하세요" : `A$${total.toLocaleString("en-AU", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}</strong>
        </div>
      </div>
      <p className="mt-5 text-sm leading-6 text-muted">금액 입력 {entered}/{visaCostFields.length} · 비어 있는 항목은 소계에 포함되지 않습니다. 적용 여부를 확인한 무료 항목만 0으로 적으세요. 입력한 합계는 비자 총비용의 확정 견적이 아닙니다.{hasErrors && " 오류가 있는 금액은 합산하지 않습니다."}</p>
      {storageState === "blocked" && <p role="status" className="mt-4 rounded-lg border border-gold/50 bg-gold/10 p-4 text-sm leading-6 text-navy">저장본을 안전하게 읽지 못해 자동 저장을 중지했습니다. 기존 저장본은 덮어쓰거나 삭제하지 않습니다. 아래에 새로 입력하는 값은 이 화면에서만 사용할 수 있으므로 필요한 내용을 별도로 메모하세요.</p>}
      {saveFailed && <p role="status" className="mt-4 text-sm leading-6 text-navy">변경 내용을 이 기기에 저장하지 못했습니다. 화면의 금액을 별도로 메모하세요. 다음 수정 시 다시 저장을 시도합니다.</p>}
      <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {visaCostFields.map((field) => (
          <label key={field.id} className="text-sm font-medium text-navy">
            {field.label} (AUD)
            <input type="text" inputMode="decimal" disabled={storageState === "loading"} value={values[field.id] ?? ""} aria-invalid={Boolean(errors[field.id])} aria-describedby={`visa-cost-${field.id}-hint${errors[field.id] ? ` visa-cost-${field.id}-error` : ""}`} onChange={(event) => { setValues((current) => ({ ...current, [field.id]: event.target.value })); setChanged(true); }} className="mt-2 min-h-11 w-full rounded-lg border border-border px-3 disabled:opacity-60" />
            <span id={`visa-cost-${field.id}-hint`} className="mt-1 block text-xs leading-5 text-muted">{field.hint}</span>
            {errors[field.id] && <span id={`visa-cost-${field.id}-error`} className="mt-1 block text-xs leading-5 text-red-700">{errors[field.id]}</span>}
          </label>
        ))}
      </div>
      {Object.values(values).some((value) => value !== "") && <button type="button" onClick={() => { setValues({}); setChanged(true); }} className="mt-6 min-h-11 rounded-lg border border-border px-4 text-sm font-semibold text-navy">{storageState === "blocked" ? "화면의 입력만 비우기" : "비용 초기화"}</button>}
    </section>
  );
}
