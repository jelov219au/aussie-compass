# Hoju Compass live payment launch checklist

This is the short owner checklist for opening Resume Pro payments. Keep legal names, ABNs, bank details and credentials out of chat and source control; enter them directly in Stripe, Vercel or the relevant government service.

## 1. Business identity

- [x] Register the business name `Hoju Compass` and save the ASIC Record of Registration.
- [ ] Confirm that ABN Lookup shows the expected sole-trader entity, registered business name and current GST status.
- [ ] Confirm the legal seller name and GST treatment with a registered tax agent.
- [ ] Use a monitored support email that customers can reply to.

## 2. Vercel seller settings

Add these only through encrypted environment settings:

- `BUSINESS_TRADING_NAME` — optional; leave unset to use the registered site name `Hoju Compass`.
- [ ] `BUSINESS_LEGAL_NAME` — underlying sole-trader legal seller.
- [ ] `BUSINESS_ABN` — 11 digits; spacing is optional.
- [ ] `NEXT_PUBLIC_SUPPORT_EMAIL` — published support contact.

Run `npm run payments:check -- --strict` in the target environment. The command shows only pass/wait results and does not print the stored values.

## 3. Stripe live settings

- [ ] Complete identity and Australian payout-bank verification.
- [ ] Set the public business name, support email, website and a recognisable statement descriptor.
- [ ] Create an active one-time AUD 19.90 Resume Pro Price.
- [ ] Create a least-privilege `rk_live_` key that can retrieve Prices and create/retrieve Checkout Sessions.
- [ ] Create the live `/api/stripe/webhook` endpoint and subscribe to the same Checkout, refund and dispute events verified in test mode.
- [ ] Store the live key, Price ID and webhook signing secret only in Vercel Production.
- [ ] Leave Stripe automatic tax off until GST registration and tax treatment are confirmed. If it is later enabled, first confirm the Australian registration is shown as Collecting in Stripe.

## 4. Final controlled test

- [ ] Confirm the purchase page shows the business name, legal seller, ABN, support contact, price, digital-delivery method and ACL-compatible refund process.
- [ ] Confirm Production still fails closed before the deliberate launch switch is enabled.
- [ ] Enable Production payments for the controlled test.
- [ ] Make one real purchase through the public customer path.
- [ ] Confirm the entitlement opens the Resume Pro workspace and the receipt wording is correct.
- [ ] Issue a full refund in Stripe and confirm the entitlement is blocked.
- [ ] Reconcile the gross sale, Stripe fee, refund and bank payout record.

Production should not stay open if any identity, tax, access-delivery, refund or support check fails.
