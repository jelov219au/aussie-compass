import Link from "next/link";
import type { ReadArticleRecord } from "@/lib/articleProgress";

export type ResourceSummary = {
  href: string;
  title: string;
  description: string;
  category: string;
  readingTime: string;
};

function getRecommendations(articles: ResourceSummary[], readHrefs: Set<string>, latestHref?: string) {
  const latestIndex = latestHref ? articles.findIndex((article) => article.href === latestHref) : -1;
  const ordered = latestIndex >= 0
    ? [...articles.slice(latestIndex + 1), ...articles.slice(0, latestIndex + 1)]
    : articles;

  return ordered.filter((article) => !readHrefs.has(article.href)).slice(0, 3);
}

export function ResourceReadingProgress({
  articles,
  readArticles,
}: {
  articles: ResourceSummary[];
  readArticles: ReadArticleRecord[];
}) {
  if (!articles.length) return null;

  const availableHrefs = new Set(articles.map((article) => article.href));
  const readHrefs = new Set(readArticles.map((article) => article.href).filter((href) => availableHrefs.has(href)));
  const completed = readHrefs.size;
  const progress = Math.round((completed / articles.length) * 100);
  const recommendations = getRecommendations(articles, readHrefs, readArticles[0]?.href);

  return (
    <section className="mt-12 grid border-y border-navy/20 lg:grid-cols-[18rem_minmax(0,1fr)]" aria-labelledby="reading-progress-heading">
      <div className="bg-navy p-7 text-white sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">Resource progress</p>
        <h2 id="reading-progress-heading" className="mt-2 text-2xl font-semibold">
          실용 자료 완독률
        </h2>
        <p className="mt-5 font-mono text-4xl text-gold">
          {completed}<span className="text-lg text-white/45"> / {articles.length}</span>
        </p>
        <div
          className="mt-5 h-1.5 overflow-hidden rounded-full bg-white/15"
          role="progressbar"
          aria-label="실용 자료 완독률"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progress}
        >
          <span className="block h-full bg-gold transition-[width]" style={{ width: `${progress}%` }} />
        </div>
        <p className="mt-3 text-sm leading-6 text-white/65">
          글을 90% 이상 읽으면 이 기기에 자동으로 완료 기록이 남습니다.
        </p>
        <Link href="/resources" className="mt-5 inline-flex min-h-11 items-center border-b border-gold text-sm font-semibold">
          전체 자료 보기 →
        </Link>
      </div>

      <div className="p-7 sm:p-8 lg:pl-10">
        <div className="flex items-end justify-between gap-4 border-b border-border pb-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gold">Up next</p>
            <h3 className="mt-1 text-xl font-semibold text-navy">
              {recommendations.length ? "다음에 읽을 자료" : "모든 자료를 읽었습니다"}
            </h3>
          </div>
          {recommendations.length > 0 && <span className="font-mono text-xs text-muted">약 {recommendations.reduce((total, article) => total + Number.parseInt(article.readingTime, 10), 0)}분</span>}
        </div>

        {recommendations.length ? (
          <ol>
            {recommendations.map((article, index) => (
              <li key={article.href} className="border-b border-border last:border-b-0">
                <Link href={article.href} className="group grid gap-2 py-5 sm:grid-cols-[2rem_minmax(0,1fr)_auto] sm:items-start sm:gap-4">
                  <span className="font-mono text-xs text-gold">{String(index + 1).padStart(2, "0")}</span>
                  <span>
                    <span className="block text-xs font-semibold text-muted">{article.category} · {article.readingTime}</span>
                    <strong className="mt-1 block text-base leading-6 text-navy">{article.title}</strong>
                    <span className="mt-1 hidden text-sm leading-6 text-muted sm:block">{article.description}</span>
                  </span>
                  <span className="hidden text-lg text-navy transition group-hover:translate-x-1 sm:block" aria-hidden="true">→</span>
                </Link>
              </li>
            ))}
          </ol>
        ) : (
          <div className="py-8">
            <p className="text-lg font-semibold text-navy">현재 공개된 자료를 모두 확인했습니다.</p>
            <p className="mt-2 text-sm leading-7 text-muted">새 자료는 실용 자료 허브와 RSS에서 확인할 수 있습니다.</p>
            <Link href="/feed.xml" className="mt-4 inline-flex min-h-11 items-center text-sm font-semibold text-navy underline decoration-gold underline-offset-4">새 글 RSS 열기 →</Link>
          </div>
        )}
      </div>
    </section>
  );
}
