# Hoju Compass release candidate manifest — 23 August 2026

This manifest is a read-only release-scope audit. It records repository contracts only; it does not confirm or expose any deployed environment value, credential, database row, Stripe object or external service state.

## 1. Frozen comparison and release decision

| Item | Frozen value |
| --- | --- |
| Current deployment reference inspected | `origin/main` at `7910525c539408535e343ea1eff7fe8ebc510bec` |
| Resume Pro candidate inspected | `codex/resume-pro-release-candidate-ops` at `7904086e676ec40f2f8d3207546728b08d74b1d8` |
| Merge base | `39cc9b1922b6751458b5a3af8a742ca0ebff4785` |
| Divergence | candidate has 28 commits not in main; main has 19 commits not in candidate |
| Two-endpoint file delta | 115 files, 3,858 insertions, 2,206 deletions |
| Reconstructed mainline base | `origin/main` at `7910525c539408535e343ea1eff7fe8ebc510bec` |
| Final tested application head before manifest finalization | `307c75add5b786812dd25b99cbcf3a2ddde7cb8c` |
| Mainline delta at that head | 70 files, 2,868 insertions, 221 deletions, unintended deletions **0** |
| Protected Preview decision | **READY** with payments off by default, or with an intentionally configured test-only Stripe/Neon environment |
| Production/live decision | **HOLD** until target environment, migration and actual Checkout/receipt seller evidence are verified |

The historical `7904086` candidate is not a descendant of the current deployment reference. Deploying it directly would remove current main features, including the English phrase-card pages/assets and Job Move Pro research/survey files. That route remains prohibited. The replacement branch `codex/resume-pro-mainline-release` was created exactly from the frozen `origin/main`; at the functional head above, the English-card and Job Move paths remain unchanged and `git diff --diff-filter=D origin/main..HEAD` returns no file.

The reproducible, local-only inventory commands are:

```text
git diff --name-status 7910525c539408535e343ea1eff7fe8ebc510bec 7904086e676ec40f2f8d3207546728b08d74b1d8
git log --left-right --oneline 7910525c539408535e343ea1eff7fe8ebc510bec...7904086e676ec40f2f8d3207546728b08d74b1d8
```

### Main-only work that must be preserved

