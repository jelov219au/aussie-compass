import { TrackedLink } from "@/components/analytics/TrackedLink";
import { Container } from "@/components/ui/Container";

const stories = [
  {
    number: "01",
    category: "집을 보러 가는 날",
    title: "사진이 보여주지 않는 집의 생활감",
    description: "사진에서는 넓어 보였던 방도 직접 가보면 냄새나 소음 때문에 다르게 느껴질 수 있어요.",
    points: ["광각 사진과 실제 방 크기", "샤워 수압·냉장고 자리·세탁 규칙", "밤 귀갓길과 실제 거리 분위기"],
    href: "/resources/australia-sharehouse-photo-vs-reality-checklist",
    analyticsId: "sharehouse_reality",
    linkLabel: "집 보러 가기 전에 읽기",
    accent: "bg-[#dce8e3]",
  },
  {
    number: "02",
    category: "집과 교통을 함께 볼 때",
    title: "평일 40분이 주말 2시간이 되는 이유",
    description: "Train이 가까운 집도 주말 Trackwork가 시작되면 이동시간이 생각보다 길어질 수 있어요.",
    points: ["출근·귀가·주말 시간대별 검색", "Trackwork와 Replacement bus", "월세와 함께 계산하는 이동시간"],
    href: "/resources/sydney-weekend-commute-reality-check",
    analyticsId: "weekend_commute",
    linkLabel: "계약 전에 교통 확인하기",
    accent: "bg-[#eee4cf]",
  },
];

export function ExperienceStoriesSection() {
  return (
    <section className="border-y border-border bg-navy py-16 text-white sm:py-24" aria-labelledby="experience-stories-heading">
      <Container>
        <div className="grid gap-8 lg:grid-cols-[0.72fr_1.28fr] lg:gap-14">
          <div className="lg:pt-2">
            <p className="text-xs font-semibold tracking-[0.16em] text-gold">생활에서 놓치기 쉬운 부분</p>
            <h2 id="experience-stories-heading" className="mt-4 text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
              사진과 지도만 봐서는<br className="hidden sm:block" /> 알기 어려운 것도 담았어요.
            </h2>
            <p className="mt-5 max-w-md text-sm leading-7 text-white/70 sm:text-base">
              공식 안내에 잘 나오지 않는 생활의 세부는 확인할 질문으로 바꾸고, 규정과 수치는 공식 자료와 함께 정리했어요.
            </p>
          </div>

          <ol className="divide-y divide-navy/15 overflow-hidden bg-white text-navy">
            {stories.map((story) => (
              <li key={story.number} className="grid sm:grid-cols-[8.5rem_1fr]">
                <div className={`${story.accent} flex min-h-32 flex-col justify-between p-5 sm:min-h-full sm:p-6`}>
                  <span className="font-mono text-xs">CARD {story.number}</span>
                  <span className="mt-8 text-xs font-semibold leading-5">{story.category}</span>
                </div>
                <div className="p-6 sm:p-8">
                  <h3 className="text-2xl font-semibold leading-8 tracking-tight">{story.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-muted">{story.description}</p>
                  <ul className="mt-5 grid gap-2 text-sm leading-6 text-navy/85 sm:grid-cols-3">
                    {story.points.map((point, index) => (
                      <li key={point} className="border-t border-border pt-3">
                        <span className="mr-2 font-mono text-[0.65rem] text-gold-ink">0{index + 1}</span>
                        {point}
                      </li>
                    ))}
                  </ul>
                  <TrackedLink href={story.href} eventName="Home Navigation" properties={{ section: "experience_stories", destination: story.analyticsId }} className="mt-6 inline-flex min-h-11 items-center text-sm font-semibold underline decoration-gold decoration-2 underline-offset-4">
                    {story.linkLabel} →
                  </TrackedLink>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </Container>
    </section>
  );
}
