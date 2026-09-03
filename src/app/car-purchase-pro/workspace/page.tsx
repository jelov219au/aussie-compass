import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Container } from "@/components/ui/Container";
import { CarPurchaseProWorkspace } from "@/components/tools/CarPurchaseProWorkspace";

export const metadata: Metadata = {
  title: "중고차 거래노트 Pro 개발 검수 | Hoju Compass",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

export default function CarPurchaseProWorkspacePage() {
  // No public access until this new product has its own entitlement contract.
  if (process.env.NODE_ENV !== "development") redirect("/car-purchase-pro");
  return <><Header /><main className="py-12 sm:py-16"><Container>
    <Link href="/car-purchase-pro" className="inline-flex min-h-11 items-center text-sm font-semibold text-navy">← 중고차 거래노트 소개</Link>
    <div className="mb-8 mt-6">
      <p className="text-sm font-semibold text-gold-ink">Car Purchase Pack Pro · 개발 검수</p>
      <h1 className="mt-3 text-3xl font-semibold text-navy sm:text-5xl">내 중고차 거래노트</h1>
      <p className="mt-4 max-w-3xl leading-7 text-muted">검사 결과, 판매자 약속, 내 결정을 기록하는 첫 버전입니다. 현재 판매 중인 상품이 아닙니다.</p>
    </div>
    <CarPurchaseProWorkspace />
  </Container></main><Footer /></>;
}
