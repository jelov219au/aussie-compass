import { articles } from "@/data/articles";
import { siteName, siteUrl } from "@/lib/site";

function escapeXml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

export function GET() {
  const latestDate = articles.reduce(
    (latest, article) => {
      const date = article.updatedAt ?? article.publishedAt;
      return date > latest ? date : latest;
    },
    "1970-01-01",
  );

  const items = articles
    .map((article, index) => ({ article, index }))
    .sort((a, b) => b.article.publishedAt.localeCompare(a.article.publishedAt) || b.index - a.index)
    .map(({ article }) => {
      const url = `${siteUrl}/resources/${article.slug}`;
      return `    <item>
      <title>${escapeXml(article.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <description>${escapeXml(article.description)}</description>
      <category>${escapeXml(article.category)}</category>
      <pubDate>${new Date(`${article.publishedAt}T00:00:00Z`).toUTCString()}</pubDate>
    </item>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${siteName} 실용 자료</title>
    <link>${siteUrl}/resources</link>
    <description>호주 생활과 취업에 바로 적용할 수 있는 한국어 실용 가이드</description>
    <language>ko</language>
    <lastBuildDate>${new Date(`${latestDate}T00:00:00Z`).toUTCString()}</lastBuildDate>
    <atom:link href="${siteUrl}/feed.xml" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
