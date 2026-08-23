# Resume Pro first-sale gate runbook

This is a deployment HOLD document. It does not authorize a database migration, live Stripe request, Checkout, refund, environment change or sale reopening.

## Purpose and invariant

The gate admits one Resume Pro Checkout at a time. The persisted lifecycle is `OPEN → RESERVED → SOLD → LOCKED`; `SOLD` and `LOCKED` are appended in the same database transaction as the entitlement grant. A refund, dispute, access revocation, data deletion, server restart, deployment or timeout never reopens a locked sale.

The application fails closed when `FIRST_SALE_GATE_ENABLED=true`, the Neon entitlement store or its PostgreSQL URL is absent, or the migration is missing. Production and Preview/Test use separate databases and Stripe modes. Never point a Preview deployment at Production data.

## Migration order (owner approval required)

1. Keep `PAYMENTS_ENABLED=false`.
2. Create and verify a current encrypted PostgreSQL backup using `docs/database-recovery.md`.
3. Confirm the existing entitlement baseline/tombstone schema and `schema_migrations.version=20260823_first_sale_gate_charge_link_v2`. That migration removes both historical 9- and 11-argument paid-event overloads and leaves one 12-argument charge-aware function. If it is absent, stop; do not skip forward or combine files ad hoc.
4. Apply `docs/migrations/20260823_payment_operator_alert_outbox_v1.sql`. Confirm `20260823_payment_operator_alert_outbox_v1`, the non-PII outbox table, receipt trigger and guarded claim/mark/release functions.
5. Apply `docs/migrations/20260823_checkout_activation_nonce_v1.sql`. Confirm `20260823_checkout_activation_nonce_v1`, the nonce-hash/release columns, one four-argument consume function, release function and two limited active-entitlement read wrappers. This is the only approved order: **charge-link v2 → outbox v1 → activation nonce v1**.
6. Apply `docs/migrations/20260823_purchase_access_sessions_v1.sql`. Confirm `20260823_purchase_access_sessions_v1`, one seven-argument activation consume function, the access-session validator/release wrappers and the absence of replaced activation overloads.
7. Apply `docs/migrations/20260823_restore_activation_nonce_v1.sql`. Confirm `20260823_restore_activation_nonce_v1`, one six-argument restore consume function, no two- or five-argument restore overload, and the hashed restore binding table. The complete order is **charge-link v2 → outbox v1 → activation nonce v1 → access sessions v1 → restore activation nonce v1**.
8. The migration owner must own the `SECURITY DEFINER` functions and must not be the runtime login. Revoke `CREATE ON SCHEMA public` from both `PUBLIC` and the runtime role, then verify it with `has_schema_privilege`. Every protected table/function reference is also `public.`-qualified as defence-in-depth.
9. Revoke runtime `EXECUTE` on the original `apply_entitlement_event` and all direct `SELECT/INSERT/UPDATE/DELETE` on `payment_webhook_events`, `purchase_entitlements`, `purchase_restore_tokens`, `purchase_checkout_activations`, `purchase_access_sessions`, `purchase_restore_activations`, `entitlement_event_tombstones`, `stripe_payment_object_links`, `payment_operator_alert_outbox`, `first_sale_gates` and `first_sale_gate_events`. Existing grants from the baseline entitlement rollout must be explicitly removed. Confirm the tombstone trigger rejects update/delete.
10. Grant the application role only the adapter-called wrappers: `claim_first_sale_reservation`, `attach_first_sale_checkout`, both verified reservation release functions, `apply_first_sale_paid_event`, `apply_guarded_entitlement_event`, six-argument restore consume and restore create, seven-argument `consume_checkout_activation`, `release_purchase_access_session`, the access-session validator, both limited active-entitlement read wrappers, and the four external alert-outbox wrappers (`enqueue…`, `claim…`, `mark…`, `release…`). Do not grant the old activation release function, receipt trigger function, internal alert enqueue function, original entitlement function, private lock helper or owner reopen function.
11. Apply `docs/migrations/20260824_entitlement_link_conflict_v1.sql`. It replaces the ambiguous PaymentIntent/Charge `ON CONFLICT` column list with the named primary-key constraint and records `20260824_entitlement_link_conflict_v1`. A paid-event rehearsal that still raises SQLSTATE `42702`, or a missing version row, keeps payments off.
12. Grant `approve_next_first_sale` only to a separate owner-controlled operator role after access review. Do **not** grant it `approve_next_first_sale` through the application runtime role. `PUBLIC` is explicitly revoked in the migration.
13. In the matching Stripe mode, prove there are **zero existing open Checkout Sessions** for Resume Pro. Explicitly expire any pre-gate Session and retain its non-sensitive expiry evidence. An old URL must not remain payable when the gate opens.
14. Query the PostgreSQL catalog and effective privileges, not only role DDL. Both historical `apply_first_sale_paid_event` signatures must resolve to NULL; runtime must report false for public-schema CREATE, protected-table DML, original entitlement function execution and owner reopen execution, and true only for the 12-argument paid-event wrapper and other allowlisted wrappers. Attach this non-secret PASS/MISSING/FAIL matrix to the release ticket.
15. Set `FIRST_SALE_GATE_ENABLED=true` only after the contract test, role matrix and signed-webhook sandbox scenarios pass. Role placeholders in the SQL file are comments, so live remains **HOLD** until an owner-approved migration ticket replaces them and the effective-privilege query passes. Keep `PAYMENTS_ENABLED=false` until the complete launch checklist passes.

