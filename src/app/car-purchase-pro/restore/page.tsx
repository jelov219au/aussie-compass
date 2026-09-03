import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Container } from "@/components/ui/Container";
import { CarPurchaseProRecoveryPanel } from "@/components/tools/CarPurchaseProRecoveryPanel";

export const metadata: Metadata = {
  title: "중고차 거래노트 복구·연결 관리 | Hoju Compass",
  description: "중고차 거래노트의 복구 코드와 브라우저 이용 연결을 관리하는 화면입니다.",
  robots: { index: false, follow: false }, referrer: "no-referrer",
};
export default function CarPurchaseProRestorePage() {
  return <><Header /><main className="py-12 sm:py-16"><Container className="max-w-3xl">
    <p className="text-sm font-semibold text-gold-ink">중고차 거래노트 Pro · 이용 연결</p>
    <h1 className="mt-4 text-3xl font-semibold leading-tight text-navy sm:text-4xl">복구·연결 관리</h1>
    <p className="mt-5 rounded-xl border border-gold/50 bg-[#f6f3e9] p-4 text-sm leading-7 text-navy">현재 기능 준비 중입니다. 새 구매와 복구·기기 연결 해제는 아직 열려 있지 않습니다.</p>
    <CarPurchaseProRecoveryPanel enabled={false} />
    <div className="mt-8 flex flex-wrap gap-3">
      <Link href="/car-purchase-pro" className="inline-flex min-h-12 items-center rounded-lg border border-navy px-5 py-3 text-sm font-semibold text-navy">제품 소개</Link>
      <Link href="/payment-help" className="inline-flex min-h-12 items-center rounded-lg border border-navy px-5 py-3 text-sm font-semibold text-navy">결제·접근 도움말</Link>
      <Link href="/contact" className="inline-flex min-h-12 items-center rounded-lg border border-navy px-5 py-3 text-sm font-semibold text-navy">고객지원</Link>
    </div>
  </Container></main><Footer /></>;
}
