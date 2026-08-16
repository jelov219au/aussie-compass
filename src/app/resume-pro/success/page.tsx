import type { Metadata } from "next";
import Link from "next/link";

import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { Container } from "@/components/ui/Container";
import { resumeProProduct } from "@/lib/commerce";
import { getStripe, getStripeSecretMode } from "@/lib/stripe";

export const metadata: Metadata = {
  title: "Resume Pro 결제 확인 | Hoju Compass",
  description: "Resume Pro 테스트 결제 상태를 안전하게 확인합니다.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ session_id?: string }>;
};

export default async function ResumeProSuccessPage({ searchParams }: Props) {
  const { session_id: sessionId } = await searchParams;
  let paid = false;
  let testMode = true;
  const secretMode = getStripeSecretMode();

  if (sessionId?.startsWith("cs_") && (secretMode === "test" || secretMode === "live")) {
    try {
      const session = await getStripe().checkout.sessions.retrieve(sessionId, { expand: ["line_items"] });
      const item = session.line_items?.data[0];
      paid = session.payment_status === "paid"
        && session.metadata?.product_code === "resume_pro"
        && item?.currency === resumeProProduct.currency
        && item.amount_total === resumeProProduct.priceCents;
      testMode = !session.livemode;
    } catch {
      paid = false;
    }
  }

  return (
    <>
      <Header />
      <main className="py-14 sm:py-20">
        <Container className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">Payment status</p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-navy sm:text-5xl">
            {paid ? "결제가 확인됐습니다." : "결제 상태를 확인할 수 없습니다."}
          </h1>
          <div className="mt-8 border-l-2 border-gold bg-white p-6 text-sm leading-7 text-muted">
            {paid && testMode && "Stripe 테스트 결제가 정상 처리됐습니다. 실제 청구나 Pro 이용권 부여는 발생하지 않습니다."}
            {paid && !testMode && "결제는 확인됐지만 이용권은 서명된 웹훅 처리 후 활성화됩니다. 이 화면만으로 이용권을 부여하지 않습니다."}
            {!paid && "잘못된 주소이거나 결제가 완료되지 않았습니다. Stripe 결제 화면 또는 Resume Pro 소개 페이지에서 다시 확인해 주세요."}
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/resume-pro" className="inline-flex min-h-12 items-center justify-center bg-navy px-5 py-3 text-sm font-semibold text-white">Resume Pro로 돌아가기</Link>
            <Link href="/resume-builder" className="inline-flex min-h-12 items-center justify-center border border-navy px-5 py-3 text-sm font-semibold text-navy">무료 이력서 빌더</Link>
          </div>
        </Container>
      </main>
      <Footer />
    </>
  );
}
