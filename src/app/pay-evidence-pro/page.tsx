import Link from "next/link";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { BreadcrumbJsonLd } from "@/components/seo/JsonLd";
import { PayEvidenceProCheckoutForm } from "@/components/tools/PayEvidenceProCheckoutForm";
import { Container } from "@/components/ui/Container";
import { canCreatePayEvidenceTestCheckout, getPayEvidencePaymentReadiness } from "@/lib/commerce";
import { normalizePayEvidenceProEntry } from "@/lib/payEvidenceProAttribution";
import { createPageMetadata } from "@/lib/site";

export const metadata = createPageMetadata({ title: "급여가 이상할 때 확인할 기록부터 | Pay Evidence Pro", description: "급여가 이상하다는 느낌을 근무시간, Payslip Gross·Net, 실제 입금액, 증빙표와 영문 문의문으로 정리하세요.", path: "/pay-evidence-pro" });
const features = [
  ["01", "Shift calculator", "시작·종료·무급 휴게와 확인한 시급을 넣어 내가 일한 시간과 기대 Gross를 계산해요."],
  ["02", "Period check", "기대 Gross와 Payslip Gross를 비교하고, Payslip Net과 실제 입금 Net은 별도로 대조해요."],
  ["03", "Evidence & message", "로스터와 Payslip 등 가지고 있는 증빙을 점검하고 첫 문의·재문의 영문을 만들어요."],
  ["04", "TXT & CSV export", "원본 급여자료를 올리지 않고 계산표와 고용주에게 전달할 요약을 개인 파일로 저장해요."],
] as const;
const sources = [
  { label: "Fair Work", title: "Pay slips와 기록 의무", href: "https://www.fairwork.gov.au/tools-and-resources/fact-sheets/rights-and-obligations/record-keeping-pay-slips", body: "Pay slip 필수 정보, 급여·근무시간 기록과 직원의 기록 열람 범위를 확인합니다." },
  { label: "Fair Work", title: "임금 지급에 포함되는 시간", href: "https://www.fairwork.gov.au/pay-and-wages/paying-wages", body: "회의, 교육, 오픈·마감처럼 고용주가 요구한 업무시간이 어떻게 다뤄지는지 확인합니다." },
  { label: "Fair Work", title: "직장 문제 도움 요청", href: "https://www.fairwork.gov.au/workplace-problems/fixing-a-workplace-problem/resolving-disputes-with-our-help", body: "고용주와 직접 해결되지 않았을 때 무료 Dispute Assistance 범위와 공식 지원 경로를 확인합니다." },
];

// Fictional excerpts checked against PayEvidenceWorkspace's downloadSummary and makeRequest output.
const payPeriodPreview = "- 1–7 September | Hours Not recorded | Expected gross Not recorded | Payslip gross Not recorded | Payslip net Not recorded | Bank net Not recorded | User-entered gross comparison Not comparable | Payslip-to-bank net difference Not comparable";
const requestPreview = `Subject: Request to review pay records

Hi Payroll/Manager,

I am reviewing my time and pay records for 1–7 September. I would like to confirm that the recorded hours and gross pay are correct.

Could you please check the hours, pay rates, penalties, allowances and deductions used for these periods, and provide the relevant time and wage records if available? I can share my period-by-period calculation without sensitive bank or tax details.

Please let me know the outcome in writing and how any correction will be shown on a payslip.

Thank you.`;

function PayOutputPreview() {
  return <section className="mt-8 border border-navy/15 bg-surface p-5 sm:p-7" aria-labelledby="pay-output-preview-heading">
    <h3 id="pay-output-preview-heading" className="text-xl font-semibold text-navy">TXT 요약과 영문 요청문은 이렇게 남아요</h3>
    <p className="mt-2 text-sm leading-6 text-muted">가상 예시 · 실제 급여 기록이나 문의가 아닙니다 · 읽기 전용. ‘1–7 September’라는 급여기간만 기록하고 시간과 금액은 아직 입력하지 않은 상태입니다.</p>
    <div className="mt-5 grid gap-5 lg:grid-cols-2">
      <figure className="min-w-0 border border-border bg-white p-4 sm:p-5">
        <figcaption className="text-sm font-semibold text-navy">전체 요약 TXT 중 급여기간 1개</figcaption>
        <pre lang="en" className="mt-3 whitespace-pre-wrap break-words font-mono text-xs leading-6 text-navy">{payPeriodPreview}</pre>
        <p className="mt-3 text-xs leading-5 text-muted">값을 기록하지 않았으므로 <span lang="en">Not recorded</span>, 비교할 두 값이 없으므로 <span lang="en">Not comparable</span>로 남습니다. 0을 입력했다는 뜻이 아닙니다.</p>
      </figure>
      <figure className="min-w-0 border border-border bg-white p-4 sm:p-5">
        <figcaption className="text-sm font-semibold text-navy">첫 번째 확인 요청 영문 초안</figcaption>
        <pre lang="en" className="mt-3 whitespace-pre-wrap break-words font-sans text-sm leading-6 text-navy">{requestPreview}</pre>
      </figure>
    </div>
    <p className="mt-4 text-xs leading-5 text-muted">도구는 입력한 기록을 정리할 뿐 Award·Classification·최저임금이나 미지급 여부를 결정하지 않습니다. 실제 전송 전 사실과 민감정보 포함 여부를 직접 확인하세요.</p>
  </section>;
}

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ access?: string; checkout?: string; from?: string | string[] }> };

