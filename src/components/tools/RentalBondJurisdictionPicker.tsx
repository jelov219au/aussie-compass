"use client";

import { useState } from "react";

const jurisdictions = [
  {
    id: "NSW",
    label: "NSW",
    summary: "Rental Bonds Online에서 세입자도 임대 종료 뒤 환급 청구를 시작할 수 있습니다. 상대가 공제를 청구하면 Notice of Claim의 14일 대응기간과 Condition Report·Quote·Invoice 제공 여부를 확인하고, 합의되지 않으면 NCAT 절차를 검토하세요.",
    exitLabel: "NSW 퇴거 체크리스트",
    exitHref: "https://www.nsw.gov.au/housing-and-construction/renting-a-place-to-live/ending-a-residential-tenancy/moving-out-of-a-rental-home",
    bondLabel: "NSW Bond 분쟁 대응",
    bondHref: "https://www.nsw.gov.au/housing-and-construction/renting-a-place-to-live/residential-rental-bonds/dealing-bond-disputes-for-tenants",
  },
  {
    id: "VIC",
    label: "VIC",
    summary: "임대 종료 뒤 Bond에 이름이 있는 Renter가 RTBA 청구를 먼저 시작할 수 있습니다. 다른 당사자는 통지를 받은 뒤 14일 안에 RDRV 또는 VCAT로 다툴 수 있고, Final inspection에는 참석하거나 합리적인 참석 기회를 받아야 합니다.",
    exitLabel: "VIC Condition·Final inspection",
    exitHref: "https://www.consumer.vic.gov.au/housing/renting/rent-bond-bills-and-condition-reports/condition-reports",
    bondLabel: "VIC RTBA Bond 청구",
    bondHref: "https://www.consumer.vic.gov.au/housing/renting/rent-bond-bills-and-condition-reports/bond/bond-claims-and-refunds",
  },
  {
    id: "QLD",
    label: "QLD",
    summary: "Tenancy end date 또는 Handover date 이후 Tenant나 Owner·Manager가 RTA Bond refund를 시작할 수 있습니다. 상대가 동의하지 않으면 정해진 응답기간 안에 Online dispute 또는 Form 16으로 무료 RTA 분쟁조정을 요청하고, 미해결 시 QCAT 기한을 확인하세요.",
    exitLabel: "QLD Ending a tenancy",
    exitHref: "https://www.rta.qld.gov.au/ending-a-tenancy/ending-a-tenancy-agreement",
    bondLabel: "QLD Online Bond refund",
    bondHref: "https://www.rta.qld.gov.au/rta-web-services/online-bond-refund",
  },
  {
    id: "WA",
    label: "WA",
    summary: "모두 퇴거하고 Final inspection과 Outgoing Property Condition Report를 받은 뒤 Security Bond Release를 진행하는 흐름입니다. 온라인 청구에 누군가 이의를 제기하거나 응답하지 않으면 Commissioner 결정으로 이어질 수 있고, 결정에 대한 Magistrates Court 기한도 짧으므로 통지를 바로 확인하세요.",
    exitLabel: "WA Leaving a rental home",
    exitHref: "https://www.consumerprotection.wa.gov.au/leaving-rental-home",
    bondLabel: "WA Bond dispute 안내",
    bondHref: "https://www.consumerprotection.wa.gov.au/bond-disputes-residential-tenancies",
  },
  {
    id: "SA",
    label: "SA",
    summary: "서면 종료 통지, Final inspection과 열쇠 반환 기록을 준비하세요. 퇴거 뒤 Residential Bonds Online에서 Tenant나 Managing party가 환급을 시작할 수 있고, 합의되지 않으면 Non-consented claim 절차를 확인합니다.",
    checkpoints: [
      "집주인·에이전트가 청구했다면 세입자는 통지에 적힌 마감일까지 승인·Counter-offer·SACAT 경로를 확인하세요. 무응답은 이의제기가 아닙니다.",
      "세입자가 상대 동의 없이 청구한 경우의 Managing party 14일 응답과, 세입자 본인의 응답기한을 혼동하지 마세요.",
    ],
    exitLabel: "SA Moving out checklist",
    exitHref: "https://www.sa.gov.au/topics/housing-and-property/renting-and-letting/renting-privately/ending-a-tenancy/moving-out",
    bondLabel: "SA Bond refund FAQ",
    bondHref: "https://www.cbs.sa.gov.au/sections/renting/bonds/bonds-faqs",
    additionalLabel: "SA 합의 없는 청구·Counter-offer",
    additionalHref: "https://www.cbs.sa.gov.au/sections/renting/bonds/settling-a-bond-dispute",
  },
  {
    id: "TAS",
    label: "TAS",
    summary: "모두 퇴거하고 열쇠를 돌려준 뒤 Owner·Agent의 MyBond 청구 시점을 확인하세요. Tenant도 조건을 충족하면 직접 청구할 수 있습니다. 청구 응답과 분쟁 증거 제출은 서로 다른 시계입니다.",
    checkpoints: [
      "청구 응답: Owner가 청구를 접수한 날부터 10일 안에 승인 또는 이의제기. 이메일을 늦게 읽었다고 시작일이 바뀌는 것으로 생각하지 마세요.",
      "분쟁 증거: 분쟁 통지를 받은 뒤 10 working days 안에 제출. 앞의 10일과 단위·시작 시점이 다릅니다.",
      "Commissioner 결정에 대한 불복은 별도 절차입니다. 위 기간을 불복기한으로 쓰지 말고 결정 통지의 법원·제출기한을 확인하세요.",
    ],
    exitLabel: "TAS MyBond 청구",
    exitHref: "https://www.cbos.tas.gov.au/topics/housing/renting/bonds/claiming-a-bond",
    bondLabel: "TAS Bond 이의 제기",
    bondHref: "https://www.cbos.tas.gov.au/topics/housing/renting/bonds/disputes-about-a-bond/disputing-a-bond-claim",
  },
  {
    id: "ACT",
    label: "ACT",
    summary: "Landlord와 Tenant가 함께 Final inspection을 하고 원래 Condition Report와 비교하는 것이 기본입니다. 임대 종료 뒤 누구나 ACT Revenue Office에 환급을 요청할 수 있으며, Landlord의 일부 청구에 동의하지 않으면 14일 응답기간 안에 이의를 제기해 ACAT 회부를 요청하세요.",
    exitLabel: "ACT Ending a tenancy",
    exitHref: "https://www.act.gov.au/housing-planning-and-property/renting/ending-a-tenancy",
    bondLabel: "ACT Renting Book 2026",
    bondHref: "https://www.act.gov.au/__data/assets/pdf_file/0006/2608620/Renting-Book-January-2026.pdf",
  },
  {
    id: "NT",
    label: "NT",
    summary: "Landlord가 Security deposit 일부를 보유하려면 퇴거 뒤 7 business days 안에 금액·이유와 Receipts·Invoice 등 근거를 통지해야 합니다. 미청구 금액의 반환과 NTCAT 분쟁 절차를 확인하세요.",
    checkpoints: [
      "7 business days는 집주인의 반환·보유 통지 의무에 관한 기한입니다. 세입자의 NTCAT 신청기한으로 바꿔 읽지 마세요.",
      "공제 근거에는 영수증·Invoice와 해당 보증금에 관한 것이라는 Statutory declaration이 필요합니다. 다투지 않는 잔액도 반환해야 합니다.",
      "RT06 종료 통지, RT12 미수령 Bond 청구와 NTCAT 분쟁 신청은 서로 다릅니다. 양식 목적과 실제 접수기관을 확인하세요.",
    ],
    exitLabel: "NT Tenant notices",
    exitHref: "https://nt.gov.au/property/private-renters/renters-your-rights-and-responsibilities/notices-for-tenants-to-landlords",
    bondLabel: "NT Security deposit disputes",
    bondHref: "https://nt.gov.au/property/private-renters/renters-your-rights-and-responsibilities/common-tenancy-disputes",
  },
] as const;

