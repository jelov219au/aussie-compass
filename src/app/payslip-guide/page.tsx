import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Container } from "@/components/ui/Container";
import { BreadcrumbJsonLd } from "@/components/seo/JsonLd";
import { createPageMetadata } from "@/lib/site";

export const metadata = createPageMetadata({
  title: "호주 Payslip 읽는 법 | Aussie Compass",
  description: "호주 급여명세서의 Gross Pay, Net Pay, PAYG, Super, YTD와 근무시간을 한국어로 쉽게 확인하세요.",
  path: "/payslip-guide",
});

const payslipTerms = [
  {
    term: "Gross Pay (세전 급여)",
    description: "소득세와 기타 공제액을 빼기 전 급여입니다. 기본 근무시간, 초과근무, 수당과 보너스가 합쳐질 수 있습니다.",
  },
  {
    term: "PAYG Withholding (원천징수 세금)",
    description: "고용주가 급여에서 미리 공제해 ATO에 납부하는 세금입니다. 최종 세금은 연간 소득과 개인 상황에 따라 달라질 수 있습니다.",
  },
  {
    term: "Net Pay (실수령액)",
    description: "세금과 표시된 공제액을 뺀 뒤 실제 은행 계좌로 지급되는 금액입니다.",
  },
  {
    term: "Superannuation (Super)",
    description: "고용주가 Super fund에 납부했거나 납부할 금액입니다. 급여명세서의 표시 금액과 실제 Super 계좌 입금 내역을 함께 확인하세요.",
  },
  {
    term: "YTD (Year to Date)",
    description: "해당 회계연도 시작일부터 현재 지급일까지 누적된 급여·세금 등의 금액입니다. 고용주 급여 시스템에 따라 표시 방식은 다를 수 있습니다.",
  },
];

const checklist = [
  "이름, 고용주 이름과 ABN이 맞는지 확인",
  "Pay Period와 Payment Date가 실제 지급 기간과 일치하는지 확인",
  "시급, 일반 근무시간, 초과근무와 주말·공휴일 시간이 맞는지 확인",
  "Casual Loading, Allowance, Penalty Rate가 해당되는 경우 별도로 표시됐는지 확인",
  "Gross Pay에서 PAYG와 기타 공제를 뺀 금액이 Net Pay와 맞는지 확인",
  "Super 금액과 Super fund 정보가 맞는지 확인",
];

