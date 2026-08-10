import { getContent } from "@/content";
import { CheckIcon } from "@/components/icons/Icons";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";

export function Hero() {
  const content = getContent();

  return (
    <section className="border-b border-border/70 bg-background py-16 sm:py-20 lg:py-24">
      <Container>
        <div className="max-w-3xl">
          <p className="mb-4 inline-flex rounded-full border border-gold/30 bg-gold/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-navy">
            {content.hero.label}
          </p>
          <h1 className="text-3xl font-semibold leading-tight tracking-tight text-navy sm:text-4xl lg:text-5xl">
            {content.hero.heading}
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

          <p className="mt-6 inline-flex items-center gap-2 text-sm text-muted">
            <CheckIcon className="h-5 w-5 shrink-0 text-gold" />
            {content.hero.trust}
          </p>
        </div>
      </Container>
    </section>
  );
}
