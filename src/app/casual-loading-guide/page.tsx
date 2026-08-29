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

          <section className="mt-10 border-t border-navy/20 pt-10" aria-labelledby="casual-calculation-heading">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">01 · 계산 순서</p>
            <h2 id="casual-calculation-heading" className="mt-2 text-2xl font-semibold text-navy sm:text-3xl">Base rate에 25%를 한 번 더하면 끝나는지 확인하세요</h2>
            <p className="mt-3 max-w-4xl text-sm leading-7 text-muted">Award마다 Casual ordinary rate, Weekend·Public holiday penalty와 Overtime을 표현하는 방식이 다를 수 있어요. 광고에 적힌 시급에서 임의로 25%를 더하기보다 적용 Award의 Pay guide 또는 PACT 결과를 사용하세요.</p>
            <ol className="mt-6 grid gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
              {[
                ["01", "Award·Agreement", "실제 업종·직무와 사업장 Agreement부터 확인"],
                ["02", "Classification", "책임·자격·업무 단계에 맞는 Level 선택"],
                ["03", "Casual ordinary rate", "Loading 포함 여부와 표시 방식을 확인"],
                ["04", "실제 Shift", "주말·야간·공휴일·Overtime·Allowance 추가 확인"],
              ].map(([number, title, body]) => <li key={number} className="bg-white p-5"><span className="font-mono text-xs text-gold-ink">{number}</span><h3 className="mt-2 font-semibold text-navy">{title}</h3><p className="mt-2 text-sm leading-6 text-muted">{body}</p></li>)}
            </ol>
          </section>

          <section className="mt-10 grid gap-5 lg:grid-cols-2" aria-labelledby="casual-rights-heading">
            <article className="rounded-2xl border border-border bg-white p-6 sm:p-8">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">02 · Loading 밖의 권리</p>
              <h2 id="casual-rights-heading" className="mt-2 text-2xl font-semibold text-navy">Casual이라고 모든 휴가·보호가 없는 것은 아니에요</h2>
              <p className="mt-4 text-sm leading-7 text-muted">25% Loading은 일반적으로 유급 연차·유급 Personal/carer&apos;s leave, Notice와 Redundancy 등 일부 차이를 보완합니다. 하지만 Casual도 상황에 따라 아래 권리를 가질 수 있으므로 “Loading에 전부 포함됐다”는 설명만 믿지 마세요.</p>
              <ul className="mt-5 space-y-3 text-sm leading-6 text-muted">{["Super guarantee와 안전한 근무환경", "Paid family and domestic violence leave", "Unpaid carer’s leave·Compassionate leave의 Casual 적용 범위", "Community service leave와 Long service leave의 적용 규칙", "최저임금·Penalty·Allowance·Payslip·근무기록 권리", "차별·Adverse action·부당한 해고 관련 보호의 자격 조건"].map((item) => <li key={item} className="border-l-2 border-gold pl-3">{item}</li>)}</ul>
            </article>
            <article className="rounded-2xl bg-navy p-6 text-white sm:p-8">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">03 · 실제 관계 확인</p>
              <h2 className="mt-2 text-2xl font-semibold">매주 같은 Roster가 이어진다면</h2>
              <p className="mt-4 text-sm leading-7 text-white/75">Casual이라는 계약 제목만으로 현재 관계가 영원히 고정되는 것은 아니에요. 실제로 더 이상 Casual 정의에 맞지 않는다고 생각하고 근속기간 등 요건을 충족하면 Employee choice pathway로 Permanent 전환 의사를 서면 통지할 수 있습니다.</p>
              <ul className="mt-5 space-y-3 text-sm leading-6 text-white/75"><li>일반 사업장은 최소 6개월, Small business는 12개월 근속 요건 확인</li><li>최근 근무 패턴과 앞으로의 지속 근무 약속을 함께 설명</li><li>고용주는 정해진 사유와 절차에 따라 답변</li><li>전환은 자동 승격이나 모두에게 유리한 선택을 뜻하지 않음</li><li>현재 Fair Work 기준과 개인 계약을 신청 전에 다시 확인</li></ul>
            </article>
          </section>

          <section className="mt-10 rounded-2xl border border-border bg-surface p-6 sm:p-8" aria-labelledby="casual-payslip-heading">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">04 · Payslip 검산</p>
            <h2 id="casual-payslip-heading" className="mt-2 text-2xl font-semibold text-navy">Shift 한 번을 이렇게 나눠보세요</h2>
            <div className="mt-5 grid gap-3 md:grid-cols-2">{["Pay period와 실제 Shift 날짜가 같은지", "Base classification과 Casual ordinary rate가 맞는지", "Saturday·Sunday·Public holiday 시간이 구분됐는지", "Overtime 시작 기준과 계산 순서가 맞는지", "Minimum engagement보다 짧게 불려간 경우 지급시간", "Unpaid break를 실제로 쉬었는지", "Uniform·Meal·Travel·Tool allowance 해당 여부", "Super·PAYG·기타 Deduction을 설명할 수 있는지"].map((item) => <p key={item} className="flex gap-3 rounded-xl border border-border bg-white p-4 text-sm leading-6 text-muted"><span aria-hidden="true" className="text-gold-ink">□</span><span>{item}</span></p>)}</div>
          </section>

          <section className="mt-10 rounded-2xl border border-navy/20 bg-white p-6 sm:p-8" aria-labelledby="casual-sources-heading">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">공식 자료 기준 · 2026.08.30 확인</p>
            <h2 id="casual-sources-heading" className="mt-2 text-2xl font-semibold text-navy">최종 확인 출발점</h2>
            <ul className="mt-5 grid gap-3 sm:grid-cols-2">
              <li><a href="https://www.fairwork.gov.au/starting-employment/types-of-employees/casual-employees" target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center text-sm font-semibold text-navy underline decoration-gold decoration-2 underline-offset-4">Fair Work Casual employees ↗</a><p className="text-sm leading-6 text-muted">Casual 정의, Loading, NES 권리와 고용 시작 정보</p></li>
              <li><a href="https://www.fairwork.gov.au/starting-employment/types-of-employees/casual-employees/becoming-a-permanent-employee" target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center text-sm font-semibold text-navy underline decoration-gold decoration-2 underline-offset-4">Becoming a permanent employee ↗</a><p className="text-sm leading-6 text-muted">Employee choice pathway의 현재 자격과 절차</p></li>
              <li><a href="https://www.fairwork.gov.au/pay-and-wages/minimum-wages" target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center text-sm font-semibold text-navy underline decoration-gold decoration-2 underline-offset-4">Fair Work Minimum wages ↗</a><p className="text-sm leading-6 text-muted">Award-free Rate와 별도 Minimum wage 유형</p></li>
              <li><a href="https://calculate.fairwork.gov.au/" target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center text-sm font-semibold text-navy underline decoration-gold decoration-2 underline-offset-4">Pay and Conditions Tool ↗</a><p className="text-sm leading-6 text-muted">Award·Classification·Shift 조건별 실제 금액 계산</p></li>
            </ul>
          </section>
        </Container>
      </main>
      <Footer />
    </>
  );
}
