import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ResumeBuilder } from "@/components/tools/ResumeBuilder";
import { Container } from "@/components/ui/Container";
import { BreadcrumbJsonLd } from "@/components/seo/JsonLd";
import { isResumeProLive } from "@/lib/commerce";
import { createPageMetadata } from "@/lib/site";

export const metadata = createPageMetadata({
  title: "호주 영문 이력서 빌더 | Hoju Compass",
  description: "한국어로 정리한 경험을 자연스러운 영문 문장으로 바꾸고, 호주 구직에 맞는 이력서를 만들어 PDF로 저장할 수 있어요.",
  path: "/resume-builder",
});

export default function ResumeBuilderPage() {
  const resumeProLive = isResumeProLive();

  return (
    <>
      <BreadcrumbJsonLd items={[{ name: "홈", path: "/" }, { name: "영문 이력서 빌더", path: "/resume-builder" }]} />
      <Header />
      <main className="py-12 sm:py-16">
        <Container>
          <Link href="/#tools" className="inline-flex min-h-11 items-center text-sm font-medium text-muted hover:text-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-2">&larr; 도구 목록으로 돌아가기</Link>
          <div className="mb-10 mt-5 max-w-3xl">
            <p className="text-sm font-semibold text-gold">영문 이력서가 막막할 때</p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-navy sm:text-4xl">호주 영문 이력서 빌더</h1>
            <p className="mt-4 text-base leading-relaxed text-muted sm:text-lg">경험과 강점을 먼저 한국어로 적어도 괜찮아요. 영문 예시를 참고해 문장을 다듬고, 마음에 드는 색상과 레이아웃으로 정리해보세요. 입력한 내용은 이 브라우저에만 남습니다.</p>
          </div>
          <aside className="mb-8 grid gap-5 border-y border-navy/20 py-5 sm:grid-cols-[1fr_auto] sm:items-center" aria-labelledby="resume-pro-preview-heading">
            <div>
              <p className="text-xs font-semibold text-gold">{resumeProLive ? "Resume Pro 이용 가능" : "Resume Pro 출시 준비 중"}</p>
              <h2 id="resume-pro-preview-heading" className="mt-2 text-lg font-semibold text-navy">커버레터와 회사별 지원서 묶음까지 이어서 준비할 수 있어요.</h2>
              <p className="mt-1 text-sm leading-6 text-muted">이력서 만들기는 계속 무료예요. 회사마다 반복되는 지원 준비를 줄여주는 기능만 Resume Pro로 제공합니다.</p>
            </div>
            <Link href="/resume-pro" className="inline-flex min-h-11 items-center justify-center border-b-2 border-gold text-sm font-semibold text-navy">{resumeProLive ? "Resume Pro 시작하기" : "Resume Pro 살펴보기"} <span className="ml-3" aria-hidden="true">→</span></Link>
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
