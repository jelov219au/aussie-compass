# Hoju Compass payment readiness

Resume Pro is planned as a one-time AUD 19.90 product sold by an Australian sole trader. Payments must remain disabled until every launch gate below is complete.

## Owner-only setup

- Create and verify the Stripe account as an Individual / Sole trader.
- Enter the legal name, ABN, identity document and Australian payout bank account directly in Stripe.
- Never send identity documents, bank details or secret keys through chat, source control or client-side environment variables.
- Create a separate business bank account where practical and confirm the ABN entity and GST registration status with a registered tax agent.

## Product and customer protection

- Keep the existing resume builder and PDF output free.
- State the full AUD price before checkout and identify the purchase as one-time, not recurring.
- Publish seller identity, ABN, support contact, delivery method, refund process, privacy notice and terms before accepting money.
- Do not use “no refunds”. Australian Consumer Law rights must remain available.
- Provide a self-service way to restore a purchase on another device and revoke access after a refund or chargeback.

## Technical launch gates

- Use Stripe-hosted Checkout so Hoju Compass never receives raw card details.
- Create Checkout Sessions only on the server.
- In non-production environments, use only test keys (`rk_test_` preferred, `sk_test_` supported). In production, use only live keys (`rk_live_` preferred, `sk_live_` supported).
- Prefer least-privilege restricted keys (`rk_test_` / `rk_live_`) and grant only the Checkout Session and Price access used by this integration. Review Stripe request logs before adding permissions.
- Validate the configured Resume Pro price server-side as active, one-time, AUD 19.90 before redirecting.
- Enable Managed Payments explicitly for each Checkout Session after confirming product eligibility.
- Add a unique Checkout `integration_identifier` so Resume Pro sessions can be filtered in Stripe Workbench.
- Verify signed Stripe webhooks before granting access.
- Reject oversized webhook payloads and events whose test/live mode does not match the deployment environment.
- Store only the minimum entitlement record needed to restore access.
- Process each Stripe event once by claiming its event ID and updating the entitlement in the same database transaction.
- Treat partial refunds and ambiguous payment states as manual review instead of automatically granting or revoking access.
- Never place `STRIPE_SECRET_KEY` or `STRIPE_WEBHOOK_SECRET` in variables prefixed with `NEXT_PUBLIC_`.
- Run `npm run security:secrets` before publishing changes to catch accidentally tracked Stripe or Vercel credentials.
- Test successful payment, cancellation, duplicate webhook, refund, chargeback and failed payment in Stripe test mode.
- Keep `PAYMENTS_ENABLED=false` until test evidence and legal copy are reviewed.
- Live webhook events intentionally return an error until the durable entitlement provider is implemented, preventing paid orders from being silently acknowledged without fulfillment.

## Bookkeeping

- Record gross customer sales, Stripe fees, refunds and net bank payouts separately.
- Export Stripe payments, balance and payout reports and reconcile them with the bank account.
- Track GST turnover across all activities operated under the same sole trader ABN.
- Retain invoices and business records for the required period.

## Required environment contract

The repository includes placeholders in `.env.example`. Production secrets belong in the hosting provider’s encrypted environment settings. `PAYMENTS_ENTITLEMENT_STORE` must identify the approved server-side entitlement service before launch.

## Remaining actions before the first paid order

1. In Stripe test mode, create or replace the current server key with a restricted key and verify that Price retrieval plus Checkout Session create/retrieve requests succeed.
2. Add `STRIPE_WEBHOOK_SECRET` from a test webhook endpoint pointing to `/api/stripe/webhook`. Subscribe to `checkout.session.completed`, both `checkout.session.async_payment_*` events, `refund.created`, `refund.updated`, `refund.failed`, `charge.refunded`, and the dispute created/updated/closed/funds-reinstated events handled in code.
3. Set `PAYMENTS_ENABLED=true` only in a non-production environment and complete the test matrix above.
4. Apply `docs/entitlement-storage.sql` to the approved Neon database and verify the adapter in `src/lib/neonEntitlementStore.ts` with duplicate, refund and dispute test events. Production checkout remains hard-blocked until this test evidence exists.
5. Publish the legal seller name, ABN, support email, digital delivery terms and ACL-compatible refund process. Confirm GST treatment with a registered tax agent before enabling tax collection.
6. After those gates pass, create the equivalent live restricted key and live webhook endpoint, then enable production payments deliberately.

Do not enable Stripe automatic tax yet. It should only be enabled after the relevant registration is confirmed and recorded as Collecting in Stripe.

## Preview verification record

The protected Preview integration was verified on 17 August 2026 without enabling live payments:

- A Stripe test-mode Checkout completed for Resume Pro at AUD 19.90.
- The signed `checkout.session.completed` event reached the Preview webhook and returned HTTP 200.
- A request with an invalid Stripe signature was rejected with HTTP 400.
- The temporary Vercel automation bypass was revoked immediately after the test.
- The temporary Stripe test webhook endpoint was disabled and its bypass query value removed.

This record proves the Checkout-to-webhook path works in test mode. It is not approval to accept live payments; durable entitlements, customer restoration, legal seller details and live-mode credentials are still required.
