import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Container } from "@/components/ui/Container";
import { TaxReturnChecklist } from "@/components/tools/TaxReturnChecklist";
import { TaxTimeReminder } from "@/components/tools/TaxTimeReminder";
import { BreadcrumbJsonLd } from "@/components/seo/JsonLd";
import { createPageMetadata } from "@/lib/site";

export const metadata = createPageMetadata({
  title: "호주 택스 리턴 준비 가이드와 체크리스트 | Hoju Compass",
  description: "EOFY 택스 리턴 전 소득 자료, 공제 증빙, 신고 기한을 한 번에 확인하고 개인 체크리스트로 준비하세요.",
  path: "/tax-return-guide",
});

const officialLinks = [
  { href: "https://www.ato.gov.au/individuals-and-families/your-tax-return/how-to-lodge-your-tax-return", title: "신고 방법과 기한", source: "Australian Taxation Office", summary: "myTax 직접 신고, 등록 세무사 이용과 종이 신고 경로를 비교하고 각 방식의 일반적인 제출 기한을 확인하는 원문입니다. 작년 신고가 늦었거나 특수한 사정이 있으면 표시된 날짜만 따르지 말고 ATO 또는 등록 세무사에게 본인 기한을 확인하세요." },
  { href: "https://www.ato.gov.au/individuals-and-families/your-tax-return/how-to-lodge-your-tax-return/lodge-your-tax-return-online-with-mytax/pre-fill-availability", title: "myTax Pre-fill 확인", source: "Australian Taxation Office", summary: "은행·보험사·정부기관 등의 자료 준비 상태와 자동 입력의 한계를 확인합니다. 이 공개 페이지에 고용주별 자료 상태가 표시되는 것은 아니므로 Income statement와 Tax ready 여부는 본인의 ATO 서비스에서 따로 확인하세요. 자동 입력됐어도 금액의 정확성과 누락 여부는 신고자가 대조해야 합니다." },
  { href: "https://www.ato.gov.au/individuals-and-families/income-deductions-offsets-and-records/deductions-you-can-claim", title: "공제 가능 항목", source: "Australian Taxation Office", summary: "업무 관련 비용 등 공제 항목별 기본 조건과 필요한 기록으로 이동하는 공식 허브입니다. 돈을 지출했다는 사실만으로 공제되는 것은 아니며, 소득을 얻는 일과의 관련성·개인 사용분 제외·증빙 보관을 함께 확인해야 합니다." },
  { href: "https://www.tpb.gov.au/registrations_search", title: "등록 세무사 검색", source: "Tax Practitioners Board", summary: "유료로 Tax agent 서비스를 제공하는 사람이 현재 TPB에 등록되어 있는지 이름이나 등록번호로 확인하는 공식 검색입니다. 등록 상태와 조건을 확인한 뒤 서비스 범위, 수수료와 제출 전 검토 절차도 서면으로 물어보세요." },
  { href: "https://www.ato.gov.au/individuals-and-families/coming-to-australia-or-going-overseas/your-tax-residency", title: "세법상 거주자 판단", source: "Australian Taxation Office", summary: "시민권·비자 이름만으로 Tax residency를 정하지 않고 생활·가족·자산·체류 사정을 기준으로 현재 적용되는 거주자 테스트를 확인하는 출발점입니다." },
  { href: "https://www.ato.gov.au/individuals-and-families/income-deductions-offsets-and-records/income-you-must-declare/foreign-and-worldwide-income", title: "해외·전 세계 소득", source: "Australian Taxation Office", summary: "한국 계좌 이자, 배당, 임대, 근로·사업·연금처럼 해외에서 생긴 금액을 어떤 경우 신고하는지 확인합니다. 해외에서 세금을 냈다는 이유만으로 자동 제외하지 않습니다." },
  { href: "https://www.ato.gov.au/individuals-and-families/your-tax-return/amend-your-tax-return", title: "제출 후 수정", source: "Australian Taxation Office", summary: "제출 뒤 누락이나 오류를 발견했을 때 myTax 등으로 Amendment를 요청하는 현재 절차와 적용 가능한 기간을 확인합니다." },
];

const taxQuestions = [
  ["Could you explain why I am being treated as an Australian resident or foreign resident for tax purposes?", "제가 세법상 호주 거주자 또는 외국 거주자로 판단되는 이유를 설명해 주시겠어요?"],
  ["Which Australian and overseas income records do you need from me?", "제게 필요한 호주 및 해외 소득 자료가 무엇인가요?"],
  ["Please show me each deduction and the record supporting it before lodgment.", "제출 전에 각 공제 항목과 그 근거 자료를 보여주세요."],
  ["Please confirm your total fee, any extra charges and who will lodge the return.", "총 수수료, 추가 비용과 누가 신고서를 제출하는지 확인해 주세요."],
  ["Please send me the final return and Notice of Assessment for my records.", "기록 보관을 위해 최종 신고서와 Notice of Assessment를 보내주세요."],
];

