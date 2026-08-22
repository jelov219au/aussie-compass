import Link from "next/link";

import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { BreadcrumbJsonLd } from "@/components/seo/JsonLd";
import { Container } from "@/components/ui/Container";
import { resumeProProduct, resumeProPurchaseTermsVersion } from "@/lib/commerce";
import { getPublicSellerDetails } from "@/lib/publicSeller";
import { createPageMetadata } from "@/lib/site";

export const metadata = createPageMetadata({
  title: "서비스 이용 조건 | Hoju Compass",
  description: "Hoju Compass 무료 도구와 Resume Pro의 이용 범위, 결제, 디지털 제공, 데이터 보관과 소비자 권리를 확인하세요.",
  path: "/terms",
});

export const dynamic = "force-dynamic";

const freeToolConditions = [
  "계산 결과와 체크리스트는 일반적인 정보 정리를 돕기 위한 것이며 개인 상황에 대한 비자·법률·세무·의료 자문이 아닙니다.",
  "공식 기준과 날짜는 바뀔 수 있으므로 중요한 결정을 내리기 전에 연결된 정부기관 또는 전문가의 최신 안내를 확인해 주세요.",
  "별도 안내가 없는 도구 입력값은 현재 브라우저에 저장됩니다. 공용 기기에서는 이용 후 내용을 지우고, 필요한 자료는 직접 백업해 주세요.",
];

