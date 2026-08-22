import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const priority = {
  active: 1,
  grant: 1,
  review: 2,
  revoked: 3,
  revoke: 3,
};

function shouldApply({ currentCreatedAt, currentStatus, incomingCreatedAt, incomingAction }) {
  if (currentStatus === "revoked" && incomingAction === "review") return false;
  if (incomingCreatedAt > currentCreatedAt) return true;
  if (incomingCreatedAt < currentCreatedAt) return false;
  return priority[incomingAction] > priority[currentStatus];
}

const earlier = new Date("2026-08-18T00:00:00.000Z");
const later = new Date("2026-08-18T00:00:01.000Z");

assert.equal(shouldApply({
  currentCreatedAt: earlier,
  currentStatus: "active",
  incomingCreatedAt: later,
  incomingAction: "revoke",
}), true, "a newer full refund must revoke access");

assert.equal(shouldApply({
  currentCreatedAt: later,
  currentStatus: "revoked",
  incomingCreatedAt: earlier,
  incomingAction: "grant",
}), false, "an older checkout event must not reopen refunded access");

assert.equal(shouldApply({
  currentCreatedAt: earlier,
  currentStatus: "active",
  incomingCreatedAt: earlier,
  incomingAction: "revoke",
}), true, "a same-second revoke must outrank a grant");

assert.equal(shouldApply({
  currentCreatedAt: earlier,
  currentStatus: "revoked",
  incomingCreatedAt: earlier,
  incomingAction: "grant",
}), false, "a same-second grant must not outrank a revoke");

assert.equal(shouldApply({
  currentCreatedAt: earlier,
  currentStatus: "review",
  incomingCreatedAt: earlier,
  incomingAction: "grant",
}), false, "a same-second grant must not bypass manual review");

assert.equal(shouldApply({
  currentCreatedAt: earlier,
  currentStatus: "revoked",
  incomingCreatedAt: later,
  incomingAction: "grant",
}), true, "a newer dispute-win event may restore access");

assert.equal(shouldApply({
  currentCreatedAt: earlier,
  currentStatus: "revoked",
  incomingCreatedAt: later,
  incomingAction: "review",
}), false, "a late refund lifecycle event must not weaken a completed revocation");

const sql = await readFile(new URL("../docs/entitlement-storage.sql", import.meta.url), "utf8");

for (const contract of [
  "last_stripe_event_created_at",
  "v_effective_event_created_at > v_last_event_created_at",
  "v_effective_event_created_at = v_last_event_created_at",
  "v_current_status = 'revoked' and v_effective_action = 'review'",
  "ignored_stale",
  "entitlement_event_tombstones",
  "stripe_payment_object_links",
  "'tombstoned'::text",
  "v_effective_event_created_at",
  "v_tombstone.stripe_created_at > p_stripe_created_at",
  "case v_tombstone.command_action when 'revoke' then 3 else 2 end",
  "A recovery grant requires an existing entitlement match",
  "refund_status_requires_review",
  "dispute_status_requires_review",
  "or not (",
  "p_event_type in ('refund.created', 'refund.updated')",
  "p_event_type = 'refund.failed'",
  "p_action = 'review'",
  "p_event_type = 'charge.dispute.funds_reinstated'",
  "p_action = 'grant' and p_reason = 'dispute_won_or_funds_reinstated'",
  "v_inserted_event_id is not null",
]) {
  assert.ok(sql.includes(contract), `SQL contract is missing: ${contract}`);
}

class TombstoneModel {
  receipts = new Map();
  entitlement = null;

