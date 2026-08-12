import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Container } from "@/components/ui/Container";
import { createPageMetadata } from "@/lib/site";

export const metadata = createPageMetadata({
  title: "급여가 적게 들어왔을 때 확인하는 방법 | Aussie Compass",
  description:
    "호주에서 급여가 맞지 않을 때 근무 기록, Award 시급, Payslip을 비교하고 차액을 요청하는 순서를 한국어로 확인하세요.",
  path: "/underpayment-guide",
});

const steps = [
  {
    title: "내 근무 기록 모으기",
    description:
      "근무 날짜, 시작·종료 시간, 휴게시간, 주말·공휴일 근무를 정리하세요. Roster, 출퇴근 기록, 문자와 이메일도 함께 보관하면 좋습니다.",
  },
  {
    title: "적용 기준 확인하기",
    description:
      "Enterprise Agreement가 있는지 먼저 확인하고, 없다면 Award와 Classification, 고용 형태를 찾으세요. 평일 시급뿐 아니라 Casual Loading, Penalty Rate, Overtime과 Allowance도 확인합니다.",
  },
  {
    title: "받아야 할 금액 계산하기",
    description:
      "Fair Work의 Pay and Conditions Tool에서 해당 기간의 정확한 시급을 확인하세요. 시급은 회계연도와 첫 번째 전체 급여 기간에 따라 달라질 수 있으므로 날짜를 정확히 선택해야 합니다.",
  },
  {
    title: "실제 지급액과 비교하기",
    description:
      "Payslip의 Gross Pay와 은행 입금액을 기간별로 맞춰 보세요. 받을 세전 금액에서 실제 세전 지급액을 빼면 우선 확인할 차액을 정리할 수 있습니다.",
  },
  {
    title: "고용주에게 서면으로 문의하기",
    description:
      "감정적인 표현보다 근무 기간, 적용 기준, 계산한 차액과 근거 링크를 간단히 적어 이메일로 문의하세요. 답변과 수정 지급 예정일도 서면으로 남겨 두세요.",
  },
  {
    title: "해결되지 않으면 도움 요청하기",
    description:
      "직장에서 해결되지 않으면 Fair Work Ombudsman의 문제 해결 안내를 확인하세요. 노조 가입자라면 노조에, 복잡하거나 큰 금액이라면 관련 전문가에게도 도움을 요청할 수 있습니다.",
  },
];

const records = [
  "근로계약서 또는 고용 조건 안내",
  "Roster, Timesheet와 직접 적은 근무시간",
  "해당 기간의 모든 Payslip",
  "급여가 입금된 은행 내역",
  "Award·Classification과 적용 시급 자료",
  "고용주와 주고받은 문자·이메일",
];

