import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ResumeBuilder } from "@/components/tools/ResumeBuilder";
import { Container } from "@/components/ui/Container";
import { BreadcrumbJsonLd } from "@/components/seo/JsonLd";
import { createPageMetadata } from "@/lib/site";

export const metadata = createPageMetadata({
  title: "호주 영문 이력서 빌더 | Aussie Compass",
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
            <p className="mt-4 text-base leading-relaxed text-muted sm:text-lg">필요한 내용만 입력해 간결한 호주식 이력서를 만드세요. 입력 내용은 이 브라우저에만 자동 저장되며 서버로 전송되지 않습니다.</p>
          </div>
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
