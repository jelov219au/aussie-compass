# Production first-sale readiness audit — 24 August 2026

This is a non-secret, read-only point-in-time audit. It does not authorize a
payment, customer contact, database mutation, Stripe mutation, environment
change, refund or sale-gate reopen. No environment value, customer field,
credential, full Stripe identifier or database connection string is recorded.

## Decision

**NO-GO for the first customer payment.** The database catalog and effective
privileges are ready, the live Stripe account can charge and pay out, and live
Resume Pro has no existing open Checkout Session. Launch still requires the
remaining owner-controlled items below, especially Stripe's missing public
support email, a proven live restricted runtime key, and a controlled
post-migration alert/access rehearsal.

## Read-only evidence

- Vercel lists the required Production payment, Stripe, Neon, seller, support
  and SMTP variable names. Values were not opened. Public Checkout still
  returns HTTP 503 `checkout_unavailable`, so no card data is accepted.
- Neon Primary / `neondb` ran the exact catalog and effective-privilege query
  from `docs/first-sale-gate-runbook.md`. It returned one row and every named
  boolean below was `true`, including `all_privilege_checks_pass`.
- `first_sale_gates`, `first_sale_gate_events`,
  `payment_operator_alert_outbox`, `purchase_access_sessions` and
  `purchase_restore_activations` each contained zero rows. This is a clean
  pre-customer state, but it is not functional proof of reservation, alert,
  activation, release or restore behavior in Production.
- Stripe live account read: charges enabled, payouts enabled, details
  submitted, zero currently due, zero past due, zero pending verification and
  no disabled reason. Business name, website, support phone and statement
  descriptor are present. The business-profile support email is absent.
- Stripe live Checkout Sessions read with `status=open`, `limit=100`: zero
  total, zero Resume Pro and `has_more=false`.

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

1. Add `support@hojucompass.com` as the Stripe live business-profile support
   email through an authenticated Dashboard session, then re-read the account
   and confirm it is present. Do not add a different address by assumption.
2. Prove the Production runtime uses an `rk_live_` key with only Prices Read,
   Products Read, Checkout Sessions create/retrieve and PaymentIntents Read.
   Run the target-environment strict remote product audit without printing the
   key, IDs or product values.
3. With payments still off, run one approved controlled post-migration
   rehearsal that proves reservation, attached Checkout expiry handling,
   payment/refund alert outbox delivery, activation same-nonce response-loss,
   different-nonce denial, permanent device release and one-time restore.
4. Record suffix-only and count-only evidence for the resulting gate, outbox,
   entitlement and access-session rows. Zero current rows cannot prove these
   paths.
5. Confirm the actual Managed Payments Checkout and issued receipt/invoice
   wording for transaction seller, document issuer and transaction support.
6. Complete ABN/GST and bookkeeping treatment review with the registered tax
   agent and preserve it outside the repository.

After these pass, the owner may approve a single opt-in first-customer notice
under `docs/live-payment-launch-checklist.md`. Keep `PAYMENTS_ENABLED=false`
until that approval; never send a raw Stripe Checkout URL by email.
