import { getContent } from "@/content";
import { StepIcon } from "@/components/icons/Icons";
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

        <ol className="mt-10 grid gap-6 sm:grid-cols-3">
          {content.howItWorks.steps.map((step, index) => (
            <li
              key={step.title}
              className="rounded-2xl border border-border bg-white p-6 shadow-sm"
            >
              <StepIcon step={index + 1} className="h-8 w-8 text-sm" />
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
