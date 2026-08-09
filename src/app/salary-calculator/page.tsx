import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { SalaryCalculator } from "@/components/tools/SalaryCalculator";
import { Container } from "@/components/ui/Container";

export const metadata: Metadata = {
  title: "호주 통합 급여 계산기 | Aussie Compass",
  description: "시급과 근무시간 한 번 입력으로 세전 급여, 예상 세후 소득, Super와 총 보상 패키지를 확인하세요.",
};

export default function SalaryCalculatorPage() {
  return (
    <>
      <Header />
      <main className="py-12 sm:py-16">
        <Container>
          <Link href="/#tools" className="inline-flex text-sm font-medium text-muted transition-colors hover:text-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-2">&larr; 도구 목록으로 돌아가기</Link>
          <div className="mb-10 mt-6 max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-gold">대표 무료 도구</p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-navy sm:text-4xl">호주 통합 급여 계산기</h1>
            <p className="mt-4 text-base leading-relaxed text-muted sm:text-lg">시급과 근무시간을 한 번만 입력하고 세전·세후 급여, Super, 총 패키지를 모두 확인하세요.</p>
          </div>

          <SalaryCalculator />

          <section className="mt-8 rounded-2xl border border-border bg-white p-6 sm:p-8" aria-labelledby="result-meaning-heading">
            <div className="max-w-3xl">
              <p className="text-sm font-semibold uppercase tracking-[0.14em] text-gold">결과 이해하기</p>
              <h2 id="result-meaning-heading" className="mt-2 text-2xl font-semibold tracking-tight text-navy">
                이 결과는 무슨 뜻인가요?
              </h2>
              <p className="mt-3 leading-relaxed text-muted">
                계산기에 표시되는 주요 항목을 쉬운 말로 정리했습니다.
              </p>
            </div>

            <dl className="mt-7 grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl bg-surface p-5">
                <dt className="font-semibold text-navy">세전 급여</dt>
                <dd className="mt-2 text-sm leading-6 text-muted">
                  세금이 빠지기 전 회사에서 받기로 한 급여입니다. 시급과 주당 근무시간을 기준으로 주급·월급·연봉을 계산합니다.
                </dd>
              </div>
              <div className="rounded-xl bg-surface p-5">
                <dt className="font-semibold text-navy">세후 급여</dt>
                <dd className="mt-2 text-sm leading-6 text-muted">
                  예상 소득세를 제외한 뒤 실제로 사용할 수 있는 금액의 예상치입니다. Medicare Levy와 HELP/HECS 등은 포함하지 않습니다.
                </dd>
              </div>
              <div className="rounded-xl bg-surface p-5">
                <dt className="font-semibold text-navy">Super</dt>
                <dd className="mt-2 text-sm leading-6 text-muted">
                  고용주가 급여와 별도로 본인의 Superannuation 계좌에 납부하는 예상 퇴직연금입니다. 현재 계산에는 일반 SG 비율 12%를 적용합니다.
                </dd>
              </div>
              <div className="rounded-xl bg-surface p-5">
                <dt className="font-semibold text-navy">Total Package</dt>
                <dd className="mt-2 text-sm leading-6 text-muted">
                  세전 연봉과 고용주가 납부하는 Super를 합친 전체 보상 규모입니다. 실제 통장에 입금되는 금액과는 다릅니다.
                </dd>
              </div>
            </dl>
          </section>

          <section className="mt-8" aria-labelledby="learn-more-heading">
            <div className="max-w-3xl">
              <p className="text-sm font-semibold uppercase tracking-[0.14em] text-gold">관련 정보</p>
              <h2 id="learn-more-heading" className="mt-2 text-2xl font-semibold tracking-tight text-navy">
                내 급여 더 알아보기
              </h2>
              <p className="mt-3 leading-relaxed text-muted">
                계산 결과를 확인한 다음 필요한 내용을 이어서 살펴보세요.
              </p>
            </div>

            <div className="mt-7 grid gap-5 md:grid-cols-3">
              <Link
                href="/minimum-wage-guide"
                className="group flex min-h-48 flex-col rounded-2xl border border-gold/40 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-2"
              >
                <span className="w-fit rounded-full bg-gold/10 px-3 py-1 text-xs font-semibold text-navy">사용 가능</span>
                <h3 className="mt-4 text-lg font-semibold text-navy">내 시급이 최저임금 이상인지 확인하기</h3>
                <p className="mt-2 flex-1 text-sm leading-6 text-muted">최신 National Minimum Wage와 캐주얼 기준을 비교해 보세요.</p>
                <span className="mt-5 text-sm font-semibold text-navy group-hover:text-navy-light">최저임금 확인하기 &rarr;</span>
              </Link>

              <Link href="/casual-loading-guide" className="group flex min-h-48 flex-col rounded-2xl border border-gold/40 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-2">
                <span className="w-fit rounded-full bg-gold/10 px-3 py-1 text-xs font-semibold text-navy">사용 가능</span>
                <h3 className="mt-4 text-lg font-semibold text-navy">Casual Loading 이해하기</h3>
                <p className="mt-2 flex-1 text-sm leading-6 text-muted">캐주얼 시급이 더 높은 이유와 25% 로딩의 의미를 쉽게 알아보세요.</p>
                <span className="mt-5 text-sm font-semibold text-navy group-hover:text-navy-light">가이드 읽기 &rarr;</span>
              </Link>

              <Link href="/super-guide" className="group flex min-h-48 flex-col rounded-2xl border border-gold/40 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-2">
                <span className="w-fit rounded-full bg-gold/10 px-3 py-1 text-xs font-semibold text-navy">사용 가능</span>
                <h3 className="mt-4 text-lg font-semibold text-navy">Super 이해하기</h3>
                <p className="mt-2 flex-1 text-sm leading-6 text-muted">Super가 언제, 어떻게 납부되고 무엇을 확인해야 하는지 쉽게 알아보세요.</p>
                <span className="mt-5 text-sm font-semibold text-navy group-hover:text-navy-light">가이드 읽기 &rarr;</span>
              </Link>
            </div>
          </section>

          <section className="mt-8 rounded-2xl border border-border bg-white p-6 sm:p-8">
            <h2 className="text-xl font-semibold text-navy">계산 기준 및 주의사항</h2>
            <div className="mt-3 max-w-4xl space-y-3 text-sm leading-7 text-muted sm:text-base">
              <p>세전 급여는 입력한 시급과 주당 근무시간을 연간 52주로 환산합니다. Super는 2026–27 일반 SG 비율 12%를 적용합니다.</p>
              <p>예상 세후 소득은 2026–27 호주 세법상 거주자 기본 개인소득세율을 사용합니다. Medicare Levy, HELP/HECS, 세액공제, 소득공제, 초과근무·주말·공휴일 수당은 포함하지 않습니다.</p>
              <p>실제 세금과 Super는 개인 상황과 Ordinary Time Earnings에 따라 달라질 수 있으므로 ATO, Fair Work 또는 등록 전문가의 공식 자료를 확인하세요.</p>
            </div>
            <div className="mt-4 flex flex-wrap gap-4">
              <a href="https://www.ato.gov.au/law/view/pdf/acts/20250028.pdf" target="_blank" rel="noreferrer" className="text-sm font-semibold text-navy underline decoration-gold decoration-2 underline-offset-4">ATO 2026–27 세율 근거</a>
              <a href="https://www.ato.gov.au/tax-rates-and-codes/key-superannuation-rates-and-thresholds/super-guarantee" target="_blank" rel="noreferrer" className="text-sm font-semibold text-navy underline decoration-gold decoration-2 underline-offset-4">ATO Super 비율 확인</a>
            </div>
          </section>
        </Container>
      </main>
      <Footer />
    </>
  );
}
