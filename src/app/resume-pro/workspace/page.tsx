import Link from "next/link";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { BreadcrumbJsonLd } from "@/components/seo/JsonLd";
import { ResumeProWorkspace } from "@/components/tools/ResumeProWorkspace";
import { Container } from "@/components/ui/Container";
import { createPageMetadata } from "@/lib/site";

export const metadata = createPageMetadata({
  title: "Resume Pro 개발 프리뷰 | Hoju Compass",
  description: "저장된 영문 이력서를 바탕으로 커버레터 초안을 만들고 채용 공고의 핵심 표현을 점검하세요.",
  path: "/resume-pro/workspace",
});

export default function ResumeProWorkspacePage() {
  return (
    <>
      <BreadcrumbJsonLd items={[{ name: "홈", path: "/" }, { name: "Resume Pro", path: "/resume-pro" }, { name: "개발 프리뷰", path: "/resume-pro/workspace" }]} />
      <Header />
      <main className="py-12 sm:py-16">
        <Container>
          <Link href="/resume-pro" className="inline-flex min-h-11 items-center text-sm font-medium text-muted hover:text-navy">&larr; Resume Pro 소개로 돌아가기</Link>
          <div className="mt-7 grid gap-7 border-b border-navy/20 pb-9 lg:grid-cols-[1fr_18rem] lg:items-end">
            <div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">Resume Pro / Development preview</p><h1 className="mt-3 text-4xl font-semibold tracking-tight text-navy sm:text-5xl">회사별 지원서를 준비하세요.</h1><p className="mt-5 max-w-3xl leading-7 text-muted">무료 빌더에 저장된 이력서를 연결해 커버레터 초안을 만들고, 채용 공고에서 놓친 표현을 점검합니다.</p></div>
            <aside className="border-l-2 border-gold pl-5 text-sm leading-6 text-muted"><strong className="block text-navy">개발 프리뷰 · 현재 무료</strong>기능 검증 단계이며 결제와 계정 생성은 진행되지 않습니다.</aside>
          </div>
          <div className="mt-9"><ResumeProWorkspace /></div>
          <section className="mt-10 border-l-2 border-gold bg-surface p-5 text-sm leading-7 text-muted"><h2 className="font-semibold text-navy">개인정보와 결과 안내</h2><p className="mt-1">이 도구는 입력 내용을 외부 AI나 서버로 전송하지 않고 브라우저 안에서 규칙 기반으로 초안을 만듭니다. 생성된 문장은 일반적인 제안이며 취업 결과를 보장하지 않습니다.</p></section>
        </Container>
      </main>
      <Footer />
    </>
  );
}
