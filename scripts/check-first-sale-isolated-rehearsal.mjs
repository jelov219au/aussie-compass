import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const [script, runbook] = await Promise.all([
  readFile(new URL("./first-sale-isolated-rehearsal.sql", import.meta.url), "utf8"),
  readFile(new URL("../docs/first-sale-isolated-rehearsal.md", import.meta.url), "utf8"),
]);

assert.match(script, /current_database\(\) is distinct from 'first_sale_rehearsal_20260824_v2'/, "rehearsal must refuse every other database");
assert.match(script, /20260824_entitlement_link_conflict_v1/, "rehearsal must require the runtime ambiguity forward fix");
assert.match(script, /Rehearsal database is not empty; do not overwrite evidence/, "rehearsal must preserve existing evidence");
assert.doesNotMatch(script, /cs_live_|evt_live_|pi_live_|ch_live_|cus_live_/i, "rehearsal must never contain live Stripe references");
assert.doesNotMatch(script, /delete from|truncate|drop table|drop database/i, "rehearsal must not erase evidence or databases");
assert.match(script, /begin;[\s\S]*commit;/, "rehearsal mutations must roll back together on failure");
assert.doesNotMatch(script, /pg_sleep/, "rehearsal must use a deterministic isolated clock fixture rather than waiting");

for (const check of [
  "reservation_first_claim", "reservation_second_claim", "verified_expiry_released",
  "paid_event_processed", "paid_event_idempotent", "later_checkout_locked",
  "activation_same_nonce_retry", "activation_different_nonce_denied",
  "activation_release_retry_denied", "restore_same_nonce_retry",
  "restore_different_nonce_denied", "restore_release_retry_denied",
  "second_restore_device_active", "paid_alert_busy_worker",
  "paid_alert_duplicate_is_sent", "refund_blocks_active_access",
  "refund_blocks_restore_retry", "refund_alert_stale_lease_reclaimed",
]) assert.ok(script.includes(`'${check}'`), `missing rehearsal check: ${check}`);

assert.match(script, /set role hoju_app_runtime/, "rehearsal must exercise runtime wrappers under the runtime role");
assert.match(script, /revoke hoju_app_runtime from %I/, "temporary runtime membership must be removed");
assert.match(script, /lease_expires_at=transaction_timestamp\(\)-interval '1 second'/, "stale-lease recovery must expire against the transaction clock used by the claim wrapper");
assert.match(script, /failed_check_count/, "final evidence must surface any failed check");
assert.match(script, /right\(entitlement\.stripe_checkout_session_id,8\)/, "access evidence must expose only the Checkout suffix");
assert.match(script, /join public\.purchase_entitlements entitlement on entitlement\.id=access\.entitlement_id/, "access evidence must join the Checkout reference from its entitlement");
assert.doesNotMatch(script.slice(script.indexOf("-- Non-sensitive evidence only")), /stripe_customer_id|stripe_payment_intent_id|stripe_charge_id|event_key|lease_token_hash|access_session_hash/, "final evidence must not select full identifiers or hashes");

for (const boundary of ["does not replace", "Production remains **NO-GO**", "Real SMTP", "Managed Payments seller", "live restricted-key", "registered tax-agent"])
  assert.ok(runbook.includes(boundary), `runbook is missing boundary: ${boundary}`);

console.log("Isolated first-sale database rehearsal contract passed.");
