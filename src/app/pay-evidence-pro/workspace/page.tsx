import type { Metadata } from "next";
import Link from "next/link";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { BreadcrumbJsonLd } from "@/components/seo/JsonLd";
import { PayEvidenceWorkspace } from "@/components/tools/PayEvidenceWorkspace";
import { Container } from "@/components/ui/Container";
import { requireLocalProductPreviewAccess } from "@/lib/localPreviewOnly";

export const metadata: Metadata = { title: "Pay Evidence Pack Pro 개발 프리뷰 | Hoju Compass", description: "근무시간, Payslip Gross, 입금과 증빙 상태를 급여기간별로 정리하고 영문 급여 확인 요청문을 만드세요.", robots: { index: false, follow: false } };

export default function PayEvidenceWorkspacePage() {
  requireLocalProductPreviewAccess();

  return <><BreadcrumbJsonLd items={[{ name: "홈", path: "/" }, { name: "Pay Evidence Pack Pro", path: "/pay-evidence-pro" }, { name: "개발 프리뷰", path: "/pay-evidence-pro/workspace" }]} /><Header /><main className="py-12 sm:py-16"><Container><Link href="/pay-evidence-pro" className="inline-flex min-h-11 items-center text-sm font-medium text-muted hover:text-navy">&larr; Pay Evidence Pack Pro 소개로 돌아가기</Link><div className="mt-7 grid gap-7 border-b border-navy/20 pb-9 lg:grid-cols-[1fr_19rem] lg:items-end"><div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">Pay Evidence Pack Pro / Development preview</p><h1 className="mt-3 text-3xl font-semibold tracking-tight text-navy [word-break:keep-all] sm:text-5xl">급여가 이상하다는 느낌을, 확인 가능한 기록으로 바꾸세요.</h1><p className="mt-5 max-w-3xl leading-7 text-muted">근무시간과 기대 Gross, Payslip Gross, 실제 Net 입금과 증빙을 급여기간별로 분리해 고용주나 상담기관에 전달할 준비를 합니다.</p></div><aside className="border-l-2 border-gold pl-5 text-sm leading-6 text-muted"><strong className="block text-navy">개발 프리뷰 · 현재 무료</strong>결제, 계정 생성, 원본 Payslip·은행자료 업로드와 Fair Work 신고는 진행되지 않습니다.</aside></div><div className="mt-9"><PayEvidenceWorkspace /></div><section className="mt-10 border border-amber-300 bg-amber-50 p-5 text-sm leading-7 text-amber-950"><h2 className="font-semibold">고용·급여 안내</h2><p className="mt-1">표시된 차이는 사용자가 입력한 기대 Gross와 Payslip Gross의 단순 차이이며 법적 미지급액 판정이 아닙니다. Award, Agreement, Classification, penalty·overtime·allowance 적용과 세금·Super는 Fair Work 공식 도구 또는 전문가에게 확인하세요.</p></section></Container></main><Footer /></>;
}
