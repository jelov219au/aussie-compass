import { TrackedLink } from "@/components/analytics/TrackedLink";
import { articles } from "@/data/articles";
import { Container } from "@/components/ui/Container";
import { TopicIcon } from "@/components/ui/TopicIcon";
import { actionClass } from "@/components/ui/actionStyles";

function articleIcon(category: string) {
  if (["집 구하기", "임대 입주", "차량 구매"].includes(category)) return "home" as const;
  if (["급여 확인", "직장 권리", "고용 형태", "첫 직장", "호주 취업", "영문 이력서"].includes(category)) return "work" as const;
  if (["저축과 생활비", "생활비", "공과금", "소비자 권리"].includes(category)) return "money" as const;
  return "guide" as const;
}

export function ArticlesSection() {
  const latestArticles = [...articles]
    .sort((left, right) => Date.parse(right.publishedAt) - Date.parse(left.publishedAt))
    .slice(0, 3);

  return <section className="border-y border-border bg-white py-16 sm:py-24" aria-labelledby="resources-heading"><Container><div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-sm font-semibold text-gold-ink">공식 출처와 실행 순서를 함께</p><h2 id="resources-heading" className="mt-2 text-3xl font-semibold tracking-tight text-navy sm:text-4xl">새로 정리한 생활 정보</h2><p className="mt-3 max-w-2xl text-sm leading-6 text-muted sm:text-base">긴 글을 열기 전에도 무엇을 확인하게 될지 바로 알 수 있어요.</p></div><TrackedLink href="/resources" eventName="Home Navigation" properties={{ section: "latest_articles", destination: "all_resources" }} className={actionClass("tertiary")}>전체 {articles.length}개 자료 보기 <span aria-hidden="true">→</span></TrackedLink></div><ol className="mt-8 grid gap-5 lg:grid-cols-3">{latestArticles.map((article,index) => <li key={article.slug}><TrackedLink href={`/resources/${article.slug}`} eventName="Home Navigation" properties={{ section: "latest_articles", destination: article.slug }} className="group grid h-full min-h-80 grid-rows-[auto_1fr_auto] overflow-hidden rounded-3xl border-2 border-navy/10 bg-background shadow-[0_10px_28px_rgba(26,39,68,0.05)] transition hover:-translate-y-1 hover:border-gold hover:shadow-[0_18px_40px_rgba(26,39,68,0.1)]"><span className="flex items-center justify-between bg-[#e8efee] p-5"><TopicIcon name={articleIcon(article.category)} /><span className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-navy">{article.category} · {article.readingTime}</span></span><span className="p-6"><span className="font-mono text-xs text-gold-ink">{String(index+1).padStart(2,"0")}</span><strong className="mt-4 block text-xl leading-8 text-navy">{article.title}</strong><span className="mt-3 block text-sm leading-6 text-muted">{article.quickSummary[0]}</span></span><span className="mx-6 mb-6 flex min-h-12 items-center justify-between rounded-xl bg-navy px-5 text-sm font-semibold text-white"><span>이 글 읽기</span><span className="text-lg transition group-hover:translate-x-1" aria-hidden="true">→</span></span></TrackedLink></li>)}</ol></Container></section>;
}
