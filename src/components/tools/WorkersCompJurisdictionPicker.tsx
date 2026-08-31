"use client";

import { useState } from "react";

const jurisdictions = [
  {
    id: "NSW",
    label: "NSW",
    summary: "SIRA가 Workers compensation 제도를 감독하고 보험사가 Claim을 처리합니다. Injury를 고용주에게 알리고 Certificate of Capacity와 Claim 경로를 확인하세요. 2026년 7월 1일 이후 고용주에게 처음 알린 Primary psychological injury에는 새 규정이 적용될 수 있으며, Relevant conduct 관련 Claim은 완성된 Claim form이 필요합니다. 이전 통지·Secondary injury·면제 직군 등은 적용이 다르므로 SIRA의 최신 안내를 확인하세요.",
    claimLabel: "SIRA Claim 시작 안내",
    claimHref: "https://www.sira.nsw.gov.au/workers-compensation-claims-guide/understanding-the-claims-journey/making-a-claim",
    safetyLabel: "SafeWork NSW Incident 통지",
    safetyHref: "https://www.safework.nsw.gov.au/notify-safework",
    additionalLabel: "SIRA 정신적 상해: 새 규정·예외",
    additionalHref: "https://www.sira.nsw.gov.au/workers-compensation/psychological-injuries-for-workers-and-employers",
  },
  {
    id: "VIC",
    label: "VIC",
    summary: "WorkSafe Victoria의 Claim form과 Certificate of Capacity를 준비하고 고용주 또는 지정 경로로 제출합니다. 직장 Injury 기록과 Claim 접수는 같지 않으며, Notifiable incident의 법정 통지는 Employer·Self-employed person의 별도 의무일 수 있습니다.",
    claimLabel: "WorkSafe VIC Claim 안내",
    claimHref: "https://www.worksafe.vic.gov.au/what-do-when-youve-been-injured-work",
    safetyLabel: "WorkSafe VIC Incident 통지",
    safetyHref: "https://www.worksafe.vic.gov.au/report-incident",
  },
  {
    id: "QLD",
    label: "QLD",
    summary: "대부분은 WorkCover Queensland, Self-insured employer라면 그 고용주의 Workers compensation unit이 Claim을 처리합니다. Work capacity certificate와 Application for compensation이 모두 필요하며, 병원이 Certificate를 보내거나 고용주가 Injury report를 했다고 개인 Claim이 자동 시작되는 것은 아닙니다. 2026년 8월 10일부터 WorkCover는 별도 사이트와 전화 1300 927 928을 사용합니다. 안전 신고는 기존 WorkSafe 경로에서 확인하세요.",
    claimLabel: "QLD 보험사별 Claim 안내",
    claimHref: "https://www.worksafe.qld.gov.au/workers-compensation/compensation-claims/making-a-claim",
    safetyLabel: "QLD Incident·Notification 안내",
    safetyHref: "https://www.worksafe.qld.gov.au/safety-and-prevention/incidents-and-notifications",
    additionalLabel: "WorkCover 가입 사업장: 신청 방법",
    additionalHref: "https://www.workcoverqld.com.au/claims-and-payments/claims/how-to-make-a-claim",
  },
  {
    id: "WA",
    label: "WA",
    summary: "Doctor에게 First Certificate of Capacity를 받고 Workers Compensation Claim Form을 작성해 고용주에게 제출하는 흐름입니다. Claim은 WorkCover WA 제도, 심각한 Incident 통지는 WorkSafe WA 경로이므로 목적을 나눠 확인하세요.",
    claimLabel: "WorkCover WA Claim 안내",
    claimHref: "https://www.workcover.wa.gov.au/workers/understanding-your-rights-obligations-entitlements/making-a-claim/",
    safetyLabel: "WorkSafe WA Incident 통지",
    safetyHref: "https://www.worksafe.wa.gov.au/report-incident",
  },
  {
    id: "SA",
    label: "SA",
    summary: "고용주에게 즉시 알리고 Doctor의 Work Capacity Certificate를 준비하세요. 고용주가 시작할 수도 있지만 진행이 어렵다면 배정된 Claims agent에 직접 문의할 수 있습니다. Compensation Claim과 SafeWork SA의 Notifiable incident 통지는 별도입니다.",
    claimLabel: "ReturnToWorkSA Claim 안내",
    claimHref: "https://www.rtwsa.com/claims/when-an-injury-occurs/make-a-claim",
    safetyLabel: "SafeWork SA Incident 통지",
    safetyHref: "https://www.safework.sa.gov.au/notify/workplace-incident-notifications",
  },
  {
    id: "TAS",
    label: "TAS",
    summary: "고용주에게 Injury를 알리고 Doctor의 Workers Compensation Certificate of Capacity와 Claim Form을 함께 제출합니다. 공식 안내상 일반적인 Claim 기한은 부상 후 6개월이지만 퇴사를 결정했다면 퇴사 전에 제출해야 합니다. 질병·청력 손실 등 예외와 본인 기한은 WorkSafe Tasmania에 확인하세요. 고용주가 Form 제공을 막더라도 Claim 권리가 사라진다고 단정하지 마세요.",
    claimLabel: "WorkSafe TAS Claim 안내",
    claimHref: "https://www.worksafe.tas.gov.au/topics/compensation/workers-compensation/information-for-workers/how-to-make-a-workers-compensation-claim-as-worker",
    safetyLabel: "WorkSafe TAS Incident 통지",
    safetyHref: "https://incident.worksafe.tas.gov.au/",
  },
  {
    id: "ACT",
    label: "ACT",
    summary: "ACT Private sector는 Employer의 Insurer에 Claim하고, 일부 Commonwealth 고용은 Comcare 등 다른 Scheme일 수 있습니다. 고용주에게 신속히 알리고 Claim form과 Certificate of Capacity, 실제 고용 Scheme을 함께 확인하세요.",
    claimLabel: "WorkSafe ACT Claim 안내",
    claimHref: "https://www.worksafe.act.gov.au/workers-compensation/making-a-claim",
    safetyLabel: "WorkSafe ACT 통지 안내",
    safetyHref: "https://www.worksafe.act.gov.au/health-and-safety-portal/notify-worksafe",
  },
  {
    id: "NT",
    label: "NT",
    summary: "Workers compensation Claim Form을 작성해 고용주에게 제출하고 사본, Certificate of Capacity, Invoice와 Receipt를 보관하세요. 통근 중 Motor vehicle Injury처럼 다른 Scheme이 적용될 수 있는 예외는 NT WorkSafe 원문에서 확인해야 합니다.",
    claimLabel: "NT WorkSafe Claim 안내",
    claimHref: "https://worksafe.nt.gov.au/workers-compensation/injuries-and-claims",
    safetyLabel: "NT WorkSafe 통지 안내",
    safetyHref: "https://worksafe.nt.gov.au/notify-nt-worksafe",
  },
] as const;

