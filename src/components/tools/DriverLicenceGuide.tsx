"use client";

import { useState } from "react";

type LicenceRule = {
  id: string;
  short: string;
  name: string;
  timing: string;
  visitor: string;
  resident: string;
  korea: string;
  documents: string[];
  href: string;
  authority: string;
};

const rules: LicenceRule[] = [
  {
    id: "nsw",
    short: "NSW",
    name: "New South Wales",
    timing: "임시 비자 소지자는 입국일과 체류 기간에 따라 6개월 전환 규정이 적용될 수 있습니다.",
    visitor: "유효한 해외면허로 운전할 수 있는 기간이 입국일·비자 상태에 따라 달라집니다.",
    resident: "NSW 거주를 시작했다면 Service NSW의 현재 전환 자격과 기한을 먼저 확인하세요.",
    korea: "한국 면허의 시험 면제 여부는 나이·운전 경력과 최신 인정국가 제도에 따라 달라질 수 있습니다.",
    documents: ["한국 운전면허증 원본", "공인 영문 번역 또는 인정되는 영문 서류", "여권·비자와 NSW 주소 증빙"],
    href: "https://www.service.nsw.gov.au/services/convert-interstate-or-overseas-licence",
    authority: "Service NSW",
  },
  {
    id: "vic",
    short: "VIC",
    name: "Victoria",
    timing: "빅토리아에서 6개월 미만 운전할 때와 6개월 이상 거주할 때의 기준이 다릅니다.",
    visitor: "현재 해외면허가 유효하면 일반적으로 도착 후 6개월 미만 동안 사용할 수 있습니다.",
    resident: "6개월 이상 거주하거나 거주할 예정이면 빅토리아 면허로 전환해야 합니다.",
    korea: "국가·나이·운전 경력에 따라 지식시험, 위험인지시험 또는 실기시험이 요구될 수 있습니다.",
    documents: ["해외면허 원본", "영문이 아니면 공인 번역 또는 IDP", "신원·빅토리아 주소 증빙"],
    href: "https://www.vicroads.vic.gov.au/licences/new-to-victoria/convert-your-overseas-licence",
    authority: "VicRoads",
  },
  {
    id: "qld",
    short: "QLD",
    name: "Queensland",
    timing: "방문자·임시 비자와 영주권자·시민권자의 전환 시점이 서로 다릅니다.",
    visitor: "유효한 해외면허를 사용할 수 있지만 영문이 아니면 인정되는 번역을 함께 휴대해야 합니다.",
    resident: "영주권 또는 시민권을 취득하고 QLD에 거주하면 일반적으로 3개월 안에 전환해야 합니다.",
    korea: "시험 필요 여부는 신청 시점의 국가 인정 상태와 개인 조건을 공식 페이지에서 확인해야 합니다.",
    documents: ["유효한 해외면허", "공인 영문 번역", "신원·거주 및 비자 상태 증빙"],
    href: "https://www.qld.gov.au/transport/licensing/driver-licensing/overseas/driving",
    authority: "Queensland Government",
  },
  {
    id: "wa",
    short: "WA",
    name: "Western Australia",
    timing: "방문자와 WA로 이주한 사람을 구분하며, 이주한 경우 일반적으로 3개월 기준을 확인합니다.",
    visitor: "관광·유학·임시 근무 방문자는 유효한 해외면허를 계속 사용할 수 있는 경우가 있습니다.",
    resident: "WA로 이주한 시민권자·영주권자는 해외면허 사용 3개월 이내 전환을 준비해야 합니다.",
    korea: "과거의 Experienced Driver Recognition 제도가 종료되어 한국 면허의 시험 요건을 최신 조회기로 다시 확인해야 합니다.",
    documents: ["해외면허 원본", "승인된 영문 번역", "신원 증빙과 신청서"],
    href: "https://transport.wa.gov.au/licensing/drivers-licence/visit-move-wa",
    authority: "Transport WA",
  },
  {
    id: "sa",
    short: "SA",
    name: "South Australia",
    timing: "임시 방문자와 영주권자의 전환 의무가 다르며 2025년부터 일부 인정국가 규정이 바뀌었습니다.",
    visitor: "임시 비자 방문자는 유효한 해외면허와 필요한 영문 번역을 휴대해 운전할 수 있습니다.",
    resident: "영주권자가 되거나 해외면허가 만료되면 SA 면허 신청 조건을 확인해야 합니다.",
    korea: "2025년 5월 1일부터 한국 면허를 SA 면허로 전환할 때 추가 시험·교육이 필요할 수 있습니다.",
    documents: ["유효한 한국 면허", "IDP 또는 공인 영문 번역", "신원·비자·SA 주소 증빙"],
    href: "https://www.mylicence.sa.gov.au/my-car-licence/international-drivers",
    authority: "My Licence SA",
  },
  {
    id: "tas",
    short: "TAS",
    name: "Tasmania",
    timing: "거주 여부와 면허 발급 국가의 인정 상태에 따라 전환 절차와 시험이 달라집니다.",
    visitor: "유효한 해외면허 사용 조건과 체류 기간을 Tasmania Transport 안내에서 확인하세요.",
    resident: "Tasmania 거주자가 되면 현재 전환 시한과 준비 서류를 Service Tasmania에 확인해야 합니다.",
    korea: "한국은 현재 인정국가 목록에 포함되지 않을 수 있어 지식·위험인지·실기시험 가능성을 준비하는 편이 안전합니다.",
    documents: ["해외면허와 운전 경력 자료", "공인 영문 번역", "신원·Tasmania 거주 증빙"],
    href: "https://www.transport.tas.gov.au/licensing/interstate_or_overseas_licences/converting_an_overseas_licence",
    authority: "Transport Tasmania",
  },
  {
    id: "act",
    short: "ACT",
    name: "Australian Capital Territory",
    timing: "방문자와 ACT 거주자를 구분하며, 영주 비자 소지자는 일반적으로 3개월 기준이 적용됩니다.",
    visitor: "워홀·유학생 등 귀국 의사가 있는 방문자는 유효한 해외면허와 필요한 번역을 휴대합니다.",
    resident: "영주 비자 소지자는 ACT 거주 후 3개월 안에 ACT 면허를 받아야 합니다.",
    korea: "한국은 현재 ACT 인정국가 목록에 보이지 않으므로 시험과 임시면허 조건을 공식 안내에서 확인하세요.",
    documents: ["해외면허와 IDP 또는 공인 번역", "신원 증빙", "ACT 거주 증빙"],
    href: "https://www.accesscanberra.act.gov.au/driving-transport-and-parking/licences/drivers-with-licences-from-overseas",
    authority: "Access Canberra",
  },
  {
    id: "nt",
    short: "NT",
    name: "Northern Territory",
    timing: "NT에 계속 머무는 경우 해외면허 사용과 전환 모두 3개월 기준을 주의해야 합니다.",
    visitor: "현재 유효한 해외면허와 영문 번역 또는 IDP를 갖추고 최대 3개월까지 운전할 수 있습니다.",
    resident: "NT에 연속 3개월 넘게 머물면 NT 면허로 전환해야 합니다.",
    korea: "한국은 현재 무시험 전환 국가 목록에 보이지 않아 이론·실기시험 절차가 적용될 수 있습니다.",
    documents: ["해외면허 원본", "IDP 또는 공인 영문 번역", "신원·NT 거주 증빙"],
    href: "https://nt.gov.au/driving/licence/new-nt-residents-and-visitors/transfer-your-overseas-licence",
    authority: "NT Government",
  },
];

