import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Container } from "@/components/ui/Container";
import { CommuteHousingPlanner } from "@/components/tools/CommuteHousingPlanner";
import { BreadcrumbJsonLd } from "@/components/seo/JsonLd";
import { createPageMetadata } from "@/lib/site";

export const metadata = createPageMetadata({ title: "호주 대중교통·통학 생활권 비교 | Aussie Compass", description: "집 후보의 주거비와 통학시간을 비교하고 Google Maps 대중교통 길찾기, 주별 교통기관과 학생 할인 정보를 확인하세요.", path: "/public-transport-guide" });

const transportLinks = [
  ["NSW", "Opal · Transport for NSW", "https://transportnsw.info/tickets-opal"],
  ["VIC", "myki · Public Transport Victoria", "https://www.ptv.vic.gov.au/tickets/myki/"],
  ["QLD", "Translink", "https://translink.com.au/tickets-and-fares"],
  ["WA", "SmartRider · Transperth", "https://www.transperth.wa.gov.au/smartrider"],
  ["SA", "Adelaide Metro", "https://www.adelaidemetro.com.au/tickets-and-fares"],
  ["TAS", "Metro Tasmania", "https://www.metrotas.com.au/fares/"],
  ["ACT", "MyWay+ · Transport Canberra", "https://www.transport.act.gov.au/tickets-and-myway"],
  ["NT", "Darwin public buses", "https://nt.gov.au/driving/public-transport-cycling/public-buses"],
];

const safetyLinks = [
  ["NSW", "BOCSAR Crime Mapping", "https://www.bocsar.nsw.gov.au/Pages/bocsar_crime_stats/bocsar_crime_stats.aspx"],
  ["VIC", "Crime Statistics Agency", "https://www.crimestatistics.vic.gov.au/crime-statistics/latest-crime-data-by-area"],
  ["QLD", "Queensland Police crime map", "https://qps-ocm.s3-ap-southeast-2.amazonaws.com/index.html"],
  ["WA", "WA Police crime statistics", "https://www.police.wa.gov.au/crime/crimestatistics"],
  ["SA", "SA Police crime statistics", "https://www.police.sa.gov.au/about-us/crime-statistics-map"],
  ["TAS", "Tasmania Police statistics", "https://www.police.tas.gov.au/about-us/crime-statistics/"],
  ["ACT", "ACT Policing crime statistics", "https://www.policenews.act.gov.au/crime-statistics-and-data/crime-statistics"],
  ["NT", "NT Police crime statistics", "https://pfes.nt.gov.au/police/community-safety/nt-crime-statistics"],
];

