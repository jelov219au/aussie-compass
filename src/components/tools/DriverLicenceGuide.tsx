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
  checkpoints?: string[];
  supportingSource?: { label: string; href: string };
};

const rules: LicenceRule[] = [
  {
    id: "nsw",
    short: "NSW",
    name: "New South Wales",
    timing: "2023년 7월 1일 이후 NSW에 도착한 임시 해외 방문자는 원칙적으로 6개월 기준을 먼저 확인합니다.",
    visitor: "임시 비자 소지자는 도착일, 비자 상태, 이전 NSW 체류에 따라 기한이 달라집니다. 2023년 7월 1일 전에 도착해 2025년 3월 1일 이후에도 남은 사람은 2025년 3월 1일 전에 전환해야 했으므로, 지금부터 6개월이 새로 시작한다고 보지 마세요.",
    resident: "호주 시민·영주권자는 NSW 거주 시작 후 일반적으로 3개월 안에 전환합니다. 뉴질랜드 운전면허 소지자도 별도의 해외면허 전환 경로에서 3개월 기준을 확인합니다. 뉴질랜드 시민권과 뉴질랜드 면허 소지는 서로 다른 조건입니다.",
    korea: "한국 면허의 시험 여부는 신청자의 나이·운전 경력·현재 인정 상태를 Service NSW 신청 단계에서 다시 확인합니다.",
    documents: ["한국 운전면허증 원본", "영문이 아니면 Transport for NSW 승인 기관의 번역과 해당 신청 경로의 원본 요건 확인", "여권·비자와 NSW 주소 증빙"],
    action: "NSW에 처음 생활하기 시작한 날짜와 비자 종류를 적은 뒤, 그 날짜를 기준으로 전환 마감일을 확인하세요.",
    href: "https://www.service.nsw.gov.au/transaction/apply-for-a-nsw-licence-as-a-temporary-overseas-visitor",
    authority: "Service NSW",
    checkpoints: ["면허 전환용 번역은 승인 기관에 한합니다. 공식 목록은 Multicultural NSW, Department of Home Affairs, 한국 면허용 시드니 한국 총영사관, 대만 면허용 Taipei Economic and Cultural Office입니다. 모든 NAATI 번역이 인정된다고 가정하지 마세요.", "임시 해외 방문자 신청 안내는 번역 원본 또는 JP가 인증한 사본을 요구합니다. 일반 해외면허 전환 안내는 번역 원본을 요구하며 복사본을 받지 않는다고 명시합니다. 본인이 사용할 신청 경로를 먼저 선택해 제출 형식을 확인하세요.", "여행 운전용 IDP와 NSW 면허 전환용 번역은 구별하세요. 한국 면허 번역을 맡기기 전에 승인 기관 여부와 제출 형식을 Service NSW에 확인하고 답변을 보관하세요."],
    supportingSource: { label: "Service NSW 일반 해외면허 전환·번역 요건", href: "https://www.service.nsw.gov.au/transaction/transfer-an-overseas-driver-licence" },
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
    checkpoints: ["6개월은 VIC에 처음 생활하기 시작한 날부터 셉니다. 잠시 출국하거나 다른 곳에 갔다가 돌아와도 처음부터 다시 세지 않습니다.", "영문이 아닌 면허는 인정되는 번역 또는 요건에 맞는 IDP를 원본 면허와 함께 준비하세요. IDP만으로 운전할 수 있는 것은 아닙니다."],
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
    korea: "한국 면허는 자동 무시험 전환으로 가정하지 마세요. 현재 공식 확인 절차에서 이론·위험인지·실기시험 경로를 확인해야 합니다.",
    documents: ["유효한 한국 면허 원본", "영문이 아니면 Service SA가 인정하는 공식 영문 번역", "신원·비자·SA 주소 증빙"],
    action: "본인의 공식 확인 결과가 시험 필요 경로라면 이론시험 후 3개월짜리 Temporary driving permit 안에 필요한 HPT·실기시험을 마치고, Certificate of competency와 원본 서류를 Service SA에 제출하는 순서를 확인하세요.",
    href: "https://www.sa.gov.au/topics/driving-and-transport/licences/interstate-and-overseas/overseas-licence-transfer",
    authority: "Service SA",
    checkpoints: ["면허 전환용 서류는 여행 중 운전 서류와 다릅니다. IDP만으로 번역 요건이 충족된다고 가정하지 마세요. NAATI 번역 원본 또는 QR 코드가 있는 NAATI 디지털 번역 등 공식 인정 형식을 확인하세요.", "현재 면허의 유효 상태·발급국·나이를 공식 Licence check에 선택해 본인에게 필요한 시험과 면허 단계를 확인하세요."],
    supportingSource: { label: "Service SA 전환 요건 확인", href: "https://www.sa.gov.au/topics/driving-and-transport/licences/interstate-and-overseas/overseas-licence-transfer/licence-check" },
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
    checkpoints: ["일반 P1 온라인 예약과 해외면허 전환 평가를 혼동하지 마세요. 다른 유형의 평가와 통역이 필요한 예약은 Service Tasmania에서 확인합니다.", "지식시험·HPT·실기평가 순서와 본인 면허 등급을 먼저 확인하세요. 해외 대형차·오토바이에 승용차 전환 규칙을 그대로 적용하지 않습니다."],
    supportingSource: { label: "Transport Tasmania 평가 예약 안내", href: "https://www.transport.tas.gov.au/licensing/driving_assessments" },
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
    korea: "한국은 현재 무시험 전환 인정국가 목록에 없어 이론·실기시험 절차를 준비해야 합니다.",
    documents: ["해외면허 원본", "IDP 또는 공인 영문 번역", "신원·NT 거주 증빙"],
    action: "MVR에 서류를 제출한 뒤 이론시험과 조건부 interim 면허, 실기시험 순서를 확인하세요.",
    href: "https://nt.gov.au/driving/licence/new-nt-residents-and-visitors/transfer-your-overseas-licence",
    authority: "NT Government",
    checkpoints: ["Class C interim 면허를 받았다고 혼자 운전할 수 있는 것은 아닙니다. 앞좌석에 Full NT 면허 소지자의 동승, 최고 80km/h, 혈중알코올농도 0 조건을 지켜야 합니다.", "신청 영수증·발급 면허에 적힌 운전 조건을 먼저 확인하세요. 임시·정식 NT 면허가 발급되면 예전 해외면허로 그 조건을 우회할 수 없습니다."],
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
              aria-controls="licence-rule-panel"
              onChange={(event) => setSelectedId(event.target.value)}
              className="min-h-12 w-full rounded-none border border-navy bg-white px-4 text-base font-semibold text-navy outline-none focus:border-gold focus:ring-2 focus:ring-gold/30"
            >
              {rules.map((rule) => <option key={rule.id} value={rule.id}>{rule.short} — {rule.name}</option>)}
            </select>
          </label>
        </div>

        <div id="licence-rule-panel" role="region" aria-label={`${selected.short} 면허 안내`} aria-live="polite" className="border-t border-navy/20 bg-surface px-5 py-7 sm:px-8 sm:py-9">
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
          {selected.checkpoints ? <aside className="mt-6 border-l-4 border-gold bg-white p-5">
            <h4 className="font-semibold text-navy">예약 전에 놓치기 쉬운 조건</h4>
            <ul className="mt-3 list-disc space-y-3 pl-5 text-sm leading-7 text-muted">{selected.checkpoints.map((checkpoint) => <li key={checkpoint}>{checkpoint}</li>)}</ul>
            {selected.supportingSource ? <a href={selected.supportingSource.href} target="_blank" rel="noreferrer" className="mt-3 inline-flex min-h-12 items-center font-semibold text-navy underline decoration-gold underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4">{selected.supportingSource.label} ↗</a> : null}
            <p className="mt-3 text-xs leading-6 text-muted">{selected.id === "nsw" ? "NSW 대상 구분·번역·경과조치 확인: 2026-09-05" : "이 추가 조건 확인: 2026-08-31"} · 위 공식 안내와 대조했습니다. 외부 페이지는 인터넷 연결이 필요하며, 예약일의 원문과 본인 면허 조건이 우선합니다.</p>
          </aside> : null}
        </div>
      </div>
    </section>
  );
}
