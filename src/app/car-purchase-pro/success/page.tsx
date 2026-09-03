import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Container } from "@/components/ui/Container";
import { CarPurchaseProActivationForm } from "@/components/tools/CarPurchaseProActivationForm";
import { validCarPurchaseSessionId } from "@/lib/carPurchaseProActivationClient";

export const metadata: Metadata = {
  title: "중고차 거래노트 이용권 확인 | Hoju Compass",
  description: "중고차 거래노트의 구매 확인과 이 브라우저의 이용 연결을 안내합니다.",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};
export const dynamic = "force-dynamic";

export default async function CarPurchaseProSuccessPage({ searchParams }: {
  searchParams: Promise<{ session_id?: string | string[] }>;
}) {
  const { session_id: candidate } = await searchParams;
  const sessionId = validCarPurchaseSessionId(candidate) ? candidate : undefined;
  const invalidReference = candidate !== undefined && sessionId === undefined;
  // Returning to this URL never grants access or proves payment. Explicit POST
  // activation must verify the server receipt and current DB entitlement later.
  return <><Header /><main className="py-12 sm:py-16"><Container className="max-w-3xl">
    <p className="text-sm font-semibold text-gold-ink">중고차 거래노트 Pro · 이용권 확인</p>
    <h1 className="mt-4 text-3xl font-semibold leading-tight text-navy sm:text-4xl">구매 확인 정보를 받는 화면입니다.</h1>
    <p className="mt-5 leading-8 text-muted">이 화면에 도착했다는 사실만으로 결제나 이용권 처리가 완료된 것은 아닙니다. 확인이 끝나기 전에는 다시 결제하지 마세요.</p>
    <p className="mt-4 rounded-xl border border-gold/50 bg-[#f6f3e9] p-4 text-sm leading-7 text-navy">중고차 거래노트는 현재 준비 중이며 새 구매와 이용권 연결은 열려 있지 않습니다.</p>
    <CarPurchaseProActivationForm initialSessionId={sessionId} invalidReference={invalidReference} enabled={false} />
    <div className="mt-8 flex flex-wrap gap-3">
      <Link href="/car-purchase-pro" className="inline-flex min-h-12 items-center rounded-lg border border-navy px-5 py-3 text-sm font-semibold text-navy">제품 소개로 돌아가기</Link>
      <Link href="/car-purchase-pro/restore" className="inline-flex min-h-12 items-center rounded-lg border border-navy px-5 py-3 text-sm font-semibold text-navy">복구·연결 관리</Link>
      <Link href="/payment-help" className="inline-flex min-h-12 items-center rounded-lg border border-navy px-5 py-3 text-sm font-semibold text-navy">결제·접근 문제 도움말</Link>
      <Link href="/contact" className="inline-flex min-h-12 items-center rounded-lg border border-navy px-5 py-3 text-sm font-semibold text-navy">고객지원</Link>
    </div>
    <p className="mt-5 text-xs leading-6 text-muted">확인 주소나 브라우저 저장값을 공개하거나 공유하지 마세요.</p>
  </Container></main><Footer /></>;
}
