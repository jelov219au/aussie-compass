"use client";

import { useState } from "react";

const jurisdictions = [
  { id: "NSW", label: "NSW", name: "Health Care Complaints Commission", href: "https://www.hccc.nsw.gov.au/", phone: "(02) 9219 7444" },
  { id: "VIC", label: "VIC", name: "Health Complaints Commissioner", href: "https://www.hcc.vic.gov.au/", phone: "1300 582 113" },
  { id: "QLD", label: "QLD", name: "Office of the Health Ombudsman", href: "https://www.oho.qld.gov.au/", phone: "133 646" },
  { id: "WA", label: "WA", name: "Health and Disability Services Complaints Office", href: "https://www.hadsco.wa.gov.au/", phone: "1800 813 583" },
  { id: "SA", label: "SA", name: "Health and Community Services Complaints Commissioner", href: "https://www.hcscc.sa.gov.au/", phone: "1800 232 007" },
  { id: "TAS", label: "TAS", name: "Health Complaints Commissioner Tasmania", href: "https://www.healthcomplaints.tas.gov.au/", phone: "1800 001 170" },
  { id: "ACT", label: "ACT", name: "ACT Human Rights Commission", href: "https://www.hrc.act.gov.au/complaints", phone: "(02) 6205 2222" },
  { id: "NT", label: "NT", name: "Health and Community Services Complaints Commission", href: "https://hcscc.nt.gov.au/", phone: "1800 004 474" },
] as const;

export function HealthComplaintJurisdictionPicker() {
  const [jurisdictionId, setJurisdictionId] = useState<(typeof jurisdictions)[number]["id"]>("NSW");
  const selected = jurisdictions.find((jurisdiction) => jurisdiction.id === jurisdictionId) ?? jurisdictions[0];

  return (
    <section className="mt-14 rounded-[2rem] border-2 border-navy/10 bg-[#f7f0d9] p-6 sm:p-8" aria-labelledby="health-complaint-jurisdiction-heading">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold-ink">진료·의료서비스 민원</p>
      <h2 id="health-complaint-jurisdiction-heading" className="mt-2 text-2xl font-semibold leading-8 text-navy sm:text-3xl sm:leading-10">
        진료를 받은 주·준주의 공식 창구를 확인하세요
      </h2>
      <p className="mt-3 max-w-3xl text-sm leading-7 text-muted">
        안전하고 가능한 경우에는 먼저 Clinic·Hospital의 공식 민원 절차로 사실, 날짜와 원하는 해결을 남기세요. 해결되지 않거나 직접 접촉하기 어려우면 아래에서 진료를 받은 지역을 고르세요.
      </p>

      <div className="mt-6 max-w-sm">
        <label htmlFor="health-complaint-jurisdiction" className="block text-sm font-semibold text-navy">진료받은 주·준주 선택</label>
        <select
          id="health-complaint-jurisdiction"
          value={jurisdictionId}
          onChange={(event) => setJurisdictionId(event.target.value as (typeof jurisdictions)[number]["id"])}
          className="mt-2 min-h-12 w-full rounded-xl border-2 border-navy bg-white px-4 py-3 text-base font-semibold text-navy focus:outline-none focus:ring-4 focus:ring-gold/30"
        >
          {jurisdictions.map((jurisdiction) => (
            <option key={jurisdiction.id} value={jurisdiction.id}>{jurisdiction.label}</option>
          ))}
        </select>
      </div>

      <article className="mt-5 rounded-2xl border-2 border-navy/10 bg-white p-5 sm:p-6" aria-live="polite">
        <p className="text-xs font-semibold text-gold-ink">{selected.label} 공식 의료 민원기관</p>
        <h3 className="mt-2 text-xl font-semibold leading-7 text-navy">{selected.name}</h3>
        <p className="mt-2 text-sm leading-7 text-muted">전화 {selected.phone} · 접수 범위, 기한, 먼저 제공자에게 연락해야 하는지는 기관 안내에서 다시 확인하세요.</p>
        <a href={selected.href} target="_blank" rel="noreferrer" className="mt-4 inline-flex min-h-11 items-center rounded-full bg-navy px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-navy/90">
          {selected.label} 공식 민원 안내 열기 <span className="ml-2" aria-hidden="true">↗</span>
        </a>
      </article>

      <aside className="mt-4 rounded-2xl border border-navy/15 bg-white p-5 sm:p-6" aria-labelledby="health-insurance-complaints-heading">
        <h3 id="health-insurance-complaints-heading" className="text-lg font-semibold leading-7 text-navy">보험 청구 문제는 별도 창구를 확인하세요</h3>
        <p className="mt-2 text-sm leading-7 text-muted">보험 급여·회원·OSHC/OVHC 문제는 먼저 보험사에 접수하세요. 호주 등록 보험사(Australian registered insurer)와 해결되지 않은 문제라면 Private Health Insurance Ombudsman의 접수 범위를 확인할 수 있습니다.</p>
        <p className="mt-2 text-sm leading-7 text-muted">해외 미등록 보험사·여행보험과 임상 진료의 질 자체는 이 보험 민원 창구의 대상이 아닙니다.</p>
        <a href="https://www.ombudsman.gov.au/complaints/private-health-insurance-complaints" target="_blank" rel="noreferrer" className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-xl border-2 border-navy px-4 py-2 text-sm font-semibold text-navy transition hover:bg-surface">
          보험 민원 접수 범위 확인 <span aria-hidden="true">↗</span>
        </a>
      </aside>
      <p className="mt-4 text-xs leading-6 text-muted">선택값과 건강정보는 저장하거나 전송하지 않습니다. 주를 넘나드는 진료·Telehealth 등 관할이 불분명하면 기관에 먼저 확인하세요.</p>
    </section>
  );
}
