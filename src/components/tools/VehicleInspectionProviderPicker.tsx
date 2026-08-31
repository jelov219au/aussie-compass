"use client";

import { useState } from "react";

type InspectionPathway = {
  region: string;
  name: string;
  provider: string;
  href: string;
  access: string;
  scope: string;
  caution?: string;
};

const inspectionPathways: readonly InspectionPathway[] = [
  {
    region: "NSW",
    name: "New South Wales",
    provider: "NRMA 안내 RedBook Inspect",
    href: "https://www.mynrma.com.au/cars-and-driving/vehicle-inspections",
    access: "Sydney·Newcastle·Central Coast 등 NRMA가 표시한 서비스 지역의 출장 검사, 그 밖의 지역은 Remote Video Assessment 가능 여부 확인",
    scope: "NRMA가 명시한 대로 visual and non-mechanical inspection입니다. 분해하지 않고 보이는 범위를 평가하므로 정비사 워크숍의 리프트·내부 기계 진단과 같지 않습니다.",
    caution: "현장 서비스 지역 밖의 원격 영상 평가는 판매자가 카메라로 보여주는 범위에 의존합니다. 리프트·하부·내부 기계 진단이 필요하면 별도의 현지 독립 정비사 워크숍을 찾으세요.",
  },
  {
    region: "VIC",
    name: "Victoria",
    provider: "RACV-Accredited Auto Care Centres",
    href: "https://www.racv.com.au/cars-transport/vehicle-maintenance/inspections.html",
    access: "Victoria 전역 50곳 이상의 제휴 센터에 직접 예약하는 워크숍 방식",
    scope: "Pre-purchase 검사는 부품의 외부 상태를 육안으로 확인하고, 수리 필요도를 Immediate · Early · Observation으로 구분합니다.",
  },
  {
    region: "QLD",
    name: "Queensland",
    provider: "RACQ Vehicle Inspections",
    href: "https://www.racq.com.au/car/vehicle-inspections",
    access: "Queensland 내 검사 지점 또는 서비스 가능 지역의 출장 검사",
    scope: "Mechanical과 Premium 등 상품별로 기계·외관 범위가 다릅니다. 지점 방문과 출장 모두 예약 화면에서 가능 여부를 확인하세요.",
  },
  {
    region: "WA",
    name: "Western Australia",
    provider: "RAC Vehicle Inspections",
    href: "https://rac.com.au/car-motoring/car-servicing-and-repair/vehicle-inspections",
    access: "Perth 광역권 RAC Auto Services 센터 또는 선택 지역 출장·딜러 방문",
    scope: "차종별 검사 범위가 다르며, 출장 점검은 안전하고 평평한 작업 공간이 필요합니다. EV 배터리 상태 검사는 별도 추가 항목입니다.",
  },
  {
    region: "SA",
    name: "South Australia",
    provider: "RAA Vehicle Inspections",
    href: "https://www.raa.com.au/motor/motoring-services/vehicle-inspections",
    access: "Adelaide West Croydon 워크숍, regional SA 승인 센터, 일부 출장 검사",
    scope: "Pre-purchase 상품별 보고·상담 범위가 다르고, 워크숍에서만 가능한 브레이크·정렬 장비 검사가 있을 수 있습니다.",
  },
  {
    region: "TAS",
    name: "Tasmania",
    provider: "RACT Vehicle Inspections",
    href: "https://www.ract.com.au/cars-and-driving/vehicle-inspections",
    access: "Hobart와 Launceston AutoServe 워크숍에 예약",
    scope: "기계·차량 이력·외관·하부·타이어·road test 항목을 안내합니다. 다른 지역은 해당 사업자에게 직접 가능 여부를 물어보세요.",
  },
  {
    region: "ACT",
    name: "Australian Capital Territory",
    provider: "NRMA 안내 RedBook Inspect",
    href: "https://www.mynrma.com.au/cars-and-driving/vehicle-inspections",
    access: "현재 NRMA 안내상 Remote Video Assessment 경로. 예약 전에 ACT 현장 출장 서비스 가능 여부를 다시 확인",
    scope: "NRMA가 명시한 대로 visual and non-mechanical inspection입니다. 분해하지 않고 보이는 범위를 평가하므로 정비사 워크숍의 리프트·내부 기계 진단과 같지 않습니다.",
    caution: "원격 영상 평가는 판매자가 카메라로 보여주는 범위에 의존합니다. 리프트·하부·내부 기계 진단이 필요하면 별도의 현지 독립 정비사 워크숍을 찾으세요.",
  },
  {
    region: "NT",
    name: "Northern Territory",
    provider: "AANT Approved Vehicle Inspection Centres",
    href: "https://www.aant.com.au/motoring/driving-and-maintenance/approved-repairers",
    access: "AANT 검색에서 Inspections를 선택해 승인 센터를 찾고 해당 센터에 직접 예약",
    scope: "Pre-purchase용 독립·비편향 보고서를 안내하지만, 센터별 위치·예약·세부 범위는 직접 확인해야 합니다.",
  },
];

