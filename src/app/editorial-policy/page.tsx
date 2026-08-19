import Link from "next/link";

import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { BreadcrumbJsonLd } from "@/components/seo/JsonLd";
import { Container } from "@/components/ui/Container";
import { createPageMetadata } from "@/lib/site";

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

export default function EditorialPolicyPage() {
  return (
    <>
      <BreadcrumbJsonLd items={[{ name: "홈", path: "/" }, { name: "콘텐츠 작성 원칙", path: "/editorial-policy" }]} />
      <Header />
      <main className="py-12 sm:py-16">
        <Container className="max-w-5xl">
          <Link href="/resources" className="inline-flex min-h-11 items-center text-sm font-medium text-muted hover:text-navy">&larr; 실용 자료로 돌아가기</Link>
          <header className="mt-5 max-w-3xl border-t-2 border-navy pt-7">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">How we write</p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight text-navy sm:text-5xl">믿고 읽을 수 있는 정보부터</h1>
            <p className="mt-5 text-base leading-8 text-muted sm:text-lg">호주 생활 정보는 짧은 한 문장도 실제 비용과 선택에 영향을 줄 수 있어요. 그래서 출처, 적용 지역과 마지막 확인 경로를 숨기지 않습니다.</p>
          </header>

          <ol className="mt-12 grid border-t border-navy/20 md:grid-cols-2">
            {principles.map((principle, index) => (
              <li key={principle.number} className={`min-h-64 border-b border-navy/20 p-6 sm:p-8 ${index % 2 === 0 ? "md:border-r" : ""}`}>
                <p className="font-mono text-sm text-gold">{principle.number} / 04</p>
                <h2 className="mt-10 text-2xl font-semibold text-navy">{principle.title}</h2>
                <p className="mt-4 text-sm leading-7 text-muted">{principle.description}</p>
              </li>
            ))}
          </ol>

          <section className="mt-12 grid gap-8 border-y border-navy/20 py-9 sm:grid-cols-2" aria-labelledby="commercial-policy">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gold">Commercial independence</p>
              <h2 id="commercial-policy" className="mt-2 text-2xl font-semibold text-navy">광고와 추천은 분명하게 구분합니다</h2>
            </div>
            <div className="space-y-4 text-sm leading-7 text-muted">
              <p>현재 실용 자료의 순서와 내용은 광고비나 제휴 수수료로 정하지 않습니다. 앞으로 광고·제휴 링크·유료 노출을 도입한다면 해당 위치에 알아보기 쉬운 표시를 붙입니다.</p>
              <p>업체가 비용을 냈다는 이유만으로 공식 추천, 검증 완료 또는 Top tier로 표현하지 않습니다. 업체 비교·순위 기능을 만들 때는 평가 기준, 이해관계와 이의 제기 절차를 먼저 공개합니다.</p>
            </div>
          </section>

          <section className="mt-12 bg-white p-6 ring-1 ring-border sm:p-8" aria-labelledby="corrections-heading">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gold">Corrections</p>
            <h2 id="corrections-heading" className="mt-2 text-2xl font-semibold text-navy">잘못되거나 오래된 내용을 발견했나요?</h2>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-muted">글 제목, 문제가 되는 문장과 확인한 공식 원문을 알려주세요. 개인 사건에 대한 법률·세무·이민 판단은 제공하지 않지만, 확인 가능한 오류는 원문과 비교해 수정합니다.</p>
            <Link href="/contact" className="mt-5 inline-flex min-h-11 items-center font-semibold text-navy underline decoration-gold decoration-2 underline-offset-4">내용 수정 제안 보내기 →</Link>
          </section>

          <p className="mt-8 text-xs leading-6 text-muted">마지막 검토: 2026년 8월 20일 · 이 원칙은 광고 또는 제휴 기능을 도입하기 전에 다시 검토합니다.</p>
        </Container>
      </main>
      <Footer />
    </>
  );
}
