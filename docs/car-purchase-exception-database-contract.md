# Car purchase exception persistence: proposed v1 contract

Status: LOCAL PREPARATION. The function below is **not implemented or deployed**.
The query adapter is isolated from production and accepts only reviewed result
evidence. Mock query tests do not prove SQL atomicity, constraints or concurrency.

## Function boundary

Proposed signature:

```text
public.apply_car_purchase_exception_event_v1(
  text,text,boolean,timestamptz,text,text,text,text,text,text,text,text,text
)
```

| Position | Parameter | Contract |
| --- | --- | --- |
| 1 | event_id | Full verified Stripe event ID |
| 2 | event_type | Unpaid completed, async failure, or supported dispute event |
| 3 | livemode | Strict boolean matching approved runtime/gate environment |
| 4 | stripe_created_at | Event timestamp for audit; never the sole ordering rule |
| 5 | product_code | Exactly car_purchase_pro |
| 6 | checkout_session_id | Exact server-verified original checkout, mode-specific prefix |
| 7 | payment_intent_id | Exact original PaymentIntent |
| 8 | charge_id | SQL NULL for checkout exceptions, exact charge for disputes |
| 9 | customer_id | Exact server-verified customer |
| 10 | action | pending, revoke or review; no grant/reopen |
| 11 | reason | Validated event/action reason from fulfillment contract |
| 12 | reference_id | Checkout ID for checkout exceptions; dispute ID otherwise |
| 13 | current_status | Freshly retrieved PI/dispute status, not payment proof |

The adapter binds 13 values in this order to fixed SQL. It never opens a connection,
interpolates identifiers, converts NULL to an empty string, or calls an existing
generic event function with an unsupported action. Function creation must repeat
the adapter's input checks; TypeScript validation is not a database access control.
The approved offer is a prerequisite; the fixture amount 1234 is not a price.

Return exactly one row:

| Field | Required evidence |
| --- | --- |
| outcome | processed/duplicate; tombstoned only for restrictive commands without an entitlement |
| event_id, event_type, livemode | Exact input identity, including on duplicate |
| product_code, checkout_session_id, payment_intent_id, charge_id, customer_id, reference_id | Exact verified relationship; null charge retained for checkout events |
| alert_kind | fulfillment_attention for pending/failure; dispute_event for disputes |
| alert_durable | true only after matching pending or sent outbox intent exists |
| sale_hold_durable | true only while the gate and its release/claim paths preserve the hold |
| gate_state | Actual OPEN/RESERVED/LOCKED; an OPEN gate succeeds only when the new hold is enforced by every claim/release/reopen path |
| restriction_durable | Boolean; true required for revoke/review and existing restricted status |
| entitlement_status | null/active/review/revoked; active forbidden with a restriction; revoke cannot return review |

pending preserves the existing entitlement, including an active one. It must not
create a restrictive tombstone or erase an earlier restriction. Restrictive
processed results must return review/revoked. A restrictive duplicate can return
null only with a durable restriction. tombstoned always returns null. Duplicate
processing may observe a stronger current restriction, but must verify immutable
receipt ownership instead of trusting a reused ID or eight-character suffix.

## Local source findings that affect the migration

- `paymentAlertOutbox.ts` classifies any completed event as payment_completed.
  Its product type omits car_purchase_pro. The SQL receipt trigger is more precise:
  it emits payment_completed only for a grant. Do not send a pending event through
  the generic JS classifier or fabricate a grant receipt to get an alert.
- Existing outbox event/kind checks omit async failure and funds_withdrawn.
  fulfillment_attention must be extended for async failure, dispute_event for
  funds_withdrawn, and the product check for this product. Existing five-product
  intent/transport types and claim/mark/release validation must be reconciled.
- `payment_webhook_events.command_action` supports grant/revoke/review, not pending.
  Use a reviewed exception-receipt representation (proposed separate
  `car_purchase_exception_receipts`) so pending does not become a fake review or
  paid receipt. Preserve audit linkage and prevent duplicate routing to generic fulfillment.
- `claim_first_sale_reservation` returns verify_expiry for an expired attached
  reservation; it does **not** reopen it merely because the TTL elapsed. The
  current car checkout adapter returns support_required rather than releasing it.
  `release_verified_abandoned_first_sale` is a separate reopening SQL boundary.
  Preserve that existing defense and add a durable pending/restriction check there
  and in owner reconciliation before allowing an old pending checkout to be reused.
