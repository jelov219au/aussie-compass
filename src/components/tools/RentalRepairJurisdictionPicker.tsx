"use client";

import { useState } from "react";

const jurisdictions = [
  {
    id: "NSW",
    label: "NSW",
    summary: "긴급·비긴급 수리를 구분하고 먼저 집주인·에이전트에게 요청합니다. 공식 안내는 긴급수리를 직접 맡기는 조건과 A$1,000 상한, 임대료를 계속 낼 의무를 함께 설명합니다.",
    rulesLabel: "NSW 수리 절차",
    rulesHref: "https://www.nsw.gov.au/housing-and-construction/renting-a-place-to-live/getting-repairs-done",
    escalationLabel: "Fair Trading 수리 시정명령",
    escalationHref: "https://www.nsw.gov.au/housing-and-construction/rules/rectification-orders-for-rental-properties",
  },
  {
    id: "VIC",
    label: "VIC",
    summary: "긴급수리는 즉시, 비긴급수리는 서면 요청 뒤 14일 기준을 확인합니다. 직접 긴급수리를 맡길 수 있는 조건·A$2,500 상한과 RDRV·VCAT 경로를 원문에서 확인하세요.",
    rulesLabel: "VIC 수리 절차·양식",
    rulesHref: "https://www.consumer.vic.gov.au/housing/renting/repairs-alterations-safety-and-pets/repairs/repairs-in-rental-properties",
    escalationLabel: "RDRV·VCAT 분쟁 절차",
    escalationHref: "https://www.consumer.vic.gov.au/housing/renting/legal-and-dispute-support/resolving-disputes",
  },
  {
    id: "QLD",
    label: "QLD",
    summary: "Emergency repair와 routine repair를 구분하고 계약서의 nominated repairer를 먼저 확인합니다. 직접 수리를 맡길 수 있는 조건·최대 4주치 임대료 기준과 RTA·QCAT repair order 절차가 따로 있습니다.",
    rulesLabel: "QLD Emergency repairs",
    rulesHref: "https://www.rta.qld.gov.au/during-a-tenancy/repairs/emergency-repairs",
    escalationLabel: "RTA Repair orders",
    escalationHref: "https://www.rta.qld.gov.au/during-a-tenancy/repairs/repair-orders",
  },
  {
    id: "WA",
    label: "WA",
    summary: "Essential service와 그 밖의 urgent repair는 수리업체를 주선해야 하는 시간이 다릅니다. 비긴급수리는 서면 허락 없이 직접 맡기지 말고, 필요하면 Form 23·Consumer Protection·Magistrates Court 순서를 확인하세요.",
    rulesLabel: "WA Rental home repairs",
    rulesHref: "https://www.consumerprotection.wa.gov.au/rental-home-repairs",
    escalationLabel: "Form 23 · 집주인 위반 통지",
    escalationHref: "https://www.consumerprotection.wa.gov.au/publications/notice-lessor-breach-agreement-form-23",
  },
  {
    id: "SA",
    label: "SA",
    summary: "긴급 문제는 즉시 알리고, 그 밖의 수리는 공식 Request for repairs 양식을 사용할 수 있습니다. 허가된 수리업체·서면 보고서·SACAT 신청 조건은 현재 원문을 기준으로 확인하세요.",
    rulesLabel: "SA 수리·유지보수 안내",
    rulesHref: "https://www.sa.gov.au/topics/housing-and-property/renting-and-letting/renting-privately/during-a-tenancy/Repairs-and-maintenance",
    escalationLabel: "SACAT 권리·의무 분쟁",
    escalationHref: "https://sacat.sa.gov.au/housing-and-rentals/common-disputes/parties-rights-disputes",
  },
  {
    id: "TAS",
    label: "TAS",
    summary: "General·urgent·emergency repair의 정의와 기한이 나뉩니다. 먼저 소유자·에이전트에게 알리고, 정해진 시간이 지난 뒤 Residential Tenancy Commissioner의 Order for repairs 경로를 확인하세요.",
    rulesLabel: "TAS 수리 요청·Order 절차",
    rulesHref: "https://cbos.tas.gov.au/topics/housing/renting/rental-maintenance-repairs-changes/requesting-repairs",
    escalationLabel: "TAS 임대 수리 공식 양식",
    escalationHref: "https://www.cbos.tas.gov.au/topics/resources-tools/general-forms/asset-listings/renting",
  },
  {
    id: "ACT",
    label: "ACT",
    summary: "Urgent repair는 가능한 한 빨리, non-urgent repair는 통지 뒤 4주 기준을 확인합니다. 직접 긴급수리를 맡기는 조건과 한도, ACAT 명령은 계약 유형과 현재 표준조항을 함께 봐야 합니다.",
    rulesLabel: "ACT During a tenancy · Repairs",
    rulesHref: "https://www.act.gov.au/housing-planning-and-property/renting/during-a-tenancy",
    escalationLabel: "ACAT 임대 수리 분쟁",
    escalationHref: "https://www.acat.act.gov.au/case-types/rental-disputes/other-types-of-rental-property-disputes",
  },
  {
    id: "NT",
    label: "NT",
    summary: "수리가 필요하면 가능한 빨리 알리고, 미처리 시 집행하려면 서면 통지가 중요합니다. Emergency repair 기한, Notice to remedy breach와 NTCAT 신청 순서를 현재 안내에서 확인하세요.",
    rulesLabel: "NT 수리·유지보수 안내",
    rulesHref: "https://nt.gov.au/property/private-renters/what-to-do-if-your-home-needs-repairs/repairs-and-maintenance-on-rented-properties",
    escalationLabel: "NT 세입자용 공식 통지 양식",
    escalationHref: "https://nt.gov.au/property/private-renters/renters-your-rights-and-responsibilities/notices-for-tenants-to-landlords",
  },
] as const;

