import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { LivedExperienceGuides } from "@/components/resources/LivedExperienceGuides";
import { ResourcesDirectory } from "@/components/resources/ResourcesDirectory";
import { Container } from "@/components/ui/Container";
import { TopicIcon } from "@/components/ui/TopicIcon";
import { actionClass } from "@/components/ui/actionStyles";
import { BreadcrumbJsonLd, CollectionJsonLd } from "@/components/seo/JsonLd";
import { articles } from "@/data/articles";
import { createPageMetadata } from "@/lib/site";

export const metadata = createPageMetadata({ title: "호주 생활·취업 실용 자료 | Hoju Compass", description: "호주 구직, 급여, 집 구하기, 중고차, 생활비와 저축에 바로 적용할 수 있는 한국어 가이드를 읽어보세요.", path: "/resources" });

export default function ResourcesPage() {
  const sortedArticles = [...articles].sort((a, b) =>
    (b.updatedAt ?? b.publishedAt).localeCompare(a.updatedAt ?? a.publishedAt)
    || b.publishedAt.localeCompare(a.publishedAt),
  );
  const featuredArticles = sortedArticles.slice(0, 4);

  return (
    <>
      <BreadcrumbJsonLd items={[{ name: "홈", path: "/" }, { name: "실용 자료", path: "/resources" }]} />
      <CollectionJsonLd
        name="호주 생활·취업 실용 자료"
        description="호주 구직, 급여, 집 구하기, 중고차, 생활비와 저축에 바로 적용할 수 있는 한국어 가이드 모음"
        path="/resources"
        items={articles.map((article) => ({ name: article.title, path: `/resources/${article.slug}` }))}
      />
      <Header />
      <main className="py-12 sm:py-16">
        <Container>
          <Link href="/" className="inline-flex min-h-11 items-center text-sm font-medium text-muted hover:text-navy">
            &larr; 홈으로 돌아가기
          </Link>
          <div className="mt-5 max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-gold">필요할 때 찾아보는 호주 생활 정보</p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-navy sm:text-4xl">낯선 호주 생활을 조금 더 쉽게</h1>
            <p className="mt-4 text-base leading-7 text-muted sm:text-lg">
              복잡한 공식 안내는 한국어로 쉽게 풀고, 무엇부터 확인하면 좋을지와 바로 써볼 수 있는 무료 도구까지 한 글에 담았어요.
            </p>
            <div className="mt-6 flex flex-wrap gap-x-7 gap-y-2 border-l-2 border-gold pl-4 text-sm font-medium text-navy">
              <span>3줄 핵심 요약</span>
              <span>단계별 한국어 설명</span>
              <span>공식 원문 링크</span>
            </div>
          </div>
          <Link href="/glossary" className="group mt-10 grid gap-6 rounded-2xl border-2 border-navy/10 bg-white p-6 shadow-[0_10px_26px_rgba(26,39,68,0.05)] transition hover:border-gold sm:grid-cols-[auto_1fr_auto] sm:items-center">
            <span className="flex items-center gap-3"><TopicIcon name="search" /><span className="font-mono text-xl text-gold-ink">A—Z</span></span>
            <span>
              <strong className="block text-xl text-navy">호주 생활 용어집</strong>
              <span className="mt-1 block text-sm leading-6 text-muted">
                TFN, ABN, Award, Super, Bond처럼 처음 보는 약어를 한국어 뜻과 확인할 점으로 찾아보세요.
              </span>
            </span>
            <span className="inline-flex min-h-11 items-center justify-center rounded-xl bg-navy px-4 text-sm font-semibold text-white">용어 찾기 <span className="ml-2 transition group-hover:translate-x-1" aria-hidden="true">→</span></span>
          </Link>
          <ResourcesDirectory articles={sortedArticles} />
          <LivedExperienceGuides />
          <section className="mt-12" aria-labelledby="new-life-tips-heading">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">이번 주 생활 팁</p>
                <h2 id="new-life-tips-heading" className="mt-2 text-2xl font-semibold tracking-tight text-navy">오늘 바로 써볼 수 있는 정보</h2>
              </div>
              <Link href="/editorial-policy" className={actionClass("tertiary")}>출처를 확인하는 기준 →</Link>
            </div>
            <ol className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {featuredArticles.map((article) => (
                <li key={article.slug}>
                  <Link href={`/resources/${article.slug}`} className="group grid h-full min-h-60 grid-rows-[auto_1fr_auto] rounded-2xl border-2 border-navy/10 bg-white p-5 shadow-[0_8px_20px_rgba(26,39,68,0.04)] transition hover:-translate-y-0.5 hover:border-gold sm:p-6">
                    <span className="flex items-center justify-between text-xs"><TopicIcon name="guide" size="sm" /><span className="font-semibold text-gold-ink">{article.category}</span></span>
                    <span className="py-7"><strong className="block text-lg leading-7 text-navy">{article.title}</strong><span className="mt-3 block text-sm leading-6 text-muted">{article.quickSummary[0]}</span></span>
                    <span className="inline-flex min-h-10 items-center justify-center rounded-lg bg-navy px-4 text-sm font-semibold text-white">자세히 보기 <span className="ml-2 transition group-hover:translate-x-1" aria-hidden="true">→</span></span>
                  </Link>
                </li>
              ))}
            </ol>
          </section>
        </Container>
      </main>
      <Footer />
    </>
  );
}
