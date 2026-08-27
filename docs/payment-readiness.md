# Hoju Compass payment readiness

Resume Pro is a one-time AUD 19.90 product provided by Hoju Compass's Australian sole-trader operator through Stripe Managed Payments. Hoju Compass's product-provider identity and the transaction seller (Merchant of Record) shown by Managed Payments are separate roles. A controlled live purchase, access-delivery check and full refund passed on 20 August 2026, but that historical test does not prove current launch readiness. The authoritative 24 August Production audit is `NO-GO`; `PAYMENTS_ENABLED=false` and `STRIPE_MANAGED_PAYMENTS_ENABLED=false` remain the safe defaults until every current preflight blocker passes and the owner separately approves one first-customer sale.

## Owner-only setup

- Create and verify the Stripe account as an Individual / Sole trader.
- Enter the legal name, ABN, identity document and Australian payout bank account directly in Stripe.
- Keep the registered business name (`Hoju Compass`) separate from the sole trader's legal/registered product-provider name. The customer-facing purchase page must show both without hardcoding either person's private details into source control. These site details do not set or prove the transaction seller shown by Managed Payments Checkout and receipts.
- Never send identity documents, bank details or secret keys through chat, source control or client-side environment variables.
- Create a separate business bank account where practical. After the first sale, confirm the ABN entity, GST registration status and how Managed Payments payouts, fees and tax documents belong in the Australian records; professional advice is recommended but is not a Stripe activation prerequisite for the single first sale.

## Product and customer protection

- Keep the existing resume builder and PDF output free.
- State the full AUD price before checkout and identify the purchase as one-time, not recurring.
- Require the customer to acknowledge the current purchase and privacy notices before creating Checkout, and record only the notice version in Stripe metadata rather than copying the page contents into payment records.
- Publish the Hoju Compass product provider's legal/registered identity, ABN, support contact, delivery method, refund process, privacy notice and terms before accepting money. After the first payment, separately observe the transaction seller, document issuer and transaction-support details on the actual Managed Payments Checkout and every issued customer document. Treat a role as verified only when it and a populated business value are clearly customer-visible in that artifact. Otherwise record `UNVERIFIED`, do not infer the role from `BUSINESS_*` or another artifact, hold the second sale and route the customer to Hoju Compass product support without guessing.
- Do not use “no refunds”. Australian Consumer Law rights must remain available.
- Provide a self-service way to restore a purchase on another device and revoke access after a refund or chargeback.
- Keep every paid workspace inaccessible on deployed builds until that server-verified access path is complete.

## Technical launch gates

