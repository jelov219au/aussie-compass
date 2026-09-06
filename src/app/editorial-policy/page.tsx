import Link from "next/link";

import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { BreadcrumbJsonLd } from "@/components/seo/JsonLd";
import { EditorialTrustEvidence } from "@/components/editorial/EditorialTrustEvidence";
import { Container } from "@/components/ui/Container";
import { createPageMetadata } from "@/lib/site";
import { deriveEditorialTrust } from "@/lib/editorialTrust";

export const metadata = createPageMetadata({
  title: "콘텐츠 작성 원칙 | Hoju Compass",
  description: "Hoju Compass가 호주 생활 정보를 확인하고 한국어로 설명하며 광고·제휴와 편집 내용을 구분하는 원칙입니다.",
  path: "/editorial-policy",
});

const principles = [
  {
    number: "01",
    title: "공식 원문을 먼저 봅니다",
    description: "호주 연방·주정부, 규제기관과 공공기관 자료를 우선 확인합니다. 개인 블로그와 커뮤니티 경험담은 공식 규칙의 근거로 사용하지 않습니다.",
  },
  {
    number: "02",
    title: "한국어로 행동 순서를 설명합니다",
    description: "원문 링크만 나열하지 않고, 언제 필요한 정보인지와 무엇을 준비하고 어떤 순서로 확인할지 풀어 씁니다. 원문의 의미를 과장하거나 단정하지 않습니다.",
  },
  {
    number: "03",
    title: "주마다 다른 규칙을 하나로 섞지 않습니다",
    description: "임대, 교통, 면허와 공과금처럼 지역별 규칙이 다른 내용은 적용 지역을 표시합니다. 개인 조건에 따라 달라질 수 있다면 마지막 확인 경로를 함께 제공합니다.",
  },
  {
    number: "04",
    title: "업데이트 날짜와 출처를 공개합니다",
    description: "각 글에 마지막 확인 날짜와 공식 출처를 표시합니다. 제도가 바뀌면 원문을 다시 확인하고 중요한 변경은 본문에 반영합니다.",
  },
];

const policyTrust = deriveEditorialTrust({
  contentScope: "policy",
  claimDateBasis: "current page context",
  checkedOn: "2026-09-07",
  version: "policy-2026.1",
  correctionState: "none",
  disclosures: ["editorial policy only; operational AI and human-review facts remain unknown"],
});

