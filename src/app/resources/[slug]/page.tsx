import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { PageShareButton } from "@/components/pwa/PageShareButton";
import { ArticleNextStep } from "@/components/resources/ArticleNextStep";
import { ArticleReadingNav } from "@/components/resources/ArticleReadingNav";
import { ResumeTemplateDownloadLink } from "@/components/analytics/ResumeTemplateDownloadLink";
import { Container } from "@/components/ui/Container";
import { TopicIcon } from "@/components/ui/TopicIcon";
import { actionClass } from "@/components/ui/actionStyles";
import { ArticleJsonLd, BreadcrumbJsonLd } from "@/components/seo/JsonLd";
import {
  articleContentTypeLabels,
  articleRegionLabels,
  articles,
  getArticle,
  getArticleContentType,
  getArticleRegion,
  getRelatedArticles,
} from "@/data/articles";
import { createPageMetadata } from "@/lib/site";

export function generateStaticParams() {
  return articles.map((article) => ({ slug: article.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const article = getArticle(slug);

  return article
    ? createPageMetadata({
        title: `${article.seoTitle ?? article.title} | Hoju Compass`,
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
          <article className="mx-auto mt-5 max-w-4xl">
            <header className="rounded-[2rem] border-2 border-navy/10 bg-white p-6 shadow-[0_16px_38px_rgba(26,39,68,0.07)] sm:p-9">
              <div className="mb-5 flex flex-wrap gap-2">
                <span className="border border-border bg-white/60 px-3 py-1.5 text-xs font-semibold text-navy">
                  {articleRegionLabels[getArticleRegion(article)]}
                </span>
                <span className="border border-gold/50 bg-[#f7f0d9] px-3 py-1.5 text-xs font-semibold text-navy">
                  {articleContentTypeLabels[getArticleContentType(article)]}
                </span>
              </div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gold">
                {article.category} · 읽는 시간 {article.readingTime} · <time dateTime={article.updatedAt ?? article.publishedAt}>{article.updatedAt ? "업데이트" : "발행"} {(article.updatedAt ?? article.publishedAt).replaceAll("-", ".")}</time>
              </p>
              <h1 className="mt-4 max-w-4xl text-balance text-3xl font-semibold leading-tight tracking-tight text-navy sm:text-5xl">{article.title}</h1>
              <p className="mt-6 max-w-3xl text-lg leading-8 text-muted sm:text-xl sm:leading-9">{article.description}</p>
              <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-2">
                {article.slug === "australia-resume-template-submission-checklist" && (
                  <ResumeTemplateDownloadLink
                    entry="article_resume_template"
                    className={actionClass("primary")}
                  >
                    ATS용 Word 양식 무료 다운로드 ↓
                  </ResumeTemplateDownloadLink>
                )}
                {article.slug === "english-resume-achievement-examples" && (
                  <Link href={article.toolHref} className={actionClass("primary")}>
                    내 사례를 무료로 저장하기 →
                  </Link>
                )}
                <PageShareButton />
              </div>
            </header>

            <section className="mt-8 rounded-[2rem] bg-navy p-6 text-white sm:grid sm:grid-cols-[11rem_1fr] sm:gap-8 sm:p-8" aria-labelledby="quick-summary-heading">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">바쁘다면 여기부터</p>
                <h2 id="quick-summary-heading" className="mt-2 text-xl font-semibold text-white">먼저 이것만</h2>
              </div>
              <ol className="mt-5 space-y-4 sm:mt-0">
                {article.quickSummary.map((summary, index) => (
                  <li key={summary} className="grid grid-cols-[2rem_1fr] gap-3 text-sm leading-7 text-white/90 sm:text-base">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gold font-mono text-xs font-bold text-navy">{index + 1}</span>
                    <span>{summary}</span>
                  </li>
                ))}
              </ol>
            </section>

            <ArticleReadingNav
              sections={readingSections}
              article={{ href: `/resources/${article.slug}`, title: article.title }}
            />

            <div id="article-body" className="mt-12 space-y-5">
              {article.sections.map((section, index) => (
                <section id={`section-${index + 1}`} key={section.heading} className="scroll-mt-24 rounded-2xl border-2 border-navy/10 bg-white p-6 shadow-[0_8px_24px_rgba(26,39,68,0.04)] sm:grid sm:grid-cols-[4rem_1fr] sm:gap-6 sm:p-8">
                  <div className="flex items-center gap-2 sm:flex-col sm:items-start" aria-hidden="true"><TopicIcon name="guide" size="sm" /><span className="font-mono text-xs font-semibold text-gold-ink">{String(index + 1).padStart(2, "0")}</span></div>
                  <div className="mt-3 sm:mt-0">
                    <h2 className="text-2xl font-semibold leading-8 tracking-tight text-navy sm:text-3xl">{section.heading}</h2>
                    {section.paragraphs?.map((paragraph) => (
                      <p key={paragraph} className="mt-5 text-[1.02rem] leading-8 text-muted">{paragraph}</p>
                    ))}
                    {section.bullets && (
                      <ul className="mt-6 border-l-2 border-gold/70 pl-5 sm:pl-6">
                        {section.bullets.map((bullet) => (
                          <li key={bullet} className="border-b border-border/70 py-3 leading-7 text-muted last:border-b-0 first:pt-0 last:pb-0">
                            {bullet}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </section>
              ))}
            </div>

            {article.sources && (
              <section className="mt-14 rounded-2xl border-2 border-navy/10 bg-white px-5 py-7 shadow-[0_8px_24px_rgba(26,39,68,0.04)] sm:px-8 sm:py-9" aria-labelledby="article-sources">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">공식 자료 기준 · 마지막 확인 {(article.updatedAt ?? article.publishedAt).replaceAll("-", ".")}</p>
                <h2 id="article-sources" className="mt-2 text-2xl font-semibold text-navy">원문을 열기 전에 알아둘 내용</h2>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-muted">각 공식 자료에서 무엇을 확인할 수 있는지 먼저 한국어로 풀어봤어요. 제도가 바뀌었거나 내 조건에 따라 달라질 수 있는 내용은 마지막으로 원문에서 확인해 주세요.</p>
                <ul className="mt-7 divide-y divide-border border-y border-border">
                  {article.sources.map((source) => (
                    <li key={source.href} className="py-5">
                      <p className="text-sm leading-7 text-muted">{source.summary}</p>
                      <a href={source.href} target="_blank" rel="noreferrer" className="mt-2 inline-flex min-h-11 items-center text-sm font-semibold text-navy underline decoration-gold decoration-2 underline-offset-4">
                        원문 보기 · {source.label} <span className="ml-2" aria-hidden="true">↗</span>
                      </a>
                    </li>
                  ))}
                </ul>
                <Link href="/editorial-policy" className="mt-5 inline-flex min-h-11 items-center text-sm font-semibold text-navy underline decoration-gold underline-offset-4">Hoju Compass 콘텐츠 작성 원칙 →</Link>
              </section>
            )}

            <ArticleNextStep slug={article.slug} toolHref={article.toolHref} toolLabel={article.toolLabel} />

            <p className="mt-8 text-xs leading-6 text-muted">
              이 자료는 일반적인 정보이며 개인 상황에 대한 법률, 재무, 세무 또는 이민 자문이 아닙니다.
            </p>
          </article>

          {relatedArticles.length > 0 && (
            <section className="mx-auto mt-16 max-w-5xl" aria-labelledby="related-articles-heading">
              <div className="flex items-end justify-between gap-6 border-b border-border pb-5">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">함께 보면 좋은 글</p>
                  <h2 id="related-articles-heading" className="mt-2 text-2xl font-semibold tracking-tight text-navy">이 내용도 도움이 될 거예요</h2>
                </div>
                <Link href="/resources" className={actionClass("tertiary", "hidden sm:inline-flex")}>
                  전체 자료 →
                </Link>
              </div>
              <ol className="mt-5 grid gap-4 lg:grid-cols-2">
                {relatedArticles.map((related, index) => (
                  <li key={related.slug}>
                    <Link href={`/resources/${related.slug}`} className="group grid h-full min-h-52 grid-rows-[auto_auto_1fr] rounded-2xl border-2 border-navy/10 bg-white p-6 transition hover:border-gold sm:p-8">
                      <div className="flex items-center justify-between gap-4">
                        <p className="text-xs font-semibold text-gold">{related.category} · {related.readingTime}</p>
                        <span className="font-mono text-xs text-muted">0{index + 1}</span>
                      </div>
                      <h3 className="mt-4 text-xl font-semibold leading-7 text-navy">{related.title}</h3>
                      <div className="mt-5 flex items-end justify-between gap-4">
                        <p className="text-sm leading-6 text-muted">{related.quickSummary[0]}</p>
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
