# Hoju Compass live payment launch checklist

This is the short owner checklist for opening Resume Pro payments. Keep legal names, ABNs, bank details and credentials out of chat and source control; enter them directly in Stripe, Vercel or the relevant government service.

## 1. Business identity

- [x] Register the business name `Hoju Compass` and save the ASIC Record of Registration.
- [ ] Confirm that ABN Lookup shows the expected sole-trader entity, registered business name and current GST status.
- [ ] Confirm the legal seller name and how Managed Payments sales, GST documents, fees and payouts should be recorded with a registered tax agent.
- [x] Use a monitored support email that customers can reply to (`support@hojucompass.com`).

## 2. Vercel seller settings

Add these only through encrypted environment settings:

- `BUSINESS_TRADING_NAME` — optional; leave unset to use the registered site name `Hoju Compass`.
- [x] `BUSINESS_LEGAL_NAME` — underlying sole-trader legal seller.
- [x] `BUSINESS_ABN` — 11 digits; spacing is optional.
- [x] `NEXT_PUBLIC_SUPPORT_EMAIL` — published support contact.

Run `npm run payments:check -- --strict` in the target environment. The command shows only pass/wait results and does not print the stored values.

- [x] Connect the existing Neon entitlement database to Production with sensitive `ENTITLEMENT_DB_*` variables.
- [x] Store a separate Production `ENTITLEMENT_SESSION_SECRET` and set `PAYMENTS_ENTITLEMENT_STORE=neon`.
- [x] Keep the Production launch switch explicitly locked with `PAYMENTS_ENABLED=false` during setup. It was enabled only after the controlled live purchase and refund passed on 20 August 2026.

## 3. Stripe live settings

- [x] Complete the live account representative identity-document task. Rechecked on 20 August 2026: the account status page shows no active tasks and payment activation is complete.
- [x] Confirm the paused-payout warning is no longer shown after identity review.
- [ ] Set the public business name, support email, website and a recognisable statement descriptor.
- [x] Create an active one-time AUD 19.90 Resume Pro Price.
- [ ] Create a least-privilege `rk_live_` key that can retrieve Prices and create/retrieve Checkout Sessions.
- [x] Create the live `/api/stripe/webhook` endpoint and subscribe to the same 11 Checkout, refund and dispute events verified in test mode.
- [x] Store the live key, Price ID and webhook signing secret only in Vercel Production. Replacing the full live key with a least-privilege restricted key remains a security follow-up.
- [x] Do not add a separate app-controlled automatic-tax setting or manual tax rate. The controlled live Checkout included AUD 1.81 GST inside the AUD 19.90 total under Managed Payments.

## 4. Final controlled test

- [x] Confirm the purchase page shows the business name, legal seller, ABN, support contact, price, digital-delivery method and ACL-compatible refund process.
- [x] Confirm Checkout links the versioned service terms, purchase information and privacy notice before payment.
- [x] Confirm Production still fails closed before the deliberate launch switch is enabled.
- [x] Enable Production payments for the controlled test.
- [x] Make one real purchase through the public customer path.
- [x] Confirm the signed live webhook persists the entitlement and the Resume Pro workspace opens only after that entitlement exists.
- [x] Issue a full AUD 19.90 refund in Stripe; `refund.created` and `charge.refunded` both returned HTTP 200 and the workspace was blocked immediately.
- [ ] Reconcile the gross sale, Stripe fee, refund and bank payout record.

Production should not stay open if any identity, tax, access-delivery, refund or support check fails.

Do not start the controlled live purchase while the Stripe account status page shows an active identity task or paused payouts. An onboarding approval email does not override an active capability restriction shown in the Dashboard.
