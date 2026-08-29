# Hoju Compass live payment launch checklist

This is the short owner checklist for opening Resume Pro payments. Keep legal names, ABNs, bank details and credentials out of chat and source control; enter them directly in Stripe, Vercel or the relevant government service.

## 0. Production deployment identity

- [ ] Immediately before the release audit, obtain the reviewed application's full candidate SHA with `git rev-parse HEAD`, confirm the working tree is clean, and pass that exact value as `-ExpectedProductionSha <full-owner-approved-sha>`; never copy a candidate SHA permanently into this checklist. Separately read the current Production Source SHA from Vercel. Do not mark deployment identity complete until the two full values exactly match. Any later commit creates a new candidate and requires the exact-SHA checks to restart. The ancestry boundary remains `git merge-base --is-ancestor 2f886c2 <production-source-sha>`; a successful Vercel status on a commit alone is never sufficient.
- [ ] Initial baseline only: with `PAYMENTS_ENABLED=false` and `STRIPE_MANAGED_PAYMENTS_ENABLED=false`, prove the exact-SHA Production origin and public Production pages match that candidate. The controlled Checkout check must return HTTP 503 `checkout_unavailable` without a Checkout URL. This baseline does not satisfy the executable preflight; the next phase keeps `PAYMENTS_ENABLED=false`, changes only `STRIPE_MANAGED_PAYMENTS_ENABLED=true`, redeploys the same approved SHA and repeats this exact-SHA Checkout-off proof.
- [ ] Retain the non-secret exact canonical `PRODUCTION_DEPLOYMENT_EVIDENCE=PASS source_sha=exact environment=production deployment=success origins=same-dpl-id public_markers=verified payments=off secrets_printed=no`. Historical evidence for an earlier Production SHA does not satisfy this release. This completes deployment identity only; it does not satisfy the restricted-key preflight, SMTP receipt or Production functional rehearsal below.

Keep this order fail-closed: keep `PAYMENTS_ENABLED=false` throughout setup and preflight; restore every required Production environment value while payments are off; verify or apply the required database migrations in the documented order while payments are off; promote the exact approved candidate while payments are off; then set `STRIPE_MANAGED_PAYMENTS_ENABLED=true`, as required by the executable payment-off preflight, and redeploy that same approved full SHA so the runtime receives the setting. Before preflight, re-read the Production Source SHA and rerun the exact-SHA payment-off deployment evidence; a different SHA, missing redeploy or stale deployment is `NO-GO`. Only after that repeated exact match may the canonical outer preflight pinned to that full SHA run against the approved Neon endpoint. This readiness setting does not open Checkout: setting `PAYMENTS_ENABLED=true` remains a separate later owner decision, never a deployment step. For rollback, keep or restore both switches to false and roll the application back to the prior known deployment only; do not drop or reverse the additive payment evidence migrations or delete webhook, entitlement, outbox, nonce, access, restore or first-sale evidence.

## 1. Business identity

- [x] Register the business name `Hoju Compass` and save the ASIC Record of Registration.
- The owner remains responsible for accurate Australian business identity, income-tax and record keeping. Current ABN/GST status and professional bookkeeping advice are post-first-sale evidence inputs, not Stripe setup prerequisites or absolute blockers for the single first sale; they remain required before a second sale or final tax/bookkeeping treatment under section 5.
- [x] Use a monitored support email that customers can reply to (`support@hojucompass.com`).

## 2. Vercel product-provider settings

Add these only through encrypted environment settings:

- `BUSINESS_TRADING_NAME` — optional; leave unset to use the registered site name `Hoju Compass`.
- [ ] `BUSINESS_LEGAL_NAME` — restore it in the current Vercel Production environment before the next deployment. The existing Production snapshot still renders the previously supplied value, but the 25 August environment inventory no longer lists this variable.
- [ ] `BUSINESS_ABN` — restore the 11-digit value in the current Vercel Production environment before the next deployment; spacing is optional.
- [ ] `NEXT_PUBLIC_SUPPORT_EMAIL` — restore the published support contact in the current Vercel Production environment before the next deployment.

