import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Container } from "@/components/ui/Container";
import { BreadcrumbJsonLd } from "@/components/seo/JsonLd";
import { createPageMetadata } from "@/lib/site";

export const metadata = createPageMetadata({
  title: "호주 Casual Loading 쉬운 설명 | Hoju Compass",
  description: "호주 캐주얼 로딩 25%의 의미와 풀타임·파트타임 급여와의 차이를 쉬운 한국어로 알아보세요.",
  path: "/casual-loading-guide",
});

const comparisonItems = [
  {
    label: "시급",
    permanent: "기본 시급 적용",
    casual: "보통 기본 시급 + 25% 로딩",
  },
  {
    label: "유급 연차",
    permanent: "일반적으로 제공",
    casual: "일반적으로 제공되지 않음",
  },
  {
    label: "유급 병가·돌봄 휴가",
    permanent: "일반적으로 제공",
    casual: "일반적으로 제공되지 않음",
  },
  {
    label: "근무시간",
    permanent: "정기적인 근무시간이 일반적",
    casual: "확정된 지속 근무 약속이 없을 수 있음",
  },
];

export default function CasualLoadingGuidePage() {
  return (
    <>
      <BreadcrumbJsonLd items={[{ name: "홈", path: "/" }, { name: "급여 가이드", path: "/guides" }, { name: "Casual Loading", path: "/casual-loading-guide" }]} />
      <Header />
      <main className="py-12 sm:py-16">
        <Container>
          <Link href="/salary-calculator" className="inline-flex text-sm font-medium text-muted transition-colors hover:text-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-2">
            &larr; 통합 급여 계산기로 돌아가기
          </Link>

          <div className="mb-10 mt-6 max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-gold">급여 가이드</p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-navy sm:text-4xl">Casual Loading 이해하기</h1>
            <p className="mt-4 text-base leading-relaxed text-muted sm:text-lg">
              캐주얼 시급이 왜 더 높은지, 25% 로딩이 무엇을 보완하는지 쉽게 알아보세요.
            </p>
          </div>

          <section className="rounded-2xl bg-navy p-6 text-white shadow-sm sm:p-8" aria-labelledby="loading-example-heading">
            <p className="text-sm font-semibold text-gold">간단한 예시</p>
            <h2 id="loading-example-heading" className="mt-2 text-2xl font-semibold">기본 시급이 A$26.44라면</h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              <div className="rounded-xl border border-white/10 bg-white/10 p-5">
                <p className="text-sm text-white/65">기본 시급</p>
                <p className="mt-2 text-2xl font-semibold">A$26.44</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/10 p-5">
                <p className="text-sm text-white/65">25% 로딩</p>
                <p className="mt-2 text-2xl font-semibold">A$6.61</p>
              </div>
              <div className="rounded-xl border border-gold/40 bg-gold/10 p-5">
                <p className="text-sm text-white/75">캐주얼 최저 시급</p>
                <p className="mt-2 text-2xl font-semibold">A$33.05</p>
              </div>
            </div>
            <p className="mt-5 text-sm leading-6 text-white/70">
              위 금액은 2026년 7월 1일부터 적용되는 일반 성인 award·agreement-free National Minimum Wage 예시입니다.
            </p>
          </section>

          <section className="mt-8 rounded-2xl border border-border bg-white p-6 sm:p-8" aria-labelledby="why-loading-heading">
            <h2 id="why-loading-heading" className="text-2xl font-semibold tracking-tight text-navy">왜 25%를 더 받나요?</h2>
            <p className="mt-4 max-w-4xl leading-7 text-muted">
              캐주얼 로딩은 캐주얼 근로자가 일반적으로 받지 못하는 유급 연차, 유급 개인·돌봄 휴가,
              해고 통지와 퇴직 관련 일부 권리 등을 보완하기 위해 기본 시급에 추가되는 금액입니다.
              시급이 더 높다고 해서 언제나 풀타임·파트타임보다 전체 조건이 더 좋은 것은 아닙니다.
            </p>

            <div className="mt-7 overflow-x-auto">
              <table className="w-full min-w-[620px] border-separate border-spacing-0 text-left text-sm">
                <thead>
                  <tr>
                    <th className="border-b border-border px-4 py-3 font-semibold text-navy">비교 항목</th>
                    <th className="border-b border-border px-4 py-3 font-semibold text-navy">풀타임·파트타임</th>
                    <th className="border-b border-border px-4 py-3 font-semibold text-navy">캐주얼</th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonItems.map((item) => (
                    <tr key={item.label}>
                      <th className="border-b border-border/70 px-4 py-4 font-medium text-navy">{item.label}</th>
                      <td className="border-b border-border/70 px-4 py-4 text-muted">{item.permanent}</td>
                      <td className="border-b border-border/70 px-4 py-4 text-muted">{item.casual}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="mt-8 rounded-2xl border border-border bg-surface p-6 sm:p-8" aria-labelledby="check-award-heading">
            <h2 id="check-award-heading" className="text-2xl font-semibold tracking-tight text-navy">25%만 확인하면 충분할까요?</h2>
            <div className="mt-4 max-w-4xl space-y-3 leading-7 text-muted">
              <p>아닙니다. 대부분의 근로자는 Modern Award 또는 Enterprise Agreement의 적용을 받습니다.</p>
              <p>직종·등급, 최소 근무시간, 주말·공휴일·야간·초과근무 수당은 적용 문서에 따라 달라질 수 있습니다. 일부 수당은 캐주얼 로딩과 별도로 계산되고, 계산 순서도 Award마다 다를 수 있습니다.</p>
              <p>급여명세서의 기본 시급과 적용 Award·직급을 확인하고 Fair Work의 Pay and Conditions Tool로 최종 금액을 확인하세요.</p>
            </div>
            <div className="mt-5 flex flex-wrap gap-4">
              <a href="https://www.fairwork.gov.au/starting-employment/types-of-employees/casual-employees" target="_blank" rel="noreferrer" className="text-sm font-semibold text-navy underline decoration-gold decoration-2 underline-offset-4">Fair Work 캐주얼 근로자 안내</a>
              <a href="https://calculate.fairwork.gov.au/" target="_blank" rel="noreferrer" className="text-sm font-semibold text-navy underline decoration-gold decoration-2 underline-offset-4">공식 Pay and Conditions Tool</a>
            </div>
          </section>
        </Container>
      </main>
      <Footer />
    </>
  );
}
