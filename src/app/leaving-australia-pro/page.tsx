import Link from "next/link";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { BreadcrumbJsonLd } from "@/components/seo/JsonLd";
import { LeavingAustraliaProCheckoutForm } from "@/components/tools/LeavingAustraliaProCheckoutForm";
import { LeavingAustraliaProSample } from "@/components/tools/LeavingAustraliaProSample";
import { leavingSampleDraft } from "@/lib/leavingAustraliaSample";
import { createLeavingSummary } from "@/lib/leavingAustraliaSummary";
import { Container } from "@/components/ui/Container";
import { canCreateLeavingAustraliaTestCheckout, getLeavingAustraliaPaymentReadiness } from "@/lib/commerce";
import { normalizeLeavingAustraliaProEntry } from "@/lib/leavingAustraliaProAttribution";
import { createPageMetadata } from "@/lib/site";

export const metadata = createPageMetadata({ title: "출국 뒤에도 남는 정산을 끝까지 | Leaving Australia Pack Pro", description: "호주 출국 전후 해야 할 일과 Bond, 마지막 급여, 세금, DASP를 받을 때까지 확인할 날짜를 한곳에 정리하세요.", path: "/leaving-australia-pro" });

const sources = [
  { label: "ATO", title: "귀국 후 Tax return", href: "https://www.ato.gov.au/individuals-and-families/your-tax-return/how-to-lodge-your-tax-return/lodge-your-tax-return-from-outside-australia", body: "일반 신고 시기, 해외에서의 온라인 신고와 제한적인 조기 신고 조건을 확인합니다." },
  { label: "ATO", title: "DASP 신청", href: "https://www.ato.gov.au/individuals-and-families/super-for-individuals-and-families/super/temporary-residents-and-superannuation/departing-australia-superannuation-payment-dasp", body: "출국과 비자 종료 조건, 준비 정보, 처리 과정과 지급 확인 방법을 확인합니다." },
];

type Props = { searchParams: Promise<{ access?: string; checkout?: string; from?: string | string[] }> };