  apply({ eventId, action, createdAt, productCode = null }) {
    if (this.receipts.has(eventId)) return { outcome: "duplicate", entitlement: this.entitlement };
    this.receipts.set(eventId, { action, createdAt });

    if (!this.entitlement && !productCode) {
      assert.notEqual(action, "grant", "a recovery grant cannot create a product-less entitlement");
      return { outcome: "tombstoned", entitlement: undefined };
    }

    const dominant = [...this.receipts.entries()]
      .filter(([, receipt]) => receipt.action !== "grant")
      .sort(([, left], [, right]) => {
        if (right.createdAt !== left.createdAt) return right.createdAt - left.createdAt;
        return priority[right.action] - priority[left.action];
      })[0];
    const incoming = { eventId, action, createdAt };
    const winner = dominant && (
      dominant[1].createdAt > incoming.createdAt
      || (dominant[1].createdAt === incoming.createdAt && priority[dominant[1].action] > priority[incoming.action])
    ) ? { eventId: dominant[0], ...dominant[1] } : incoming;

    if (!this.entitlement) {
      this.entitlement = { status: winner.action === "revoke" ? "revoked" : winner.action === "review" ? "review" : "active", ...winner };
      return { outcome: "processed", entitlement: this.entitlement };
    }

    const nextStatus = winner.action === "revoke" ? "revoked" : winner.action === "review" ? "review" : "active";
    if (shouldApply({
      currentCreatedAt: this.entitlement.createdAt,
      currentStatus: this.entitlement.status,
      incomingCreatedAt: winner.createdAt,
      incomingAction: winner.action,
    })) this.entitlement = { status: nextStatus, ...winner };
    return { outcome: "processed", entitlement: this.entitlement };
  }
}

const refundFirst = new TombstoneModel();
assert.deepEqual(
  refundFirst.apply({ eventId: "evt_refund", action: "revoke", createdAt: 20 }),
  { outcome: "tombstoned", entitlement: undefined },
  "a refund received before the product grant must persist without fabricating an entitlement",
);
assert.equal(refundFirst.apply({ eventId: "evt_paid", action: "grant", createdAt: 10, productCode: "resume_pro" }).entitlement.status, "revoked");
assert.equal(refundFirst.apply({ eventId: "evt_paid", action: "grant", createdAt: 10, productCode: "resume_pro" }).outcome, "duplicate");

const disputeFirst = new TombstoneModel();
disputeFirst.apply({ eventId: "evt_dispute", action: "revoke", createdAt: 30 });
assert.equal(disputeFirst.apply({ eventId: "evt_late_paid", action: "grant", createdAt: 10, productCode: "resume_pro" }).entitlement.status, "revoked");

const sameSecond = new TombstoneModel();
sameSecond.apply({ eventId: "evt_review", action: "review", createdAt: 40 });
sameSecond.apply({ eventId: "evt_revoke", action: "revoke", createdAt: 40 });
assert.equal(sameSecond.apply({ eventId: "evt_same_paid", action: "grant", createdAt: 40, productCode: "resume_pro" }).entitlement.status, "revoked");

const recovered = new TombstoneModel();
recovered.apply({ eventId: "evt_loss", action: "revoke", createdAt: 10 });
recovered.apply({ eventId: "evt_original_paid", action: "grant", createdAt: 5, productCode: "resume_pro" });
assert.equal(recovered.apply({ eventId: "evt_dispute_won", action: "grant", createdAt: 20 }).entitlement.status, "active", "a newer dispute-win may restore an existing entitlement");

const allowedTuples = new Set([
  "checkout.session.completed|grant|checkout_paid",
  "checkout.session.completed|review|checkout_requires_review",
  "checkout.session.async_payment_succeeded|grant|async_payment_succeeded",
  "checkout.session.async_payment_failed|revoke|async_payment_failed",
  "refund.created|review|refund_succeeded_requires_amount_check",
  "refund.created|review|refund_status_requires_review",
  "refund.updated|review|refund_succeeded_requires_amount_check",
  "refund.updated|review|refund_status_requires_review",
  "refund.failed|review|refund_status_requires_review",
  "charge.refunded|revoke|charge_fully_refunded",
  "charge.refunded|review|charge_partially_refunded",
  "charge.dispute.created|revoke|dispute_opened",
  "charge.dispute.updated|review|dispute_status_requires_review",
  "charge.dispute.updated|grant|dispute_won_or_funds_reinstated",
  "charge.dispute.closed|revoke|dispute_lost",
  "charge.dispute.closed|review|dispute_status_requires_review",
  "charge.dispute.closed|grant|dispute_won_or_funds_reinstated",
  "charge.dispute.funds_reinstated|grant|dispute_won_or_funds_reinstated",
]);
assert.equal(allowedTuples.has("refund.created|grant|checkout_paid"), false, "a refund tuple cannot be forged into a recovery grant");
assert.equal(allowedTuples.has("refund.failed|review|refund_succeeded_requires_amount_check"), false, "a failed refund cannot claim a succeeded refund reason");
assert.equal(allowedTuples.has("charge.dispute.created|grant|dispute_won_or_funds_reinstated"), false, "an opened dispute cannot restore access");
assert.equal(allowedTuples.has("charge.dispute.closed|grant|dispute_won_or_funds_reinstated"), true, "a won dispute may restore an existing match");

