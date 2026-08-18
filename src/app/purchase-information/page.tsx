import Link from "next/link";

import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { BreadcrumbJsonLd } from "@/components/seo/JsonLd";
import { Container } from "@/components/ui/Container";
import { getPaymentReadiness, resumeProProduct } from "@/lib/commerce";
import { getPublicSellerDetails } from "@/lib/publicSeller";
import { createPageMetadata } from "@/lib/site";

export const metadata = createPageMetadata({
  title: "구매·환불 안내 | Hoju Compass",
  description: "Hoju Compass Pro의 판매자 정보, 가격, 디지털 제공 방식, 영수증, 이용권 복구와 환불 요청 절차를 확인하세요.",
  path: "/purchase-information",
});

export const dynamic = "force-dynamic";

export default function PurchaseInformationPage() {
  const seller = getPublicSellerDetails();
  const readiness = getPaymentReadiness();
  const price = new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD" }).format(resumeProProduct.priceCents / 100);
  const sellerReady = Boolean(seller.name && seller.abn && seller.email);

  return (
    <>
      <BreadcrumbJsonLd items={[{ name: "홈", path: "/" }, { name: "구매·환불 안내", path: "/purchase-information" }]} />
      <Header />
      <main className="py-12 sm:py-16">
        <Container>
          <Link href="/resume-pro" className="inline-flex min-h-11 items-center text-sm font-medium text-muted hover:text-navy">&larr; Resume Pro로 돌아가기</Link>
          <div className="mt-8 grid gap-8 border-b border-navy/20 pb-10 lg:grid-cols-[1fr_18rem] lg:items-end">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">구매 전에 알아둘 내용</p>
              <h1 className="mt-3 text-4xl font-semibold tracking-tight text-navy sm:text-5xl">결제 전에 조건을 먼저 확인하세요.</h1>
              <p className="mt-5 max-w-3xl leading-7 text-muted">가격과 제공 방식, 이용권 복구, 판매자 연락처와 환불 요청 절차를 한곳에 정리했습니다.</p>
            </div>
            <aside className="border-l-2 border-gold pl-5 text-sm leading-6 text-muted">
              <strong className="block text-navy">현재 상태</strong>
              {readiness.ready && sellerReady ? "라이브 결제 준비 항목이 설정됐습니다." : "테스트 단계이며 실제 결제는 아직 열리지 않았습니다."}
            </aside>
          </div>

          <section className="mt-10 grid gap-5 md:grid-cols-3" aria-label="Resume Pro 구매 요약">
            <article className="border-t-2 border-gold bg-white p-5"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">가격</p><p className="mt-3 text-3xl font-semibold text-navy">{price}</p><p className="mt-2 text-sm leading-6 text-muted">AUD 기준 1회 결제이며 자동 갱신 구독이 아닙니다.</p></article>
            <article className="border-t-2 border-navy bg-white p-5"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">제공 방식</p><p className="mt-3 text-xl font-semibold text-navy">디지털 작업 공간</p><p className="mt-2 text-sm leading-6 text-muted">결제와 서버 이용권 확인 후 현재 브라우저에 접근 세션을 발급합니다.</p></article>
            <article className="border-t-2 border-navy bg-white p-5"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">이용권 복구</p><p className="mt-3 text-xl font-semibold text-navy">1회용 복구 코드</p><p className="mt-2 text-sm leading-6 text-muted">작업 공간에서 발급한 코드는 30일 안에 한 번만 사용할 수 있습니다.</p></article>
          </section>

          <div className="mt-12 divide-y divide-border border-y border-border">
            <section className="grid gap-5 py-8 lg:grid-cols-[15rem_1fr]">
              <div><p className="font-mono text-xs text-gold">01 / SELLER</p><h2 className="mt-2 text-xl font-semibold text-navy">판매자와 지원 연락처</h2></div>
              <div className="max-w-3xl text-sm leading-7 text-muted">
                {sellerReady ? (
                  <dl className="grid gap-x-5 gap-y-2 sm:grid-cols-[7rem_1fr]">
                    <dt className="font-semibold text-navy">법적 이름</dt><dd>{seller.name}</dd>
                    <dt className="font-semibold text-navy">ABN</dt><dd>{seller.abn}</dd>
                    <dt className="font-semibold text-navy">지원 이메일</dt><dd><a className="font-semibold text-navy underline decoration-gold underline-offset-4" href={`mailto:${seller.email}`}>{seller.email}</a></dd>
                  </dl>
                ) : (
                  <p className="border-l-2 border-gold bg-surface p-4">법적 판매자 이름, ABN과 지원 이메일은 라이브 결제를 열기 전에 이 위치에 공개합니다. 이 정보가 보이지 않는 동안에는 실제 결제가 활성화되지 않습니다.</p>
                )}
              </div>
            </section>

            <section className="grid gap-5 py-8 lg:grid-cols-[15rem_1fr]">
              <div><p className="font-mono text-xs text-gold">02 / DELIVERY</p><h2 className="mt-2 text-xl font-semibold text-navy">결제와 디지털 제공</h2></div>
              <div className="max-w-3xl space-y-3 text-sm leading-7 text-muted">
                <p>결제 화면은 Stripe가 처리하며 Hoju Compass는 전체 카드번호나 카드 보안번호를 직접 받지 않습니다. 결제가 완료되고 서명된 결제 알림으로 활성 이용권이 확인돼야 작업 공간을 열 수 있습니다.</p>
                <p>웹훅 처리가 늦으면 결제 완료 화면에서 잠시 기다린 뒤 다시 확인할 수 있습니다. 결제는 확인됐지만 접근이 계속 열리지 않으면 지원 이메일로 결제 시각과 Stripe 영수증 정보를 보내 주세요. 카드번호 전체나 보안번호는 보내지 마세요.</p>
                <Link href="/payment-help" className="inline-flex min-h-11 items-center font-semibold text-navy underline decoration-gold underline-offset-4">결제·접근 문제 해결 순서 보기 →</Link>
              </div>
            </section>

            <section className="grid gap-5 py-8 lg:grid-cols-[15rem_1fr]">
              <div><p className="font-mono text-xs text-gold">03 / RECEIPT</p><h2 className="mt-2 text-xl font-semibold text-navy">영수증과 인보이스</h2></div>
              <div className="max-w-3xl space-y-3 text-sm leading-7 text-muted">
                <p>결제 증빙에는 판매자 정보, 구매일, 제품 설명과 결제 금액이 식별될 수 있어야 합니다. 필요한 경우 지원 이메일로 영수증 또는 사업자의 GST 등록 상태에 맞는 인보이스를 요청할 수 있도록 준비합니다.</p>
                <p>GST 등록 여부가 확인되지 않은 상태에서 문서를 ‘Tax invoice’라고 표시하거나 GST가 포함됐다고 안내하지 않습니다.</p>
              </div>
            </section>

            <section className="grid gap-5 py-8 lg:grid-cols-[15rem_1fr]">
              <div><p className="font-mono text-xs text-gold">04 / REMEDIES</p><h2 className="mt-2 text-xl font-semibold text-navy">문제 해결과 환불 요청</h2></div>
              <div className="max-w-3xl space-y-3 text-sm leading-7 text-muted">
                <p>단순 변심에 대한 환불은 자동으로 보장되지 않습니다. 다만 이 정책은 Australian Consumer Law에 따른 소비자 보장 권리를 제한하지 않습니다. 제품이 설명과 크게 다르거나 정상적으로 제공되지 않는 등 문제가 있다면 판매자가 상황을 확인하고 적용되는 수리, 교체, 재제공 또는 환불 같은 해결 방법을 안내해야 합니다.</p>
                <p>요청할 때는 구매 이메일, 결제일, 제품명과 문제 상황을 알려 주세요. 카드번호, 비밀번호, 신분증 전체 사본은 보내지 마세요.</p>
                <a href="https://www.accc.gov.au/consumers/buying-products-and-services/consumer-rights-and-guarantees" target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center font-semibold text-navy underline decoration-gold underline-offset-4">ACCC 소비자 권리 안내 확인하기 ↗</a>
              </div>
            </section>

            <section className="grid gap-5 py-8 lg:grid-cols-[15rem_1fr]">
              <div><p className="font-mono text-xs text-gold">05 / DATA</p><h2 className="mt-2 text-xl font-semibold text-navy">결제와 이력서 데이터</h2></div>
              <div className="max-w-3xl space-y-3 text-sm leading-7 text-muted">
                <p>Stripe 결제 과정의 연락처와 결제 상태는 Stripe에서 처리됩니다. Hoju Compass 서버에는 이용권 제공과 환불·분쟁 대응에 필요한 결제 식별자, 이용권 상태와 처리 시각 같은 기술 기록이 저장될 수 있습니다.</p>
                <p>이력서와 커버레터 작성 내용은 별도 안내가 없는 한 현재 브라우저에서 처리되며 결제 이용권 데이터베이스에 저장되지 않습니다. 자세한 내용은 <Link href="/privacy" className="font-semibold text-navy underline decoration-gold underline-offset-4">데이터와 개인정보 안내</Link>를 확인하세요.</p>
              </div>
            </section>
          </div>

          <section className="mt-10 border-l-2 border-gold bg-surface p-6 text-sm leading-7 text-muted">
            <h2 className="font-semibold text-navy">출시 전 확인 사항</h2>
            <p className="mt-1">이 페이지는 현재 준비 상태를 투명하게 설명하기 위한 안내이며 법률·세무 자문이 아닙니다. 라이브 결제 전 판매자 정보, GST 처리, 영수증 전달과 지원 절차를 등록 세무사 또는 적절한 전문가와 최종 확인해야 합니다.</p>
          </section>
        </Container>
      </main>
      <Footer />
    </>
  );
}
