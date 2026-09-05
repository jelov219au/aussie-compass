import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ResumeBuilder } from "@/components/tools/ResumeBuilder";
import { Container } from "@/components/ui/Container";
import { BreadcrumbJsonLd } from "@/components/seo/JsonLd";
import { ResumeTemplateDownloadLink } from "@/components/analytics/ResumeTemplateDownloadLink";
import { isResumeProLive } from "@/lib/commerce";
import { createPageMetadata } from "@/lib/site";

export const metadata = createPageMetadata({
  title: "호주 영문 이력서 빌더 | Hoju Compass",
  description: "직접 확인한 업무와 목표 직무를 영문 초안으로 정리하고, 호주 구직용 이력서를 만들어 인쇄 창에서 PDF로 저장할 수 있어요.",
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
            <p className="text-sm font-semibold text-[#806515]">영문 이력서가 막막할 때</p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-navy sm:text-4xl">호주 영문 이력서 빌더</h1>
            <p className="mt-4 text-base leading-relaxed text-muted sm:text-lg">한국어 메모로 생각을 정리하고, 목표 직무와 실제로 한 일을 직접 영문으로 입력하세요. 도우미의 초안과 예시를 내 사실에 맞게 수정해 이력서로 정리할 수 있어요. 메모는 이 탭에만 남고, 이력서에 추가한 내용은 기기 저장 상태를 확인해 주세요.</p>
            <ul className="mt-6 grid gap-px border-y border-navy/15 bg-border text-sm sm:grid-cols-3" aria-label="무료 이력서 빌더에서 남길 수 있는 결과">
              <li className="bg-white px-4 py-4"><strong className="block text-navy">브라우저 자동 저장</strong><span className="mt-1 block text-xs leading-5 text-muted">기기 저장이 가능하면 입력한 실제 경험을 보관해요. 오류가 있으면 백업 안내를 확인하세요.</span></li>
              <li className="bg-white px-4 py-4"><strong className="block text-navy">PDF·백업 내보내기</strong><span className="mt-1 block text-xs leading-5 text-muted">완성본과 수정 가능한 JSON 백업을 직접 저장해요.</span></li>
              <li className="bg-white px-4 py-4"><strong className="block text-navy">실제 경험 다시 사용</strong><span className="mt-1 block text-xs leading-5 text-muted">저장한 경험을 다음 지원 때 불러와 다시 다듬어요.</span></li>
            </ul>
            <p className="mt-3 text-xs leading-5 text-muted">입력하지 않은 성과나 자격을 만들어 주지 않아요. 예시와 영문 초안은 내 사실에 맞는지 직접 확인하세요.</p>
            <div className="mt-6 border-l-2 border-gold bg-white px-5 py-4">
              <p className="text-sm leading-6 text-muted">Word에서 직접 편집할 빈 양식이 먼저 필요하다면, 표·사진·그래픽 없이 만든 A4 DOCX를 내려받으세요.</p>
              <ResumeTemplateDownloadLink entry="resume_builder" className="mt-2 inline-flex min-h-11 items-center font-semibold text-navy underline decoration-gold decoration-2 underline-offset-4">
                ATS용 호주 이력서 Word 양식 무료 다운로드 ↓
              </ResumeTemplateDownloadLink>
            </div>
          </div>
          <ResumeBuilder resumeProLive={resumeProLive} />
          <section className="mt-10 border-l-2 border-gold bg-surface p-6 sm:p-8" aria-labelledby="resume-job-ad-check-heading"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-gold">실제 공고가 생겼다면</p><h2 id="resume-job-ad-check-heading" className="mt-2 text-xl font-semibold text-navy">이력서와 Job Ad를 로컬에서 비교하세요</h2><p className="mt-3 max-w-4xl text-sm leading-7 text-muted">공고의 표현을 무조건 복사하지 않고, 현재 이력서에서 같은 문구를 찾은 뒤 실제로 설명할 수 있는 경험인지 확인할 수 있어요. 입력 내용은 저장하거나 서버로 보내지 않습니다.</p><Link href="/resume-job-ad-checker" className="mt-4 inline-flex min-h-11 items-center font-semibold text-navy underline decoration-gold decoration-2 underline-offset-4">공고 맞춤 근거 점검하기 &rarr;</Link></section>
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