export default function UnderpaymentGuidePage() {
  return (
    <>
      <Header />
      <main className="py-12 sm:py-16">
        <Container>
          <Link
            href="/guides"
            className="inline-flex text-sm font-medium text-muted transition-colors hover:text-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-2"
          >
            &larr; 급여 가이드 목록으로 돌아가기
          </Link>

          <div className="mb-10 mt-6 max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-gold">급여 문제 해결 가이드</p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-navy sm:text-4xl">
              급여가 적게 들어왔을 때 확인하는 방법
            </h1>
            <p className="mt-4 text-base leading-relaxed text-muted sm:text-lg">
              급여가 예상보다 적다면 바로 금액만 따지기보다 기록과 적용 기준부터 맞춰 보세요. 아래 순서대로 확인하면 무엇이 다른지 설명하기 쉬워집니다.
            </p>
          </div>

          <section className="rounded-2xl bg-navy p-6 text-white shadow-sm sm:p-8" aria-labelledby="quick-check-heading">
            <p className="text-sm font-semibold text-gold">먼저 확인할 네 가지</p>
            <h2 id="quick-check-heading" className="mt-2 text-2xl font-semibold">
              근무시간 · 적용 시급 · 수당 · 실제 지급액
            </h2>
            <p className="mt-4 max-w-4xl leading-7 text-white/70">
              세후 입금액만으로는 미지급 여부를 판단하기 어렵습니다. 먼저 받아야 할 세전 급여와 Payslip의 세전 급여를 같은 급여 기간 기준으로 비교하세요.
            </p>
          </section>

          <section className="mt-8 rounded-2xl border border-border bg-white p-6 sm:p-8" aria-labelledby="steps-heading">
            <h2 id="steps-heading" className="text-2xl font-semibold tracking-tight text-navy">확인부터 문의까지 6단계</h2>
            <ol className="mt-7 space-y-5">
              {steps.map((step, index) => (
                <li key={step.title} className="flex gap-4 rounded-xl bg-surface p-5">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gold/20 font-semibold text-navy">{index + 1}</span>
                  <div>
                    <h3 className="font-semibold text-navy">{step.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-muted">{step.description}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          <section className="mt-8 rounded-2xl border border-border bg-surface p-6 sm:p-8" aria-labelledby="records-heading">
            <h2 id="records-heading" className="text-2xl font-semibold tracking-tight text-navy">미리 모아둘 자료</h2>
            <p className="mt-3 leading-7 text-muted">자료는 급여 기간별로 묶어 두면 차액을 계산하고 문의할 때 훨씬 편합니다.</p>
            <ul className="mt-6 grid gap-3 sm:grid-cols-2">
              {records.map((record) => (
                <li key={record} className="flex gap-3 rounded-xl border border-border bg-white p-4 text-sm leading-6 text-muted">
                  <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-gold" />
                  <span>{record}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="mt-8 grid gap-5 md:grid-cols-2" aria-label="중요한 급여 확인 사항">
            <article className="rounded-2xl border border-border bg-white p-6 sm:p-8">
              <h2 className="text-xl font-semibold text-navy">Payslip이 없어도 기록하세요</h2>
              <p className="mt-3 leading-7 text-muted">
                고용주는 급여 지급 후 1 working day 안에 Payslip을 제공해야 합니다. 받지 못했다면 요청하고, 그동안 본인이 근무시간과 입금 내역을 계속 기록하세요.
              </p>
            </article>
            <article className="rounded-2xl border border-border bg-white p-6 sm:p-8">
              <h2 className="text-xl font-semibold text-navy">고용 기록을 요청할 수 있어요</h2>
              <p className="mt-3 leading-7 text-muted">
                고용주는 시간과 급여 관련 기록을 7년 동안 보관해야 하며, 직원이나 퇴사한 직원이 자신의 기록을 요청하면 열람할 수 있도록 해야 합니다.
              </p>
            </article>
          </section>

          <section className="mt-8 rounded-2xl border border-border bg-white p-6 sm:p-8" aria-labelledby="official-help-heading">
            <h2 id="official-help-heading" className="text-2xl font-semibold tracking-tight text-navy">공식 도구와 도움</h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              <a href="https://www.fairwork.gov.au/workplace-problems/common-workplace-problems/my-pay-doesnt-seem-right" target="_blank" rel="noreferrer" className="rounded-xl border border-border bg-surface p-5 transition hover:border-gold/60">
                <h3 className="font-semibold text-navy">My pay doesn&apos;t seem right</h3>
                <p className="mt-2 text-sm leading-6 text-muted">Fair Work의 급여 문제 확인 절차를 봅니다.</p>
              </a>
              <a href="https://calculate.fairwork.gov.au/" target="_blank" rel="noreferrer" className="rounded-xl border border-border bg-surface p-5 transition hover:border-gold/60">
                <h3 className="font-semibold text-navy">Pay and Conditions Tool</h3>
                <p className="mt-2 text-sm leading-6 text-muted">공식 시급, 수당과 근무 조건을 확인합니다.</p>
              </a>
              <a href="https://www.fairwork.gov.au/workplace-problems/fixing-a-workplace-problem" target="_blank" rel="noreferrer" className="rounded-xl border border-border bg-surface p-5 transition hover:border-gold/60">
                <h3 className="font-semibold text-navy">Fixing a workplace problem</h3>
                <p className="mt-2 text-sm leading-6 text-muted">직장 내 해결과 추가 도움 절차를 확인합니다.</p>
              </a>
            </div>
          </section>

          <section className="mt-8 rounded-2xl border border-gold/40 bg-gold/10 p-6 sm:p-8">
            <h2 className="text-xl font-semibold text-navy">먼저 내 Award와 급여 항목을 확인하세요</h2>
            <p className="mt-2 max-w-3xl leading-7 text-muted">차액을 계산하기 전에 적용 Award와 Classification을 찾고, Payslip에서 Gross Pay, 수당과 공제 항목을 확인하면 좋습니다.</p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link href="/award-guide" className="inline-flex min-h-11 items-center justify-center rounded-lg bg-navy px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-navy-light">Award 확인하기</Link>
              <Link href="/payslip-guide" className="inline-flex min-h-11 items-center justify-center rounded-lg border border-navy bg-white px-5 py-2.5 text-sm font-semibold text-navy transition hover:bg-surface">Payslip 읽는 법</Link>
            </div>
          </section>

          <aside className="mt-8 rounded-xl border border-border bg-white p-5 text-sm leading-6 text-muted">
            이 페이지는 일반적인 확인 절차를 안내하며 법률 자문이 아닙니다. 적용 Award, Agreement, 근무 기록과 청구 가능 기간은 개인 상황에 따라 달라질 수 있습니다. 긴급하거나 복잡한 분쟁은 Fair Work Ombudsman 또는 관련 전문가에게 확인하세요.
          </aside>
        </Container>
      </main>
      <Footer />
    </>
  );
}
