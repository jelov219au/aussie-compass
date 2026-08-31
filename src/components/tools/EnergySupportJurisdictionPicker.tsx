"use client";

import { useState } from "react";
import { actionClass } from "@/components/ui/actionStyles";

type JurisdictionId = "ACT" | "NSW" | "VIC" | "QLD" | "SA" | "TAS" | "WA" | "NT";

type JurisdictionGuide = {
  id: JurisdictionId;
  name: string;
  marketNote: string;
  compare: { label: string; href: string };
  support: { label: string; href: string };
  dispute: { label: string; href: string };
  checkpoints?: string[];
  scopeSource?: { label: string; href: string };
};

const guides: JurisdictionGuide[] = [
  { id: "ACT", name: "Australian Capital Territory", marketNote: "Energy Made Easy에서 주소 기준 Offer를 비교할 수 있어요. 해결되지 않은 Energy·Water 분쟁은 ACT에서 Ombudsman 역할을 하는 ACAT의 대상 범위를 확인하세요.", compare: { label: "Energy Made Easy", href: "https://www.energymadeeasy.gov.au/" }, support: { label: "Australian Government 고객 권리", href: "https://www.energy.gov.au/households/your-rights-energy-customer" }, dispute: { label: "ACAT Energy and Water cases", href: "https://www.acat.act.gov.au/case-types/energy-and-water-cases" } },
  { id: "NSW", name: "New South Wales", marketNote: "Energy Made Easy에서 시장 Offer를 비교하고, Bill·Payment 문제가 생기면 Retailer에 먼저 접수한 뒤 NSW 공식 도움 경로로 이어가세요.", compare: { label: "Energy Made Easy", href: "https://www.energymadeeasy.gov.au/" }, support: { label: "NSW Energy Bill 도움", href: "https://www.energy.nsw.gov.au/households/bills/help" }, dispute: { label: "NSW 전기·가스·수도 민원", href: "https://www.nsw.gov.au/departments-and-agencies/fair-trading/complaints-and-enquiries/utilities/electricity-gas-and-water" } },
  { id: "VIC", name: "Victoria", marketNote: "Victoria는 Victorian Energy Compare와 별도 Payment Difficulty Framework를 사용해요. Bill·Hardship·Disconnection 분쟁은 Retailer 접수 뒤 EWOV로 이어갈 수 있어요.", compare: { label: "Victorian Energy Compare", href: "https://compare.energy.vic.gov.au/start" }, support: { label: "Victoria Energy Bill 읽기·지원", href: "https://www.energy.vic.gov.au/households/help-paying-your-energy-bills/read-your-energy-bill" }, dispute: { label: "Energy and Water Ombudsman Victoria", href: "https://www.ewov.com.au/" } },
  { id: "QLD", name: "Queensland", marketNote: "Energy Made Easy는 Queensland Offer를 비교하지만 전기 Retailer 선택 범위는 지역에 따라 달라질 수 있어요. Retailer가 해결하지 못한 분쟁은 EWOQ 대상인지 확인하세요.", compare: { label: "Energy Made Easy", href: "https://www.energymadeeasy.gov.au/" }, support: { label: "Australian Government 고객 권리", href: "https://www.energy.gov.au/households/your-rights-energy-customer" }, dispute: { label: "Energy and Water Ombudsman Queensland", href: "https://www.ewoq.com.au/" } },
  { id: "SA", name: "South Australia", marketNote: "Energy Made Easy에서 시장 Offer와 예상 연간비용을 비교할 수 있어요. Retailer에 먼저 Complaint를 남기고 해결되지 않으면 EWOSA 범위를 확인하세요.", compare: { label: "Energy Made Easy", href: "https://www.energymadeeasy.gov.au/" }, support: { label: "Australian Government 고객 권리", href: "https://www.energy.gov.au/households/your-rights-energy-customer" }, dispute: { label: "Energy and Water Ombudsman SA", href: "https://ewosa.com.au/about-ewosa/contact-us" } },
  { id: "TAS", name: "Tasmania", marketNote: "Energy Made Easy에서 Tasmania Offer를 비교할 수 있어요. Retailer·Distributor와 해결되지 않은 Electricity·Gas 분쟁은 Ombudsman Tasmania - Energy 안내를 확인하세요.", compare: { label: "Energy Made Easy", href: "https://www.energymadeeasy.gov.au/" }, support: { label: "Australian Government 고객 권리", href: "https://www.energy.gov.au/households/your-rights-energy-customer" }, dispute: { label: "Ombudsman Tasmania - Energy", href: "https://www.ombudsman.tas.gov.au/complaints/referrals-to-other-organisations/power%2C-electricity-and-gas" } },
  { id: "WA", name: "Western Australia", marketNote: "WA 가정용 전기 가격은 주정부가 규제하는 구조가 있어 전국 시장 비교와 같지 않아요. 현재 Tariff·지원제도를 WA 공식 페이지에서 확인하세요.", compare: { label: "WA Household electricity pricing", href: "https://www.wa.gov.au/organisation/energy-policy-wa/household-electricity-pricing" }, support: { label: "WA Pricing and payment support", href: "https://www.wa.gov.au/organisation/energy-policy-wa/household-energy-pricing-and-payment-support" }, dispute: { label: "Energy and Water Ombudsman WA", href: "https://energyandwater.ombudsman.wa.gov.au/complaints/make-your-complaint" } },
  { id: "NT", name: "Northern Territory", marketNote: "NT는 지역에 따라 Retailer가 달라요. Power and Water는 전력망을 관리하지만 전기를 직접 판매하는 곳은 일부 Remote area예요. 청구서의 실제 Retailer에게 납부 지원을 요청하세요.", compare: { label: "NT Electricity retailers", href: "https://www.powerwater.com.au/about/regulation/electricity-network-regulation-and-pricing/electricity-retailers" }, support: { label: "NT 요금표 확인 · 지원 신청 아님", href: "https://www.powerwater.com.au/pricing" }, dispute: { label: "Ombudsman NT complaints", href: "https://ombudsman.nt.gov.au/complaints" }, checkpoints: ["Darwin·Katherine·Tennant Creek·Alice Springs의 전기 청구사는 Power and Water와 다를 수 있어요.", "Ombudsman NT는 관할 공공기관 목록에 Power and Water·Jacana Energy를 명시해요. 모든 민간 Retailer 민원을 받는 전국 창구로 생각하지 말고 대상 기관을 확인하세요.", "일반적으로 문제를 알게 된 뒤 12개월 이내 사안을 다루며 예외 심사가 있을 수 있어요. 공급자 답변을 기다리다 기한을 놓치지 않도록 접수 가능 여부를 문의하세요."], scopeSource: { label: "NT 대상 기관·관할 확인", href: "https://ombudsman.nt.gov.au/complaints/what-can-i-complaint-about" } },
];