export function RentalRepairJurisdictionPicker() {
  const [jurisdictionId, setJurisdictionId] = useState<(typeof jurisdictions)[number]["id"]>("NSW");
  const selected = jurisdictions.find((jurisdiction) => jurisdiction.id === jurisdictionId) ?? jurisdictions[0];

  return (
    <section className="mt-14 rounded-[2rem] border-2 border-navy/10 bg-[#e8efee] p-6 sm:p-8" aria-labelledby="rental-repair-jurisdiction-heading">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold-ink">주·준주별 공식 수리 경로</p>
      <h2 id="rental-repair-jurisdiction-heading" className="mt-2 text-2xl font-semibold leading-8 text-navy sm:text-3xl">
        집이 있는 지역을 고르고 현재 양식과 기한을 확인하세요
      </h2>
      <p className="mt-3 max-w-3xl text-sm leading-7 text-muted">
        일반 렌트, rooming·boarding·occupancy, 공공주택과 전대는 같은 지역에서도 절차가 다를 수 있습니다. 아래는 순위나 유료 추천이 아니라 각 정부기관의 공식 출발점입니다.
      </p>

      <div className="mt-6 max-w-sm">
        <label htmlFor="rental-repair-jurisdiction" className="block text-sm font-semibold text-navy">주·준주 선택</label>
        <select
          id="rental-repair-jurisdiction"
          value={jurisdictionId}
          onChange={(event) => setJurisdictionId(event.target.value as (typeof jurisdictions)[number]["id"])}
          className="mt-2 min-h-12 w-full rounded-xl border-2 border-navy bg-white px-4 py-3 text-base font-semibold text-navy focus:outline-none focus:ring-4 focus:ring-gold/30"
        >
          {jurisdictions.map((jurisdiction) => (
            <option key={jurisdiction.id} value={jurisdiction.id}>{jurisdiction.label}</option>
          ))}
        </select>
      </div>

      <article className="mt-5 overflow-hidden rounded-2xl border-2 border-navy/10 bg-white" aria-live="polite">
        <div className="border-b border-border bg-navy p-5 text-white sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gold">{selected.label} 공식 출발점</p>
          <h3 className="mt-2 text-xl font-semibold leading-7">수리 구분 → 서면 통지 → 공식 조정·명령</h3>
        </div>
        <div className="p-5 sm:p-6">
          <p className="text-sm leading-7 text-muted">{selected.summary}</p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <a href={selected.rulesHref} target="_blank" rel="noreferrer" className="inline-flex min-h-12 items-center justify-between rounded-xl bg-navy px-5 py-3 text-sm font-semibold text-white transition hover:bg-navy/90">
              {selected.rulesLabel} <span aria-hidden="true">↗</span>
            </a>
            <a href={selected.escalationHref} target="_blank" rel="noreferrer" className="inline-flex min-h-12 items-center justify-between rounded-xl border-2 border-navy px-5 py-3 text-sm font-semibold text-navy transition hover:border-gold hover:bg-surface">
              {selected.escalationLabel} <span aria-hidden="true">↗</span>
            </a>
          </div>
        </div>
      </article>

      <p className="mt-4 text-xs leading-6 text-muted">선택값이나 집 주소·수리 내용은 저장하거나 전송하지 않습니다. 양식 버전, 통지 방식, 계산하는 날짜, 비용 상한, 먼저 거쳐야 하는 조정 절차와 신청 수수료는 제출 직전에 원문에서 다시 확인하세요.</p>
    </section>
  );
}
