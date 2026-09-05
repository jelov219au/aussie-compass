import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Container } from "@/components/ui/Container";
import { CommuteHousingPlanner } from "@/components/tools/CommuteHousingPlanner";
import { BreadcrumbJsonLd } from "@/components/seo/JsonLd";
import { createPageMetadata } from "@/lib/site";

export const metadata = createPageMetadata({ title: "호주 대중교통·통학 생활권 비교 | Hoju Compass", description: "집 후보의 주거비와 통학시간을 비교하고 Google Maps 대중교통 길찾기, 주별 교통기관과 학생 할인 정보를 확인하세요.", path: "/public-transport-guide" });

const transportLinks = [
  ["NSW", "Opal · Transport for NSW", "https://transportnsw.info/tickets-fares"],
  ["VIC", "myki · Transport Victoria", "https://www.ptv.vic.gov.au/tickets/myki/"],
  ["QLD", "Translink", "https://translink.com.au/tickets-and-fares"],
  ["WA", "SmartRider · Transperth", "https://www.transperth.wa.gov.au/smartrider"],
  ["SA", "Adelaide Metro", "https://www.adelaidemetro.com.au/tickets-and-fares"],
  ["TAS", "Metro Tasmania", "https://www.metrotas.com.au/fares/"],
  ["ACT", "MyWay+ · Transport Canberra", "https://www.transport.act.gov.au/tickets-and-myway"],
  ["NT", "Darwin·Palmerston·Alice Springs 버스", "https://nt.gov.au/driving/public-transport-cycling/public-buses"],
];

const safetyLinks = [
  ["NSW", "BOCSAR Crime and policing", "https://bocsar.nsw.gov.au/statistics-dashboards/crime-and-policing.html"],
  ["VIC", "Crime Statistics Agency", "https://www.crimestatistics.vic.gov.au/crime-statistics/latest-crime-data-by-area"],
  ["QLD", "Queensland Police crime map", "https://qps-ocm.s3-ap-southeast-2.amazonaws.com/index.html"],
  ["WA", "WA Police crime statistics", "https://www.wa.gov.au/organisation/western-australia-police-force/crime-statistics"],
  ["SA", "SA Police crime statistics", "https://www.police.sa.gov.au/about-us/crime-statistics-map"],
  ["TAS", "Tasmania Police 통계·대시보드", "https://www.police.tas.gov.au/about-us/our-performance/"],
  ["ACT", "ACT Policing crime statistics", "https://police.act.gov.au/crime-statistics"],
  ["NT", "NT Police crime statistics", "https://pfes.nt.gov.au/police/community-safety/nt-crime-statistics"],
];

