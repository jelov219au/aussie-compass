import Link from "next/link";
import { articles } from "@/data/articles";
import { Container } from "@/components/ui/Container";

export function ArticlesSection() {
  const latestArticles = articles.slice(-3).reverse();

  return <section className="border-y border-border bg-white py-16 sm:py-24" aria-labelledby="resources-heading"><Container><div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between"><div><h2 id="resources-heading" className="text-3xl font-semibold tracking-tight text-navy sm:text-4xl">새로 정리한 생활 정보</h2><p className="mt-3 max-w-2xl text-sm leading-6 text-muted sm:text-base">공식 안내가 어렵게 느껴질 때, 필요한 부분만 한국어로 차근차근 읽어보세요.</p></div><Link href="/resources" className="inline-flex min-h-11 items-center text-sm font-semibold text-navy">전체 {articles.length}개 자료 보기 →</Link></div><ol className="mt-8 grid gap-4 lg:grid-cols-3">{latestArticles.map((article,index) => <li key={article.slug}><Link href={`/resources/${article.slug}`} className="group grid h-full min-h-64 grid-rows-[auto_1fr_auto] rounded-2xl border border-border bg-background p-6 transition hover:-translate-y-0.5 hover:border-navy/25"><span className="flex items-center justify-between text-xs"><span className="text-gold">{String(index+1).padStart(2,"0")}</span><span className="text-muted">{article.category} · {article.readingTime}</span></span><span className="py-7"><strong className="block text-xl leading-8 text-navy">{article.title}</strong><span className="mt-3 block text-sm leading-6 text-muted">{article.description}</span></span><span className="flex items-center justify-between text-sm font-semibold text-navy"><span>이어서 읽기</span><span className="text-lg transition group-hover:translate-x-1" aria-hidden="true">→</span></span></Link></li>)}</ol></Container></section>;
}