- Use Stripe-hosted Checkout so Hoju Compass never receives raw card details.
- Create Checkout Sessions only on the server.
- In non-production environments, use only test keys (`rk_test_` preferred, `sk_test_` supported). In production, use only live keys (`rk_live_` preferred, `sk_live_` supported).
- Prefer least-privilege restricted keys (`rk_test_` / `rk_live_`) with Prices Read, Products Read, Checkout Sessions create/retrieve and PaymentIntents Read. The Product permission supports the Price/Product identity check, and PaymentIntents Read supports `latest_charge` verification before the atomic grant. Review Stripe request logs before adding any further permission.
- Before opening Checkout, the fail-closed preflight uses a separate one-off `PAYMENTS_STRIPE_AUDIT_KEY` with Account Read only to read the current Stripe Account. It requires charges and payouts enabled, identity details submitted, no current or past-due requirements, and a complete customer-facing business profile. The Stripe business-profile support email must exactly match `NEXT_PUBLIC_SUPPORT_EMAIL` case-insensitively; a support address published only on the site is insufficient. Never add Account Read to the Checkout runtime key merely to satisfy this audit.
- Validate the configured Resume Pro Price server-side as active, one-time, AUD 19.90 and tax-inclusive before redirecting.
- Expand the Price's Product and require its ID to match the independently configured `STRIPE_RESUME_PRO_PRODUCT_ID`. A same-price Product must fail closed.
- Require the Product's exact tax code to match `STRIPE_RESUME_PRO_TAX_CODE`. Copy only a code that Stripe Dashboard labels eligible for Managed Payments; `txcd_` values are opaque and must never be guessed from the product description.
- Enable Managed Payments explicitly for each Checkout Session after confirming product eligibility.
- Before the first Managed Payments sale, confirm the Managed Payments terms of service are accepted, Dashboard activation is complete, the product/tax code is eligible and the integration uses API version `2025-03-31.basil` or later.
- Add a unique Checkout `integration_identifier` so Resume Pro sessions can be filtered in Stripe Workbench.
- Verify signed Stripe webhooks before granting access.
- Reject oversized webhook payloads and events whose test/live mode does not match the deployment environment.
- Store only the minimum entitlement record needed to restore access.
- Issue a signed, short-lived browser cookie only after atomically creating a server-tracked access session for an active entitlement. Every request must recheck that exact session is unexpired and unrevoked; never unlock a workspace from the success-page URL or a legacy cookie alone.
- Process each Stripe event once by claiming its event ID and updating the entitlement in the same database transaction.
- Compare Stripe event creation times before changing an existing entitlement. Ignore older events, and use `revoke > review > grant` when events share the same second so delayed delivery cannot reopen access after a refund or dispute.
- Treat partial refunds and ambiguous payment states as manual review instead of automatically granting or revoking access.
- Never place `STRIPE_SECRET_KEY` or `STRIPE_WEBHOOK_SECRET` in variables prefixed with `NEXT_PUBLIC_`.
- Sign access cookies with a separate `ENTITLEMENT_SESSION_SECRET` of at least 32 random characters and keep it server-only.
- Require `operatorAlertsConfigured=true` in Production. `getPaymentReadiness().ready` remains false when `paymentAlertsConfigured()` rejects the payment-alert mail configuration, including when alerts are disabled or required SMTP authentication/port values are invalid.
- Run `npm run security:secrets` before publishing changes to catch accidentally tracked Stripe or Vercel credentials.
- The integrated wrapper runs the protected runtime verifier and then `npm run payments:operator-audit` while payments are off. The runtime check fails closed if the Product contract or zero-open-Checkout proof does not match; the local operator audit fails closed if the live Account, customer-support profile, statement descriptor or audit database contract cannot be read or does not match.
- Require the GitHub Actions `Quality gate` check on pull requests. It runs lint, a production build, payment and entitlement contracts, and the tracked-source secret scan through `npm run quality:gate` without using live credentials.
- With payments off, verify `20260823_first_sale_gate_charge_link_v2` and then apply the additive migrations in order: `docs/migrations/20260823_payment_operator_alert_outbox_v1.sql`, `docs/migrations/20260823_checkout_activation_nonce_v1.sql`, `docs/migrations/20260823_purchase_access_sessions_v1.sql`, then `docs/migrations/20260823_restore_activation_nonce_v1.sql`. Do not combine, reorder or roll them back by deleting evidence. Follow `docs/database-recovery.md` for backup and isolated restore drills; a production restore always requires explicit approval.
- After least-privilege roles v1, apply `docs/migrations/20260824_entitlement_link_conflict_v1.sql`. It is a required forward fix for the paid-event PaymentIntent/Charge link conflict target; SQLSTATE `42702` or a missing version keeps live Checkout closed. The migration itself requires `neondb_owner` on `neondb`, takes a 2-second-bounded write lock on `first_sale_gates`, and refuses an in-flight `RESERVED` sale so a stale preflight cannot race a new Checkout claim.
- Do not add a push-delivery surface until it has a durable unique delivery ID and duplicate claim. The quality gate treats that deduplication as a release prerequisite.
- Test successful payment, cancellation, duplicate webhook, refund, chargeback and failed payment in Stripe test mode.
- Run `npm run test:entitlement-ordering` before publishing payment changes.
- Run `npm run test:entitlement-commands` to verify paid, unpaid, asynchronous, refund and dispute events map to the intended access state.
- Run `npm run test:resume-pro-tokens` to verify signed-session tamper resistance, expiry, revoked-access blocking and restore-code hashing.
- Run `npm run test:stripe-contract` to prevent accidental removal of Checkout consent, server-side price validation, dynamic payment methods or webhook signature checks.
- Run `npm run test:stripe-product` to reject a same-price wrong Product, an absent or changed tax code, an unspecified tax behavior, a deleted Product and a test/live mismatch.
- Before the remote database audit, create the dedicated `hoju_payment_auditor` login with SQL, not the Neon Console, CLI or API. Neon documents that Console/CLI/API-created roles inherit `neon_superuser`, while SQL-created roles receive ordinary PostgreSQL defaults. Use a password-manager-generated secret outside the repository and chat, specify `NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOREPLICATION NOBYPASSRLS`, then apply `docs/payment-audit-role-grants.sql` on Primary / `neondb` as `neondb_owner` while payments are off. The grant template refuses a missing/unsafe role, the wrong database/owner, elevated membership or an in-flight reservation; it grants only schema usage and `SELECT` on `schema_migrations` and `first_sale_gates`.
- Run `scripts/run-vercel-production-payment-preflight.ps1` from a fresh PowerShell process while payments are off, passing the separately approved Neon endpoint ID and full owner-approved Production commit SHA. After setting `STRIPE_MANAGED_PAYMENTS_ENABLED=true`, redeploy that same SHA and repeat the exact-SHA payment-off deployment check before this command; an environment change without that redeploy is stale and remains `NO-GO`. Vercel Sensitive values are non-readable after creation, so the outer wrapper never uses `vercel env run`/`pull`, a dotenv file, a token argument or a manually managed Automation Bypass secret. It proves the exact Production deployment, then uses authenticated `vercel curl --deployment` against only that protected `vercel.app` origin. The runtime returns a fixed PASS/FAIL after checking its own non-readable payment/runtime settings, Product, zero open Checkout Sessions, runtime database boundary and one explicit operator-monitoring path. `monitoring=smtp` proves the no-send SMTP transport check; `monitoring=manual` proves only the exact owner-acknowledged first-sale manual monitoring fallback and does not claim SMTP verification. The inner wrapper proves the runtime, audit and accounting keys differ using one-time challenge HMACs; raw keys never enter argv, the request body or logs. It then runs `npm run payments:operator-audit` with the masked Account-read key and `hoju_payment_auditor` URL, followed by `npm run accounting:preflight` with the same masked accounting key. This verifies the Stripe Account/support profile, approved Neon endpoint, audit role, seven migrations, named constraint, no reservation in flight and accounting read access. Use only a single uninterrupted result containing outer `VERCEL_PRODUCTION_PREFLIGHT=PASS ... monitoring=<smtp|manual> ...` and inner `FIRST_SALE_PREFLIGHT=PASS mode=live payments_off=yes monitoring=<smtp|manual> keys=three-distinct-rk-live required_reads=verified checkout_create=not-exercised database=strict-pass secrets_printed=no` with the same concrete monitoring value. The standalone `run-accounting-preflight.ps1` is not a second launch prerequisite in the same approval window and cannot replace this integrated result. Any placeholder, mismatch, missing or failed line remains `NO-GO`; no Checkout is created and no switch is changed.
- Keep `PAYMENTS_ENABLED=false` until test evidence and legal copy are reviewed.
- Keep live payments disabled until the durable Neon entitlement store, live webhook secret and live-mode recovery flow are configured together and verified with a controlled purchase.

