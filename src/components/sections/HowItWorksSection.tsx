import { getContent } from "@/content";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";

export function HowItWorksSection() {
  const content = getContent();

  return (
    <section
      className="border-y border-border/70 bg-surface py-16 sm:py-20"
      aria-labelledby="how-it-works-heading"
    >
      <Container>
        <SectionHeading
          id="how-it-works-heading"
          heading={content.howItWorks.heading}
          align="center"
        />

        <ol className="mt-10 grid border-y border-navy/20 sm:grid-cols-3">
          {content.howItWorks.steps.map((step, index) => (
            <li
              key={step.title}
              className="border-b border-border p-6 last:border-b-0 sm:border-b-0 sm:border-r sm:p-8 sm:last:border-r-0"
            >
              <span className="font-mono text-sm text-gold">0{index + 1}</span>
              <h3 className="mt-4 text-base font-semibold text-navy">
                {step.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                {step.description}
              </p>
            </li>
          ))}
        </ol>
      </Container>
    </section>
  );
}
