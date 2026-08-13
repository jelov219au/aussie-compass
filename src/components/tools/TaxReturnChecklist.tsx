"use client";

import { useEffect, useMemo, useState } from "react";

type ChecklistItem = { id: string; label: string; detail: string };
type ChecklistGroup = { title: string; description: string; items: ChecklistItem[] };

const groups: ChecklistGroup[] = [
  {
    title: "소득 자료 확인",
    description: "ATO에 자동으로 채워진 내용도 누락이나 오류가 없는지 직접 확인하세요.",
    items: [
      { id: "income-statement", label: "Income statement가 Tax ready인지 확인", detail: "myGov에 연결된 ATO 온라인 서비스에서 확인할 수 있어요." },
      { id: "bank-interest", label: "모든 은행 계좌의 이자 확인", detail: "사용하지 않는 계좌나 공동 계좌도 빠뜨리지 마세요." },
      { id: "other-income", label: "기타 소득 확인", detail: "정부 지급금, 부업·플랫폼 소득, 현금 소득 등이 있다면 포함 여부를 확인하세요." },
      { id: "complex-income", label: "투자·가상자산·임대·해외 소득 확인", detail: "해당된다면 거래 내역을 정리하고 전문가 도움이 필요한지 판단하세요." },
    ],
  },
  {
    title: "공제 증빙 모으기",
    description: "업무와 직접 관련되고 본인이 지출했으며 환급받지 않은 비용인지, 증빙이 있는지 확인하세요.",
    items: [
      { id: "work-expenses", label: "업무 관련 지출과 영수증 정리", detail: "장비, 유니폼, 조합비·전문가 협회비 등 해당 항목을 분류하세요." },
      { id: "home-office", label: "재택근무 기록 확인", detail: "사용할 계산 방식에 필요한 시간·비용 기록이 갖춰졌는지 확인하세요." },
      { id: "car-travel", label: "차량·출장 기록 확인", detail: "일반적인 출퇴근은 보통 공제 대상이 아니므로 업무 이동과 구분하세요." },
      { id: "education-donations", label: "자기계발·기부 내역 확인", detail: "현재 업무와의 관련성 및 적격 기부단체 여부를 공식 안내에서 확인하세요." },
    ],
  },
  {
    title: "제출 전 마지막 점검",
    description: "간단한 신고는 myTax로 직접 할 수 있고, 복잡하다면 등록된 세무사를 선택할 수 있어요.",
    items: [
      { id: "prefill-review", label: "Pre-fill 내용과 내 기록 대조", detail: "자동 입력된 자료가 정확하고 완전한지 최종 확인하세요." },
      { id: "lodge-choice", label: "직접 신고 또는 등록 세무사 이용 결정", detail: "투자, 임대, 사업, 해외 소득처럼 복잡한 사정이 있다면 전문가 상담을 고려하세요." },
      { id: "deadline", label: "나에게 적용되는 신고 기한 확인", detail: "직접 신고는 일반적으로 10월 31일까지이며 예외가 있을 수 있어요." },
      { id: "records", label: "제출본과 증빙 보관 계획 세우기", detail: "기록마다 보관 기간이 다를 수 있으므로 ATO 기준을 확인하세요." },
    ],
  },
];

const storageKey = "aussie-compass-tax-return-checklist-v1";

export function TaxReturnChecklist() {
  const [checked, setChecked] = useState<string[]>([]);
  const [loaded, setLoaded] = useState(false);
  const allItems = useMemo(() => groups.flatMap((group) => group.items), []);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(storageKey);
      if (saved) setChecked(JSON.parse(saved));
    } catch {
      // The checklist still works when browser storage is unavailable.
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(checked));
    } catch {
      // Ignore storage failures; no personal data needs to leave the page.
    }
  }, [checked, loaded]);

  const progress = Math.round((checked.length / allItems.length) * 100);

  function toggle(id: string) {
    setChecked((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  }

  return (
    <section className="rounded-3xl border border-border bg-white p-6 shadow-sm sm:p-8" aria-labelledby="tax-checklist-heading">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-gold">내 기기에만 저장되는 준비 목록</p>
          <h2 id="tax-checklist-heading" className="mt-2 text-2xl font-semibold text-navy">택스 리턴 준비 체크리스트</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">체크 상태만 이 브라우저에 저장됩니다. TFN, 계좌번호, 소득 금액이나 영수증은 입력하지 마세요.</p>
        </div>
        <div className="min-w-44" aria-live="polite">
          <div className="flex items-center justify-between text-sm font-semibold text-navy"><span>{checked.length}/{allItems.length} 완료</span><span>{progress}%</span></div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-surface"><div className="h-full rounded-full bg-gold transition-all" style={{ width: `${progress}%` }} /></div>
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        {groups.map((group) => (
          <fieldset key={group.title} className="rounded-2xl border border-border p-5">
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

      {checked.length > 0 && <button type="button" onClick={() => setChecked([])} className="mt-6 min-h-11 rounded-lg border border-border px-4 py-2 text-sm font-semibold text-navy transition hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-2">체크리스트 초기화</button>}
    </section>
  );
}
