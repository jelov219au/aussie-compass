import type { Metadata } from "next";
import Link from "next/link";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { BreadcrumbJsonLd } from "@/components/seo/JsonLd";
import { LeavingAustraliaProWorkspace } from "@/components/tools/LeavingAustraliaProWorkspace";
import { Container } from "@/components/ui/Container";
import { requireLocalProductPreviewAccess } from "@/lib/localPreviewOnly";

export const metadata: Metadata = {
  title: "Leaving Australia Pack Pro 개발 프리뷰 | Hoju Compass",
  description: "호주 출국 전후 업무, 마지막 정산, DASP와 세금 확인 질문을 개인 귀국 준비 패키지로 정리하세요.",
  robots: { index: false, follow: false },
};

export default function LeavingAustraliaProWorkspacePage() {
  requireLocalProductPreviewAccess();

  return <><BreadcrumbJsonLd items={[{ name: "홈", path: "/" }, { name: "Leaving Australia Pack Pro", path: "/leaving-australia-pro" }, { name: "개발 프리뷰", path: "/leaving-australia-pro/workspace" }]} /><Header /><main className="py-12 sm:py-16"><Container><Link href="/leaving-australia-pro" className="inline-flex min-h-11 items-center text-sm font-medium text-muted hover:text-navy">&larr; Leaving Australia Pack Pro 소개로 돌아가기</Link><div className="mt-7 grid gap-7 border-b border-navy/20 pb-9 lg:grid-cols-[1fr_19rem] lg:items-end"><div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">Leaving Australia Pack Pro / Development preview</p><h1 className="mt-3 text-3xl font-semibold tracking-tight text-navy [word-break:keep-all] sm:text-5xl">출국일이 지나도 남는 일을, 한 화면에서 끝까지 추적하세요.</h1><p className="mt-5 max-w-3xl leading-7 text-muted">퇴사·퇴거·계정 접근부터 Bond, 마지막 급여, 세금과 DASP 후속 확인까지 개인 인계 패키지로 정리합니다.</p></div><aside className="border-l-2 border-gold pl-5 text-sm leading-6 text-muted"><strong className="block text-navy">개발 프리뷰 · 현재 무료</strong>결제, 계정 생성, 비자 조회와 원본 문서 업로드는 진행되지 않습니다.</aside></div><div className="mt-9"><LeavingAustraliaProWorkspace /></div><section className="mt-10 border border-amber-300 bg-amber-50 p-5 text-sm leading-7 text-amber-950"><h2 className="font-semibold">이민·세무·Super 안내</h2><p className="mt-1">이 도구는 비자 종료, DASP 자격·세율, 세법상 거주 상태, 조기 Tax return 가능 여부를 판정하지 않습니다. 비자 취소는 향후 여행이나 신청에 영향을 줄 수 있으므로 공식 안내 또는 등록 전문가에게 확인하세요.</p></section></Container></main><Footer /></>;
}
