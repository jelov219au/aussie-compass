import type { Metadata } from "next";
import Link from "next/link";

import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { ResumeProActivationForm } from "@/components/tools/ResumeProActivationForm";
import { Container } from "@/components/ui/Container";
import { getConfiguredEntitlementStore } from "@/lib/neonEntitlementStore";
import { getActiveResumeProEntitlement, isEntitlementSessionConfigured } from "@/lib/resumeProAccess";
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
  const hasActiveEntitlement = Boolean(await getActiveResumeProEntitlement());
  let paid = false;
  let entitlementActive = false;

  if (!hasActiveEntitlement && sessionId) {
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
            {hasActiveEntitlement
              ? "이 기기의 이용권이 연결되어 있습니다."
              : paid
                ? "결제가 확인됐습니다. 이제 작업공간을 여세요."
                : "구매 내역을 안전하게 확인해 주세요."}
          </h1>
          <p className="mt-5 max-w-2xl text-sm leading-7 text-muted">
            {hasActiveEntitlement
              ? "결제나 이용권 연결을 다시 진행하지 마세요. 작업공간에서 저장한 회사별 지원서를 다시 열거나 새 지원서를 시작할 수 있습니다."
              : "같은 제품을 다시 결제할 필요는 없습니다. 아래 안내에서 현재 상태를 확인하고, 이용권을 이 기기에 연결하면 Resume Pro 작업공간으로 바로 이동합니다."}
          </p>
          {hasActiveEntitlement ? (
            <section className="mt-6 border-l-2 border-emerald-600 bg-white p-5 sm:p-6" aria-labelledby="resume-pro-active-access-heading">
              <h2 id="resume-pro-active-access-heading" className="text-xl font-semibold text-navy">바로 작업공간에서 계속하세요.</h2>
              <p className="mt-2 text-sm leading-6 text-muted">작업공간에서도 이용권을 다시 확인합니다. 이 화면에서는 결제 정보나 이용권 연결 코드를 다시 입력할 필요가 없습니다.</p>
              <Link href="/resume-pro/workspace#resume-pro-workspace" className="mt-5 inline-flex min-h-12 items-center justify-center bg-navy px-5 py-3 text-sm font-semibold text-white hover:bg-navy-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2">
                작업공간에서 지원서 계속하기
              </Link>
            </section>
          ) : (
            <ResumeProActivationForm
              initialSessionId={sessionId}
              initialNotice={initialNotice}
              hasExplicitNotice={Boolean(status)}
              paymentConfirmed={paid}
            />
          )}
        </Container>
      </main>
      <Footer />
    </>
  );
}
