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
- In non-production environments, use only `sk_test_` keys. In production, use only `sk_live_` keys.
- Validate the configured Resume Pro price server-side as active, one-time, AUD 19.90 before redirecting.
- Enable Managed Payments explicitly for each Checkout Session after confirming product eligibility.
- Verify signed Stripe webhooks before granting access.
- Store only the minimum entitlement record needed to restore access.
- Never place `STRIPE_SECRET_KEY` or `STRIPE_WEBHOOK_SECRET` in variables prefixed with `NEXT_PUBLIC_`.
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
