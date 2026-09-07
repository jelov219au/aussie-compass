import Link from "next/link";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { BreadcrumbJsonLd } from "@/components/seo/JsonLd";
import { PayEvidenceProCheckoutForm } from "@/components/tools/PayEvidenceProCheckoutForm";
import { PayEvidenceOutputPreview } from "@/components/tools/PayEvidenceOutputPreview";
import { Container } from "@/components/ui/Container";
import { canCreatePayEvidenceTestCheckout, getPayEvidencePaymentReadiness } from "@/lib/commerce";
import { normalizePayEvidenceProEntry } from "@/lib/payEvidenceProAttribution";
import { createPageMetadata } from "@/lib/site";

export const metadata = createPageMetadata({ title: "급여가 이상할 때 확인할 기록부터 | Pay Evidence Pro", description: "급여가 이상하다는 느낌을 근무시간, Payslip Gross·Net, 실제 입금액, 증빙표와 영문 문의문으로 정리하세요.", path: "/pay-evidence-pro" });
const sources = [
  { label: "Fair Work", title: "Pay slips와 기록 의무", href: "https://www.fairwork.gov.au/tools-and-resources/fact-sheets/rights-and-obligations/record-keeping-pay-slips", body: "Pay slip 필수 정보, 급여·근무시간 기록과 직원의 기록 열람 범위를 확인합니다." },
  { label: "Fair Work", title: "임금 지급에 포함되는 시간", href: "https://www.fairwork.gov.au/pay-and-wages/paying-wages", body: "회의, 교육, 오픈·마감처럼 고용주가 요구한 업무시간이 어떻게 다뤄지는지 확인합니다." },
  { label: "Fair Work", title: "직장 문제 도움 요청", href: "https://www.fairwork.gov.au/workplace-problems/fixing-a-workplace-problem/resolving-disputes-with-our-help", body: "고용주와 직접 해결되지 않았을 때 무료 Dispute Assistance 범위와 공식 지원 경로를 확인합니다." },
];

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ access?: string; checkout?: string; from?: string | string[] }> };