export function WorkersCompJurisdictionPicker() {
  const [jurisdictionId, setJurisdictionId] = useState<(typeof jurisdictions)[number]["id"]>("NSW");
  const selected = jurisdictions.find((jurisdiction) => jurisdiction.id === jurisdictionId) ?? jurisdictions[0];

  return (
    <section className="mt-14 rounded-[2rem] border-2 border-navy/10 bg-[#f5efe1] p-6 sm:p-8" aria-labelledby="workers-comp-jurisdiction-heading">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold-ink">주·준주별 Claim·안전기관 출발점</p>
      <h2 id="workers-comp-jurisdiction-heading" className="mt-2 text-2xl font-semibold leading-8 text-navy sm:text-3xl sm:leading-10">
        다친 곳과 고용 Scheme을 확인한 뒤 공식 경로를 고르세요
      </h2>
      <p className="mt-3 max-w-3xl text-sm leading-7 text-muted">
        Australia에는 주·준주와 Commonwealth를 포함해 여러 Workers compensation Scheme이 있고 법·Form·기한이 서로 다릅니다. 아래는 자격 판정이나 법률 조언이 아니라 공식기관으로 가는 출발점입니다.
      </p>

      <div className="mt-6 max-w-sm">
        <label htmlFor="workers-comp-jurisdiction" className="block text-sm font-semibold text-navy">주·준주 선택</label>
        <select
          id="workers-comp-jurisdiction"
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
          <h3 className="mt-2 text-xl font-semibold leading-7">치료·기록 → Compensation Claim → 별도 안전 통지 확인</h3>
        </div>
        <div className="p-5 sm:p-6">
          <p className="text-sm leading-7 text-muted">{selected.summary}</p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <a href={selected.claimHref} target="_blank" rel="noreferrer" className="inline-flex min-h-12 items-center justify-between rounded-xl bg-navy px-5 py-3 text-sm font-semibold text-white transition hover:bg-navy/90">
              {selected.claimLabel} <span aria-hidden="true">↗</span>
            </a>
            <a href={selected.safetyHref} target="_blank" rel="noreferrer" className="inline-flex min-h-12 items-center justify-between rounded-xl border-2 border-navy px-5 py-3 text-sm font-semibold text-navy transition hover:border-gold hover:bg-surface">
              {selected.safetyLabel} <span aria-hidden="true">↗</span>
            </a>
          </div>
          {"additionalHref" in selected ? (
            <a href={selected.additionalHref} target="_blank" rel="noreferrer" className="mt-3 flex min-h-12 items-center justify-between rounded-xl border-2 border-navy px-5 py-3 text-sm font-semibold text-navy transition hover:border-gold hover:bg-surface">
              {selected.additionalLabel} <span aria-hidden="true">↗</span>
            </a>
          ) : null}
        </div>
      </article>

      <p className="mt-4 text-xs leading-6 text-muted">선택값이나 Injury·건강·고용정보는 저장하거나 전송하지 않습니다. Cross-border work, Labour hire, Self-insurer, Commonwealth employment, Contractor·Deemed worker, Journey claim과 Psychological injury는 적용 Scheme과 증빙이 달라질 수 있으므로 실제 제출 전에 공식기관에 확인하세요.</p>
    </section>
  );
}