export function VehicleInspectionProviderPicker() {
  const [selectedRegion, setSelectedRegion] = useState("");
  const selectedPathway = inspectionPathways.find(({ region }) => region === selectedRegion);

  return <div className="mt-6">
    <div className="max-w-md">
      <label htmlFor="inspection-region" className="block text-sm font-semibold text-navy">검사받을 주·준주</label>
      <select
        id="inspection-region"
        aria-controls="inspection-pathway"
        value={selectedRegion}
        onChange={(event) => setSelectedRegion(event.target.value)}
        className="mt-2 min-h-12 w-full rounded-lg border border-border bg-white px-4 text-base text-navy outline-none transition focus:border-navy focus:ring-2 focus:ring-gold/40"
      >
        <option value="">주·준주를 선택하세요</option>
        {inspectionPathways.map(({ region, name }) => <option key={region} value={region}>{region} · {name}</option>)}
      </select>
    </div>

    <div id="inspection-pathway" className="mt-4" aria-live="polite">
      {!selectedPathway ? <p className="rounded-2xl border border-dashed border-border bg-surface p-5 text-sm leading-6 text-muted">거주하거나 차량을 검사할 주·준주를 선택하면 공식 예약 출발점과 현재 안내 범위를 보여드려요.</p> : <article className={`rounded-2xl border p-6 ${selectedPathway.caution ? "border-amber-300 bg-amber-50" : "border-border bg-white"}`}>
        <div className="flex items-baseline justify-between gap-3">
          <p className="min-w-0 flex-1">
            <span className="font-mono text-xs font-semibold text-gold-ink">{selectedPathway.region}</span>
            <span className="mt-1 block break-words text-sm font-medium leading-6 text-navy">{selectedPathway.name}</span>
          </p>
          <span className="shrink-0 text-xs text-muted">공식 출처</span>
        </div>
        <h3 className="mt-2 text-lg font-semibold text-navy">{selectedPathway.provider}</h3>
        <dl className="mt-4 space-y-3 text-sm leading-6">
          <div><dt className="font-semibold text-navy">지역·방식</dt><dd className="text-muted">{selectedPathway.access}</dd></div>
          <div><dt className="font-semibold text-navy">현재 안내 범위</dt><dd className="text-muted">{selectedPathway.scope}</dd></div>
        </dl>
        {selectedPathway.caution ? <p className="mt-4 border-l-2 border-amber-400 pl-3 text-sm leading-6 text-amber-950"><strong>{selectedPathway.region}에서 특히 확인:</strong> {selectedPathway.caution}</p> : null}
        <a href={selectedPathway.href} target="_blank" rel="noreferrer" aria-describedby="inspection-return-help" className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-navy px-4 py-3 text-center text-sm font-semibold leading-6 text-white transition hover:bg-navy-light sm:w-auto">공식 검사·예약 안내 열기 <span aria-hidden="true">↗</span><span className="sr-only"> (새 창)</span></a>
        <p id="inspection-return-help" className="mt-3 text-sm leading-6 text-muted">인터넷 연결이 필요한 외부 사이트입니다. 새 탭이나 외부 브라우저에서 확인한 뒤, 이 탭 또는 Hoju Compass 앱으로 돌아오세요. 화면을 다시 불러오면 주·준주를 다시 선택해야 합니다.</p>
      </article>}
    </div>
  </div>;
}
