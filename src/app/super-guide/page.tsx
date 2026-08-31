import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Container } from "@/components/ui/Container";
import { BreadcrumbJsonLd } from "@/components/seo/JsonLd";
import { createPageMetadata } from "@/lib/site";

export const metadata = createPageMetadata({
  title: "호주 Super 쉽게 이해하기 | Hoju Compass",
  description: "호주 Superannuation 12%의 의미, 납부 시기, 급여 패키지와의 차이, 확인 방법을 쉬운 한국어로 알아보세요.",
  path: "/super-guide",
});

const checkItems = [
  "급여명세서(payslip)에 표시된 Super 금액 확인",
  "본인의 Super fund 앱이나 웹사이트에서 입금 내역 확인",
  "myGov에 로그인한 뒤 ATO → Super 메뉴에서 계좌와 잔액 확인",
];

const unpaidSteps = [
  ["Payslip과 실제 입금 비교", "급여명세서의 Super 표시만 보지 말고 fund 거래내역에서 받은 날짜·금액·고용주명을 확인합니다."],
  ["기간과 고용 정보 정리", "근무 시작·종료일, 급여일, ordinary hours, payslip, 고용주 ABN과 선택한 fund 정보를 모읍니다."],
  ["고용주·Fund에 서면 확인", "어느 급여기간의 얼마를 언제 어떤 fund로 보냈는지 묻고 답변을 보관합니다."],
  ["ATO 신고 여부 판단", "미납·지연·잘못된 fund 납부가 확인되면 ATO의 unpaid super 절차에서 자격 확인 후 신고합니다."],
];

const copyQuestions = [
  ["Please confirm the super amount, payment date and fund for each pay period.", "각 급여기간별 Super 금액, 지급일과 납부한 fund를 확인해 주세요."],
  ["My payslip shows super, but I cannot see the contribution in my fund account.", "급여명세서에는 Super가 표시되지만 제 fund 계좌에는 입금이 보이지 않습니다."],
  ["Please provide the transaction reference and the member details used for the payment.", "납부 거래번호와 납부에 사용한 회원정보를 제공해 주세요."],
  ["Please confirm whether any contribution was rejected or returned by the fund.", "fund에서 거절되거나 반환된 납부가 있는지 확인해 주세요."],
];

