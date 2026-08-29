# Rental Pack Pro acceptance scenarios

These scenarios define the minimum experience expected before Rental Pack Pro can be offered for A$14.90. `Rental Application Pack Pro` remains the formal checkout and purchase-record name. Passing a source contract or production build alone is not permission to open checkout.

## 1. First application

1. Start with an empty local workspace.
2. Enter a reusable applicant profile and mark reusable evidence readiness plus a review date without entering an employer name, income amount, TFN or identity-document number.
3. Add a property alias, suburb, weekly rent, move-in date and lease term.
4. Mark document and privacy items independently.
5. Generate all three English messages and confirm that each uses the current property and optional agent name.
6. Record one sent and one received follow-up without entering a phone number, email address or portal link.
7. Save a property TXT and private property JSON, then print the preparation summary to PDF.

Expected: one property can be prepared end to end without uploading an original document or sending data to a server.

## 1A. Free ready-now handoff

1. In the free property inspection checklist, enter a non-sensitive property alias, review several items and mark at least one concern.
2. Choose `안전하게 이어보기` and confirm that the Rental Pack introduction opens before any checkout.
3. Open the entitled Pro workspace on the same browser within 24 hours.

Expected: the alias and aggregate reviewed/concern counts create an inspected candidate once. Raw notes, individual inspection statuses, addresses and files do not transfer; expired, malformed and purchase-mode handoffs are ignored. Resume Pro storage and access are unchanged.

## 2. Repeated applications

1. Add at least three property candidates.
2. Reuse the applicant profile while keeping property details, document status, privacy checks, messages and notes isolated.
3. Duplicate a prepared candidate and confirm that only lease-condition defaults carry over. Property alias, suburb, agent, document state, privacy checks, messages, submission dates, notes and contact history must start empty.
4. Apply reusable evidence to the new property's checklist, then independently change one property status.
5. Move candidates through inspected, preparing, submitted and follow-up stages.

Expected: repeated evidence preparation is reduced without accidentally carrying old property material into a new application, and changing one property never changes another property's application record.

## 3. Follow-up pressure

1. Set one next-action date in the past, one for today and one within three days.
2. Set a completed candidate to approved, declined or withdrawn.

Expected: overdue, today and near-term actions are visibly prioritised; completed candidates no longer show an action warning.

## 4. Privacy mistake prevention

1. Review every privacy check before submission.
2. Confirm that the interface never asks for TFN, card details, bank credentials, passport number or raw identity files.
3. Confirm that exports repeat the sensitive-data warning and explicitly state that no source document is embedded.
4. Confirm that restore rejects a backup larger than 1 MB before parsing it.

Expected: the product helps the customer prepare and minimise disclosure without claiming that a particular request is unlawful.

## 5. Device loss and recovery

1. Download the whole-workspace JSON backup.
2. Add or change a candidate.
3. Restore the original backup and confirm the replacement warning.
4. Attempt to restore an unrelated or malformed JSON file.

Expected: a valid backup restores all candidates and the reusable profile; an invalid file changes nothing and returns a clear error.

## 6. Refund and dispute ordering

1. Grant a Rental Pack entitlement from a signed paid Checkout event.
2. Process a signed full-refund event and confirm that direct workspace access is rejected.
3. Deliver a later dispute-won or funds-reinstated event for the same charge.

Expected: the later dispute event is review-only and never reopens a refunded entitlement. Any restoration requires an operator to verify the current charge and refund state first.

## 7. Sale gate

Before checkout opens, complete the scenarios above on mobile and desktop, verify print-to-PDF output, apply the product-code database migration, and pass a test purchase, access recovery, full refund and immediate entitlement-revocation exercise. Record any complaint-prone ambiguity as a release blocker rather than relying on refund wording to compensate for it.

## Local MVP verification — 29 August 2026

This pass preserved the existing uncommitted Rental release-readiness work and made no Stripe, Neon, Vercel, Production or payment-gate change.

Resolved gap: whole-workspace restore previously accepted any JSON object with version `2` or `3` and a non-empty `applications` array. A version-shaped unrelated file could therefore replace the current local workspace. Restore now validates the exported workspace structure, application and follow-up field types, allowed statuses and jurisdictions, and the 20-candidate limit before showing the replacement confirmation. Malformed, wrong-typed and oversized backups leave the current workspace unchanged.

Verification recorded for this workspace:

- `npx tsc --noEmit --pretty false` passed.
- Rental Pack workspace contract, privacy-minimised handoff, checkout/access contract, access-token and restore-code, entitlement ordering, and paid-product isolation checks passed.
- Targeted ESLint for the Rental workspace, backup validator, root layout and contract scripts passed.
- `npm run build` compiled successfully, completed TypeScript validation and generated all 112 static pages; the Rental checkout, restore, success and workspace routes were included as dynamic routes.
- A desktop browser flow confirmed reusable-profile persistence, jurisdiction guidance, reusable evidence application, privacy-state persistence, message generation and property-condition duplication without carrying suburb, agent, messages, document state, privacy state or contact history into the new property.
- A downloaded two-candidate workspace backup replaced a three-candidate workspace after confirmation. The malformed version-shaped test file was rejected without a confirmation and left both existing candidates unchanged.
- The free property-inspection flow opened the Rental introduction first, then imported the privacy-minimised alias and aggregate counts once. A React development-mode initialization guard prevents the first import from being replayed or overwritten; a controlled 4-to-5 candidate import remained five candidates with exactly one new alias after reload.
- At a 390-by-844 browser viewport the document width matched the viewport and the primary backup, add, duplicate, delete, message and print controls had at least a 44-pixel touch height.
- A real headless-browser print initially exposed six retained blank pages after the two-page preparation summary. Print CSS now removes non-print layout from pagination, uses a white page canvas and produces exactly two pages. Both final page renders were visually checked with no clipping, overlap or blank pages.
- The Next.js 16 smooth-scroll route-transition warning was removed by declaring the documented `data-scroll-behavior="smooth"` root-layout contract; a fresh local route transition produced no browser warning or error.
- The repository-wide `npm run lint` did not complete successfully because the existing public-boundary check reports `src/app/api/resume-pro-performance/connection/route.ts` linking to the operator route `/resume-pro-performance`. ESLint itself reported one existing warning in `src/lib/localOperatorConnection.ts`. Neither unrelated issue was changed in this Rental outcome.

Local MVP development is complete with no remaining Rental code blocker found. Keep Rental checkout and Production activation off until the database migration, controlled payment/refund exercise and owner approval gates in `docs/pro-product-rollout.md` are separately completed.

## Release-gate audit hardening — 29 August 2026

The shared payment launch command previously checked only the Resume Pro Price, so it could not prove that Rental's dedicated Price and kill switch were present in the target environment. It now accepts `--product=rental-application-pro`, reports both Rental-specific gates without exposing values, rejects unknown product names, and preserves Resume Pro as the default mode. Run `npm run payments:check -- --product=rental-application-pro --strict` inside the target Production environment immediately before any controlled live Rental payment or switch change.

Verification for the hardened audit:

- The Rental checkout/access contract test passed with assertions that the launch audit includes both Rental-specific environment gates.
- A Production-shaped run with synthetic placeholders reported 14/14 pass, proving that the command selects the Rental gates and can complete without printing supplied values.
- The unconfigured local environment reported 1/14 pass and 13 wait states, as expected, without exposing any secret or connection string.
- The unknown-product path returned the documented usage error, targeted ESLint and TypeScript validation passed, and the repository secret scan passed across 262 tracked and untracked source files.

No external launch state was changed during this pass. This worktree has no Vercel project link and no Stripe, Vercel or Neon CLI. A read-only check through the owner's authenticated Chrome session confirmed that the live Stripe catalogue contains no Rental Product or Price, while Vercel's two Rental variables exist only for the dedicated Preview branch and not Production. After the owner completed Vercel two-factor verification, a read-only Production Neon query returned the `purchase_entitlements_product_code_check` definition and confirmed that it already permits `rental_application_pro`; no database migration is required. The public Production Rental page is deployed and still reports that checkout is closed. Creating the live Product and A$14.90 Price, adding Production variables, publishing the current local release changes, creating a real Checkout and issuing its full refund remain separate owner-approved actions.

## Checkout-off Production preparation — 29 August 2026

The owner approved a preparation deployment that must keep Rental checkout closed. Before changing external state, the active Codex task list, local worktrees, remote refs and Vercel deployments were checked. A separate `main` Production deployment had just completed successfully; no deployment was still building. The preserved Rental worktree was committed as `e687904` on `codex/rental-release-readiness` and pushed as a new remote branch, leaving the root checkout and the other task's branch unchanged.

