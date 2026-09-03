import assert from "node:assert/strict";
import { carPurchaseProRelease, isCarPurchaseApprovedOffer, verifyCarPurchaseCheckout } from "../src/lib/carPurchaseProCheckoutContract.ts";

// Synthetic price is a test fixture, not an approved retail price.
const offer = { productCode: "car_purchase_pro", currency: "aud", billing: "one_time",
  priceCents: 1234, stripePriceId: "price_synthetic", stripeProductId: "prod_synthetic", termsVersion: "2026-09-03" };
const session = {
  id: "cs_test_synthetic", livemode: false, payment_status: "paid", status: "complete", mode: "payment",
  currency: "aud", amount_total: 1234, amount_subtotal: 1234,
  metadata: { product_code: "car_purchase_pro", billing_model: "one_time", purchase_terms_version: "2026-09-03" },
  total_details: { amount_discount: 0, amount_tax: 0, amount_shipping: 0 },
  line_items: { has_more: false, data: [{ quantity: 1, currency: "aud", amount_total: 1234, amount_subtotal: 1234,
    price: { id: "price_synthetic", product: "prod_synthetic", type: "one_time", currency: "aud", unit_amount: 1234 } }] },
};
assert.equal(carPurchaseProRelease.salesEnabled, false);
assert.equal(carPurchaseProRelease.priceCents, null);
assert.equal(isCarPurchaseApprovedOffer(carPurchaseProRelease), false);
assert.deepEqual(verifyCarPurchaseCheckout(session, null, "test"), { ok: false, reason: "offer_unconfigured" });
assert.deepEqual(verifyCarPurchaseCheckout(session, offer, null), { ok: false, reason: "environment_unverified" });
assert.deepEqual(verifyCarPurchaseCheckout(session, offer, "test"), { ok: true, checkoutSessionId: session.id });
let negativeCases = 0;
const reject = mutate => { const changed = structuredClone(session); mutate(changed); assert.equal(verifyCarPurchaseCheckout(changed, offer, "test").ok, false); negativeCases++; };
for (const code of ["resume_pro", "rental_application_pro", "pay_evidence_pro", "eofy_pro", "leaving_australia_pro", "car_buy_pro", "", null]) {
  reject(value => { value.metadata.product_code = code; });
}
for (const mutation of [
  value => { value.id = "cs_live_synthetic"; },
  value => { value.livemode = true; },
  value => { value.payment_status = "unpaid"; },
  value => { value.payment_status = "no_payment_required"; },
  value => { value.status = "open"; },
  value => { value.mode = "subscription"; },
  value => { value.metadata = null; },
  value => { value.metadata.billing_model = "recurring"; },
  value => { value.metadata.purchase_terms_version = "2026-08-01"; },
  value => { value.currency = "usd"; },
  value => { value.amount_total = 1233; },
  value => { value.amount_total = "1234"; },
  value => { value.amount_subtotal = 1300; },
  value => { value.total_details.amount_discount = 1; },
  value => { value.total_details.amount_tax = 1; },
  value => { value.total_details.amount_shipping = 1; },
  value => { value.line_items.has_more = true; },
  value => { value.line_items.data = []; },
  value => { value.line_items.data.push(structuredClone(value.line_items.data[0])); },
  value => { value.line_items.data[0].quantity = 2; },
  value => { value.line_items.data[0].price.id = "price_wrong"; },
  value => { value.line_items.data[0].price.product = "prod_wrong"; },
  value => { value.line_items.data[0].price.unit_amount = 0; },
  value => { value.line_items.data[0].price.type = "recurring"; },
  value => { value.line_items.data[0].price = null; },
  value => { value.line_items.data[0].amount_total = 0; },
]) reject(mutation);
for (const wrong of [null, {}, { ...offer, priceCents: 0 }, { ...offer, priceCents: 1.1 },
  { ...offer, priceCents: Infinity }, { ...offer, priceCents: Number.MAX_SAFE_INTEGER + 1 },
  { ...offer, termsVersion: "2026-02-30" }, { ...offer, stripeProductId: "" }]) {
  assert.equal(isCarPurchaseApprovedOffer(wrong), false);
}
const live = { ...session, id: "cs_live_synthetic", livemode: true };
assert.equal(verifyCarPurchaseCheckout(live, offer, "live").ok, true);
assert.equal(verifyCarPurchaseCheckout(live, offer, "test").ok, false);
console.log("PASS car checkout contract: test/live fixtures, unconfigured offer, " + negativeCases + " negative sessions, invalid offers. No Stripe calls or product activation.");
