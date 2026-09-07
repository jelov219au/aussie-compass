import Image from "next/image";
import Link from "next/link";
import { resumeProExampleDraft } from "@/lib/resumeProExample";

const examples = [
  { file: "editorial", label: "Editorial", description: "경력과 요약을 위에서 아래로" },
  { file: "professional", label: "Professional", description: "연락처·역량과 경력을 나란히" },
  { file: "technical", label: "Technical", description: "장식을 줄인 간결한 구성" },
] as const;

export function ResumeProOutputPreview() {
  return (
    <section className="mt-8 overflow-hidden border border-navy/20 bg-white" aria-labelledby="result-preview-heading">
      <div className="border-b border-navy/15 p-5 sm:p-6">
        <p className="text-xs font-semibold tracking-[0.16em] text-[#806515]">결제 전에 보는 실제 출력 형식</p>
        <h2 id="result-preview-heading" className="mt-2 text-2xl font-semibold tracking-tight text-navy sm:text-3xl">완성된 파일을 먼저 열어보세요.</h2>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-muted">아래 인물·회사·경력·성과는 모두 가상입니다. 같은 입력을 Resume Pro에 넣어 저장한 이력서와 지원서 묶음이며, 실제 지원에 제출할 자료가 아닙니다.</p>
      </div>
      <div className="grid lg:grid-cols-[17rem_minmax(0,1fr)]">
        <figure className="border-b border-navy/15 bg-surface p-5 lg:border-r lg:border-b-0">
          <a href="/downloads/resume-pro-example-editorial.pdf" target="_blank" rel="noreferrer" className="mx-auto block max-w-44 border border-navy/15 bg-white shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-4 sm:max-w-52" aria-label="가상 이력서 Editorial PDF 새 탭에서 열기">
            <Image src="/downloads/resume-pro-example-editorial.png" width={708} height={1000} sizes="208px" alt="가상 지원자의 완성된 Editorial 이력서. 요약, 경력, 교육, 역량을 담은 1페이지 PDF 미리보기" className="h-auto w-full" />
          </a>
          <figcaption className="mt-3 text-center text-xs leading-5 text-muted">실제 PDF의 첫 페이지 · 확대하려면 선택</figcaption>
        </figure>
        <div className="min-w-0 p-5 sm:p-6">
          <h3 className="text-lg font-semibold text-navy">같은 경력, 세 가지 이력서 PDF</h3>
          <ul className="mt-3 divide-y divide-border border-y border-border">
            {examples.map((example) => (
              <li key={example.file}>
                <a href={`/downloads/resume-pro-example-${example.file}.pdf`} target="_blank" rel="noreferrer" className="flex min-h-14 flex-wrap items-center justify-between gap-x-4 gap-y-1 py-3 text-sm text-navy hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2">
                  <span><strong>{example.label}</strong><span className="mt-1 block text-xs text-muted">{example.description}</span></span>
                  <span className="font-semibold">PDF 열기 ↗</span>
                </a>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs leading-5 text-muted">PDF에는 이력서가 담깁니다. 커버레터는 직접 고친 뒤 복사하거나 아래 TXT에 함께 저장해요. 채용·면접·ATS 통과를 보장하지 않습니다.</p>
          <details className="mt-5 border border-navy/20 bg-surface">
            <summary className="min-h-12 cursor-pointer px-4 py-3 text-sm font-semibold text-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold">완성된 가상 커버레터 전문 보기</summary>
            <div className="border-t border-navy/15 p-4">
              <p className="mb-3 text-xs leading-5 text-muted">가상 입력으로 만든 초안입니다. 실제 경력과 공고에 맞는지 확인하고 수정해야 합니다.</p>
              <div lang="en" tabIndex={0} aria-label="가상 커버레터 전문" className="max-h-80 overflow-y-auto whitespace-pre-wrap break-words text-sm leading-7 text-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold">{resumeProExampleDraft.coverLetter}</div>
            </div>
          </details>
          <a href="/downloads/resume-pro-example-application-kit.txt" download className="mt-4 inline-flex min-h-12 items-center justify-center border border-navy px-4 py-3 text-sm font-semibold text-navy hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2">가상 예시 지원서 패키지 TXT 보기·저장</a>
          <p className="mt-2 text-xs leading-5 text-muted">이력서 요약 · 공고 표현 점검 · 커버레터 · STAR 경험 · 면접 메모 · 제출 전 확인</p>
        </div>
      </div>
      <div className="grid gap-5 border-t border-navy/15 bg-surface p-5 text-sm leading-6 sm:p-6 md:grid-cols-2">
        <div><h3 className="font-semibold text-navy">회사별 준비를 저장하고 다시 열 때</h3><p className="mt-2 text-muted">실제 경력과 지원 공고가 있고, 여러 회사의 이력서·커버레터·면접 메모를 따로 보관할 때 적합해요. 기본 이력서와 PDF만 필요하면 무료 빌더로 시작하세요.</p><Link href="/resume-builder" className="mt-2 inline-flex min-h-11 items-center font-semibold text-navy underline decoration-gold underline-offset-4">무료 이력서·PDF 만들기 →</Link></div>
        <div><h3 className="font-semibold text-navy">파일 저장과 작업 복원은 달라요</h3><p className="mt-2 text-muted">TXT·PDF는 읽고 제출할 파일입니다. 작업 데이터는 현재 브라우저에 남아요. 기기를 옮길 때는 데이터 이동의 JSON 백업을 사용하고, 구매 이용권은 복구 코드로 별도로 연결하세요.</p><Link href="/data-transfer" className="mt-2 inline-flex min-h-11 items-center font-semibold text-navy underline decoration-gold underline-offset-4">작업 데이터 백업·복원 안내 →</Link></div>
      </div>
    </section>
  );
}