With `PAYMENTS_ENABLED=false`, first provision `hoju_payment_auditor` through SQL with ordinary PostgreSQL privileges and apply `docs/payment-audit-role-grants.sql`; do not create this login through Neon Console/CLI/API because those creation paths grant `neon_superuser` membership. Start a fresh PowerShell process with no project, payment, Stripe, database, token or Vercel bypass variables preloaded, then run `.\scripts\run-vercel-production-payment-preflight.ps1 -ExpectedNeonEndpointId ep-curly-wave-a78bktnq -ExpectedProductionSha <full-owner-approved-sha>` after separately reconfirming that endpoint as Primary. Because Vercel Sensitive values are runtime-only and non-readable, the wrapper does not download Production env. It proves the exact deployment and uses authenticated `vercel curl --deployment` only against that protected `vercel.app` origin. The runtime returns fixed PASS/FAIL for its payment-off configuration, Product, zero open Checkout Sessions, runtime database and the selected operator-monitoring mode. `monitoring=smtp` means the no-send SMTP transport check passed; `monitoring=manual` means SMTP was not run and only the exact owner-acknowledged first-sale manual monitoring fallback passed for this runtime preflight. Either mode still requires separate actual mailbox receipt evidence before final live-sale approval; manual monitoring does not waive or replace that later gate. The inner wrapper requests the one-off `hoju_payment_auditor` URL, Account-read Stripe key and dedicated Balance Transactions-read accounting key only at masked prompts. One-time challenge HMACs prove all three Stripe roles differ without putting a raw key in argv, the request body or logs. After runtime PASS it runs `npm run payments:operator-audit`, then uses the same masked accounting key for `npm run accounting:preflight`. Record launch evidence only when the outer `VERCEL_PRODUCTION_PREFLIGHT=PASS ... monitoring=<smtp|manual> ...` and inner `FIRST_SALE_PREFLIGHT=PASS mode=live payments_off=yes monitoring=<smtp|manual> keys=three-distinct-rk-live required_reads=verified checkout_create=not-exercised database=strict-pass secrets_printed=no` both appear with the same concrete monitoring value in one uninterrupted run. A placeholder, mismatch, FAIL, missing line or interruption remains `NO-GO`.

The app's `sellerDetailsConfigured` check confirms that the public product-provider name and ABN are present. It is not a Merchant of Record check. Verify the transaction seller, document issuer and transaction-support route separately on the real Managed Payments Checkout and every receipt/invoice actually issued, using `docs/managed-payments-customer-document-evidence.md`. Keep the completed evidence private and do not infer an unissued invoice.

- [x] Connect the existing Neon entitlement database to Production with sensitive `ENTITLEMENT_DB_*` variables.
- [ ] Restore a separate Production `ENTITLEMENT_SESSION_SECRET` before the next deployment. `PAYMENTS_ENTITLEMENT_STORE=neon` is present, but the 25 August current-environment inventory does not list the session-signing secret.
- [x] Create `hoju_payment_auditor` through SQL, apply `docs/payment-audit-role-grants.sql`, and prove every audit-role identity/attribute/membership/schema/table/function check passes. The actual separate login returned true for the exact user/database, safe attributes, no elevated membership, no protected-table mutation and no payment-function execution on 24 August 2026. Its password was generated only for the audit and was not retained in source, chat or the application environment.
- [x] Keep the Production launch switch explicitly locked with `PAYMENTS_ENABLED=false` during setup. It was temporarily enabled only for the controlled purchase/refund on 20 August 2026 and then disabled again; that historical test is not current first-customer launch approval.

## 3. Stripe live settings