### Runtime effective-privilege matrix

Do not reduce this to a count such as “10 checks” or “4 true”; every named result is required.

| Object group | Runtime `EXECUTE` | Direct table `SELECT/INSERT/UPDATE/DELETE` |
| --- | --- | --- |
| reservation claim, attach, failed-release, verified-abandoned-release | `true` for all four | first-sale tables: all `false` |
| 12-argument paid-event and guarded non-Resume-Pro event wrappers | `true` for both | webhook/entitlement/tombstone/link tables: all `false` |
| restore consume-with-nonce-session/create | `true` for both | restore-token, restore-binding and access-session tables: all `false` |
| activation consume, access-session validation/release and limited active lookup by checkout/id | `true` for all five | activation, access-session and entitlement tables: all `false` |
| outbox enqueue-failure, claim, mark-sent, release-claim | `true` for all four | outbox table: all `false` |
| original entitlement function, private gate lock, owner reopen | `false` | n/a |
| receipt trigger function, internal alert-intent writer, append-only guard triggers | `false` | n/a |

`PUBLIC` also has `false` for all listed functions and protected tables. Only the owner-controlled operator role may execute `approve_next_first_sale`; the runtime role must not inherit that operator role. The runtime and `PUBLIC` must both report `false` for `CREATE ON SCHEMA public`.

Required non-secret environment contract:

- `FIRST_SALE_GATE_ENABLED=true`
- `PAYMENTS_ENTITLEMENT_STORE=neon`
- one valid `ENTITLEMENT_DB_URL` or managed `ENTITLEMENT_DB_DATABASE_URL`
- the existing Stripe Product, tax, webhook, entitlement-session, seller and support readiness values
- configured payment operator alerts; Production readiness stays false without them

## Runtime behavior

