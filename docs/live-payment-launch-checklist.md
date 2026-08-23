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
- [x] Confirm the public business name, website, support phone and a recognisable statement descriptor are present. Read-only live Account evidence was recorded on 24 August 2026 without copying their values.
- [ ] Add `support@hojucompass.com` as the Stripe live business-profile support email. The read-only Account result on 24 August 2026 reported it absent; the site and Vercel support setting do not substitute for this Stripe field.
- [x] Create an active one-time AUD 19.90 Resume Pro Price.
- [ ] Create a least-privilege `rk_live_` key with Prices Read, Products Read, Checkout Sessions create/retrieve and PaymentIntents Read so the paid webhook can verify `latest_charge` before the atomic grant.
- [x] Create the live `/api/stripe/webhook` endpoint and subscribe to the same 11 Checkout, refund and dispute events verified in test mode.
- [ ] Configure Production payment operator alerts, confirm the support mailbox is monitored, and receive controlled purchase/refund alerts before accepting a customer payment.
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
- [x] With payments off, confirm the exact migration order and versions: charge-link v2 → `20260823_payment_operator_alert_outbox_v1` → `20260823_checkout_activation_nonce_v1` → `20260823_purchase_access_sessions_v1` → `20260823_restore_activation_nonce_v1`. The complete named version/signature result is recorded in `docs/production-first-sale-readiness-audit-2026-08-24.md`; functional response-loss, release and restore proof remains separately required below.
- [ ] Apply and verify `20260824_entitlement_link_conflict_v1` in Production after an owner-approved backup window. The isolated rehearsal found SQLSTATE `42702` in the unqualified PaymentIntent/Charge conflict target; payments stay off until the forward fix and paid-event rehearsal pass.
- [x] Run the catalog and effective-privilege evidence in `docs/first-sale-gate-runbook.md`: every named result, including the approved 12-/7-/6-argument functions, protected-table denials, wrapper grants and `all_privilege_checks_pass`, returned true on 24 August 2026. See the complete matrix in `docs/production-first-sale-readiness-audit-2026-08-24.md`.
- [x] Confirm live Resume Pro has zero existing open Checkout Sessions. The read-only Stripe list on 24 August 2026 returned zero total open sessions, zero Resume Pro open sessions and `has_more=false`.
- [ ] Prove one nonce binding, same-browser response-loss retry, different-nonce denial, permanent release, refund/review denial and independent restore-code recovery on the post-migration Production schema. The current gate, gate-event, outbox, access-session and restore-activation row counts are all zero and therefore do not prove functional behavior.
- [ ] Record suffix-only functional evidence that the issued activation/restore access session is active, unexpired and unrevoked. Record `created_at`, `expires_at` and `revoked_at` as evidence times without copying the raw session ID, cookie, customer email or full Stripe ID.
- [ ] Confirm outbox pending/sent/attempt counts, SMTP failure 503, busy-worker 503, stale-lease recovery and actual purchase/refund mailbox receipt using suffix-only evidence.
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

Before enabling the gate, verify in the matching Stripe mode that Resume Pro has zero existing open Checkout Sessions. Explicitly expire every pre-gate Session and retain non-sensitive expiry evidence; an old payable URL is a launch blocker. The runtime database role must have function `EXECUTE` only for claim/attach/verified release/atomic paid processing, no direct first-sale table DML, and no `approve_next_first_sale` access.

## 6. Live-key gate versus runtime compatibility

- `rk_live_` is the least-privilege launch requirement. For the first customer sale, a failing `npm run payments:check -- --strict` result is a deployment blocker; the earlier owner-controlled transaction does not waive this gate.
- Runtime acceptance of `sk_live_` prevents an environment-mode mismatch and preserves an incident-recovery path. It is compatibility behaviour, not launch approval and not a reason to mark the restricted-key item complete.
- Rotating keys, adding key IP restrictions and periodically reviewing Workbench request logs are ongoing security improvements after the least-privilege launch gate passes. They do not replace the pre-sale `rk_live_` requirement.
- The 15-minute / 24-hour / first-payout evidence sequence is not a blocker before the first customer payment because its evidence does not yet exist. It is an operational blocker for the second sale if the sequence is incomplete.
- The runtime key must include Prices Read, Products Read, Checkout Sessions create/retrieve and PaymentIntents Read. A 403, timeout, missing `latest_charge`, or PaymentIntent contract mismatch is intentionally fail-closed: HTTP 503, no gate lock, no grant and an operator investigation path.