The live Stripe account now contains an active `Rental Application Pack Pro` Product and default Price with these verified properties:

- one-time AUD 14.90 with inclusive tax behaviour;
- `Software as a service (SaaS) - personal use`, eligible for Managed Payments;
- Product metadata `product_code=rental_application_pro` and `billing_model=one_time`;
- customer-visible description and feature list aligned with reusable evidence, property-isolated tracking and local exports.

Vercel Production now has dedicated secret variables for the Rental Price and product switch. The switch was saved as `false`. Vercel built the exact `e687904` Preview successfully, then promoted that exact source into a new Production build using Production variables. The promoted deployment reached `Ready` and was assigned to `hojucompass.com`. A fresh public check showed the expanded 20-candidate Rental copy and the explicit `강화 버전 검증 중 · 결제 미오픈` state with no browser console error.

Checkout was not opened, and no live Checkout Session, charge, refund or entitlement was created. Before the controlled live test, recheck that no newer `main` deployment has replaced `e687904`, reconcile the release branch into the intended long-lived branch, run the Rental Production audit, and request action-time approval before changing the Rental switch to `true` or making the A$14.90 purchase.

## Long-lived branch reconciliation hold — 29 August 2026

After the checkout-off deployment, `origin/main` was fetched at `97c8b5c`. The release branch and `main` have diverged substantially: `main` has 223 unique commits and the Rental branch has 4, with merge base `7910525`. A dry merge exposed overlapping changes across payment environment contracts, entitlement storage and guarded event functions, webhook handling, access-session and restore flows, Rental access code, rollout documentation and shared UI tokens.

Do not merge this branch blindly, enable Rental checkout or use this checkout-off deployment as the basis for a real charge. Reconcile or replay the Rental changes onto current `main` while preserving `main`'s newer first-sale, accounting-isolation, tombstone and access-session safeguards; then rerun the full Rental contract suite, TypeScript, targeted lint, build, secret scan and strict Production audit. Production currently serves source commit `e687904` with Rental checkout closed, but any later automatic `main` deployment can replace it and must be checked again immediately before a controlled live test.

## Main reconciliation completed — 29 August 2026

The owner approved reconciliation, and `origin/main` at `c2025ff` was merged into the preserved Rental worktree as merge commit `40d0b76` without creating another worktree or changing Production. Conflicting payment, webhook, entitlement, access-session, restore and first-sale files use current `main` as their security baseline. Rental-specific work was then reapplied only to the workspace, public product copy, local backup and handoff boundaries, jurisdiction guidance, print output and the product-aware launch audit. The merge commit was pushed to `origin/codex/rental-release-readiness`.

The reconciliation exposed and resolved a user-data migration gap. Current `main` stores the Rental workspace as `version: 2` with a `packs` array, while the expanded workspace uses `version: 3` with `applications`, a reusable profile and an evidence library. The reconciled loader now maps every retained candidate's alias, move date, lease term, document states, introduction, follow-up date, contact stage and privacy-minimised inspection receipt into the new model, derives the reusable profile and evidence state, preserves the active candidate, and caps the result at 20. Persisted inspection receipts also make a failed one-time handoff cleanup idempotent instead of duplicating a candidate after reload.

The product-aware launch audit now extends rather than replaces `main`'s fail-closed preflight. `--product=rental-application-pro` adds the dedicated Rental Price and switch checks; when remote Stripe verification is explicitly requested it pins live/test mode, active one-time AUD 14.90 inclusive pricing, active Product state and the exact `product_code` and `billing_model` metadata. Unknown products still fail with the documented usage error, and the command never prints supplied values.

Reconciled verification:

- Rental checkout/access, access-token, acquisition, offer handoff, ready-now, 20-candidate workspace, validated backup, entitlement ordering and paid-product isolation contracts passed.
- The complete current-main payment launch preflight, Vercel protected-runtime preflight and Production runtime preflight contracts passed.
- `npx tsc --noEmit --pretty false`, targeted ESLint and the repository-wide `npm run lint` passed with zero warnings; the earlier public-boundary lint failure is superseded by current `main`.
- `npm run build` compiled, completed TypeScript validation and generated 122 pages, including all Rental checkout, activation, restore, success and workspace routes.
- The secret scan passed across 456 tracked and untracked source files, and `git diff --check` passed.

