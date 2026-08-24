import type { Metadata } from "next";

import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { ResumeProActivationForm } from "@/components/tools/ResumeProActivationForm";
import { Container } from "@/components/ui/Container";
import { getConfiguredEntitlementStore } from "@/lib/neonEntitlementStore";
import { isEntitlementSessionConfigured } from "@/lib/resumeProAccess";
import { getVerifiedResumeProCheckout } from "@/lib/resumeProPurchase";

export const metadata: Metadata = {
  title: "Resume Pro 결제 확인 | Hoju Compass",
  description: "Resume Pro 결제와 이용권 처리 상태를 안전하게 확인합니다.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ session_id?: string; status?: string }>;
};

export default async function ResumeProSuccessPage({ searchParams }: Props) {
  const { session_id: sessionId, status } = await searchParams;
  let paid = false;
  let entitlementActive = false;

  if (sessionId) {
    const session = await getVerifiedResumeProCheckout(sessionId);
    if (session) {
      paid = true;
      const store = getConfiguredEntitlementStore();
      entitlementActive = Boolean(await store?.findActiveByCheckoutSession(session.id, "resume_pro"));
    }
  }

  const canActivate = paid && entitlementActive && isEntitlementSessionConfigured();
  const initialNotice = status === "refunded" ? "refunded"
    : status === "review" ? "review"
      : status === "unavailable" ? "unavailable"
        : canActivate ? "ready"
          : paid || status === "pending" ? "pending"
            : "unavailable";

  return (
    <>
      <Header />
      <main className="py-14 sm:py-20">
        <Container className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">결제 결과 확인</p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-navy sm:text-5xl">
            {paid ? "결제가 확인됐습니다. 이제 작업공간을 여세요." : "구매 내역을 안전하게 확인해 주세요."}
          </h1>
          <p className="mt-5 max-w-2xl text-sm leading-7 text-muted">같은 제품을 다시 결제할 필요는 없습니다. 아래 안내에서 현재 상태를 확인하고, 이용권을 이 기기에 연결하면 Resume Pro 작업공간으로 바로 이동합니다.</p>
          <ResumeProActivationForm
            initialSessionId={sessionId}
            initialNotice={initialNotice}
            hasExplicitNotice={Boolean(status)}
            paymentConfirmed={paid}
          />
        </Container>
      </main>
      <Footer />
    </>
  );
}
