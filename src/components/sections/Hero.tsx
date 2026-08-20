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

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Button href="#route-finder">
                {content.hero.primaryCta}
              </Button>
              <Button href="/tools" variant="secondary">
                {content.hero.secondaryCta}
              </Button>
            </div>

            <p className="mt-10 border-t border-navy/10 pt-5 text-xs leading-6 text-muted">먼저 둘러보기만 해도 괜찮아요. 회원가입은 필요 없고, 입력한 내용은 별도 안내가 없는 한 이 기기에만 남습니다.</p>
          </div>

          <AustralianSky />
        </div>
      </Container>
    </section>
  );
}
