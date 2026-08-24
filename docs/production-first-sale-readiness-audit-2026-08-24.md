# Production first-sale readiness audit — 24 August 2026

This is a non-secret, read-only point-in-time audit. It does not authorize a
payment, customer contact, database mutation, Stripe mutation, environment
change, refund or sale-gate reopen. No environment value, customer field,
credential, full Stripe identifier or database connection string is recorded.

## Decision

**NO-GO for the first customer payment.** The application runtime and separate
audit-login privilege matrices are ready, the live Stripe account can charge
and pay out, and live Resume Pro has no existing open Checkout Session. The
Production entitlement-link forward fix is now applied and its postflight and
complete effective-privilege matrix pass. Stripe's public support email is now
present. Launch still requires a proven live restricted runtime key, a separate
Account-Read-only operator audit key, the missing strict-audit Neon endpoint
pin, real SMTP transport proof and a controlled Production functional
rehearsal. The target-environment strict audit has not been rerun after the
migration, so the first customer remains **NO-GO**.

## Read-only evidence

- Vercel lists the required Production payment, Stripe, Neon, seller, support
  and SMTP variable names. Values were not opened. Public Checkout still
  returns HTTP 503 `checkout_unavailable`, so no card data is accepted.
- A fresh Vercel project environment-variable name search on 24 August found no
  `PAYMENTS_EXPECTED_NEON_ENDPOINT_ID` result. Existing variable values and
  scopes were not opened. The approved non-secret endpoint ID remains recorded
  only in the forward-fix ticket, so the target-environment strict audit cannot
  yet prove both database connections resolve to that endpoint.
- Neon Primary / `neondb` ran the exact catalog and effective-privilege query
  from `docs/first-sale-gate-runbook.md`. It returned one row and every named
  boolean below was `true`, including `all_privilege_checks_pass`.
- The initial Neon Primary role inventory contained only
  `hoju_migration_owner`, `hoju_owner_operator`, `hoju_app_runtime` and
  `neondb_owner`. After explicit owner approval, the `hoju_payment_auditor`
  login was created through SQL rather than Console/CLI/API and received the
  grants in `docs/payment-audit-role-grants.sql`. No payment row, sale-gate
  state or application environment was changed.
- A real connection as `hoju_payment_auditor` returned true for `neondb`, the
  exact current user, safe role attributes, no `neon_superuser` or payment-role
  membership, migration-ledger/gate read access, no public-schema CREATE, no
  mutation privilege across all 11 protected tables, no EXECUTE across all 25
  payment functions and no reservation in flight. It returned
  `required_migrations_present=false`, preserving the forward-fix launch HOLD.
  The one-time password was not printed, committed or persisted in an app
  environment.
- `first_sale_gates`, `first_sale_gate_events`,
  `payment_operator_alert_outbox`, `purchase_access_sessions` and
  `purchase_restore_activations` each contained zero rows. This is a clean
  pre-customer state, but it is not functional proof of reservation, alert,
  activation, release or restore behavior in Production.
- Stripe live account read: charges enabled, payouts enabled, details
  submitted, zero currently due, zero past due, zero pending verification and
  no disabled reason. Business name, website, support phone and statement
  descriptor are present. The business-profile support email is now present;
  its authenticated Dashboard save and visible Public details row were
  verified on 24 August 2026 without changing another public business field.
- Stripe live Checkout Sessions read with `status=open`, `limit=100`: zero
  total, zero Resume Pro and `has_more=false`.
- Neon Vercel Preview database `first_sale_rehearsal_20260824_v2` passed the
  complete catalog/effective-privilege matrix and the isolated first-sale
  rehearsal: 34 passing checks, zero failures, final gate state `LOCKED`, two
  webhook receipts, one entitlement, three access sessions, two restore
  activations and two sent alert intents. This did not touch Production, Stripe
  or SMTP.
- The new Production read-only forward-fix audit ran on Neon Primary / `neondb`
  at `2026-08-23 15:47:36.249941+00`. It confirmed the expected owner and
  least-privilege prerequisite, no `RESERVED` gate, the old ambiguous clause,
  no forward-fix version and `preflight_can_apply_once=true`. Baseline counts
  were gate 0, gate events 0, webhook receipts 23, entitlements 7, alerts 0,
  access sessions 0 and restore activations 0. No mutation was executed.
- After explicit owner approval, only
  `docs/migrations/20260824_entitlement_link_conflict_v1.sql` was applied on
  Neon Primary / `neondb`. The migration completed through `COMMIT`. The
  read-only postflight at `2026-08-23 23:35:11.614767+00` returned
  `postflight_pass=true`, `preflight_can_apply_once=false`, the migration
  version and named constraint present, the ambiguous target absent, no
  reservation in flight and unchanged counts: gate 0, gate events 0, webhook
  receipts 23, entitlements 7, alerts 0, access sessions 0 and restore
  activations 0. The complete named effective-privilege matrix was rerun and
  every boolean, including `all_privilege_checks_pass`, returned true.
- Production functional rehearsal is still missing. The migration postflight
  proves schema shape and privileges, not reservation, paid-event, alert,
  activation, release or restore behavior under the live runtime connection.
- Real SMTP transport proof is still missing. Neither configuration presence
  nor the isolated database outbox rehearsal proves that the monitored mailbox
  receives a Production payment/refund alert.

