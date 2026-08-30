"use client";

import { useState } from "react";

type Jurisdiction = {
  id: string;
  name: string;
  authority: string;
  href: string;
  agreement: string;
  moveIn: string;
};

const jurisdictions: readonly Jurisdiction[] = [
  {
    id: "NSW",
    name: "New South Wales",
    authority: "NSW Government · Fair Trading",
    href: "https://www.nsw.gov.au/housing-and-construction/renting-a-place-to-live",
    agreement: "Residential tenancy인지 boarding·lodging·share arrangement인지 먼저 구분하고, 광고·신청·계약·허용되는 초기 비용 안내를 확인하세요.",
    moveIn: "Condition report, minimum standards와 Rental Bonds Online 경로를 계약 전에 확인하세요.",
  },
  {
    id: "VIC",
    name: "Victoria",
    authority: "Consumer Affairs Victoria",
    href: "https://www.consumer.vic.gov.au/housing/renting",
    agreement: "Rental agreement와 rooming house 등 거주 형태를 구분하고 Renters Guide의 신청·계약 단계를 확인하세요.",
    moveIn: "Rent, bond, bills and condition reports와 minimum standards 항목을 함께 확인하세요.",
  },
  {
    id: "QLD",
    name: "Queensland",
    authority: "Residential Tenancies Authority",
    href: "https://www.rta.qld.gov.au/",
    agreement: "General tenancy, rooming accommodation와 share-house 관계에 따라 적용 양식이 달라질 수 있어 계약 유형을 먼저 확인하세요.",
    moveIn: "Bond lodgement, entry condition report, utilities, locks and security의 현재 안내와 양식을 확인하세요.",
  },
  {
    id: "WA",
    name: "Western Australia",
    authority: "Consumer Protection WA",
    href: "https://www.consumerprotection.wa.gov.au/renting-home",
    agreement: "Starting a tenancy와 Sharing a rental home에서 계약 당사자·공동 거주·전대 관계를 확인하세요.",
    moveIn: "Bonds, property condition report와 현재 Rental forms를 송금·입주 전에 확인하세요.",
  },
  {
    id: "SA",
    name: "South Australia",
    authority: "SA.GOV.AU · Consumer and Business Services",
    href: "https://www.sa.gov.au/topics/housing/renting-and-letting",
    agreement: "Private rental인지 rooming·lodging·boarding인지 구분하고 Starting a tenancy 안내와 현재 양식을 확인하세요.",
    moveIn: "Bond, inspection sheet, rent·공과금과 입주 시 제공받아야 할 기록을 공식 안내에서 확인하세요.",
  },
  {
    id: "TAS",
    name: "Tasmania",
    authority: "Consumer, Building and Occupational Services",
    href: "https://www.cbos.tas.gov.au/topics/housing/renting",
    agreement: "Tenancy agreement, share houses·co-tenants·sub-letting 중 내 관계가 무엇인지 확인하세요.",
    moveIn: "MyBond 등록, condition report와 사진, 영수증·수리 요청 기록의 현재 절차를 확인하세요.",
  },
  {
    id: "ACT",
    name: "Australian Capital Territory",
    authority: "ACT Government · Starting a tenancy",
    href: "https://www.act.gov.au/housing-planning-and-property/renting/starting-a-tenancy",
    agreement: "Residential tenancy와 occupancy·share arrangement를 구분하고, 서명할 agreement와 초기 납부 조건을 확인하세요.",
    moveIn: "Bond lodgement, 열쇠, condition report와 The Renting Book의 현재 기한을 입주 전에 확인하세요.",
  },
  {
    id: "NT",
    name: "Northern Territory",
    authority: "NT Consumer Affairs",
    href: "https://consumeraffairs.nt.gov.au/for-consumers/residential-tenancies",
    agreement: "Residential tenancy인지 별도 accommodation arrangement인지 확인하고 현재 agreement·notice 양식을 사용하세요.",
    moveIn: "Security deposit, condition report, rent receipts와 수리·분쟁 경로를 공식 안내에서 확인하세요.",
  },
];

export function RentalJurisdictionPicker() {
  const [selectedId, setSelectedId] = useState("");
  const selected = jurisdictions.find(({ id }) => id === selectedId);

  return <div className="mt-6">
    <label htmlFor="rental-jurisdiction" className="block max-w-md text-sm font-semibold text-navy">집이 있는 주·준주</label>
    <select id="rental-jurisdiction" value={selectedId} onChange={(event) => setSelectedId(event.target.value)} className="mt-2 min-h-12 w-full max-w-md rounded-xl border-2 border-navy/15 bg-white px-4 text-base text-navy outline-none transition focus:border-navy focus:ring-2 focus:ring-gold/40">
      <option value="">주·준주를 선택하세요</option>
      {jurisdictions.map(({ id, name }) => <option key={id} value={id}>{id} · {name}</option>)}
    </select>
    <div className="mt-4" aria-live="polite">
      {!selected ? <p className="rounded-2xl border-2 border-dashed border-navy/15 bg-surface p-5 text-sm leading-7 text-muted">지역을 선택하면 해당 관할의 계약 유형, Bond와 Condition report 공식 출발점만 보여드려요.</p> : <article className="overflow-hidden rounded-3xl border-2 border-navy/10 bg-white shadow-[0_10px_28px_rgba(26,39,68,0.06)]">
        <div className="flex items-center justify-between gap-4 bg-[#e8efee] px-5 py-4 sm:px-6"><span className="font-mono text-sm font-semibold text-gold-ink">{selected.id}</span><span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-muted">공식 출처</span></div>
        <div className="p-5 sm:p-6"><h3 className="text-xl font-semibold text-navy">{selected.authority}</h3><dl className="mt-5 grid gap-4 md:grid-cols-2"><div className="rounded-2xl bg-surface p-4"><dt className="text-xs font-semibold uppercase tracking-[0.12em] text-gold-ink">계약 전에</dt><dd className="mt-2 text-sm leading-7 text-muted">{selected.agreement}</dd></div><div className="rounded-2xl bg-surface p-4"><dt className="text-xs font-semibold uppercase tracking-[0.12em] text-gold-ink">입주 전에</dt><dd className="mt-2 text-sm leading-7 text-muted">{selected.moveIn}</dd></div></dl><p className="mt-4 border-l-2 border-gold pl-3 text-xs leading-6 text-muted">규정·기한·양식은 주·준주와 계약 형태에 따라 달라지고 바뀔 수 있습니다. 서명하거나 송금하기 직전에 공식 원문을 다시 확인하세요.</p><a href={selected.href} target="_blank" rel="noreferrer" className="mt-5 inline-flex min-h-12 items-center justify-center rounded-xl border-2 border-navy bg-navy px-5 py-3 text-center text-sm font-semibold text-white hover:bg-navy-light">{selected.authority} 공식 안내 열기 ↗</a></div>
      </article>}
    </div>
  </div>;
}