export default async function PayEvidenceProPage({ searchParams }: Props) {
  const { access, checkout, from } = await searchParams;
  const paymentReadiness = getPayEvidencePaymentReadiness();
  const testCheckoutAvailable = canCreatePayEvidenceTestCheckout();
  const checkoutAvailable = paymentReadiness.ready || testCheckoutAvailable;
  const entry = normalizePayEvidenceProEntry(Array.isArray(from) ? from[0] : from ?? null);

  return <><BreadcrumbJsonLd items={[{ name: "홈", path: "/" }, { name: "급여가 적게 들어왔다면", path: "/underpayment-guide" }, { name: "Pay Evidence Pack Pro", path: "/pay-evidence-pro" }]} /><Header /><main>
    <section className="border-b border-navy/15 py-12 sm:py-20"><Container><Link href="/underpayment-guide" className="inline-flex min-h-11 items-center text-sm font-medium text-muted hover:text-navy">&larr; 무료 미지급 급여 가이드로 돌아가기</Link>
      {access === "required" && <div className="mt-5 border-l-2 border-gold bg-white p-4 text-sm leading-6 text-navy" role="alert">이 기기의 Pay Evidence Pack Pro 접근이 만료됐거나 확인되지 않았습니다. 결제 완료 화면에서 다시 열거나 이용권 복구를 사용해 주세요.</div>}
      {access === "released" && <div className="mt-5 border-l-2 border-emerald-600 bg-white p-4 text-sm leading-6 text-navy" role="status"><p>이 기기의 Pay Evidence Pack Pro 접근을 안전하게 해제했습니다. 구매 이용권은 유지됩니다.</p><Link href="/data-transfer#pay-evidence-delete-heading" className="mt-3 inline-flex min-h-12 items-center justify-center border border-navy px-4 py-2 font-semibold text-navy">Pay Evidence 로컬 기록 삭제</Link></div>}
      {checkout === "cancelled" && <div className="mt-5 border-l-2 border-navy/40 bg-white p-4 text-sm leading-6 text-navy" role="status">Stripe 결제 창에서 돌아왔습니다. 상태가 불명확하면 다시 결제하지 말고 <Link href="/payment-help" className="font-semibold underline decoration-gold underline-offset-4">결제 상태 확인 순서</Link>를 이용하세요.</div>}
      {checkout === "checkout_already_purchased" && <div className="mt-5 border-l-2 border-emerald-600 bg-white p-4 text-sm leading-6 text-navy" role="status">이 기기의 이용권을 확인했습니다. <Link href="/pay-evidence-pro/workspace" className="font-semibold underline decoration-gold underline-offset-4">작업공간에서 계속해 주세요</Link>.</div>}
      {(checkout === "checkout_retry_later" || checkout === "checkout_sales_closed") && <div className="mt-5 border-l-2 border-gold bg-white p-4 text-sm leading-6 text-navy" role="alert">다른 결제 확인 또는 통제된 첫 결제가 진행 중입니다. 새 결제를 시작하지 말고 잠시 뒤 확인해 주세요.</div>}
      {(checkout === "checkout_unavailable" || checkout === "checkout_support_required" || checkout === "checkout_failed") && <div className="mt-5 border-l-2 border-gold bg-white p-4 text-sm leading-6 text-navy" role="alert">현재 결제를 안전하게 시작할 수 없습니다. Stripe 화면을 이미 봤다면 재결제하지 말고 <Link href="/payment-help" className="font-semibold underline decoration-gold underline-offset-4">결제 상태 확인 순서</Link>를 이용하세요.</div>}
      <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_22rem] lg:items-end"><div className="max-w-3xl"><p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">Pay Evidence Pack Pro</p><h1 className="mt-4 text-3xl font-semibold leading-[1.08] tracking-[-0.035em] text-navy [word-break:keep-all] sm:text-6xl">급여가 이상할 때,<br /><span className="font-normal text-navy-light">확인할 기록부터 한곳에.</span></h1><p className="mt-6 max-w-2xl text-base leading-7 text-muted sm:text-lg">Shift 시간과 확인한 시급을 계산하고, 기대 Gross와 Payslip Gross의 비교 및 Payslip Net과 실제 입금 Net의 대조를 급여기간별로 분리해 고용주에게 물어볼 내용을 정리할 수 있어요.</p></div><aside className="border-l-2 border-gold pl-6"><p className="text-sm font-semibold text-muted">{checkoutAvailable ? "1회 가격" : "결제 미오픈"}</p><p className="mt-2 text-4xl font-semibold tracking-tight text-navy">A$9.90</p><p className="mt-2 text-sm leading-6 text-muted">구독은 없어요. 직접 해결하려는 분이 계산표와 영문 문의문을 처음부터 만들지 않아도 되도록 구성했습니다.</p></aside></div>
      <div className="mt-10 flex flex-wrap gap-3"><Link href="/underpayment-guide" className="inline-flex min-h-12 items-center justify-center bg-navy px-5 text-sm font-semibold text-white hover:bg-navy-light">무료 대응 가이드</Link><Link href="/pay-evidence-pro/restore" className="inline-flex min-h-12 items-center justify-center border border-navy px-5 text-sm font-semibold text-navy">이용권 복구</Link>{!checkoutAvailable && <span className="inline-flex min-h-12 items-center border border-border bg-white px-5 text-sm font-semibold text-muted">외부 결제 설정 전</span>}</div>
      {checkoutAvailable && <div id="pay-evidence-pro-checkout" className="mt-5 scroll-mt-24"><PayEvidenceProCheckoutForm testMode={testCheckoutAvailable} entry={entry} /></div>}
      <p className="mt-4 text-xs leading-5 text-muted">{testCheckoutAvailable ? "현재 버튼은 Stripe 테스트 환경 전용이며 실제 카드 청구는 없습니다." : checkoutAvailable ? "결제는 Stripe의 보안 결제 페이지에서 진행되며 결제와 이용권 확인 뒤 작업 공간을 열 수 있어요." : "결제는 Stripe·Neon 설정과 출시 승인이 완료될 때까지 닫혀 있습니다."}</p>
    </Container></section>
    <section className="py-14 sm:py-20"><Container><div className="grid gap-8 lg:grid-cols-[18rem_1fr]"><div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">먼저 확인하고, 필요한 만큼만</p><h2 className="mt-3 text-3xl font-semibold tracking-tight text-navy">권리 정보는 무료로,<br />개인 기록 정리는 Pro로.</h2><p className="mt-4 text-sm leading-7 text-muted">최저임금과 Award 찾기, 미지급 급여 대응 순서는 계속 무료예요. Pro는 내 계산과 전달용 정리에 드는 시간을 줄여주는 역할만 해요.</p></div><ol className="grid border-t border-navy/20 md:grid-cols-2">{features.map(([number, eyebrow, title], index) => <li key={number} className={`min-h-52 border-b border-navy/20 p-6 ${index % 2 === 0 ? "md:border-r" : ""}`}><div className="flex items-center justify-between"><span className="font-mono text-sm text-gold">{number} / 04</span><span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">{eyebrow}</span></div><h3 className="mt-8 text-xl font-semibold leading-8 text-navy">{title}</h3></li>)}</ol></div><PayOutputPreview /></Container></section>
    <section className="border-y border-navy/15 bg-white py-14 sm:py-20"><Container><p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">공식 기준도 함께 살펴봤어요</p><h2 className="mt-2 text-2xl font-semibold text-navy">급여는 지금 적용되는 공식 기준으로 확인해요</h2><ul className="mt-7 grid gap-px bg-border lg:grid-cols-3">{sources.map((source) => <li key={source.href} className="bg-surface"><a href={source.href} target="_blank" rel="noreferrer" className="group flex min-h-64 flex-col p-6 hover:bg-white"><span className="text-xs font-semibold uppercase tracking-[0.14em] text-gold">{source.label}</span><strong className="mt-3 text-xl text-navy">{source.title}</strong><span className="mt-4 text-sm leading-7 text-muted">{source.body}</span><span className="mt-auto pt-6 text-sm font-semibold text-navy">공식 원문 열기 ↗</span></a></li>)}</ul></Container></section>
    <section className="bg-navy py-12 text-white sm:py-16"><Container className="grid gap-6 sm:grid-cols-[1fr_auto] sm:items-end"><div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">내 기록은 내 기기에</p><h2 className="mt-3 text-3xl font-semibold tracking-tight">원본 급여자료를 올리지 않아도 순서대로 확인할 수 있어요.</h2><p className="mt-3 max-w-2xl text-sm leading-7 text-white/65">입력한 요약은 현재 브라우저에만 저장해요. Fair Work 신고나 고용주 연락, 법적인 미지급액 판단을 대신하지는 않아요.</p></div><Link href="/underpayment-guide" className="inline-flex min-h-12 items-center justify-center bg-gold px-5 text-sm font-semibold text-navy hover:bg-white">무료 대응 순서 →</Link></Container></section>
  </main><Footer /></>;
}