export default async function PayEvidenceProPage({ searchParams }: Props) {
  const { access, checkout, from } = await searchParams;
  const paymentReadiness = getPayEvidencePaymentReadiness();
  const testCheckoutAvailable = canCreatePayEvidenceTestCheckout();
  const checkoutAvailable = paymentReadiness.ready || testCheckoutAvailable;
  const entry = normalizePayEvidenceProEntry(Array.isArray(from) ? from[0] : from ?? null);

  return <>
    <BreadcrumbJsonLd items={[{ name: "홈", path: "/" }, { name: "급여가 적게 들어왔다면", path: "/underpayment-guide" }, { name: "Pay Evidence Pack Pro", path: "/pay-evidence-pro" }]} />
    <Header />
    <main>
      <section className="border-b border-navy/15 py-8 sm:py-12"><Container>
        <Link href="/underpayment-guide" className="inline-flex min-h-11 items-center text-sm font-medium text-muted hover:text-navy">&larr; 무료 미지급 급여 가이드</Link>
      {access === "required" && <div className="mt-5 border-l-2 border-gold bg-white p-4 text-sm leading-6 text-navy" role="alert">이 기기의 Pay Evidence Pack Pro 접근이 만료됐거나 확인되지 않았습니다. 결제 완료 화면에서 다시 열거나 이용권 복구를 사용해 주세요.</div>}
      {access === "released" && <div className="mt-5 border-l-2 border-emerald-600 bg-white p-4 text-sm leading-6 text-navy" role="status"><p>이 기기의 Pay Evidence Pack Pro 접근을 안전하게 해제했습니다. 구매 이용권은 유지됩니다.</p><Link href="/data-transfer#pay-evidence-delete-heading" className="mt-3 inline-flex min-h-12 items-center justify-center border border-navy px-4 py-2 font-semibold text-navy">Pay Evidence 로컬 기록 삭제</Link></div>}
      {checkout === "cancelled" && <div className="mt-5 border-l-2 border-navy/40 bg-white p-4 text-sm leading-6 text-navy" role="status">Stripe 결제 창에서 돌아왔습니다. 상태가 불명확하면 다시 결제하지 말고 <Link href="/payment-help" className="font-semibold underline decoration-gold underline-offset-4">결제 상태 확인 순서</Link>를 이용하세요.</div>}
      {checkout === "checkout_already_purchased" && <div className="mt-5 border-l-2 border-emerald-600 bg-white p-4 text-sm leading-6 text-navy" role="status">이 기기의 이용권을 확인했습니다. <Link href="/pay-evidence-pro/workspace" className="font-semibold underline decoration-gold underline-offset-4">작업공간에서 계속해 주세요</Link>.</div>}
      {(checkout === "checkout_retry_later" || checkout === "checkout_sales_closed") && <div className="mt-5 border-l-2 border-gold bg-white p-4 text-sm leading-6 text-navy" role="alert">다른 결제 확인 또는 통제된 첫 결제가 진행 중입니다. 새 결제를 시작하지 말고 잠시 뒤 확인해 주세요.</div>}
      {(checkout === "checkout_unavailable" || checkout === "checkout_support_required" || checkout === "checkout_failed") && <div className="mt-5 border-l-2 border-gold bg-white p-4 text-sm leading-6 text-navy" role="alert">현재 결제를 안전하게 시작할 수 없습니다. Stripe 화면을 이미 봤다면 재결제하지 말고 <Link href="/payment-help" className="font-semibold underline decoration-gold underline-offset-4">결제 상태 확인 순서</Link>를 이용하세요.</div>}

        <p className="mt-6 text-xs font-semibold uppercase tracking-[0.2em] text-[#80621a]">Pay Evidence Pack Pro</p>
        <h1 className="mt-3 max-w-4xl text-3xl font-semibold leading-tight tracking-tight text-navy [word-break:keep-all] sm:text-5xl">급여가 이상할 때,<br />확인할 기록부터 한곳에.</h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-muted">근무시간으로 계산한 기대 Gross와 Payslip Gross를 비교하고, Payslip Net과 실제 입금 Net은 별도로 대조합니다. 차이와 증빙 상태를 정리해 물어볼 내용을 남기세요.</p>
        <div className="mt-6 grid gap-3 md:grid-cols-2" aria-label="무료 가이드와 Pro 선택 기준">
          <div className="rounded-xl border border-border bg-white p-5"><h2 className="font-semibold text-navy">확인 순서와 공식 기준이 필요하면 → 무료</h2><p className="mt-2 text-sm leading-6 text-muted">최저임금·Award 확인과 대응 순서를 찾거나, 한 번의 계산과 기존 메모로 충분할 때.</p><Link href="/underpayment-guide" className="mt-2 inline-flex min-h-11 items-center text-sm font-semibold text-navy underline decoration-gold underline-offset-4">무료 대응 가이드 →</Link></div>
          <div className="rounded-xl border border-navy/20 bg-navy/5 p-5"><h2 className="font-semibold text-navy">여러 기간의 기록을 정리하려면 → Pro</h2><p className="mt-2 text-sm leading-6 text-muted">Shift 계산·급여기간 비교·증빙 상태와 영문 문의문을 묶어 TXT·CSV로 남기고 싶을 때.</p><a href="#pay-output-preview" className="mt-2 inline-flex min-h-11 items-center text-sm font-semibold text-navy underline decoration-gold underline-offset-4">결제 전 가상 결과물 보기 ↓</a></div>
        </div>
      </Container></section>
      <Container><PayEvidenceOutputPreview /></Container>
      <section className="border-y border-navy/15 bg-white py-8 sm:py-12" aria-labelledby="pay-purchase-heading"><Container className="grid gap-7 lg:grid-cols-2">
        <div>
          <h2 id="pay-purchase-heading" className="text-2xl font-semibold text-navy">이 방식이 맞다면, 내 급여 기록 시작하기</h2>
          <p className="mt-3 text-3xl font-semibold text-navy">A$9.90 <span className="text-sm font-normal text-muted">1회 결제 · 구독 없음</span></p>
          <p className="mt-3 text-sm leading-6 text-muted">원본 급여자료를 업로드하지 않습니다. Award·Classification·권리나 법적 미지급액을 판정하지 않으며 고용주 연락·Fair Work 신고를 대신하지 않습니다.</p>
          <dl className="mt-5 space-y-4 text-sm leading-6">
            <div><dt className="font-semibold text-navy">기록은 현재 브라우저에 저장</dt><dd className="mt-1 text-muted">서버와 자동 동기화되지 않습니다. 브라우저·설치 앱(PWA)·기기마다 저장 공간이 다를 수 있습니다.</dd></div>
            <div><dt className="font-semibold text-navy">기기를 옮기기 전에는 사건 JSON 백업</dt><dd className="mt-1 text-muted">새 기기에서 백업 파일을 검토한 뒤 복원합니다. TXT·CSV는 확인·전달용이며 복원 파일이 아닙니다.</dd></div>
            <div><dt className="font-semibold text-navy">이용권 복구와 기록 복원은 별개</dt><dd className="mt-1 text-muted">이용권을 복구해도 삭제된 기록은 돌아오지 않습니다. 별도로 저장한 JSON 백업이 필요합니다.</dd></div>
          </dl>
        </div>
        <div>
          {checkoutAvailable ? <div id="pay-evidence-pro-checkout" className="scroll-mt-24"><PayEvidenceProCheckoutForm testMode={testCheckoutAvailable} entry={entry} /></div> : <p className="border border-border bg-surface p-5 text-sm text-muted">현재 결제 미오픈 · 외부 결제 설정 전</p>}
          <p className="mt-4 text-xs leading-5 text-muted">{testCheckoutAvailable ? "현재 버튼은 Stripe 테스트 환경 전용이며 실제 카드 청구는 없습니다." : checkoutAvailable ? "결제는 Stripe의 보안 결제 페이지에서 진행되며 결제와 이용권 확인 뒤 작업 공간을 열 수 있어요." : "결제는 Stripe·Neon 설정과 출시 승인이 완료될 때까지 닫혀 있습니다."}</p>
          <div className="mt-4 flex flex-wrap gap-3"><Link href="/pay-evidence-pro/restore" className="inline-flex min-h-12 items-center justify-center rounded-lg border border-navy px-5 text-sm font-semibold text-navy">이미 구매했다면 이용권 복구</Link><Link href="/underpayment-guide" className="inline-flex min-h-12 items-center px-2 text-sm font-semibold text-navy underline decoration-gold underline-offset-4">무료 대응 순서 →</Link></div>
        </div>
      </Container></section>
      <section className="py-8 sm:py-12" aria-labelledby="pay-official-heading"><Container>
        <h2 id="pay-official-heading" className="text-xl font-semibold text-navy">실제 적용 기준과 도움은 공식 페이지에서</h2>
        <p className="mt-2 text-sm leading-6 text-muted">현재 적용되는 조건은 Fair Work에서 확인하세요. 공식 페이지 이용에는 인터넷 연결이 필요합니다.</p>
        <ul className="mt-4 grid gap-3 lg:grid-cols-3">{sources.map(source => <li key={source.href}><a href={source.href} target="_blank" rel="noreferrer" className="block min-h-12 rounded-lg border border-border bg-white p-5 hover:border-navy"><strong className="text-sm text-navy">{source.title} ↗</strong><p className="mt-2 text-sm leading-6 text-muted">{source.body}</p></a></li>)}</ul>
      </Container></section>
    </main>
    <Footer />
  </>;
}
