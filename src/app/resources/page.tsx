import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ResourcesDirectory } from "@/components/resources/ResourcesDirectory";
import { Container } from "@/components/ui/Container";
import { BreadcrumbJsonLd, CollectionJsonLd } from "@/components/seo/JsonLd";
import { articles } from "@/data/articles";
import { createPageMetadata } from "@/lib/site";

export const metadata = createPageMetadata({ title: "호주 생활·취업 실용 자료 | Hoju Compass", description: "호주 구직, 급여, 집 구하기, 중고차, 생활비와 저축에 바로 적용할 수 있는 한국어 가이드를 읽어보세요.", path: "/resources" });

export default function ResourcesPage() {
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
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-gold">실용 자료 허브</p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-navy sm:text-4xl">호주 생활과 취업을 한 단계씩</h1>
            <p className="mt-4 text-base leading-7 text-muted sm:text-lg">
              복잡한 내용을 읽기 쉽게 정리하고, 바로 실행할 수 있는 무료 도구를 함께 연결합니다.
            </p>
          </div>
          <Link href="/glossary" className="group mt-10 grid gap-6 border-y border-navy/20 py-7 sm:grid-cols-[auto_1fr_auto] sm:items-center">
            <span className="font-mono text-3xl text-gold">A—Z</span>
            <span>
              <strong className="block text-xl text-navy">호주 생활 용어집</strong>
              <span className="mt-1 block text-sm leading-6 text-muted">
                TFN, ABN, Award, Super, Bond처럼 처음 보는 약어를 한국어 뜻과 확인할 점으로 찾아보세요.
              </span>
            </span>
            <span className="text-xl text-navy transition group-hover:translate-x-1" aria-hidden="true">→</span>
          </Link>
          <ResourcesDirectory articles={articles} />
        </Container>
      </main>
      <Footer />
    </>
  );
}
