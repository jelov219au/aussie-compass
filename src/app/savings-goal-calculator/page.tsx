import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { SavingsGoalCalculator } from "@/components/tools/SavingsGoalCalculator";
import { Container } from "@/components/ui/Container";
import { BreadcrumbJsonLd } from "@/components/seo/JsonLd";
import { createPageMetadata } from "@/lib/site";

export const metadata = createPageMetadata({ title: "저축 목표·비상금 프로젝트 | Hoju Compass", description: "저축 목표를 계산하고 완료 기록, 진행률과 캘린더 반복 리마인더로 꾸준히 관리하세요.", path: "/savings-goal-calculator" });

export default function SavingsGoalPage() {
  return <><BreadcrumbJsonLd items={[{ name: "홈", path: "/" }, { name: "무료 도구", path: "/tools" }, { name: "저축 목표 플래너", path: "/savings-goal-calculator" }]} /><Header /><main className="py-12 sm:py-16"><Container><Link href="/tools" className="inline-flex min-h-11 items-center text-sm font-medium text-muted hover:text-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-2">&larr; 도구 목록으로 돌아가기</Link><div className="mb-10 mt-5 max-w-3xl"><p className="text-sm font-semibold uppercase tracking-[0.16em] text-gold">나의 저축 프로젝트</p><h1 className="mt-3 text-3xl font-semibold tracking-tight text-navy sm:text-4xl">저축 목표·비상금 플래너</h1><p className="mt-4 text-base leading-relaxed text-muted sm:text-lg">목표를 계산하는 데서 끝내지 않고, 실제 저축을 기록하고 다음 저축일을 기억하며 꾸준히 진행하세요.</p></div><SavingsGoalCalculator /><section className="mt-10 rounded-2xl border border-border bg-white p-6 sm:p-8"><h2 className="text-xl font-semibold text-navy">비상금 목표를 정한다면</h2><p className="mt-3 max-w-4xl text-sm leading-7 text-muted sm:text-base">호주 정부 MoneySmart는 예상치 못한 지출에 대비해 약 3개월치 생활비를 목표로 제시합니다. 먼저 생활비 계산기에서 월간 지출을 확인하고 3을 곱해 목표 금액으로 사용해 보세요.</p><Link href="/cost-of-living-calculator" className="mt-4 inline-flex min-h-11 items-center font-semibold text-navy underline decoration-gold decoration-2 underline-offset-4">생활비 계산기로 목표 확인하기 &rarr;</Link></section></Container></main><Footer /></>;
}
