import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { PayCalculator } from "@/components/tools/PayCalculator";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";

export const metadata: Metadata = {
  title: "급여 계산기 | Aussie Compass",
  description: "시급과 주당 근무 시간을 기준으로 호주 달러 세전 주급, 월급, 연봉을 계산해 보세요.",
};

export default function PayCalculatorPage() {
  return (
    <>
      <Header />
      <main className="py-12 sm:py-16">
        <Container>
          <Link href="/" className="inline-flex text-sm font-medium text-muted transition-colors hover:text-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-2">
            &larr; 홈으로 돌아가기
          </Link>

          <div className="mb-10 mt-6 max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-gold">무료 도구</p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-navy sm:text-4xl">급여 계산기</h1>
            <p className="mt-4 text-base leading-relaxed text-muted sm:text-lg">
              호주 달러 기준 세전 주급, 월급, 연봉을 간편하게 계산해 보세요.
            </p>
          </div>

          <PayCalculator />

          <section className="mt-8 rounded-2xl border border-border bg-white p-6 sm:p-8" aria-labelledby="about-calculator">
            <h2 id="about-calculator" className="text-xl font-semibold text-navy">계산 결과 안내</h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-muted sm:text-base">
              이 계산기는 입력한 시급과 주당 근무 시간을 바탕으로 세전 소득을 예상합니다.
              연간 52주 근무를 기준으로 하며, 세금과 퇴직연금(Superannuation), 초과 근무
              수당, 가산 수당 및 무급 휴가는 포함하지 않습니다.
            </p>
          </section>

          <section className="mt-8 rounded-2xl bg-surface px-6 py-10 text-center sm:px-10 sm:py-12" aria-labelledby="waiting-list-heading">
            <h2 id="waiting-list-heading" className="text-2xl font-semibold tracking-tight text-navy sm:text-3xl">
              Need more Australia work tools?
            </h2>
            <p className="mx-auto mt-3 max-w-xl leading-relaxed text-muted">
              More practical calculators and guides are coming soon.
            </p>
            <Button className="mt-6">Join the waiting list</Button>
          </section>
        </Container>
      </main>
      <Footer />
    </>
  );
}