- [x] Complete the live account representative identity-document task. Rechecked on 20 August 2026: the account status page shows no active tasks and payment activation is complete.
- [x] Confirm the paused-payout warning is no longer shown after identity review.
- [x] Confirm the public business name, website, support phone and a recognisable statement descriptor are present. Read-only live Account evidence was recorded on 24 August 2026 without copying their values.
- [x] Add `support@hojucompass.com` as the Stripe live business-profile support email. Saved in the authenticated Stripe Dashboard and verified in the visible Public details on 24 August 2026; no other public business field was changed.
- [x] Create a separate `rk_live_` operator-audit key with Account Read only. It exists as a distinct live restricted key and remains operator-only; inject it only at the strict preflight masked prompt and never assign it to a deployed app environment.
- [ ] Rerun the fail-closed preflight after that change. It must report PASS for both `Stripe 계정 운영 상태` and `Stripe 구매자 지원 프로필`; the latter requires the Stripe support email to match `NEXT_PUBLIC_SUPPORT_EMAIL` without printing either value.
- [ ] In the Managed Payments Dashboard, confirm the current terms of service are accepted, Managed Payments is activated, Resume Pro is an eligible digital product with the approved eligible tax code, and the integration uses API version `2025-03-31.basil` or later. These are Stripe's documented pre-payment prerequisites; retain status only and no account values.
- [x] Create an active one-time AUD 19.90 Resume Pro Price.
- [x] Create a least-privilege Production Runtime `rk_live_` key. Its 25 August read-only Dashboard review confirmed Prices Read, Products Read, Checkout Sessions Write and Payment Intents Read, with the remaining inspected resources left at None.
- [x] Create the live `/api/stripe/webhook` endpoint and subscribe to the same 11 Checkout, refund and dispute events verified in test mode.
- [ ] Configure Production payment operator alerts. An integrated `monitoring=manual` preflight may skip the no-send SMTP transport check, while `monitoring=smtp` requires `.\scripts\run-payment-alert-transport-check.ps1`; this distinction applies only to runtime preflight. Regardless of mode, before final live-sale approval separately run the explicitly approved `-SendTest` path and confirm the monitored support mailbox actually receives the labelled non-customer message. Controlled purchase/refund mailbox evidence is still required before accepting a customer payment; `monitoring=manual` cannot replace actual receipt evidence.
- [x] Store the live key, Price ID and webhook signing secret only in Vercel Production. Replacing the full live key with a least-privilege restricted key remains a security follow-up.
- [x] Do not add a separate app-controlled automatic-tax setting or manual tax rate. The controlled live Checkout included AUD 1.81 GST inside the AUD 19.90 total under Managed Payments.

## 4. Final controlled test

