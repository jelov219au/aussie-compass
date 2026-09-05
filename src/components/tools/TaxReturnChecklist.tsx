"use client";
import { groups, parseTaxChecklist, serializeTaxChecklist, taxChecklistIds, taxChecklistStorageKey } from "@/lib/taxReturnChecklist";
import { useLocalPlan } from "@/lib/useLocalPlan";
import { TaxStorageNotice } from "./TaxStorageNotice";

export function TaxReturnChecklist() {
  const { data: checked, update: setChecked, storage, saveState } = useLocalPlan<string[]>(taxChecklistStorageKey, [], parseTaxChecklist, serializeTaxChecklist, { initial: "아직 저장한 체크 없음", reset: "체크 초기화" });
  const progress = Math.round((checked.length / taxChecklistIds.length) * 100);
  function toggle(id: string) {
    if (storage === "loading" || !taxChecklistIds.includes(id)) return;
    setChecked(current => current.includes(id) ? current.filter(item => item !== id) : [...current, id]);
  }
  return (
    <section className="rounded-3xl border border-border bg-white p-6 shadow-sm sm:p-8" aria-labelledby="tax-checklist-heading">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-gold">내 기기에만 저장되는 준비 목록</p>
          <h2 id="tax-checklist-heading" className="mt-2 text-2xl font-semibold text-navy">택스 리턴 준비 체크리스트</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">체크 상태는 연도 공통으로 이 브라우저에 저장됩니다. 새 신고연도에는 모든 항목을 다시 확인하세요. 체크 수는 해당 연도의 신고 준비 완료를 보증하지 않습니다. TFN, 계좌번호, 소득 금액이나 영수증은 입력하지 마세요.</p>
        </div>
        <div className="min-w-44" aria-live="polite">
          <div className="flex items-center justify-between text-sm font-semibold text-navy"><span>{checked.length}/{taxChecklistIds.length} 확인 표시</span><span>{progress}%</span></div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-surface"><div className="h-full rounded-full bg-gold transition-all" style={{ width: `${progress}%` }} /></div>
        </div>
      </div>

      <TaxStorageNotice storageKey={taxChecklistStorageKey} storage={storage} saveState={saveState} />
      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        {groups.map((group) => (
          <fieldset disabled={storage === "loading"} key={group.title} className="rounded-2xl border border-border p-5">
            <legend className="px-1 text-lg font-semibold text-navy">{group.title}</legend>
            <p className="mt-1 text-sm leading-6 text-muted">{group.description}</p>
            <div className="mt-5 space-y-4">
              {group.items.map((item) => {
                const isChecked = checked.includes(item.id);
                return <label key={item.id} className="flex cursor-pointer gap-3 rounded-xl p-2 transition hover:bg-surface">
                  <input type="checkbox" checked={isChecked} onChange={() => toggle(item.id)} className="mt-1 h-5 w-5 shrink-0 accent-[var(--color-gold)]" />
                  <span><span className={`block text-sm font-semibold ${isChecked ? "text-muted line-through" : "text-navy"}`}>{item.label}</span><span className="mt-1 block text-xs leading-5 text-muted">{item.detail}</span></span>
                </label>;
              })}
            </div>
          </fieldset>
        ))}
      </div>

      {checked.length > 0 && <button type="button" onClick={() => { if (window.confirm("연도 공통 체크 표시를 모두 해제할까요? 새 신고연도 자료는 다시 확인해야 합니다.")) setChecked([]); }} className="mt-6 min-h-11 rounded-lg border border-border px-4 py-2 text-sm font-semibold text-navy transition hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-2">체크리스트 초기화</button>}
    </section>
  );
}