- `OPEN`: `claim_first_sale_reservation` takes a transaction advisory lock and row lock. Exactly one caller moves to `RESERVED`.
- `RESERVED`: Checkout creation uses one Stripe idempotency key derived from the claim hash. The raw random value is never stored, logged, returned or added to Stripe metadata.
- Checkout expiry is 31 minutes: Stripe's documented 30-minute minimum plus a 60-second request/clock margin. The database reservation and `expires_at` use the same absolute timestamp; the stored timestamp is replaced by Stripe's returned timestamp after attachment.
- A definitive Stripe authentication, permission or invalid-request rejection may compare-and-set the sessionless reservation back to `OPEN`. Connection/API/rate-limit/unknown results stay `RESERVED` because a remote Session might exist.
- An attached reservation is released only after the server retrieves Stripe's Session and confirms all three conditions: `status=expired`, `payment_status=unpaid`, and no PaymentIntent. Retrieval failure, missing result, pending/complete state, or any PaymentIntent stays closed.
- A signed paid Checkout webhook calls `apply_first_sale_paid_event`. Gate `SOLD → LOCKED`, event receipt, and entitlement grant commit or roll back together.
- Before that transaction, the server retrieves the PaymentIntent and verifies its exact ID, successful status, mode, AUD 19.90 amount, customer and `latest_charge`. Retrieval failure, missing Charge or any mismatch returns 503, sends the fixed operator alert when configured, and does not lock the gate or grant access. The runtime restricted key therefore needs **Prices Read, Products Read, Checkout Sessions create/retrieve and PaymentIntents Read**.
- Only `RESERVED` plus the exact attached Session is eligible for that transaction. An unreserved, old or mismatched paid Session is a P0: access is not granted, the webhook fails for investigation, and the operator follows the manual refund/support path.
- Only the exact same signed paid event is idempotent. A different event received after `LOCKED`, including another event for the same Session, cannot invoke entitlement processing. Refund and dispute commands update entitlement/accounting state only and cannot call the reopen function.
- A refund, charge-refund or dispute received before its Checkout grant creates an append-only, non-PII tombstone tied to PaymentIntent/Charge identifiers. A later grant compares Stripe `created_at`; for an equal second the priority is `revoke > review > active`. A product-less dispute-win grant may restore only an already matched entitlement and can never create a new one.
- An entitlement-free tombstone returns `tombstoned`, not a fabricated entitlement. It is still eligible for the fixed operator alert path. Tombstone reasons are fixed application codes; raw webhook bodies and customer text are not stored.
- Payment, refund and dispute alert intents are inserted by the receipt trigger in the same transaction as the webhook receipt and entitlement mutation. SMTP runs only after commit. A live lease returns 503 rather than an early 200; failure releases the lease and returns 503; an expired lease can be reclaimed. A duplicate delivery may claim pending work but cannot repeat a sent intent. Stable privacy-safe Message-ID values reduce the effect of an SMTP success followed by a mark-sent failure. A failure to record the outbox row rolls back the entitlement transaction.

The public Checkout response contains only the existing Stripe-hosted Checkout URL or an allowlisted Korean error. It never contains a claim token/hash, gate generation, database state, full stored Session ID, or database error. Application logs contain an error category only. Append-only gate audit records retain only the last eight characters of Stripe references.

## Abandoned and failure handling

Do not edit `first_sale_gates` directly.

1. If Stripe definitively rejected Session creation, confirm a `stripe_rejected_before_session` audit transition. If it is absent, leave the gate closed and escalate.
2. If an attached reservation passed its expiry, let the next Checkout attempt perform read-only Stripe verification. Only `expired + unpaid + no PaymentIntent` can create the `verified_expired_unpaid_no_intent` release event.
3. A timed-out reservation with no attached Session ID is an indeterminate outcome, not abandoned. Keep `RESERVED`, preserve provider request evidence privately, and escalate to the owner.
4. If expiry release races a paid webhook, the paid transaction acquires the same product lock and finishes in `LOCKED`. Investigate any newer Session; do not manually reopen.

## Owner-controlled next sale

`approve_next_first_sale` is deliberately unreachable by the web application. It returns false unless all of the following are supplied: a sanitized 4–120 character owner approval reference containing at least one alphanumeric character, evidence status `PASS`, a non-NULL cash difference within ±A$0.01, and payout status `matched`. NULL, ASCII/Unicode whitespace-only, control-only, format-only (`U+200B`, `U+2060`), blank, `MISSING` and `FAIL` inputs fail closed. The owner must first satisfy the 15-minute, 24-hour and first-payout evidence gates in `docs/first-payment-24-hour-operations-packet.md`.

Restore codes expire after at most 30 days. Creation rejects a later timestamp before touching existing tokens. Consumption locks and returns only an entitlement that is still `active`; a revoked/review entitlement cannot consume an already issued code or mint a fresh browser access cookie.

