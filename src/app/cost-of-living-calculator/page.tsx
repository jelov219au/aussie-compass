import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CostOfLivingCalculator } from "@/components/tools/CostOfLivingCalculator";
import { Container } from "@/components/ui/Container";
import { BreadcrumbJsonLd } from "@/components/seo/JsonLd";
import { createPageMetadata } from "@/lib/site";

export const metadata = createPageMetadata({ title: "호주 생활비 계산기 | Hoju Compass", description: "주거비, 식비, 교통비 등 호주 생활비를 주·월·연간으로 환산하고 세후 수입과 비교하세요.", path: "/cost-of-living-calculator" });
const linkClass = "font-semibold text-navy underline decoration-gold decoration-2 underline-offset-4";

export default function CostOfLivingCalculatorPage() {
  return <><BreadcrumbJsonLd items={[{ name: "홈", path: "/" }, { name: "생활비 계산기", path: "/cost-of-living-calculator" }]} /><Header /><main className="py-12 sm:py-16"><Container>
    <Link href="/tools" className="inline-flex min-h-11 items-center text-sm font-medium text-muted hover:text-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-2">&larr; 도구 목록으로 돌아가기</Link>
    <div className="mb-10 mt-5 max-w-3xl"><p className="text-sm font-semibold uppercase tracking-[0.16em] text-gold">무료 예산 도구</p><h1 className="mt-3 text-3xl font-semibold tracking-tight text-navy sm:text-4xl">호주 생활비 계산기</h1><p className="mt-4 text-base leading-relaxed text-muted sm:text-lg">서로 다른 결제 주기를 같은 기준으로 바꿔, 입력한 생활비와 세후 수입을 비교하세요. 입력 내용은 현재 브라우저에만 저장됩니다.</p></div>
    <CostOfLivingCalculator />
    <section className="mt-10 rounded-2xl border border-border bg-white p-6 sm:p-8" aria-labelledby="budget-example-heading">
      <p className="text-sm font-medium text-muted">아래 숫자는 설명을 위한 가상 예시입니다.</p><h2 id="budget-example-heading" className="mt-2 text-xl font-semibold text-navy">격주 급여를 주간 예산으로 바꾸기</h2>
      <p className="mt-3 text-sm leading-7 text-muted">세후 $1,600을 격주로 받는다면 주간 환산 수입은 $800입니다. 주세 $350 + 식비 $100 + 교통비 $40 + 월 통신비 $60 + 연간 비용 $600을 입력해 보세요.</p>
      <dl className="mt-4 grid gap-3 sm:grid-cols-3"><div className="rounded-xl bg-surface p-4"><dt className="text-sm text-muted">월 통신비 $60</dt><dd className="mt-1 font-semibold text-navy">주당 약 $13.85</dd><p className="mt-1 text-xs text-muted">60 × 12 ÷ 52</p></div><div className="rounded-xl bg-surface p-4"><dt className="text-sm text-muted">연간 비용 $600</dt><dd className="mt-1 font-semibold text-navy">주당 약 $11.54</dd><p className="mt-1 text-xs text-muted">600 ÷ 52</p></div><div className="rounded-xl bg-surface p-4"><dt className="text-sm text-muted">입력한 지출 합계</dt><dd className="mt-1 font-semibold text-navy">주당 $515.38</dd><p className="mt-1 text-xs text-muted">중간 환산값을 반올림하지 않고 합산</p></div></dl>
      <p className="mt-4 text-sm leading-7 text-muted">차액은 주당 $284.62입니다. 이 예시에 빠진 공과금·의료비·빚 상환·비자·항공료 등을 넣기 전 금액이므로 전부 써도 되는 돈으로 보지 마세요. 분기 비용은 1년에 4번, 격주 비용은 26번으로 환산합니다.</p>
    </section>
    <section className="mt-6 rounded-2xl border border-border bg-white p-6 sm:p-8" aria-labelledby="budget-guide-heading">
      <h2 id="budget-guide-heading" className="text-xl font-semibold text-navy">평균 예산과 다음 급여일까지의 현금을 함께 확인하세요</h2>
      <ol className="mt-4 grid gap-4 text-sm leading-7 text-muted md:grid-cols-3"><li className="rounded-xl bg-surface p-4"><strong className="block text-navy">1. 오늘 잔액과 날짜 적기</strong>오늘 계좌 잔액, 다음 급여일, 그 전에 나갈 자동이체와 필수 지출을 함께 적으세요. 연간 평균 월액이 흑자여도 급여 전에 돈이 모자랄 수 있습니다.</li><li className="rounded-xl bg-surface p-4"><strong className="block text-navy">2. 큰 청구서의 납기일 확인</strong>$600이 8주 뒤 필요하고 모아 둔 돈이 0이라면 주당 $75가 필요합니다. 연간 평균 $11.54만으로는 이번 납기에 부족합니다. 같은 청구서의 적립액과 지출을 두 번 합산하지 않도록 구분하세요.</li><li className="rounded-xl bg-surface p-4"><strong className="block text-navy">3. 수입이 적은 주도 계산</strong>최근 거래 내역과 청구서를 기준으로 입력한 뒤, 근무 시간이 적은 주의 세후 수입으로도 바꿔 보세요. 이 계산만으로 임대 계약이나 대출 상환을 감당할 수 있다고 보장하지 않습니다.</li></ol>
      <p className="mt-4 text-sm leading-7 text-muted">공식 참고: <a href="https://moneysmart.gov.au/budgeting/budget-planner" className={linkClass}>MoneySmart 예산 플래너</a>, <a href="https://moneysmart.gov.au/budgeting/managing-on-a-casual-income" className={linkClass}>불규칙한 수입 관리</a>. 확인일: 2026년 9월 5일.</p>
      <Link href="/savings-goal-calculator" className={`mt-3 inline-flex min-h-11 items-center ${linkClass}`}>큰 청구서까지 필요한 저축액 계산하기 →</Link>
    </section>
    <section className="mt-6 rounded-2xl border border-amber-300 bg-amber-50 p-6 sm:flex sm:items-center sm:justify-between sm:gap-6"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-800">계산 결과가 이미 적자라면</p><h2 className="mt-2 text-xl font-semibold text-navy">Hardship·무료 Financial counselling 확인하기</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-muted">식비·주거·의료·전기 같은 필수비와 감당 가능한 납부 방안을 확인할 수 있어요.</p></div><Link href="/resources/australia-financial-hardship-bills-debt-guide" className="mt-4 inline-flex min-h-12 shrink-0 items-center justify-center bg-navy px-5 text-sm font-semibold text-white sm:mt-0">Hardship 대응 가이드 →</Link></section>
  </Container></main><Footer /></>;
}
