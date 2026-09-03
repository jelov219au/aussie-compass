import "server-only";
import { isCarPurchaseApprovedOffer, verifyCarPurchaseCheckout, type CarPurchaseApprovedOffer } from "./carPurchaseProCheckoutContract";

type Mode = "test" | "live";
type Receipt = { eventId: string; eventType: string; livemode: boolean; createdAt: Date };
type Identity = { productCode: "car_purchase_pro"; checkoutSessionId: string;
  paymentIntentId: string; chargeId: string; customerId: string };
export type CarPurchasePaidEvent = { receipt: Receipt; command: Identity & {
  action: "grant"; currency: "aud"; amountTotal: number; reason: "checkout_paid" | "async_payment_succeeded";
} };
export type CarPurchaseReversalEvent = { receipt: Receipt; command: Identity & {
  action: "revoke" | "review"; reason: "charge_fully_refunded" | "charge_partially_refunded" | "refund_status_requires_review";
} };
export interface CarPurchaseWebhookStore {
  // The paid event MUST lock the sales gate and grant in one DB transaction.
  applyPaidEventAndEntitlement(input: CarPurchasePaidEvent): Promise<unknown>;
  // Must preserve event idempotency/order and pre-grant reversal tombstones.
  // There is intentionally no grant/reopen method on this reversal port.
  applyReversal(input: CarPurchaseReversalEvent): Promise<unknown>;
}
export interface CarPurchaseWebhookProvider {
  retrieveCheckout(id: string, options: { expand: ["line_items"] }): Promise<unknown>;
  retrievePaymentIntent(id: string): Promise<unknown>;
  retrieveCharge(id: string): Promise<unknown>;
  listCheckoutsForPaymentIntent(id: string, options: { limit: 2 }): Promise<unknown>;
}
type Failure = "unavailable" | "invalid_signature" | "invalid_event" | "wrong_environment" | "contract_mismatch" | "persistence_failed";
type Outcome = "processed" | "duplicate" | "ignored_stale" | "tombstoned";
type Result = { ok: false; reason: Failure } | { ok: true; handled: false }
  | { ok: true; handled: true; outcome: Outcome };
const failed = (reason: Failure): Result => ({ ok: false, reason });
const record = (value: unknown): value is Record<string, unknown> => !!value && typeof value === "object" && !Array.isArray(value);
const id = (value: unknown, prefix: string): value is string => typeof value === "string"
  && new RegExp("^" + prefix + "_[A-Za-z0-9]{1,240}$").test(value);
function reference(value: unknown, prefix: string) {
  if (id(value, prefix)) return value;
  return record(value) && value.deleted !== true && id(value.id, prefix) ? value.id : null;
}
const paidTypes = ["checkout.session.completed", "checkout.session.async_payment_succeeded"];
const refundTypes = ["charge.refunded", "refund.created", "refund.updated", "refund.failed"];