- The general entitlement SQL deliberately allows a newer grant to supersede a
  restriction and uses event timestamps. That is incompatible with the car policy
  of no automatic restoration after a dispute/reversal. Adding a car exception
  function without updating the car paid path would leave this gap open.
- Existing paid processing locks the product gate before acquiring payment-object
  locks. The new transaction must use the same order and **same** advisory keys:
  `first-sale:<product>`, then the existing lexically sorted payment-intent/charge
  keys. Inventing an isolated lock namespace would not serialize with old calls.
  Rows still require explicit product/environment/checkout relationship checks.

## Required transaction behavior

1. Verify approved schema/offer/environment and all exact reference relationships.
   Acquire the shared product gate and payment-object locks before state changes.
   Missing or conflicting gate identity is an error, never an invented sold row.
   A late exception after an owner-approved OPEN can be stored only after the
   companion gate functions atomically consult the same hold.
2. Verify or insert an immutable exception receipt scoped to the environment.
   Proposed `car_purchase_payment_holds` binds checkout/PI/customer and optional
   charge. Persist pending observation or a monotonic review/revoke restriction.
   Stronger restrictions survive duplicate, older, later paid and won events.
3. Apply the entitlement restriction where a matching entitlement exists; otherwise
   retain a durable restriction for the later paid transaction to observe.
   Existing refund/reversal and paid paths must consult the same restriction.
4. Insert or verify the matching outbox intent in this same transaction. Use the
   existing outbox machinery with reviewed kind/type/product changes, not a second
   mail queue. No email or other network operation occurs inside the transaction.
5. Return evidence only after all writes/verification succeed. Any error rolls
   back the receipt, hold, entitlement and outbox work together. Duplicate receipt
   handling repairs a missing compatible intent or fails; it never returns success
   merely because the event ID was seen. No timestamp-only ignored_stale success.

Lease/retry/sent marking and the operator message renderer remain separate future
work. Won/funds_reinstated should say “review required”; unpaid completed should say
“payment pending”, never “purchase completed”. Sending is not authorized here.

## Forward migration inputs and acceptance gates

The current function hashes, constraints, ACLs and approved offer are UNKNOWN.
Prepare the SQL from the approved read-only preflight result; do not replay the
historical baseline scripts or use text search for a product name as readiness.

- Inventory exact function signatures/body hashes/owner/ACL/search_path for
  apply_entitlement_event, apply_guarded_entitlement_event,
  apply_first_sale_paid_event, lock_first_sale_from_paid_event, claim/attach/release
  and owner reopening, plus receipt-trigger and record/enqueue/claim/mark/release
  alert functions. Capture trigger definitions and relevant constraints.
- Preserve old products and historical car_buy_pro records. Add only the new
  product and reviewed exception/hold objects; no arbitrary price or OPEN gate.
- Create the new function as volatile, parallel unsafe, called on null input
  (charge NULL is meaningful), with trusted qualified object references. Use the
  verified migration owner and a safe fixed search_path. Revoke PUBLIC EXECUTE in
  the creation transaction; grant only the reviewed runtime function rights. No
  runtime table mutation rights or owner-reopen privilege expansion.
- Guard before/after body hashes and exact existing ACLs; fail on unexpected state.
  Apply only in an approved window with no active reservation and the app closed.
- Required DB cases: pending→paid and paid→late pending; failure/dispute before and
  after paid; equal-timestamp and out-of-order events; missing entitlement;
  duplicate with missing or conflicting alert; outbox failure rollback;
  simultaneous paid/reversal/exception/claim; expiry/release with pending hold;
  won after full refund; cross-product/mode/reference collisions; PUBLIC/runtime
  privilege denial. No new grant or gate reopening from an exception.

The query adapter tests are preparation evidence only. The function implementation,
real SQL execution, concurrency, readiness probe and production connection remain
unfinished. Price/remote application/launch stay in the single CAR-PURCHASE-LAUNCH
approval item. Desktop/mobile/PWA share this server contract; visual tests NOT_RUN.

The review draft has three independent application stops: an unconditional opening
exception, a sale-hold integration guard that always returns false, and no runtime
EXECUTE grant or commit. A final migration must be regenerated from verified remote
hashes; removing those stops from the draft is not an approved application process.

PostgreSQL references checked 2026-09-04: [CREATE FUNCTION](https://www.postgresql.org/docs/current/sql-createfunction.html)
explains null-input behavior, function privileges and safe security-definer setup;
[explicit locking](https://www.postgresql.org/docs/current/explicit-locking.html)
documents transaction advisory locks and consistent lock ordering. These general
rules do not confirm the remote database version or its installed function bodies.