export default function EditorialPolicyPage() {
  return (
    <>
      <BreadcrumbJsonLd items={[{ name: "홈", path: "/" }, { name: "콘텐츠 작성 원칙", path: "/editorial-policy" }]} />
      <Header />
      <main className="py-12 sm:py-16">
        <Container className="max-w-5xl">
          <Link href="/resources" className="inline-flex min-h-11 items-center text-sm font-medium text-muted hover:text-navy">&larr; 실용 자료로 돌아가기</Link>
          <header className="mt-5 max-w-3xl border-t-2 border-navy pt-7">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold-ink">How we write</p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight text-navy sm:text-5xl">믿고 읽을 수 있는 정보부터</h1>
            <p className="mt-5 text-base leading-8 text-muted sm:text-lg">호주 생활 정보는 짧은 한 문장도 실제 비용과 선택에 영향을 줄 수 있어요. 그래서 출처, 적용 지역과 마지막 확인 경로를 숨기지 않습니다.</p>
          </header>

          <EditorialTrustEvidence outcome={policyTrust} />

          <ol className="mt-12 grid border-t border-navy/20 md:grid-cols-2">
            {principles.map((principle, index) => (
              <li key={principle.number} className={`min-h-64 border-b border-navy/20 p-6 sm:p-8 ${index % 2 === 0 ? "md:border-r" : ""}`}>
                <p className="font-mono text-sm text-gold-ink">{principle.number} / 04</p>
                <h2 className="mt-10 text-2xl font-semibold text-navy">{principle.title}</h2>
                <p className="mt-4 text-sm leading-7 text-muted">{principle.description}</p>
              </li>
            ))}
          </ol>

          <section className="mt-12 grid gap-8 border-y border-navy/20 py-9 sm:grid-cols-2" aria-labelledby="commercial-policy">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gold-ink">Commercial independence</p>
              <h2 id="commercial-policy" className="mt-2 text-2xl font-semibold text-navy">광고와 추천은 분명하게 구분합니다</h2>
            </div>
            <div className="space-y-4 text-sm leading-7 text-muted">
              <p>현재 실용 자료의 순서와 내용은 광고비나 제휴 수수료로 정하지 않습니다. 자사 Pro 도구도 `own_paid_tool`로 표시하고 무료·공식 경로를 먼저 둡니다.</p>
              <p>업체가 비용을 냈다는 이유만으로 공식 추천, 검증 완료 또는 Top tier로 표현하지 않습니다. 업체 비교·순위 기능을 만들 때는 평가 기준, 이해관계와 이의 제기 절차를 먼저 공개합니다.</p>
              <p>편집 책임자와 상업 책임자를 분리하고, 구매·전환 성과를 이유로 글의 결론이나 순위를 바꾸지 않습니다. 확인 기록이 없으면 이 분리 상태도 `unknown`입니다.</p>
            </div>
          </section>

          <section className="mt-12 bg-white p-6 ring-1 ring-border sm:p-8" aria-labelledby="corrections-heading">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gold-ink">Corrections</p>
            <h2 id="corrections-heading" className="mt-2 text-2xl font-semibold text-navy">잘못되거나 오래된 내용을 발견했나요?</h2>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-muted">글 제목, 문제가 되는 문장과 확인한 공식 원문을 알려주세요. 개인 사건에 대한 법률·세무·이민 판단은 제공하지 않지만, 확인 가능한 오류는 원문과 비교해 수정합니다.</p>
            <Link href="/contact" className="mt-5 inline-flex min-h-11 items-center font-semibold text-navy underline decoration-gold decoration-2 underline-offset-4">내용 수정 제안 보내기 →</Link>
            <p className="mt-3 text-xs leading-5 text-muted">메일 앱이 열린 것만으로 접수된 것은 아닙니다. 공개 변경 이력에는 페이지·문장 요약, open/closed 날짜, 상태, 결정, old/new source만 두고 제보자 이메일·메시지·첨부·IP는 공개하지 않습니다.</p>
          </section>

          <section className="mt-12 grid gap-px bg-border sm:grid-cols-2" aria-label="사람 책임과 자동화 공개 원칙">
            <article className="bg-white p-6"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-gold-ink">Human ownership</p><h2 className="mt-2 text-xl font-semibold text-navy">작성·검토·최종 책임을 분리합니다</h2><p className="mt-3 text-sm leading-7 text-muted">중요 주장에는 작성자, 분야 검토자, 최종 책임자를 따로 표시합니다. 확인되지 않은 역할은 조직 이름으로 대신 채우지 않고 `unknown`으로 둡니다.</p></article>
            <article className="bg-white p-6"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-gold-ink">AI & rights</p><h2 className="mt-2 text-xl font-semibold text-navy">사용한 단계와 사람 재확인을 공개합니다</h2><p className="mt-3 text-sm leading-7 text-muted">AI·자동화를 썼다면 초안·번역·이미지 등 위치와 한계를 밝히고 숫자·법적 효과·출처·번역은 사람이 다시 확인합니다. 실제 사용·라이선스·동의 근거가 없으면 추정하지 않습니다.</p></article>
          </section>

          <p className="mt-8 text-xs leading-6 text-muted">정책 페이지 확인: 2026년 9월 7일 · 개별 글의 발행일은 출처 checked_on이 아니며, review_due·version·사람 책임·AI 사용 근거가 없으면 current로 표시하지 않습니다.</p>
        </Container>
      </main>
      <Footer />
    </>
  );
}
