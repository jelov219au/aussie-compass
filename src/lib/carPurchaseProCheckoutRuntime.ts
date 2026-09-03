import "server-only";
import { createCarPurchaseCheckoutHttp } from "./carPurchaseProCheckoutHttp";
import { siteUrl } from "./site";

// Offer, car DB/webhook readiness and the complete customer journey are still
// pending. Environment flags cannot connect the preparation adapters by themselves.
export const handleCarPurchaseCheckout = createCarPurchaseCheckoutHttp({
  service: null,
  enabled: false,
  expectedOrigin: new URL(siteUrl).origin,
});
