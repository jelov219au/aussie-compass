import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { SuperCalculator } from "@/components/tools/SuperCalculator";
import { Container } from "@/components/ui/Container";

export const metadata: Metadata = {
  title: "Super 계산기 | Aussie Compass",
  description: "시급과 주당 근무 시간을 기준으로 고용주가 납부하는 예상 Super 금액을 계산해 보세요.",
};

export default function SuperCalculatorPage() {
  return (
    <>
      <Header />
      <main className="py-12 sm:py-16">
        <Container>
          <Link href="/#tools" className="inline-flex text-sm font-medium text-muted transition-colors hover:text-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-2">
            &larr; 도구 목록으로 돌아가기
          </Link>

          <div className="mb-10 mt-6 max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-gold">무료 도구</p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-navy sm:text-4xl">Super 계산기</h1>
            <p className="mt-4 text-base leading-relaxed text-muted sm:text-lg">
              예상 급여를 기준으로 고용주가 납부하는 Superannuation을 간편하게 계산해 보세요.
            </p>
          </div>

          <SuperCalculator />

          <section className="mt-8 rounded-2xl border border-border bg-white p-6 sm:p-8">
            <h2 className="text-xl font-semibold text-navy">계산 결과 안내</h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-muted sm:text-base">
              이 계산기는 일반 Super Guarantee 비율 12%와 연간 52주 근무를 기준으로 한 예상치입니다.
              실제 Super는 Ordinary Time Earnings, 고용 형태, 급여 구성 및 적용되는 상한에 따라 달라질 수 있습니다.
              정확한 금액은 급여명세서 또는 고용주와 확인해 주세요.
            </p>
            <a
              href="https://www.ato.gov.au/tax-rates-and-codes/key-superannuation-rates-and-thresholds/super-guarantee"
              target="_blank"
              rel="noreferrer"
              className="mt-4 inline-flex text-sm font-semibold text-navy underline decoration-gold decoration-2 underline-offset-4"
            >
              ATO 공식 Super Guarantee 비율 확인
            </a>
          </section>
        </Container>
      </main>
      <Footer />
    </>
  );
}
