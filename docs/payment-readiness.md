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
- Keep every paid workspace inaccessible on deployed builds until that server-verified access path is complete.

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
- Issue a signed, short-lived browser access session only after confirming an active server-side entitlement; never unlock a workspace from the success-page URL alone.
- Process each Stripe event once by claiming its event ID and updating the entitlement in the same database transaction.
- Compare Stripe event creation times before changing an existing entitlement. Ignore older events, and use `revoke > review > grant` when events share the same second so delayed delivery cannot reopen access after a refund or dispute.
- Treat partial refunds and ambiguous payment states as manual review instead of automatically granting or revoking access.
- Never place `STRIPE_SECRET_KEY` or `STRIPE_WEBHOOK_SECRET` in variables prefixed with `NEXT_PUBLIC_`.
- Sign access cookies with a separate `ENTITLEMENT_SESSION_SECRET` of at least 32 random characters and keep it server-only.
- Run `npm run security:secrets` before publishing changes to catch accidentally tracked Stripe or Vercel credentials.
- Test successful payment, cancellation, duplicate webhook, refund, chargeback and failed payment in Stripe test mode.
- Run `npm run test:entitlement-ordering` before publishing payment changes.
- Keep `PAYMENTS_ENABLED=false` until test evidence and legal copy are reviewed.
- Live webhook events intentionally return an error until the durable entitlement provider is implemented, preventing paid orders from being silently acknowledged without fulfillment.

## Bookkeeping

- Record gross customer sales, Stripe fees, refunds and net bank payouts separately.
- Export Stripe payments, balance and payout reports and reconcile them with the bank account.
- Track GST turnover across all activities operated under the same sole trader ABN.
- Retain invoices and business records for the required period.

## Required environment contract

The repository includes placeholders in `.env.example`. Production secrets belong in the hosting provider’s encrypted environment settings. `PAYMENTS_ENTITLEMENT_STORE` must identify the approved server-side entitlement service before launch. The app accepts the manual `ENTITLEMENT_DB_URL` override or Vercel Neon's managed `ENTITLEMENT_DB_DATABASE_URL`; do not copy the managed connection string into a second variable.

## Remaining actions before the first paid order

1. In Stripe test mode, create or replace the current server key with a restricted key and verify that Price retrieval plus Checkout Session create/retrieve requests succeed.
2. Add `STRIPE_WEBHOOK_SECRET` from a test webhook endpoint pointing to `/api/stripe/webhook`. Subscribe to `checkout.session.completed`, both `checkout.session.async_payment_*` events, `refund.created`, `refund.updated`, `refund.failed`, `charge.refunded`, and the dispute created/updated/closed/funds-reinstated events handled in code.
3. Set `PAYMENTS_ENABLED=true` only in a non-production environment and complete the test matrix above.
4. Apply `docs/entitlement-storage.sql` to the approved Neon database and verify the adapter in `src/lib/neonEntitlementStore.ts` with duplicate, refund and dispute test events. Production checkout remains hard-blocked until this test evidence exists.
5. Add `ENTITLEMENT_SESSION_SECRET` to the approved Preview environment, then verify access activation, revoked-entitlement blocking, one-time recovery-code consumption and expiry. Resume Pro remains fail-closed on deployed builds until the secret is configured and those tests pass.
6. Publish the legal seller name, ABN, support email, digital delivery terms and ACL-compatible refund process. Confirm GST treatment with a registered tax agent before enabling tax collection.
7. After those gates pass, create the equivalent live restricted key and live webhook endpoint, then enable production payments deliberately.

Do not enable Stripe automatic tax yet. It should only be enabled after the relevant registration is confirmed and recorded as Collecting in Stripe.

## Preview verification record

The protected Preview integration was verified on 18 August 2026 without enabling live payments:

- A Stripe test-mode Checkout completed for Resume Pro at AUD 19.90.
- Stripe manually resent that real `checkout.session.completed` event to the protected Preview webhook.
- The signed event returned HTTP 200 with `persisted: true` and `outcome: "processed"`.
- Repeated delivery of the same Stripe event returned HTTP 200 with `outcome: "duplicate"`.
- Neon contained one webhook-event row and one active Resume Pro entitlement for the Checkout Session after all three deliveries.
- The entitlement ordering migration was applied on 18 August 2026. The existing row was backfilled with its Stripe event creation time, the timestamp column was verified non-null, and the database routine was verified to return `ignored_stale` for events that must not replace a newer state.
- A full AUD 19.90 Stripe test-mode refund then delivered `charge.refunded`, `refund.created` and `refund.updated` to the protected Preview endpoint. All three signed deliveries returned HTTP 200 and the entitlement remained inaccessible in `review` after the final refund update.
- Resending the original Checkout event returned `duplicate` and did not restore access. A separate transaction-only database regression used a different older event ID, returned `ignored_stale`, preserved the blocked state and was rolled back with zero test rows left behind.
- A request with an invalid Stripe signature was rejected with HTTP 400 during the earlier endpoint verification.
- The temporary Vercel automation bypass was removed, and a fresh unauthenticated request to the Preview webhook was redirected to Vercel authentication.
- The Stripe test webhook endpoint was disabled and its URL was stripped of the bypass query value. Its signing secret remains connected to the branch-scoped Preview environment for future controlled tests.

This record proves the Checkout-to-webhook path and durable entitlement idempotency work in test mode. It is not approval to accept live payments; signed customer access sessions, purchase restoration, legal seller details and live-mode credentials are still required.