export default async function LeavingAustraliaProPage({ searchParams }: Props) {
  const { access, checkout, from } = await searchParams;
  const paymentReadiness = getLeavingAustraliaPaymentReadiness();
  const testCheckoutAvailable = canCreateLeavingAustraliaTestCheckout();
  const checkoutAvailable = paymentReadiness.ready || testCheckoutAvailable;
  const entry = normalizeLeavingAustraliaProEntry(Array.isArray(from) ? from[0] : from ?? null);

  return <>
    <BreadcrumbJsonLd items={[{ name: "홈", path: "/" }, { name: "귀국 준비 가이드", path: "/leaving-australia-guide" }, { name: "Leaving Australia Pack Pro", path: "/leaving-australia-pro" }]} />
    <Header />
    <main>
      <section className="border-b border-navy/15 py-8 sm:py-12">
        <Container>
          <Link href="/leaving-australia-guide" className="inline-flex min-h-11 items-center text-sm font-medium text-muted hover:text-navy">&larr; 무료 귀국 준비 가이드</Link>
          {access === "required" ? <div className="mt-5 border-l-2 border-gold bg-white p-4 text-sm leading-6 text-navy" role="alert">이 기기의 Leaving Australia Pack Pro 접근이 만료됐거나 확인되지 않았습니다. 결제 완료 화면에서 다시 열거나 이용권 복구를 사용해 주세요.</div> : null}{access === "released" ? <div className="mt-5 border-l-2 border-emerald-600 bg-white p-4 text-sm leading-6 text-navy" role="status"><p>이 기기의 Leaving Australia Pack Pro 접근을 안전하게 해제했습니다. 구매 이용권은 유지됩니다.</p><Link href="/data-transfer#leaving-australia-delete-heading" className="mt-3 inline-flex min-h-11 items-center font-semibold underline decoration-gold underline-offset-4">출국 준비 로컬 기록 삭제</Link></div> : null}{checkout === "cancelled" ? <div className="mt-5 border-l-2 border-navy/40 bg-white p-4 text-sm leading-6 text-navy" role="status">Stripe 결제 창에서 돌아왔습니다. 상태가 불명확하면 다시 결제하지 말고 <Link href="/payment-help" className="font-semibold underline decoration-gold underline-offset-4">결제 상태 확인 순서</Link>를 이용하세요.</div> : null}{checkout === "checkout_already_purchased" ? <div className="mt-5 border-l-2 border-emerald-600 bg-white p-4 text-sm leading-6 text-navy" role="status">이 기기의 이용권을 확인했습니다. <Link href="/leaving-australia-pro/workspace" className="font-semibold underline decoration-gold underline-offset-4">작업 공간에서 계속해 주세요</Link>.</div> : null}{checkout === "checkout_retry_later" || checkout === "checkout_sales_closed" ? <div className="mt-5 border-l-2 border-gold bg-white p-4 text-sm leading-6 text-navy" role="alert">다른 결제 확인 또는 통제된 첫 결제가 진행 중입니다. 새 결제를 시작하지 말고 잠시 뒤 확인해 주세요.</div> : null}{checkout === "checkout_unavailable" || checkout === "checkout_support_required" || checkout === "checkout_failed" ? <div className="mt-5 border-l-2 border-gold bg-white p-4 text-sm leading-6 text-navy" role="alert">현재 결제를 안전하게 시작할 수 없습니다. Stripe 화면을 이미 봤다면 재결제하지 말고 <Link href="/payment-help" className="font-semibold underline decoration-gold underline-offset-4">결제 상태 확인 순서</Link>를 이용하세요.</div> : null}
          <p className="mt-6 text-xs font-semibold uppercase tracking-[0.2em] text-[#80621a]">Leaving Australia Pack Pro</p>
          <h1 className="mt-3 max-w-4xl text-3xl font-semibold leading-tight tracking-tight text-navy [word-break:keep-all] sm:text-5xl">출국 뒤에도 확인할 돈과 연락이 여러 건 남았나요?</h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-muted">Bond·마지막 급여·DASP의 진행 상황, 다음 연락과 재확인일을 한곳에 기록하고 개인 인계 요약으로 저장하세요.</p>
          <div className="mt-6 grid gap-3 md:grid-cols-2" aria-label="무료 가이드와 Pro 선택 기준">
            <div className="rounded-xl border border-border bg-white p-5">
              <h2 className="font-semibold text-navy">순서와 조건만 확인하면 → 무료 가이드</h2>
              <p className="mt-2 text-sm leading-6 text-muted">귀국 체크리스트와 공식 신청 안내가 필요하거나, 이미 쓰는 메모로 충분할 때.</p>
              <Link href="/leaving-australia-guide" className="mt-2 inline-flex min-h-11 items-center text-sm font-semibold text-navy underline decoration-gold underline-offset-4">무료 가이드 사용 →</Link>
            </div>
            <div className="rounded-xl border border-navy/20 bg-navy/5 p-5">
              <h2 className="font-semibold text-navy">여러 정산을 반복 확인하면 → Pro</h2>
              <p className="mt-2 text-sm leading-6 text-muted">퇴사·퇴거·계정 정리 순서와 정산 기록을 묶고, 출국 뒤에도 누구에게 언제 다시 연락할지 남기고 싶을 때.</p>
              <a href="#leaving-result-sample" className="mt-2 inline-flex min-h-11 items-center text-sm font-semibold text-navy underline decoration-gold underline-offset-4">결제 전 결과물 보기 ↓</a>
            </div>
          </div>
        </Container>
      </section>
      <section id="leaving-result-sample" className="scroll-mt-24 py-8 sm:py-12" aria-labelledby="leaving-sample-heading">
        <Container>
          <p className="text-xs font-semibold text-[#80621a]">가상 예시 3건 · 개인정보 없음</p>
          <h2 id="leaving-sample-heading" className="mt-2 text-2xl font-semibold text-navy sm:text-3xl">요청한 일과 실제로 끝난 일을 구분합니다.</h2>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-muted">아래 금액·날짜·기관은 모두 설명용입니다. 재확인일은 개인 일정이며 법정 기한이나 자동 알림이 아닙니다. TXT는 작업 공간과 같은 내보내기 형식입니다.</p>
          <LeavingAustraliaProSample summary={createLeavingSummary(leavingSampleDraft)} />
        </Container>
      </section>
      <section className="border-y border-navy/15 bg-white py-8 sm:py-12" aria-labelledby="leaving-purchase-heading">
        <Container className="grid gap-7 lg:grid-cols-2">
          <div>
            <h2 id="leaving-purchase-heading" className="text-2xl font-semibold text-navy">이 방식이 맞다면, 내 출국 기록 시작하기</h2>
            <p className="mt-3 text-3xl font-semibold text-navy">A$12.90 <span className="text-sm font-normal text-muted">1회 결제 · 구독 없음</span></p>
            <p className="mt-3 text-sm leading-6 text-muted">한 번의 귀국 준비 프로젝트를 정리합니다. 기관 조회·신청 제출·DASP 예상액 계산을 대신하지 않습니다.</p>
            <dl className="mt-5 space-y-4 text-sm leading-6">
              <div><dt className="font-semibold text-navy">내 기록은 현재 브라우저에</dt><dd className="mt-1 text-muted">입력 내용은 서버와 자동 동기화되지 않습니다. 브라우저와 설치 앱(PWA)의 저장 공간은 다를 수 있습니다.</dd></div>
              <div><dt className="font-semibold text-navy">기기를 바꾸기 전에는 JSON 백업</dt><dd className="mt-1 text-muted">작업 공간에서 백업 파일을 저장하고, 새 기기에서 파일을 선택해 복원합니다. TXT는 읽기용 요약이며 기록 복원용이 아닙니다.</dd></div>
              <div><dt className="font-semibold text-navy">이용권 복구와 기록 복원은 별개</dt><dd className="mt-1 text-muted">이용권을 복구해도 지워진 로컬 기록은 돌아오지 않습니다. 기록은 별도로 보관한 JSON 백업이 필요합니다.</dd></div>
            </dl>
          </div>
          <div>
            {checkoutAvailable ? <div id="leaving-australia-pro-checkout" className="scroll-mt-24"><LeavingAustraliaProCheckoutForm testMode={testCheckoutAvailable} entry={entry} /></div> : <p className="border border-border bg-surface p-5 text-sm text-muted">현재 결제 미오픈 · 외부 결제 설정 전</p>}
            <p className="mt-4 text-xs leading-5 text-muted">{testCheckoutAvailable ? "현재 버튼은 Stripe 테스트 환경 전용이며 실제 카드 청구는 없습니다." : checkoutAvailable ? "결제는 Stripe의 보안 결제 페이지에서 진행되며 결제와 이용권 확인 뒤 작업 공간을 열 수 있어요." : "결제는 Stripe·Neon 설정과 출시 승인이 완료될 때까지 닫혀 있습니다."}</p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link href="/leaving-australia-pro/restore" className="inline-flex min-h-12 items-center justify-center rounded-lg border border-navy px-5 text-sm font-semibold text-navy">이미 구매했다면 이용권 복구</Link>
              <Link href="/leaving-australia-guide" className="inline-flex min-h-12 items-center px-2 text-sm font-semibold text-navy underline decoration-gold underline-offset-4">무료 가이드 계속 보기 →</Link>
            </div>
          </div>
        </Container>
      </section>
      <section className="py-8 sm:py-12" aria-labelledby="leaving-official-heading">
        <Container>
          <h2 id="leaving-official-heading" className="text-xl font-semibold text-navy">실제 신청과 조건 확인은 공식 페이지에서</h2>
          <p className="mt-2 text-sm leading-6 text-muted">민감한 번호와 원본 서류는 이 도구에 넣지 마세요. 신청 조건은 ATO 공식 안내에서 확인합니다.</p>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">{sources.map(source => <li key={source.href}><a href={source.href} target="_blank" rel="noreferrer" className="block min-h-12 rounded-lg border border-border bg-white p-5 hover:border-navy"><strong className="text-sm text-navy">{source.label} · {source.title} ↗</strong><p className="mt-2 text-sm leading-6 text-muted">{source.body}</p></a></li>)}</ul>
        </Container>
      </section>
    </main>
    <Footer />
  </>;
}
