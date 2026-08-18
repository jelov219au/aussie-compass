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
  { href: "https://www.ato.gov.au/individuals-and-families/your-tax-return/in-detail/pre-fill-availability", title: "myTax Pre-fill 확인", source: "Australian Taxation Office", summary: "고용주, 은행, 정부기관 등이 ATO에 보낸 소득 자료가 언제 myTax에 채워지는지 확인할 수 있습니다. Pre-fill은 편리한 시작점이지만 자동 입력된 금액의 정확성과 누락 여부를 최종 확인할 책임은 신고자에게 있습니다." },
  { href: "https://www.ato.gov.au/individuals-and-families/income-deductions-offsets-and-records/deductions-you-can-claim", title: "공제 가능 항목", source: "Australian Taxation Office", summary: "업무 관련 비용 등 공제 항목별 기본 조건과 필요한 기록으로 이동하는 공식 허브입니다. 돈을 지출했다는 사실만으로 공제되는 것은 아니며, 소득을 얻는 일과의 관련성·개인 사용분 제외·증빙 보관을 함께 확인해야 합니다." },
  { href: "https://www.tpb.gov.au/registrations_search", title: "등록 세무사 검색", source: "Tax Practitioners Board", summary: "유료로 Tax agent 서비스를 제공하는 사람이 현재 TPB에 등록되어 있는지 이름이나 등록번호로 확인하는 공식 검색입니다. 등록 상태와 조건을 확인한 뒤 서비스 범위, 수수료와 제출 전 검토 절차도 서면으로 물어보세요." },
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

        <TaxReturnChecklist />

        <section className="mt-8 border-y border-navy/20 bg-white p-6 sm:flex sm:items-center sm:justify-between sm:gap-6 sm:p-8"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-gold">다음 단계 · Pro 미리보기</p><h2 className="mt-2 text-xl font-semibold text-navy">소득·공제 증빙과 확인 질문을 한 묶음으로 정리하세요</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-muted">영수증을 업로드하지 않고 공제 후보 기록과 등록 세무사 전달용 요약을 만드는 제품 구성을 확인할 수 있습니다.</p></div><Link href="/eofy-pro" className="mt-4 inline-flex min-h-11 shrink-0 items-center bg-navy px-4 text-sm font-semibold text-white sm:mt-0">EOFY Pack 구성 보기 &rarr;</Link></section>

        <div className="mt-8"><TaxTimeReminder /></div>

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
