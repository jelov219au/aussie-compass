import type { Metadata } from "next";
import Link from "next/link";

import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { RentalApplicationProActivationForm } from "@/components/tools/RentalApplicationProActivationForm";
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

type PostPurchaseNotice = "ready" | "pending" | "unavailable" | "used" | "released" | "refunded" | "review";

const explicitNotices = new Set<PostPurchaseNotice>(["pending", "unavailable", "used", "released", "refunded", "review"]);

const headings: Record<PostPurchaseNotice, string> = {
  ready: "결제가 확인됐습니다.",
  pending: "이용권 처리를 확인하고 있습니다.",
  unavailable: "결제 상태를 확인할 수 없습니다.",
  used: "결제 완료 주소가 이미 사용됐습니다.",
  released: "이 기기의 이용 연결이 해제됐습니다.",
  refunded: "환불로 이용이 종료됐습니다.",
  review: "결제 상태를 확인하고 있습니다.",
};

const notices: Record<Exclude<PostPurchaseNotice, "ready">, string> = {
  pending: "다시 결제하지 마세요. 결제 또는 웹훅 이용권 처리가 끝날 때까지 잠시 기다린 뒤, 아래 버튼으로 같은 구매를 다시 확인해 주세요.",
  unavailable: "다시 결제하지 마세요. 이 브라우저에 보관된 구매 확인 정보로 재확인하거나 결제·접근 문제 해결 순서를 이용해 주세요.",
  used: "이 결제 완료 주소는 이미 다른 브라우저에서 이용권 연결에 사용됐습니다. 다시 결제하지 말고 기존 기기에서 만든 1회용 복구 코드를 사용하세요.",
  released: "이 기기의 서버 접근 세션은 이미 해제됐습니다. 다시 결제하지 말고 보관한 1회용 복구 코드로 연결하세요.",
  refunded: "환불 완료로 Rental Pack Pro 이용권이 종료됐습니다. 재활성화할 수 없으며 결제 내역은 고객지원에서 확인할 수 있습니다.",
  review: "결제 상태를 검토하고 있어 재활성화할 수 없습니다. 다시 결제하지 말고 결제 상태 재확인 순서나 고객지원을 이용해 주세요.",
};

export default async function RentalApplicationProSuccessPage({ searchParams }: Props) {
  const { session_id: sessionId, status } = await searchParams;
  let paid = false;
  let entitlementActive = false;
  let testMode = true;

  if (sessionId) {
    const session = await getVerifiedRentalApplicationProCheckout(sessionId);
    if (session) {
      paid = true;
      testMode = !session.livemode;
      const store = getConfiguredEntitlementStore();
      entitlementActive = Boolean(await store?.findActiveByCheckoutSession(session.id, "rental_application_pro"));
    }
  }

  const canActivate = paid && entitlementActive && isRentalApplicationEntitlementSessionConfigured();
  const explicitNotice = explicitNotices.has(status as PostPurchaseNotice) ? status as PostPurchaseNotice : null;
  const notice: PostPurchaseNotice = explicitNotice ?? (canActivate ? "ready" : paid ? "pending" : "unavailable");
  const terminalNotice = notice === "used" || notice === "released" || notice === "refunded" || notice === "review";
  const canRestore = notice !== "refunded" && notice !== "review";
  const readyNotice = testMode
    ? "Stripe 테스트 결제와 서명된 웹훅 이용권이 확인됐습니다. 실제 청구는 없으며 이 브라우저에 테스트 접근 세션을 연결할 수 있습니다."
    : "결제와 서명된 웹훅 이용권이 확인됐습니다. 아래 버튼으로 이 브라우저에 접근 세션을 연결하세요.";

  return (
    <>
      <Header />
      <main className="py-14 sm:py-20">
        <Container className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">결제 결과 확인</p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-navy sm:text-5xl">
            {headings[notice]}
          </h1>
          <div className="mt-8 border-l-2 border-gold bg-white p-6 text-sm leading-7 text-muted">
            {notice === "ready" ? readyNotice : notices[notice]}
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <RentalApplicationProActivationForm
              initialSessionId={!terminalNotice ? sessionId : undefined}
              initialNotice={notice}
            />
            <Link href="/rental-application-pro" className="inline-flex min-h-12 items-center justify-center bg-navy px-5 py-3 text-sm font-semibold text-white">제품 소개로 돌아가기</Link>
            {canRestore && <Link href="/rental-application-pro/restore" className="inline-flex min-h-12 items-center justify-center border border-navy px-5 py-3 text-sm font-semibold text-navy">이용권 복구</Link>}
            <Link href="/payment-help" className="inline-flex min-h-12 items-center justify-center border border-navy px-5 py-3 text-sm font-semibold text-navy">결제·접근 문제 해결</Link>
          </div>
        </Container>
      </main>
      <Footer />
    </>
  );
}
