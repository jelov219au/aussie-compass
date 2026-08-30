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
  action: string;
  href: string;
  authority: string;
};

const rules: LicenceRule[] = [
  {
    id: "nsw",
    short: "NSW",
    name: "New South Wales",
    timing: "2023년 7월 1일 이후 NSW에 도착한 임시 해외 방문자는 원칙적으로 6개월 기준을 먼저 확인합니다.",
    visitor: "임시 비자 소지자는 도착일, 비자 상태, 이전 NSW 체류에 따라 해외면허 사용 기한이 달라질 수 있습니다.",
    resident: "호주 시민·영주권자 또는 뉴질랜드 시민은 NSW 거주 시작 후 일반적으로 3개월 안에 전환합니다.",
    korea: "한국 면허의 시험 여부는 신청자의 나이·운전 경력·현재 인정 상태를 Service NSW 신청 단계에서 다시 확인합니다.",
    documents: ["한국 운전면허증 원본", "공인 영문 번역 또는 인정되는 영문 서류", "여권·비자와 NSW 주소 증빙"],
    action: "NSW에 처음 생활하기 시작한 날짜와 비자 종류를 적은 뒤, 그 날짜를 기준으로 전환 마감일을 확인하세요.",
    href: "https://www.service.nsw.gov.au/transaction/apply-for-a-nsw-licence-as-a-temporary-overseas-visitor",
    authority: "Service NSW",
  },
  {
    id: "vic",
    short: "VIC",
    name: "Victoria",
    timing: "Victoria에 생활하기 시작한 날부터 6개월이 핵심 기준입니다. 단기 여행일이 아니라 실제 거주 시작일을 기록하세요.",
    visitor: "Victoria에 6개월 미만 머무르고 면허가 유효하면 해외면허로 운전할 수 있는 경우가 있습니다.",
    resident: "6개월 넘게 생활할 계획이면 생활 시작일부터 6개월 안에 Victoria 면허로 전환해야 합니다.",
    korea: "국가·나이·운전 경력에 따라 지식시험, 위험인지시험 또는 실기시험이 요구될 수 있습니다.",
    documents: ["해외면허 원본", "영문이 아니면 공인 번역 또는 IDP", "신원·빅토리아 주소 증빙"],
    action: "VicRoads의 온라인 확인 절차에서 필요한 시험을 먼저 확인하고, 시험·예약 대기까지 감안해 일찍 시작하세요.",
    href: "https://www.vicroads.vic.gov.au/licences/convert-your-licence/convert-overseas-licence",
    authority: "VicRoads",
  },
  {
    id: "qld",
    short: "QLD",
    name: "Queensland",
    timing: "시민·영주권자·특별범주 비자 소지자는 Queensland에 3개월 거주한 시점이 핵심입니다.",
    visitor: "유효한 해외면허를 사용할 수 있지만 영문이 아니면 인정되는 번역을 함께 휴대해야 합니다.",
    resident: "해당 신분으로 Queensland에 3개월 거주하면 Queensland 면허로 전환해야 합니다.",
    korea: "Queensland의 현재 목록에서 한국은 비인정 국가로 분류되어 도로규칙 시험과 실기시험을 준비해야 합니다.",
    documents: ["유효한 해외면허", "공인 영문 번역", "신원·거주 및 비자 상태 증빙"],
    action: "실기시험에 불합격하면 해외면허 운전 권한이 철회될 수 있으므로 시험 전 공식 안내와 연습 계획을 확인하세요.",
    href: "https://www.qld.gov.au/transport/licensing/driver-licensing/overseas/transfer",
    authority: "Queensland Government",
  },
  {
    id: "wa",
    short: "WA",
    name: "Western Australia",
    timing: "방문자와 WA로 이주한 사람을 구분하며, 이주한 경우 일반적으로 3개월 기준을 확인합니다.",
    visitor: "관광·유학·임시 근무 방문자는 유효한 해외면허를 계속 사용할 수 있는 경우가 있습니다.",
    resident: "WA로 이주해 생활하는 사람은 도착 후 최대 3개월 안에 WA 면허 전환을 준비합니다.",
    korea: "과거 경력인정 제도에 기대지 말고, 한국 면허에 필요한 이론·위험인지·실기 요건을 현재 신청 절차에서 확인하세요.",
    documents: ["해외면허 원본", "승인된 영문 번역", "신원 증빙과 신청서"],
    action: "방문인지 이주인지 먼저 선택한 뒤 DoT Driver and Vehicle Services의 전환 단계와 예약 방식을 확인하세요.",
    href: "https://transport.wa.gov.au/licensing/drivers-licence/visit-move-wa",
    authority: "Transport WA",
  },
  {
    id: "sa",
    short: "SA",
    name: "South Australia",
    timing: "임시 방문자와 영주권자의 전환 의무가 다르며 2025년부터 일부 인정국가 규정이 바뀌었습니다.",
    visitor: "임시 비자 방문자는 유효한 해외면허와 필요한 영문 번역을 휴대해 운전할 수 있습니다.",
    resident: "영주권자 또는 시민권자가 SA에 거주하면 일반적으로 3개월 안에 SA 면허를 받아야 합니다.",
    korea: "2025년 5월 1일부터 한국은 자동 인정 대상에서 제외되어 이론·위험인지·실기 절차를 준비해야 합니다.",
    documents: ["유효한 한국 면허", "IDP 또는 공인 영문 번역", "신원·비자·SA 주소 증빙"],
    action: "Service SA에서 필요한 시험 순서와 비용을 확인하고, 실기는 VORT 또는 CBT&A 중 본인에게 맞는 경로를 비교하세요.",
    href: "https://www.sa.gov.au/topics/driving-and-transport/licences/interstate-and-overseas/overseas-licence-transfer",
    authority: "Service SA",
  },
  {
    id: "tas",
    short: "TAS",
    name: "Tasmania",
    timing: "방문·임시 비자와 영주 비자를 구분합니다. 영주 비자 발급 후 6개월이 지나면 해외면허 운전은 무면허가 될 수 있습니다.",
    visitor: "방문자 또는 임시 비자 소지자는 면허가 유효하고 필요한 번역을 휴대하면 운전할 수 있습니다.",
    resident: "영주 비자 발급 후 6개월 안에 전환하며, 필요하면 기한 전에 연장 신청 가능 여부를 확인합니다.",
    korea: "한국은 현재 인정국가 목록에 없어 지식시험·위험인지시험·해외면허 전환 실기평가가 필요합니다.",
    documents: ["해외면허와 운전 경력 자료", "공인 영문 번역", "신원·Tasmania 거주 증빙"],
    action: "해외면허 전환 평가는 온라인 예약 대상이 아닐 수 있으므로 Service Tasmania 방문 예약 방법을 먼저 확인하세요.",
    href: "https://www.transport.tas.gov.au/licensing/interstate_or_overseas_licences/converting_an_overseas_licence",
    authority: "Transport Tasmania",
  },
  {
    id: "act",
    short: "ACT",
    name: "Australian Capital Territory",
    timing: "귀국 의사가 있는 방문자와 ACT 거주자를 구분하며, 영주 비자 소지자는 3개월 기준을 지켜야 합니다.",
    visitor: "워홀·유학생 등 귀국 의사가 있는 방문자는 유효한 해외면허와 필요한 번역을 휴대합니다.",
    resident: "영주 비자 소지자는 ACT 거주 후 3개월 안에 ACT 면허를 받아야 합니다.",
    korea: "한국은 현재 ACT 인정국가 목록에 없어 사전 학습·도로규칙 시험·1회 실기평가와 provisional 면허 절차가 적용됩니다.",
    documents: ["해외면허와 IDP 또는 공인 번역", "신원 증빙", "ACT 거주 증빙"],
    action: "실기평가는 해외면허로 한 번만 시도할 수 있습니다. 불합격 뒤 learner 절차와 운전 제한을 시험 전에 확인하세요.",
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
    action: "MVR에 서류를 제출한 뒤 이론시험과 조건부 interim 면허, 실기시험 순서를 확인하세요.",
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
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">지역마다 규정이 달라요</p>
            <h2 id="state-licence-heading" className="mt-2 text-2xl font-semibold text-navy">생활할 주·준주를 골라보세요</h2>
          </div>
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-navy">주·준주 선택</span>
            <select
              value={selectedId}
              onChange={(event) => setSelectedId(event.target.value)}
              className="min-h-12 w-full rounded-none border border-navy bg-white px-4 text-base font-semibold text-navy outline-none focus:border-gold focus:ring-2 focus:ring-gold/30"
            >
              {rules.map((rule) => <option key={rule.id} value={rule.id}>{rule.short} — {rule.name}</option>)}
            </select>
          </label>
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
            <div><h4 className="font-semibold text-navy">기본 준비 서류</h4><ul className="mt-3 grid gap-2 text-sm text-muted sm:grid-cols-3">{selected.documents.map((document) => <li key={document} className="border-l-2 border-gold pl-3 leading-6">{document}</li>)}</ul><p className="mt-5 border border-gold/40 bg-gold/10 p-4 text-sm leading-6 text-navy"><strong>지금 할 일:</strong> {selected.action}</p></div>
            <a href={selected.href} target="_blank" rel="noreferrer" className="inline-flex min-h-12 items-center justify-center bg-navy px-5 text-sm font-semibold text-white hover:bg-navy-light">{selected.authority} 공식 안내 ↗</a>
          </div>
        </div>
      </div>
    </section>
  );
}
