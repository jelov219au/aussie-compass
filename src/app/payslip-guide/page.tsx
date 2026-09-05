import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Container } from "@/components/ui/Container";
import { BreadcrumbJsonLd } from "@/components/seo/JsonLd";
import { createPageMetadata } from "@/lib/site";

export const metadata = createPageMetadata({
  title: "호주 Payslip 읽는 법 | Hoju Compass",
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
  "Pay Period는 일한 대상 기간, Payment Date는 급여 지급일인지 각각 확인",
  "시급, 일반 근무시간, 초과근무와 주말·공휴일 시간이 맞는지 확인",
  "Casual Loading이 시급에 포함됐다는 표시가 있는지, 별도 수당·Penalty 항목과 함께 확인",
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

          <section className="mt-8 rounded-2xl border border-border bg-white p-6 sm:p-8" aria-labelledby="payslip-example-heading">
            <h2 id="payslip-example-heading" className="text-2xl font-semibold text-navy">3분 확인 예시: 대상 기간부터 입금까지</h2>
            <p className="mt-3 text-sm leading-6 text-muted">설명을 위한 가상 시급·공제입니다. 법정 기준이나 실제 세금 계산이 아닙니다.</p>
            <dl className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {[["Pay Period", "8월 24일~30일의 근무"], ["Payment Date", "9월 2일 지급"], ["Gross", "20시간 × A$30 = A$600"], ["공제", "가상 공제 A$80"], ["Net", "A$600 − A$80 = A$520"], ["은행 입금", "A$520 → Net과 일치"]].map(([label, value]) => <div key={label} className="rounded-xl bg-surface p-4"><dt className="text-sm text-muted">{label}</dt><dd className="mt-2 font-semibold text-navy">{value}</dd></div>)}
            </dl>
            <p className="mt-4 text-sm leading-7 text-muted">동일 기간의 20시간·시급 근거와 공제의 적정성은 별도로 확인합니다. 숫자가 맞아도 급여 전체가 올바르다는 보장은 아닙니다. YTD는 누적값이므로 이번 한 번의 입금과 비교하지 마세요.</p>
          </section>

          <section className="mt-8 grid gap-5 md:grid-cols-2" aria-label="Payslip 문제 확인">
            <article className="rounded-2xl border border-border bg-white p-6 sm:p-8">
              <h2 className="text-xl font-semibold text-navy">언제 받아야 하나요?</h2>
              <p className="mt-3 leading-7 text-muted">고용주는 급여일로부터 1영업일 이내에 전자 또는 종이 형태로 급여명세서를 제공해야 합니다. 휴가 중인 직원에게도 동일하게 적용됩니다.</p>
            </article>
            <article className="rounded-2xl border border-border bg-white p-6 sm:p-8">
              <h2 className="text-xl font-semibold text-navy">금액이 맞지 않는다면</h2>
              <p className="mt-3 leading-7 text-muted">내 근무시간·적용 Rate로 계산한 세전 금액은 Payslip의 Gross와, Payslip의 Net은 같은 급여의 은행 입금과 비교하세요. 서로 다른 숫자를 바로 빼지 않습니다. 차이가 나는 날짜·시간·항목을 한 줄로 적어 Payroll에 확인을 요청하세요.</p>
              <Link href="/underpayment-guide" className="mt-4 inline-flex min-h-11 items-center font-semibold text-navy underline">차이 계산 예시와 문의 이메일 보기 →</Link>
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
