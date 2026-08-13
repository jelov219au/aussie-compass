import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { JobApplicationTracker } from "@/components/tools/JobApplicationTracker";
import { Container } from "@/components/ui/Container";
import { BreadcrumbJsonLd } from "@/components/seo/JsonLd";
import { createPageMetadata } from "@/lib/site";

export const metadata = createPageMetadata({ title: "호주 구직 지원 트래커 | Aussie Compass", description: "호주 구직 공고, 지원일, 면접과 다음 행동을 브라우저에서 안전하게 관리하세요.", path: "/job-application-tracker" });

export default function JobTrackerPage() { return <><BreadcrumbJsonLd items={[{ name: "홈", path: "/" }, { name: "무료 도구", path: "/tools" }, { name: "구직 지원 트래커", path: "/job-application-tracker" }]} /><Header /><main className="py-12 sm:py-16"><Container><Link href="/tools" className="inline-flex min-h-11 items-center text-sm font-medium text-muted hover:text-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-2">&larr; 도구 목록으로 돌아가기</Link><div className="mb-10 mt-5 max-w-3xl"><p className="text-sm font-semibold uppercase tracking-[0.16em] text-gold">나의 구직 프로젝트</p><h1 className="mt-3 text-3xl font-semibold tracking-tight text-navy sm:text-4xl">호주 구직 지원 트래커</h1><p className="mt-4 text-base leading-relaxed text-muted sm:text-lg">관심 공고부터 면접과 오퍼까지 한곳에서 기록하고 다음 행동을 놓치지 마세요. 모든 내용은 현재 브라우저에만 저장됩니다.</p></div><JobApplicationTracker /><section className="mt-10 rounded-2xl border border-border bg-surface p-6 sm:p-8"><h2 className="text-xl font-semibold text-navy">이력서를 먼저 준비해야 한다면</h2><p className="mt-3 text-sm leading-7 text-muted sm:text-base">지원할 직무에 맞춰 Summary와 경력 문장을 조정하고 PDF로 저장한 뒤 지원 기록을 추가하세요.</p><Link href="/resume-builder" className="mt-4 inline-flex min-h-11 items-center font-semibold text-navy underline decoration-gold decoration-2 underline-offset-4">영문 이력서 만들기 &rarr;</Link></section></Container></main><Footer /></>;
}
