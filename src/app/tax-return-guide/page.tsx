import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Container } from "@/components/ui/Container";
import { TaxReturnChecklist } from "@/components/tools/TaxReturnChecklist";
import { BreadcrumbJsonLd } from "@/components/seo/JsonLd";
import { createPageMetadata } from "@/lib/site";

export const metadata = createPageMetadata({
  title: "호주 택스 리턴 준비 가이드와 체크리스트 | Aussie Compass",
  description: "EOFY 택스 리턴 전 소득 자료, 공제 증빙, 신고 기한을 한 번에 확인하고 개인 체크리스트로 준비하세요.",
  path: "/tax-return-guide",
});

const officialLinks = [
  { href: "https://www.ato.gov.au/individuals-and-families/your-tax-return/how-to-lodge-your-tax-return", title: "신고 방법과 기한", source: "Australian Taxation Office" },
  { href: "https://www.ato.gov.au/individuals-and-families/your-tax-return/in-detail/pre-fill-availability", title: "myTax Pre-fill 확인", source: "Australian Taxation Office" },
  { href: "https://www.ato.gov.au/individuals-and-families/income-deductions-offsets-and-records/deductions-you-can-claim", title: "공제 가능 항목", source: "Australian Taxation Office" },
  { href: "https://www.tpb.gov.au/registrations_search", title: "등록 세무사 검색", source: "Tax Practitioners Board" },
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
          <h2 id="official-tax-links" className="text-2xl font-semibold text-navy">최종 확인은 공식 사이트에서</h2>
          <p className="mt-2 text-sm leading-6 text-muted">세법과 기한은 바뀔 수 있습니다. 신고 전 현재 회계연도 안내를 다시 확인하세요.</p>
          <ul className="mt-5 grid gap-4 sm:grid-cols-2">
            {officialLinks.map((link) => <li key={link.href}><a href={link.href} target="_blank" rel="noreferrer" className="group block h-full rounded-2xl border border-border bg-white p-5 transition hover:border-gold/60 hover:shadow-sm"><span className="text-xs font-semibold text-gold">{link.source}</span><span className="mt-1 block font-semibold text-navy group-hover:text-navy-light">{link.title} &rarr;</span></a></li>)}
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
