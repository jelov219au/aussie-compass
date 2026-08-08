import { getContent } from "@/content";
import { tools, toolStatusLabels } from "@/data/tools";
import { ToolIcon } from "@/components/icons/Icons";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { sectionIds } from "@/lib/utils";
import Link from "next/link";

export function ToolsSection() {
  const content = getContent();

  return (
    <section
      id={sectionIds.tools}
      className="scroll-mt-20 bg-background py-16 sm:py-20"
      aria-labelledby="tools-heading"
    >
      <Container>
        <SectionHeading
          id="tools-heading"
          heading={content.tools.heading}
          description={content.tools.description}
        />

        <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {tools.map((tool) => (
            <li key={tool.id}>
              <article
                className={`flex h-full flex-col rounded-2xl border bg-white p-6 shadow-sm transition-shadow hover:shadow-md ${
                  tool.featured
                    ? "border-gold/40 ring-1 ring-gold/20"
                    : "border-border"
                }`}
              >
                <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-navy/5 text-navy">
                  <ToolIcon />
                </div>
                <h3 className="text-lg font-semibold text-navy">{tool.name}</h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">
                  {tool.description}
                </p>
                {tool.status === "available" ? (
                  <Link
                    href={`/${tool.id}`}
                    className="mt-5 inline-flex w-fit rounded-lg bg-navy px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-navy-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-2"
                  >
                    도구 열기
                  </Link>
                ) : (
                  <p className="mt-5 inline-flex w-fit rounded-full bg-surface px-3 py-1 text-xs font-medium text-muted">
                    {toolStatusLabels[tool.status]}
                  </p>
                )}
              </article>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