export default function PublicTransportGuidePage() { return <><BreadcrumbJsonLd items={[{ name: "홈", path: "/" }, { name: "대중교통·생활권 비교", path: "/public-transport-guide" }]} /><Header /><main className="py-12 sm:py-16"><Container>
  <Link href="/tools" className="inline-flex min-h-11 items-center text-sm font-medium text-muted hover:text-navy">&larr; 도구 목록으로 돌아가기</Link>
  <div className="mt-5 max-w-4xl"><p className="text-sm font-semibold uppercase tracking-[0.16em] text-gold">차 없이 시작하는 호주 생활</p><h1 className="mt-3 text-3xl font-semibold tracking-tight text-navy sm:text-4xl">싼 방보다, 매일 감당할 수 있는 생활권을 찾으세요</h1><p className="mt-4 text-base leading-7 text-muted sm:text-lg">학교·직장까지 걸리는 시간과 주거비를 후보별로 비교하고, 실제 대중교통 경로와 주변 생활시설을 Google Maps에서 확인하세요. 특히 교환학생과 유학생은 막차, 환승, 캠퍼스 간 이동까지 평일과 주말에 각각 확인하는 것이 좋습니다.</p></div>
  <div className="my-8 grid gap-4 md:grid-cols-3"><article className="rounded-2xl border border-gold/40 bg-gold/5 p-5"><h2 className="font-semibold text-navy">출발 시각을 바꿔 확인</h2><p className="mt-2 text-sm leading-6 text-muted">오전 수업, 저녁 아르바이트, 주말 귀가처럼 실제 이동 시각별 환승과 막차를 확인하세요.</p></article><article className="rounded-2xl border border-border bg-white p-5"><h2 className="font-semibold text-navy">Door-to-door로 비교</h2><p className="mt-2 text-sm leading-6 text-muted">차량 탑승시간뿐 아니라 정류장까지 도보, 대기, 환승과 캠퍼스 내부 이동을 포함하세요.</p></article><article className="rounded-2xl border border-border bg-white p-5"><h2 className="font-semibold text-navy">할인은 자격부터 확인</h2><p className="mt-2 text-sm leading-6 text-muted">국제학생 교통 할인은 주와 과정에 따라 다르므로 학교 안내와 교통기관 공식 자격을 함께 확인하세요.</p></article></div>
  <CommuteHousingPlanner />

  <section className="mt-10 rounded-3xl border border-border bg-surface p-6 sm:p-8"><h2 className="text-2xl font-semibold text-navy">학생이 집 후보를 볼 때 확인할 것</h2><div className="mt-6 grid gap-5 md:grid-cols-2"><article className="rounded-2xl bg-white p-5"><h3 className="font-semibold text-navy">통학과 주거비</h3><ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-muted"><li>주세 외 전기·가스·인터넷·세탁비 포함 여부</li><li>주 2회와 주 5회 등 실제 등교 빈도</li><li>캠퍼스가 여러 곳이면 수업 장소별 경로</li><li>늦은 수업 뒤 막차와 야간 도보 구간</li></ul></article><article className="rounded-2xl bg-white p-5"><h3 className="font-semibold text-navy">생활과 커뮤니티</h3><ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-muted"><li>슈퍼마켓·GP·약국·도서관 접근성</li><li>한국 식료품점 등 본인에게 필요한 시설</li><li>야간 조명과 역·정류장에서 집까지 동선</li><li>침수·산불 등 지역별 재난 정보</li></ul></article></div><div className="mt-5 flex flex-wrap gap-3"><a href="https://costofliving.studyaustralia.gov.au/" target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center rounded-lg bg-navy px-4 text-sm font-semibold text-white">Study Australia 생활비 계산기 ↗</a><Link href="/property-inspection-checklist" className="inline-flex min-h-11 items-center rounded-lg border border-navy px-4 text-sm font-semibold text-navy">집 방문 체크리스트 &rarr;</Link></div></section>

  <section className="mt-10" aria-labelledby="transport-links"><h2 id="transport-links" className="text-2xl font-semibold text-navy">주·준주별 교통카드와 공식 요금</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-muted">카드, 비접촉 결제, 요금 상한과 학생 할인은 바뀔 수 있습니다. 거주 지역의 공식 페이지에서 최신 정보를 확인하세요.</p><ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{transportLinks.map(([state, label, href]) => <li key={state}><a href={href} target="_blank" rel="noreferrer" className="flex h-full min-h-24 flex-col justify-between rounded-xl border border-border bg-white p-4 text-sm font-semibold text-navy transition hover:border-gold"><span className="text-xs text-gold">{state}</span><span>{label} ↗</span></a></li>)}</ul></section>

  <section className="mt-10 rounded-3xl bg-navy p-6 text-white sm:p-8"><h2 className="text-2xl font-semibold">치안은 ‘동네 순위’보다 공식 데이터와 현장 확인</h2><p className="mt-3 max-w-4xl text-sm leading-6 text-white/70">범죄 통계는 신고·집계 방식과 기간에 따라 달라지고 개인의 안전을 보장하지 않습니다. 특정 국적 밀집도나 임의의 안전 순위를 제공하지 않고, 공식 지역 통계와 낮·밤 현장 동선을 함께 확인하도록 안내합니다.</p><ul className="mt-5 flex flex-wrap gap-2">{safetyLinks.map(([state, label, href]) => <li key={state}><a href={href} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center rounded-lg border border-white/20 px-3 text-sm font-semibold hover:bg-white/10" aria-label={`${label} 열기`}>{state} ↗</a></li>)}</ul></section>

  <section className="mt-8 rounded-2xl border border-amber-300 bg-amber-50 p-6 text-sm leading-7 text-amber-950"><h2 className="font-semibold">지도·안전 정보 안내</h2><p className="mt-1">Aussie Compass는 Google Maps 결과를 수집하거나 특정 지역·업체를 추천하지 않습니다. 지도 링크를 누르면 입력한 동네와 목적지 검색어가 Google로 전달되며 Google의 개인정보처리방침과 약관이 적용됩니다. 경로, 요금, 운행 정보와 범죄 통계는 계약이나 안전 결정을 대신하지 않으므로 교통기관·학교·정부 공식 자료와 현장을 다시 확인하세요.</p></section>
</Container></main><Footer /></>; }
