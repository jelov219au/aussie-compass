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
- [x] Start a private accounting register with the verified sale and full refund; unknown fee and payout values remain explicitly unconfirmed.
- [x] Add a read-only Balance Transactions exporter that requires a separate restricted accounting key and excludes customer details.

Production should not stay open if any identity, tax, access-delivery, refund or support check fails.

Do not start the controlled live purchase while the Stripe account status page shows an active identity task or paused payouts. An onboarding approval email does not override an active capability restriction shown in the Dashboard.

## 5. First-customer accounting handoff

The operational evidence pack is controlled outside this release branch. Do not copy customer documents, Stripe exports, bank evidence or the private workbook into this repository, a deployment artifact, a ticket or chat. Use the immutable accounting reference below to retrieve only the runbook/template version; store completed evidence in the approved private accounting location.

- Fixed reference: commit `162c96e1a82ec1f6f61295982dbd4529c8a879f4`
- 15-minute / 24-hour / first-payout runbook: `docs/first-live-customer-payment-runbook.md`
- Field and formula rules: `docs/managed-payments-first-live-evidence-form.md`
- Private workbook template: `outputs/01a01c79-be17-7031-9d5b-b5e0dd9ac50f/managed-payments-first-live-evidence.xlsx`
- Evidence owner: accounting operations records source evidence and reconciliation without customer details.
- Technical owner: the development team resolves webhook, entitlement, access or alert failures.
- Approval owner: the business owner alone records the second-sale decision; this reference does not authorise a payment, refund, customer contact or BAS lodgment.

Evidence timing and sales gate:

1. Within 15 minutes, link privacy-safe FP-/WH-/ENT- incident numbers to the live paid Resume Pro charge, signed webhook result, active entitlement, signed access, customer document title/issuer/seller display and operator alert.
2. Within 24 hours, retain the tax and Balance/Ending evidence, record `withheld_tax`, `fee_net_of_withheld_tax`, refund/credit note and closing balance exactly as reported, and keep unknown values as `MISSING` rather than zero.
3. At the first payout, match the itemised payout and bank arrival and complete the Stripe clearing reconciliation.
4. The first customer payment may proceed only after all pre-payment items in sections 1–4 pass. After that payment, a second Resume Pro sale remains `NO-GO` until required evidence has zero `MISSING`/`FAIL`, the cash difference is within ±A$0.01, access and operator alerts are confirmed, any refund is linked to credit-document and revocation evidence, the first payout is matched, and the business owner records `APPROVED`.

## 6. Live-key gate versus runtime compatibility

- `rk_live_` is the least-privilege launch requirement. For the first customer sale, a failing `npm run payments:check -- --strict` result is a deployment blocker; the earlier owner-controlled transaction does not waive this gate.
- Runtime acceptance of `sk_live_` prevents an environment-mode mismatch and preserves an incident-recovery path. It is compatibility behaviour, not launch approval and not a reason to mark the restricted-key item complete.
- Rotating keys, adding key IP restrictions and periodically reviewing Workbench request logs are ongoing security improvements after the least-privilege launch gate passes. They do not replace the pre-sale `rk_live_` requirement.
- The 15-minute / 24-hour / first-payout evidence sequence is not a blocker before the first customer payment because its evidence does not yet exist. It is an operational blocker for the second sale if the sequence is incomplete.