The paid success URL alone is not a recovery credential. `consume_checkout_activation` locks the exact entitlement and requires an exact Checkout Session, product, Stripe customer and browser nonce hash. The browser keeps the nonce only in `sessionStorage`; PostgreSQL stores only its SHA-256 hash. The first transaction creates one binding, and the same hash may idempotently remint a cookie only while the entitlement is active and the binding is not released. A different hash is denied. Restore consumption follows the same response-loss rule: the exact restore-token hash plus exact browser nonce hash atomically consumes the token, creates one access session and records one hashed binding; the same pair may return only that active, unexpired and unrevoked session, while another nonce, token, product or session is denied. Server release revokes the device access session before clearing the cookie, so activation and restore retries cannot remint a released session. Raw restore codes and nonces are never stored. A different device must use a newly issued one-time restore token. Hydration stores the activation Session/nonce then immediately removes query state with `history.replaceState`; URL cleanup is defence-in-depth, not the authorization boundary.

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

Before a live release, separately test signed sandbox events for concurrent requests, duplicate paid webhooks, refund-before-grant, dispute-before-grant, same-second revoke/review/grant priority, late grant, newer dispute-win recovery, expiry verification failure, verified abandonment, and owner-role denial. Live Stripe/DB execution requires a new explicit approval.

Catalog/effective-privilege evidence template (replace the two role placeholders only in the approved migration session). `enqueue_payment_operator_alert_failure` is the narrow pre-mutation failure wrapper used by the application and is allowlisted; the receipt trigger and `record_payment_operator_alert_intent` are the internal outbox enqueue paths and must remain unreachable by both runtime and operator roles.

