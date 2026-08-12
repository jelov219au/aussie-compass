import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Container } from "@/components/ui/Container";
import { createPageMetadata } from "@/lib/site";

export const metadata = createPageMetadata({
  title: "호주 Super 쉽게 이해하기 | Aussie Compass",
  description: "호주 Superannuation 12%의 의미, 납부 시기, 급여 패키지와의 차이, 확인 방법을 쉬운 한국어로 알아보세요.",
  path: "/super-guide",
});

const checkItems = [
  "급여명세서(payslip)에 표시된 Super 금액 확인",
  "본인의 Super fund 앱이나 웹사이트에서 입금 내역 확인",
  "myGov에 로그인한 뒤 ATO → Super 메뉴에서 계좌와 잔액 확인",
];

export default function SuperGuidePage() {
  return (
    <>
      <Header />
      <main className="py-12 sm:py-16">
        <Container>
          <Link href="/salary-calculator" className="inline-flex text-sm font-medium text-muted transition-colors hover:text-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-2">
            &larr; 통합 급여 계산기로 돌아가기
          </Link>

          <div className="mb-10 mt-6 max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-gold">급여 가이드</p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-navy sm:text-4xl">Super 쉽게 이해하기</h1>
            <p className="mt-4 text-base leading-relaxed text-muted sm:text-lg">
              급여와 함께 보이는 Super 12%가 무엇인지, 내 통장에 들어오는 돈과 어떻게 다른지 알아보세요.
            </p>
          </div>

          <section className="rounded-2xl bg-navy p-6 text-white shadow-sm sm:p-8" aria-labelledby="super-example-heading">
            <p className="text-sm font-semibold text-gold">간단한 예시</p>
            <h2 id="super-example-heading" className="mt-2 text-2xl font-semibold">연봉이 A$70,000이라면</h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              <div className="rounded-xl border border-white/10 bg-white/10 p-5">
                <p className="text-sm text-white/65">세전 연봉</p>
                <p className="mt-2 text-2xl font-semibold">A$70,000</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/10 p-5">
                <p className="text-sm text-white/65">예상 Super 12%</p>
                <p className="mt-2 text-2xl font-semibold">A$8,400</p>
              </div>
              <div className="rounded-xl border border-gold/40 bg-gold/10 p-5">
                <p className="text-sm text-white/75">예상 Total Package</p>
                <p className="mt-2 text-2xl font-semibold">A$78,400</p>
              </div>
            </div>
            <p className="mt-5 text-sm leading-6 text-white/70">
              연봉 A$70,000 전체가 Super 계산 대상이고, 채용 조건이 “A$70,000 plus super”인 단순 예시입니다.
            </p>
          </section>

          <section className="mt-8 grid gap-5 md:grid-cols-2" aria-label="Super 핵심 설명">
            <article className="rounded-2xl border border-border bg-white p-6 sm:p-8">
              <h2 className="text-xl font-semibold text-navy">Super는 월급의 일부인가요?</h2>
              <p className="mt-3 leading-7 text-muted">
                Superannuation은 은퇴 후를 위해 적립하는 돈입니다. 일반적으로 고용주가 급여와 별도로 본인이 선택한 Super fund에 납부하므로, 매주 또는 매달 받는 실수령액에는 포함되지 않습니다.
              </p>
            </article>
            <article className="rounded-2xl border border-border bg-white p-6 sm:p-8">
              <h2 className="text-xl font-semibold text-navy">무조건 총급여의 12%인가요?</h2>
              <p className="mt-3 leading-7 text-muted">
                항상 그런 것은 아닙니다. 2026–27 일반 SG 비율은 12%지만 실제 계산 대상은 qualifying earnings이며, 보통 ordinary time earnings를 포함합니다. 초과근무 수당 등 일부 금액은 다르게 취급될 수 있습니다.
              </p>
            </article>
          </section>

          <section className="mt-8 rounded-2xl border border-border bg-surface p-6 sm:p-8" aria-labelledby="package-heading">
            <h2 id="package-heading" className="text-2xl font-semibold tracking-tight text-navy">채용 공고의 연봉 표기는 꼭 구분하세요</h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-border bg-white p-5">
                <h3 className="font-semibold text-navy">A$70,000 plus super</h3>
                <p className="mt-2 text-sm leading-6 text-muted">세전 연봉 A$70,000에 고용주 Super가 추가됩니다. 단순 계산상 총 패키지는 A$78,400입니다.</p>
              </div>
              <div className="rounded-xl border border-border bg-white p-5">
                <h3 className="font-semibold text-navy">A$70,000 package including super</h3>
                <p className="mt-2 text-sm leading-6 text-muted">A$70,000 안에 Super가 포함됩니다. 단순 역산 시 세전 급여는 약 A$62,500, Super는 약 A$7,500입니다.</p>
              </div>
            </div>
          </section>

          <section className="mt-8 rounded-2xl border border-border bg-white p-6 sm:p-8" aria-labelledby="payday-super-heading">
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-gold">2026년 7월부터</p>
            <h2 id="payday-super-heading" className="mt-2 text-2xl font-semibold tracking-tight text-navy">Payday Super가 적용됩니다</h2>
            <p className="mt-4 max-w-4xl leading-7 text-muted">
              고용주는 급여일마다 Super를 계산해 납부해야 하며, 원칙적으로 급여일로부터 7영업일 안에 직원의 Super fund가 받아야 합니다. 급여명세서에 금액이 표시되어 있어도 실제 계좌 입금 내역을 함께 확인하는 것이 좋습니다.
            </p>
          </section>

          <section className="mt-8 rounded-2xl border border-border bg-white p-6 sm:p-8" aria-labelledby="check-super-heading">
            <h2 id="check-super-heading" className="text-2xl font-semibold tracking-tight text-navy">내 Super 확인 방법</h2>
            <ol className="mt-5 space-y-3">
              {checkItems.map((item, index) => (
                <li key={item} className="flex gap-3 text-muted">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gold/15 text-sm font-semibold text-navy">{index + 1}</span>
                  <span className="pt-0.5 leading-6">{item}</span>
                </li>
              ))}
            </ol>
            <div className="mt-6 flex flex-wrap gap-4">
              <a href="https://www.ato.gov.au/tax-rates-and-codes/key-superannuation-rates-and-thresholds/super-guarantee" target="_blank" rel="noreferrer" className="text-sm font-semibold text-navy underline decoration-gold decoration-2 underline-offset-4">ATO Super 비율 확인</a>
              <a href="https://softwaredevelopers.ato.gov.au/PaydaySuper" target="_blank" rel="noreferrer" className="text-sm font-semibold text-navy underline decoration-gold decoration-2 underline-offset-4">ATO Payday Super 안내</a>
              <a href="https://my.gov.au/en/about/help/mygov-website/link-services-to-your-account/link-the-australian-taxation-office" target="_blank" rel="noreferrer" className="text-sm font-semibold text-navy underline decoration-gold decoration-2 underline-offset-4">myGov에서 ATO 연결하기</a>
            </div>
          </section>

          <aside className="mt-8 rounded-xl border border-gold/40 bg-gold/10 p-5 text-sm leading-6 text-muted">
            이 가이드는 일반적인 정보이며 개인 재정 조언이 아닙니다. 실제 Super 자격과 금액은 고용 형태, 지급 항목, 계약 조건과 최대 기여 기준 등에 따라 달라질 수 있으므로 ATO 또는 등록 전문가의 공식 안내를 확인하세요.
          </aside>
        </Container>
      </main>
      <Footer />
    </>
  );
}
