import Link from "next/link";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { BreadcrumbJsonLd } from "@/components/seo/JsonLd";
import { ContentPublishingPlanner } from "@/components/tools/ContentPublishingPlanner";
import { Container } from "@/components/ui/Container";
import { createPageMetadata } from "@/lib/site";

export const metadata = createPageMetadata({ title: "SNS·커뮤니티 콘텐츠 발행 플래너 | Hoju Compass", description: "호주 생활 콘텐츠의 주제, 채널, 형식과 발행일을 정하고 캠페인 링크와 카드뉴스 제작까지 이어가세요.", path: "/content-planner" });

export default function ContentPlannerPage() {
  return <><BreadcrumbJsonLd items={[{ name: "홈", path: "/" }, { name: "무료 도구", path: "/tools" }, { name: "콘텐츠 발행 플래너", path: "/content-planner" }]} /><Header /><main className="py-12 sm:py-16"><Container><Link href="/tools" className="inline-flex min-h-11 items-center text-sm font-medium text-muted hover:text-navy">&larr; 도구 목록으로 돌아가기</Link><div className="mb-10 mt-5 grid gap-7 border-b border-navy/20 pb-9 lg:grid-cols-[1fr_20rem] lg:items-end"><div className="max-w-4xl"><p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">Content publishing planner</p><h1 className="mt-3 text-4xl font-semibold tracking-tight text-navy sm:text-5xl">좋은 정보를 한 번이 아니라 꾸준히 알리세요.</h1><p className="mt-5 max-w-3xl leading-7 text-muted">Hoju Compass의 실용 자료를 주제별로 고르고, 채널·형식·발행일을 정해 링크 생성과 카드뉴스 제작까지 한 흐름으로 관리합니다.</p></div><aside className="border-l-2 border-gold pl-5 text-sm leading-6 text-muted"><strong className="block text-navy">운영자의 기기 안에서만</strong>계정 연결, 자동 게시와 방문자 개인정보 수집 없이 발행 계획만 관리합니다.</aside></div><ContentPublishingPlanner /><section className="mt-12 grid gap-6 border-t border-navy/20 pt-8 lg:grid-cols-3"><div><span className="font-mono text-xs text-gold">01</span><h2 className="mt-2 font-semibold text-navy">도움이 되는 한 가지</h2><p className="mt-2 text-sm leading-6 text-muted">한 게시물에는 한 문제와 한 다음 행동만 담아 정보 과부하를 줄입니다.</p></div><div><span className="font-mono text-xs text-gold">02</span><h2 className="mt-2 font-semibold text-navy">공식 기준 재확인</h2><p className="mt-2 text-sm leading-6 text-muted">비자·세금·임금·날짜가 들어간 게시물은 발행 전에 공식 출처의 최신 기준을 다시 확인합니다.</p></div><div><span className="font-mono text-xs text-gold">03</span><h2 className="mt-2 font-semibold text-navy">광고라면 명확하게</h2><p className="mt-2 text-sm leading-6 text-muted">협찬, 제휴 링크나 유료 홍보가 포함되면 사용자가 바로 알아볼 수 있게 표시합니다.</p></div></section></Container></main><Footer /></>;
}
