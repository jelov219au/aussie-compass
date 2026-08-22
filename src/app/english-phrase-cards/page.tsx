import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { BreadcrumbJsonLd } from "@/components/seo/JsonLd";
import { EnglishPhraseCards } from "@/components/tools/EnglishPhraseCards";
import { Container } from "@/components/ui/Container";
import { createPageMetadata } from "@/lib/site";

export const metadata = createPageMetadata({
  title: "호주 생활 영어 문장 카드 | Hoju Compass",
  description: "은행, 렌트, 직장과 병원에서 바로 쓸 수 있는 호주 생활 영어 문장을 상황별로 찾고 저장하거나 복사하세요.",
  path: "/english-phrase-cards",
});

const steps = [
  ["상황 선택", "은행, 집, 직장, 병원 중 지금 필요한 상황을 고르세요."],
  ["문장 저장", "자주 쓸 문장은 저장 버튼을 눌러 이 기기에 모아두세요."],
  ["보여주거나 복사", "말하기 어렵다면 영어 문장을 화면으로 보여주거나 복사해 사용하세요."],
];

export default function EnglishPhraseCardsPage() {
  return (
    <>
      <BreadcrumbJsonLd items={[{ name: "홈", path: "/" }, { name: "생활 영어 문장 카드", path: "/english-phrase-cards" }]} />
      <Header />
      <main className="py-12 sm:py-16">
        <Container>
          <Link href="/tools" className="inline-flex min-h-11 items-center text-sm font-medium text-muted hover:text-navy">&larr; 도구 목록으로 돌아가기</Link>
          <div className="mt-8 grid gap-8 border-b border-navy/20 pb-10 lg:grid-cols-[1fr_17rem] lg:items-end">
            <div className="max-w-4xl">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">말이 막히는 순간에 바로 꺼내세요</p>
              <h1 className="mt-3 text-4xl font-semibold leading-tight tracking-tight text-navy sm:text-5xl">호주 생활 영어,<br /><span className="font-normal text-navy-light">잘 말하는 것보다 정확히 확인하기.</span></h1>
              <p className="mt-5 max-w-3xl text-base leading-7 text-muted sm:text-lg">은행 계좌를 만들 때, 집을 볼 때, 급여를 물을 때, 병원에 갔을 때. 긴 문장을 외우지 않아도 필요한 말부터 골라 쓸 수 있어요.</p>
            </div>
            <p className="border-l-2 border-gold pl-4 text-sm leading-6 text-muted"><strong className="block text-navy">개인정보를 적지 않아도 돼요.</strong>저장한 문장만 현재 브라우저에 남습니다.</p>
          </div>

          <ol className="mt-8 grid gap-4 md:grid-cols-3">
            {steps.map(([title, body], index) => <li key={title} className="border-t border-navy/20 pt-4"><span className="font-mono text-xs text-gold">0{index + 1}</span><h2 className="mt-2 font-semibold text-navy">{title}</h2><p className="mt-2 text-sm leading-6 text-muted">{body}</p></li>)}
          </ol>

          <EnglishPhraseCards />

          <section className="mt-10 grid gap-4 md:grid-cols-3" aria-label="함께 확인할 자료">
            <Link href="/resources/australia-arrival-english-clarifying-phrases" className="border border-border bg-white p-5 transition hover:border-gold"><span className="text-xs font-semibold text-gold">문장을 쓰는 방법</span><strong className="mt-2 block text-lg text-navy">생활 영어 확인 가이드 →</strong><span className="mt-2 block text-sm leading-6 text-muted">비용·날짜·다음 행동을 다시 확인하는 순서</span></Link>
            <Link href="/help-directory" className="border border-border bg-white p-5 transition hover:border-gold"><span className="text-xs font-semibold text-gold">통역과 공식 도움</span><strong className="mt-2 block text-lg text-navy">생활 도움 연락처 →</strong><span className="mt-2 block text-sm leading-6 text-muted">TIS National, 의료 상담과 직장 문제 연락처</span></Link>
            <Link href="/arrival-checklist" className="border border-border bg-white p-5 transition hover:border-gold"><span className="text-xs font-semibold text-gold">도착 직후 준비</span><strong className="mt-2 block text-lg text-navy">첫 30일 체크리스트 →</strong><span className="mt-2 block text-sm leading-6 text-muted">전화·은행·집·첫 직장 준비를 순서대로 확인</span></Link>
          </section>

          <section className="mt-8 border-l-2 border-amber-500 bg-amber-50 p-6 text-sm leading-7 text-amber-950">
            <h2 className="font-semibold">중요한 내용은 통역과 공식 안내로 확인하세요</h2>
            <p className="mt-1">이 문장 카드는 대화를 시작하고 다시 묻는 데 도움을 주는 자료예요. 계약, 급여, 의료처럼 결정이 중요한 내용은 이해되지 않은 상태에서 서명하거나 동의하지 말고 전문 통역이나 관련 기관의 공식 안내를 확인하세요. 생명이나 안전이 위급하면 000에 먼저 전화하세요.</p>
          </section>
        </Container>
      </main>
      <Footer />
    </>
  );
}
