import { TrackedLink } from "@/components/analytics/TrackedLink";

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
    proHref: string;
    note: string;
  }
> = {
  "australia-job-search-plan": {
    heading: "지원할 공고가 생겼다면, 다음 단계로 이어가세요",
    description:
      "아직 지원 전이라면 무료 트래커에 공고와 마감일부터 정리해 보세요. 지원할 곳을 정했다면 Resume Pro에서 그 공고에 맞는 이력서와 커버레터를 함께 준비할 수 있어요.",
    freeLabel: "지원 현황 무료로 정리하기",
    proLabel: "이 공고에 맞춰 지원 준비하기",
    proHref: "/resume-pro?from=article-job-search-plan",
    note: "공고를 모으고 지원을 기록하는 기능은 무료예요. Resume Pro는 실제로 지원할 공고를 골랐을 때 선택하면 돼요.",
  },
  "english-resume-achievement-examples": {
    heading: "내 실제 사례를 저장하고, 다음 면접에도 다시 쓰세요",
    description:
      "먼저 무료 Builder에 성과 문장을 저장하고 PDF로 내보내세요. 지원할 공고가 정해졌다면 Resume Pro에서 같은 사례를 STAR 면접 메모와 회사별 지원서 묶음으로 이어갈 수 있어요.",
    freeLabel: "내 사례를 무료로 저장하기",
    proLabel: "공고별 이력서·면접 준비로 이어가기",
    proHref: "/resume-pro?from=article-achievement-examples",
    note: "무료 Builder 내용은 현재 브라우저에 저장돼요. Resume Pro도 입력하지 않은 숫자, 경력이나 자격을 만들지 않아요.",
  },
};

export function ArticleNextStep({ slug, toolHref, toolLabel }: ArticleNextStepProps) {
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
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <TrackedLink
          href={toolHref}
          eventName="Article Next Step"
          properties={{ article: slug, destination: "free_tool" }}
          className="inline-flex min-h-12 items-center justify-center bg-navy px-5 py-3 text-center font-semibold text-white transition hover:bg-navy/90"
        >
          {nextStep.freeLabel}
        </TrackedLink>
        <TrackedLink
          href={nextStep.proHref}
          eventName="Article Next Step"
          properties={{ article: slug, destination: "resume_pro" }}
          className="inline-flex min-h-12 items-center justify-center border border-navy/30 px-5 py-3 text-center font-semibold text-navy transition hover:border-gold hover:bg-surface"
        >
          {nextStep.proLabel}
        </TrackedLink>
      </div>
      <p className="mt-4 text-xs leading-6 text-muted">{nextStep.note}</p>
    </aside>
  );
}
