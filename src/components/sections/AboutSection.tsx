import { getContent } from "@/content";
import { Container } from "@/components/ui/Container";
import { sectionIds } from "@/lib/utils";

export function AboutSection() {
  const content = getContent();

  return (
    <section
      id={sectionIds.about}
      className="scroll-mt-20 border-t border-border/70 bg-background py-16 sm:py-20"
      aria-labelledby="about-heading"
    >
      <Container>
        <div className="mx-auto max-w-2xl text-center">
          <h2
            id="about-heading"
            className="text-2xl font-semibold tracking-tight text-navy sm:text-3xl"
          >
            {content.about.heading}
          </h2>
          <p className="mt-4 text-base leading-relaxed text-muted">
            {content.about.description}
          </p>
        </div>
      </Container>
    </section>
  );
}
