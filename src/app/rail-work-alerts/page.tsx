import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Container } from "@/components/ui/Container";
import { RailWorkAlertPlanner } from "@/components/tools/RailWorkAlertPlanner";
import { BreadcrumbJsonLd } from "@/components/seo/JsonLd";
import { createPageMetadata } from "@/lib/site";

export const metadata = createPageMetadata({
  title: "철도 작업·공사 확인 지역 저장 | Hoju Compass",
  description: "통근·통학 지역을 저장하고 지도, 공식 철도 작업 공지와 출발 전 체크리스트를 반복해서 확인하세요.",
  path: "/rail-work-alerts",
});

export default function RailWorkAlertsPage() {
  return <><BreadcrumbJsonLd items={[{ name: "홈", path: "/" }, { name: "대중교통·생활권 비교", path: "/public-transport-guide" }, { name: "철도 작업 확인", path: "/rail-work-alerts" }]} /><Header /><main className="py-12 sm:py-16"><Container>
    <Link href="/public-transport-guide" className="inline-flex min-h-11 items-center text-sm font-medium text-muted hover:text-navy">&larr; 대중교통·생활권 비교로 돌아가기</Link>
    <div className="mb-8 mt-5 max-w-4xl"><p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">Rail work check routine</p><h1 className="mt-3 text-4xl font-semibold tracking-tight text-navy sm:text-5xl">자주 가는 지역의 철도 작업을 출발 전에 다시 확인하세요.</h1><p className="mt-5 max-w-3xl leading-7 text-muted">동네·역을 이 브라우저에 저장하고 지도 위치, 공식 작업 공지, 대체 이동과 접근성 영향을 같은 순서로 확인합니다.</p></div>
    <RailWorkAlertPlanner />
    <section className="mt-8 border border-amber-300 bg-amber-50 p-5 text-sm leading-7 text-amber-950" aria-labelledby="rail-boundary-heading"><h2 id="rail-boundary-heading" className="font-semibold">현재 제공 범위</h2><p className="mt-1">이 화면은 NSW·VIC·QLD 공식 페이지로 가는 확인 작업대이며 실시간 알림, 거리 계산 또는 운행 보장을 제공하지 않습니다. 지도 버튼을 누르면 저장한 동네·역 검색어가 Google로 전달됩니다. 날짜와 대체 교통은 이동 직전에 교통기관 원문과 Journey Planner에서 다시 확인하세요.</p><div className="mt-4 border-t border-amber-300 pt-4"><a href="https://datahub.roadsafety.gov.au/infrastructure/roadworks-and-road-closures" target="_blank" rel="noreferrer" className="inline-flex min-h-12 items-center bg-amber-950 px-4 font-semibold text-white">정부 지도에서 직접 확인 ↗</a><p className="mt-2 text-xs leading-5">National Road Safety Data Hub 지도는 주·준주 공개 피드를 매일 갱신하며 state-managed road 중심입니다. 작업·통제 종료일이 빠질 수 있고 Hoju Compass가 데이터를 자동 수집하거나 자체 지도 마커로 표시하지 않습니다.</p></div></section>
  </Container></main><Footer /></>;
}