export default function PayslipGuidePage() {
  return (
    <>
      <BreadcrumbJsonLd items={[{ name: "홈", path: "/" }, { name: "급여 가이드", path: "/guides" }, { name: "Payslip 읽는 법", path: "/payslip-guide" }]} />
      <Header />
      <main className="py-12 sm:py-16">
        <Container>
          <Link href="/guides" className="inline-flex text-sm font-medium text-muted transition-colors hover:text-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-2">
            &larr; 급여 가이드 목록으로 돌아가기
          </Link>

          <div className="mb-10 mt-6 max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-gold">급여 가이드</p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-navy sm:text-4xl">호주 Payslip 읽는 법</h1>
            <p className="mt-4 text-base leading-relaxed text-muted sm:text-lg">
              급여명세서에서 실제 지급액, 세금, 근무시간과 Super가 제대로 표시됐는지 순서대로 확인해 보세요.
            </p>
          </div>

          <section className="rounded-2xl bg-navy p-6 text-white shadow-sm sm:p-8" aria-labelledby="payslip-summary-heading">
            <p className="text-sm font-semibold text-gold">먼저 기억하세요</p>
            <h2 id="payslip-summary-heading" className="mt-2 text-2xl font-semibold">Gross − 공제액 = Net Pay</h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              <div className="rounded-xl border border-white/10 bg-white/10 p-5"><p className="text-sm text-white/65">Gross Pay</p><p className="mt-2 font-semibold">세금 전 급여</p></div>
              <div className="rounded-xl border border-white/10 bg-white/10 p-5"><p className="text-sm text-white/65">Deductions</p><p className="mt-2 font-semibold">PAYG와 기타 공제</p></div>
              <div className="rounded-xl border border-gold/40 bg-gold/10 p-5"><p className="text-sm text-white/75">Net Pay</p><p className="mt-2 font-semibold">실제 지급 금액</p></div>
            </div>
          </section>

          <section className="mt-8 rounded-2xl border border-border bg-white p-6 sm:p-8" aria-labelledby="payslip-terms-heading">
            <h2 id="payslip-terms-heading" className="text-2xl font-semibold tracking-tight text-navy">자주 보이는 용어</h2>
            <dl className="mt-6 grid gap-4 md:grid-cols-2">
              {payslipTerms.map((item) => (
                <div key={item.term} className="rounded-xl bg-surface p-5">
                  <dt className="font-semibold text-navy">{item.term}</dt>
                  <dd className="mt-2 text-sm leading-6 text-muted">{item.description}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section className="mt-8 rounded-2xl border border-border bg-surface p-6 sm:p-8" aria-labelledby="required-details-heading">
            <h2 id="required-details-heading" className="text-2xl font-semibold tracking-tight text-navy">Payslip에 꼭 확인할 정보</h2>
            <p className="mt-3 max-w-4xl leading-7 text-muted">
              일반적으로 고용주와 직원 이름, 고용주 ABN, 지급일, 지급 대상 기간, Gross와 Net 금액이 표시되어야 합니다. 해당되는 경우 시급과 근무시간, 수당·보너스·Penalty Rate, 공제액과 Super 정보도 확인하세요.
            </p>
            <ol className="mt-6 space-y-3">
              {checklist.map((item, index) => (
                <li key={item} className="flex gap-3 text-muted">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gold/15 text-sm font-semibold text-navy">{index + 1}</span>
                  <span className="pt-0.5 leading-6">{item}</span>
                </li>
              ))}
            </ol>
          </section>

          <section className="mt-8 grid gap-5 md:grid-cols-2" aria-label="Payslip 문제 확인">
            <article className="rounded-2xl border border-border bg-white p-6 sm:p-8">
              <h2 className="text-xl font-semibold text-navy">언제 받아야 하나요?</h2>
              <p className="mt-3 leading-7 text-muted">고용주는 급여일로부터 1영업일 이내에 전자 또는 종이 형태로 급여명세서를 제공해야 합니다. 휴가 중인 직원에게도 동일하게 적용됩니다.</p>
            </article>
            <article className="rounded-2xl border border-border bg-white p-6 sm:p-8">
              <h2 className="text-xl font-semibold text-navy">금액이 맞지 않는다면</h2>
              <p className="mt-3 leading-7 text-muted">근무시간 기록과 은행 입금액을 먼저 비교하고 고용주 또는 Payroll 담당자에게 서면으로 문의하세요. 해결되지 않으면 Fair Work의 공식 안내를 확인할 수 있습니다.</p>
            </article>
          </section>

          <section className="mt-8 rounded-2xl border border-gold/40 bg-gold/10 p-6 sm:p-8" aria-labelledby="next-step-heading">
            <h2 id="next-step-heading" className="text-xl font-semibold text-navy">내 Payslip 금액과 비교해 보세요</h2>
            <p className="mt-2 max-w-3xl leading-7 text-muted">시급과 근무시간을 입력하면 예상 세전·세후 급여와 Super를 한 번에 확인할 수 있습니다.</p>
            <Link href="/salary-calculator" className="mt-5 inline-flex min-h-11 items-center justify-center rounded-lg bg-navy px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-navy-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-2">통합 급여 계산기 열기</Link>
          </section>

          <div className="mt-8 flex flex-wrap gap-4">
            <a href="https://www.fairwork.gov.au/tools-and-resources/fact-sheets/rights-and-obligations/record-keeping-pay-slips" target="_blank" rel="noreferrer" className="text-sm font-semibold text-navy underline decoration-gold decoration-2 underline-offset-4">Fair Work Payslip 공식 안내</a>
            <a href="https://www.ato.gov.au/businesses-and-organisations/hiring-and-paying-your-workers/single-touch-payroll/single-touch-payroll-for-employees/accessing-your-income-statement-online" target="_blank" rel="noreferrer" className="text-sm font-semibold text-navy underline decoration-gold decoration-2 underline-offset-4">ATO Income Statement 확인</a>
          </div>

          <aside className="mt-8 rounded-xl border border-border bg-white p-5 text-sm leading-6 text-muted">
            이 가이드는 일반적인 정보이며 법률 또는 세무 자문이 아닙니다. 적용되는 Award, Agreement와 개인 상황에 따라 지급 항목이 달라질 수 있으므로 Fair Work 또는 등록 전문가의 공식 안내를 확인하세요.
          </aside>
        </Container>
      </main>
      <Footer />
    </>
  );
}
