# Hoju Compass payment readiness

Resume Pro is a one-time AUD 19.90 product sold by an Australian sole trader. Production payments were opened after the controlled live purchase, access-delivery and full-refund test passed on 20 August 2026. The remaining owner and bookkeeping checks below still need ongoing review.

## Owner-only setup

- Create and verify the Stripe account as an Individual / Sole trader.
- Enter the legal name, ABN, identity document and Australian payout bank account directly in Stripe.
- Keep the registered business name (`Hoju Compass`) separate from the sole trader's legal seller name. The customer-facing purchase page must show both without hardcoding either person's private details into source control.
- Never send identity documents, bank details or secret keys through chat, source control or client-side environment variables.
- Create a separate business bank account where practical and confirm the ABN entity, GST registration status and how Managed Payments payouts, fees and tax documents should be recorded with a registered tax agent.

## Product and customer protection

- Keep the existing resume builder and PDF output free.
- State the full AUD price before checkout and identify the purchase as one-time, not recurring.
- Require the customer to acknowledge the current purchase and privacy notices before creating Checkout, and record only the notice version in Stripe metadata rather than copying the page contents into payment records.
- Publish seller identity, ABN, support contact, delivery method, refund process, privacy notice and terms before accepting money.
- Do not use “no refunds”. Australian Consumer Law rights must remain available.
- Provide a self-service way to restore a purchase on another device and revoke access after a refund or chargeback.
- Keep every paid workspace inaccessible on deployed builds until that server-verified access path is complete.

## Technical launch gates

- Use Stripe-hosted Checkout so Hoju Compass never receives raw card details.
- Create Checkout Sessions only on the server.
- In non-production environments, use only test keys (`rk_test_` preferred, `sk_test_` supported). In production, use only live keys (`rk_live_` preferred, `sk_live_` supported).
- Prefer least-privilege restricted keys (`rk_test_` / `rk_live_`) and grant only the Checkout Session and Price access used by this integration. Review Stripe request logs before adding permissions.
- Validate each configured price server-side before redirecting: Resume Pro must be active, one-time AUD 19.90; Rental Application Pack Pro must be active, one-time AUD 14.90; Pay Evidence Pro must be active, one-time AUD 9.90.
- Enable Managed Payments explicitly for each Checkout Session after confirming product eligibility.
- Add a unique, product-specific Checkout `integration_identifier` so sessions can be filtered in Stripe Workbench.
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
- Run `npm run test:entitlement-commands` to verify paid, unpaid, asynchronous, refund and dispute events map to the intended access state.
- Run `npm run test:resume-pro-tokens` to verify signed-session tamper resistance, expiry, revoked-access blocking and restore-code hashing.
- Run `npm run test:rental-pro-tokens` to apply the same signed-session and recovery-code checks to Rental Application Pack Pro.
- Run `npm run test:pay-evidence-tokens` to apply the same signed-session, expiry and recovery-code checks to Pay Evidence Pro.
- Run `npm run test:stripe-contract` to prevent accidental removal of Checkout consent, server-side price validation, dynamic payment methods or webhook signature checks.
- Run `npm run payments:check -- --strict` inside the target deployment environment. It reports only pass/wait states and never prints credentials, connection strings, legal names or the ABN.
- Keep `PAYMENTS_ENABLED=false` until test evidence and legal copy are reviewed.
- Keep live payments disabled until the durable Neon entitlement store, live webhook secret and live-mode recovery flow are configured together and verified with a controlled purchase.

## Bookkeeping

- Record gross customer sales, Stripe fees, refunds and net bank payouts separately.
- Keep the original Stripe Balance/Payout reconciliation export and bank evidence outside the repository, and update the private accounting register without customer details.
- Export Stripe payments, balance and payout reports and reconcile them with the bank account.
- Track GST turnover across all activities operated under the same sole trader ABN.
- Retain invoices and business records for the required period.

## Required environment contract

The repository includes placeholders in `.env.example`. Production secrets belong in the hosting provider’s encrypted environment settings. The registered site name `Hoju Compass` is the default customer-facing business name; `BUSINESS_TRADING_NAME` is only an optional override. `BUSINESS_LEGAL_NAME` is the underlying legal seller and must never be hardcoded. `PAYMENTS_ENTITLEMENT_STORE` must identify the approved server-side entitlement service before launch. The app accepts the manual `ENTITLEMENT_DB_URL` override or Vercel Neon's managed `ENTITLEMENT_DB_DATABASE_URL`; do not copy the managed connection string into a second variable.

Rental Application Pack Pro additionally requires `STRIPE_RENTAL_PRO_PRICE_ID`. Its public Checkout stays unavailable unless the shared payment gates and this product-specific Price gate all pass. Adding the variable is not permission to sell: apply the Rental product-code constraint in Preview first, complete the test purchase/recovery/refund exercise, and repeat a controlled live purchase/full refund before changing its public status.

Pay Evidence Pro additionally requires `STRIPE_PAY_EVIDENCE_PRO_PRICE_ID`. Its public Checkout stays unavailable unless the shared payment gates and its product-specific Price gate all pass. Adding the variable is not permission to sell: keep Production disabled until the live Price, signed webhook, durable entitlement, recovery and refund paths have each been verified.

