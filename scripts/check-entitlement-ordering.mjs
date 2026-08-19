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
  "p_stripe_created_at > v_last_event_created_at",
  "p_stripe_created_at = v_last_event_created_at",
  "v_current_status = 'revoked' and p_action = 'review'",
  "ignored_stale",
]) {
  assert.ok(sql.includes(contract), `SQL contract is missing: ${contract}`);
}

console.log("Entitlement event-order checks passed.");
