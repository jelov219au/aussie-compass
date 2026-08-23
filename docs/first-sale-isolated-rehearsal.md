# First-sale isolated database rehearsal

This runbook proves the database boundary without opening Checkout, calling
Stripe, sending email or touching the Production database. It is supporting
evidence only. It does not replace the authenticated Stripe business-profile,
least-privilege live-key, real SMTP delivery, Managed Payments document or tax
agent gates.

## Required isolation

- Use the Neon Vercel Preview branch, never `main`.
- Create and select the empty database `first_sale_rehearsal_20260824_v2`.
  The earlier `first_sale_rehearsal_20260824` database is retained as failed
  rehearsal evidence and must not be cleared or reused.
- Bootstrap `docs/entitlement-storage.sql`, then
  `docs/first-sale-gate.sql`, then the four additive migrations in the
  documented order, followed by
  `docs/migrations/20260823_payment_least_privilege_roles_v1.sql`, then
  `docs/migrations/20260824_entitlement_link_conflict_v1.sql`.
- Run the complete catalog/effective-privilege matrix from
  `docs/first-sale-gate-runbook.md`. Every named boolean, including
  `all_privilege_checks_pass`, must be true.
- Run `scripts/first-sale-isolated-rehearsal.sql` once. Its database-name and
  empty-table guards deliberately prevent Production use and evidence reset.

The script uses fixed synthetic `cs_test_`, `evt_`, `pi_`, `ch_` and `cus_`
references. It records only fixed check names and outcomes. Do not replace them
with a live or customer identifier.

## Acceptance boundary

The database rehearsal must show zero failed checks and prove:

- one reservation winner, a blocked second claimant and verified expiry release;
- paid-event gate lock and exact-event idempotency;
- same-nonce activation/restore retries, different-nonce denial and permanent
  per-device release;
- a second restore device remains active until the synthetic refund revokes the
  entitlement;
- payment/refund alert claim, busy-worker response, release/reclaim, sent
  idempotency and stale-lease recovery;
- suffix/count/time-only evidence for access sessions and outbox rows.

## Evidence recorded — 24 August 2026

- Neon Vercel Preview branch `br-proud-pond-a7vaygn4`; database
  `first_sale_rehearsal_20260824_v2`.
- The complete catalog/effective-privilege matrix returned one row; every named
  boolean, including `all_privilege_checks_pass`, was true.
- Rehearsal results: 34 passed checks, 0 failed checks. Final gate state:
  `LOCKED`.
- Stored row counts: 7 gate events, 2 webhook receipts, 1 entitlement, 3
  access sessions, 2 restore activations and 2 alert intents. Both alert
  intents reached `sent`.
- Access evidence exposed suffixes and timestamps only:
  - Checkout suffix `00000002`, activation session `ACTR0001`, created
    `2026-08-23 15:35:21.892371+00`, expires
    `2026-09-21 15:35:23.437521+00`, released in the rehearsal transaction.
  - Checkout suffix `00000002`, restore session `RSTR0001`, created
    `2026-08-23 15:35:21.892371+00`, expires
    `2026-09-21 15:35:23.815602+00`, released in the rehearsal transaction.
  - Checkout suffix `00000002`, second restore session `RSTR0002`, created
    `2026-08-23 15:35:21.892371+00`, expires
    `2026-09-21 15:35:24.175796+00`; the synthetic refund revoked its parent
    entitlement, so active lookup was denied without deleting the session row.
- The earlier database is preserved with 32 passing and 2 failing checks. It
  exposed a transaction-clock mismatch in the stale-lease test fixture; the
  application claim wrapper correctly returned `busy`. No evidence was erased.

No real Stripe request, SMTP delivery or Production database mutation was part
of this evidence.

Production remains **NO-GO** after this rehearsal. Real SMTP failure-to-503 and
mailbox receipt, Stripe Checkout expiry verification, Managed Payments seller
and receipt wording, Stripe support email, live restricted-key permissions and
registered tax-agent review still require their own evidence.
