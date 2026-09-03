import "server-only";
import { isCarPurchaseApprovedOffer, verifyCarPurchaseCheckout } from "./carPurchaseProCheckoutContract";
import { getStripe, getStripeSecretMode } from "./stripe";

type StripeMode = "test" | "live" | "missing" | "invalid";
export function createCarPurchaseCheckoutVerifier(deps: {
  approvedOffer: unknown;
  expectedMode: "test" | "live" | null;
  stripeMode: StripeMode;
  retrieveSession: (sessionId: string, options: { expand: ["line_items"] }) => Promise<unknown>;
}) {
  return async function getVerifiedCheckout(sessionId: string): Promise<{ id: string; customerId: string } | null> {
    if (!isCarPurchaseApprovedOffer(deps.approvedOffer) || !deps.expectedMode || deps.stripeMode !== deps.expectedMode
      || !new RegExp("^cs_" + deps.expectedMode + "_[A-Za-z0-9]{1,240}$").test(sessionId)) return null;
    try {
      const raw = await deps.retrieveSession(sessionId, { expand: ["line_items"] });
      const checked = verifyCarPurchaseCheckout(raw, deps.approvedOffer, deps.expectedMode);
      if (!checked.ok || checked.checkoutSessionId !== sessionId) return null;
      const session = raw as Record<string, unknown>;
      const customer = session.customer;
      const customerId = typeof customer === "string" ? customer
        : customer && typeof customer === "object" && !Array.isArray(customer)
          && !("deleted" in customer && customer.deleted === true) && "id" in customer ? customer.id : null;
      if (typeof customerId !== "string" || !/^cus_[A-Za-z0-9]{1,240}$/.test(customerId)) return null;
      // This receipt is NOT a grant: refunded/revoked purchases must still fail the active DB check.
      return { id: checked.checkoutSessionId, customerId };
    } catch { return null; }
  };
}

export async function getVerifiedCarPurchaseProCheckout(sessionId: string) {
  const verify = createCarPurchaseCheckoutVerifier({
    approvedOffer: null, // Price/terms and exact Stripe IDs require the reviewed product configuration.
    expectedMode: process.env.VERCEL_ENV === "production" ? "live" : "test",
    stripeMode: getStripeSecretMode(),
    retrieveSession: (id, options) => getStripe().checkout.sessions.retrieve(id, options),
  });
  return verify(sessionId);
}
