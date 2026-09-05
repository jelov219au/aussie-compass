import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { SavingsGoalCalculator } from "@/components/tools/SavingsGoalCalculator";
import { Container } from "@/components/ui/Container";
import { BreadcrumbJsonLd } from "@/components/seo/JsonLd";
import { createPageMetadata } from "@/lib/site";

export const metadata = createPageMetadata({ title: "저축 목표·비상금 프로젝트 | Hoju Compass", description: "저축 목표를 계산하고 완료 기록, 진행률과 캘린더 반복 리마인더로 꾸준히 관리하세요.", path: "/savings-goal-calculator" });
const linkClass = "font-semibold text-navy underline decoration-gold decoration-2 underline-offset-4";

export default function SavingsGoalPage() {
  return <><BreadcrumbJsonLd items={[{ name: "홈", path: "/" }, { name: "무료 도구", path: "/tools" }, { name: "저축 목표 플래너", path: "/savings-goal-calculator" }]} /><Header /><main className="py-12 sm:py-16"><Container>
    <Link href="/tools" className="inline-flex min-h-11 items-center text-sm font-medium text-muted hover:text-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-2">&larr; 도구 목록으로 돌아가기</Link>
    <div className="mb-10 mt-5 max-w-3xl"><p className="text-sm font-semibold uppercase tracking-[0.16em] text-gold">나의 저축 프로젝트</p><h1 className="mt-3 text-3xl font-semibold tracking-tight text-navy sm:text-4xl">저축 목표·비상금 플래너</h1><p className="mt-4 text-base leading-relaxed text-muted sm:text-lg">목표까지 필요한 납입 횟수나 정기 저축액을 계산하세요. 실제로 저축한 뒤 기록하고, 인출하면 현재 잔액을 고쳐 계획을 다시 확인할 수 있습니다.</p></div>
    <SavingsGoalCalculator />
    <section className="mt-10 rounded-2xl border border-border bg-white p-6 sm:p-8"><h2 className="text-xl font-semibold text-navy">작은 목표부터 실제 잔액으로 확인하기</h2><p className="mt-3 text-sm leading-7 text-muted">가상 예시: 현재 $0, 목표 $600, 매주 $50, 연이율 0%라면 주기 말에 12번 납입하면 $600입니다. 첫 납입이 한 주 뒤라면 약 12주이며, 실제 달력과 입금 시점에 따라 달라질 수 있습니다.</p><ol className="mt-4 grid gap-4 text-sm leading-7 text-muted md:grid-cols-3"><li className="rounded-xl bg-surface p-4"><strong className="block text-navy">1. 필수비와 큰 청구서 구분</strong>생활비에서 가능한 금액을 확인하고, 날짜가 정해진 등록비·보험료 같은 큰 지출을 위한 적립과 예상치 못한 일을 위한 비상금을 구분하세요.</li><li className="rounded-xl bg-surface p-4"><strong className="block text-navy">2. 실제 저축 후 기록</strong>본인이 송금을 마친 뒤 해당 금액만 체크인하세요. 이미 현재 잔액에 넣은 돈을 다시 기록하면 두 번 더해집니다. 이 도구는 은행 계좌에 연결되거나 송금하지 않습니다.</li><li className="rounded-xl bg-surface p-4"><strong className="block text-navy">3. 인출하면 잔액 수정</strong>비상금을 썼다면 현재 모은 금액을 실제 잔액으로 고치세요. 보관 중인 최대 100건 기록 합계는 현재 잔액이나 전체 저축 이력 합계가 아닙니다.</li></ol></section>
    <section className="mt-6 rounded-2xl border border-border bg-white p-6 sm:p-8"><h2 className="text-xl font-semibold text-navy">비상금은 감당할 수 있는 단계로</h2><p className="mt-3 max-w-4xl text-sm leading-7 text-muted sm:text-base">MoneySmart는 적은 금액부터 시작해 꾸준히 모으고, 생활비 3개월분을 하나의 비상금 목표로 제시합니다. 당장 채워야 하는 의무 금액은 아닙니다. 본인의 상황에 맞춰 작은 완충 자금부터, 그다음 필수비 한 달분, 이후 더 긴 기간으로 나눠 목표를 정해 볼 수 있습니다.</p><p className="mt-3 text-sm leading-7 text-muted">공식 참고: <a href="https://moneysmart.gov.au/saving/save-for-an-emergency-fund" className={linkClass}>MoneySmart 비상금 마련 안내</a>. 확인일: 2026년 9월 5일.</p><Link href="/cost-of-living-calculator" className={`mt-4 inline-flex min-h-11 items-center ${linkClass}`}>생활비 계산기로 필수비 확인하기 &rarr;</Link></section>
  </Container></main><Footer /></>;
}