- [x] Confirm the purchase page shows the Hoju Compass product business name, legal/registered product-provider name, ABN, product support contact, price, digital-delivery method and ACL-compatible refund process.
- The actual first-customer receipt/invoice inspection is performed after payment under section 5. Do not infer seller, issuer or transaction-support wording from `BUSINESS_*` before the artifact exists.
- [x] Confirm Checkout links the versioned service terms, purchase information and privacy notice before payment.
- [x] Confirm Production still fails closed before the deliberate launch switch is enabled.
- [x] Temporarily enable Production payments only for the completed 20 August controlled test, then restore `PAYMENTS_ENABLED=false`. Production remains OFF for the first customer until every unchecked pre-payment item passes and the owner records a new single-sale approval.
- [x] Make one real purchase through the public customer path.
- [x] Confirm the signed live webhook persists the entitlement and the Resume Pro workspace opens only after that entitlement exists.
- [x] With payments off, confirm the exact migration order and versions: charge-link v2 → `20260823_payment_operator_alert_outbox_v1` → `20260823_checkout_activation_nonce_v1` → `20260823_purchase_access_sessions_v1` → `20260823_restore_activation_nonce_v1`. The complete named version/signature result is recorded in `docs/production-first-sale-readiness-audit-2026-08-24.md`; functional response-loss, release and restore proof remains separately required below.
- [x] Apply and verify `20260824_entitlement_link_conflict_v1` in Production after an owner-approved backup window. Neon Primary / `neondb` committed the single migration on 24 August 2026; postflight reported the version and named constraint present, the ambiguous target absent, no reservation in flight, unchanged evidence counts and every named privilege boolean true. The separate Production paid-event/access rehearsal remains pending.
- [x] Record the active Production compute's non-secret `ep-...` ID for the audit session. Neon Console `main` reported `ep-curly-wave-a78bktnq` on 24 August 2026.
- [ ] Supply that exact ID as `PAYMENTS_EXPECTED_NEON_ENDPOINT_ID` and prove both runtime and `hoju_payment_auditor` connections resolve to it. Matching only the `neondb` database name is not sufficient because child branches can use the same name.
- [x] Prepare a read-only before/after audit and single-change HOLD ticket in `scripts/first-sale-production-forward-fix-audit.sql` and `docs/production-entitlement-link-forward-fix-ticket.md`; this reduces operator error but does not authorize the Production migration.
- [x] Run the catalog and effective-privilege evidence in `docs/first-sale-gate-runbook.md`: every named result, including the approved 12-/7-/6-argument functions, protected-table denials, wrapper grants and `all_privilege_checks_pass`, returned true on 24 August 2026. See the complete matrix in `docs/production-first-sale-readiness-audit-2026-08-24.md`.
- [x] Confirm live Resume Pro has zero existing open Checkout Sessions. The read-only Stripe list on 24 August 2026 returned zero total open sessions, zero Resume Pro open sessions and `has_more=false`.
- [ ] Prove one nonce binding, same-browser response-loss retry, different-nonce denial, permanent release, refund/review denial and independent restore-code recovery on the post-migration Production schema. The current gate, gate-event, outbox, access-session and restore-activation row counts are all zero and therefore do not prove functional behavior.
- [ ] Record suffix-only functional evidence that the issued activation/restore access session is active, unexpired and unrevoked. Record `created_at`, `expires_at` and `revoked_at` as evidence times without copying the raw session ID, cookie, customer email or full Stripe ID.
- [ ] Confirm outbox pending/sent/attempt counts, SMTP failure 503, busy-worker 503, stale-lease recovery and actual purchase/refund mailbox receipt using suffix-only evidence.
- [x] Issue a full AUD 19.90 refund in Stripe; `refund.created` and `charge.refunded` both returned HTTP 200 and the workspace was blocked immediately.
- [ ] Reconcile the gross sale, Stripe fee, refund and bank payout record.
- [x] Start a private accounting register with the verified sale and full refund; the fee source is observed, while payout and bank reconciliation remain unresolved.
- [x] Add a read-only Balance Transactions exporter that requires a separate restricted accounting key and excludes customer details.
- [ ] With payments off, complete `.\scripts\run-vercel-production-payment-preflight.ps1 -ExpectedNeonEndpointId ep-curly-wave-a78bktnq -ExpectedProductionSha <full-owner-approved-sha>` and retain both its outer `VERCEL_PRODUCTION_PREFLIGHT=PASS ... monitoring=<smtp|manual> ...` and inner exact `FIRST_SALE_PREFLIGHT=PASS mode=live payments_off=yes monitoring=<smtp|manual> keys=three-distinct-rk-live required_reads=verified checkout_create=not-exercised database=strict-pass secrets_printed=no` results with the same concrete monitoring value. For first-customer approval, this single integrated result satisfies the Balance Transactions read check; `.\scripts\run-accounting-preflight.ps1` is only for later independent revalidation after the accounting key or its permissions change, is not a second launch prerequisite in the same approval window and cannot replace the integrated gate.
- [ ] Without changing that deployment or enabling payments, complete the approved Production payment-path rehearsal on the same full owner-approved SHA. Classify its private redacted packet with `node scripts/verify-production-payment-path-evidence.mjs --expected-sha <full-owner-approved-sha> --file <private-redacted-json>` and retain only `PRODUCTION_PAYMENT_PATH_EVIDENCE=PASS mode=production source_sha=exact payments_off=yes webhook=verified outbox=sent nonce=bound release=denied restore=verified identifiers_printed=no secrets_printed=no`. A SHA mismatch, new deployment, missing exact line or any FAIL invalidates both the rehearsal and prior candidate-bound launch evidence; restart at section 0. This PASS and the monitoring/SMTP gates are necessary before the owner may separately approve one sale.

