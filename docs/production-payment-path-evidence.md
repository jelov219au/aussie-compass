# Production payment-path redacted evidence

This local runner classifies a redacted, count-only observation after an explicitly approved Production rehearsal. It never connects to Stripe, Neon, Vercel, SMTP or the application, and it never creates a payment, changes an environment variable or opens Checkout. A PASS proves only that the supplied redacted observations form the required fail-closed combination; it does not prove who collected them or replace source-system review.

Keep `PAYMENTS_ENABLED=false` while collecting and classifying this evidence. Collect values through an approved read-only operator session after separately proving the exact Production Source SHA and integrated first-sale preflight. Do not grant the application runtime direct table access merely to populate this file.

Create a local template outside source control:

```powershell
node scripts/verify-production-payment-path-evidence.mjs --template
```

Populate only aggregate deltas, fixed outcomes and booleans. Do not add customer data, Stripe IDs or suffixes, checkout/access/restore identifiers, nonce/token/session hashes, cookies, URLs, credentials, connection strings or raw webhook payloads. Then run:

```powershell
node scripts/verify-production-payment-path-evidence.mjs --file <private-redacted-json>
```

The contract requires all latest migrations, an explicitly disabled payment switch, one signed webhook receipt with a duplicate producing no new receipt, one sent outbox intent with no pending remainder and confirmed mailbox delivery, a single activation binding/session, same-nonce idempotency without new rows, different-nonce denial without a cookie, permanent release with the old session denied, and an independent restore binding/session with the same replay protections.

Only this line is PASS:

```text
PRODUCTION_PAYMENT_PATH_EVIDENCE=PASS mode=production payments_off=yes webhook=verified outbox=sent nonce=bound release=denied restore=verified identifiers_printed=no secrets_printed=no
```

Any missing, extra or inconsistent field, payment switch not explicitly off, unverified migration, unsafe identifier pattern or malformed input emits one canonical `PRODUCTION_PAYMENT_PATH_EVIDENCE=FAIL ... launch=NO-GO reason=<allowlisted_reason>` line. Treat it as launch `NO-GO`; do not request another payment from the customer.

Run the offline contract test with:

```powershell
node scripts/check-production-payment-path-evidence.mjs
```