```sql
with
runtime_wrappers(signature) as (
  values
    ('public.claim_first_sale_reservation(text,text,timestamptz,text,text,integer)'),
    ('public.attach_first_sale_checkout(text,bigint,text,text,timestamptz)'),
    ('public.release_failed_first_sale_reservation(text,bigint,text,text)'),
    ('public.release_verified_abandoned_first_sale(text,bigint,text)'),
    ('public.apply_first_sale_paid_event(text,text,boolean,timestamptz,text,text,integer,text,text,text,text,text)'),
    ('public.apply_guarded_entitlement_event(text,text,boolean,timestamptz,text,text,text,text,text,text,text)'),
    ('public.consume_entitlement_restore_token(text,text,text,text,text,timestamptz)'),
    ('public.create_entitlement_restore_token(bigint,text,text,timestamptz)'),
    ('public.enqueue_payment_operator_alert_failure(text,text,boolean,text,text,text)'),
    ('public.claim_payment_operator_alert_intent(text,text,text)'),
    ('public.mark_payment_operator_alert_sent(text,text,text)'),
    ('public.release_payment_operator_alert_claim(text,text,text)'),
    ('public.consume_checkout_activation(text,text,text,text,text,text,timestamptz)'),
    ('public.release_purchase_access_session(bigint,text,text)'),
    ('public.find_active_purchase_entitlement_by_access_session(bigint,text,text)'),
    ('public.find_active_purchase_entitlement_by_checkout(text,text)'),
    ('public.find_active_purchase_entitlement_by_id(bigint,text)')
),
private_helpers(signature) as (
  values
    ('public.apply_entitlement_event(text,text,boolean,timestamptz,text,text,text,text,text,text,text)'),
    ('public.lock_first_sale_from_paid_event(text,text,text,boolean,timestamptz)'),
    ('public.record_payment_operator_alert_intent(text,text,boolean,text)'),
    ('public.payment_operator_alert_from_receipt()'),
    ('public.prevent_first_sale_gate_event_mutation()'),
    ('public.prevent_entitlement_tombstone_mutation()'),
    ('public.release_checkout_activation(bigint,text)')
),
operator_functions(signature) as (
  values ('public.approve_next_first_sale(text,text,text,integer,text)')
),
protected_functions(signature) as (
  select signature from runtime_wrappers
  union all select signature from private_helpers
  union all select signature from operator_functions
),
protected_tables(qualified_name) as (
  values
    ('public.payment_webhook_events'),
    ('public.purchase_entitlements'),
    ('public.purchase_restore_tokens'),
    ('public.purchase_checkout_activations'),
    ('public.purchase_access_sessions'),
    ('public.purchase_restore_activations'),
    ('public.entitlement_event_tombstones'),
    ('public.stripe_payment_object_links'),
    ('public.payment_operator_alert_outbox'),
    ('public.first_sale_gates'),
    ('public.first_sale_gate_events')
),
protected_table_privileges(privilege_name) as (
  values ('SELECT'), ('INSERT'), ('UPDATE'), ('DELETE'), ('TRUNCATE')
),
checks as (
  select
    to_regprocedure('public.apply_first_sale_paid_event(text,text,boolean,timestamptz,text,text,text,text,text)') is null
      as old_9_arg_paid_event_removed,
    to_regprocedure('public.apply_first_sale_paid_event(text,text,boolean,timestamptz,text,text,integer,text,text,text,text)') is null
      as old_11_arg_paid_event_removed,
    to_regprocedure('public.apply_first_sale_paid_event(text,text,boolean,timestamptz,text,text,integer,text,text,text,text,text)') is not null
      as charge_aware_12_arg_paid_event_present,
    to_regprocedure('public.consume_checkout_activation(text,text)') is null
      as old_2_arg_activation_removed,
    to_regprocedure('public.consume_checkout_activation(text,text,text)') is null
      as old_3_arg_activation_removed,
    to_regprocedure('public.consume_checkout_activation(text,text,text,text)') is null
      as old_4_arg_activation_removed,
    to_regprocedure('public.consume_checkout_activation(text,text,text,text,text,text,timestamptz)') is not null
      as session_7_arg_activation_present,
    to_regprocedure('public.consume_entitlement_restore_token(text,text)') is null
      as old_2_arg_restore_consume_removed,
    to_regprocedure('public.consume_entitlement_restore_token(text,text,text,text,timestamptz)') is null
      as old_5_arg_restore_consume_removed,
    to_regprocedure('public.consume_entitlement_restore_token(text,text,text,text,text,timestamptz)') is not null
      as nonce_6_arg_restore_consume_present,
    exists (
      select 1 from public.schema_migrations
      where version = '20260823_first_sale_gate_charge_link_v2'
    ) as charge_link_v2_present,
    exists (
      select 1 from public.schema_migrations
      where version = '20260823_payment_operator_alert_outbox_v1'
    ) as alert_outbox_v1_present,
    exists (
      select 1 from public.schema_migrations
      where version = '20260823_checkout_activation_nonce_v1'
    ) as activation_nonce_v1_present,
    exists (
      select 1 from public.schema_migrations
      where version = '20260823_purchase_access_sessions_v1'
    ) as access_sessions_v1_present,
    exists (
      select 1 from public.schema_migrations
      where version = '20260823_restore_activation_nonce_v1'
    ) as restore_activation_nonce_v1_present,

    coalesce(has_function_privilege('hoju_app_runtime', to_regprocedure('public.claim_first_sale_reservation(text,text,timestamptz,text,text,integer)'), 'EXECUTE'), false)
      as runtime_can_claim_reservation,
    coalesce(has_function_privilege('hoju_app_runtime', to_regprocedure('public.attach_first_sale_checkout(text,bigint,text,text,timestamptz)'), 'EXECUTE'), false)
      as runtime_can_attach_checkout,
    coalesce(has_function_privilege('hoju_app_runtime', to_regprocedure('public.release_failed_first_sale_reservation(text,bigint,text,text)'), 'EXECUTE'), false)
      as runtime_can_release_failed_reservation,
    coalesce(has_function_privilege('hoju_app_runtime', to_regprocedure('public.release_verified_abandoned_first_sale(text,bigint,text)'), 'EXECUTE'), false)
      as runtime_can_release_verified_abandoned_reservation,
    coalesce(has_function_privilege('hoju_app_runtime', to_regprocedure('public.apply_first_sale_paid_event(text,text,boolean,timestamptz,text,text,integer,text,text,text,text,text)'), 'EXECUTE'), false)
      as runtime_can_apply_charge_aware_paid_event,
    coalesce(has_function_privilege('hoju_app_runtime', to_regprocedure('public.apply_guarded_entitlement_event(text,text,boolean,timestamptz,text,text,text,text,text,text,text)'), 'EXECUTE'), false)
      as runtime_can_apply_guarded_entitlement_event,
    coalesce(has_function_privilege('hoju_app_runtime', to_regprocedure('public.consume_entitlement_restore_token(text,text,text,text,text,timestamptz)'), 'EXECUTE'), false)
      as runtime_can_consume_restore_token,
    coalesce(has_function_privilege('hoju_app_runtime', to_regprocedure('public.create_entitlement_restore_token(bigint,text,text,timestamptz)'), 'EXECUTE'), false)
      as runtime_can_create_restore_token,
    coalesce(has_function_privilege('hoju_app_runtime', to_regprocedure('public.enqueue_payment_operator_alert_failure(text,text,boolean,text,text,text)'), 'EXECUTE'), false)
      as runtime_can_enqueue_failure_alert,
    coalesce(
      pg_get_function_result(to_regprocedure('public.enqueue_payment_operator_alert_failure(text,text,boolean,text,text,text)')) = 'boolean',
      false
    ) as failure_alert_enqueue_returns_boolean,
    coalesce(has_function_privilege('hoju_app_runtime', to_regprocedure('public.claim_payment_operator_alert_intent(text,text,text)'), 'EXECUTE'), false)
      as runtime_can_claim_alert,
    coalesce(has_function_privilege('hoju_app_runtime', to_regprocedure('public.mark_payment_operator_alert_sent(text,text,text)'), 'EXECUTE'), false)
      as runtime_can_mark_alert_sent,
    coalesce(has_function_privilege('hoju_app_runtime', to_regprocedure('public.release_payment_operator_alert_claim(text,text,text)'), 'EXECUTE'), false)
      as runtime_can_release_alert_claim,
    coalesce(has_function_privilege('hoju_app_runtime', to_regprocedure('public.consume_checkout_activation(text,text,text,text,text,text,timestamptz)'), 'EXECUTE'), false)
      as runtime_can_consume_activation,
    coalesce(has_function_privilege('hoju_app_runtime', to_regprocedure('public.release_purchase_access_session(bigint,text,text)'), 'EXECUTE'), false)
      as runtime_can_release_access_session,
    coalesce(has_function_privilege('hoju_app_runtime', to_regprocedure('public.find_active_purchase_entitlement_by_access_session(bigint,text,text)'), 'EXECUTE'), false)
      as runtime_can_validate_access_session,
    coalesce(has_function_privilege('hoju_app_runtime', to_regprocedure('public.find_active_purchase_entitlement_by_checkout(text,text)'), 'EXECUTE'), false)
      as runtime_can_read_active_by_checkout,
    coalesce(has_function_privilege('hoju_app_runtime', to_regprocedure('public.find_active_purchase_entitlement_by_id(bigint,text)'), 'EXECUTE'), false)
      as runtime_can_read_active_by_id,

    coalesce(has_function_privilege('hoju_owner_operator', to_regprocedure('public.approve_next_first_sale(text,text,text,integer,text)'), 'EXECUTE'), false)
      as operator_can_approve_next_sale,
    not coalesce(has_function_privilege('hoju_app_runtime', to_regprocedure('public.approve_next_first_sale(text,text,text,integer,text)'), 'EXECUTE'), false)
      as runtime_cannot_approve_next_sale,
    (
      select bool_and(not coalesce(has_function_privilege('hoju_owner_operator', to_regprocedure(signature), 'EXECUTE'), false))
      from runtime_wrappers
    ) as operator_cannot_execute_runtime_wrappers,
    (
      select bool_and(to_regprocedure(signature) is not null)
      from private_helpers
    ) as private_helpers_present,
    (
      select bool_and(not coalesce(has_function_privilege('hoju_app_runtime', to_regprocedure(signature), 'EXECUTE'), false))
      from private_helpers
    ) as runtime_cannot_execute_private_helpers,
    (
      select bool_and(not coalesce(has_function_privilege('hoju_owner_operator', to_regprocedure(signature), 'EXECUTE'), false))
      from private_helpers
    ) as operator_cannot_execute_private_helpers,
    not coalesce(has_function_privilege('hoju_app_runtime', to_regprocedure('public.record_payment_operator_alert_intent(text,text,boolean,text)'), 'EXECUTE'), false)
      as runtime_cannot_execute_internal_alert_enqueue,
    not coalesce(has_function_privilege('hoju_owner_operator', to_regprocedure('public.record_payment_operator_alert_intent(text,text,boolean,text)'), 'EXECUTE'), false)
      as operator_cannot_execute_internal_alert_enqueue,
    not coalesce(has_function_privilege('hoju_app_runtime', to_regprocedure('public.payment_operator_alert_from_receipt()'), 'EXECUTE'), false)
      as runtime_cannot_execute_alert_receipt_trigger,
    not coalesce(has_function_privilege('hoju_owner_operator', to_regprocedure('public.payment_operator_alert_from_receipt()'), 'EXECUTE'), false)
      as operator_cannot_execute_alert_receipt_trigger,
    not exists (
      select 1
      from protected_functions f
      join pg_proc p on p.oid = to_regprocedure(f.signature)
      cross join lateral aclexplode(coalesce(p.proacl, acldefault('f', p.proowner))) acl
      where acl.grantee = 0 and acl.privilege_type = 'EXECUTE'
    ) as public_cannot_execute_protected_functions,

    (select bool_and(to_regclass(qualified_name) is not null) from protected_tables)
      as protected_tables_present,
    (
      select bool_and(not coalesce(has_table_privilege('hoju_app_runtime', to_regclass(t.qualified_name), p.privilege_name), false))
      from protected_tables t cross join protected_table_privileges p
    ) as runtime_has_no_protected_table_privileges,
    (
      select bool_and(not coalesce(has_table_privilege('hoju_owner_operator', to_regclass(t.qualified_name), p.privilege_name), false))
      from protected_tables t cross join protected_table_privileges p
    ) as operator_has_no_protected_table_privileges,
    not exists (
      select 1
      from protected_tables t
      join pg_class c on c.oid = to_regclass(t.qualified_name)
      cross join lateral aclexplode(coalesce(c.relacl, acldefault('r', c.relowner))) acl
      where acl.grantee = 0
        and acl.privilege_type in ('SELECT', 'INSERT', 'UPDATE', 'DELETE', 'TRUNCATE')
    ) as public_has_no_protected_table_privileges,

    not coalesce(has_schema_privilege('hoju_app_runtime', 'public', 'CREATE'), false)
      as runtime_cannot_create_in_public_schema,
    not coalesce(has_schema_privilege('hoju_owner_operator', 'public', 'CREATE'), false)
      as operator_cannot_create_in_public_schema,
    not exists (
      select 1
      from pg_namespace n
      cross join lateral aclexplode(coalesce(n.nspacl, acldefault('n', n.nspowner))) acl
      where n.nspname = 'public'
        and acl.grantee = 0
        and acl.privilege_type = 'CREATE'
    ) as public_cannot_create_in_public_schema,
    not pg_has_role('hoju_owner_operator', 'hoju_app_runtime', 'MEMBER')
      as operator_does_not_inherit_runtime_role,
    not pg_has_role('hoju_app_runtime', 'hoju_owner_operator', 'MEMBER')
      as runtime_does_not_inherit_operator_role
)
select
  checks.*,
  (
    select bool_and(value = 'true')
    from jsonb_each_text(to_jsonb(checks))
  ) as all_privilege_checks_pass
from checks;
```

Every named boolean, including `all_privilege_checks_pass`, must be `true`; accepting a subset or a row count is prohibited. Also enumerate `pg_proc` by `proname` and argument count: the 9- and 11-argument paid-event functions, 2-/3-/4-argument activation functions and 2-/5-argument restore consume functions must be absent; exactly one 12-argument paid-event, one 7-argument activation consume and one 6-argument restore consume may remain. A missing catalog row, unexpected overload, role-membership mismatch or effective-privilege mismatch keeps live **NO-GO**.
