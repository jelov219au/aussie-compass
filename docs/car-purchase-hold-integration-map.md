# Car hold integration map — review inputs only

No function replacements in this map have been applied. Runtime readiness remains
false. Helper drafts and SQL acceptance fixtures are not parsed or executed.

Local source references (not remote function hashes):

- `docs/migrations/20260830_leaving_australia_first_sale_gate_v1.sql`
  SHA256 `f841b4544d5f664bdf48220352850835f61efec912e7b6be4df25e8f58a134e3`.
- `docs/entitlement-storage.sql`
  SHA256 `71120719c1c4ff3437a1490930257f1e3b5ed9c28a1659853178c137ce759345`.

Exact remote signatures/body hashes/owner/ACL/search_path must be captured using
the existing read-only preflight before generating executable replacements.

| Existing boundary | Required insertion/change | Preserve |
| --- | --- | --- |
| claim_first_sale_reservation | After product advisory lock and gate identity check, before admission/expiry result, return locked/manual_review for a durable car sale hold | Existing non-car price/mode and generation rules; no automatic OPEN insertion for car |
| attach_first_sale_checkout | Verify current generation/token/exact checkout; allow idempotent attach for an already started purchase, never a new checkout across an old hold | Existing reservation identity and bounds; do not strand a valid in-flight create by applying a broad admission block here |
| release_failed_first_sale_reservation | Under product lock, before OPEN update, return false if car sale hold exists | Definite provider-rejection-only caller; no attached checkout release |
| release_verified_abandoned_first_sale | Under product lock, before OPEN update, return false for any car sale hold | Exact generation/checkout and verified provider abandonment; TTL alone is insufficient |
| approve_next_first_sale | After current gate and owner evidence checks, before OPEN update, return false for unresolved car holds | Owner-only EXECUTE and evidence checks. A separate future audited hold-resolution action is required; never clear holds automatically |
| lock_first_sale_from_paid_event | Preserve settlement of the current exact reserved checkout; caller must pass the grant restriction guard before mutation | No fake sale from pending/exception; no loss of generation/event evidence |
| apply_first_sale_paid_event | For car, call assert_car_purchase_grant_allowed_v1 before lock_first_sale_from_paid_event; hold/tombstone restrictions reject late paid grants | Existing atomic gate+entitlement transaction. Pending-only hold permits settlement |
| apply_entitlement_event: grant | For car, invoke the same guard after argument validation but BEFORE the first object lock, including direct internal calls | Other products' existing behavior; no runtime direct grant bypass |
| apply_entitlement_event / apply_guarded_entitlement_event: car reversal | Route verified car reversal through an atomic monotonic restriction+outbox path; no timestamp-only ignored_stale success | Original full reference matching, append-only tombstones, existing product isolation |
| record_payment_operator_alert_intent / receipt trigger | Keep grant-only payment_completed. Preserve explicit fulfillment_attention for pending/failure and dispute_event for dispute variants | Existing outbox, dedupe, lease/sent state; no duplicate queue |
| outbox constraint + claim/mark/release functions + TS types/rendering | Add reviewed car product, async failure and funds_withdrawn combinations; validate exact intent product/type/reference before sending | Runtime least privilege and lease ownership; no actual sending in this preparation |

The sale-hold helper belongs in admission/release/reopen paths. It must not be used
to reject an already paid pending-only purchase: settlement is controlled by the
separate grant restriction helper. Both helpers are internal, with no direct app
EXECUTE grant. Only the final reviewed migration may make integration readiness true.

The exception transaction now permits an old purchase exception after the gate
has moved to OPEN or a different RESERVED/LOCKED checkout, provided the old exact
entitlement exists. It preserves the current gate's checkout/generation and adds
a product hold. Rejecting all mismatched current gates would lose late disputes.
Before-grant exceptions still require the current exact gate checkout.

## Remaining car refund integration

The existing car refund query adapter still calls apply_guarded_entitlement_event
and accepts ignored_stale/duplicate outcomes. Its current checks can accept a
duplicate/stale active row; that is incompatible with the new monotonic car policy.
Do not mark readiness true with this path unchanged. Prepare a dedicated atomic
car reversal function or a reviewed exact branch in the guarded function, plus
matching adapter checks and real transaction cases. Charge-only unknown-product
tombstones must also remain visible to the grant guard before a product is known.

Avoid taking a product lock after an object lock: car-specific known identities
must take the gate lock first; unknown-product charge-only generic reversals may
retain object-only locking and must not acquire a gate lock later. Revalidate the
resolved product/reference after locks and reject any identity change.

## Acceptance fixtures

`docs/drafts/car-purchase-hold-acceptance-v1.sql` targets a future approved isolated
test schema with final integrations installed. It is blocked by an opening stop,
requires an explicit fixture marker and positive synthetic test amount, and rolls
back all fixture changes. It exercises the real SQL paths when eventually run;
its existence is not test evidence. Concurrent interleavings still require a
separate approved two-session test and cannot be proved by this sequential script.

No price, remote schema, runtime, deployment, or publication is approved by these
files. Keep CAR-PURCHASE-LAUNCH as the single decision item.
