import { getContent } from "@/content";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";

export function Hero() {
  const content = getContent();

  return (
    <section className="relative overflow-hidden border-b border-border/70 bg-background py-16 sm:py-24 lg:py-28">
      <div className="pointer-events-none absolute -right-32 top-10 h-[34rem] w-[34rem] rounded-full border border-navy/8" aria-hidden="true" />
      <div className="pointer-events-none absolute -right-6 top-40 h-72 w-72 rounded-full border border-gold/25" aria-hidden="true" />
      <div className="pointer-events-none absolute right-24 top-[19rem] h-3 w-3 rounded-full bg-gold" aria-hidden="true" />
      <Container>
        <div className="relative max-w-5xl">
          <p className="mb-6 text-xs font-semibold uppercase tracking-[0.2em] text-gold">
            {content.hero.label}
          </p>
          <h1 className="max-w-4xl text-4xl font-semibold leading-[1.12] tracking-[-0.035em] text-navy sm:text-6xl lg:text-7xl">
            호주 생활과 직장 생활,<br/><span className="font-normal italic text-navy-light">더 이상 혼자 헤매지 마세요.</span>
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted sm:text-lg">
            {content.hero.description}
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Button href="/salary-calculator">
              {content.hero.primaryCta}
            </Button>
            <Button href="/guides" variant="secondary">
              {content.hero.secondaryCta}
            </Button>
          </div>

          <div className="mt-10 flex flex-wrap gap-x-8 gap-y-3 border-t border-navy/15 pt-5 text-xs font-medium text-muted"><span>회원가입 없음</span><span>내 브라우저에 저장</span><span>공식 정보 출처 연결</span></div>
        </div>
      </Container>
    </section>
  );
}