export function DriverLicenceGuide() {
  const [selectedId, setSelectedId] = useState(rules[0].id);
  const selected = rules.find((rule) => rule.id === selectedId) ?? rules[0];

  return (
    <section className="mt-10" aria-labelledby="state-licence-heading">
      <div className="border-y border-navy/20 bg-white">
        <div className="grid gap-6 px-5 py-6 sm:px-8 lg:grid-cols-[15rem_1fr] lg:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">State selector</p>
            <h2 id="state-licence-heading" className="mt-2 text-2xl font-semibold text-navy">거주할 주를 선택하세요</h2>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="주·준주 선택">
            {rules.map((rule) => (
              <button
                key={rule.id}
                type="button"
                role="tab"
                aria-selected={selected.id === rule.id}
                aria-controls="licence-rule-panel"
                onClick={() => setSelectedId(rule.id)}
                className={`min-h-11 min-w-16 shrink-0 border px-3 text-sm font-semibold transition ${selected.id === rule.id ? "border-navy bg-navy text-white" : "border-border bg-white text-navy hover:border-gold"}`}
              >
                {rule.short}
              </button>
            ))}
          </div>
        </div>

        <div id="licence-rule-panel" role="tabpanel" className="border-t border-navy/20 bg-surface px-5 py-7 sm:px-8 sm:py-9">
          <div className="flex flex-col gap-3 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between">
            <div><p className="font-mono text-sm text-gold">{selected.short}</p><h3 className="mt-1 text-2xl font-semibold text-navy sm:text-3xl">{selected.name}</h3></div>
            <p className="max-w-xl text-sm leading-6 text-muted">{selected.timing}</p>
          </div>
          <div className="grid gap-px bg-border sm:grid-cols-3">
            <article className="bg-white p-5"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-gold">방문·임시 체류</p><p className="mt-3 text-sm leading-6 text-muted">{selected.visitor}</p></article>
            <article className="bg-white p-5"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-gold">거주·영주권</p><p className="mt-3 text-sm leading-6 text-muted">{selected.resident}</p></article>
            <article className="bg-white p-5"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-gold">한국 면허 주의점</p><p className="mt-3 text-sm leading-6 text-muted">{selected.korea}</p></article>
          </div>
          <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
            <div><h4 className="font-semibold text-navy">기본 준비 서류</h4><ul className="mt-3 grid gap-2 text-sm text-muted sm:grid-cols-3">{selected.documents.map((document) => <li key={document} className="border-l-2 border-gold pl-3 leading-6">{document}</li>)}</ul></div>
            <a href={selected.href} target="_blank" rel="noreferrer" className="inline-flex min-h-12 items-center justify-center bg-navy px-5 text-sm font-semibold text-white hover:bg-navy-light">{selected.authority} 공식 안내 ↗</a>
          </div>
        </div>
      </div>
    </section>
  );
}
