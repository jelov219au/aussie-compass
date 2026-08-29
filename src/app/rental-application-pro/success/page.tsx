import type { Metadata } from "next";
import Link from "next/link";

import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { Container } from "@/components/ui/Container";
import { getConfiguredEntitlementStore } from "@/lib/neonEntitlementStore";
import { isRentalApplicationEntitlementSessionConfigured } from "@/lib/rentalApplicationProAccess";
import { getVerifiedRentalApplicationProCheckout } from "@/lib/rentalApplicationProPurchase";

export const metadata: Metadata = {
  title: "Rental Application Pack Pro 결제 확인 | Hoju Compass",
  description: "Rental Application Pack Pro 결제와 이용권 처리 상태를 안전하게 확인합니다.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ session_id?: string; status?: string }>;
};

export default async function RentalApplicationProSuccessPage({ searchParams }: Props) {
  const { session_id: sessionId, status } = await searchParams;
  let paid = false;
  let entitlementStatus: "active" | "revoked" | "review" | null = null;
  let testMode = true;

  if (sessionId) {
    const session = await getVerifiedRentalApplicationProCheckout(sessionId);
    if (session) {
      paid = true;
      testMode = !session.livemode;
      const store = getConfiguredEntitlementStore();
      const entitlement = await store?.findByCheckoutSession(session.id, "rental_application_pro");
      entitlementStatus = entitlement?.status ?? null;
    }
  }

  const entitlementActive = entitlementStatus === "active";
  const entitlementRevoked = entitlementStatus === "revoked";
  const canActivate = paid && entitlementActive && isRentalApplicationEntitlementSessionConfigured();

  return (
    <>
      <Header />
      <main className="py-14 sm:py-20">
        <Container className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">결제 결과 확인</p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-navy sm:text-5xl">
            {entitlementRevoked ? "환불 또는 결제 취소가 확인됐습니다." : paid ? "결제가 확인됐습니다." : "결제 상태를 확인할 수 없습니다."}
          </h1>
          <div className="mt-8 border-l-2 border-gold bg-white p-6 text-sm leading-7 text-muted">
            {paid && entitlementRevoked && "결제 이용권이 회수되어 Rental Pack Pro 접근이 종료됐습니다. 환불 내역은 Stripe에서 발송한 이메일 또는 결제 수단 명세서에서 확인해 주세요."}
            {paid && !entitlementRevoked && testMode && entitlementActive && "Stripe 테스트 결제와 서명된 웹훅 이용권이 확인됐습니다. 실제 청구는 없으며 테스트 접근 세션만 발급할 수 있습니다."}
            {paid && !entitlementRevoked && testMode && !entitlementActive && "Stripe 테스트 결제는 확인됐지만 웹훅 이용권 처리가 아직 완료되지 않았습니다."}
            {paid && !entitlementRevoked && !testMode && entitlementActive && "결제와 서명된 웹훅 이용권이 확인됐습니다. 아래 버튼을 눌러 이 기기에 접근 세션을 발급하세요."}
            {paid && !entitlementRevoked && !testMode && !entitlementActive && "결제는 확인됐지만 서명된 웹훅 이용권 처리가 아직 완료되지 않았습니다."}
            {!paid && "잘못된 주소이거나 결제가 완료되지 않았습니다. Stripe 결제 화면 또는 제품 소개 페이지에서 다시 확인해 주세요."}
            {status === "pending" && !entitlementRevoked && " 잠시 후 이 페이지에서 다시 시도해 주세요."}
            {status === "unavailable" && !entitlementRevoked && " 접근 세션 설정을 확인할 수 없습니다."}
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            {canActivate && sessionId && (
              <form action="/api/rental-application-pro/access/activate" method="post">
                <input type="hidden" name="session_id" value={sessionId} />
                <button type="submit" className="inline-flex min-h-12 items-center justify-center bg-gold px-5 py-3 text-sm font-semibold text-navy">Rental Pack Pro 열기</button>
              </form>
            )}
            <Link href="/rental-application-pro" className="inline-flex min-h-12 items-center justify-center bg-navy px-5 py-3 text-sm font-semibold text-white">제품 소개로 돌아가기</Link>
            <Link href="/rental-application-pro/restore" className="inline-flex min-h-12 items-center justify-center border border-navy px-5 py-3 text-sm font-semibold text-navy">이용권 복구</Link>
            <Link href="/payment-help" className="inline-flex min-h-12 items-center justify-center border border-navy px-5 py-3 text-sm font-semibold text-navy">결제·접근 문제 해결</Link>
          </div>
        </Container>
      </main>
      <Footer />
    </>
  );
}
