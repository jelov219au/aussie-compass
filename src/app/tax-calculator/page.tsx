import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { TaxCalculator } from "@/components/tools/TaxCalculator";
import { Container } from "@/components/ui/Container";

export const metadata: Metadata = {
  title: "호주 소득세 계산기 | Aussie Compass",
  description: "2025–26 호주 거주자 개인소득세율을 기준으로 예상 소득세와 세후 소득을 계산해 보세요.",
};

export default function TaxCalculatorPage() {
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
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-navy sm:text-4xl">호주 소득세 계산기</h1>
            <p className="mt-4 text-base leading-relaxed text-muted sm:text-lg">
              연간 과세소득을 기준으로 예상 소득세와 세후 소득을 간편하게 확인하세요.
            </p>
          </div>

          <TaxCalculator />

          <section className="mt-8 rounded-2xl border border-border bg-white p-6 sm:p-8">
            <h2 className="text-xl font-semibold text-navy">계산 결과 안내</h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-muted sm:text-base">
              이 계산기는 2025–26 소득연도의 호주 세법상 거주자 개인소득세율을 적용한 단순 예상치입니다.
              Medicare Levy, Medicare Levy Surcharge, HELP/HECS 상환금, 세액공제, 소득공제 및 기타 개인 상황은
              포함하지 않습니다. 실제 납부액은 ATO 또는 등록 세무사와 확인해 주세요.
            </p>
            <a
              href="https://www.ato.gov.au/tax-rates-and-codes/tax-rates-australian-residents"
              target="_blank"
              rel="noreferrer"
              className="mt-4 inline-flex text-sm font-semibold text-navy underline decoration-gold decoration-2 underline-offset-4"
            >
              ATO 공식 개인소득세율 확인
            </a>
          </section>
        </Container>
      </main>
      <Footer />
    </>
  );
}
