import Link from "next/link";

import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { BreadcrumbJsonLd } from "@/components/seo/JsonLd";
import { Container } from "@/components/ui/Container";
import { getProPurchaseInformation } from "@/lib/proPurchaseInformation";
import { getPublicSellerDetails } from "@/lib/publicSeller";
import { createPageMetadata } from "@/lib/site";

export const metadata = createPageMetadata({
  title: "서비스 이용 조건 | Hoju Compass",
  description: "Hoju Compass 무료 도구와 Pro 제품의 이용 범위, 결제, 디지털 제공, 데이터 보관과 소비자 권리를 확인하세요.",
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
  const products = getProPurchaseInformation();

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
              <p className="mt-5 leading-7 text-muted">무료 도구와 Pro 제품이 제공하는 범위, 결제 후 접근 방법과 문제가 생겼을 때의 절차를 읽기 쉽게 정리했습니다.</p>
            </div>
            <aside className="border-l-2 border-gold pl-5 text-sm leading-6 text-muted">
              <strong className="block text-navy">현재 적용 버전</strong>
              {products.map(product => <span key={product.id} className="mt-1 block">{product.name} · {product.termsVersion}</span>)}
              <span className="mt-2 block text-xs">결제할 때 확인한 버전이 구매 기록에 함께 남습니다.</span>
            </aside>
          </div>

          <section className="mt-10 grid gap-5 md:grid-cols-3" aria-label="핵심 이용 조건">
            <article className="border-t-2 border-gold bg-white p-5"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">Free tools</p><h2 className="mt-3 text-xl font-semibold text-navy">무료 도구는 계속 무료</h2><p className="mt-2 text-sm leading-6 text-muted">기본 이력서 작성, 계산기와 체크리스트는 별도의 결제 없이 이용할 수 있습니다.</p></article>
            <article className="border-t-2 border-navy bg-white p-5"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">제품별 AUD 가격</p><h2 className="mt-3 text-xl font-semibold text-navy">자동 갱신 없는 1회 결제</h2><ul className="mt-3 space-y-2 text-sm leading-6 text-navy">{products.map(product => <li key={product.id}><Link href={product.href} className="underline decoration-gold underline-offset-4">{product.name}</Link> · {product.price}</li>)}</ul><p className="mt-3 text-sm leading-6 text-muted">결제가 열린 제품만 구매할 수 있습니다. 실제 총액과 세금 표시는 Stripe 결제 화면에서 최종 확인합니다.</p></article>
            <article className="border-t-2 border-navy bg-white p-5"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">Consumer rights</p><h2 className="mt-3 text-xl font-semibold text-navy">법에서 보장하는 권리는 그대로</h2><p className="mt-2 text-sm leading-6 text-muted">이 조건은 Australian Consumer Law에 따른 소비자 보장 권리를 제한하지 않습니다.</p></article>
          </section>

          <div className="mt-12 divide-y divide-border border-y border-border">
            <section className="grid gap-5 py-8 lg:grid-cols-[15rem_1fr]">
              <div><p className="font-mono text-xs text-gold">01 / FREE</p><h2 className="mt-2 text-xl font-semibold text-navy">무료 도구 이용</h2></div>
              <ul className="max-w-3xl space-y-3 text-sm leading-7 text-muted">{freeToolConditions.map((item) => <li key={item}>• {item}</li>)}</ul>
            </section>

            <section className="grid gap-5 py-8 lg:grid-cols-[15rem_1fr]">
              <div><p className="font-mono text-xs text-gold">02 / PRODUCT</p><h2 className="mt-2 text-xl font-semibold text-navy">Pro 제품에서 받는 것</h2></div>
              <div className="max-w-3xl space-y-3 text-sm leading-7 text-muted">
                <p>Resume Pro는 프리미엄 이력서 레이아웃, 커버레터 작성 도구, 채용 공고 표현 점검과 회사별 지원서 정리를 제공하는 브라우저 기반 디지털 작업 공간입니다.</p>
                <p>Rental Application Pack Pro는 렌트 신청 서류의 준비 상태, 개인정보 점검, 영문 소개문과 집 후보별 준비 요약을 제공하는 브라우저 기반 디지털 작업 공간입니다. 신분증·Payslip·은행 서류 원본은 받거나 제출하지 않습니다.</p>
                <p>Pay Evidence Pack Pro는 근무 기록과 Payslip 금액의 대조, 증빙 상태와 영문 확인 요청문을 정리하는 작업 공간입니다.</p>
                <p>EOFY Pack Pro는 회계연도별 소득·공제 준비 자료와 세무사에게 물을 질문을 정리하는 작업 공간입니다.</p>
                <p>Leaving Australia Pack Pro는 출국 준비 작업과 Bond·마지막 급여·DASP 등 후속 정산의 질문·연락·결과 메모를 정리하는 작업 공간입니다.</p>
                <p>채용 합격, 면접 기회, 고용주 응답 또는 특정 결과를 보장하지 않습니다. 사용자는 생성된 문장을 자신의 실제 경험과 지원 직무에 맞게 확인하고 수정해야 합니다.</p>
                <p>Rental Application Pack Pro도 임대 승인, 에이전트 응답 또는 특정 집의 계약을 보장하지 않으며 신청서 제출이나 법률 자문을 대신하지 않습니다.</p>
                <p>Pay Evidence Pack Pro는 임금 지급이나 체불 여부를 판정·보장하거나 신고를 대행하지 않습니다. 사용자는 기록을 정리한 뒤 문의·신고에 쓸 자료를 확인하고 Fair Work 또는 전문가의 답변을 확인해야 합니다.</p>
                <p>EOFY Pack Pro는 세금 신고 결과·공제 가능 여부·환급액을 판정하거나 신고를 대행하지 않습니다. 사용자는 기록과 질문을 정리한 뒤 ATO 자료 또는 등록 세무사의 답변을 확인해야 합니다.</p>
                <p>Leaving Australia Pack Pro는 Bond 반환, 마지막 급여 또는 DASP 처리를 판정·보장하거나 대신 신청하지 않습니다. 사용자는 후속 기록을 정리하고 문의에 쓸 자료를 확인한 뒤 관련 기관 또는 전문가의 답변을 확인해야 합니다.</p>
              </div>
            </section>

            <section className="grid gap-5 py-8 lg:grid-cols-[15rem_1fr]">
              <div><p className="font-mono text-xs text-gold">03 / PAYMENT</p><h2 className="mt-2 text-xl font-semibold text-navy">결제와 제공 방식</h2></div>
              <div className="max-w-3xl space-y-3 text-sm leading-7 text-muted">
                <p>위 가격표의 Pro 제품은 AUD 기준 1회 결제 상품입니다. 제품별 결제가 열린 경우에만 Stripe 화면으로 이동하며, 결제 전에 최종 금액·결제수단·인보이스 정보를 확인할 수 있습니다. Hoju Compass는 전체 카드번호나 CVC를 직접 받지 않습니다. Car Purchase Pack Pro의 가격·구매 조건은 준비 중이며 현재 구매할 수 없습니다.</p>
                <p>Hoju Compass는 Pro 디지털 제품 제공과 이용권·접근·기능 지원을 담당합니다. Stripe 공식 안내 기준으로, Managed Payments Checkout에서는 Stripe의 Link가 거래상 판매자(Merchant of Record)로 표시되고 거래 단위 지원을 제공합니다. Stripe는 Managed Payments를 운영하며 지원되는 국가의 간접세 계산·징수·신고·납부를 처리합니다.</p>
                <p>실제 거래의 판매자 명칭, 문서 발행자와 거래 지원 경로는 최종 결제 화면과 실제 발급 문서에 명확히 표시된 경우에만 그 문서를 기준으로 확인합니다. 명확하지 않으면 추정하지 말고 Hoju Compass 제품 지원으로 문의하세요.</p>
                <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:gap-x-5">
                  <a href="https://docs.stripe.com/payments/managed-payments/set-up#testing" target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center font-semibold text-navy underline decoration-gold underline-offset-4">Stripe 공식 Checkout 역할 안내 ↗</a>
                  <a href="https://docs.stripe.com/payments/managed-payments/how-it-works" target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center font-semibold text-navy underline decoration-gold underline-offset-4">Managed Payments 처리 범위 ↗</a>
                </div>
                <p>결제가 확인되면 현재 기기에 해당 제품 전용 30일 접근 세션을 발급합니다. 30일은 구매 이용권의 소멸일이 아니라 이 기기의 이용 확인 기간이며, 활성 이용권은 제품별 복구 절차를 통해 다시 연결할 수 있습니다. 한 제품의 이용권·접근 쿠키·복구 코드는 다른 Pro 제품을 열지 않습니다.</p>
                <p>새 기기로 옮길 때 사용하는 복구 코드는 발급 후 30일 안에 한 번만 사용할 수 있습니다. 새 코드를 만들면 이전에 사용하지 않은 코드는 무효화됩니다.</p>
                <Link href="/purchase-information" className="inline-flex min-h-11 items-center font-semibold text-navy underline decoration-gold underline-offset-4">가격·제공·환불 안내 자세히 보기 →</Link>
              </div>
            </section>

            <section className="grid gap-5 py-8 lg:grid-cols-[15rem_1fr]">
              <div><p className="font-mono text-xs text-gold">04 / YOUR DATA</p><h2 className="mt-2 text-xl font-semibold text-navy">작성 내용과 백업</h2></div>
              <div className="max-w-3xl space-y-3 text-sm leading-7 text-muted">
                <p>이력서·커버레터, 렌트 신청 준비, Pay Evidence 급여 대조, EOFY 세금 준비, Leaving 출국·정산 기록과 현재 준비 중인 Car Purchase 작업 공간의 재사용 초안은 별도 안내가 없는 한 현재 브라우저에서 처리됩니다. 결제 이용권 데이터베이스에는 작업 공간의 문서 원문이나 원본 증빙을 저장하지 않습니다. Car Purchase Pack Pro는 가격·구매 조건 준비 중이고 결제 미오픈이므로 현재 구매 이용권을 제공하지 않습니다.</p>
                <p>브라우저 사이트 데이터를 지우거나 기기를 바꾸면 로컬 작성 내용이 사라질 수 있습니다. 중요한 결과물은 도구별 PDF·TXT·archive로 보관하거나 <Link href="/data-transfer" className="font-semibold text-navy underline decoration-gold underline-offset-4">데이터 백업·이전</Link>에서 선택한 작성 원문을 JSON으로 백업해 주세요. 이 기기 백업에는 구매 이용권·접근 쿠키·복구 코드나 nonce가 포함되지 않으며, 이용권은 <Link href="/payment-help" className="font-semibold text-navy underline decoration-gold underline-offset-4">제품별 결제·접근 복구 절차</Link>로 다시 연결해야 합니다.</p>
                <Link href="/privacy" className="inline-flex min-h-11 items-center font-semibold text-navy underline decoration-gold underline-offset-4">데이터와 개인정보 안내 보기 →</Link>
              </div>
            </section>

            <section className="grid gap-5 py-8 lg:grid-cols-[15rem_1fr]">
              <div><p className="font-mono text-xs text-gold">05 / FAIR USE</p><h2 className="mt-2 text-xl font-semibold text-navy">안전하고 정직한 이용</h2></div>
              <div className="max-w-3xl space-y-3 text-sm leading-7 text-muted">
                <p>타인의 개인정보, 저작물 또는 계정에 대한 권리를 침해하거나 불법·기만적인 취업·렌트 지원서를 만드는 데 서비스를 사용해서는 안 됩니다. 다른 사람의 경력, 소득, 임대 이력이나 자격을 자신의 것처럼 작성하지 마세요.</p>
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
                <div className="mb-4 space-y-3">
                  <p>아래 정보는 Pro 디지털 제품 제공과 이용권·접근·기능 지원을 담당하는 Hoju Compass의 사업자 정보입니다. Stripe 공식 안내 기준으로, Managed Payments Checkout에서는 Stripe의 Link가 거래상 판매자(Merchant of Record)로 표시되고 거래 단위 지원을 제공합니다. Stripe는 Managed Payments를 운영하며 지원되는 국가의 간접세 계산·징수·신고·납부를 처리합니다.</p>
                  <p>실제 거래의 판매자 명칭, 문서 발행자와 거래 지원 경로는 최종 결제 화면과 실제 발급 문서에 명확히 표시된 경우에만 그 문서를 기준으로 확인하세요. 명확하지 않으면 추정하지 말고 Hoju Compass 제품 지원으로 문의하세요.</p>
                </div>
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
