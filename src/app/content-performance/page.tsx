import Link from "next/link";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { BreadcrumbJsonLd } from "@/components/seo/JsonLd";
import { ContentPerformanceTracker } from "@/components/tools/ContentPerformanceTracker";
import { Container } from "@/components/ui/Container";
import { createPageMetadata } from "@/lib/site";
import { requireLocalOperatorAccess } from "@/lib/operatorOnly";

export const metadata = { ...createPageMetadata({ title: "SNS·커뮤니티 콘텐츠 성과 기록판 | Hoju Compass", description: "게시물별 조회, 링크 클릭과 저장 합계를 직접 기록하고 효과가 좋은 채널과 주제를 비교하세요.", path: "/content-performance" }), robots: { index: false, follow: false } };
type SearchParams = Promise<Record<string, string | string[] | undefined>>;
function readParam(value: string | string[] | undefined, maxLength: number) { return (Array.isArray(value) ? value[0] : value)?.trim().slice(0, maxLength); }

export default async function ContentPerformancePage({ searchParams }: { searchParams: SearchParams }) {
  requireLocalOperatorAccess();
  const params = await searchParams; const initialValues = { target: readParam(params.target, 100), source: readParam(params.source, 30), campaign: readParam(params.campaign, 64), date: readParam(params.date, 10), format: readParam(params.format, 20) };
  return <><BreadcrumbJsonLd items={[{ name: "홈", path: "/" }, { name: "무료 도구", path: "/tools" }, { name: "콘텐츠 성과 기록판", path: "/content-performance" }]} /><Header /><main className="py-12 sm:py-16"><Container><Link href="/content-planner" className="inline-flex min-h-11 items-center text-sm font-medium text-muted hover:text-navy">&larr; 콘텐츠 발행 플래너로 돌아가기</Link><div className="mb-10 mt-5 grid gap-7 border-b border-navy/20 pb-9 lg:grid-cols-[1fr_20rem] lg:items-end"><div className="max-w-4xl"><p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">Content performance scorecard</p><h1 className="mt-3 text-4xl font-semibold tracking-tight text-navy sm:text-5xl">감이 아니라 기록으로 다음 콘텐츠를 정하세요.</h1><p className="mt-5 max-w-3xl leading-7 text-muted">게시물에 표시된 조회·도달, 링크 클릭과 저장 합계를 직접 기록해 반응이 좋은 주제와 채널을 찾습니다.</p></div><aside className="border-l-2 border-gold pl-5 text-sm leading-6 text-muted"><strong className="block text-navy">개인별 데이터는 기록하지 않음</strong>방문자 이름, 이메일, 계정 ID와 댓글 내용은 입력하지 않습니다.</aside></div><ContentPerformanceTracker initialValues={initialValues} /><section className="mt-12 grid gap-5 border-t border-navy/20 pt-8 lg:grid-cols-2"><div><h2 className="text-xl font-semibold text-navy">숫자를 비교하는 방법</h2><ul className="mt-3 space-y-2 text-sm leading-6 text-muted"><li>• 같은 채널과 비슷한 형식끼리 비교하기</li><li>• 클릭뿐 아니라 저장이 많은 실용 주제도 다음 계획에 반영하기</li><li>• 한 게시물보다 4주 이상 반복된 흐름을 보기</li></ul></div><div className="border border-border bg-surface p-5 text-sm leading-7 text-muted"><strong className="text-navy">현재 기능 범위</strong><p className="mt-1">이 기록판은 수치를 직접 입력하는 로컬 도구입니다. 분석 스크립트, 광고 픽셀, 플랫폼 계정 연결이나 자동 수집은 포함하지 않습니다.</p></div></section><section className="mt-8 border-l-2 border-gold bg-white p-5"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">Resume Pro funnel</p><h2 className="mt-2 text-xl font-semibold text-navy">방문부터 실제 구매까지 따로 확인할 수 있어요.</h2><Link href="/resume-pro-performance" className="mt-4 inline-flex min-h-11 items-center text-sm font-semibold text-navy underline decoration-gold decoration-2 underline-offset-4">Resume Pro 성과 확인 →</Link></section></Container></main><Footer /></>;
}