Production should not stay open if any identity, tax, access-delivery, refund or support check fails.

Do not start the controlled live purchase while the Stripe account status page shows an active identity task or paused payouts. An onboarding approval email does not override an active capability restriction shown in the Dashboard.

## 5. First-customer accounting handoff

The operational evidence pack is controlled outside this release branch. Do not copy customer documents, Stripe exports, bank evidence or the private workbook into this repository, a deployment artifact, a ticket or chat. Use the immutable accounting reference below to retrieve only the runbook/template version; store completed evidence in the approved private accounting location.

- Fixed reference: commit `162c96e1a82ec1f6f61295982dbd4529c8a879f4`
- 15-minute / 24-hour / first-payout runbook: `docs/first-payment-24-hour-operations-packet.md`
- Field and formula rules: `docs/accounting-reconciliation.md`
- Private workbook template: use the approved private accounting location outside this repository. A repository-relative workbook path is not valid evidence.
- Evidence owner: accounting operations records source evidence and reconciliation without customer details.
- Technical owner: the development team resolves webhook, entitlement, access or alert failures.
- Approval owner: the business owner alone records the second-sale decision; this reference does not authorise a payment, refund, customer contact or BAS lodgment.
- [ ] After the first customer payment, inspect its actual Checkout and every issued receipt/invoice with schema v2 `docs/managed-payments-customer-document-evidence.md`. `NO-GO` keeps the second sale at `HOLD`; it does not invalidate the completed first payment.
- [ ] After first-sale artifacts exist, complete the schema v2 registered tax-agent handoff if professional advice is used. Until it is `PASS`, keep Australian income-tax/bookkeeping conclusions unresolved and the second sale at `HOLD`; the handoff is not a Stripe activation prerequisite.

Evidence timing and sales gate:

1. Within 15 minutes, link privacy-safe FP-/WH-/ENT- incident numbers to the live paid Resume Pro charge, signed webhook result, active entitlement, signed access, customer document title/issuer/seller display and operator alert.
2. Within 24 hours, retain the tax and Balance/Ending evidence, record `withheld_tax`, `fee_net_of_withheld_tax`, refund/credit note and closing balance exactly as reported, and keep unknown values as `MISSING` rather than zero.
3. At the first payout, match the itemised payout and bank arrival and complete the Stripe clearing reconciliation.
4. The first customer payment may proceed only after all checkbox items explicitly identified as pre-payment in sections 1–4 pass. A registered tax-agent handoff and the actual nine-row receipt/invoice observation are not first-sale prerequisites. After that payment, a second Resume Pro sale remains `NO-GO` until `REGISTERED_TAX_AGENT_HANDOFF_GATE=PASS`, `CUSTOMER_DOCUMENT_TRUST_GATE=GO`, required evidence has zero `MISSING`/`FAIL`, the cash difference is within ±A$0.01, access and operator alerts are confirmed, any refund is linked to credit-document and revocation evidence, the first payout is matched, and the business owner records `APPROVED`.

The implementation acceptance contract for this control is `OPEN → RESERVED → SOLD → LOCKED` in `docs/first-payment-24-hour-operations-packet.md`. A pre-Checkout atomic reservation must admit one request only; a verified paid event must lock later Checkouts; abandoned reservations require confirmed expiry and no payment; refunds never reopen sales; and only complete 15-minute, 24-hour and first-payout evidence plus an explicit owner approval may move `LOCKED → OPEN`. Operator alerts and a later manual `PAYMENTS_ENABLED=false` deployment are defence-in-depth, not the first-sale concurrency control.

Before enabling the gate, verify in the matching Stripe mode that Resume Pro has zero existing open Checkout Sessions. Explicitly expire every pre-gate Session and retain non-sensitive expiry evidence; an old payable URL is a launch blocker. The runtime database role must have function `EXECUTE` only for claim/attach/verified release/atomic paid processing, no direct first-sale table DML, and no `approve_next_first_sale` access.

## 6. Live-key gate versus runtime compatibility