- `7910525` Add English card performance review
- `006f187` Add four-day English card publishing pack
- `763da3a` Route English card traffic to matching phrases
- `0824974` Add English phrase card campaigns
- `e27bd16` 홈페이지에 생활 영어 문장 카드 진입점 추가
- `63de713` 호주 생활 영어 문장 카드 추가
- `359782e` Convert high-intent survey responses into pilot leads (#29)
- `5ab4eae` Add public Job Move Pro validation survey (#28)
- `980f3d0` Job Move Pro 로컬 인터뷰 기록 도구 추가 (#26)
- `39a236b` 모바일 Evidence Pack 검증 샘플 추가 (#24)
- `2a857f5` Job Move Pro 인터뷰 키트와 샘플 추가 (#22)
- `d672a6f` Job Move Pro 구매가치 검증안 추가 (#20)
- `775d3fa` 2026 한국 워홀 비자 팩트체크 추가 (#19)
- `bac0e3b` Resume Pro 구매 적합 고객 기준 추가 (#16)
- `7ae66c4` 급여 계산기 Super 추정 기준 명확화 (#14)
- `d46a623` 호주 공휴일 근무수당 가이드 추가 (#12)
- `e1a1f00` 호주 생활 영어 확인 문장 가이드 추가
- `2568f7c` 실용 카드뉴스 프리셋 3종 추가
- `43580d4` Add secure local performance connections (#9)

The current two-endpoint diff reports these main files as deleted; none is an approved release deletion:

- `docs/job-move-pro-interview-kit.md`
- `docs/job-move-pro-validation.md`
- `public/marketing/english-phrase-cards/*`
- `src/app/api/job-move-survey/route.ts`
- `src/app/english-phrase-cards/page.tsx`
- `src/app/job-move-pro-research-preview/page.tsx`
- `src/app/job-move-pro-research/page.tsx`
- `src/app/job-move-survey/page.tsx`
- `src/components/tools/EnglishPhraseCards.tsx`
- `src/components/tools/JobMoveResearchRecorder.tsx`
- `src/components/tools/JobMoveSurveyForm.tsx`
- `src/lib/jobMoveSurvey.ts`
- `src/lib/researchSurveyEmail.ts`

### Mainline reconstruction result

The release candidate has been rebuilt on `codex/resume-pro-mainline-release`, created exactly from `origin/main` at `7910525c539408535e343ea1eff7fe8ebc510bec`. The old `7904086` candidate is audit evidence only.

Include, in dependency order, after reviewing each actual diff:

1. Resume Pro mobile value, STAR limit and interview/onboarding: `b37cf11`, `d32aeb0`, `199a10b`.
2. Quality/security core from `4ac5a5e`, but only CI, request security, Resume Pro/payment routes, database recovery/migration and non-push contracts. Exclude its push-route and push-contract hunks.
3. Resume Pro shared-device privacy: `f96df5a`.
4. Resume Pro trust/content/product contract: `7f71cff`, `5e03759`, `b0cbc5d`, `dd797fc`, `f8337fe`, `e427e2e`.
5. First-customer operational notes: `a581a17`, `dd41458`.
6. Checkout failure UX, CSP, Managed Payments role copy and privacy-safe funnel: `bf6732f`, `d7aaf7e`, `942a1d1`, `752f078`.
7. Support contact, JSON-LD/navigation security and their contracts: `b9f98e2`, `ae68d2f`, `7503f1a`, `7904086`.
8. Product-data deletion versus transaction-record retention, mobile Builder first saved input, product-provider legal-name boundary and mobile free-Builder entry: `d62ab9e`, `ad8a227`, `15111ea`, `34db7ce`.
9. First-payment customer-support routing from `3a25eb1`. Its required content was already present after the privacy/record-retention document integration, so the later cherry-pick was empty and correctly skipped; the final document still preserves product-access versus transaction-support roles, last-eight-character references, sensitive-data exclusions and no automatic refund or legal-outcome promise.
10. Privacy-free internal search ordering and Resume Pro Product/Offer structured data: `05ae9d9`, `47d894c`. Free Builder remains ahead of Pro for broad resume intent, cover-letter and STAR/interview paths are present, and Product JSON-LD derives AUD 19.90 and availability from the server product/readiness contracts without ratings or reviews.

Exclude from the first-payment candidate:

- `e83e9f6`: duplicate lineage of the local performance connector already represented on main by `43580d4`; preserve main and merge only later funnel fields where required.
- `a3fc981`, `4f03540`: install/PWA work is not required for the first payment.
- `3e7fabb`, `a39ede9`, `4ddbc45`: push runtime, secret generation and delivery claims are not required and must remain disabled.
- `c716a65`: superseded Preview HOLD audit tied to the non-mainline candidate; this manifest replaces it.

No English-card, Job Move Pro, visa, pay-guide, calculator, campaign, content-planner or social-card file was deleted or reverted while applying the include list. `package-lock.json` remains byte-for-byte at the current main version. `vercel.json`, `public/sw.js`, push routes, push DDL and push libraries also have zero diff from `origin/main`. The `test:push-exclusion` quality check verifies that routes, libraries, DDL, Vercel cron, package dependency and delivery-contract code stay out; no misleading `test:push-reminders` or deferred `test:push-contract` command remains.

### Candidate-only commit set inspected

- `7904086` Preserve payment JSON-LD security contract
- `7503f1a` Harden imported navigation sinks
- `ae68d2f` Test payment support privacy contract
- `b9f98e2` Align payment support contact paths
- `752f078` Add privacy-safe resume funnel events
- `942a1d1` Clarify Managed Payments support roles
- `d7aaf7e` Harden production CSP script policy
- `bf6732f` Harden Resume Pro checkout failures
- `e427e2e` Verify Resume Pro marketing feature claims
- `f8337fe` Align Resume Pro and STAR search messaging
- `dd797fc` Verify Resume Pro checkout config fails closed
- `dd41458` Add first-customer conversion watch
- `a581a17` Hand off first-customer payment evidence
- `b0cbc5d` Harden Resume Pro Stripe product identity
- `5e03759` Expand resume achievement guide with STAR
- `f96df5a` Protect Resume Pro shared-device data
- `4ddbc45` Prevent duplicate push reminder delivery
- `7f71cff` Fix job search article source
- `4ac5a5e` Add release quality and security gates
- `199a10b` Integrate Resume Pro interview release candidate
- `c716a65` Record Resume Pro preview hold
- `d32aeb0` Prevent silent STAR story eviction
- `b37cf11` Improve Resume Pro mobile purchase value
- `a39ede9` Add secure push secret generator
- `3e7fabb` Add optional Web Push life reminders
- `4f03540` Clarify installed app data storage
- `a3fc981` Improve installable app experience
- `e83e9f6` Add secure local performance connections

## 2. Reconstructed mainline release file groups

The fixed hashes above are the authoritative complete file inventory. The candidate work is grouped as follows:

- Resume Pro product and Checkout: `src/app/api/checkout/resume-pro/route.ts`, `src/app/resume-pro/**`, `src/components/tools/ResumePro*.tsx`, `src/lib/resumePro*.ts`, `src/lib/commerce.ts`.
- Paid-access security: `src/app/api/resume-pro/**`, `src/app/api/stripe/webhook/route.ts`, `src/lib/requestSecurity.ts`, `docs/entitlement-storage.sql`, `docs/database-recovery.md`.
- Purchase, support and privacy copy: `src/app/contact/page.tsx`, `src/app/payment-help/page.tsx`, `src/app/privacy/page.tsx`, `src/app/purchase-information/page.tsx`, `src/app/terms/page.tsx`, `src/components/tools/PaymentSupportHelper.tsx`.
- Funnel measurement: `src/components/analytics/ResumeFunnelAnalytics.tsx`, `src/lib/resumeFunnelAnalyticsContract.ts`, `src/lib/resumeProPerformance.ts`, `src/app/resume-pro-performance/**`.
- PWA/push: explicitly excluded from this first-payment reconstruction. The listed push routes, DDL, libraries, `public/sw.js` and `vercel.json` remain exactly as they are on `origin/main`.
- CSP and navigation security: `next.config.ts`, `src/lib/jsonLd.ts`, `src/lib/safeNavigation.ts`, `src/components/seo/JsonLd.tsx`, `src/components/dashboard/MyCompassDashboard.tsx`, `src/components/tools/JobApplicationTracker.tsx`, `docs/csp-hardening.md`.
- Automated gates: `.github/workflows/quality-gate.yml`, `package.json` and the non-push `scripts/check-*.mjs` files added or modified in the mainline diff. `package-lock.json` is unchanged.
- Content/search: `src/data/articles.ts`, `src/app/resources/[slug]/page.tsx`, `src/components/resources/ArticleNextStep.tsx`.

## 3. Database migration classification

### Required only for a full Resume Pro payment/access Preview

`docs/entitlement-storage.sql` is the authoritative, idempotent entitlement schema. A target database must have the tables, indexes, event-order column, constraints and `apply_entitlement_event` routine before a Preview exercises webhook persistence, access activation, recovery or refund/revocation. Apply `docs/first-sale-gate.sql` second; it adds the atomic sale reservation, append-only audit, guarded entitlement/restore wrappers and records `20260823_first_sale_gate_charge_link_v2`. The baseline records `20260818_entitlement_baseline_v1`.

- A static/UI Preview with `PAYMENTS_ENABLED=false` does not require a database migration.
- Checkout is now fail-closed without the entitlement database, first-sale migration and `FIRST_SALE_GATE_ENABLED=true`; there is no persistence-free Session mode.
- A full payment/access Preview requires both schemas plus target-Preview database connection, least-privilege role matrix and signing settings.
- Required catalog evidence is: migration version `20260823_first_sale_gate_charge_link_v2` exists, the historical 9- and 11-argument `apply_first_sale_paid_event` signatures are absent, and exactly one 12-argument signature exists. A missing or additional overload keeps payment launch **NO-GO**.
- Do not rerun or alter Production from this manifest. First perform the documented read-only schema check and record whether the version already exists.
- Never roll back payment tables by dropping them. On an incident, disable payments and roll back application code while preserving webhook and entitlement evidence.

### Push migration — excluded and not approved for this release

Production currently returns 404 for the push surface according to the supplied operating observation; this audit did not access Production. Keep `PUSH_REMINDERS_ENABLED=false` or unset.

This mainline candidate adds no push route, subscription/reminder/delivery DDL, delivery library, Web Push dependency, service-worker change or Vercel cron change. A future push release must independently introduce and verify `push_subscriptions`, `push_reminders` and the durable unique-claim table `push_deliveries`; **do not enable push if `push_deliveries` is absent.** None of that future work is implied by this release.

## 4. Environment contract without values

No value was read during this audit.

### Safe initial Preview

- `PAYMENTS_ENABLED=false`
- `PUSH_REMINDERS_ENABLED=false` or unset
- `PAYMENT_ALERTS_ENABLED=false` unless the alert mailbox path is intentionally tested
- Operator-only routes remain production-build 404 through `requireLocalOperatorAccess`; do not add deployment credentials for them.

This mode supports layout, mobile, content, CSP and free Builder testing without Stripe, Neon or Web Push external calls.

### Resume Pro Checkout test Preview

Only if Checkout is intentionally in scope, use Preview-scoped test values for all of:

- `PAYMENTS_ENABLED=true`
- `STRIPE_SECRET_KEY` in test mode, preferably least-privilege `rk_test_`
- `STRIPE_RESUME_PRO_PRICE_ID`
- `STRIPE_RESUME_PRO_PRODUCT_ID`
- `STRIPE_RESUME_PRO_TAX_CODE`
- `STRIPE_MANAGED_PAYMENTS_ENABLED=true`

The Price must be active, one-time, AUD 19.90, tax-inclusive and test-mode. Its expanded active Product must match the independently configured Product ID and exact Dashboard-approved Managed Payments tax code. Missing values, restricted-key read denial, Product/tax mismatch or wrong mode fail closed before Session creation.

### Full test Checkout-to-access Preview

In addition to the Checkout variables, require:

- `STRIPE_WEBHOOK_SECRET` for the exact Preview endpoint
- `PAYMENTS_ENTITLEMENT_STORE=neon`
- `FIRST_SALE_GATE_ENABLED=true`
- one approved target connection: managed `ENTITLEMENT_DB_DATABASE_URL` or manual `ENTITLEMENT_DB_URL`
- `ENTITLEMENT_SESSION_SECRET` with at least 32 random characters
- both applied migration versions from section 3

`ENTITLEMENT_DB_HMAC_SECRET` is reserved for privacy-preserving email lookup and is not a substitute for the session signing secret.

### Production payment readiness — not a Preview prerequisite

Production `getPaymentReadiness()` additionally fails closed unless all of these are present and valid:

- live-mode Stripe key and live Price/Product/tax contract
- `STRIPE_WEBHOOK_SECRET`
- `PAYMENTS_ENTITLEMENT_STORE=neon` and a recognised Postgres connection
- `FIRST_SALE_GATE_ENABLED=true` and the verified least-privilege runtime/operator role matrix
- `ENTITLEMENT_SESSION_SECRET`
- `BUSINESS_LEGAL_NAME`
- `BUSINESS_ABN` as 11 digits
- `NEXT_PUBLIC_SUPPORT_EMAIL` as a valid published address
- `operatorAlertsConfigured=true`, meaning `paymentAlertsConfigured()` accepts the Production payment-alert mail configuration
- optional `BUSINESS_TRADING_NAME`; the site name is the fallback
- explicit `PAYMENTS_ENABLED=true`

If `operatorAlertsConfigured` is false, `getPaymentReadiness().ready` is false and Production Checkout remains unavailable. A controlled purchase/refund alert reaching the monitored mailbox is still required as delivery evidence because configuration readiness alone does not prove SMTP delivery. Do not copy legal identity, ABN, keys or connection strings into this repository or a release report.

## 5. External settings classification

### Required before a payment/access Preview

- Stripe test Product/Price/tax-code relationship reviewed in Dashboard.
- Restricted key has Prices Read, Products Read, Checkout Sessions create/retrieve and PaymentIntents Read; the last permission is required to verify `latest_charge` before the atomic grant.
- Exact Preview webhook destination and signing secret configured for the required Checkout, refund and dispute events.
- Preview-scoped Neon database connection and entitlement migration verified.
- First-sale migration verified; runtime has no public-schema CREATE, direct protected-table DML, original entitlement-function execution or owner-reopen execution.
- Zero payable Resume Pro Checkout Sessions exist from before the gate; each old Session is explicitly expired.
- Preview environment variables assigned to the intended branch/deployment only.

### Required before Production, not before a payments-off Preview

- Stripe live business profile, support details, statement descriptor, Product eligibility, a restricted key with Prices Read, Products Read, Checkout Sessions create/retrieve and PaymentIntents Read, and the webhook destination.
- Published product-provider legal/registered name, ABN and support information. These fields do not establish the Managed Payments transaction seller; verify that separately from live Checkout and the issued receipt/invoice.
- Production payment operator alerts are enabled, the support mailbox is monitored, and controlled purchase/refund alerts have been received without exposing sensitive payment data.
- GitHub branch protection must mark the new `Quality gate` workflow as required; committing the workflow alone does not enforce it.
- Vercel environment scoping and deployment-protection review.

### Optional and held disabled

- Web Push VAPID keys, provider delivery, `CRON_SECRET` and push tables.
- Local performance connectors. These are local-development operator tools and must remain 404 in Preview/Production.

## 6. CI and CSP release contract

- `.github/workflows/quality-gate.yml` runs locked `npm ci` on Node 22 and `npm run quality:gate` for pull requests and main pushes.
- `next.config.ts` adds production CSP and security headers. Production keeps `script-src 'self'`, isolates the audited Next.js hydration exception in `script-src-elem 'self' 'unsafe-inline'`, and blocks inline event attributes with `script-src-attr 'none'`.
- The residual inline hydration risk and removal path remain documented in `docs/csp-hardening.md`.
- `public/sw.js` and its response handling are unchanged from `origin/main`; no service-worker durability claim is part of this candidate.
- Preview verification must inspect the actual HTTP response header and exercise hydrated Builder input; a source-only CSP check is insufficient.

## 7. Completed local checks and remaining Preview conditions

After integrating current main and resolving all overlaps, the local candidate produced these results:

1. `git diff --name-only --diff-filter=D origin/main..HEAD` returns no file. English-card and Job Move routes remain in the successful production build.
2. `git diff --check` passes. The manifest finalization commit must leave the working tree clean.
3. `npm run quality:gate` passes, including the production build of 108 pages, lint, security/CSP/JSON-LD/navigation, Stripe Checkout/Product/failure handling, entitlement ordering/isolation, Resume Pro mobile/interview/onboarding/privacy, anonymous funnel, `test:push-exclusion`, database operations and secret scan. This release has no push-delivery test or runtime.
4. A production-mode local server returned HTTP 200 for `/resume-pro` with the expected CSP, including `script-src 'self'`, `script-src-attr 'none'`, `object-src 'none'`, `form-action 'self'` and `frame-ancestors 'none'`.
5. `npm run payments:check -- --strict` runs only inside an intentionally configured target environment. Add `--verify-stripe` only when read-only external verification is separately approved.
6. If payments remain off, confirm the purchase CTA is unavailable and no Checkout call occurs.
7. Confirm push remains disabled; do not invoke a provider or cron test in this release.

## 8. Rollback and stop criteria

- **Historical candidate:** `7904086` remains permanently non-deployable. The rebuilt mainline preserves the 19 main-only commits and has passed the local Preview gate.
- **Live evidence HOLD:** do not enable Production payments until the actual customer-visible Checkout transaction seller, issued receipt/invoice issuer and tax-liability presentation are recorded. `BUSINESS_LEGAL_NAME` identifies the product provider only and is not proof of the Managed Payments Merchant of Record.
- **Build, CSP or hydration failure:** stop and restore the last known-good application deployment; do not weaken CSP ad hoc.
- **Checkout/Product/tax/support/seller failure:** keep or set `PAYMENTS_ENABLED=false`; no customer should reach Checkout.
- **Webhook, entitlement, recovery, refund or shared-device privacy failure:** disable payments and retain all database/event evidence. Do not repair by granting access from a success URL.
- **Push schema/provider uncertainty or any push 404/410 pattern:** keep `PUSH_REMINDERS_ENABLED=false`; do not drop tables or retry sends without durable claims.
- **CI not required or bypassed:** no release, even if a local gate passed.
- **Secret scan finding:** stop immediately, rotate the affected credential outside this repository, remove it from history using the approved incident process, then rerun the full gate.

This manifest authorises no deployment, migration, key change, external API call, payment, refund, customer contact or production configuration change.
