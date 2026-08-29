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
