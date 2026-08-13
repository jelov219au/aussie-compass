import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Container } from "@/components/ui/Container";
import { BreadcrumbJsonLd } from "@/components/seo/JsonLd";
import { articles, getArticle } from "@/data/articles";
import { createPageMetadata } from "@/lib/site";

export function generateStaticParams() { return articles.map((article) => ({ slug: article.slug })); }
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> { const { slug } = await params; const article = getArticle(slug); return article ? createPageMetadata({ title: `${article.title} | Aussie Compass`, description: article.description, path: `/resources/${article.slug}` }) : {}; }

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params; const article = getArticle(slug); if (!article) notFound();
  return <><BreadcrumbJsonLd items={[{ name: "홈", path: "/" }, { name: "실용 자료", path: "/resources" }, { name: article.title, path: `/resources/${article.slug}` }]} /><Header /><main className="py-12 sm:py-16"><Container><Link href="/resources" className="inline-flex min-h-11 items-center text-sm font-medium text-muted hover:text-navy">&larr; 실용 자료 목록</Link><article className="mx-auto mt-5 max-w-3xl"><header><p className="text-sm font-semibold text-gold">{article.category} · 읽는 시간 {article.readingTime}</p><h1 className="mt-3 text-3xl font-semibold leading-tight tracking-tight text-navy sm:text-4xl">{article.title}</h1><p className="mt-5 text-lg leading-8 text-muted">{article.description}</p></header><div className="mt-10 space-y-10">{article.sections.map((section) => <section key={section.heading}><h2 className="text-2xl font-semibold tracking-tight text-navy">{section.heading}</h2>{section.paragraphs?.map((paragraph) => <p key={paragraph} className="mt-4 leading-8 text-muted">{paragraph}</p>)}{section.bullets && <ul className="mt-4 space-y-3">{section.bullets.map((bullet) => <li key={bullet} className="flex gap-3 leading-7 text-muted"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-gold" aria-hidden="true" /><span>{bullet}</span></li>)}</ul>}</section>)}</div><aside className="mt-12 rounded-2xl bg-navy p-6 text-white sm:p-8"><p className="text-sm font-semibold text-gold">읽은 내용을 바로 실행해 보세요</p><h2 className="mt-2 text-2xl font-semibold">무료 도구로 이어서 진행하기</h2><Link href={article.toolHref} className="mt-5 inline-flex min-h-12 items-center rounded-lg bg-gold px-5 py-3 font-semibold text-navy">{article.toolLabel}</Link></aside><p className="mt-8 text-xs leading-6 text-muted">이 자료는 일반적인 정보이며 개인 상황에 대한 법률, 재무, 세무 또는 이민 자문이 아닙니다.</p></article></Container></main><Footer /></>;
}
