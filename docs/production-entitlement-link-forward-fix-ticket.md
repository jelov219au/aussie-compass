# Production entitlement-link forward-fix change ticket

This is a prepared HOLD ticket. It does not authorize a backup, database
mutation, Stripe request, Checkout, environment change or sale-gate reopen.

## Scope

Apply only `docs/migrations/20260824_entitlement_link_conflict_v1.sql` to the
Neon **Primary** branch database `neondb`. The migration replaces the ambiguous
PaymentIntent/Charge `ON CONFLICT` column list inside the existing entitlement
function with the named primary-key constraint. It does not delete or rewrite
payment, entitlement, gate, access-session or alert evidence.

## Owner window record

Do not begin until all fields are recorded outside this repository:

- owner approval reference and approved start/end time;
- current encrypted backup or Neon point-in-time recovery/branch reference;
- operator identity and a second-person branch/database selection check;
- `PAYMENTS_ENABLED=false` Production evidence and public Checkout HTTP 503;
- incident channel and rollback decision owner.

Never paste a database URL, password, API key, customer field or full Stripe
identifier into this ticket or the SQL editor history.

## Preflight — read only

1. In Neon, select the Primary branch and `neondb`; do not infer the branch from
   the database name because Preview branches can also contain a `neondb`.
2. Run `scripts/first-sale-production-forward-fix-audit.sql`.
3. Separately run the strict launch audit with the active Primary compute's
   non-secret `ep-...` ID supplied as `PAYMENTS_EXPECTED_NEON_ENDPOINT_ID`.
   Require the runtime and dedicated audit-role connections to match that same
   endpoint. A matching `neondb` name alone is not branch evidence.
4. Continue only when `preflight_can_apply_once=true`,
   `postflight_pass=false`, `no_reservation_in_flight=true`, the console role is
   `neondb_owner`, and the recorded counts match the release ticket baseline.
5. Stop on a missing row, timeout, endpoint mismatch, unexpected role/database, `RESERVED` gate,
   already-recorded migration, already-qualified function, unknown function
   shape or any count drift. Do not edit rows to make the audit pass.

### Read-only baseline recorded — 24 August 2026

Neon Primary / `neondb` returned one row at
`2026-08-23 15:47:36.249941+00`:

- expected database, console owner and least-privilege prerequisite: `true`;
- forward-fix version recorded: `false`;
- named constraint active: `false`; ambiguous column list active: `true`;
- no reservation in flight: `true`;
- `preflight_can_apply_once=true`; `postflight_pass=false`;
- counts: gate 0, gate events 0, webhook receipts 23, entitlements 7,
  alerts 0, access sessions 0, restore activations 0.

The Neon Console `main` branch compute was rechecked on 24 August 2026. Its
non-secret endpoint ID is `ep-curly-wave-a78bktnq`. Supply that exact value as
`PAYMENTS_EXPECTED_NEON_ENDPOINT_ID` only for the strict audit; this record does
not prove that either injected database URL currently resolves to it.

The same read-only audit was rerun on `main` / `neondb` at
`2026-08-23 19:52:57.002425+00`. It returned the same booleans and counts,
including `preflight_can_apply_once=true`, `postflight_pass=false` and no
reservation in flight. Neon also showed a six-hour history window and one
non-expiring manual snapshot named `main at 2026-08-23 11:41:40 UTC (manual)`.
No restore, preview, snapshot or branch action was taken. This observation does
not replace the owner's explicit change-window and recovery-reference record.

These counts are the immutable comparison baseline for this change window. This
read-only result does not supply the required owner window or backup reference.

## Apply once

1. Reconfirm the backup reference and that public Checkout still returns 503.
2. Run only `docs/migrations/20260824_entitlement_link_conflict_v1.sql`.
3. Require every statement to succeed through the final `COMMIT`, including the
   10-second statement timeout, 2-second lock timeout and short
   `first_sale_gates` write lock. On an error or failed transaction, use
   `ROLLBACK`, keep payments off and preserve the exact SQLSTATE without
   retrying an ad hoc edit.

The migration itself verifies the least-privilege prerequisite, switches to
`hoju_migration_owner`, requires the `neondb_owner` console role and `neondb`
database, refuses an in-flight reservation or unexpected function definition,
performs one exact replacement and records its version in the same transaction.
The gate-table lock prevents a new reservation from racing the check; lock
contention times out and leaves the transaction unapplied.

## Postflight — read only

1. Run `scripts/first-sale-production-forward-fix-audit.sql` again.
2. Require `postflight_pass=true`, `preflight_can_apply_once=false`,
   `forward_fix_recorded=true`, `named_constraint_active=true`,
   `ambiguous_column_list_active=false`, `no_reservation_in_flight=true`, and
   unchanged evidence counts.
3. Run the complete named effective-privilege matrix in
   `docs/first-sale-gate-runbook.md`; every boolean must be true.
4. Record booleans, counts, timestamps, commit and backup references only.

## Stop boundary

Successful postflight does not open sales. Keep `PAYMENTS_ENABLED=false` and
the first customer payment **NO-GO** until the live restricted-key, Stripe
support email, real SMTP delivery, Managed Payments document wording,
registered tax-agent review and approved Production functional rehearsal gates
also pass.
