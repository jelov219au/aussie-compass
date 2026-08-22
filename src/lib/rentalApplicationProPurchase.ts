import "server-only";

import { rentalApplicationProProduct } from "@/lib/commerce";
import { getStripe, getStripeSecretMode } from "@/lib/stripe";

export async function getVerifiedRentalApplicationProCheckout(sessionId: string) {
  const secretMode = getStripeSecretMode();
  if (!/^cs_(?:test|live)_[A-Za-z0-9]+$/.test(sessionId)
    || (secretMode !== "test" && secretMode !== "live")) return null;

  try {
    const session = await getStripe().checkout.sessions.retrieve(sessionId, { expand: ["line_items"] });
    const item = session.line_items?.data[0];
    const paid = session.payment_status === "paid"
      && session.status === "complete"
      && session.mode === "payment"
      && session.metadata?.product_code === "rental_application_pro"
      && session.metadata?.billing_model === "one_time"
      && session.currency === rentalApplicationProProduct.currency
      && session.amount_total === rentalApplicationProProduct.priceCents
      && session.line_items?.data.length === 1
      && item?.quantity === 1
      && item?.currency === rentalApplicationProProduct.currency
      && item.amount_total === rentalApplicationProProduct.priceCents;
    const expectsLive = process.env.VERCEL_ENV === "production";

    return paid && session.livemode === expectsLive ? session : null;
  } catch {
    return null;
  }
}