No Stripe, Neon, Vercel, Production, payment switch, Checkout Session, charge, refund or entitlement state changed during reconciliation. The last explicitly verified checkout-off Production source remains `e687904`; the reconciled branch requires a new collision check and separate preparation-deployment approval before it replaces any Production source. A real A$14.90 purchase and refund remain a later action-time approval.

## Reconciled checkout-off Production deployment — 29 August 2026

The owner approved the reconciled preparation deployment. Immediately before promotion, `origin/main` remained at `c2025ff`, the release branch was clean and fully pushed at `072fe2a18b7b1349edf1ceca17e5c4bb882e22cf`, and Vercel showed no queued or building deployment. The exact Ready Preview `Dgk9FgcYcShqL9ZMtNgRK4kXohWn` identified that branch and commit, and was promoted into Production deployment `F1qCXD7cuD8G1cM1q5T7EYjxjJXn` using the existing Production environment.

The Production build reached `Ready` in 32 seconds and was assigned to `hojucompass.com`. A fresh public check of `/rental-application-pro` showed the reconciled maximum-20-candidate flow, A$14.90 one-time price copy and the explicit `강화 버전 검증 중 · 결제 미오픈` state without a checkout action. A direct unauthorised request to `/rental-application-pro/workspace` redirected to `/rental-application-pro?access=required` and displayed the access-recovery notice.

The Rental Production switch remains `false`. No Stripe or Neon state was changed, and no Checkout Session, charge, refund or entitlement was created. The next external-state gate is a fresh Production audit followed by separate action-time approval immediately before enabling Rental checkout or starting the controlled A$14.90 purchase and full-refund exercise.

## Controlled-payment activation hardening — 29 August 2026

The owner approved the fresh audit, Rental activation and one controlled A$14.90 purchase/full-refund exercise. Pre-activation review then found that the reconciled code still deliberately forced Rental readiness false in Production and denied the route before Stripe work. Removing only that deny would have exposed a second gap: Rental Checkout did not claim the product-scoped first-sale reservation, so it could create concurrent or duplicate live Sessions and its paid webhook grant would bypass the atomic gate+entitlement transaction used by Resume Pro.

The local release candidate now treats Rental as a second exact first-sale product contract. Production readiness requires every shared payment safeguard plus the Rental switch and Price; the Checkout route verifies the runtime schema, blocks an active buyer, validates the live Product/Price contract, claims and attaches the Rental gate with a product-specific idempotency key, and safely handles verified expiry or definite pre-Session rejection. Signed paid webhooks verify the Rental PaymentIntent and lock its A$14.90 gate in the same database transaction as the entitlement grant. Customer-facing failure states redirect back to recovery guidance instead of exposing a raw response.

Existing Production has Resume-only gate constraints, so the code remains fail-closed until additive migration `20260829_rental_first_sale_gate_v1` is separately approved and applied on Neon Primary while Checkout is off. No Vercel, Stripe, Neon, payment-switch, Checkout Session, charge, refund or entitlement state changed during this hardening pass. After local verification and checkout-off deployment, the remaining sequence is: approve and apply the bounded migration, pass the exact-SHA Production preflight with zero open Sessions, activate only the required switches, perform the single controlled purchase, verify access, issue the full refund, verify revocation, and close the switches again.

Verification passed for the Rental checkout/access and token contracts, expanded workspace, atomic first-sale gate, Stripe/webhook safety, product-entitlement isolation, payment alerts, payment preflight contracts, database-operation contracts, TypeScript, repository lint, 122-page Production build and the 457-file secret scan. The full aggregate `quality:gate` repeated lint/build and payment preflight successfully, then stopped at the unrelated existing `check-cover-letter-acquisition-loop.mjs` assertion that the home page expose the cover-letter topic; no home or cover-letter file is changed in this Rental candidate.

## Hardened checkout-off Production deployment — 29 August 2026

Immediately before deployment, the preserved release worktree was clean at `564c941007d5f6faad8f1f04696b207846cdbcb6`, the remote release branch matched that SHA, `origin/main` remained `c2025ff9e377d56a8643d814ad75a142f09fdc7f`, and Vercel showed no queued or building deployment. Exact Preview deployment `22sXratDFfSG6L7BRTxc3L17nceF` identified `564c941`, reached `Ready`, and was promoted using the existing Production environment without changing any environment variable.

