import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Container } from "@/components/ui/Container";
import { BreadcrumbJsonLd } from "@/components/seo/JsonLd";
import { createPageMetadata } from "@/lib/site";

export const metadata = createPageMetadata({
  title: "내 Award와 정확한 시급 확인하기 | Aussie Compass",
  description: "호주에서 내 직업에 적용되는 Award, Classification, Penalty Rate와 정확한 최저 시급을 찾는 순서를 한국어로 알아보세요.",
  path: "/award-guide",
});

const steps = [
  {
    title: "Enterprise Agreement부터 확인",
    description: "회사나 사업장에 등록된 Enterprise Agreement가 있는지 고용주에게 확인하세요. Agreement가 적용되면 그 문서의 적용 범위와 분류, 급여 기준을 먼저 확인합니다.",
  },
  {
    title: "업종과 실제 업무로 Award 찾기",
    description: "Award는 회사 업종 또는 직무에 따라 적용됩니다. 채용공고의 직책만 보지 말고 실제로 수행하는 업무를 기준으로 Fair Work의 Find my award를 이용하세요.",
  },
  {
    title: "Classification Level 확인",
    description: "같은 Award 안에서도 업무, 책임, 감독 여부, 경력과 자격에 따라 Level 또는 Grade가 달라집니다. 분류가 달라지면 최저 시급도 달라집니다.",
  },
  {
    title: "개인 조건 입력",
    description: "Full-time, Part-time, Casual 여부와 나이, Apprentice·Trainee 여부를 확인하세요. Casual은 일반적으로 Casual Loading이 반영된 별도 시급을 사용합니다.",
  },
  {
    title: "근무 시간대와 수당 적용",
    description: "평일·저녁·주말·공휴일, 초과근무 여부에 따라 Penalty Rate와 Overtime이 달라질 수 있습니다. 해당 Allowance가 있는지도 함께 확인하세요.",
  },
];

const prepareItems = [
  "고용주 또는 사업체 이름",
  "실제로 하는 주요 업무",
  "Full-time, Part-time 또는 Casual 여부",
  "나이, 자격증, 경력과 Apprentice·Trainee 여부",
  "평일·주말·공휴일별 근무시간",
  "최근 Payslip과 근무시간 기록",
];

