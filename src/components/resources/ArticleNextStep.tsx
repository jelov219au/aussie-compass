import Link from "next/link";
import { TrackedLink } from "@/components/analytics/TrackedLink";
import { ResumeProCtaLink } from "@/components/analytics/ResumeFunnelAnalytics";
import { ResumeProProofLink } from "@/components/analytics/ResumeProProofLink";
import { resumeFunnelContexts, resumeFunnelSurfaces, type ResumeProCtaHref } from "@/lib/resumeFunnelAnalyticsContract";
import type { ResumeProEntry } from "@/lib/resumeProAttribution";

type ArticleNextStepProps = {
  slug: string;
  toolHref: string;
  toolLabel: string;
};

const nextSteps: Record<
  string,
  {
    heading: string;
    description: string;
    freeLabel: string;
    proLabel: string;
    proHref: ResumeProCtaHref;
    context: (typeof resumeFunnelContexts)[keyof typeof resumeFunnelContexts];
    proofEntry?: ResumeProEntry;
    proofLabel?: string;
    note: string;
  }
> = {
  "australia-resume-template-submission-checklist": {
    heading: "무료 양식으로 먼저 완성하고, 실제 공고가 생기면 맞추세요",
    description:
      "무료 Builder에서 실제 경력을 저장하고 PDF를 직접 확인하세요. 지원할 공고가 정해지면 무료 점검기로 저장한 이력서와 공고의 표현 차이를 먼저 확인하고, 검증한 근거를 회사별 이력서·커버레터·면접 메모에 반복해서 써야 할 때만 Resume Pro를 검토하면 돼요.",
    freeLabel: "무료 이력서 작성·PDF 저장하기",
    proofEntry: "article-resume-template",
    proofLabel: "저장한 이력서와 공고 무료 비교하기",
    proLabel: "검증한 근거를 지원서 묶음으로 재사용하기",
    proHref: "/resume-pro?from=article-resume-template",
    context: resumeFunnelContexts.resumeTemplateGuide,
    note: "Builder 작성본은 현재 브라우저에 저장되고, 무료 비교의 이력서·공고 원문은 서버로 보내거나 저장하지 않아요. Resume Pro도 입력하지 않은 경력·자격·수치를 만들지 않으며, 면접이나 취업 결과를 보장하지 않아요.",
  },
  "australia-job-search-plan": {
    heading: "지원할 공고가 생겼다면, 다음 단계로 이어가세요",
    description:
      "아직 지원 전이라면 무료 트래커에 공고와 마감일부터 정리해 보세요. 지원할 곳을 정했다면 Resume Pro에서 그 공고에 맞는 이력서와 커버레터를 함께 준비할 수 있어요.",
    freeLabel: "지원 현황 무료로 정리하기",
    proLabel: "이 공고에 맞춰 지원 준비하기",
    proHref: "/resume-pro?from=article-job-search-plan",
    context: resumeFunnelContexts.jobSearchGuide,
    note: "공고를 모으고 지원을 기록하는 기능은 무료예요. Resume Pro는 실제로 지원할 공고를 골랐을 때 선택하면 돼요.",
  },
  "australia-cover-letter-job-ad-checklist": {
    heading: "실제 경력을 저장하고, 이 공고와 비교한 뒤 다시 쓰세요",
    description:
      "아직 기본 이력서가 없다면 Builder에 실제 경력을 먼저 저장하세요. 이력서와 공고가 모두 있다면 무료 점검기로 표현 차이를 현재 브라우저에서 확인하고, 같은 근거를 회사별 이력서·커버레터·면접 메모에 반복해서 써야 할 때만 Resume Pro로 이어가면 돼요.",
    freeLabel: "실제 경력 Builder에 저장하기",
    proofEntry: "article-cover-letter-checklist",
    proofLabel: "내 이력서와 이 공고 무료 비교하기",
    proLabel: "검증한 근거를 지원서 묶음으로 재사용하기",
    proHref: "/resume-pro?from=article-cover-letter-checklist",
    context: resumeFunnelContexts.coverLetterGuide,
    note: "무료 비교의 이력서·공고 원문은 서버로 보내거나 저장하지 않아요. Resume Pro도 입력하지 않은 경력·자격·수치를 만들지 않으며, 면접이나 취업 결과를 보장하지 않아요.",
  },
  "english-resume-achievement-examples": {
    heading: "내 실제 사례를 저장하고, 다음 면접에도 다시 쓰세요",
    description:
      "먼저 무료 Builder에 성과 문장을 저장하고 PDF로 내보내세요. 지원할 공고가 정해졌다면 Resume Pro에서 같은 사례를 STAR 면접 메모와 회사별 지원서 묶음으로 이어갈 수 있어요.",
    freeLabel: "내 사례를 무료로 저장하기",
    proLabel: "공고별 이력서·면접 준비로 이어가기",
    proHref: "/resume-pro?from=article-achievement-examples",
    context: resumeFunnelContexts.achievementGuide,
    note: "무료 Builder 내용은 현재 브라우저에 저장돼요. Resume Pro도 입력하지 않은 숫자, 경력이나 자격을 만들지 않아요.",
  },
};

