import "server-only";

import { resumeProProduct } from "@/lib/commerce";
import { getStripe, getStripeSecretMode } from "@/lib/stripe";

export async function getVerifiedResumeProCheckout(sessionId: string) {
  const secretMode = getStripeSecretMode();
  if (!/^cs_(?:test_)?[A-Za-z0-9]+$/.test(sessionId)
    || (secretMode !== "test" && secretMode !== "live")) return null;

  try {
    const session = await getStripe().checkout.sessions.retrieve(sessionId, { expand: ["line_items"] });
    const item = session.line_items?.data[0];
    const paid = session.payment_status === "paid"
      && session.metadata?.product_code === "resume_pro"
      && item?.currency === resumeProProduct.currency
      && item.amount_total === resumeProProduct.priceCents;
    const expectsLive = process.env.VERCEL_ENV === "production";

    return paid && session.livemode === expectsLive ? session : null;
  } catch {
    return null;
  }
}
