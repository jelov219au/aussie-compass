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
              <p className="text-xs font-semibold tracking-[0.14em] text-[#874b32]">
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

            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Button href="#route-finder" eventName="Home Navigation" properties={{ section: "hero", destination: "route_finder" }}>
                {content.hero.primaryCta} <span aria-hidden="true">→</span>
              </Button>
              <Button href="/tools" variant="secondary" eventName="Home Navigation" properties={{ section: "hero", destination: "tools" }}>
                {content.hero.secondaryCta}
              </Button>
            </div>
            <ul className="mt-7 grid max-w-2xl gap-2 text-sm text-navy sm:grid-cols-3" aria-label="Hoju Compass 정보 원칙">
              {["공식 원문 연결", "한국어 실행 순서", "로그인 없이 바로 사용"].map((item) => <li key={item} className="flex min-h-11 items-center gap-2 rounded-xl border border-navy/15 bg-white/70 px-3"><span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-gold text-xs font-bold text-navy" aria-hidden="true">✓</span>{item}</li>)}
            </ul>
            <p className="mt-5 text-xs leading-6 text-muted">입력한 내용은 별도 안내가 없는 한 현재 기기에만 남아요.</p>
          </div>

          <AustralianSky />
        </div>
      </Container>
    </section>
  );
}