- `rk_live_` is the least-privilege launch requirement. For the first customer sale, a failing protected runtime verifier, `npm run payments:operator-audit`, or integrated accounting preflight is a deployment blocker; the earlier owner-controlled transaction does not waive this gate.
- Runtime acceptance of `sk_live_` prevents an environment-mode mismatch and preserves an incident-recovery path. It is compatibility behaviour, not launch approval and not a reason to mark the restricted-key item complete.
- Rotating keys, adding key IP restrictions and periodically reviewing Workbench request logs are ongoing security improvements after the least-privilege launch gate passes. They do not replace the pre-sale `rk_live_` requirement.
- The 15-minute / 24-hour / first-payout evidence sequence, registered tax-agent handoff and actual nine-row customer-document observation are not blockers before the first customer payment because their controlling first-customer evidence does not yet exist. They are operational blockers for the second sale if incomplete.
- The runtime key must include Prices Read, Products Read, Checkout Sessions create/retrieve and PaymentIntents Read. A 403, timeout, missing `latest_charge`, or PaymentIntent contract mismatch is intentionally fail-closed: HTTP 503, no gate lock, no grant and an operator investigation path.
- The one-off `PAYMENTS_STRIPE_AUDIT_KEY` must be a different same-mode `rk_` key with Account Read only. The strict audit rejects a missing, full-access, cross-mode or reused runtime key before Account/profile verification.

## 7. Fourteen-day first-customer conversion watch

Starting observation, supplied by the operator rather than fetched during this review: the previous 28 days show 1 Resume Pro visit, 0 Checkout starts and 0 customer purchases. Builder-start and Pro-CTA baselines were not supplied; record them as `N/A`, not zero. These are observations, not targets or forecasts.

Check the same Australia/Sydney reporting window once each day after deployment. Use aggregate counts only; do not record names, emails, Stripe IDs or customer-level paths.

| Funnel step | Daily minimum record | Existing source or honest proxy |
| --- | --- | --- |
| Unique landing visits | Unique visitors to the selected high-intent landing routes | Vercel route-level unique visitors; use `N/A` if a unique count is unavailable and never substitute pageviews silently |
| Builder start | `Resume Builder Started` | Fixed `surface` and `context`; fires on the first real Builder interaction and is not a passive route-view proxy |
| Pro CTA | `Resume Pro CTA Clicked` | Fixed `surface` and `context`; keep it separate from older `Pro Interest` observations |
| Resume Pro visit | `Resume Pro Viewed` | Fixed allowlisted `entry` plus checkout available/unavailable state |
| One-time launch notice preparation | `Resume Pro Launch Interest` | Fixed allowlisted `entry` and `method=mailto|copy`; records a mail-app draft open or successful fixed-request copy, never the email address/message body, and never counts as proof that an email was sent |
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
4. Record the blocker-free owner decision with canonical UTC `approvedAt` and
   `validUntil` timestamps no more than 60 minutes apart. The local invitation
   desk must show current `GO`; it automatically relocks at expiry, when a
   blocker is present or when either timestamp is invalid. If it relocks,
   repeat the strict audit instead of extending the old decision.
5. Send one reply from `support@hojucompass.com` only after the product page is
   live and Checkout is deliberately enabled. Link to
   `https://hojucompass.com/resume-pro`; never email a raw Stripe Checkout URL.
6. Do not contact other requesters or send a second reminder until the first
   customer either completes payment or explicitly declines and the attached
   Checkout is confirmed expired, unpaid and without a PaymentIntent.
7. Once paid, stop invitations and run the 15-minute, 24-hour and first-payout
   evidence sequence. The database gate, not an email timestamp, is the
   concurrency authority.

Suggested single reply after approval:

> Resume Pro 판매가 시작되어 요청하신 1회 안내를 드립니다. 결제 전 가격,
> 제공 범위와 환불 안내를 확인한 뒤 공식 Resume Pro 페이지에서 진행해
> 주세요. 이 메일에는 이력서 원문이나 민감정보를 보내지 마세요. 이번
> 안내 뒤 추가 홍보 메일은 보내지 않습니다.