export default function TermsPage() {
  const seller = getPublicSellerDetails();
  const price = `A$${(resumeProProduct.priceCents / 100).toFixed(2)}`;

  return (
    <>
      <BreadcrumbJsonLd items={[{ name: "홈", path: "/" }, { name: "서비스 이용 조건", path: "/terms" }]} />
      <Header />
      <main className="py-12 sm:py-16">
        <Container className="max-w-6xl">
          <Link href="/" className="inline-flex min-h-11 items-center text-sm font-medium text-muted hover:text-navy">&larr; 홈으로 돌아가기</Link>

          <div className="mt-8 grid gap-8 border-b border-navy/20 pb-10 lg:grid-cols-[1fr_18rem] lg:items-end">
            <div className="max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">Service terms</p>
              <h1 className="mt-3 text-4xl font-semibold tracking-tight text-navy sm:text-5xl">이용 전에 서로의 약속을 확인해요.</h1>
              <p className="mt-5 leading-7 text-muted">무료 도구와 Resume Pro가 제공하는 범위, 결제 후 접근 방법과 문제가 생겼을 때의 절차를 읽기 쉽게 정리했습니다.</p>
            </div>
            <aside className="border-l-2 border-gold pl-5 text-sm leading-6 text-muted">
              <strong className="block text-navy">현재 적용 버전</strong>
              <span className="mt-1 block">{resumeProPurchaseTermsVersion}</span>
              <span className="mt-2 block text-xs">결제할 때 확인한 버전이 구매 기록에 함께 남습니다.</span>
            </aside>
          </div>

          <section className="mt-10 grid gap-5 md:grid-cols-3" aria-label="핵심 이용 조건">
            <article className="border-t-2 border-gold bg-white p-5"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">Free tools</p><h2 className="mt-3 text-xl font-semibold text-navy">무료 도구는 계속 무료</h2><p className="mt-2 text-sm leading-6 text-muted">기본 이력서 작성, 계산기와 체크리스트는 별도의 결제 없이 이용할 수 있습니다.</p></article>
            <article className="border-t-2 border-navy bg-white p-5"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">Resume Pro</p><h2 className="mt-3 text-xl font-semibold text-navy">{price} AUD 1회 결제</h2><p className="mt-2 text-sm leading-6 text-muted">자동 갱신 구독이 아니며 실제 총액과 세금 표시는 Stripe 결제 화면에서 최종 확인합니다.</p></article>
            <article className="border-t-2 border-navy bg-white p-5"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">Consumer rights</p><h2 className="mt-3 text-xl font-semibold text-navy">법에서 보장하는 권리는 그대로</h2><p className="mt-2 text-sm leading-6 text-muted">이 조건은 Australian Consumer Law에 따른 소비자 보장 권리를 제한하지 않습니다.</p></article>
          </section>

          <div className="mt-12 divide-y divide-border border-y border-border">
            <section className="grid gap-5 py-8 lg:grid-cols-[15rem_1fr]">
              <div><p className="font-mono text-xs text-gold">01 / FREE</p><h2 className="mt-2 text-xl font-semibold text-navy">무료 도구 이용</h2></div>
              <ul className="max-w-3xl space-y-3 text-sm leading-7 text-muted">{freeToolConditions.map((item) => <li key={item}>• {item}</li>)}</ul>
            </section>

            <section className="grid gap-5 py-8 lg:grid-cols-[15rem_1fr]">
              <div><p className="font-mono text-xs text-gold">02 / PRODUCT</p><h2 className="mt-2 text-xl font-semibold text-navy">Resume Pro에서 받는 것</h2></div>
              <div className="max-w-3xl space-y-3 text-sm leading-7 text-muted">
                <p>Resume Pro는 프리미엄 이력서 레이아웃, 커버레터 작성 도구, 채용 공고 표현 점검과 회사별 지원서 정리를 제공하는 브라우저 기반 디지털 작업 공간입니다.</p>
                <p>채용 합격, 면접 기회, 고용주 응답 또는 특정 결과를 보장하지 않습니다. 사용자는 생성된 문장을 자신의 실제 경험과 지원 직무에 맞게 확인하고 수정해야 합니다.</p>
              </div>
            </section>

            <section className="grid gap-5 py-8 lg:grid-cols-[15rem_1fr]">
              <div><p className="font-mono text-xs text-gold">03 / PAYMENT</p><h2 className="mt-2 text-xl font-semibold text-navy">결제와 제공 방식</h2></div>
              <div className="max-w-3xl space-y-3 text-sm leading-7 text-muted">
                <p>Resume Pro는 {price} AUD 1회 결제 상품입니다. 결제 전에 Stripe 화면에서 최종 금액, 결제수단과 인보이스 정보를 확인할 수 있으며 Hoju Compass는 전체 카드번호나 CVC를 직접 받지 않습니다.</p>
                <p>Stripe Managed Payments 결제의 거래상 판매자(Merchant of Record)와 결제·거래 지원 주체는 최종 결제 화면과 영수증에 표시된 정보를 기준으로 확인합니다. Hoju Compass는 Resume Pro 제품 제공과 접근·기능 지원을 담당하며, 실제 거래 문서를 확인하기 전에는 이 조건에서 거래상 판매자의 사업자명을 단정하지 않습니다.</p>
                <p>결제가 확인되면 현재 기기에서 30일 동안 Resume Pro를 열 수 있도록 연결합니다. 30일은 구매 이용권의 소멸일이 아니라 이 기기의 이용 확인 기간이며, 활성 이용권은 복구 절차를 통해 다시 연결할 수 있습니다.</p>
                <p>새 기기로 옮길 때 사용하는 복구 코드는 발급 후 30일 안에 한 번만 사용할 수 있습니다. 새 코드를 만들면 이전에 사용하지 않은 코드는 무효화됩니다.</p>
                <Link href="/purchase-information" className="inline-flex min-h-11 items-center font-semibold text-navy underline decoration-gold underline-offset-4">가격·제공·환불 안내 자세히 보기 →</Link>
              </div>
            </section>

            <section className="grid gap-5 py-8 lg:grid-cols-[15rem_1fr]">
              <div><p className="font-mono text-xs text-gold">04 / YOUR DATA</p><h2 className="mt-2 text-xl font-semibold text-navy">작성 내용과 백업</h2></div>
              <div className="max-w-3xl space-y-3 text-sm leading-7 text-muted">
                <p>이력서와 커버레터 내용은 별도 안내가 없는 한 현재 브라우저에서 처리됩니다. 결제 이용권 데이터베이스에는 작업 공간의 문서 원문을 저장하지 않습니다.</p>
                <p>브라우저 사이트 데이터를 지우거나 기기를 바꾸면 로컬 작성 내용이 사라질 수 있습니다. 중요한 지원서는 PDF 또는 백업 파일로 직접 보관해 주세요.</p>
                <Link href="/privacy" className="inline-flex min-h-11 items-center font-semibold text-navy underline decoration-gold underline-offset-4">데이터와 개인정보 안내 보기 →</Link>
              </div>
            </section>

            <section className="grid gap-5 py-8 lg:grid-cols-[15rem_1fr]">
              <div><p className="font-mono text-xs text-gold">05 / FAIR USE</p><h2 className="mt-2 text-xl font-semibold text-navy">안전하고 정직한 이용</h2></div>
              <div className="max-w-3xl space-y-3 text-sm leading-7 text-muted">
                <p>타인의 개인정보, 저작물 또는 계정에 대한 권리를 침해하거나 불법·기만적인 지원서를 만드는 데 서비스를 사용해서는 안 됩니다. 다른 사람의 경력이나 자격을 자신의 것처럼 작성하지 마세요.</p>
                <p>서비스 보안이나 접근 제한을 우회하거나, 자동화된 방식으로 사이트 운영에 과도한 부담을 주거나, 이용권·복구 코드를 판매 또는 공개해서는 안 됩니다.</p>
              </div>
            </section>

            <section className="grid gap-5 py-8 lg:grid-cols-[15rem_1fr]">
              <div><p className="font-mono text-xs text-gold">06 / PROBLEMS</p><h2 className="mt-2 text-xl font-semibold text-navy">오류·중단과 해결 방법</h2></div>
              <div className="max-w-3xl space-y-3 text-sm leading-7 text-muted">
                <p>보안 업데이트, 장애 또는 유지보수로 서비스가 일시적으로 중단될 수 있습니다. 결제한 기능이 정상적으로 제공되지 않으면 Hoju Compass가 먼저 재접속·복구 절차를 안내하고, 해결되지 않으면 거래상 판매자와 필요한 절차를 조율해 문제의 성격과 적용 법률에 따라 재제공, 수정 또는 환불 같은 해결 방법을 확인합니다.</p>
                <p>Australian Consumer Law의 소비자 보장은 자동으로 적용되며 이 이용 조건으로 제외되지 않습니다. 문제의 정도에 따라 가능한 해결 방법은 달라질 수 있습니다.</p>
                <div className="flex flex-col gap-2 sm:flex-row sm:gap-6">
                  <Link href="/payment-help" className="inline-flex min-h-11 items-center font-semibold text-navy underline decoration-gold underline-offset-4">결제·접근 문제 해결 →</Link>
                  <a href="https://www.accc.gov.au/consumers/buying-products-and-services/consumer-rights-and-guarantees" target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center font-semibold text-navy underline decoration-gold underline-offset-4">ACCC 소비자 권리 안내 ↗</a>
                </div>
              </div>
            </section>

            <section className="grid gap-5 py-8 lg:grid-cols-[15rem_1fr]">
              <div><p className="font-mono text-xs text-gold">07 / ROLES</p><h2 className="mt-2 text-xl font-semibold text-navy">제품 제공자와 거래 지원</h2></div>
              <div className="max-w-3xl text-sm leading-7 text-muted">
                <p className="mb-4">아래 정보는 Resume Pro 제품을 제공하고 접근·기능 문제를 지원하는 Hoju Compass의 사업자 정보입니다. Managed Payments 거래상 판매자와 결제·거래 지원 정보는 최종 결제 화면과 영수증에서 확인하세요.</p>
                <dl className="grid gap-x-5 gap-y-2 sm:grid-cols-[7rem_1fr]">
                  <dt className="font-semibold text-navy">제품 사업명</dt><dd>{seller.tradingName ?? "Hoju Compass"}</dd>
                  <dt className="font-semibold text-navy">제품 제공 사업자</dt><dd>{seller.legalName ?? "라이브 결제 전에 공개"}</dd>
                  <dt className="font-semibold text-navy">ABN</dt><dd>{seller.abn ?? "라이브 결제 전에 공개"}</dd>
                  <dt className="font-semibold text-navy">제품 지원</dt><dd>{seller.email ? <a href={`mailto:${seller.email}`} className="font-semibold text-navy underline decoration-gold underline-offset-4">{seller.email}</a> : "준비 중"}</dd>
                </dl>
                {(!seller.legalName || !seller.abn) && <p className="mt-4 border-l-2 border-gold bg-surface p-4">제품 제공 사업자명과 ABN이 모두 표시되기 전에는 실제 결제가 열리지 않습니다.</p>}
                <Link href="/contact" className="mt-4 inline-flex min-h-11 items-center font-semibold text-navy underline decoration-gold underline-offset-4">Hoju Compass에 문의하기 →</Link>
              </div>
            </section>
          </div>

          <section className="mt-10 border-l-2 border-gold bg-surface p-6 text-sm leading-7 text-muted">
            <h2 className="font-semibold text-navy">조건이 바뀌는 경우</h2>
            <p className="mt-1">제품 기능이나 데이터 처리 방식이 달라지면 이 페이지의 버전과 설명을 갱신합니다. 이미 완료된 구매에는 구매할 때 확인하고 기록된 조건과 당시 법적 권리가 적용됩니다.</p>
            <p className="mt-2">이 페이지는 서비스 범위를 알기 쉽게 설명하기 위한 것이며 개인 상황에 대한 법률 자문이 아닙니다.</p>
          </section>
        </Container>
      </main>
      <Footer />
    </>
  );
}
