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
