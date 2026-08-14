import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ResumeBuilder } from "@/components/tools/ResumeBuilder";
import { Container } from "@/components/ui/Container";
import { BreadcrumbJsonLd } from "@/components/seo/JsonLd";
import { createPageMetadata } from "@/lib/site";

export const metadata = createPageMetadata({
  title: "호주 영문 이력서 빌더 | Hoju Compass",
  description: "호주 구직에 맞는 깔끔한 영문 이력서를 작성하고 미리보기한 뒤 PDF로 저장하세요.",
  path: "/resume-builder",
});

export default function ResumeBuilderPage() {
  return (
    <>
      <BreadcrumbJsonLd items={[{ name: "홈", path: "/" }, { name: "영문 이력서 빌더", path: "/resume-builder" }]} />
      <Header />
      <main className="py-12 sm:py-16">
        <Container>
          <Link href="/#tools" className="inline-flex min-h-11 items-center text-sm font-medium text-muted hover:text-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-2">&larr; 도구 목록으로 돌아가기</Link>
          <div className="mb-10 mt-5 max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-gold">무료 작성 도구</p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-navy sm:text-4xl">호주 영문 이력서 빌더</h1>
            <p className="mt-4 text-base leading-relaxed text-muted sm:text-lg">한국어 강점을 영문 초안으로 바꾸고 예시 문장을 활용해 호주식 이력서를 만드세요. 색상과 레이아웃을 고를 수 있으며 입력 내용은 이 브라우저에만 저장됩니다.</p>
          </div>
          <aside className="mb-8 grid gap-5 border-y border-navy/20 py-5 sm:grid-cols-[1fr_auto] sm:items-center" aria-labelledby="resume-pro-preview-heading">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">Resume Pro / Preview</p>
              <h2 id="resume-pro-preview-heading" className="mt-2 text-lg font-semibold text-navy">커버레터와 회사별 지원서 묶음도 준비하고 있어요.</h2>
              <p className="mt-1 text-sm leading-6 text-muted">무료 기능은 그대로 유지하고, 반복 작업을 줄이는 프리미엄 기능만 별도로 제공합니다.</p>
            </div>
            <Link href="/resume-pro" className="inline-flex min-h-11 items-center justify-center border-b-2 border-gold text-sm font-semibold text-navy">Resume Pro 미리보기 <span className="ml-3" aria-hidden="true">→</span></Link>
          </aside>
          <ResumeBuilder />
          <section className="mt-10 rounded-2xl border border-border bg-white p-6 sm:p-8" aria-labelledby="resume-tips-heading">
            <h2 id="resume-tips-heading" className="text-xl font-semibold text-navy">작성할 때 기억하세요</h2>
            <ul className="mt-4 grid gap-3 text-sm leading-6 text-muted md:grid-cols-3">
              <li className="rounded-xl bg-surface p-4"><strong className="block text-navy">사진과 개인정보는 최소화</strong>사진, 생년월일, 혼인 여부는 일반적으로 넣지 않아도 됩니다.</li>
              <li className="rounded-xl bg-surface p-4"><strong className="block text-navy">성과는 구체적으로</strong>업무만 나열하기보다 숫자와 결과를 넣어 강점을 보여주세요.</li>
              <li className="rounded-xl bg-surface p-4"><strong className="block text-navy">지원 직무마다 조정</strong>채용 공고의 핵심 표현과 관련 경험을 이력서 앞부분에 배치하세요.</li>
            </ul>
          </section>
        </Container>
      </main>
      <Footer />
    </>
  );
}
