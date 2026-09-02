# Pay Evidence device/restore access compatibility

Prepared 2026-08-31 against main f77480a14df01748a27218457289cdf28df5af86.
Local candidate only. No Production migration, deployment or payment-opening approval is implied.

## Finding and bounded correction

The recorded fresh-schema chain updates Pay Evidence table constraints and the
legacy checkout-activation overload, but the current runtime uses a seven-argument
activation and six-argument restore. Those and access release, access lookup and
restore-token creation still reject Pay Evidence. This is source evidence, not a
query of deployed functions or evidence of an affected buyer.

20260831_pay_evidence_access_functions_v1.sql repairs exactly those five
signatures. It accepts only the reviewed original body or its already-repaired
body. It adds Pay Evidence to the existing product guard; nonce/session binding,
single-use/idempotency rules, expiry, refund/review checks and locks are unchanged.
Unrecognised body changes, missing prerequisites/signatures, unexpected ownership
or privileges and in-flight reservations fail closed.

The migration is one transaction with a 10-second statement timeout and 2-second
lock timeout. It locks first-sale gate writes before checking reservations and
executes replacements as hoju_migration_owner. Function OIDs, ownership, ACLs,
SECURITY DEFINER, search path and volatility are preserved/checked. No function
drop, role grant, data deletion, entitlement creation or gate reopening is added.
See PostgreSQL's ownership/ACL preservation rule for
[CREATE OR REPLACE FUNCTION](https://www.postgresql.org/docs/current/sql-createfunction.html).

The JSON manifest records exact signatures and CRLF-normalised body fingerprints.
MD5 here is a source-compatibility checksum, not authentication or a cryptographic
security boundary. Intentional future body changes need review plus updated
contracts; a migration stamp or a product name in a comment cannot supply PASS.

The migration runner applies missing forward migrations even when both earlier
Pay Evidence migrations are already stamped. Its postflight requires all five
access bodies plus the alert body and their security contracts. Runtime readiness checks the same six
bodies/ACLs through public catalogues using the runtime role, without giving that
role SELECT access to schema_migrations or application tables. Other products'
readiness paths are unchanged. Database failure/missing results remain false.

## Validation boundaries

Run: node scripts/check-pay-evidence-access-functions.mjs

It checks latest source definitions across the 11-file prerequisite chain,
guard-only changes, CRLF handling, idempotency, unknown-body rejection,
security/transaction contracts, actual server readiness with a fake transport,
and the actual migration runner/SQL splitter with a fake transaction transport.
These are local source and JavaScript execution checks, **not PostgreSQL execution**.

Before applying to the approved independent sandbox:

1. Confirm project shiny-base-94408939, its observed branch/endpoint, empty
   default neondb and owner neondb_owner. Never infer identity from the DB name.
2. Keep Checkout OFF and use SQL-only least-privilege roles. Review/bootstrap
   the baseline and dated prerequisites, then the runner's five-stage Pay Evidence
   chain listed below. Do not replay old DROP-heavy migrations on
   an existing populated database or alter unknown function definitions.
3. Require every statement through COMMIT to succeed. Verify all five body
   fingerprints and effective runtime EXECUTE/no direct table DML/no elevated
   membership. Test rerun/idempotency and rejected malformed inputs against
   PostgreSQL; do not treat the local mock result as that evidence.
4. In the separately approved protected sandbox regression, prove signed
   payment -> activation/release -> one-use recovery/replay -> full-refund
   revocation. Do not manually manufacture entitlements as acceptance evidence.
   Existing session/purchase caps and target-specific callback safeguards apply.

## Actual empty-sandbox findings (2026-08-31)

Console authentication is COMPLETE. Do not repeat connection/email/2FA requests.
The exact independent project above, branch br-delicate-bird-a7t1kjew and compute
ep-calm-glitter-a7esj9zv, was independently verified empty before bootstrap.
This test database is PostgreSQL 18.6; this is not an engine-parity claim for the
older Production project. SQL-created roles remain NOLOGIN with no app connection.

The actual PostgreSQL run exposed two additional fresh-bootstrap defects:

1. The baseline leaves auto-named amount CHECKs identical to the later named
   checks. Expanding only the named checks correctly failed the Pay Evidence gate
   postflight. The failed transaction was rolled back.
   20260831_pay_evidence_gate_constraint_prerequisite_v1.sql must run BEFORE the
   Pay Evidence gate migration. It removes only the exact validated duplicate,
   preserves the canonical constraint OID/definition, and rejects unknown shapes.
   State and audit constraints remain intact; no rows are deleted.
2. The legacy Pay Evidence entitlement migration drops/recreates the fulfillment
   alert function, losing runtime EXECUTE and reverting its NULL/product guards.
   20260831_pay_evidence_alert_runtime_v1.sql accepts only the reviewed reset or
   repaired body, restores NULL checks and Resume/Rental/Pay Evidence allowlists,
   and restores only that function's EXECUTE to the runtime role.
   No role login, table access, PUBLIC grant, emitted alert or email is added.
   The JSON contract and shared readiness check now cover this sixth function.

Fresh runner ordering: Pay Evidence entitlement -> exact duplicate-check
prerequisite -> Pay Evidence first-sale gate -> five access functions -> alert
runtime repair. Existing dated migrations are not edited or replayed blindly.
Ops evidence records actual COMMITs and separately records rolled-back diagnostic
tests. JavaScript mock tests retain postgres_execution=not_run; do not conflate
them with the separately performed console SQL checks or full paid acceptance.

Web/mobile/PWA review: **호환** by shared server contract. No UI, browser API,
storage, service-worker or route changes. Physical-device and buyer flows are
not newly tested; no build/Preview/Production deployment is part of this local fix.
