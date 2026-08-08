import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { MinimumWageCalculator } from "@/components/tools/MinimumWageCalculator";
import { Container } from "@/components/ui/Container";

export const metadata: Metadata = {
  title: "호주 최저임금·캐주얼 로딩 가이드 | Aussie Compass",
  description: "2025년 7월부터 적용되는 호주 National Minimum Wage와 캐주얼 로딩을 기준으로 예상 급여를 계산해 보세요.",
};

export default function MinimumWageGuidePage() {
  return (
    <>
      <Header />
      <main className="py-12 sm:py-16">
        <Container>
          <Link href="/#tools" className="inline-flex text-sm font-medium text-muted transition-colors hover:text-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-2">
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

          <section className="mt-8 rounded-2xl border border-border bg-white p-6 sm:p-8">
            <h2 className="text-xl font-semibold text-navy">꼭 확인하세요</h2>
            <div className="mt-3 max-w-3xl space-y-3 text-sm leading-7 text-muted sm:text-base">
              <p>
                이 도구는 2025년 7월 1일부터 적용되는 일반 성인 National Minimum Wage를 기준으로 합니다.
                풀타임·파트타임은 시간당 A$24.95, 캐주얼은 25% 로딩이 포함된 시간당 A$31.19를 사용합니다.
              </p>
              <p>
                실제 최저임금은 적용되는 Modern Award, Enterprise Agreement, 직종·등급, 나이, 수습 여부,
                주말·공휴일·야간 근무에 따라 더 높을 수 있습니다. 이 결과만으로 본인의 정확한 법정 시급을 판단하지 마세요.
              </p>
            </div>
            <a
              href="https://www.fairwork.gov.au/newsroom/media-releases/2025-media-releases/july-2025/20250701-awr-2025-media-release"
              target="_blank"
              rel="noreferrer"
              className="mt-4 inline-flex text-sm font-semibold text-navy underline decoration-gold decoration-2 underline-offset-4"
            >
              Fair Work 공식 최저임금 안내 확인
            </a>
          </section>
        </Container>
      </main>
      <Footer />
    </>
  );
}
