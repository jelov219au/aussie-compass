import { getContent } from "@/content";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";

export function Hero() {
  const content = getContent();

  return (
    <section className="border-b border-border bg-white py-16 sm:py-24 lg:py-28">
      <Container>
        <div className="max-w-4xl">
          <p className="mb-5 text-xs font-semibold tracking-[0.14em] text-gold">
            {content.hero.label}
          </p>
          <h1 className="max-w-3xl text-4xl font-semibold leading-[1.14] tracking-[-0.035em] text-navy sm:text-5xl lg:text-6xl">
            호주 생활,<br/><span className="font-normal text-navy-light">필요한 순간에 바로 찾으세요.</span>
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

          <p className="mt-10 border-t border-border pt-5 text-xs leading-6 text-muted">먼저 둘러보기만 해도 괜찮아요. 회원가입은 필요 없고, 입력한 내용은 별도 안내가 없는 한 이 기기에만 남습니다.</p>
        </div>
      </Container>
    </section>
  );
}
