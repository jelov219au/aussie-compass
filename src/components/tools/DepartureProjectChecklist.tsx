"use client";

import { useMemo } from "react";
import type { ProjectGroup } from "@/components/tools/LocalProjectChecklist";
import { departureChecklistCodec, departureChecklistStatuses, emptyDepartureChecklist, type DepartureChecklistStatus } from "@/lib/departureChecklist";
import { useLocalPlan } from "@/lib/useLocalPlan";
import { TaxStorageNotice as LocalStorageNotice } from "./TaxStorageNotice";

type Props = {
  storageKey: string;
  groups: ProjectGroup[];
};

export function DepartureProjectChecklist({ storageKey, groups }: Props) {
  const items = useMemo(() => groups.flatMap((group) => group.items), [groups]);
  const empty = useMemo(() => emptyDepartureChecklist(items), [items]);
  const codec = useMemo(() => departureChecklistCodec(items), [items]);
  const { data, update, storage, saveState } = useLocalPlan(storageKey, empty, codec.parse, codec.serialize, {
    initial: "아직 저장한 출국 준비 상태 없음",
    reset: "출국 준비 상태 초기화",
  });
  const resolved = items.filter((item) => ["confirmed", "not_applicable"].includes(data.statuses[item.id])).length;
  const review = items.filter((item) => data.statuses[item.id] === "review_needed").length;

  const setStatus = (id: string, status: DepartureChecklistStatus) => {
    update((current) => ({ ...current, statuses: { ...current.statuses, [id]: status } }));
  };

  return (
    <section className="rounded-3xl border border-border bg-white p-5 shadow-sm sm:p-8" aria-labelledby="departure-checklist-heading">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-semibold text-navy">출국 전후 20개 준비 항목</p>
          <h2 id="departure-checklist-heading" className="mt-2 text-2xl font-semibold text-navy">완료가 아니라 실제 상태로 표시하세요</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">요청·신청은 결과 확인과 다릅니다. ‘결과까지 확인’은 실제 입금, 수정 Payslip, Bond 반환액 또는 final bill을 대조한 뒤 선택하세요.</p>
        </div>
        <div className="min-w-48 text-sm font-semibold text-navy"><span>{resolved}/{items.length} 결과 확인·해당 없음</span>{review ? <span className="mt-1 block text-amber-800">{review}개 기존 체크 재확인 필요</span> : null}</div>
      </div>
      <LocalStorageNotice storageKey={storageKey} storage={storage} saveState={saveState} />
      <p className="mt-3 text-xs leading-5 text-muted">기존 체크 항목은 삭제하지 않고 ‘기존 체크 · 재확인 필요’로 복원합니다. 체크만으로 기관 처리나 지급 완료를 인정하지 않습니다.</p>
      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        {groups.map((group, groupIndex) => (
          <section key={group.title} className="rounded-2xl border border-border p-4" aria-labelledby={`departure-group-${groupIndex}`}>
            <h3 id={`departure-group-${groupIndex}`} className="text-lg font-semibold text-navy">{group.title}</h3>
            <div className="mt-3 space-y-4">
              {group.items.map((item) => (
                <label key={item.id} className="block border-t border-border pt-3 first:border-0 first:pt-0">
                  <span className="text-sm font-semibold text-navy">{item.label}</span>
                  <span className="mt-1 block text-xs leading-5 text-muted">{item.detail}</span>
                  <select value={data.statuses[item.id] ?? "pending"} disabled={storage === "loading"} onChange={(event) => setStatus(item.id, event.target.value as DepartureChecklistStatus)} className="mt-2 min-h-11 w-full rounded-lg border border-border bg-white px-3 text-sm text-navy focus:border-navy focus:outline-none focus:ring-2 focus:ring-navy/15">
                    {departureChecklistStatuses.map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}
                  </select>
                </label>
              ))}
            </div>
          </section>
        ))}
      </div>
    </section>
  );
}