## Bookkeeping

- Record gross customer sales, Stripe fees, refunds and net bank payouts separately.
- Keep the original Stripe Balance/Payout reconciliation export and bank evidence outside the repository, and update the private accounting register without customer details.
- Export Stripe payments, balance and payout reports and reconcile them with the bank account.
- Track GST turnover across all activities operated under the same sole trader ABN.
- Retain invoices and business records for the required period.

## Required environment contract

The repository includes placeholders in `.env.example`. Production secrets belong in the hosting provider’s encrypted environment settings. `STRIPE_RESUME_PRO_PRICE_ID`, `STRIPE_RESUME_PRO_PRODUCT_ID`, and `STRIPE_RESUME_PRO_TAX_CODE` are a three-part deployment contract, not interchangeable labels: the first two must identify the intended Price and its independently reviewed Product, while the third must be the exact Product tax code that Stripe Dashboard marks eligible for Managed Payments. The server additionally requires the Price's immutable tax behavior to be `inclusive`, matching the advertised AUD 19.90 total. If any value is absent or disagrees with Stripe, Checkout fails closed before a Session is created.

Production readiness also requires `paymentAlertsConfigured()` to return true; otherwise `operatorAlertsConfigured` and the overall `ready` result are false, so `isResumeProLive()` cannot open live Checkout. This readiness check confirms configuration only. Before accepting a customer payment, separately prove the outbox pending/sent/attempt counts, two-worker busy/stale-lease behavior and actual controlled purchase/refund delivery to the monitored mailbox without exposing sensitive payment data. Also prove activation response-loss recovery uses the same server access session, release-response loss denies the old cookie, another device remains active, and refund/review/expiry/legacy-cookie/session mismatch all fail closed.

### Checkout preflight failure contract

| Preflight result | HTTP / screen result | Retry guidance | Analytics |
| --- | --- | --- | --- |
| Required environment value absent or invalid | HTTP 503 and a Korean configuration-unavailable notice; no Stripe lookup or Session creation | Wait until the owner corrects the deployment | No `Checkout Started` event |
| Restricted key cannot read the configured Price/Product | HTTP 503 and the same configuration-unavailable notice | Owner reviews the restricted-key permissions | No `Checkout Started` event |
| Stripe connection, API, or rate-limit interruption | HTTP 503 and a Korean temporary-unavailable notice | Customer may retry from the same page; no charge has occurred | No `Checkout Started` event |
| Price, Product identity, tax code, tax behavior, activity, or mode mismatch | HTTP 503 and the configuration-unavailable notice | Checkout remains closed until the server contract is corrected | No `Checkout Started` event |
| Verified Session URL returned | Redirect to the exact `https://checkout.stripe.com` host | Continue in Stripe Checkout | Record `Checkout Started` immediately before redirect |

