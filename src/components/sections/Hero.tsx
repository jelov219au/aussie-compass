import { getContent } from "@/content";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { AustralianSky } from "@/components/brand/AustralianSky";
import { AustralianFlagBackdrop } from "@/components/brand/AustralianFlagBackdrop";

export function Hero() {
  const content = getContent();

  return (
    <section className="relative overflow-hidden border-b border-border bg-[#edf3f2] py-14 sm:py-20 lg:py-24">
      <AustralianFlagBackdrop />
      <div className="pointer-events-none absolute -left-20 top-20 h-64 w-64 rounded-full bg-[#d6e6e4]/65 blur-3xl" aria-hidden="true" />
      <Container>
        <div className="relative grid items-center gap-12 lg:grid-cols-[minmax(0,1.12fr)_minmax(19rem,0.72fr)] lg:gap-16">
          <div className="max-w-4xl">
            <div className="mb-6 flex items-center gap-3">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-navy text-gold" aria-hidden="true">✦</span>
              <p className="text-xs font-semibold tracking-[0.14em] text-[#9e593b]">
                {content.hero.label}
              </p>
            </div>
            <h1 className="max-w-3xl text-4xl font-semibold leading-[1.14] tracking-[-0.035em] text-navy sm:text-5xl lg:text-6xl">
              <span className="block">호주 생활,</span>
              <span className="block font-normal text-navy-light">필요한 순간에</span>
              <span className="block font-normal text-navy-light">바로 찾으세요.</span>
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-muted sm:text-lg">
              {content.hero.description}
            </p>

            <div className="mt-6 max-w-2xl border-l-2 border-gold/70 pl-5 sm:pl-6">
              <p className="text-xs font-semibold tracking-[0.14em] text-[#9e593b]">Hoju Compass를 만든 이유</p>
              <p className="mt-3 text-sm leading-7 text-navy-light sm:text-[0.98rem] sm:leading-7">
                호주 생활 정보를 찾다 보면 정부 사이트와 여러 안내 글을 계속 오가게 돼요. 검색 결과는 많아도 내 상황에서 무엇부터 해야 하는지 바로 알기 어려울 때가 있고요.
              </p>
              <p className="mt-3 text-sm leading-7 text-navy-light sm:text-[0.98rem] sm:leading-7">
                Hoju Compass는 그 시간을 줄이려고 만들었어요. 꼭 알아야 할 내용은 쉽게 풀고, 계산하거나 기록할 일은 바로 해볼 수 있는 도구로 정리해요. 규정과 금액에는 다시 확인할 수 있는 공식 출처도 함께 남겨요.
              </p>
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Button href="#route-finder" eventName="Home Navigation" properties={{ section: "hero", destination: "route_finder" }}>
                {content.hero.primaryCta}
              </Button>
              <Button href="/tools" variant="secondary" eventName="Home Navigation" properties={{ section: "hero", destination: "tools" }}>
                {content.hero.secondaryCta}
              </Button>
            </div>

            <p className="mt-10 border-t border-navy/10 pt-5 text-xs leading-6 text-muted">먼저 둘러보기만 해도 괜찮아요. 회원가입은 필요 없고, 입력한 내용은 별도 안내가 없는 한 이 기기에만 남아요.</p>
          </div>

          <AustralianSky />
        </div>
      </Container>
    </section>
  );
}
