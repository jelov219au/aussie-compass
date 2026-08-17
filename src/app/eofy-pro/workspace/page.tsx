import type { Metadata } from "next";
import Link from "next/link";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { BreadcrumbJsonLd } from "@/components/seo/JsonLd";
import { EofyProWorkspace } from "@/components/tools/EofyProWorkspace";
import { Container } from "@/components/ui/Container";
import { requireLocalProductPreviewAccess } from "@/lib/localPreviewOnly";

export const metadata: Metadata = {
  title: "EOFY Pack Pro 개발 프리뷰 | Hoju Compass",
  description: "호주 택스 리턴 전 소득 상태, 공제 후보 증빙과 등록 세무사에게 확인할 질문을 기기 안에서 정리하세요.",
  robots: { index: false, follow: false },
};

export default function EofyProWorkspacePage() {
  requireLocalProductPreviewAccess();

  return <>
    <BreadcrumbJsonLd items={[{ name: "홈", path: "/" }, { name: "택스 리턴 준비", path: "/tax-return-guide" }, { name: "EOFY Pack Pro", path: "/eofy-pro" }, { name: "개발 프리뷰", path: "/eofy-pro/workspace" }]} />
    <Header />
    <main className="py-12 sm:py-16"><Container>
      <Link href="/eofy-pro" className="inline-flex min-h-11 items-center text-sm font-medium text-muted hover:text-navy">&larr; EOFY Pack Pro 소개로 돌아가기</Link>
      <div className="mt-7 grid gap-7 border-b border-navy/20 pb-9 lg:grid-cols-[1fr_18rem] lg:items-end"><div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">EOFY Pack Pro / Development preview</p><h1 className="mt-3 text-3xl font-semibold tracking-tight text-navy [word-break:keep-all] sm:text-5xl">신고서를 만들기 전에, 확인할 자료와 질문부터 정리하세요.</h1><p className="mt-5 max-w-3xl leading-7 text-muted">소득 자료의 준비 상태, 공제 후보의 증빙과 업무 관련성 메모, 등록 세무사에게 물어볼 질문을 개인 요약으로 묶습니다.</p></div><aside className="border-l-2 border-gold pl-5 text-sm leading-6 text-muted"><strong className="block text-navy">개발 프리뷰 · 현재 무료</strong>기능 검증 단계이며 신고·결제·계정 생성과 영수증 업로드는 진행되지 않습니다.</aside></div>
      <div className="mt-9"><EofyProWorkspace /></div>
      <section className="mt-10 border border-amber-300 bg-amber-50 p-5 text-sm leading-7 text-amber-950"><h2 className="font-semibold">세무·개인정보 안내</h2><p className="mt-1">입력 내용은 이 브라우저에만 저장됩니다. 기록한 금액 합계는 공제액이나 예상 환급액이 아니며, 이 도구는 공제 가능 여부, 기록의 충분성, 세법상 거주자 여부 또는 신고 의무를 판정하지 않습니다. TFN, 계좌번호, myGov 로그인 정보와 영수증 원본은 입력하지 마세요.</p></section>
    </Container></main>
    <Footer />
  </>;
}
