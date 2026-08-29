import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { MinimumWageCalculator } from "@/components/tools/MinimumWageCalculator";
import { Container } from "@/components/ui/Container";
import { BreadcrumbJsonLd } from "@/components/seo/JsonLd";
import { createPageMetadata } from "@/lib/site";

export const metadata = createPageMetadata({
  title: "호주 최저임금·캐주얼 로딩 가이드 | Hoju Compass",
  description: "2026년 7월부터 적용되는 호주 National Minimum Wage와 캐주얼 로딩을 기준으로 예상 급여를 계산해 보세요.",
  path: "/minimum-wage-guide",
});

export default function MinimumWageGuidePage() {
  return (
    <>
      <BreadcrumbJsonLd items={[{ name: "홈", path: "/" }, { name: "급여 가이드", path: "/guides" }, { name: "최저 시급 가이드", path: "/minimum-wage-guide" }]} />
      <Header />
      <main className="py-12 sm:py-16">
        <Container>
          <Link href="/guides" className="inline-flex text-sm font-medium text-muted transition-colors hover:text-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-2">
            &larr; 도구 목록으로 돌아가기
          </Link>

          <div className="mb-10 mt-6 max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-gold">무료 도구</p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-navy sm:text-4xl">호주 최저임금·캐주얼 로딩 가이드</h1>
            <p className="mt-4 text-base leading-relaxed text-muted sm:text-lg">
              고용 형태에 따른 National Minimum Wage와 예상 주급·연봉을 간편하게 확인하세요.
            </p>
          </div>

          <MinimumWageCalculator />

          <section className="mt-10 border-t border-navy/20 pt-10" aria-labelledby="minimum-rate-order-heading">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">01 · 내 기준 찾기</p>
            <h2 id="minimum-rate-order-heading" className="mt-2 text-2xl font-semibold text-navy sm:text-3xl">National Minimum Wage가 모두의 실제 시급은 아니에요</h2>
            <p className="mt-3 max-w-4xl text-sm leading-7 text-muted">National Minimum Wage는 Award나 Registered agreement의 적용을 받지 않는 직원의 출발점입니다. 호주 근로자의 다수는 업종·직무별 Award를 적용받을 수 있으므로 계약서의 시급만 보지 말고 아래 순서로 확인하세요.</p>
            <ol className="mt-6 grid gap-px overflow-hidden rounded-2xl border border-border bg-border md:grid-cols-2">
              {[
                ["01", "Registered agreement", "회사나 사업장에 승인된 Enterprise agreement가 있는지 확인합니다. Agreement의 Base rate가 관련 Award 또는 National Minimum Wage보다 낮아질 수 있는지도 현재 규칙으로 확인하세요."],
                ["02", "Modern Award", "업종·직무, 실제 업무와 고용주의 사업을 기준으로 적용 Award를 찾고 Classification을 결정합니다."],
                ["03", "Classification과 고용형태", "같은 Award 안에서도 업무 책임·자격·경력 단계와 Full-time·Part-time·Casual에 따라 Rate가 달라집니다."],
                ["04", "근무 조건", "평일 기본 시급 뒤에 주말·공휴일·야간·Overtime·Allowance와 Minimum engagement를 별도로 확인합니다."],
              ].map(([number, title, description]) => <li key={number} className="bg-white p-5 sm:p-6"><span className="font-mono text-xs text-gold-ink">{number}</span><h3 className="mt-2 font-semibold text-navy">{title}</h3><p className="mt-2 text-sm leading-6 text-muted">{description}</p></li>)}
            </ol>
          </section>

          <section className="mt-10 grid gap-5 lg:grid-cols-2" aria-labelledby="minimum-exceptions-heading">
            <article className="rounded-2xl border border-border bg-white p-6 sm:p-8">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">02 · 이 계산기를 그대로 쓰지 않는 경우</p>
              <h2 id="minimum-exceptions-heading" className="mt-2 text-2xl font-semibold text-navy">나이·훈련·지급방식에 따라 별도 Rate가 있어요</h2>
              <ul className="mt-5 space-y-3 text-sm leading-6 text-muted">
                {["21세 미만 Junior: Award 또는 National Minimum Wage order의 연령별 비율 확인", "Apprentice·Trainee: 정식 Training contract와 단계·수료 진도에 따른 Rate 확인", "Supported Wage System 대상: 독립 평가와 적용 문서의 절차 확인", "Piece rate·Commission: 허용 조건과 Minimum wage 보장 방식을 확인", "Award의 첫 6개월 Entry-level rate나 특정 업종의 별도 전환 규칙 확인"].map((item) => <li key={item} className="border-l-2 border-gold pl-3">{item}</li>)}
              </ul>
            </article>
            <article className="rounded-2xl bg-navy p-6 text-white sm:p-8">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">03 · 적용일</p>
              <h2 className="mt-2 text-2xl font-semibold">7월 1일 급여부터 무조건 바뀌는 것은 아니에요</h2>
              <p className="mt-4 text-sm leading-7 text-white/75">2026년 인상률은 2026년 7월 1일 이후 시작하는 첫 Full pay period부터 적용됩니다. 예를 들어 Pay period가 6월 29일에 시작해 7월 5일에 끝난다면 새 Rate의 시작일을 Payroll과 Award 안내에서 다시 확인해야 해요.</p>
              <ul className="mt-5 space-y-3 text-sm leading-6 text-white/75"><li>Pay period 시작·종료일과 지급일을 구분</li><li>인상 전후 Payslip의 Base rate 비교</li><li>Casual loading·Penalty·Allowance도 새 Base 기준인지 확인</li><li>Backpay가 있으면 대상 시간과 세전·세후 차액 보관</li></ul>
            </article>
          </section>

          <section className="mt-10 rounded-2xl border border-border bg-surface p-6 sm:p-8" aria-labelledby="minimum-payslip-heading">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">04 · 실제 급여 검산</p>
            <h2 id="minimum-payslip-heading" className="mt-2 text-2xl font-semibold text-navy">계산 결과를 Payslip과 맞출 때</h2>
            <div className="mt-5 grid gap-3 md:grid-cols-2">{["이름·고용주·ABN과 Pay period가 맞는지", "Award·Agreement 이름과 Classification을 서면으로 받았는지", "Ordinary·주말·공휴일·Overtime 시간이 분리됐는지", "Casual loading이 Base rate에 포함됐는지 별도인지", "Unpaid break와 실제 근무시간이 맞는지", "Allowance·Deduction·Super가 설명 가능한지", "계산 차이를 날짜·시간·예상액 표로 만들었는지", "Payroll 답변과 수정 Payslip·차액 입금을 함께 보관했는지"].map((item) => <p key={item} className="flex gap-3 rounded-xl border border-border bg-white p-4 text-sm leading-6 text-muted"><span aria-hidden="true" className="text-gold-ink">□</span><span>{item}</span></p>)}</div>
          </section>

          <section className="mt-8 rounded-2xl border border-border bg-white p-6 sm:p-8">
            <h2 className="text-xl font-semibold text-navy">꼭 확인하세요</h2>
            <div className="mt-3 max-w-3xl space-y-3 text-sm leading-7 text-muted sm:text-base">
              <p>
                이 도구는 2026년 7월 1일부터 적용되는 일반 성인 National Minimum Wage를 기준으로 합니다.
                풀타임·파트타임은 시간당 A$26.44, 캐주얼은 25% 로딩이 포함된 시간당 A$33.05를 사용합니다.
                공식 풀타임 주급은 38시간 기준 A$1,004.90입니다.
              </p>
              <p>
                실제 최저임금은 적용되는 Modern Award, Enterprise Agreement, 직종·등급, 나이, 수습 여부,
                주말·공휴일·야간 근무에 따라 더 높을 수 있습니다. 이 결과만으로 본인의 정확한 법정 시급을 판단하지 마세요.
              </p>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <a href="https://www.fairwork.gov.au/pay-and-wages/minimum-wages" target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center text-sm font-semibold text-navy underline decoration-gold decoration-2 underline-offset-4">Fair Work Minimum wages ↗</a>
              <a href="https://www.fairwork.gov.au/employment-conditions/awards/award-and-agreement-free-wages-and-conditions" target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center text-sm font-semibold text-navy underline decoration-gold decoration-2 underline-offset-4">Award-free 임금·조건 ↗</a>
              <a href="https://www.fairwork.gov.au/about-us/workplace-laws/annual-wage-review/annual-wage-review-2026" target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center text-sm font-semibold text-navy underline decoration-gold decoration-2 underline-offset-4">2026 Annual Wage Review ↗</a>
              <a href="https://calculate.fairwork.gov.au/" target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center text-sm font-semibold text-navy underline decoration-gold decoration-2 underline-offset-4">Pay and Conditions Tool ↗</a>
            </div>
          </section>
        </Container>
      </main>
      <Footer />
    </>
  );
}
