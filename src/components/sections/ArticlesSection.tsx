import { getContent } from "@/content";
import { articles } from "@/data/articles";
import { GuideIcon } from "@/components/icons/Icons";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { sectionIds } from "@/lib/utils";

export function ArticlesSection() {
  const content = getContent();

  return (
    <section
      id={sectionIds.guides}
      className="scroll-mt-20 bg-background py-16 sm:py-20"
      aria-labelledby="guides-heading"
    >
      <Container>
        <SectionHeading id="guides-heading" heading={content.articles.heading} />

        <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {articles.map((article) => (
            <li key={article.id}>
              <article className="flex h-full flex-col rounded-2xl border border-border bg-white p-6 shadow-sm">
                <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-navy/5 text-navy">
                  <GuideIcon />
                </div>
                <h3 className="text-lg font-semibold text-navy">{article.title}</h3>
                <p className="mt-5 inline-flex w-fit rounded-full bg-surface px-3 py-1 text-xs font-medium text-muted">
                  {content.articles.comingSoonLabel}
                </p>
              </article>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