// Isolated preparation, not mounted in the shared webhook route. verifySignature
// must call Stripe's signature-verifying constructEvent on the unchanged body.
// A handled:false result means continue the shared router; it is not an HTTP ACK.
export function createCarPurchaseWebhookFulfillment(deps: {
  enabled: boolean;
  approvedOffer: unknown;
  expectedMode: Mode | null;
  stripeMode: Mode | "missing" | "invalid";
  deployment: "production" | "nonproduction";
  verifySignature: ((payload: string, signature: string) => unknown | Promise<unknown>) | null;
  checkPrerequisites: ((offer: Readonly<CarPurchaseApprovedOffer>, mode: Mode) => Promise<boolean>) | null;
  provider: CarPurchaseWebhookProvider | null;
  store: CarPurchaseWebhookStore | null;
  now?: () => number;
}) {
  const mode = deps.expectedMode;
  const offer = isCarPurchaseApprovedOffer(deps.approvedOffer) && deps.approvedOffer.priceCents <= 2147483647
    ? Object.freeze({ ...deps.approvedOffer }) : null;
  const provider = deps.provider, store = deps.store;
  const verifySignature = deps.verifySignature, checkPrerequisites = deps.checkPrerequisites;
  const now = deps.now ?? Date.now;
  const configured = deps.enabled === true && !!offer && (mode === "test" || mode === "live") && mode === deps.stripeMode
    && ["production", "nonproduction"].includes(deps.deployment) && (deps.deployment === "production") === (mode === "live")
    && !!provider && !!store && typeof verifySignature === "function" && typeof checkPrerequisites === "function"
    && (["retrieveCheckout", "retrievePaymentIntent", "retrieveCharge", "listCheckoutsForPaymentIntent"] as const)
      .every(method => typeof provider[method] === "function")
    && typeof store.applyPaidEventAndEntitlement === "function" && typeof store.applyReversal === "function";

  function checkout(raw: unknown) {
    if (!record(raw) || !offer || !verifyCarPurchaseCheckout(raw, offer, mode).ok) return null;
    const paymentIntentId = reference(raw.payment_intent, "pi"), customerId = reference(raw.customer, "cus");
    return paymentIntentId && customerId ? { checkoutSessionId: raw.id as string, paymentIntentId, customerId } : null;
  }
  function charge(raw: unknown, chargeId: string) {
    if (!record(raw) || raw.object !== "charge" || raw.id !== chargeId || raw.livemode !== (mode === "live")
      || typeof raw.currency !== "string" || !/^[a-z]{3}$/.test(raw.currency)
      || typeof raw.amount !== "number" || !Number.isSafeInteger(raw.amount) || raw.amount <= 0 || raw.paid !== true
      || raw.captured !== true || raw.status !== "succeeded" || typeof raw.disputed !== "boolean"
      || typeof raw.refunded !== "boolean" || typeof raw.amount_refunded !== "number"
      || !Number.isSafeInteger(raw.amount_refunded) || raw.amount_refunded < 0 || raw.amount_refunded > raw.amount
      || raw.refunded !== (raw.amount_refunded === raw.amount)) return null;
    const paymentIntentId = reference(raw.payment_intent, "pi"), customerId = reference(raw.customer, "cus");
    return paymentIntentId && customerId ? { paymentIntentId, customerId, amount: raw.amount, currency: raw.currency,
      amountRefunded: raw.amount_refunded, disputed: raw.disputed } : null;
  }

  return async function fulfill(payload: string, signature: string): Promise<Result> {
    if (!configured) return failed("unavailable");
    if (typeof payload !== "string" || Buffer.byteLength(payload, "utf8") > 1024 * 1024
      || typeof signature !== "string" || !signature || signature.length > 4096) return failed("invalid_event");
    let event: unknown;
    try { event = await verifySignature!(payload, signature); } catch { return failed("invalid_signature"); }
    let at: number;
    try { at = now(); } catch { return failed("unavailable"); }
    if (!record(event) || event.object !== "event" || !id(event.id, "evt") || typeof event.type !== "string"
      || !Number.isFinite(at) || typeof event.created !== "number" || !Number.isSafeInteger(event.created)
      || event.created <= 0 || event.created > Math.floor(at / 1000) + 300
      || !record(event.data) || !record(event.data.object) || event.account != null || event.context != null) return failed("invalid_event");
    if (event.livemode !== (mode === "live")) return failed("wrong_environment");
    const isPaid = paidTypes.includes(event.type), isRefund = refundTypes.includes(event.type);
    if (!isPaid && !isRefund) return { ok: true, handled: false };
    const object = event.data.object;
    if (isPaid && (!record(object.metadata) || object.metadata.product_code !== "car_purchase_pro")) return { ok: true, handled: false };
    try {
      if (await checkPrerequisites!(offer!, mode!) !== true) return failed("unavailable");
    } catch { return failed("unavailable"); }
    const receipt: Receipt = { eventId: event.id, eventType: event.type, livemode: event.livemode as boolean,
      createdAt: new Date(event.created * 1000) };
    let input: CarPurchasePaidEvent | CarPurchaseReversalEvent;
    try {
      if (isPaid) {
        if (object.object !== "checkout.session" || !id(object.id, "cs_" + mode)
          || object.payment_status !== "paid" || object.status !== "complete" || object.mode !== "payment"
          || object.livemode !== receipt.livemode || !record(object.metadata)
          || object.metadata.billing_model !== offer!.billing || object.metadata.purchase_terms_version !== offer!.termsVersion) return failed("contract_mismatch");
        const raw = await provider!.retrieveCheckout(object.id, { expand: ["line_items"] });
        const purchase = checkout(raw);
        if (!purchase || purchase.checkoutSessionId !== object.id
          || reference(object.payment_intent, "pi") !== purchase.paymentIntentId
          || reference(object.customer, "cus") !== purchase.customerId
          || object.currency !== offer!.currency || object.amount_total !== offer!.priceCents
          || object.amount_subtotal !== offer!.priceCents) return failed("contract_mismatch");
        const pi = await provider!.retrievePaymentIntent(purchase.paymentIntentId);
        if (!record(pi) || pi.object !== "payment_intent" || pi.id !== purchase.paymentIntentId || pi.livemode !== receipt.livemode
          || pi.status !== "succeeded" || pi.currency !== offer!.currency || pi.amount !== offer!.priceCents
          || pi.amount_received !== offer!.priceCents || reference(pi.customer, "cus") !== purchase.customerId) return failed("contract_mismatch");
        const chargeId = reference(pi.latest_charge, "ch");
        if (!chargeId) return failed("contract_mismatch");
        const currentCharge = charge(await provider!.retrieveCharge(chargeId), chargeId);
        if (!currentCharge || currentCharge.paymentIntentId !== purchase.paymentIntentId || currentCharge.customerId !== purchase.customerId
          || currentCharge.currency !== offer!.currency || currentCharge.amount !== offer!.priceCents
          || currentCharge.amountRefunded !== 0 || currentCharge.disputed) return failed("contract_mismatch");
        input = { receipt, command: { ...purchase, chargeId, productCode: "car_purchase_pro", action: "grant",
          currency: "aud", amountTotal: offer!.priceCents,
          reason: event.type === "checkout.session.completed" ? "checkout_paid" : "async_payment_succeeded" } };
      } else {
        const chargeEvent = event.type === "charge.refunded";
        if (object.object !== (chargeEvent ? "charge" : "refund") || !id(object.id, chargeEvent ? "ch" : "re")) return failed("contract_mismatch");
        const chargeId = chargeEvent ? object.id : reference(object.charge, "ch");
        if (!chargeId) return failed("contract_mismatch");
        const currentCharge = charge(await provider!.retrieveCharge(chargeId), chargeId);
        if (!currentCharge || (object.payment_intent != null && reference(object.payment_intent, "pi") !== currentCharge.paymentIntentId)
          || (chargeEvent && currentCharge.amountRefunded === 0)) return failed("contract_mismatch");
        const list = await provider!.listCheckoutsForPaymentIntent(currentCharge.paymentIntentId, { limit: 2 });
        if (!record(list) || list.has_more !== false || !Array.isArray(list.data) || list.data.length !== 1
          || !record(list.data[0]) || !id(list.data[0].id, "cs_" + mode)) return failed("contract_mismatch");
        const raw = await provider!.retrieveCheckout(list.data[0].id, { expand: ["line_items"] });
        if (!record(raw) || raw.id !== list.data[0].id || reference(raw.payment_intent, "pi") !== currentCharge.paymentIntentId
          || reference(raw.customer, "cus") !== currentCharge.customerId) return failed("contract_mismatch");
        if (record(raw) && record(raw.metadata) && typeof raw.metadata.product_code === "string"
          && raw.metadata.product_code !== "car_purchase_pro") return { ok: true, handled: false };
        const purchase = checkout(raw);
        if (!purchase || purchase.checkoutSessionId !== list.data[0].id || purchase.paymentIntentId !== currentCharge.paymentIntentId
          || purchase.customerId !== currentCharge.customerId || currentCharge.currency !== offer!.currency
          || currentCharge.amount !== offer!.priceCents) return failed("contract_mismatch");
        const full = currentCharge.amountRefunded === offer!.priceCents;
        input = { receipt, command: { ...purchase, chargeId, productCode: "car_purchase_pro", action: full ? "revoke" : "review",
          reason: full ? "charge_fully_refunded" : currentCharge.amountRefunded > 0 ? "charge_partially_refunded" : "refund_status_requires_review" } };
      }
    } catch { return failed("unavailable"); }
    try {
      const result = input.command.action === "grant"
        ? await store!.applyPaidEventAndEntitlement(input as CarPurchasePaidEvent)
        : await store!.applyReversal(input as CarPurchaseReversalEvent);
      const allowed = input.command.action === "grant" ? ["processed", "duplicate", "ignored_stale"]
        : ["processed", "duplicate", "ignored_stale", "tombstoned"];
      if (!record(result) || typeof result.outcome !== "string" || !allowed.includes(result.outcome)) return failed("persistence_failed");
      return { ok: true, handled: true, outcome: result.outcome as Outcome };
    } catch { return failed("persistence_failed"); }
  };
}
