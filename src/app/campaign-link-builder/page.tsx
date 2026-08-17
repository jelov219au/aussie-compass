import Link from "next/link";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { BreadcrumbJsonLd } from "@/components/seo/JsonLd";
import { CampaignLinkBuilder } from "@/components/tools/CampaignLinkBuilder";
import { Container } from "@/components/ui/Container";
import { createPageMetadata, siteUrl } from "@/lib/site";
import { requireLocalOperatorAccess } from "@/lib/operatorOnly";

export const metadata = { ...createPageMetadata({ title: "SNS·커뮤니티 캠페인 공유 링크 만들기 | Hoju Compass", description: "Instagram, YouTube, Naver, Facebook와 뉴스레터용 UTM 공유 링크를 만들고 Hoju Compass 카드뉴스에 연결하세요.", path: "/campaign-link-builder" }), robots: { index: false, follow: false } };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
function readParam(value: string | string[] | undefined, maxLength: number) { return (Array.isArray(value) ? value[0] : value)?.trim().slice(0, maxLength); }

export default async function CampaignLinkBuilderPage({ searchParams }: { searchParams: SearchParams }) {
  requireLocalOperatorAccess();
  const params = await searchParams;
  const initialValues = { target: readParam(params.target, 100), source: readParam(params.source, 30), campaign: readParam(params.campaign, 64), content: readParam(params.content, 64) };
  return <><BreadcrumbJsonLd items={[{ name: "홈", path: "/" }, { name: "무료 도구", path: "/tools" }, { name: "캠페인 공유 링크", path: "/campaign-link-builder" }]} /><Header /><main className="py-12 sm:py-16"><Container><Link href="/tools" className="inline-flex min-h-11 items-center text-sm font-medium text-muted hover:text-navy">&larr; 도구 목록으로 돌아가기</Link><div className="mb-10 mt-5 grid gap-7 border-b border-navy/20 pb-9 lg:grid-cols-[1fr_19rem] lg:items-end"><div className="max-w-4xl"><p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">Campaign link builder</p><h1 className="mt-3 text-4xl font-semibold tracking-tight text-navy sm:text-5xl">어디에서 공유했는지 알 수 있는 링크를 만드세요.</h1><p className="mt-5 max-w-3xl leading-7 text-muted">Instagram, YouTube, Naver, Facebook, Kakao와 뉴스레터 게시물에 채널·캠페인 이름을 붙인 링크를 만들고 카드뉴스 제작기로 이어갑니다.</p></div><aside className="border-l-2 border-gold pl-5 text-sm leading-6 text-muted"><strong className="block text-navy">계정 연결·자동 게시 없음</strong>링크와 목록은 이 기기에서만 만들고 저장합니다.</aside></div><CampaignLinkBuilder baseUrl={siteUrl} initialValues={initialValues} /><section className="mt-12 grid gap-5 border-t border-navy/20 pt-8 lg:grid-cols-2"><div><h2 className="text-xl font-semibold text-navy">링크에 넣지 말아야 할 정보</h2><ul className="mt-3 space-y-2 text-sm leading-6 text-muted"><li>• 구독자 이메일, 이름, 전화번호와 SNS 계정 ID</li><li>• 특정 개인을 알아볼 수 있는 회원번호나 내부 고객번호</li><li>• 게시물 제목 전체처럼 지나치게 길고 자주 바뀌는 값</li></ul></div><div className="border border-amber-300 bg-amber-50 p-5 text-sm leading-7 text-amber-950"><strong>분석 연결 전 단계</strong><p className="mt-1">현재 사이트는 이메일·광고 추적을 운영하지 않습니다. 이 도구는 일관된 캠페인 링크만 준비하며, 방문 성과 수집을 시작하려면 분석 서비스 선택, 개인정보 안내와 동의 필요성을 별도로 검토해야 합니다.</p></div></section></Container></main><Footer /></>;
}
