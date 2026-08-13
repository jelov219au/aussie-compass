import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { GuideIcon } from "@/components/icons/Icons";
import { Container } from "@/components/ui/Container";
import { BreadcrumbJsonLd } from "@/components/seo/JsonLd";
import { articles } from "@/data/articles";
import { createPageMetadata } from "@/lib/site";

export const metadata = createPageMetadata({ title: "호주 생활·취업 실용 자료 | Aussie Compass", description: "호주 구직, 영문 이력서, 생활비와 저축에 바로 적용할 수 있는 한국어 가이드를 읽어보세요.", path: "/resources" });

export default function ResourcesPage() { return <><BreadcrumbJsonLd items={[{ name: "홈", path: "/" }, { name: "실용 자료", path: "/resources" }]} /><Header /><main className="py-12 sm:py-16"><Container><Link href="/" className="inline-flex min-h-11 items-center text-sm font-medium text-muted hover:text-navy">&larr; 홈으로 돌아가기</Link><div className="mt-5 max-w-3xl"><p className="text-sm font-semibold uppercase tracking-[0.16em] text-gold">실용 자료 허브</p><h1 className="mt-3 text-3xl font-semibold tracking-tight text-navy sm:text-4xl">호주 생활과 취업을 한 단계씩</h1><p className="mt-4 text-base leading-7 text-muted sm:text-lg">복잡한 내용을 읽기 쉽게 정리하고, 바로 실행할 수 있는 무료 도구를 함께 연결합니다.</p></div><ul className="mt-10 grid gap-6 lg:grid-cols-3">{articles.map((article) => <li key={article.slug}><Link href={`/resources/${article.slug}`} className="group flex h-full flex-col rounded-2xl border border-border bg-white p-6 shadow-sm transition hover:border-gold/50 hover:shadow-md"><GuideIcon /><p className="mt-5 text-xs font-semibold text-gold">{article.category} · {article.readingTime}</p><h2 className="mt-2 text-xl font-semibold leading-7 text-navy">{article.title}</h2><p className="mt-3 flex-1 text-sm leading-6 text-muted">{article.description}</p><span className="mt-6 text-sm font-semibold text-navy">읽어보기 &rarr;</span></Link></li>)}</ul></Container></main><Footer /></>; }