## 7. Fourteen-day first-customer conversion watch

Starting observation, supplied by the operator rather than fetched during this review: the previous 28 days show 1 Resume Pro visit, 0 Checkout starts and 0 customer purchases. Builder-start and Pro-CTA baselines were not supplied; record them as `N/A`, not zero. These are observations, not targets or forecasts.

Check the same Australia/Sydney reporting window once each day after deployment. Use aggregate counts only; do not record names, emails, Stripe IDs or customer-level paths.

| Funnel step | Daily minimum record | Existing source or honest proxy |
| --- | --- | --- |
| Unique landing visits | Unique visitors to the selected high-intent landing routes | Vercel route-level unique visitors; use `N/A` if a unique count is unavailable and never substitute pageviews silently |
| Builder start | `Resume Builder Started` | Fixed `surface` and `context`; fires on the first real Builder interaction and is not a passive route-view proxy |
| Pro CTA | `Resume Pro CTA Clicked` | Fixed `surface` and `context`; keep it separate from older `Pro Interest` observations |
| Resume Pro visit | `Resume Pro Viewed` | Fixed allowlisted `entry` plus checkout available/unavailable state |
| One-time launch notice intent | `Resume Pro Launch Interest` | Fixed allowlisted `entry`; records only the mail-app link click, never the email address or message body |
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
2. **Reach gate:** if a candidate acquisition entry has fewer than 10 cumulative `Resume Pro Viewed` events, conversion is not interpretable. Keep A$19.90 and the offer copy unchanged; the only allowed experiment is one no-cost organic channel or landing distribution change for the next review window. A launch-notice click is a useful opt-in signal, not a conversion-rate denominator by itself.
3. **Message gate:** with at least 10 Resume Pro views but zero Checkout starts, keep the price and channel fixed and change one value/CTA or trust sentence. Do not change the page and acquisition source together.
4. **Price gate:** one or two Checkout starts without a purchase is still `HOLD` for price. Only at the day-14 review, after at least 3 Checkout starts and zero paid completions, and after excluding technical, access and seller-trust failures, may the owner choose one price test **or** one checkout-terms/copy test. Never change both in the same window.
5. **Customer-payment gate:** when the first genuine customer payment completes, stop conversion changes and pause acceptance of a second sale. Run the 15-minute, 24-hour and first-payout evidence sequence in section 5. Resume selling only after the accounting system gate is `GO` and the business owner records `APPROVED`.

Channel changes in this 14-day watch mean unpaid distribution through an existing owned or community route that already permits the post. This table does not authorise advertising spend, a new tracking service, unsolicited messages or paid placement.

## 8. Opt-in first-customer invitation

The one-time launch-notice email is a customer-initiated request, not a mailing
list. Reply only after every pre-payment item in sections 1–4 is PASS and the
owner records a single-customer launch approval.

1. Confirm the request came from the Resume Pro launch-notice subject and the
   sender supplied a target role, an application deadline and whether a free
   Builder draft exists. Do not ask for the resume file, visa details, TFN,
   identity documents, address or payment information.
2. Prioritize a person with one public job ad, a real career draft and a
   deadline within seven days. This is a fit check, not a promise of hiring,
   visa, legal or professional outcomes.
3. Immediately before replying, re-run the live zero-open-Checkout check,
   target-environment strict payment audit and database named-result matrix.
   Keep `PAYMENTS_ENABLED=false` if any result is missing or false.
4. Send one reply from `support@hojucompass.com` only after the product page is
   live and Checkout is deliberately enabled. Link to
   `https://hojucompass.com/resume-pro`; never email a raw Stripe Checkout URL.
5. Do not contact other requesters or send a second reminder until the first
   customer either completes payment or explicitly declines and the attached
   Checkout is confirmed expired, unpaid and without a PaymentIntent.
6. Once paid, stop invitations and run the 15-minute, 24-hour and first-payout
   evidence sequence. The database gate, not an email timestamp, is the
   concurrency authority.

Suggested single reply after approval:

> Resume Pro 판매가 시작되어 요청하신 1회 안내를 드립니다. 결제 전 가격,
> 제공 범위와 환불 안내를 확인한 뒤 공식 Resume Pro 페이지에서 진행해
> 주세요. 이 메일에는 이력서 원문이나 민감정보를 보내지 마세요. 이번
> 안내 뒤 추가 홍보 메일은 보내지 않습니다.
