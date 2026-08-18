import Link from "next/link";

import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { BreadcrumbJsonLd } from "@/components/seo/JsonLd";
import { PaymentSupportHelper } from "@/components/tools/PaymentSupportHelper";
import { Container } from "@/components/ui/Container";
import { getPublicSellerDetails } from "@/lib/publicSeller";
import { createPageMetadata } from "@/lib/site";

export const metadata = createPageMetadata({
  title: "결제·접근 문제 해결 | Hoju Compass",
  description: "Resume Pro 결제 확인 지연, 접근 만료, 복구 코드 분실과 환불 요청을 안전하게 준비하세요.",
  path: "/payment-help",
});

export const dynamic = "force-dynamic";

const warnings = [
  "같은 제품을 다시 결제하기 전에 기존 Stripe 영수증과 결제 완료 화면을 확인하세요.",
  "카드번호 전체, CVC, 인터넷뱅킹 비밀번호, 인증번호 또는 신분증 전체 사본을 보내지 마세요.",
  "이력서 원문에는 이름·연락처가 포함될 수 있으므로 결제 문의에 첨부하지 마세요.",
];

export default function PaymentHelpPage() {
  const seller = getPublicSellerDetails();
  return (
    <>
      <BreadcrumbJsonLd items={[{ name: "홈", path: "/" }, { name: "구매·환불 안내", path: "/purchase-information" }, { name: "결제·접근 문제 해결", path: "/payment-help" }]} />
      <Header />
      <main className="py-12 sm:py-16">
        <Container className="max-w-5xl">
          <Link href="/purchase-information" className="inline-flex min-h-11 items-center text-sm font-medium text-muted hover:text-navy">&larr; 구매·환불 안내로 돌아가기</Link>
          <div className="mt-8 grid gap-8 border-b border-navy/20 pb-10 lg:grid-cols-[1fr_18rem] lg:items-end">
            <div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">Payment support</p><h1 className="mt-3 text-4xl font-semibold tracking-tight text-navy sm:text-5xl">결제보다 먼저, 문제 상황을 구분하세요.</h1><p className="mt-5 max-w-3xl leading-7 text-muted">중복 결제와 민감정보 노출을 피하면서 Resume Pro 접근 문제나 환불 요청을 준비하는 순서입니다.</p></div>
            <p className="border-l-2 border-gold pl-5 text-sm leading-6 text-muted"><strong className="block text-navy">서버 제출 없음</strong>아래 선택과 문의 문구는 현재 브라우저에서만 만들어집니다.</p>
          </div>
          <section className="mt-9 bg-navy p-5 text-white sm:p-7" aria-labelledby="safety-first-heading">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">Safety first</p><h2 id="safety-first-heading" className="mt-2 text-xl font-semibold">지원 요청 전에 확인하세요.</h2>
            <ul className="mt-4 space-y-3 text-sm leading-6 text-white/75">{warnings.map((warning) => <li key={warning}>• {warning}</li>)}</ul>
          </section>
          <div className="mt-8"><PaymentSupportHelper supportEmail={seller.email} /></div>
          <section className="mt-8 grid gap-4 sm:grid-cols-3">
            <Link href="/resume-pro/restore" className="border border-border bg-white p-5"><span className="text-xs font-semibold uppercase tracking-[0.16em] text-gold">Access</span><strong className="mt-2 block text-navy">복구 코드 사용하기 →</strong><span className="mt-2 block text-sm leading-6 text-muted">유효한 1회용 코드가 있다면 이 기기의 접근을 복구합니다.</span></Link>
            <Link href="/purchase-information" className="border border-border bg-white p-5"><span className="text-xs font-semibold uppercase tracking-[0.16em] text-gold">Policy</span><strong className="mt-2 block text-navy">구매·환불 조건 보기 →</strong><span className="mt-2 block text-sm leading-6 text-muted">가격, 제공 방식, 판매자 정보와 소비자 권리를 확인합니다.</span></Link>
            <Link href="/privacy" className="border border-border bg-white p-5"><span className="text-xs font-semibold uppercase tracking-[0.16em] text-gold">Data</span><strong className="mt-2 block text-navy">결제 데이터 처리 보기 →</strong><span className="mt-2 block text-sm leading-6 text-muted">Stripe와 Hoju Compass가 처리하는 정보 범위를 확인합니다.</span></Link>
          </section>
        </Container>
      </main>
      <Footer />
    </>
  );
}
