"use client";

import { useState } from "react";

const jurisdictions = [
  { id: "NSW", name: "New South Wales", authority: "NSW Government · Fair Trading", href: "https://www.nsw.gov.au/housing-and-construction/renting-a-place-to-live", focus: "Giving notice, Condition report, 청소·수리, Bond 환급과 분쟁 절차를 Ending a residential tenancy에서 확인하세요." },
  { id: "VIC", name: "Victoria", authority: "Consumer Affairs Victoria", href: "https://www.consumer.vic.gov.au/housing/renting", focus: "Moving out, giving notice and evictions에서 Notice·Break lease를, Rent·bond·bills에서 Bond와 Condition report를 확인하세요." },
  { id: "QLD", name: "Queensland", authority: "Residential Tenancies Authority", href: "https://www.rta.qld.gov.au/", focus: "Notice periods, Vacating a property, Bond refunds와 Dispute resolution을 계약 형태에 맞춰 확인하세요." },
  { id: "WA", name: "Western Australia", authority: "Consumer Protection WA", href: "https://www.consumerprotection.wa.gov.au/renting-home", focus: "Leaving a rental home, Bonds, Rental forms에서 종료 통지·최종 상태·Bond 청구 절차를 확인하세요." },
  { id: "SA", name: "South Australia", authority: "SA.GOV.AU · Consumer and Business Services", href: "https://www.sa.gov.au/topics/housing/renting-and-letting", focus: "End of tenancy와 공식 Forms에서 Notice·Final inspection·Bond 환급에 필요한 현재 양식을 확인하세요." },
  { id: "TAS", name: "Tasmania", authority: "Consumer, Building and Occupational Services", href: "https://www.cbos.tas.gov.au/topics/housing/renting", focus: "Ending a tenancy, Bond와 Condition report 규칙을 확인하고 MyBond 기록과 계약 형태를 맞추세요." },
  { id: "ACT", name: "Australian Capital Territory", authority: "Justice and Community Safety Directorate", href: "https://www.justice.act.gov.au/renting-and-occupancy-laws", focus: "Residential tenancy와 Occupancy agreement를 먼저 구분하고 종료·Bond·분쟁 경로를 해당 계약에 맞춰 확인하세요." },
  { id: "NT", name: "Northern Territory", authority: "NT Consumer Affairs", href: "https://consumeraffairs.nt.gov.au/for-consumers/residential-tenancies", focus: "Notice, Condition report, Security deposit와 분쟁 절차를 현재 NT Residential tenancies 안내와 양식에서 확인하세요." },
] as const;

export function MovingJurisdictionPicker() {
  const [selectedId, setSelectedId] = useState("");
  const selected = jurisdictions.find(({ id }) => id === selectedId);

  return <div className="mt-6">
    <label htmlFor="moving-jurisdiction" className="block max-w-md text-sm font-semibold text-navy">현재 집이 있는 주·준주</label>
    <select id="moving-jurisdiction" value={selectedId} onChange={(event) => setSelectedId(event.target.value)} className="mt-2 min-h-12 w-full max-w-md rounded-lg border border-border bg-white px-4 text-base text-navy outline-none focus:border-navy focus:ring-2 focus:ring-gold/40">
      <option value="">주·준주를 선택하세요</option>
      {jurisdictions.map(({ id, name }) => <option key={id} value={id}>{id} · {name}</option>)}
    </select>
    <div className="mt-4" aria-live="polite">
      {!selected ? <p className="rounded-2xl border border-dashed border-border bg-surface p-5 text-sm leading-6 text-muted">현재 집이 있는 지역을 선택하면 퇴거 통지, 최종 상태 기록과 Bond 환급의 공식 출발점을 보여드려요.</p> : <article className="rounded-2xl border border-border bg-white p-6">
        <p className="font-mono text-xs font-semibold text-gold-ink">{selected.id}</p>
        <h3 className="mt-2 text-lg font-semibold text-navy">{selected.authority}</h3>
        <p className="mt-3 text-sm leading-7 text-muted">{selected.focus}</p>
        <p className="mt-3 border-l-2 border-gold pl-3 text-xs leading-6 text-muted">Notice 기간과 양식은 Fixed-term·Periodic·Subletting·Rooming/Occupancy 등 계약 형태와 종료 사유에 따라 달라질 수 있습니다. 날짜를 정하기 전에 원문을 다시 확인하세요.</p>
        <a href={selected.href} target="_blank" rel="noreferrer" className="mt-5 inline-flex min-h-11 items-center text-sm font-semibold text-navy underline decoration-gold decoration-2 underline-offset-4">{selected.authority} 공식 안내 ↗</a>
      </article>}
    </div>
  </div>;
}
