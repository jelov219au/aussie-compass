"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Container } from "@/components/ui/Container";

type RegionId = "NSW" | "VIC" | "QLD" | "WA" | "SA" | "TAS" | "ACT" | "NT";

const regionStorageKey = "hoju-compass-region-v1";

const regions: Array<{
  id: RegionId;
  name: string;
  transport: string;
  transportHref: string;
  renting: string;
  rentingHref: string;
}> = [
  { id: "NSW", name: "New South Wales", transport: "Opal·교통", transportHref: "https://transportnsw.info/tickets-opal", renting: "렌트 규정", rentingHref: "https://www.nsw.gov.au/housing-and-construction/renting-a-place-to-live" },
  { id: "VIC", name: "Victoria", transport: "myki·교통", transportHref: "https://www.ptv.vic.gov.au/tickets/myki/", renting: "렌트 규정", rentingHref: "https://www.consumer.vic.gov.au/housing/renting" },
  { id: "QLD", name: "Queensland", transport: "Translink", transportHref: "https://translink.com.au/tickets-and-fares", renting: "렌트 규정", rentingHref: "https://www.rta.qld.gov.au/" },
  { id: "WA", name: "Western Australia", transport: "SmartRider", transportHref: "https://www.transperth.wa.gov.au/smartrider", renting: "렌트 규정", rentingHref: "https://www.consumerprotection.wa.gov.au/renting-home" },
  { id: "SA", name: "South Australia", transport: "Adelaide Metro", transportHref: "https://www.adelaidemetro.com.au/tickets-and-fares", renting: "렌트 규정", rentingHref: "https://www.sa.gov.au/topics/housing/renting-and-letting" },
  { id: "TAS", name: "Tasmania", transport: "Metro Tasmania", transportHref: "https://www.metrotas.com.au/fares/", renting: "렌트 규정", rentingHref: "https://www.cbos.tas.gov.au/topics/housing/renting" },
  { id: "ACT", name: "Australian Capital Territory", transport: "MyWay+", transportHref: "https://www.transport.act.gov.au/tickets-and-myway", renting: "렌트 규정", rentingHref: "https://www.justice.act.gov.au/renting-and-occupancy-laws" },
  { id: "NT", name: "Northern Territory", transport: "대중교통", transportHref: "https://nt.gov.au/driving/public-transport-cycling/public-buses", renting: "렌트 규정", rentingHref: "https://consumeraffairs.nt.gov.au/for-consumers/residential-tenancies" },
];

const starts = [
  { number: "01", href: "/arrival-checklist", label: "곧 출국하거나 막 도착했어요", detail: "비자·전화·은행·TFN", symbol: "→" },
  { number: "02", href: "/resume-builder", label: "일자리를 찾고 있어요", detail: "이력서·지원·Payslip", symbol: "↗" },
  { number: "03", href: "/property-inspection-checklist", label: "살 집을 알아보고 있어요", detail: "쉐어·렌트·생활권", symbol: "⌂" },
  { number: "04", href: "/salary-calculator", label: "생활비와 세금이 궁금해요", detail: "급여·예산·택스 리턴", symbol: "$" },
  { number: "05", href: "/leaving-australia-guide", label: "한국으로 돌아갈 준비를 해요", detail: "퇴거·계정·Super DASP", symbol: "✓" },
];

export function HomeStartSection() {
  const [regionId, setRegionId] = useState<RegionId>("NSW");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(regionStorageKey) as RegionId | null;
      if (saved && regions.some((region) => region.id === saved)) setRegionId(saved);
    } catch { /* Region preference is optional. */ }
  }, []);

  const selectRegion = (value: RegionId) => {
    setRegionId(value);
    try { localStorage.setItem(regionStorageKey, value); } catch { /* Region preference is optional. */ }
  };

  const region = regions.find((item) => item.id === regionId) ?? regions[0];

  return (
    <section className="border-b border-border bg-background py-14 sm:py-20" aria-labelledby="home-start-heading">
      <Container>
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 id="home-start-heading" className="text-2xl font-semibold tracking-tight text-navy sm:text-3xl">오늘은 어디에서 막혔나요?</h2>
            <p className="mt-2 text-sm leading-6 text-muted sm:text-base">가장 가까운 상황 하나만 골라도 괜찮아요. 필요한 도구로 바로 이어드릴게요.</p>
          </div>
          <label className="flex w-full items-center justify-between gap-3 rounded-xl border border-border bg-white px-4 py-3 text-sm sm:w-auto">
            <span className="font-medium text-muted">내가 있는 지역</span>
            <select value={regionId} onChange={(event) => selectRegion(event.target.value as RegionId)} className="min-h-8 bg-transparent font-semibold text-navy outline-none" aria-label="거주 주 또는 준주">
              {regions.map((item) => <option key={item.id} value={item.id}>{item.id}</option>)}
            </select>
          </label>
        </div>

        <ol className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-5">
          {starts.map((item) => (
            <li key={item.href} className="last:col-span-2 lg:last:col-span-1">
              <Link href={item.href} className="group flex h-full min-h-36 flex-col justify-between rounded-2xl border border-border bg-white p-4 transition hover:-translate-y-0.5 hover:border-navy/25 hover:shadow-[0_12px_30px_rgba(26,39,68,0.06)] sm:min-h-40 sm:p-5">
                <span className="flex items-center justify-between text-xs text-muted"><span>{item.number}</span><span className="text-lg text-gold" aria-hidden="true">{item.symbol}</span></span>
                <span className="mt-8"><strong className="block text-lg text-navy">{item.label}</strong><span className="mt-2 block text-sm leading-6 text-muted">{item.detail}</span></span>
              </Link>
            </li>
          ))}
        </ol>

        <div className="mt-4 flex flex-col gap-4 rounded-2xl border border-border bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div><strong className="text-sm text-navy">{region.id}에서 자주 찾는 정보</strong><span className="ml-2 text-xs text-muted">{region.name}</span></div>
          <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm font-semibold">
            <a href={region.transportHref} target="_blank" rel="noreferrer" className="inline-flex min-h-10 items-center text-navy hover:text-gold">{region.transport} ↗</a>
            <a href={region.rentingHref} target="_blank" rel="noreferrer" className="inline-flex min-h-10 items-center text-navy hover:text-gold">{region.renting} ↗</a>
            <Link href="/overseas-driver-licence-guide" className="inline-flex min-h-10 items-center text-navy hover:text-gold">해외면허 확인 →</Link>
          </div>
        </div>
      </Container>
    </section>
  );
}
