import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Container } from "@/components/ui/Container";
import { ServicePriceLog } from "@/components/tools/ServicePriceLog";
import { BreadcrumbJsonLd } from "@/components/seo/JsonLd";
import { createPageMetadata } from "@/lib/site";
export const metadata = createPageMetadata({ title: "호주 생활 서비스 가격 기록 | Hoju Compass", description: "받은 견적과 결제한 서비스 비용을 지역·월·시간대별로 구분해 개인 기록으로 보관하세요.", path: "/service-price-log" });
export default function ServicePriceLogPage() {
  return <><BreadcrumbJsonLd items={[{ name: "홈", path: "/" }, { name: "서비스 가격 기록", path: "/service-price-log" }]} /><Header /><main className="py-12 sm:py-16"><Container>
    <Link href="/tools" className="inline-flex min-h-11 items-center text-sm font-medium text-muted hover:text-navy">&larr; 도구 목록으로 돌아가기</Link>
    <div className="mt-5 max-w-4xl"><p className="text-sm font-semibold text-gold">내가 받은 견적과 실제 지출</p><h1 className="mt-3 text-3xl font-semibold tracking-tight text-navy sm:text-4xl">받은 견적과 실제 비용을 구분해 기록하세요</h1><p className="mt-4 text-base leading-7 text-muted sm:text-lg">서비스 가격은 작업 범위와 긴급성에 따라 달라집니다. 견적과 최종 결제를 구분하고, 비슷한 조건의 내 기록을 확인해 보세요.</p></div>
    <div className="my-8"><ServicePriceLog /></div>
    <section className="rounded-2xl border border-border bg-surface p-6"><h2 className="text-xl font-semibold text-navy">견적 $200과 야간 결제 $400을 섞지 마세요</h2><p className="mt-3 text-sm leading-7 text-muted">가상 예시: NSW의 일반 시간 청소 견적 $200과 야간 청소의 결제 완료 $400을 합쳐 중앙값 $300이라고 하면 조건 차이가 사라집니다. 이 도구는 견적/결제, 주·준주, 월, 시간대를 나누어 보여줍니다.</p><p className="mt-3 text-sm leading-7 text-muted">같은 조건이 1건이면 1건으로 표시합니다. 개인 기록 몇 건을 호주 전체 시세로 일반화하지 마세요. 추가 비용이 붙었다면 최종 청구 금액으로 별도의 결제 기록을 남기고 원래 견적과 구분하세요.</p></section>
    <section className="mt-6 rounded-2xl border border-border bg-white p-6"><h2 className="text-xl font-semibold text-navy">내 기록의 범위와 확인 상태</h2><p className="mt-3 text-sm leading-7 text-muted">이 기록은 서버로 공유되지 않습니다. 입력한 네 비용과 월을 확인한 뒤 기록을 추가하세요. 전체 금액 확인을 하지 않았거나 월이 없는 기록은 보관되지만 금액 요약에서 제외됩니다. 예전 기록의 0원이 실제 0원이었는지는 추정하지 않으므로 청구서와 다시 대조해 주세요.</p><Link href="/service-quote-comparator" className="mt-4 inline-flex min-h-11 items-center font-semibold text-navy underline">미확정 견적의 작업 범위와 비용 비교하기 →</Link></section>
  </Container></main><Footer /></>;
}
