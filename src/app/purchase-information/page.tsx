import Link from "next/link";

import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { BreadcrumbJsonLd } from "@/components/seo/JsonLd";
import { Container } from "@/components/ui/Container";
import {
  getPaymentReadiness,
  getRentalApplicationPaymentReadiness,
  rentalApplicationProProduct,
  rentalApplicationProPurchaseTermsVersion,
  resumeProProduct,
  resumeProPurchaseTermsVersion,
} from "@/lib/commerce";
import { getPublicSellerDetails } from "@/lib/publicSeller";
import { createPageMetadata } from "@/lib/site";

export const metadata = createPageMetadata({
  title: "구매·환불 안내 | Hoju Compass",
  description: "Hoju Compass Pro의 제품 제공자와 거래 지원 구분, 가격, 디지털 제공 방식, 영수증, 이용권 복구와 환불 요청 절차를 확인하세요.",
  path: "/purchase-information",
});

export const dynamic = "force-dynamic";

export default function PurchaseInformationPage() {
  const seller = getPublicSellerDetails();
  const readiness = getPaymentReadiness();
  const rentalReadiness = getRentalApplicationPaymentReadiness();
  const price = `A$${(resumeProProduct.priceCents / 100).toFixed(2)}`;
  const rentalPrice = `A$${(rentalApplicationProProduct.priceCents / 100).toFixed(2)}`;
  const sellerReady = Boolean(seller.tradingName && seller.legalName && seller.abn && seller.email);

  return (
    <>
      <BreadcrumbJsonLd items={[{ name: "홈", path: "/" }, { name: "구매·환불 안내", path: "/purchase-information" }]} />
      <Header />
      <main className="py-12 sm:py-16">
        <Container>
          <Link href="/pro" className="inline-flex min-h-11 items-center text-sm font-medium text-muted hover:text-navy">&larr; Pro 제품 비교로 돌아가기</Link>
          <div className="mt-8 grid gap-8 border-b border-navy/20 pb-10 lg:grid-cols-[1fr_18rem] lg:items-end">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">구매 전에 알아둘 내용</p>
              <h1 className="mt-3 text-4xl font-semibold tracking-tight text-navy sm:text-5xl">결제 전에 조건을 먼저 확인하세요.</h1>
              <p className="mt-5 max-w-3xl leading-7 text-muted">가격과 제공 방식, 이용권 복구, 제품·거래 지원 연락처와 환불 요청 절차를 한곳에 정리했습니다.</p>
            </div>
            <aside className="border-l-2 border-gold pl-5 text-sm leading-6 text-muted">
              <strong className="block text-navy">현재 상태</strong>
              {readiness.ready && sellerReady ? "Resume Pro 결제 이용 가능" : "Resume Pro 결제 준비 중"}
              <span className="mt-1 block">{rentalReadiness.ready && sellerReady ? "Rental Pack Pro 결제 이용 가능" : "Rental Pack Pro 유료 검증 중"}</span>
            </aside>
          </div>

          <section className="mt-10 grid gap-5 md:grid-cols-3" aria-label="Pro 제품 구매 요약">
            <article className="border-t-2 border-gold bg-white p-5"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">제품별 1회 가격</p><p className="mt-3 text-xl font-semibold text-navy">Resume Pro · {price}</p><p className="mt-1 text-xl font-semibold text-navy">Rental Pack · {rentalPrice}</p><p className="mt-2 text-sm leading-6 text-muted">AUD 기준이며 자동 갱신 구독이 아닙니다. 결제가 열린 제품만 구매할 수 있습니다.</p></article>
            <article className="border-t-2 border-navy bg-white p-5"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">제공 방식</p><p className="mt-3 text-xl font-semibold text-navy">디지털 작업 공간</p><p className="mt-2 text-sm leading-6 text-muted">결제와 서버 이용권 확인 후 현재 브라우저에 접근 세션을 발급합니다.</p></article>
            <article className="border-t-2 border-navy bg-white p-5"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">이용권 복구</p><p className="mt-3 text-xl font-semibold text-navy">1회용 복구 코드</p><p className="mt-2 text-sm leading-6 text-muted">작업 공간에서 발급한 코드는 30일 안에 한 번만 사용할 수 있습니다.</p></article>
          </section>

          <div className="mt-12 divide-y divide-border border-y border-border">
            <section className="grid gap-5 py-8 lg:grid-cols-[15rem_1fr]">
              <div><p className="font-mono text-xs text-gold">01 / ROLES</p><h2 className="mt-2 text-xl font-semibold text-navy">제품 제공자와 거래 지원</h2></div>
              <div className="max-w-3xl text-sm leading-7 text-muted">
                <p className="mb-4">Hoju Compass는 Resume Pro 디지털 제품을 제공하고 접근·기능 문제를 지원합니다. Stripe Managed Payments 결제의 거래상 판매자(Merchant of Record)와 결제·거래 지원 주체는 최종 결제 화면과 영수증에 표시된 정보를 기준으로 확인하세요. 실제 거래 문서를 확인하기 전에는 이 페이지에서 그 사업자명을 단정하지 않습니다.</p>
                <dl className="grid gap-x-5 gap-y-2 sm:grid-cols-[7rem_1fr]">
                  <dt className="font-semibold text-navy">제품 사업명</dt><dd>{seller.tradingName ?? "Hoju Compass"}</dd>
                  <dt className="font-semibold text-navy">제품 제공 사업자</dt><dd>{seller.legalName ?? "라이브 결제 전에 공개"}</dd>
                  <dt className="font-semibold text-navy">ABN</dt><dd>{seller.abn ?? "라이브 결제 전에 공개"}</dd>
                  <dt className="font-semibold text-navy">제품 지원</dt><dd>{seller.email ? <a className="font-semibold text-navy underline decoration-gold underline-offset-4" href={`mailto:${seller.email}`}>{seller.email}</a> : "준비 중"}</dd>
                </dl>
                {!sellerReady && <p className="mt-4 border-l-2 border-gold bg-surface p-4">제품 제공 사업자명과 ABN을 포함한 필수 정보가 모두 표시되기 전에는 실제 결제가 활성화되지 않습니다.</p>}
              </div>
            </section>

            <section className="grid gap-5 py-8 lg:grid-cols-[15rem_1fr]">
              <div><p className="font-mono text-xs text-gold">02 / DELIVERY</p><h2 className="mt-2 text-xl font-semibold text-navy">결제와 디지털 제공</h2></div>
              <div className="max-w-3xl space-y-3 text-sm leading-7 text-muted">
                <p>결제 화면과 거래는 Stripe Managed Payments가 처리하며 Hoju Compass는 전체 카드번호나 카드 보안번호를 직접 받지 않습니다. 결제·거래 관련 지원은 최종 결제 화면과 영수증에 표시된 거래 지원 경로를 이용할 수 있습니다. 결제가 완료되고 이용권 확인이 끝나야 작업 공간을 열 수 있습니다.</p>
                <p>웹훅 처리가 늦으면 결제 완료 화면에서 잠시 기다린 뒤 다시 확인할 수 있습니다. 결제는 확인됐지만 접근이 계속 열리지 않으면 지원 이메일로 제품명, 대략적인 결제 시각과 시간대, 영수증·인보이스 또는 결제 참조의 마지막 8자만 보내 주세요. 영수증·인보이스 원문이나 링크, 전체 Stripe ID, 카드번호 전체·일부 또는 보안번호는 보내지 마세요.</p>
                <Link href="/payment-help" className="inline-flex min-h-11 items-center font-semibold text-navy underline decoration-gold underline-offset-4">결제·접근 문제 해결 순서 보기 →</Link>
              </div>
            </section>

            <section className="grid gap-5 py-8 lg:grid-cols-[15rem_1fr]">
              <div><p className="font-mono text-xs text-gold">03 / RECEIPT</p><h2 className="mt-2 text-xl font-semibold text-navy">영수증과 인보이스</h2></div>
              <div className="max-w-3xl space-y-3 text-sm leading-7 text-muted">
                <p>결제 증빙에는 거래상 판매자 정보, 구매일, 제품 설명과 결제 금액이 식별될 수 있어야 합니다. Stripe Managed Payments가 적용된 결제에서는 결제 단계에 세금이 표시되고 거래 관련 영수증·인보이스가 제공될 수 있습니다. 실제 거래상 판매자명은 최종 결제 화면과 발급 문서를 기준으로 확인하세요.</p>
                <p>Resume Pro 검증에서는 A$19.90 총액 안에 GST가 구분 표시됐고 해당 결제의 세금 책임은 Managed Payments 쪽으로 기록됐습니다. Rental Application Pack Pro는 같은 방식의 테스트 결제와 환불 검증을 마치기 전에는 실제 판매를 열지 않습니다. 실제 구매의 세금 금액, 책임 주체와 문서 명칭은 최종 Stripe 결제 화면과 발급된 인보이스를 기준으로 확인하세요. Hoju Compass가 별도의 세율을 임의로 더하지 않습니다.</p>
              </div>
            </section>

            <section className="grid gap-5 py-8 lg:grid-cols-[15rem_1fr]">
              <div><p className="font-mono text-xs text-gold">04 / REMEDIES</p><h2 className="mt-2 text-xl font-semibold text-navy">문제 해결과 환불 요청</h2></div>
              <div className="max-w-3xl space-y-3 text-sm leading-7 text-muted">
                <p>단순 변심에 대한 환불은 자동으로 보장되지 않습니다. 다만 이 정책은 Australian Consumer Law에 따른 소비자 보장 권리를 제한하지 않습니다. 제품이 설명과 크게 다르거나 정상적으로 제공되지 않는 등 문제가 있다면 Hoju Compass가 제품 문제를 확인하고, 거래상 판매자와 필요한 절차를 조율해 적용되는 수리, 교체, 재제공 또는 환불 같은 해결 방법을 안내합니다.</p>
                <p>접근·기능 문제는 Hoju Compass 제품 지원으로, 결제·영수증·거래 환불 요청은 최종 결제 화면이나 영수증에 표시된 거래 지원 경로로 문의할 수 있습니다. 어느 경로를 먼저 이용하더라도 Australian Consumer Law에 따른 권리는 제한되지 않으며 Hoju Compass에도 제품 문제를 알릴 수 있습니다.</p>
                <p>요청할 때는 구매 이메일, 결제일, 제품명과 문제 상황을 알려 주세요. 카드번호, 비밀번호, 신분증 전체 사본은 보내지 마세요.</p>
                <a href="https://www.accc.gov.au/consumers/buying-products-and-services/consumer-rights-and-guarantees" target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center font-semibold text-navy underline decoration-gold underline-offset-4">ACCC 소비자 권리 안내 확인하기 ↗</a>
              </div>
            </section>

            <section className="grid gap-5 py-8 lg:grid-cols-[15rem_1fr]">
              <div><p className="font-mono text-xs text-gold">05 / DATA</p><h2 className="mt-2 text-xl font-semibold text-navy">결제와 작업 내용</h2></div>
              <div className="max-w-3xl space-y-3 text-sm leading-7 text-muted">
                <p>Stripe 결제 과정의 연락처와 결제 상태는 Stripe에서 처리됩니다. Hoju Compass 서버에는 이용권 제공과 환불·분쟁 대응에 필요한 결제 식별자, 이용권 상태와 처리 시각 같은 기술 기록이 저장될 수 있습니다.</p>
                <p>이력서·커버레터와 렌트 신청 준비 내용은 별도 안내가 없는 한 현재 브라우저에서 처리되며 결제 이용권 데이터베이스에 저장되지 않습니다. 원본 신분증, Payslip이나 은행 서류는 Rental Pack Pro에 업로드하지 않습니다. 자세한 내용은 <Link href="/privacy" className="font-semibold text-navy underline decoration-gold underline-offset-4">데이터와 개인정보 안내</Link>를 확인하세요.</p>
                <p>브라우저 작성 내용이나 이 기기의 이용 연결을 삭제하는 일은 결제 취소·환불 또는 거래 기록 삭제와 별개입니다. 삭제 요청을 받으면 더 이상 필요하지 않은 제품·지원 데이터와 세무·회계 또는 소비자 문제 대응에 필요할 수 있는 최소 거래 증거를 시스템별로 구분하며, 후자는 적용되는 보존기간 동안 제한된 목적으로 남을 수 있습니다.</p>
              </div>
            </section>
          </div>

          <section className="mt-10 border-l-2 border-gold bg-surface p-6 text-sm leading-7 text-muted">
            <h2 className="font-semibold text-navy">출시 전 확인 사항</h2>
            <p className="mt-1">이 페이지는 가격과 구매 절차를 알기 쉽게 설명하기 위한 안내이며 개인 상황에 대한 법률·세무 자문이 아닙니다. 결제 전에 <Link href="/terms" className="font-semibold text-navy underline decoration-gold underline-offset-4">서비스 이용 조건</Link>과 <Link href="/privacy" className="font-semibold text-navy underline decoration-gold underline-offset-4">데이터와 개인정보 안내</Link>도 함께 확인해 주세요.</p>
            <p className="mt-2 text-xs">구매 조건 안내 기준일: Resume Pro {resumeProPurchaseTermsVersion} · Rental Pack Pro {rentalApplicationProPurchaseTermsVersion}</p>
          </section>
        </Container>
      </main>
      <Footer />
    </>
  );
}
