import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { PageShareButton } from "@/components/pwa/PageShareButton";
import { ArticleReadingNav } from "@/components/resources/ArticleReadingNav";
import { Container } from "@/components/ui/Container";
import { ArticleJsonLd, BreadcrumbJsonLd } from "@/components/seo/JsonLd";
import { articles, getArticle, getRelatedArticles } from "@/data/articles";
import { createPageMetadata } from "@/lib/site";

export function generateStaticParams() {
  return articles.map((article) => ({ slug: article.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const article = getArticle(slug);

  return article
    ? createPageMetadata({
        title: `${article.title} | Hoju Compass`,
        description: article.description,
        path: `/resources/${article.slug}`,
        kind: "article",
        publishedTime: article.publishedAt,
        modifiedTime: article.updatedAt ?? article.publishedAt,
      })
    : {};
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = getArticle(slug);
  if (!article) notFound();

  const relatedArticles = getRelatedArticles(article.slug);
  const readingSections = article.sections.map((section, index) => ({ id: `section-${index + 1}`, label: section.heading }));

  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "홈", path: "/" },
          { name: "실용 자료", path: "/resources" },
          { name: article.title, path: `/resources/${article.slug}` },
        ]}
      />
      <ArticleJsonLd
        title={article.title}
        description={article.description}
        path={`/resources/${article.slug}`}
        category={article.category}
        publishedAt={article.publishedAt}
        updatedAt={article.updatedAt}
        sources={article.sources}
      />
      <Header />
      <main className="py-12 sm:py-16">
        <Container>
          <Link href="/resources" className="inline-flex min-h-11 items-center text-sm font-medium text-muted hover:text-navy">
            &larr; 실용 자료 목록
          </Link>
          <article className="mx-auto mt-5 max-w-3xl">
            <header>
              <p className="text-sm font-semibold text-gold">
                {article.category} · 읽는 시간 {article.readingTime} · <time dateTime={article.updatedAt ?? article.publishedAt}>{article.updatedAt ? "업데이트" : "발행"} {(article.updatedAt ?? article.publishedAt).replaceAll("-", ".")}</time>
              </p>
              <h1 className="mt-3 text-3xl font-semibold leading-tight tracking-tight text-navy sm:text-4xl">{article.title}</h1>
              <p className="mt-5 text-lg leading-8 text-muted">{article.description}</p>
              <div className="mt-6"><PageShareButton /><Link href={{ pathname: "/social-card-maker", query: { eyebrow: `${article.category} · ${article.readingTime}`, title: article.title, body: article.description, cta: "전체 가이드 읽기", path: `/resources/${article.slug}` } }} className="mt-1 inline-flex min-h-11 items-center gap-2 border-b-2 border-border text-sm font-semibold text-navy hover:border-gold"><span aria-hidden="true">▣</span>이 글로 카드뉴스 만들기</Link></div>
            </header>

            <ArticleReadingNav sections={readingSections} />

            <div id="article-body" className="mt-10 space-y-10">
              {article.sections.map((section, index) => (
                <section id={`section-${index + 1}`} key={section.heading} className="scroll-mt-24">
                  <h2 className="text-2xl font-semibold tracking-tight text-navy">{section.heading}</h2>
                  {section.paragraphs?.map((paragraph) => (
                    <p key={paragraph} className="mt-4 leading-8 text-muted">{paragraph}</p>
                  ))}
                  {section.bullets && (
                    <ul className="mt-4 space-y-3">
                      {section.bullets.map((bullet) => (
                        <li key={bullet} className="flex gap-3 leading-7 text-muted">
                          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-gold" aria-hidden="true" />
                          <span>{bullet}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              ))}
            </div>

            {article.sources && (
              <section className="mt-12 border-t border-border pt-8" aria-labelledby="article-sources">
                <h2 id="article-sources" className="text-lg font-semibold text-navy">공식 출처</h2>
                <ul className="mt-3 space-y-2">
                  {article.sources.map((source) => (
                    <li key={source.href}>
                      <a href={source.href} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center text-sm font-medium text-navy underline decoration-gold decoration-2 underline-offset-4">
                        {source.label} <span className="ml-2" aria-hidden="true">↗</span>
                      </a>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <aside className="mt-12 bg-navy p-6 text-white sm:p-8">
              <p className="text-sm font-semibold text-gold">읽은 내용을 바로 실행해 보세요</p>
              <h2 className="mt-2 text-2xl font-semibold">무료 도구로 이어서 진행하기</h2>
              <Link href={article.toolHref} className="mt-5 inline-flex min-h-12 items-center bg-gold px-5 py-3 font-semibold text-navy">
                {article.toolLabel}
              </Link>
            </aside>

            <p className="mt-8 text-xs leading-6 text-muted">
              이 자료는 일반적인 정보이며 개인 상황에 대한 법률, 재무, 세무 또는 이민 자문이 아닙니다.
            </p>
          </article>

          {relatedArticles.length > 0 && (
            <section className="mx-auto mt-16 max-w-5xl border-t border-navy/20 pt-8" aria-labelledby="related-articles-heading">
              <div className="flex items-end justify-between gap-6 border-b border-border pb-5">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">Continue reading</p>
                  <h2 id="related-articles-heading" className="mt-2 text-2xl font-semibold tracking-tight text-navy">이어서 확인할 자료</h2>
                </div>
                <Link href="/resources" className="hidden min-h-11 items-center text-sm font-semibold text-navy sm:inline-flex">
                  전체 자료 →
                </Link>
              </div>
              <ol className="grid lg:grid-cols-2">
                {relatedArticles.map((related, index) => (
                  <li key={related.slug} className="border-b border-border lg:odd:border-r">
                    <Link href={`/resources/${related.slug}`} className="group grid h-full min-h-52 grid-rows-[auto_auto_1fr] p-6 transition hover:bg-white/60 sm:p-8">
                      <div className="flex items-center justify-between gap-4">
                        <p className="text-xs font-semibold text-gold">{related.category} · {related.readingTime}</p>
                        <span className="font-mono text-xs text-muted">0{index + 1}</span>
                      </div>
                      <h3 className="mt-4 text-xl font-semibold leading-7 text-navy">{related.title}</h3>
                      <div className="mt-5 flex items-end justify-between gap-4">
                        <p className="text-sm leading-6 text-muted">{related.description}</p>
                        <span className="shrink-0 text-xl text-navy transition group-hover:translate-x-1" aria-hidden="true">→</span>
                      </div>
                    </Link>
                  </li>
                ))}
              </ol>
            </section>
          )}
        </Container>
      </main>
      <Footer />
    </>
  );
}