export function EnergySupportJurisdictionPicker() {
  const [selectedId, setSelectedId] = useState<JurisdictionId>("NSW");
  const selected = guides.find((guide) => guide.id === selectedId) ?? guides[1];

  return (
    <div className="mt-6 rounded-2xl border border-border bg-white p-5 shadow-sm sm:p-7">
      <p className="mb-4 text-sm leading-7 text-muted">확인 2026-08-31 · AER의 소매 고객 보호·Hardship 기준은 ACT·NSW·QLD·SA·TAS에 적용돼요. VIC·WA·NT는 별도 체계이며, 아래에서 서비스 주소 기준으로 선택하세요. 외부 공식 링크는 인터넷 연결이 필요해요.</p>
      <label htmlFor="energy-jurisdiction" className="block text-sm font-semibold text-navy">현재 서비스 주소가 있는 주·준주</label>
      <select id="energy-jurisdiction" value={selectedId} onChange={(event) => setSelectedId(event.target.value as JurisdictionId)} className="mt-2 min-h-12 w-full rounded-xl border border-border bg-white px-4 py-3 text-base text-navy outline-none focus:border-navy focus:ring-2 focus:ring-navy/15 sm:max-w-sm">
        {guides.map((guide) => <option key={guide.id} value={guide.id}>{guide.id} · {guide.name}</option>)}
      </select>

      <article className="mt-5 rounded-2xl bg-surface p-5 sm:p-6" aria-live="polite">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gold-ink">{selected.id} 공식 출발점</p>
        <h3 className="mt-2 text-xl font-semibold text-navy">{selected.name}</h3>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-muted">{selected.marketNote}</p>
        {selected.checkpoints && <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-7 text-muted">{selected.checkpoints.map((point) => <li key={point}>{point}</li>)}</ul>}
        {selected.id === "VIC" && <p className="mt-4 text-sm leading-7 text-muted">Payment Difficulty Framework에 따른 감당 가능한 분할납부·납부 연장·지원금 자격을 Retailer에게 요청하세요. 청구서의 Best Offer는 그 회사의 제안이며 시장 전체 최저가를 뜻하지 않아요.</p>}
        {selected.id === "TAS" && <p className="mt-4 text-sm leading-7 text-muted">Energy Ombudsman 안내는 문제를 알게 된 뒤 2년 이내 민원 접수를 요구해요. 공급자에 먼저 알리되 기한이 가까우면 접수 가능 여부를 즉시 확인하세요.</p>}
        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <a href={selected.compare.href} target="_blank" rel="noreferrer" className={actionClass("primary")}>{selected.compare.label} ↗</a>
          <a href={selected.support.href} target="_blank" rel="noreferrer" className={actionClass("secondary")}>{selected.support.label} ↗</a>
          <a href={selected.dispute.href} target="_blank" rel="noreferrer" className={actionClass("tertiary")}>{selected.dispute.label} ↗</a>
          {selected.scopeSource && <a href={selected.scopeSource.href} target="_blank" rel="noreferrer" className={actionClass("tertiary")}>{selected.scopeSource.label} ↗</a>}
        </div>
      </article>

      <p className="mt-4 text-xs leading-5 text-muted">Retailer에 먼저 Complaint를 접수하고 번호·답변을 보관하세요. Embedded network, Landlord·Strata가 On-seller인 집과 Remote area는 비교·지원·Ombudsman 범위가 다를 수 있으므로 선택한 공식 페이지에서 대상 여부를 다시 확인하세요.</p>
    </div>
  );
}
