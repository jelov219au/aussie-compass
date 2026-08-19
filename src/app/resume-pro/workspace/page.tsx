import type { Metadata } from "next";
import Link from "next/link";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { BreadcrumbJsonLd } from "@/components/seo/JsonLd";
import { ResumeProAccessTools } from "@/components/tools/ResumeProAccessTools";
import { ResumeProWorkspace } from "@/components/tools/ResumeProWorkspace";
import { Container } from "@/components/ui/Container";
import { getActiveResumeProEntitlement } from "@/lib/resumeProAccess";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Resume Pro 개발 프리뷰 | Hoju Compass",
  description: "저장된 영문 이력서를 바탕으로 프리미엄 디자인을 고르고, 커버레터와 채용 공고의 핵심 표현을 함께 준비하세요.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function ResumeProWorkspacePage() {
  const accessProtected = process.env.NODE_ENV === "production";
  if (accessProtected && !await getActiveResumeProEntitlement()) redirect("/resume-pro?access=required");

  return (
    <>
      <BreadcrumbJsonLd items={[{ name: "홈", path: "/" }, { name: "Resume Pro", path: "/resume-pro" }, { name: "개발 프리뷰", path: "/resume-pro/workspace" }]} />
      <Header />
      <main className="py-12 sm:py-16">
        <Container>
          <Link href="/resume-pro" className="inline-flex min-h-11 items-center text-sm font-medium text-muted hover:text-navy">&larr; Resume Pro 소개로 돌아가기</Link>
          <div className="mt-7 grid gap-7 border-b border-navy/20 pb-9 lg:grid-cols-[1fr_18rem] lg:items-end">
            <div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">Resume Pro / Development preview</p><h1 className="mt-3 text-4xl font-semibold tracking-tight text-navy sm:text-5xl">회사별 지원서를 준비하세요.</h1><p className="mt-5 max-w-3xl leading-7 text-muted">무료 빌더에 저장된 이력서를 연결해 프리미엄 디자인을 고르고, 커버레터와 채용 공고 점검까지 한곳에서 준비합니다.</p></div>
            <aside className="border-l-2 border-gold pl-5 text-sm leading-6 text-muted">
              <strong className="block text-navy">{accessProtected ? "이용권 확인 완료" : "개발 프리뷰 · 현재 무료"}</strong>
              {accessProtected ? "현재 기기의 서명된 접근 세션과 활성 이용권을 확인했습니다." : "기능 검증 단계이며 결제와 계정 생성은 진행되지 않습니다."}
            </aside>
          </div>
          <div className="mt-9"><ResumeProWorkspace /></div>
          {accessProtected && <ResumeProAccessTools />}
          <section className="mt-10 border-l-2 border-gold bg-surface p-5 text-sm leading-7 text-muted"><h2 className="font-semibold text-navy">개인정보와 결과 안내</h2><p className="mt-1">이 도구는 입력 내용을 외부 AI나 서버로 전송하지 않고 브라우저 안에서 규칙 기반으로 초안을 만듭니다. 생성된 문장은 일반적인 제안이며 취업 결과를 보장하지 않습니다.</p></section>
        </Container>
      </main>
      <Footer />
    </>
  );
}