export default function AwardGuidePage() {
  return (
    <>
      <BreadcrumbJsonLd items={[{ name: "홈", path: "/" }, { name: "급여 가이드", path: "/guides" }, { name: "내 Award 찾기", path: "/award-guide" }]} />
      <Header />
      <main className="py-12 sm:py-16">
        <Container>
          <Link href="/guides" className="inline-flex text-sm font-medium text-muted transition-colors hover:text-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-2">
            &larr; 급여 가이드 목록으로 돌아가기
          </Link>

          <div className="mb-10 mt-6 max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-gold">급여 가이드</p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-navy sm:text-4xl">내 Award와 정확한 시급 확인하기</h1>
            <p className="mt-4 text-base leading-relaxed text-muted sm:text-lg">
              호주 최저 시급은 모두에게 같은 한 가지 숫자가 아닐 수 있습니다. 내 일에 적용되는 기준을 순서대로 찾아보세요.
            </p>
          </div>

          <section className="rounded-2xl bg-navy p-6 text-white shadow-sm sm:p-8" aria-labelledby="award-rule-heading">
            <p className="text-sm font-semibold text-gold">핵심 구조</p>
            <h2 id="award-rule-heading" className="mt-2 text-2xl font-semibold">Agreement → Award → Classification → 근무 조건</h2>
            <p className="mt-4 max-w-4xl leading-7 text-white/70">
              National Minimum Wage는 Award나 등록된 Agreement가 적용되지 않는 직원의 기본 기준입니다. 대부분의 직원은 적용되는 Award 또는 Agreement의 급여 기준과 조건을 먼저 확인해야 합니다.
            </p>
          </section>

          <section className="mt-8 rounded-2xl border border-border bg-white p-6 sm:p-8" aria-labelledby="award-steps-heading">
            <h2 id="award-steps-heading" className="text-2xl font-semibold tracking-tight text-navy">정확한 시급을 찾는 5단계</h2>
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

          <section className="mt-8 grid gap-5 md:grid-cols-2" aria-label="Award와 Classification 설명">
            <article className="rounded-2xl border border-border bg-white p-6 sm:p-8">
              <h2 className="text-xl font-semibold text-navy">Award란 무엇인가요?</h2>
              <p className="mt-3 leading-7 text-muted">특정 업종이나 직업에 적용되는 최저 급여와 근무 조건을 정한 법적 문서입니다. 기본 시급뿐 아니라 주말·공휴일 수당, 초과근무, Allowance와 휴식시간 기준도 포함할 수 있습니다.</p>
            </article>
            <article className="rounded-2xl border border-border bg-white p-6 sm:p-8">
              <h2 className="text-xl font-semibold text-navy">Classification이 중요한 이유</h2>
              <p className="mt-3 leading-7 text-muted">Classification은 실제 업무와 책임 수준을 설명합니다. 직책 이름이 같아도 감독 업무, 자격, 숙련도와 경력에 따라 다른 Level이 적용될 수 있으므로 업무 설명을 직접 비교해야 합니다.</p>
            </article>
          </section>

          <section className="mt-8 rounded-2xl border border-border bg-surface p-6 sm:p-8" aria-labelledby="prepare-heading">
            <h2 id="prepare-heading" className="text-2xl font-semibold tracking-tight text-navy">Fair Work 도구를 열기 전에 준비할 정보</h2>
            <ul className="mt-6 grid gap-3 sm:grid-cols-2">
              {prepareItems.map((item) => (
                <li key={item} className="flex gap-3 rounded-xl border border-border bg-white p-4 text-sm leading-6 text-muted">
                  <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-gold" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="mt-8 rounded-2xl border border-gold/40 bg-gold/10 p-6 sm:p-8" aria-labelledby="check-rate-heading">
            <h2 id="check-rate-heading" className="text-xl font-semibold text-navy">2026년 7월 이후 기준도 다시 확인하세요</h2>
            <p className="mt-3 max-w-4xl leading-7 text-muted">
              2026년 7월 1일부터 National Minimum Wage는 시간당 A$26.44이며 Award 최저임금은 4.75% 인상됐습니다. 일반적으로 첫 번째 전체 급여 기간부터 새 기준이 적용되므로 Fair Work 계산기에서 최신 날짜를 선택하세요.
            </p>
          </section>

          <section className="mt-8 rounded-2xl border border-border bg-white p-6 sm:p-8" aria-labelledby="official-tools-heading">
            <h2 id="official-tools-heading" className="text-2xl font-semibold tracking-tight text-navy">공식 도구에서 최종 확인하기</h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              <a href="https://www.fairwork.gov.au/employment-conditions/awards" target="_blank" rel="noreferrer" className="rounded-xl border border-border bg-surface p-5 transition hover:border-gold/60"><h3 className="font-semibold text-navy">Find my award</h3><p className="mt-2 text-sm leading-6 text-muted">내 업종과 직무에 적용되는 Award를 찾습니다.</p></a>
              <a href="https://www.fairwork.gov.au/employment-conditions/awards/award-classifications" target="_blank" rel="noreferrer" className="rounded-xl border border-border bg-surface p-5 transition hover:border-gold/60"><h3 className="font-semibold text-navy">Award Classification</h3><p className="mt-2 text-sm leading-6 text-muted">업무에 맞는 Level과 Grade를 확인합니다.</p></a>
              <a href="https://calculate.fairwork.gov.au/" target="_blank" rel="noreferrer" className="rounded-xl border border-border bg-surface p-5 transition hover:border-gold/60"><h3 className="font-semibold text-navy">Pay and Conditions Tool</h3><p className="mt-2 text-sm leading-6 text-muted">시급, Penalty Rate와 Allowance를 계산합니다.</p></a>
            </div>
          </section>

          <section className="mt-8 rounded-2xl border border-gold/40 bg-gold/10 p-6 sm:p-8">
            <h2 className="text-xl font-semibold text-navy">확인한 시급으로 급여를 계산하세요</h2>
            <p className="mt-2 max-w-3xl leading-7 text-muted">Award에서 확인한 시급과 실제 근무시간을 입력하면 예상 세전·세후 급여와 Super를 확인할 수 있습니다.</p>
            <Link href="/salary-calculator" className="mt-5 inline-flex min-h-11 items-center justify-center rounded-lg bg-navy px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-navy-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-2">통합 급여 계산기 열기</Link>
          </section>

          <aside className="mt-8 rounded-xl border border-border bg-white p-5 text-sm leading-6 text-muted">
            이 가이드는 일반적인 확인 절차를 설명합니다. 실제 Award 적용 범위와 Classification은 사업 형태, 수행 업무, Agreement와 개인 조건에 따라 달라질 수 있습니다. 확실하지 않다면 Fair Work 또는 노조·등록 전문가에게 확인하세요.
          </aside>
        </Container>
      </main>
      <Footer />
    </>
  );
}