The enhanced form receives only an allowlisted code, Korean message and retry flag. The native form fallback redirects to the same allowlisted page state. Neither response nor server log serializes the caught Stripe error, environment variable name, Price/Product/tax-code identifier or key. Run `npm run test:checkout-resilience` after changing this boundary.

Stripe's Product response exposes the exact tax-code ID but does not provide a stable API field that proves the Dashboard's “Eligible for Managed Payments” label. The owner must therefore confirm that label when choosing the code; the app then pins and verifies the approved ID on every Checkout. Stripe performs the final eligibility check when `managed_payments[enabled]` is submitted. Do not create a speculative eligibility allowlist in source code.

Reference the official Stripe guides when reviewing this contract: [how Managed Payments works](https://docs.stripe.com/payments/managed-payments/how-it-works), [Managed Payments Checkout setup](https://docs.stripe.com/payments/managed-payments/set-up), [Managed Payments eligibility](https://docs.stripe.com/payments/managed-payments/eligibility), [Managed Payments tax compliance](https://docs.stripe.com/payments/managed-payments/tax-compliance), and [product tax codes and tax behavior](https://docs.stripe.com/tax/products-prices-tax-codes-tax-behavior).

The registered site name `Hoju Compass` is the default customer-facing product business name; `BUSINESS_TRADING_NAME` is only an optional override. `BUSINESS_LEGAL_NAME` is the legal/registered name of the Hoju Compass product provider and must never be hardcoded. It does not configure or establish the Managed Payments transaction seller. Treat the transaction seller and document issuer as verified only when each role and a populated business value are clearly displayed in the actual Checkout or issued document; otherwise keep them `UNVERIFIED` and do not infer them from another artifact. The internal readiness field `sellerDetailsConfigured` means these required product-provider details are present, not that the Merchant of Record has been identified. `PAYMENTS_ENTITLEMENT_STORE` must identify the approved server-side entitlement service before launch. The app accepts the manual `ENTITLEMENT_DB_URL` override or Vercel Neon's managed `ENTITLEMENT_DB_DATABASE_URL`; do not copy the managed connection string into a second variable.

## Post-launch owner actions

1. Run the target-environment launch audit with `.\scripts\run-vercel-production-payment-preflight.ps1 -ExpectedNeonEndpointId ep-curly-wave-a78bktnq -ExpectedProductionSha <full-owner-approved-sha>` while Checkout is off and after any payment-setting or deployment change. A setting change first requires redeploying the same approved SHA and repeating the exact-SHA payment-off deployment check. Reconfirm that this non-secret ID is still the separately approved Primary compute before each run. The runtime restricted key requires Prices Read, Products Read, Checkout Sessions Write and Payment Intents Read; the separate audit and accounting keys are entered only at masked prompts. Only after the outer and inner canonical PASS lines both appear with the same concrete `monitoring=smtp` or `monitoring=manual` value may the owner separately approve `PAYMENTS_ENABLED=true`.
2. Repeat the completed protected-Preview customer-access test after any change to the webhook, entitlement schema, access cookie or recovery-code flow. Recovery-code expiry remains covered by the deterministic token test because the deployed code lasts 30 days.
3. Add `BUSINESS_LEGAL_NAME`, `BUSINESS_ABN` and `NEXT_PUBLIC_SUPPORT_EMAIL` to Vercel without pasting the sole trader's private details into chat or source control. Confirm the purchase page shows the product business name and legal/registered product-provider name as separate fields. Add `BUSINESS_TRADING_NAME` only if the displayed business name must differ from `Hoju Compass`. Do not use these values as evidence of the Checkout transaction seller.
4. After the single first sale, confirm the ABN/GST status through the Australian Business Register and obtain professional advice where needed for income-tax, records and bookkeeping. Run the schema v2 nine-row gate on that sale's actual Checkout and issued documents. Any `UNVERIFIED` role or unresolved tax-agent handoff holds the second sale, not the already completed first payment.
5. Finish the Stripe live-mode business profile, statement descriptor, customer support details and payout bank verification. Create the live restricted key, live Resume Pro Price and live webhook endpoint with the same event subscriptions verified in Preview.
6. Reconcile the controlled live purchase, Stripe fee and full refund with the first Stripe balance and payout reports.
   The private accounting register contains the verified controlled sale and full refund. The fee and refund-balance sources have been observed; credit-document classification and payout/bank reconciliation remain unresolved until supported by private source reports and bank evidence.
7. If identity, payout, webhook, entitlement or support monitoring fails, set `PAYMENTS_ENABLED=false` and redeploy before investigating.

Do not add a separate application-level `automatic_tax` or manual tax rate while Managed Payments controls tax. The verified test Checkout enabled tax with liability assigned to Stripe and included GST inside the A$19.90 total. Reconfirm this in live mode before launch; it does not decide the sole trader's ABN, GST, income-tax or BAS obligations.

## Preview verification record

The protected Preview integration was verified on 18 August 2026 without enabling live payments:

- A Stripe test-mode Checkout completed for Resume Pro at AUD 19.90.
- A fresh Managed Payments test on 19 August 2026 recorded the current purchase-terms version, produced an invoice, included AUD 1.81 GST inside the AUD 19.90 total and reported Stripe as the automatic-tax liability party.
- With the controlled Preview webhook intentionally disabled, that fresh paid Checkout returned to the success page but did not display the Resume Pro activation action. This confirms a paid URL alone still fails closed; a valid signed webhook and active Neon entitlement remain mandatory.
- Stripe manually resent that real `checkout.session.completed` event to the protected Preview webhook.
- The signed event returned HTTP 200 with `persisted: true` and `outcome: "processed"`.
- Repeated delivery of the same Stripe event returned HTTP 200 with `outcome: "duplicate"`.
- Neon contained one webhook-event row and one active Resume Pro entitlement for the Checkout Session after all three deliveries.
- The entitlement ordering migration was applied on 18 August 2026. The existing row was backfilled with its Stripe event creation time, the timestamp column was verified non-null, and the database routine was verified to return `ignored_stale` for events that must not replace a newer state.
- A full AUD 19.90 Stripe test-mode refund then delivered `charge.refunded`, `refund.created` and `refund.updated` to the protected Preview endpoint. All three signed deliveries returned HTTP 200 and the entitlement remained inaccessible in `review` after the final refund update.
- Resending the original Checkout event returned `duplicate` and did not restore access. A separate transaction-only database regression used a different older event ID, returned `ignored_stale`, preserved the blocked state and was rolled back with zero test rows left behind.
- A request with an invalid Stripe signature was rejected with HTTP 400 during the earlier endpoint verification.
- On 19 August 2026, the active endpoint's signing secret was matched to the branch-scoped Preview variable and the Preview was redeployed. Stripe then resent a real paid `checkout.session.completed` event; the Preview returned HTTP 200 and Neon recorded `outcome: "processed"` with an active Resume Pro entitlement.
- The paid session displayed the activation action only after that persisted entitlement existed. Opening it issued a signed browser session and allowed access to `/resume-pro/workspace`.
- The workspace created a 30-day, one-time recovery code. Releasing the current device immediately blocked the workspace, the code restored access once, and a second use was rejected with `status=invalid`.
- The temporary Vercel automation bypass was removed after the test. The Stripe test webhook endpoint was disabled, its URL was stripped of the bypass query value, and its metadata records the successful verification and revoked bypass.

This record proves the Checkout-to-webhook path, durable entitlement idempotency, signed device access, access release and one-time recovery work in test mode. Deterministic local tests additionally cover token tampering and expiry.

## Live verification record

The public Production integration was verified on 20 August 2026:

- A real Managed Payments Checkout completed for Resume Pro at AUD 19.90 and included AUD 1.81 GST in the total.
- Production initially rejected the signed event because the stored webhook secret did not match the live destination. Payments were immediately disabled while the secret was corrected and the endpoint redeployed.
- The recovered `checkout.session.completed` delivery returned HTTP 200 with `persisted: true` and `outcome: "processed"`.
- Live Checkout Session validation and Neon entitlement lookup were both updated to accept the explicit `cs_live_` prefix, with a contract test covering both boundaries.
- The paid success page exposed the activation action only after the active Neon entitlement existed. Activating it opened `/resume-pro/workspace` with a signed browser session.
- Stripe issued a full AUD 19.90 refund. Both `refund.created` and `charge.refunded` reached Production with HTTP 200; the charge event revoked the entitlement and the existing workspace session redirected to `access=required`.
- Production payments were re-enabled only after the grant and revoke paths both passed.

No customer email, card detail, legal name, ABN, secret key, webhook secret or database connection string is recorded in this verification note.