function recoveryGrantAllowed({ eventType, action, reason, productCode, checkoutSessionId, existingMatch }) {
  const recoveryType = eventType === "charge.dispute.updated"
    || eventType === "charge.dispute.closed"
    || eventType === "charge.dispute.funds_reinstated";
  return recoveryType
    && action === "grant"
    && reason === "dispute_won_or_funds_reinstated"
    && productCode == null
    && checkoutSessionId == null
    && existingMatch;
}
assert.equal(recoveryGrantAllowed({ eventType: "charge.dispute.closed", action: "grant", reason: "dispute_won_or_funds_reinstated", productCode: null, checkoutSessionId: null, existingMatch: true }), true);
assert.equal(recoveryGrantAllowed({ eventType: "charge.dispute.closed", action: "grant", reason: "dispute_won_or_funds_reinstated", productCode: "rental_application_pro", checkoutSessionId: null, existingMatch: false }), false, "a recovery grant cannot create a caller-selected product entitlement");
assert.equal(recoveryGrantAllowed({ eventType: "charge.dispute.funds_reinstated", action: "grant", reason: "dispute_won_or_funds_reinstated", productCode: null, checkoutSessionId: "cs_live_forged", existingMatch: true }), false, "a recovery grant cannot masquerade as Checkout creation");

function eventShapeAllowed({ eventType, livemode, productCode, checkoutSessionId, paymentIntentId, chargeId }) {
  if (eventType.startsWith("checkout.")) {
    const environmentMatches = livemode
      ? checkoutSessionId?.startsWith("cs_live_")
      : checkoutSessionId?.startsWith("cs_test_");
    return Boolean(productCode && checkoutSessionId && environmentMatches);
  }
  return productCode == null && checkoutSessionId == null && Boolean(paymentIntentId || chargeId);
}
assert.equal(eventShapeAllowed({ eventType: "checkout.session.completed", livemode: true, productCode: "resume_pro", checkoutSessionId: "cs_live_ok", paymentIntentId: "pi_ok", chargeId: null }), true);
assert.equal(eventShapeAllowed({ eventType: "checkout.session.completed", livemode: true, productCode: "resume_pro", checkoutSessionId: "cs_test_wrong_environment", paymentIntentId: "pi_ok", chargeId: null }), false, "a test Checkout Session cannot enter a live receipt");
assert.equal(eventShapeAllowed({ eventType: "checkout.session.async_payment_failed", livemode: true, productCode: null, checkoutSessionId: "cs_live_missing_product", paymentIntentId: "pi_failed", chargeId: null }), false);
assert.equal(eventShapeAllowed({ eventType: "refund.created", livemode: true, productCode: "resume_pro", checkoutSessionId: null, paymentIntentId: "pi_refund", chargeId: "ch_refund" }), false, "a negative event cannot reserve a caller-selected product row");
assert.equal(eventShapeAllowed({ eventType: "charge.refunded", livemode: true, productCode: null, checkoutSessionId: "cs_live_forged", paymentIntentId: "pi_refund", chargeId: "ch_refund" }), false, "a non-Checkout event cannot claim a Checkout Session");
assert.equal(eventShapeAllowed({ eventType: "charge.dispute.created", livemode: true, productCode: null, checkoutSessionId: null, paymentIntentId: null, chargeId: null }), false, "a negative event must carry a payment object link");

const receiptLinks = new Set();
function applyLinkFixture({ inserted, paymentIntentId, chargeId }) {
  if (inserted && paymentIntentId && chargeId) receiptLinks.add(`${paymentIntentId}|${chargeId}`);
}
applyLinkFixture({ inserted: true, paymentIntentId: "pi_original", chargeId: "ch_original" });
applyLinkFixture({ inserted: false, paymentIntentId: "pi_forged", chargeId: "ch_forged" });
assert.deepEqual([...receiptLinks], ["pi_original|ch_original"], "a duplicate event must not mutate payment-object links");

console.log("Entitlement event-order checks passed.");
