# Resume Pro first-sale gate runbook

This is a deployment HOLD document. It does not authorize a database migration, live Stripe request, Checkout, refund, environment change or sale reopening.

## Purpose and invariant

The gate admits one Resume Pro Checkout at a time. The persisted lifecycle is `OPEN → RESERVED → SOLD → LOCKED`; `SOLD` and `LOCKED` are appended in the same database transaction as the entitlement grant. A refund, dispute, access revocation, data deletion, server restart, deployment or timeout never reopens a locked sale.

The application fails closed when `FIRST_SALE_GATE_ENABLED=true`, the Neon entitlement store or its PostgreSQL URL is absent, or the migration is missing. Production and Preview/Test use separate databases and Stripe modes. Never point a Preview deployment at Production data.

## Migration order (owner approval required)

1. Keep `PAYMENTS_ENABLED=false`.
2. Create and verify a current encrypted PostgreSQL backup using `docs/database-recovery.md`.
3. Apply `docs/entitlement-storage.sql` first. The first-sale transaction calls `apply_entitlement_event`.
4. Apply `docs/first-sale-gate.sql` once. It is idempotent through `schema_migrations.version=20260823_first_sale_gate_v1`, `create table if not exists`, and `create or replace function`.
5. Confirm the migration row, tables, append-only trigger and functions without selecting claim hashes or complete Stripe identifiers.
6. The migration owner must own the `SECURITY DEFINER` functions and must not be the runtime login. Revoke `CREATE ON SCHEMA public` from both `PUBLIC` and the runtime role, then verify it with `has_schema_privilege`. Every protected table/function reference is also `public.`-qualified as defence-in-depth.
7. Revoke runtime `EXECUTE` on the original `apply_entitlement_event` and direct `INSERT/UPDATE/DELETE` on `payment_webhook_events`, `purchase_entitlements`, `purchase_restore_tokens`, `first_sale_gates` and `first_sale_gate_events`. Existing grants from the baseline entitlement rollout must be explicitly removed.
8. Grant the application role only `claim_first_sale_reservation`, `attach_first_sale_checkout`, both verified release functions, `apply_first_sale_paid_event`, `apply_guarded_entitlement_event`, and the two restore-token wrappers. The guarded wrapper rejects a Resume Pro grant outside the atomic first-sale transaction. Do **not** grant it `approve_next_first_sale` or the private lock helper.
9. Grant `approve_next_first_sale` only to a separate owner-controlled operator role after access review. `PUBLIC` is explicitly revoked in the migration.
10. In the matching Stripe mode, prove there are **zero existing open Checkout Sessions** for Resume Pro. Explicitly expire any pre-gate Session and retain its non-sensitive expiry evidence. An old URL must not remain payable when the gate opens.
11. Query effective privileges, not only role DDL: runtime must report false for public-schema CREATE, first-sale table DML, original entitlement function execution and owner reopen execution; it must report true only for the allowlisted wrapper functions. Attach this non-secret PASS/MISSING/FAIL matrix to the release ticket.
12. Set `FIRST_SALE_GATE_ENABLED=true` only after the contract test, role matrix and signed-webhook sandbox scenarios pass. Role placeholders in the SQL file are comments, so live remains **HOLD** until an owner-approved migration ticket replaces them and the effective-privilege query passes. Keep `PAYMENTS_ENABLED=false` until the complete launch checklist passes.

Required non-secret environment contract:

- `FIRST_SALE_GATE_ENABLED=true`
- `PAYMENTS_ENTITLEMENT_STORE=neon`
- one valid `ENTITLEMENT_DB_URL` or managed `ENTITLEMENT_DB_DATABASE_URL`
- the existing Stripe Product, tax, webhook, entitlement-session, seller and support readiness values

## Runtime behavior

