import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CostOfLivingCalculator } from "@/components/tools/CostOfLivingCalculator";
import { Container } from "@/components/ui/Container";
import { BreadcrumbJsonLd } from "@/components/seo/JsonLd";
import { createPageMetadata } from "@/lib/site";

export const metadata = createPageMetadata({ title: "호주 생활비 계산기 | Aussie Compass", description: "주거비, 식비, 교통비 등 호주 생활비를 주·월·연간으로 환산하고 세후 수입과 비교하세요.", path: "/cost-of-living-calculator" });

export default function CostOfLivingCalculatorPage() {
  return <><BreadcrumbJsonLd items={[{ name: "홈", path: "/" }, { name: "생활비 계산기", path: "/cost-of-living-calculator" }]} /><Header /><main className="py-12 sm:py-16"><Container><Link href="/#tools" className="inline-flex min-h-11 items-center text-sm font-medium text-muted hover:text-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-2">&larr; 도구 목록으로 돌아가기</Link><div className="mb-10 mt-5 max-w-3xl"><p className="text-sm font-semibold uppercase tracking-[0.16em] text-gold">무료 예산 도구</p><h1 className="mt-3 text-3xl font-semibold tracking-tight text-navy sm:text-4xl">호주 생활비 계산기</h1><p className="mt-4 text-base leading-relaxed text-muted sm:text-lg">서로 다른 결제 주기의 생활비를 한 번에 비교하고, 세후 수입에서 실제로 얼마가 남는지 확인하세요. 입력 내용은 현재 브라우저에만 저장됩니다.</p></div><CostOfLivingCalculator /><section className="mt-10 rounded-2xl border border-border bg-white p-6 sm:p-8" aria-labelledby="budget-guide-heading"><h2 id="budget-guide-heading" className="text-xl font-semibold text-navy">예산을 더 현실적으로 만드는 방법</h2><ul className="mt-4 grid gap-3 text-sm leading-6 text-muted md:grid-cols-3"><li className="rounded-xl bg-surface p-4"><strong className="block text-navy">최근 내역을 기준으로</strong>은행 거래 내역이나 청구서를 확인해 실제 평균 금액을 입력하세요.</li><li className="rounded-xl bg-surface p-4"><strong className="block text-navy">불규칙한 비용도 포함</strong>차량 등록비, 보험처럼 연간으로 내는 비용도 결제 주기를 선택해 넣으세요.</li><li className="rounded-xl bg-surface p-4"><strong className="block text-navy">여유 자금 남기기</strong>예상하지 못한 지출과 저축을 위해 수입 전부를 고정비로 배정하지 마세요.</li></ul></section></Container></main><Footer /></>;
}