export default function TaxReturnGuidePage() {
  return <>
    <BreadcrumbJsonLd items={[{ name: "홈", path: "/" }, { name: "택스 리턴 준비", path: "/tax-return-guide" }]} />
    <Header />
    <main className="py-12 sm:py-16">
      <Container>
        <Link href="/tools" className="inline-flex min-h-11 items-center text-sm font-medium text-muted hover:text-navy">&larr; 도구 목록으로 돌아가기</Link>
        <div className="mt-5 max-w-4xl">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-gold">EOFY 준비 허브</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-navy sm:text-4xl">호주 택스 리턴, 서류부터 차근차근 준비하세요</h1>
          <p className="mt-4 text-base leading-7 text-muted sm:text-lg">신고를 대신하거나 환급액을 추정하지 않습니다. 매년 반복되는 준비 과정을 놓치지 않도록 공식 정보, 준비 순서와 개인 체크리스트를 한곳에 모았습니다.</p>
        </div>

        <section className="my-8 grid gap-4 md:grid-cols-3" aria-label="택스 리턴 핵심 일정">
          <article className="rounded-2xl border border-gold/40 bg-gold/5 p-5"><p className="text-sm font-semibold text-gold">Income year</p><h2 className="mt-2 text-xl font-semibold text-navy">7월 1일–6월 30일</h2><p className="mt-2 text-sm leading-6 text-muted">한 회계연도의 소득과 해당 비용을 기준으로 신고합니다.</p></article>
          <article className="rounded-2xl border border-border bg-white p-5"><p className="text-sm font-semibold text-gold">준비하기 좋은 시점</p><h2 className="mt-2 text-xl font-semibold text-navy">보통 7월 말부터</h2><p className="mt-2 text-sm leading-6 text-muted">대부분의 Pre-fill 자료가 준비된 뒤 확인하면 누락 가능성을 줄일 수 있어요.</p></article>
          <article className="rounded-2xl border border-border bg-white p-5"><p className="text-sm font-semibold text-gold">직접 신고 기한</p><h2 className="mt-2 text-xl font-semibold text-navy">일반적으로 10월 31일</h2><p className="mt-2 text-sm leading-6 text-muted">등록 세무사를 이용한다면 보통 이 날짜 전에 의뢰해야 하며 개인 상황에 따라 달라질 수 있어요.</p></article>
        </section>

        <section className="mb-8 grid gap-5 border-y border-navy/20 bg-white p-6 sm:grid-cols-[1fr_auto] sm:items-center sm:p-8" aria-labelledby="tax-year-tracker-cta"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-gold">7월 전에 시작하기</p><h2 id="tax-year-tracker-cta" className="mt-2 text-2xl font-semibold text-navy">한꺼번에 기억하지 말고, 매달 준비 기록을 쌓으세요</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-muted">소득·지출 후보와 증빙 위치를 현재 브라우저에 기록하고 회계연도별 CSV로 백업할 수 있어요.</p></div><Link href="/tax-prep-tracker" className="inline-flex min-h-12 shrink-0 items-center justify-center bg-gold px-5 text-sm font-semibold text-navy">연중 준비 장부 열기 &rarr;</Link></section>

        <section className="mb-8 rounded-2xl border border-border bg-surface p-6 sm:p-8" aria-labelledby="tax-record-example">
          <p className="text-xs font-semibold text-gold">가상 사례 · 신고 전 자료 대조 연습</p>
          <h2 id="tax-record-example" className="mt-2 text-2xl font-semibold text-navy">통장 입금과 소득 자료를 두 번 더하지 않기</h2>
          <ol className="mt-5 space-y-5 text-sm leading-7 text-muted">
            <li><strong className="text-navy">1. 기간별 폴더를 나눕니다.</strong> 2025-07-01~2026-06-30 폴더 안에 고용주별 Income statement, 은행별 이자명세, 비용 증빙을 구분합니다. 2026-07-01 이후 금액은 다음 2026–27 장부로 분리하세요.</li>
            <li><strong className="text-navy">2. 원본별 금액을 한 번씩 대조합니다.</strong> 한 고용주의 Gross $30,000, PAYG withheld $3,000과 별도 은행 이자 $120이 있다고 가정해요. 소득 자료 대조 대상은 $30,000과 $120입니다. 통장에 들어온 급여 $27,000은 같은 급여의 세후 입금이므로 다시 소득으로 더하지 않습니다. PAYG $3,000은 소득에 더하지 않고 이미 원천징수한 세금 기록으로 따로 비교합니다. 고용주나 은행이 여러 곳이면 각각 한 번씩 대조하세요.</li>
            <li><strong className="text-navy">3. 영수증과 공제 가능성은 구분합니다.</strong> 지출 $100 영수증이 있어도 업무·개인 사용 비율, 회사 환급과 적용할 공제 방식을 확인하기 전에는 $100 공제가 확정되지 않습니다. 장부에는 지출 후보로 두고 원본 보관 위치, 업무 관련성, 회사 보전 여부를 적어 세무사에게 질문하세요.</li>
            <li><strong className="text-navy">4. Tax ready 뒤에도 숫자를 확인합니다.</strong> Tax ready는 고용주가 자료를 finalise한 상태이지 수치가 정확하거나 모든 은행 자료까지 준비됐다는 보장은 아닙니다. 불일치가 있으면 급여 기간과 Gross·withheld의 차액을 적어 고용주에게 문의하고, 미해결 내용을 남겨 확정 전에 검토하세요. 예상 환급액을 단정하기보다 Gross, withheld, 기타 소득 순서로 대조합니다.</li>
          </ol>
          <p className="mt-5 border-l-2 border-gold pl-3 text-xs leading-6 text-muted">다른 항목이 없는 교육용 예시입니다. 환급액·실제 총세금 계산이나 실제 신고 칸을 확정하는 예시가 아닙니다.</p>
          <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm font-semibold text-navy"><a href="https://my.gov.au/en/services/work/currently-employed/tax-when-you-work/tax-time/what-to-do-at-tax-time" target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center underline">myGov 세금 신고 준비 순서 ↗</a><a href="https://www.ato.gov.au/businesses-and-organisations/hiring-and-paying-your-workers/single-touch-payroll/single-touch-payroll-for-employees/accessing-your-income-statement-online" target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center underline">ATO Income statement 확인 ↗</a></div>
        </section>

        <TaxReturnChecklist />

        <section className="mt-8 border-y border-navy/20 bg-white p-6 sm:flex sm:items-center sm:justify-between sm:gap-6 sm:p-8"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-gold">EOFY 구성과 구매·이용조건 확인</p><h2 className="mt-2 text-xl font-semibold text-navy">소득·공제 증빙과 확인 질문을 한 묶음으로 정리하세요</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-muted">공제 후보 기록과 등록 세무사 전달용 요약의 구성, 구매 가능 여부와 이용조건을 제품 페이지에서 확인하세요. 이 안내만으로 구매·사용이 가능하다고 확정하지 않습니다.</p></div><Link href="/eofy-pro" className="mt-4 inline-flex min-h-11 shrink-0 items-center bg-navy px-4 text-sm font-semibold text-white sm:mt-0">EOFY Pack 구성·조건 보기 &rarr;</Link></section>

        <div className="mt-8"><TaxTimeReminder purpose="recent-return" /></div>

        <section className="mt-10 grid gap-6 lg:grid-cols-[1fr_0.85fr]">
          <div className="rounded-2xl border border-border bg-surface p-6 sm:p-8">
            <h2 className="text-2xl font-semibold text-navy">직접 신고와 세무사, 어떻게 고를까요?</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl bg-white p-5"><h3 className="font-semibold text-navy">myTax 직접 신고를 고려</h3><p className="mt-2 text-sm leading-6 text-muted">급여와 은행 이자 중심이고 공제 항목이 단순하며, 본인이 모든 내용을 검토하고 책임질 수 있을 때.</p></div>
              <div className="rounded-xl bg-white p-5"><h3 className="font-semibold text-navy">등록 세무사 상담을 고려</h3><p className="mt-2 text-sm leading-6 text-muted">사업·투자·임대·가상자산·해외 소득, 여러 해의 미신고 또는 거주자 판정처럼 복잡한 사정이 있을 때.</p></div>
            </div>
            <p className="mt-5 text-sm leading-6 text-muted">세무사를 선택할 때는 TPB 등록 여부, 수수료 범위, 추가 비용, 연락 방식과 제출 전 검토 절차를 확인하세요.</p>
          </div>
          <aside className="rounded-2xl bg-navy p-6 text-white sm:p-8">
            <h2 className="text-xl font-semibold">개인정보 안전 수칙</h2>
            <ul className="mt-4 space-y-3 text-sm leading-6 text-white/75">
              <li>• 이메일이나 메시지로 TFN 전체 번호를 보내지 마세요.</li>
              <li>• myGov 로그인 링크는 직접 주소를 입력해 접속하세요.</li>
              <li>• 환급을 미끼로 비밀번호나 인증번호를 요구하면 응하지 마세요.</li>
              <li>• 이 페이지에는 영수증이나 금융 자료를 업로드하지 마세요.</li>
            </ul>
          </aside>
        </section>

        <section className="mt-8 grid gap-px bg-border md:grid-cols-3" aria-label="택스 리턴에서 따로 판단할 세 가지">
          <article className="bg-white p-6"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-gold">Residency</p><h2 className="mt-2 text-xl font-semibold leading-snug text-navy">비자와 Tax residency는 같은 말이 아니에요</h2><p className="mt-3 text-sm leading-6 text-muted">워홀·학생·영주 비자 이름만으로 세법상 거주자를 확정하지 않습니다. 체류·생활 관계와 해당 회계연도의 변화 날짜를 기준으로 ATO 테스트를 확인하세요.</p></article>
          <article className="bg-white p-6"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-gold">Result</p><h2 className="mt-2 text-xl font-semibold leading-snug text-navy">세금을 뗐어도 환급은 보장되지 않아요</h2><p className="mt-3 text-sm leading-6 text-muted">PAYG withholding은 미리 낸 금액입니다. 전체 소득·공제·Offset과 이미 낸 세금을 정산한 결과에 따라 환급, 납부 또는 0이 될 수 있습니다.</p></article>
          <article className="bg-white p-6"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-gold">After lodge</p><h2 className="mt-2 text-xl font-semibold leading-snug text-navy">제출이 끝이 아니라 결과를 대조해요</h2><p className="mt-3 text-sm leading-6 text-muted">제출본과 Receipt를 저장하고 Notice of Assessment의 소득·세액·환급 또는 납부일을 확인합니다. 오류를 발견하면 무시하거나 다음 해로 넘기지 말고 Amendment 경로를 확인하세요.</p></article>
        </section>

        <section className="mt-8 bg-surface p-6 sm:p-8" aria-labelledby="tax-copy-heading"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">Copy & ask</p><h2 id="tax-copy-heading" className="mt-2 text-2xl font-semibold leading-tight text-navy">등록 세무사에게 복사해 물어볼 문장</h2><p className="mt-3 max-w-3xl text-sm leading-7 text-muted">답을 듣기 전에 TPB 등록 상태와 실제 신고를 담당하는 사람을 확인하고, 제출 전 최종 숫자를 직접 검토하세요.</p><ul className="mt-6 grid gap-3">{taxQuestions.map(([english, korean], index) => <li key={english} className="border border-border bg-white p-4"><div className="flex gap-4"><span className="font-mono text-sm text-gold">{index + 1}</span><p className="font-medium leading-7 text-navy">{english}<span className="mt-1 block text-sm font-normal leading-6 text-muted">({korean})</span></p></div></li>)}</ul></section>

        <section className="mt-10" aria-labelledby="official-tax-links">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">공식 자료도 함께 살펴봤어요</p>
          <h2 id="official-tax-links" className="mt-2 text-2xl font-semibold text-navy">원문을 열기 전에 알아둘 내용</h2>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-muted">각 링크에서 무엇을 확인할 수 있는지 먼저 한국어로 풀어봤어요. 세법과 기한은 바뀔 수 있으니 실제 신고 전에는 해당 회계연도의 원문을 마지막으로 확인해 주세요.</p>
          <ul className="mt-6 divide-y divide-border border-y border-navy/20 sm:grid sm:grid-cols-2 sm:divide-y-0">
            {officialLinks.map((link, index) => <li key={link.href} className="border-b border-border sm:odd:border-r"><a href={link.href} target="_blank" rel="noreferrer" className="group grid h-full grid-cols-[2.5rem_1fr] gap-3 p-5 transition hover:bg-white sm:p-6"><span className="font-mono text-xs text-gold">{String(index + 1).padStart(2, "0")}</span><span><span className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">{link.source}</span><strong className="mt-1 block text-lg text-navy">{link.title}</strong><span className="mt-3 block text-sm leading-7 text-muted">{link.summary}</span><span className="mt-4 inline-flex min-h-11 items-center text-sm font-semibold text-navy underline decoration-gold decoration-2 underline-offset-4">공식 원문 열기 <span className="ml-2 transition group-hover:translate-x-1">↗</span></span></span></a></li>)}
          </ul>
        </section>

        <section className="mt-10 rounded-2xl border border-amber-300 bg-amber-50 p-6 text-sm leading-7 text-amber-950">
          <h2 className="font-semibold">중요 안내</h2>
          <p className="mt-1">이 페이지는 일반적인 준비 정보이며 세무·법률 자문이 아닙니다. 공제 가능 여부, 세법상 거주자 여부, 신고 의무와 기한은 개인 사정에 따라 달라질 수 있으므로 ATO 또는 등록 세무사에게 확인하세요.</p>
        </section>
      </Container>
    </main>
    <Footer />
  </>;
}
