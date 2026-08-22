# Hoju Compass live payment launch checklist

This is the short owner checklist for opening Resume Pro payments. Keep legal names, ABNs, bank details and credentials out of chat and source control; enter them directly in Stripe, Vercel or the relevant government service.

## 1. Business identity

- [x] Register the business name `Hoju Compass` and save the ASIC Record of Registration.
- [ ] Confirm that ABN Lookup shows the expected sole-trader entity, registered business name and current GST status.
- [ ] Confirm the sole trader's legal/registered product-provider name and how Managed Payments sales, GST documents, fees and payouts should be recorded with a registered tax agent. Do not treat that name as the transaction seller unless the actual Checkout and receipt show it.
- [x] Use a monitored support email that customers can reply to (`support@hojucompass.com`).

## 2. Vercel product-provider settings

Add these only through encrypted environment settings:

- `BUSINESS_TRADING_NAME` — optional; leave unset to use the registered site name `Hoju Compass`.
- [x] `BUSINESS_LEGAL_NAME` — legal/registered name of the Hoju Compass product provider; it does not configure or prove the Managed Payments transaction seller.
- [x] `BUSINESS_ABN` — 11 digits; spacing is optional.
- [x] `NEXT_PUBLIC_SUPPORT_EMAIL` — published support contact.

Run `npm run payments:check -- --strict` in the target environment. The command shows only pass/wait results and does not print the stored values.

The app's `sellerDetailsConfigured` check confirms that the public product-provider name and ABN are present. It is not a Merchant of Record check. Verify the transaction seller, document issuer and transaction-support route separately on the real Managed Payments Checkout and receipt/invoice, preserving the exact displayed wording.

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

- [x] Confirm the purchase page shows the Hoju Compass product business name, legal/registered product-provider name, ABN, product support contact, price, digital-delivery method and ACL-compatible refund process.
- [ ] Confirm the controlled live Checkout and issued receipt/invoice separately identify the customer-visible transaction seller, document issuer and transaction-support route; do not infer these from `BUSINESS_*`. The 20 August retrospective evidence leaves these fields unconfirmed.
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

The implementation acceptance contract for this control is `OPEN → RESERVED → SOLD → LOCKED` in `docs/first-payment-24-hour-operations-packet.md`. A pre-Checkout atomic reservation must admit one request only; a verified paid event must lock later Checkouts; abandoned reservations require confirmed expiry and no payment; refunds never reopen sales; and only complete 15-minute, 24-hour and first-payout evidence plus an explicit owner approval may move `LOCKED → OPEN`. Operator alerts and a later manual `PAYMENTS_ENABLED=false` deployment are defence-in-depth, not the first-sale concurrency control.

## 6. Live-key gate versus runtime compatibility

- `rk_live_` is the least-privilege launch requirement. For the first customer sale, a failing `npm run payments:check -- --strict` result is a deployment blocker; the earlier owner-controlled transaction does not waive this gate.
- Runtime acceptance of `sk_live_` prevents an environment-mode mismatch and preserves an incident-recovery path. It is compatibility behaviour, not launch approval and not a reason to mark the restricted-key item complete.
- Rotating keys, adding key IP restrictions and periodically reviewing Workbench request logs are ongoing security improvements after the least-privilege launch gate passes. They do not replace the pre-sale `rk_live_` requirement.
- The 15-minute / 24-hour / first-payout evidence sequence is not a blocker before the first customer payment because its evidence does not yet exist. It is an operational blocker for the second sale if the sequence is incomplete.

## 7. Fourteen-day first-customer conversion watch

Starting observation, supplied by the operator rather than fetched during this review: the previous 28 days show 1 Resume Pro visit, 0 Checkout starts and 0 customer purchases. Builder-start and Pro-CTA baselines were not supplied; record them as `N/A`, not zero. These are observations, not targets or forecasts.

Check the same Australia/Sydney reporting window once each day after deployment. Use aggregate counts only; do not record names, emails, Stripe IDs or customer-level paths.

| Funnel step | Daily minimum record | Existing source or honest proxy |
| --- | --- | --- |
| Unique landing visits | Unique visitors to the selected high-intent landing routes | Vercel route-level unique visitors; use `N/A` if a unique count is unavailable and never substitute pageviews silently |
| Builder start | Unique visitors who opened `/resume-builder` | Route visit is a proxy because there is no dedicated Builder-start event; do not label it as first-field interaction |
| Pro CTA | `Pro Interest` for `product=resume_pro`, plus article next-step events whose destination is `resume_pro` | Report the two event families separately if they cannot be de-duplicated |
| Checkout start | `Checkout Started` where `product=resume_pro` | Existing anonymous Vercel event; compare only with the same date and acquisition entry |
| Completed purchase | Live, paid, complete Resume Pro Checkout at A$19.90 | Read-only Stripe aggregate; exclude test and owner-controlled transactions and show refunds separately |

Because some stages use unique-route proxies and others use event counts, any calculated rate is directional until all stages share a consistent unique-count basis.

| Day | Unique landing | Builder-start proxy | Pro CTA | Checkout start | Paid customer | Note / data gap |
| ---: | ---: | ---: | ---: | ---: | ---: | --- |
| 1 | — | — | — | — | — | |
| 2 | — | — | — | — | — | |
| 3 | — | — | — | — | — | |
| 4 | — | — | — | — | — | |
| 5 | — | — | — | — | — | |
| 6 | — | — | — | — | — | |
| 7 | — | — | — | — | — | Decision review; change at most one variable |
| 8 | — | — | — | — | — | |
| 9 | — | — | — | — | — | |
| 10 | — | — | — | — | — | |
| 11 | — | — | — | — | — | |
| 12 | — | — | — | — | — | |
| 13 | — | — | — | — | — | |
| 14 | — | — | — | — | — | Final review; record HOLD or one next change |

### Sample hold and single-decision rule

The numbers below are decision floors, not sales goals, promised conversion rates or advertising targets. Make decisions only on day 7 and day 14; daily checks detect outages and data gaps, not reasons to keep changing the offer.

1. **Data gate:** if a required stage is `N/A`, live/test traffic is mixed, or a technical checkout/access incident is unresolved, record `HOLD`. Change no price, copy or channel.
2. **Reach gate:** if a candidate acquisition entry has fewer than 10 cumulative `Resume Pro Viewed` events, conversion is not interpretable. Keep A$19.90 and the offer copy unchanged; the only allowed experiment is one no-cost organic channel or landing distribution change for the next review window.
3. **Message gate:** with at least 10 Resume Pro views but zero Checkout starts, keep the price and channel fixed and change one value/CTA or trust sentence. Do not change the page and acquisition source together.
4. **Price gate:** one or two Checkout starts without a purchase is still `HOLD` for price. Only at the day-14 review, after at least 3 Checkout starts and zero paid completions, and after excluding technical, access and seller-trust failures, may the owner choose one price test **or** one checkout-terms/copy test. Never change both in the same window.
5. **Customer-payment gate:** when the first genuine customer payment completes, stop conversion changes and pause acceptance of a second sale. Run the 15-minute, 24-hour and first-payout evidence sequence in section 5. Resume selling only after the accounting system gate is `GO` and the business owner records `APPROVED`.

Channel changes in this 14-day watch mean unpaid distribution through an existing owned or community route that already permits the post. This table does not authorise advertising spend, a new tracking service, unsolicited messages or paid placement.
