import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Container } from "@/components/ui/Container";
import { BreadcrumbJsonLd } from "@/components/seo/JsonLd";
import { HelpDirectory } from "@/components/tools/HelpDirectory";
import { createPageMetadata } from "@/lib/site";

export const metadata = createPageMetadata({
  title: "호주 긴급전화·생활 도움 연락처 | Hoju Compass",
  description: "호주 긴급전화 000과 의료, 안전, 주거, 생계, 이민, 법률, 직장 문제의 공식 첫 연락처를 상황별로 찾으세요.",
  path: "/help-directory",
});

export default function HelpDirectoryPage() {
  return (
    <>
      <BreadcrumbJsonLd items={[{ name: "홈", path: "/" }, { name: "생활 도움 연락처", path: "/help-directory" }]} />
      <Header />
      <main className="py-5 sm:py-8">
        <Container>
          <Link href="/tools" className="inline-flex min-h-11 items-center text-sm font-medium text-muted hover:text-navy">
            &larr; 도구 목록으로 돌아가기
          </Link>
          <div className="mt-3 max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-navy">지금 할 일을 한 장으로</p>
            <h1 className="mt-2 text-3xl font-semibold leading-tight tracking-tight text-navy sm:text-4xl">상황에 맞는 공식 도움 찾기</h1>
            <p className="mt-2 text-sm leading-6 text-muted sm:text-base">긴급하면 바로 000에 전화하세요. 비긴급 상황은 아래에서 하나를 고르면 연락 방법과 이용 조건을 함께 보여드려요.</p>
          </div>
          <HelpDirectory />
        </Container>
      </main>
      <Footer />
    </>
  );
}
