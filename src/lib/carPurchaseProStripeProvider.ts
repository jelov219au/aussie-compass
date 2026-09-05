import "server-only";
import type Stripe from "stripe";
import type { CarPurchaseCheckoutProvider } from "./carPurchaseProCheckoutCreation";

export type CarPurchaseStripeProvider = CarPurchaseCheckoutProvider & {
  retrieveSession(id: string, options: { expand: ["line_items"] }): Promise<unknown>;
};

// Accept an already configured server client. This adapter neither reads keys
// nor activates a runtime; assembly readiness and offer validation remain required.
export function createCarPurchaseStripeProvider(client: Pick<Stripe, "prices" | "checkout">): CarPurchaseStripeProvider {
  const retrievePrice = client.prices.retrieve.bind(client.prices);
  const createSession = client.checkout.sessions.create.bind(client.checkout.sessions);
  const retrieveSession = client.checkout.sessions.retrieve.bind(client.checkout.sessions);
  return Object.freeze({
    retrievePrice: (id, options) => retrievePrice(id, options),
    createSession: (params, options) => createSession(params, options),
    retrieveSession: (id, options) => retrieveSession(id, options),
  } satisfies CarPurchaseStripeProvider);
}