The resulting Production deployment `C9D24ih9ZojqbAxut6ygbx8mWkqF` reached `Ready` in 33 seconds and was assigned to `hojucompass.com`. Its Vercel source link identifies the exact `564c941` commit. A fresh public request to `/rental-application-pro` showed `A$14.90` together with `강화 버전 검증 중 · 결제 미오픈`; a direct unauthorised request to `/rental-application-pro/workspace` redirected to `/rental-application-pro?access=required` and displayed the access-recovery notice.

Rental checkout remains off. No Neon or Stripe state changed, and no Checkout Session, charge, refund or entitlement was created. The next external-state boundary is the bounded `20260829_rental_first_sale_gate_v1` Neon Primary migration. That schema write needs focused approval separate from the already granted activation/payment approval. After migration, rerun the exact-SHA Production preflight and confirm zero open Sessions before any switch activation or controlled A$14.90 payment.

## Neon gate migration and checkout-off preflight — 29–30 August 2026

After focused owner approval, additive migration `20260829_rental_first_sale_gate_v1` was applied to Neon Primary endpoint `ep-curly-wave-a78bktnq` with checkout still closed. The first ownership-order attempt and the first function-definition attempt both failed inside explicit transactions and were rolled back. The canonical SQL was corrected so table ownership changes run before switching to `hoju_migration_owner`, and both `IS DISTINCT FROM CASE` expressions are parenthesised. The corrected migration committed successfully. A 16-check read-only postflight passed in full: the migration record, both product gates, four constraints, eight Rental-aware functions, expected overload cleanup, runtime/operator privileges, ownership, retained grants and zero reserved rows were all verified.

The first integrated exact-SHA Production preflight stopped before dependency checks and therefore before the Neon audit-URL prompt. Vercel's protected runtime log identified the configuration mismatch without exposing secrets: the existing deployment reported `PAYMENTS_ENABLED=true`, while the checkout-off audit deliberately requires `false`; Stripe, schema, database and SMTP checks were all `not-run`. Public Rental and exact-deployment pages remained visibly closed because the dedicated Rental switch was still `false`, and no Checkout Session, charge, refund or entitlement was created.

Production `PAYMENTS_ENABLED` was then restored to `false` and exact source `564c941007d5f6faad8f1f04696b207846cdbcb6` was redeployed without build cache. Replacement Production deployment `B1n5xyFzjQM2y2oqT5n7YzRDbA5s` reached `Ready`, was assigned to `hojucompass.com`, and retained the dedicated Rental switch as `false`. The next step is to complete the integrated preflight against this replacement deployment, confirm zero open Sessions and the Neon audit role/endpoint, and only then activate the required switches for the single approved A$14.90 purchase/refund exercise.

## Fee-safe live smoke containment — 30 August 2026

The least-privilege runtime readiness mismatch was corrected in
`b3a029dcdd7aa26b8fdcb94c9c2f968b2b9634a8`: runtime readiness no longer reads
the private migration ledger that the application role is intentionally denied,
while the dedicated operator audit continues to verify every migration entry.
Rental/Stripe contracts, database operations, TypeScript, targeted lint and the
122-page Production build passed. The integrated Production run then reported
runtime payment preflight, operator audit, accounting preflight, first-sale
preflight and Vercel Production preflight PASS with the exact source, zero open
Sessions and the migrated Rental gate.

After the approved temporary activation, one live Rental Checkout Session was
created and its hosted page showed the exact one-time A$14.90 offer. Stripe read
evidence showed `livemode=true`, Managed Payments, inclusive automatic tax with
Stripe liability, exact Rental metadata, `status=open`, `payment_status=unpaid`
and no PaymentIntent. The owner stopped before the final payment after confirming
that a customer refund would not generally return the original processing fee.
Consequently no charge, customer refund, entitlement or revocation was created
and no payment-processing cost was incurred.

The owner adopted the repository-wide fee-safe testing boundary in
`docs/pro-product-rollout.md`. Both Production sale switches were restored to
`false`. Concurrent `main` activity had already advanced the public source, so
the environment-triggered Production deployment was inspected rather than
replaced: deployment `dpl_DMDac17QZnhn1dMh3kJvyWx5myaH` is Ready on
`hojucompass.com` from `main` commit `48f4f45`, and a same-origin Rental Checkout
POST returns HTTP 503 with `Cache-Control: no-store`. No Rental candidate was
promoted over that concurrent source. The sole unpaid Session is scheduled to
expire at 30 August 2026 00:52:17 AEST; confirm Stripe reports it expired before
closing this record.