export default function PublicTransportGuidePage() { return <><BreadcrumbJsonLd items={[{ name: "홈", path: "/" }, { name: "대중교통·생활권 비교", path: "/public-transport-guide" }]} /><Header /><main className="py-12 sm:py-16"><Container>
  <Link href="/tools" className="inline-flex min-h-11 items-center text-sm font-medium text-muted hover:text-navy">&larr; 도구 목록으로 돌아가기</Link>
  <div className="mt-5 max-w-4xl"><p className="text-sm font-semibold uppercase tracking-[0.16em] text-gold">차 없이 시작하는 호주 생활</p><h1 className="mt-3 text-3xl font-semibold tracking-tight text-navy sm:text-4xl">싼 방보다, 매일 감당할 수 있는 생활권을 찾으세요</h1><p className="mt-4 text-base leading-7 text-muted sm:text-lg">학교·직장까지 걸리는 시간과 주거비를 후보별로 비교하고, 실제 대중교통 경로와 주변 생활시설을 Google Maps에서 확인하세요. 특히 교환학생과 유학생은 막차, 환승, 캠퍼스 간 이동까지 평일과 주말에 각각 확인하는 것이 좋습니다.</p></div>
  <div className="my-8 grid gap-4 md:grid-cols-3"><article className="rounded-2xl border border-gold/40 bg-gold/5 p-5"><h2 className="font-semibold text-navy">출발 시각을 바꿔 확인</h2><p className="mt-2 text-sm leading-6 text-muted">오전 수업, 저녁 아르바이트, 주말 귀가처럼 실제 이동 시각별 환승과 막차를 확인하세요.</p></article><article className="rounded-2xl border border-border bg-white p-5"><h2 className="font-semibold text-navy">Door-to-door로 비교</h2><p className="mt-2 text-sm leading-6 text-muted">차량 탑승시간뿐 아니라 정류장까지 도보, 대기, 환승과 캠퍼스 내부 이동을 포함하세요.</p></article><article className="rounded-2xl border border-border bg-white p-5"><h2 className="font-semibold text-navy">할인은 자격부터 확인</h2><p className="mt-2 text-sm leading-6 text-muted">국제학생 교통 할인은 주와 과정에 따라 다르므로 학교 안내와 교통기관 공식 자격을 함께 확인하세요.</p></article></div>
  <CommuteHousingPlanner />
  <section className="mt-8 rounded-2xl border border-border bg-white p-5 sm:p-8" aria-labelledby="commute-example-heading">
    <h2 id="commute-example-heading" className="text-2xl font-semibold text-navy">주세 A$50 차이, 통학시간은 얼마나 달라질까요?</h2>
    <p className="mt-3 text-sm leading-7 text-muted">아래는 실제 매물이나 요금이 아닌 가상 비교입니다. 두 집 모두 집 문부터 목적지까지 도보·대기·환승을 포함한 편도 시간을 기록했다고 가정합니다.</p>
    <div className="mt-5 overflow-x-auto rounded-xl border border-border" role="region" aria-label="가상 주거비와 통학시간 비교 표" tabIndex={0}>
      <table className="w-full min-w-[28rem] text-left text-sm leading-6"><thead className="bg-surface text-navy"><tr>{["비교", "후보 A", "후보 B"].map((heading) => <th scope="col" key={heading} className="p-4">{heading}</th>)}</tr></thead><tbody>{[["주세", "A$290", "A$340"], ["편도 전체시간", "60분", "25분"], ["주5일 왕복 통학", "10시간", "4시간10분"], ["아직 더 확인할 비용", "공과금·교통비·이사비", "공과금·교통비·이사비"]].map(([label, a, b]) => <tr key={label} className="border-t border-border"><th scope="row" className="p-4 text-navy">{label}</th><td className="p-4 text-muted">{a}</td><td className="p-4 text-muted">{b}</td></tr>)}</tbody></table>
    </div>
    <p className="mt-5 text-sm leading-7 text-muted">A는 주세가 A$50 낮지만 같은 주5일 일정에서 이동에 5시간50분을 더 씁니다. 이 차이를 보고 무조건 B를 고를 필요는 없습니다. 주2일만 나가는지, 늦은 근무 뒤에도 같은 경로가 있는지, 집에서 절약한 비용이 교통비로 다시 나가는지를 확인하세요. 주세와 시간만으로 전체 생활비나 안전을 확정하지 않습니다.</p>
    <h3 className="mt-7 text-xl font-semibold text-navy">매물을 예약하기 전에 같은 조건으로 3번 확인하세요</h3>
    <ol className="mt-4 list-decimal space-y-3 pl-5 text-sm leading-7 text-muted"><li>평일 실제 도착시간: 수업·근무 시작 전에 목적지에 도착하도록 경로를 찾고 도보·환승까지 적습니다.</li><li>가장 늦게 끝나는 날: 막차가 끊긴 뒤에도 돌아갈 대안이 있는지 확인하고 추가비용이 미확정이면 ‘확인 필요’로 표시합니다.</li><li>주말·철도작업일: 같은 경로라고 가정하지 말고 공식 교통기관의 해당 날짜 공지와 대체교통을 확인합니다.</li></ol>
    <p className="mt-5 text-sm leading-7 text-muted">후보별로 확인 날짜·출발/도착 조건·예상 편도·갈아타는 횟수·확인할 한 가지를 메모하세요. 예: ‘금요일 22시 퇴근 / 역에서 집까지 10분 / 마지막 버스 연결 확인 필요’. 실제 집 주소를 공개 메모나 링크에 불필요하게 넣지 않습니다.</p>
  </section>
  <section className="mt-6 grid gap-4 border border-border bg-white p-5 sm:grid-cols-[1fr_auto] sm:items-center"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-gold">저장해서 다시 확인</p><h2 className="mt-1 text-xl font-semibold text-navy">자주 쓰는 역의 철도 작업 확인 순서를 저장하세요.</h2><p className="mt-2 text-sm leading-6 text-muted">정확한 주소 없이 동네·역을 저장하고 지도, 공식 작업 공지, 대체 이동 체크리스트를 반복해서 확인합니다.</p></div><Link href="/rail-work-alerts" className="inline-flex min-h-12 items-center justify-center bg-navy px-5 text-sm font-semibold text-white">철도 작업 확인 지역 저장 →</Link></section>

  <section className="mt-10 rounded-3xl border border-border bg-surface p-6 sm:p-8"><h2 className="text-2xl font-semibold text-navy">학생이 집 후보를 볼 때 확인할 것</h2><div className="mt-6 grid gap-5 md:grid-cols-2"><article className="rounded-2xl bg-white p-5"><h3 className="font-semibold text-navy">통학과 주거비</h3><ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-muted"><li>주세 외 전기·가스·인터넷·세탁비 포함 여부</li><li>주 2회와 주 5회 등 실제 등교 빈도</li><li>캠퍼스가 여러 곳이면 수업 장소별 경로</li><li>늦은 수업 뒤 막차와 야간 도보 구간</li></ul></article><article className="rounded-2xl bg-white p-5"><h3 className="font-semibold text-navy">생활과 커뮤니티</h3><ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-muted"><li>슈퍼마켓·GP·약국·도서관 접근성</li><li>한국 식료품점 등 본인에게 필요한 시설</li><li>야간 조명과 역·정류장에서 집까지 동선</li><li>침수·산불 등 지역별 재난 정보</li></ul></article></div><div className="mt-5 flex flex-wrap gap-3"><a href="https://costofliving.studyaustralia.gov.au/" target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center rounded-lg bg-navy px-4 text-sm font-semibold text-white">Study Australia 생활비 계산기 ↗</a><Link href="/property-inspection-checklist" className="inline-flex min-h-11 items-center rounded-lg border border-navy px-4 text-sm font-semibold text-navy">집 방문 체크리스트 &rarr;</Link></div></section>

  <section className="mt-10" aria-labelledby="transport-links"><h2 id="transport-links" className="text-2xl font-semibold text-navy">주·준주별 공식 교통기관 링크</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-muted">카드, 비접촉 결제, 요금 상한과 학생 할인은 바뀔 수 있습니다. Hoju Compass가 요금 데이터를 옮겨 표시하는 목록이 아니므로 거주 지역의 공식 페이지에서 원본 갱신 시각과 최신 내용을 확인하세요.</p><ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{transportLinks.map(([state, label, href]) => <li key={state}><a href={href} target="_blank" rel="noreferrer" className="flex h-full min-h-24 flex-col justify-between rounded-xl border border-border bg-white p-4 text-sm font-semibold text-navy transition hover:border-gold"><span className="text-xs text-gold">{state}</span><span>{label} ↗</span></a></li>)}</ul></section>

  <aside className="mt-5 border-l-4 border-gold bg-surface p-5 text-sm leading-7 text-muted"><h3 className="font-semibold text-navy">VIC에서는 결제 수단과 할인 자격을 따로 확인하세요</h3><p className="mt-2">2026-08-31 확인한 Transport Victoria 안내에서 Visa·Mastercard 비접촉 결제는 Full fare용입니다. Concession 대상자는 myki를 계속 사용하고, V/Line의 단계적 도입 여부와 실제 탑승 노선도 확인하세요. 실물 카드와 휴대폰·시계를 섞지 말고 같은 수단으로 Tap on/off하세요.</p><a href="https://transport.vic.gov.au/tickets-and-payments/contactless" target="_blank" rel="noreferrer" className="mt-3 inline-flex min-h-12 items-center font-semibold text-navy underline decoration-gold underline-offset-4">Transport Victoria 비접촉 결제 범위 확인 ↗</a></aside>

  <section className="mt-8 border border-border bg-white p-6 sm:p-8" aria-labelledby="data-trust-heading"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">외부 링크 전용 · 데이터 미수집</p><h2 id="data-trust-heading" className="mt-2 text-2xl font-semibold text-navy">공식 출처와 Hoju Compass 해석을 구분합니다.</h2><div className="mt-5 grid gap-5 text-sm leading-7 text-muted md:grid-cols-3"><div><h3 className="font-semibold text-navy">출처·갱신 시각</h3><p className="mt-1">각 링크는 해당 교통기관·정부 원문으로 이동합니다. Hoju Compass에는 복사한 원본 갱신 시각이 없으며 최신 여부는 링크된 페이지에서 확인합니다.</p></div><div><h3 className="font-semibold text-navy">라이선스·귀속</h3><p className="mt-1">현재 시간표·요금·정류장·범죄 통계 데이터셋을 복사·재게시하지 않습니다. 향후 데이터를 사용한다면 데이터셋별 라이선스와 기관 귀속을 값과 함께 표시합니다.</p></div><div><h3 className="font-semibold text-navy">계산·오류 상태</h3><p className="mt-1">비교 결과는 사용자가 입력한 값에 대한 Hoju Compass 해석이며 공식 앱·제휴·보증을 뜻하지 않습니다. 원문이 오래됐거나 열리지 않거나 내용이 다르면 그 값을 추정하지 마세요.</p></div></div><Link href="/contact" className="mt-5 inline-flex min-h-11 items-center font-semibold text-navy underline decoration-gold underline-offset-4">출처·내용 오류 알리기 →</Link></section>

  <section className="mt-10 rounded-3xl bg-navy p-6 text-white sm:p-8"><h2 className="text-2xl font-semibold">치안은 동네 별점보다 실제 귀갓길로 확인하세요</h2><p className="mt-3 max-w-4xl text-sm leading-6 text-white/70">범죄 통계는 신고·집계 방식과 기간에 따라 달라지므로 숫자 하나만으로 안전을 판단하기 어렵습니다. 공식 지역 통계에서 사건 유형과 여러 해의 변화를 보고, 실제 귀가 시간에 역·정류장에서 집까지 걸으며 조명과 사람의 흐름을 함께 확인하세요.</p><ul className="mt-5 flex flex-wrap gap-2">{safetyLinks.map(([state, label, href]) => <li key={state}><a href={href} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center rounded-lg border border-white/20 px-3 text-sm font-semibold hover:bg-white/10" aria-label={`${label} 열기`}>{state} ↗</a></li>)}</ul></section>

  <aside className="mt-4 border border-border bg-white p-5 text-sm leading-7 text-muted"><h3 className="font-semibold text-navy">통계 지도가 비어 있어도 “범죄 없음”은 아닙니다</h3><p className="mt-2">2026-08-31 확인 시 ACT Policing은 지도 기술 문제와 내려받는 통계 파일 대안을 안내하고 있습니다. 위 ACT 링크에서 원본 파일과 집계 기간을 확인하세요. SA의 Suburb·Postcode 통계는 개인정보 보호를 위해 성범죄 항목을 포함하지 않습니다. VIC도 법·경찰 기록 방식 변화가 추세에 영향을 줄 수 있다고 안내합니다. 주마다 포함 항목과 기간이 다른 숫자를 그대로 안전 순위로 만들지 마세요.</p></aside>

  <section className="mt-8 rounded-2xl border border-amber-300 bg-amber-50 p-6 text-sm leading-7 text-amber-950"><h2 className="font-semibold">지도·안전 정보 안내</h2><p className="mt-1">Hoju Compass는 Google Maps 결과를 수집하거나 특정 지역·업체를 추천하지 않습니다. 지도 링크를 누르면 입력한 동네와 목적지 검색어가 Google로 전달되며 Google의 개인정보처리방침과 약관이 적용됩니다. 경로, 요금, 운행 정보와 범죄 통계는 계약이나 안전 결정을 대신하지 않으므로 교통기관·학교·정부 공식 자료와 현장을 다시 확인하세요.</p></section>
</Container></main><Footer /></>; }