export default function SuperGuidePage() {
  return (
    <>
      <BreadcrumbJsonLd items={[{ name: "홈", path: "/" }, { name: "급여 가이드", path: "/guides" }, { name: "Super 이해하기", path: "/super-guide" }]} />
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
              급여와 함께 보이는 Super 12%가 무엇인지, 실제 입금을 어떻게 확인하고 누락됐을 때 어떤 순서로 대응하는지 알아보세요.
            </p>
            <p className="mt-3 text-sm font-medium text-muted">공식 정보 재확인: 2026년 8월</p>
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
              2026년 7월 1일부터 지급한 급여는 각 급여일을 기준으로 Super를 계산하며, 원칙적으로 급여일 이후 7영업일 안에 직원의 Super fund가 필요한 회원정보와 함께 받아야 합니다. ATO는 처리시간을 고려해 급여일에 송금할 것을 권장합니다. 급여명세서의 표시와 실제 fund 입금은 따로 확인하세요.
            </p>
            <p className="mt-3 max-w-4xl leading-7 text-muted">
              신규 직원의 첫 해당 납부, 또는 기존 fund 납부를 중단하고 새 적격 fund에 하는 첫 해당 납부는 20영업일까지 허용되는 예외가 있습니다. 기한이 겹치는 후속 급여나 정규 급여일 밖의 지급에도 별도 규칙이 있으므로, 7영업일이 지났다는 이유만으로 바로 미납을 단정하지 마세요.
            </p>
            <p className="mt-3 max-w-4xl text-sm leading-7 text-muted">
              여기서 영업일은 주말과 호주 어느 주·준주든 전역에 적용되는 공휴일을 제외합니다. 2026년 6월 30일까지 지급한 급여는 이전 분기별 규칙을 확인하세요. 기한·예외 재확인: 2026년 8월 31일.
            </p>
            <a href="https://www.ato.gov.au/businesses-and-organisations/super-for-employers/paying-super-on-payday/payment-deadlines-for-payday-super" target="_blank" rel="noreferrer" className="mt-4 inline-flex min-h-11 items-center border-b-2 border-gold text-sm font-semibold text-navy">ATO 납부기한·예외 확인 ↗</a>
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
              <a href="https://www.ato.gov.au/businesses-and-organisations/super-for-employers/payday-super" target="_blank" rel="noreferrer" className="text-sm font-semibold text-navy underline decoration-gold decoration-2 underline-offset-4">ATO Payday Super 안내</a>
              <a href="https://my.gov.au/en/about/help/mygov-website/link-services-to-your-account/link-the-australian-taxation-office" target="_blank" rel="noreferrer" className="text-sm font-semibold text-navy underline decoration-gold decoration-2 underline-offset-4">myGov에서 ATO 연결하기</a>
            </div>
          </section>

          <section className="mt-8 border-y border-navy/20 py-8 sm:py-10" aria-labelledby="unpaid-super-heading">
            <div className="grid gap-8 lg:grid-cols-[0.7fr_1.3fr]">
              <div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">Missing contribution</p><h2 id="unpaid-super-heading" className="mt-2 text-2xl font-semibold leading-tight text-navy sm:text-3xl">Payslip에는 있는데<br />계좌에 없다면</h2><p className="mt-4 text-sm leading-7 text-muted">단순 지연인지, 잘못된 회원정보인지, 실제 미납인지 증거를 나눠 확인하세요. 퇴사한 직장도 같은 방식으로 확인할 수 있습니다.</p></div>
              <ol className="grid gap-px bg-border sm:grid-cols-2">{unpaidSteps.map(([title, description], index) => <li key={title} className="bg-white p-5"><span className="font-mono text-xs text-gold">{String(index + 1).padStart(2, "0")}</span><h3 className="mt-2 font-semibold text-navy">{title}</h3><p className="mt-2 text-sm leading-6 text-muted">{description}</p></li>)}</ol>
            </div>
            <a href="https://www.ato.gov.au/individuals-and-families/super-for-individuals-and-families/super/growing-and-keeping-track-of-your-super/unpaid-super-from-your-employer" target="_blank" rel="noreferrer" className="mt-6 inline-flex min-h-12 items-center bg-navy px-5 text-sm font-semibold text-white">ATO Unpaid super 절차 ↗</a>
          </section>

          <section className="mt-8 bg-surface p-6 sm:p-8" aria-labelledby="super-copy-heading"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">Copy & ask</p><h2 id="super-copy-heading" className="mt-2 text-2xl font-semibold leading-tight text-navy">고용주·Payroll에 복사해 물어볼 문장</h2><ul className="mt-6 grid gap-3">{copyQuestions.map(([english, korean], index) => <li key={english} className="border border-border bg-white p-4"><div className="flex gap-4"><span className="font-mono text-sm text-gold">{index + 1}</span><p className="font-medium leading-7 text-navy">{english}<span className="mt-1 block text-sm font-normal leading-6 text-muted">({korean})</span></p></div></li>)}</ul></section>

          <section className="mt-8 grid gap-px bg-border md:grid-cols-3" aria-label="Super 계좌 관리 주의점">
            <article className="bg-white p-6"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-gold">Compare</p><h2 className="mt-2 text-xl font-semibold leading-snug text-navy">Fund는 순위 하나로 고르지 않기</h2><p className="mt-3 text-sm leading-6 text-muted">비슷한 투자옵션의 장기 성과, 총수수료, 보험료·보장·제외사항과 서비스를 함께 비교합니다. 과거 수익률은 미래 수익을 보장하지 않습니다.</p><a href="https://moneysmart.gov.au/how-super-works/choosing-a-super-fund" target="_blank" rel="noreferrer" className="mt-4 inline-flex min-h-11 items-center border-b-2 border-gold text-sm font-semibold text-navy">Moneysmart 선택 가이드 ↗</a></article>
            <article className="bg-white p-6"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-gold">Consolidate</p><h2 className="mt-2 text-xl font-semibold leading-snug text-navy">합치기 전에 보험부터 확인</h2><p className="mt-3 text-sm leading-6 text-muted">계좌를 닫거나 합치면 life·TPD·income protection 보험이 종료될 수 있습니다. 기존 질환, 직업 위험, 대기기간과 새 보험 승인 여부를 먼저 확인하세요.</p><a href="https://moneysmart.gov.au/how-life-insurance-works/insurance-through-super" target="_blank" rel="noreferrer" className="mt-4 inline-flex min-h-11 items-center border-b-2 border-gold text-sm font-semibold text-navy">Super 보험 확인 ↗</a></article>
            <article className="bg-white p-6"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-gold">Protect</p><h2 className="mt-2 text-xl font-semibold leading-snug text-navy">전화 권유·조기 인출 경계</h2><p className="mt-3 text-sm leading-6 text-muted">고수익, 즉시 전환, 비밀번호·인증번호 공유, 쉬운 조기 인출을 압박하면 멈추세요. 링크를 누르지 말고 fund와 ATO 공식 주소로 직접 접속합니다.</p></article>
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