export function RentalBondJurisdictionPicker() {
  const [jurisdictionId, setJurisdictionId] = useState<(typeof jurisdictions)[number]["id"]>("NSW");
  const selected = jurisdictions.find((jurisdiction) => jurisdiction.id === jurisdictionId) ?? jurisdictions[0];

  return (
    <section className="mt-14 rounded-[2rem] border-2 border-navy/10 bg-[#f5efe1] p-6 sm:p-8" aria-labelledby="rental-bond-jurisdiction-heading">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold-ink">주·준주별 공식 퇴거·Bond 경로</p>
      <h2 id="rental-bond-jurisdiction-heading" className="mt-2 text-2xl font-semibold leading-8 text-navy sm:text-3xl sm:leading-10">
        집이 있는 지역을 고르고 통지·청구·이의제기 기한을 확인하세요
      </h2>
      <p className="mt-3 max-w-3xl text-sm leading-7 text-muted">
        Fixed term·Periodic·Break lease, Co-tenancy·Subtenancy·Rooming accommodation은 같은 지역에서도 절차가 다를 수 있습니다. 아래는 순위나 법률판정이 아니라 정부기관의 공식 출발점입니다.
      </p>

      <div className="mt-6 max-w-sm">
        <label htmlFor="rental-bond-jurisdiction" className="block text-sm font-semibold text-navy">주·준주 선택</label>
        <select
          id="rental-bond-jurisdiction"
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
          <h3 className="mt-2 text-xl font-semibold leading-7">종료 통지 → Final inspection → Bond 청구·분쟁</h3>
        </div>
        <div className="p-5 sm:p-6">
          <p className="text-sm leading-7 text-muted">{selected.summary}</p>
          {"checkpoints" in selected ? (
            <ul className="mt-4 list-disc space-y-3 pl-5 text-sm leading-7 text-navy">
              {selected.checkpoints.map((checkpoint) => <li key={checkpoint}>{checkpoint}</li>)}
            </ul>
          ) : null}
          {["SA", "TAS", "NT"].includes(selected.id) ? (
            <p className="mt-4 text-xs leading-6 text-muted">위 지역의 청구 경로·기한 구분 확인: 2026-08-31 · 실제 통지의 마감일과 현재 원문을 확인하세요.</p>
          ) : null}
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <a href={selected.exitHref} target="_blank" rel="noreferrer" className="inline-flex min-h-12 items-center justify-between rounded-xl bg-navy px-5 py-3 text-sm font-semibold text-white transition hover:bg-navy/90">
              {selected.exitLabel} <span aria-hidden="true">↗</span>
            </a>
            <a href={selected.bondHref} target="_blank" rel="noreferrer" className="inline-flex min-h-12 items-center justify-between rounded-xl border-2 border-navy px-5 py-3 text-sm font-semibold text-navy transition hover:border-gold hover:bg-surface">
              {selected.bondLabel} <span aria-hidden="true">↗</span>
            </a>
            {"additionalHref" in selected ? (
              <a href={selected.additionalHref} target="_blank" rel="noreferrer" className="inline-flex min-h-12 items-center justify-between rounded-xl border-2 border-navy px-5 py-3 text-sm font-semibold text-navy transition hover:border-gold hover:bg-surface sm:col-span-2">
                {selected.additionalLabel} <span aria-hidden="true">↗</span>
              </a>
            ) : null}
          </div>
        </div>
      </article>

      <p className="mt-4 text-xs leading-6 text-muted">선택값, 주소, Bond 번호나 분쟁 내용은 저장하거나 전송하지 않습니다. Form 버전, 통지 계산법, 상대 청구에 답할 기한, 조정 선행 여부와 Tribunal·Court 신청기한은 실제 제출 직전에 원문과 받은 공식 통지에서 다시 확인하세요.</p>
    </section>
  );
}