- `OPEN`: `claim_first_sale_reservation` takes a transaction advisory lock and row lock. Exactly one caller moves to `RESERVED`.
- `RESERVED`: Checkout creation uses one Stripe idempotency key derived from the claim hash. The raw random value is never stored, logged, returned or added to Stripe metadata.
- Checkout expiry is 31 minutes: Stripe's documented 30-minute minimum plus a 60-second request/clock margin. The database reservation and `expires_at` use the same absolute timestamp; the stored timestamp is replaced by Stripe's returned timestamp after attachment.
- A definitive Stripe authentication, permission or invalid-request rejection may compare-and-set the sessionless reservation back to `OPEN`. Connection/API/rate-limit/unknown results stay `RESERVED` because a remote Session might exist.
- An attached reservation is released only after the server retrieves Stripe's Session and confirms all three conditions: `status=expired`, `payment_status=unpaid`, and no PaymentIntent. Retrieval failure, missing result, pending/complete state, or any PaymentIntent stays closed.
- A signed paid Checkout webhook calls `apply_first_sale_paid_event`. Gate `SOLD → LOCKED`, event receipt, and entitlement grant commit or roll back together.
- Only `RESERVED` plus the exact attached Session is eligible for that transaction. An unreserved, old or mismatched paid Session is a P0: access is not granted, the webhook fails for investigation, and the operator follows the manual refund/support path.
- Only the exact same signed paid event is idempotent. A different event received after `LOCKED`, including another event for the same Session, cannot invoke entitlement processing. Refund and dispute commands update entitlement/accounting state only and cannot call the reopen function.

The public Checkout response contains only the existing Stripe-hosted Checkout URL or an allowlisted Korean error. It never contains a claim token/hash, gate generation, database state, full stored Session ID, or database error. Application logs contain an error category only. Append-only gate audit records retain only the last eight characters of Stripe references.

## Abandoned and failure handling

Do not edit `first_sale_gates` directly.

1. If Stripe definitively rejected Session creation, confirm a `stripe_rejected_before_session` audit transition. If it is absent, leave the gate closed and escalate.
2. If an attached reservation passed its expiry, let the next Checkout attempt perform read-only Stripe verification. Only `expired + unpaid + no PaymentIntent` can create the `verified_expired_unpaid_no_intent` release event.
3. A timed-out reservation with no attached Session ID is an indeterminate outcome, not abandoned. Keep `RESERVED`, preserve provider request evidence privately, and escalate to the owner.
4. If expiry release races a paid webhook, the paid transaction acquires the same product lock and finishes in `LOCKED`. Investigate any newer Session; do not manually reopen.

## Owner-controlled next sale

`approve_next_first_sale` is deliberately unreachable by the web application. It returns false unless all of the following are supplied: a trimmed 4–120 character owner approval reference, evidence status `PASS`, a non-NULL cash difference within ±A$0.01, and payout status `matched`. NULL, blank, `MISSING` and `FAIL` inputs fail closed. The owner must first satisfy the 15-minute, 24-hour and first-payout evidence gates in `docs/first-payment-24-hour-operations-packet.md`.

Approval creates one append-only `LOCKED → OPEN` event. The next request still has to win a fresh single reservation; this never enables unrestricted multi-sale mode. Record only an incident/approval reference, never a customer name, email, card detail, receipt, full Stripe ID, API key or webhook secret.

## Incident stop and rollback

- Set `PAYMENTS_ENABLED=false` with owner approval and redeploy if a P0/P1 is observed. This is defence-in-depth; the database gate remains authoritative.
- Do not drop or truncate gate tables and do not delete audit events during rollback.
- Revert application code only after confirming no `RESERVED` or paid-but-unprocessed event is in flight.
- Never open the gate after a rollback until Stripe again shows zero payable pre-gate Checkout Sessions.
- Restore from backup only under `docs/database-recovery.md`; never test a restore over Production.
- A refund does not constitute rollback of the gate and must not reopen sales.

## Pre-release contract evidence

Run locally without Stripe or DB access:

```text
npm run test:first-sale-gate
npm run test:database-operations
npm run quality:gate
```

Before a live release, separately test signed sandbox events for concurrent requests, duplicate paid webhooks, refund-before-grant retry, late refund, expiry verification failure, verified abandonment, and owner-role denial. Live Stripe/DB execution requires a new explicit approval.