export function ArticleNextStep({ slug, toolHref, toolLabel }: ArticleNextStepProps) {
  if (slug === "used-car-inspection-report-next-steps") {
    return <aside className="mt-12 rounded-2xl border border-navy/20 bg-white p-6 sm:p-8" aria-labelledby="car-article-next-step">
      <p className="text-sm font-semibold text-gold-ink">이 글을 읽은 다음</p>
      <h2 id="car-article-next-step" className="mt-2 text-2xl font-semibold text-navy">비용을 비교하고, 남은 약속을 기록하세요</h2>
      <p className="mt-3 text-sm leading-7 text-muted">기본 후보·비용 비교는 무료입니다. 검사 후 약속과 결정 기록을 이어가는 중고차 거래노트 Pro는 준비 중이며, 아직 구매할 수 없습니다.</p>
      <div className="mt-5 flex flex-wrap gap-4">
        <TrackedLink href={toolHref} eventName="Article Next Step" properties={{ article: slug, destination: "free_tool" }} className="inline-flex min-h-12 items-center rounded-lg bg-navy px-5 py-3 text-sm font-semibold text-white">{toolLabel}</TrackedLink>
        <Link href="/car-purchase-pro" className="inline-flex min-h-12 items-center rounded-lg border border-navy px-5 py-3 text-sm font-semibold text-navy">중고차 거래노트 Pro 준비 내용 보기</Link>
      </div>
    </aside>;
  }
  const nextStep = nextSteps[slug];

  if (!nextStep) {
    return (
      <aside className="mt-12 bg-navy p-6 text-white sm:p-8">
        <p className="text-sm font-semibold text-gold">읽고 나서 무엇을 하면 좋을까요?</p>
        <h2 className="mt-2 text-2xl font-semibold">관련 무료 도구에서 이어볼 수 있어요</h2>
        <TrackedLink
          href={toolHref}
          eventName="Article Next Step"
          properties={{ article: slug, destination: "free_tool" }}
          className="mt-5 inline-flex min-h-12 items-center bg-gold px-5 py-3 font-semibold text-navy"
        >
          {toolLabel}
        </TrackedLink>
      </aside>
    );
  }

  return (
    <aside className="mt-12 border border-navy/20 bg-white p-6 sm:p-8" aria-labelledby={`${slug}-next-step-heading`}>
      <p className="text-sm font-semibold text-gold">이 글을 읽은 다음</p>
      <h2 id={`${slug}-next-step-heading`} className="mt-2 max-w-2xl text-2xl font-semibold leading-8 text-navy">
        {nextStep.heading}
      </h2>
      <p className="mt-3 max-w-3xl text-sm leading-7 text-muted sm:text-base">{nextStep.description}</p>
      {nextStep.proofEntry && nextStep.proofLabel ? (
        <ol className="mt-6 grid gap-3 lg:grid-cols-3" aria-label="저장·비교·재사용 다음 단계">
          <li>
            <TrackedLink
              href={toolHref}
              eventName="Article Next Step"
              properties={{ article: slug, destination: "free_tool" }}
              className="flex min-h-32 h-full flex-col items-start justify-center bg-navy px-5 py-4 text-left text-white transition hover:bg-navy/90"
            >
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-gold">01 · 저장</span>
              <strong className="mt-2 leading-6">{nextStep.freeLabel}</strong>
              <span className="mt-1 text-xs leading-5 text-white/65">현재 브라우저에 저장하고 PDF로 내보내요.</span>
            </TrackedLink>
          </li>
          <li>
            <ResumeProProofLink entry={nextStep.proofEntry} className="flex min-h-32 h-full flex-col items-start justify-center border border-navy/30 bg-white px-5 py-4 text-left text-navy transition hover:border-gold hover:bg-surface">
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[#806515]">02 · 비교</span>
              <strong className="mt-2 leading-6">{nextStep.proofLabel}</strong>
              <span className="mt-1 text-xs leading-5 text-muted">이력서·공고 원문을 서버로 보내지 않아요.</span>
            </ResumeProProofLink>
          </li>
          <li>
            <ResumeProCtaLink
              href={nextStep.proHref}
              surface={resumeFunnelSurfaces.articleNextStep}
              context={nextStep.context}
              className="flex min-h-32 h-full flex-col items-start justify-center border border-navy bg-surface px-5 py-4 text-left text-navy transition hover:bg-white"
            >
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[#806515]">03 · 재사용</span>
              <strong className="mt-2 leading-6">{nextStep.proLabel}</strong>
              <span className="mt-1 text-xs leading-5 text-muted">회사별 버전과 실행 결과물을 한곳에 남겨요.</span>
            </ResumeProCtaLink>
          </li>
        </ol>
      ) : (
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <TrackedLink
            href={toolHref}
            eventName="Article Next Step"
            properties={{ article: slug, destination: "free_tool" }}
            className="inline-flex min-h-12 items-center justify-center bg-navy px-5 py-3 text-center font-semibold text-white transition hover:bg-navy/90"
          >
            {nextStep.freeLabel}
          </TrackedLink>
          <ResumeProCtaLink
            href={nextStep.proHref}
            surface={resumeFunnelSurfaces.articleNextStep}
            context={nextStep.context}
            className="inline-flex min-h-12 items-center justify-center border border-navy/30 px-5 py-3 text-center font-semibold text-navy transition hover:border-gold hover:bg-surface"
          >
            {nextStep.proLabel}
          </ResumeProCtaLink>
        </div>
      )}
      <p className="mt-4 text-xs leading-6 text-muted">{nextStep.note}</p>
    </aside>
  );
}