## Complete Neon named-result matrix

| Result | Evidence |
| --- | --- |
| `old_9_arg_paid_event_removed` | PASS |
| `old_11_arg_paid_event_removed` | PASS |
| `charge_aware_12_arg_paid_event_present` | PASS |
| `old_2_arg_activation_removed` | PASS |
| `old_3_arg_activation_removed` | PASS |
| `old_4_arg_activation_removed` | PASS |
| `session_7_arg_activation_present` | PASS |
| `old_2_arg_restore_consume_removed` | PASS |
| `old_5_arg_restore_consume_removed` | PASS |
| `nonce_6_arg_restore_consume_present` | PASS |
| `charge_link_v2_present` | PASS |
| `alert_outbox_v1_present` | PASS |
| `activation_nonce_v1_present` | PASS |
| `access_sessions_v1_present` | PASS |
| `restore_activation_nonce_v1_present` | PASS |
| `runtime_can_claim_reservation` | PASS |
| `runtime_can_attach_checkout` | PASS |
| `runtime_can_release_failed_reservation` | PASS |
| `runtime_can_release_verified_abandoned_reservation` | PASS |
| `runtime_can_apply_charge_aware_paid_event` | PASS |
| `runtime_can_apply_guarded_entitlement_event` | PASS |
| `runtime_can_consume_restore_token` | PASS |
| `runtime_can_create_restore_token` | PASS |
| `runtime_can_enqueue_failure_alert` | PASS |
| `failure_alert_enqueue_returns_boolean` | PASS |
| `runtime_can_claim_alert` | PASS |
| `runtime_can_mark_alert_sent` | PASS |
| `runtime_can_release_alert_claim` | PASS |
| `runtime_can_consume_activation` | PASS |
| `runtime_can_release_access_session` | PASS |
| `runtime_can_validate_access_session` | PASS |
| `runtime_can_read_active_by_checkout` | PASS |
| `runtime_can_read_active_by_id` | PASS |
| `operator_can_approve_next_sale` | PASS |
| `runtime_cannot_approve_next_sale` | PASS |
| `operator_cannot_execute_runtime_wrappers` | PASS |
| `private_helpers_present` | PASS |
| `runtime_cannot_execute_private_helpers` | PASS |
| `operator_cannot_execute_private_helpers` | PASS |
| `runtime_cannot_execute_internal_alert_enqueue` | PASS |
| `operator_cannot_execute_internal_alert_enqueue` | PASS |
| `runtime_cannot_execute_alert_receipt_trigger` | PASS |
| `operator_cannot_execute_alert_receipt_trigger` | PASS |
| `public_cannot_execute_protected_functions` | PASS |
| `protected_tables_present` | PASS |
| `runtime_has_no_protected_table_privileges` | PASS |
| `operator_has_no_protected_table_privileges` | PASS |
| `public_has_no_protected_table_privileges` | PASS |
| `runtime_cannot_create_in_public_schema` | PASS |
| `operator_cannot_create_in_public_schema` | PASS |
| `public_cannot_create_in_public_schema` | PASS |
| `operator_does_not_inherit_runtime_role` | PASS |
| `runtime_does_not_inherit_operator_role` | PASS |
| `all_privilege_checks_pass` | PASS |

## Remaining pre-customer blockers

1. Prove the Production runtime uses an `rk_live_` key with only Prices Read,
   Products Read, Checkout Sessions create/retrieve and PaymentIntents Read.
   Create a different one-off `rk_live_` operator-audit key with Account Read
   only for Account/support-profile evidence; never grant Account Read to the
   runtime key or deploy the audit key. Run the target-environment strict remote
   audit without printing either key, IDs or product values.
2. Inject the approved non-secret endpoint ID as
   `PAYMENTS_EXPECTED_NEON_ENDPOINT_ID` only for the strict operator audit and
   prove both the runtime and `hoju_payment_auditor` connections resolve to it.
   Do not persist the audit DB credential in Preview or application runtime.
3. Run the protected no-send SMTP authentication check, then the separately
   approved labelled test-message path, and confirm receipt in the monitored
   mailbox. Keep credentials out of shell history, chat and logs.
4. With payments still off, run one approved controlled Production
   post-migration rehearsal that proves reservation, attached Checkout expiry
   handling, payment/refund alert outbox delivery, activation same-nonce
   response-loss, different-nonce denial, permanent device release and one-time
   restore. The Preview rehearsal is supporting evidence, not a substitute.
5. Record suffix-only and count-only Production evidence for the resulting
   gate, outbox, entitlement and access-session rows. Zero current Production
   rows cannot prove these paths.
6. Confirm the actual Managed Payments Checkout and every receipt/invoice
   actually issued for transaction seller, document issuer and transaction
   support using `docs/managed-payments-customer-document-evidence.md`; keep the
   completed evidence private and do not infer an unissued invoice.
7. Complete ABN/GST and bookkeeping treatment review with the registered tax
   agent and preserve it outside the repository.
8. Run the protected live accounting preflight with its dedicated restricted
   key and retain only the PASS result outside the repository.

After these pass, the owner may approve a single opt-in first-customer notice
under `docs/live-payment-launch-checklist.md`. Keep `PAYMENTS_ENABLED=false`
until that approval; never send a raw Stripe Checkout URL by email.