Car Buy Pack Pro additionally requires `STRIPE_CAR_BUY_PRO_PRICE_ID`. Its Checkout remains closed while that variable is absent. Before adding it, apply the `car_buy_pro` entitlement constraint in Preview, then verify one test purchase, access activation, one-time recovery and full-refund revocation. Production sale is a separate approval after those checks pass.

## Post-launch owner actions

1. Run the target-environment launch audit with `npm run payments:check -- --strict` after any payment-setting change. Replace the full live key with a least-privilege restricted key when its required Checkout and Price permissions are confirmed.
2. Repeat the completed protected-Preview customer-access test after any change to the webhook, entitlement schema, access cookie or recovery-code flow. Recovery-code expiry remains covered by the deterministic token test because the deployed code lasts 30 days.
3. Add `BUSINESS_LEGAL_NAME`, `BUSINESS_ABN` and `NEXT_PUBLIC_SUPPORT_EMAIL` to Vercel without pasting the sole trader's private details into chat or source control. Confirm the purchase page shows the registered business name and legal seller as separate fields. Add `BUSINESS_TRADING_NAME` only if the displayed business name must differ from `Hoju Compass`.
4. Confirm the ABN/GST status through the Australian Business Register and with a registered tax agent. Verify that live Managed Payments continues to show Stripe as the tax-liability party and ask how the gross sale, GST shown by Stripe, fees and payout belong in the sole trader's records.
5. Finish the Stripe live-mode business profile, statement descriptor, customer support details and payout bank verification. Create the live restricted key, live Resume Pro Price and live webhook endpoint with the same event subscriptions verified in Preview.
6. Reconcile the controlled live purchase, Stripe fee and full refund with the first Stripe balance and payout reports.
   The private accounting register now contains the verified A$19.90 sale and full refund. Stripe fee, credit-document tax reversal and bank payout remain blank until supported by the source reports.
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

## Rental Application Pack Preview verification record

The protected Rental Application Pack Pro Preview integration was verified on 21 August 2026 without enabling Production payments:

- A Stripe Sandbox product and one-time AUD 14.90 inclusive Price were created for `rental_application_pro` using the personal-use SaaS tax code.
- Managed Payments test Checkout included AUD 1.35 GST inside the AUD 14.90 total and reported Stripe as the automatic-tax liability party.
- A signed `checkout.session.completed` delivery reached the protected Preview webhook with HTTP 200 and created the active Neon entitlement.
- The paid success page exposed the activation action only after the persisted entitlement existed. Activation issued the signed browser session and opened `/rental-application-pro/workspace`.
- Releasing the current device blocked direct workspace access. A 30-day one-time recovery code restored access once and a second use was rejected.
- A full AUD 14.90 test refund delivered `refund.created`, `charge.refunded` and `refund.updated` with HTTP 200. The charge event revoked the entitlement and removed the workspace activation action.
- The success page was updated to distinguish a revoked entitlement from a webhook still being processed, and now identifies the refund or cancellation state directly.
- Both Sandbox verification payments were fully refunded. The temporary Stripe webhook was disabled and every temporary Vercel automation bypass was revoked after the test.
- No Production price, payment gate, webhook, entitlement or deployment setting was changed during this verification.

No customer email, card detail, legal name, ABN, secret key, webhook secret, Vercel bypass value or database connection string is recorded in this verification note.

## Pay Evidence Pro Preview verification record

The protected Pay Evidence Pro Preview grant path was verified on 21 August 2026 without enabling Production payments:

- A Stripe Sandbox product and one-time AUD 9.90 inclusive Price were created for `pay_evidence_pro` using the personal-use SaaS tax code.
- Managed Payments test Checkout included AUD 0.90 GST inside the AUD 9.90 total and reported Stripe as the automatic-tax liability party.
- The paid return page remained locked until a real signed `checkout.session.completed` event was delivered to the protected Preview webhook.
- The final delivery returned HTTP 200 with `received: true`, `persisted: true` and `outcome: "processed"`.
- Neon recorded one processed webhook event and an active `pay_evidence_pro` entitlement for the paid Checkout Session.
- The success page then exposed the activation action, issued a signed browser session and opened `/pay-evidence-pro/workspace` with the purchased-workspace state visible.
- The product constraint, product-isolation contract, signed-session tamper resistance, expiry, revoked-access blocking and hashed one-time recovery-code behavior passed the automated entitlement and token checks.
- A 30-day, one-time recovery code restored access after the original device session was released, and a second use of the same code was rejected.
- A full AUD 9.90 Sandbox refund delivered `refund.created`, `charge.refunded` and `refund.updated`; all three events were processed without failure and the charge event changed the `pay_evidence_pro` entitlement to `revoked`.
- The existing workspace session then redirected to `access=required`, confirming that refunded access could not continue.
- Temporary Stripe Sandbox webhook destinations were disabled after validation, bypass values were stripped from their URLs, every temporary Vercel automation bypass was revoked, and the branch-only webhook secret override was removed.
- No Production Price, payment gate, webhook, entitlement or deployment setting was changed.

No customer email, card detail, legal name, ABN, secret key, webhook secret, Vercel bypass value or database connection string is recorded in this verification note.

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
