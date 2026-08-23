# Hoju Compass release candidate manifest — 23 August 2026

This manifest is a read-only release-scope audit. It records repository contracts only; it does not confirm or expose any deployed environment value, credential, database row, Stripe object or external service state.

## 1. Frozen comparison and release decision

| Item | Frozen value |
| --- | --- |
| Local deployment reference inspected | local `origin/main` at `7910525c539408535e343ea1eff7fe8ebc510bec` |
| Current application branch | `codex/first-customer-discovery-accessibility` |
| Application head before this manifest finalization | `b0434caefe345ed8fb3cda17a3fe5d18880044d6` |
| Application delta from local `origin/main` | 108 files, 10,233 insertions, 554 deletions, deleted files **0** |
| Historical non-deployable candidate | `7904086e676ec40f2f8d3207546728b08d74b1d8` (audit evidence only) |
| Protected Preview decision | **HOLD** until the actual Vercel Source SHA, Preview environment and variable scopes, Deployment Protection, global `noindex` response, alias isolation and analytics isolation are verified |
| Production/live decision | **HOLD** until target environment, migration and actual Checkout/receipt seller evidence are verified |

The historical `7904086` candidate is not a descendant of the current deployment reference. Deploying it directly would remove current main features, including the English phrase-card pages/assets and Job Move Pro research/survey files. That route remains prohibited. The application candidate now being finalized is `codex/first-customer-discovery-accessibility`; at application head `b0434ca`, the English-card and Job Move paths remain present and `git diff --name-only --diff-filter=D origin/main..HEAD` returns no file.

The application-head hash above identifies the code state before this document-only finalization. It is not a deploy instruction. After the manifest commit is created, obtain the deploy candidate with `git rev-parse HEAD` and require the full result to equal the full Vercel Source SHA. Do not hardcode that self-referential post-finalization hash into this document, accept an abbreviated match or infer identity from a branch name, deployment URL or build timestamp.

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

### Mainline reconstruction result and current application candidate

The historical release candidate was rebuilt on `codex/resume-pro-mainline-release`, created exactly from `origin/main` at `7910525c539408535e343ea1eff7fe8ebc510bec`. Subsequent reviewed work now places the application candidate on `codex/first-customer-discovery-accessibility` at the pre-manifest application head recorded in the table. The old `7904086` candidate remains audit evidence only.

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

## 2. Current application release file groups

The historical hashes above explain the reconstruction lineage. The authoritative deploy inventory is the clean tree at the full post-finalization `git rev-parse HEAD`, which must match the full Vercel Source SHA. The application work is grouped as follows:

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

The target database must already have the entitlement/tombstone baseline and `20260823_first_sale_gate_charge_link_v2`. With payments off, apply `docs/migrations/20260823_payment_operator_alert_outbox_v1.sql`, then `docs/migrations/20260823_checkout_activation_nonce_v1.sql`, then `docs/migrations/20260823_purchase_access_sessions_v1.sql`, then `docs/migrations/20260823_restore_activation_nonce_v1.sql`. The outbox receipt trigger commits or rolls back with the webhook receipt and entitlement mutation. Activation and restore each bind a browser nonce hash to one stable server-tracked access session; every cookie is checked against an active, unexpired and unrevoked session. Device release revokes only that session and blocks same-nonce response-loss reminting. These additive files are independently transactional and may not be combined or reordered.

- A static/UI Preview with `PAYMENTS_ENABLED=false` does not require a database migration.
- Checkout is now fail-closed without the entitlement database, first-sale migration and `FIRST_SALE_GATE_ENABLED=true`; there is no persistence-free Session mode.
- A full payment/access Preview requires all five ordered versions, target-Preview database connection, least-privilege role matrix and signing settings.
- Required catalog evidence is: all five versions exist; the historical 9- and 11-argument `apply_first_sale_paid_event` signatures are absent and exactly one 12-argument signature exists; obsolete 2-/3-/4-argument activation and 2-/5-argument restore consume signatures are absent, with one 7-argument activation and one 6-argument restore consume remaining. Runtime must have no protected-table direct access or internal outbox trigger/enqueue execution, and must have only the adapter-called wrappers listed in the runbook. A missing/additional overload or privilege mismatch keeps payment launch **NO-GO**.
- Do not rerun or alter Production from this manifest. First perform the documented read-only schema check and record whether the version already exists.
- Never roll back payment tables by dropping them. On an incident, disable payments and roll back application code while preserving webhook and entitlement evidence.

### Push migration — excluded and not approved for this release

Production currently returns 404 for the push surface according to the supplied operating observation; this audit did not access Production. Keep `PUSH_REMINDERS_ENABLED=false` or unset.

This mainline candidate adds no push route, subscription/reminder/delivery DDL, delivery library, Web Push dependency, service-worker change or Vercel cron change. A future push release must independently introduce and verify `push_subscriptions`, `push_reminders` and the durable unique-claim table `push_deliveries`; **do not enable push if `push_deliveries` is absent.** None of that future work is implied by this release.

## 4. Environment contract without values

No value was read during this audit.

### Safe initial Preview

- `PAYMENTS_ENABLED=false`
- `FIRST_SALE_GATE_ENABLED=false`
- `PAYMENT_ALERTS_ENABLED=false`
- `STRIPE_MANAGED_PAYMENTS_ENABLED=false` or unset
- `PUSH_REMINDERS_ENABLED=false` or unset
- Operator-only routes remain production-build 404 through `requireLocalOperatorAccess`; do not add deployment credentials for them.

Assign none of the following variables to the Stage 1 Preview scope:

- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_RESUME_PRO_PRICE_ID`
- `STRIPE_RESUME_PRO_PRODUCT_ID`
- `STRIPE_RESUME_PRO_TAX_CODE`
- `PAYMENTS_ENTITLEMENT_STORE`
- `ENTITLEMENT_DB_URL`
- `ENTITLEMENT_DB_DATABASE_URL`
- `ENTITLEMENT_DB_HMAC_SECRET`
- `ENTITLEMENT_SESSION_SECRET`
- `ZOHO_SMTP_APP_PASSWORD`
- `STRIPE_ACCOUNTING_KEY`
- `STRIPE_PERFORMANCE_KEY`

No value may be copied into this manifest, build log, smoke report or chat. These names are the complete Stage 1 assignment exclusion list; inherited team/project values count as assigned and must be removed from the Preview scope before deployment.

`PAYMENTS_ENABLED=false` is the Checkout/readiness switch, not a global network kill switch. It makes a valid Resume Pro Checkout request fail closed before Stripe Session creation, but it does not independently disable the signed webhook route, purchase restore/access routes, Job Move survey email or a future Web Push runtime. Those paths are controlled by their own signing secret, store/database, session, SMTP and push settings. Stage 1 therefore requires both the explicit false switches and the complete Preview variable non-assignment above.

This mode supports layout, mobile, content, CSP and free Builder testing without intentionally invoking Stripe, Neon, SMTP or Web Push. The guarantee comes from environment isolation plus GET-only smoke coverage, not from `PAYMENTS_ENABLED` alone.

### Resume Pro Checkout test Preview

This is not part of Stage 1. Only under a later, separate approval may Checkout use Preview-scoped test values for all of:

- `PAYMENTS_ENABLED=true`
- `STRIPE_SECRET_KEY` in test mode, preferably least-privilege `rk_test_`
- `STRIPE_RESUME_PRO_PRICE_ID`
- `STRIPE_RESUME_PRO_PRODUCT_ID`
- `STRIPE_RESUME_PRO_TAX_CODE`
- `STRIPE_MANAGED_PAYMENTS_ENABLED=true`

The Price must be active, one-time, AUD 19.90, tax-inclusive and test-mode. Its expanded active Product must match the independently configured Product ID and exact Dashboard-approved Managed Payments tax code. Missing values, restricted-key read denial, Product/tax mismatch or wrong mode fail closed before Session creation.

### Full test Checkout-to-access Preview

This is also outside Stage 1 and requires a separate approval. In addition to the Checkout variables, require:

- `STRIPE_WEBHOOK_SECRET` for the exact Preview endpoint
- `PAYMENTS_ENTITLEMENT_STORE=neon`
- `FIRST_SALE_GATE_ENABLED=true`
- one approved target connection: managed `ENTITLEMENT_DB_DATABASE_URL` or manual `ENTITLEMENT_DB_URL`
- `ENTITLEMENT_SESSION_SECRET` with at least 32 random characters
- every applied migration version listed in section 3

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
- Preview-scoped Neon database connection and ordered charge-link/outbox/activation/access-session migrations verified.
- First-sale migration verified; runtime has no public-schema CREATE, direct protected-table DML, original entitlement-function execution or owner-reopen execution.
- Zero payable Resume Pro Checkout Sessions exist from before the gate; each old Session is explicitly expired.
- Preview environment variables assigned to the intended branch/deployment only.

### Required before Production, not before a payments-off Preview

- Stripe live business profile, support details, statement descriptor, Product eligibility, a restricted key with Prices Read, Products Read, Checkout Sessions create/retrieve and PaymentIntents Read, and the webhook destination.
- Published product-provider legal/registered name, ABN and support information. These fields do not establish the Managed Payments transaction seller; verify that separately from live Checkout and the issued receipt/invoice.
- Production payment operator alerts are enabled, the support mailbox is monitored, and controlled purchase/refund alerts have been received. Evidence includes suffix-only references, outbox pending/sent/attempt counts, SMTP fail→503→retry, busy-worker 503 and stale-lease recovery without sensitive payment data.
- Access evidence includes activation/restore session issuance, consumed/idempotent/released outcomes, same-nonce stable-session response-loss recovery, old-cookie denial after release-response loss, another device remaining active, different-nonce replay denial, refund/review/expiry denial, legacy-cookie denial and URL query removal after hydration.
- Post-purchase UX evidence distinguishes refunded support from under-review status recheck, keeps restore/replay paths on the free Builder instead of the purchase page, suppresses activation/restore priority for refund/review, and emits none of the six fixed Resume funnel events from those issue pages.
- GitHub branch protection must mark the new `Quality gate` workflow as required; committing the workflow alone does not enforce it.
- Vercel environment scoping and deployment-protection review.

### Required before the protected Stage 1 GET-only Preview

- Vercel identifies the deployment as `Preview`, and the full Source SHA exactly equals the full local `git rev-parse HEAD` captured after this manifest finalization. A branch label, abbreviated SHA, deployment URL or build timestamp is not identity evidence.
- The Stage 1 false switches and non-assignment list in section 4 are verified at both project and team inheritance levels. Production values may not be copied, temporarily shared or exposed to Preview.
- Deployment Protection blocks unauthenticated access. The generated Preview deployment has no Production/custom-domain alias, and the existing Production deployment and alias set remain unchanged.
- The actual Preview response for every smoke page carries a global `X-Robots-Tag` containing `noindex`. `src/app/robots.ts` currently allows crawling and therefore cannot substitute for this platform response evidence.
- Preview analytics are disabled or demonstrably isolated from Production reporting. Evidence must show that Preview page views and the six fixed Resume funnel events cannot enter Production metrics; assumption based on the shared Vercel project is insufficient.
- Capture only the variable names, booleans, status codes, full deploy SHA comparison result and masked deployment references. Do not record a secret, connection string, raw URL, legal identity value or customer data.

### Optional and held disabled

- Web Push VAPID keys, provider delivery, `CRON_SECRET` and push tables.
- Local performance connectors. These are local-development operator tools and must remain 404 in Preview/Production.

## 6. CI and CSP release contract

- `.github/workflows/quality-gate.yml` runs locked `npm ci` on Node 22 and `npm run quality:gate` for pull requests and main pushes.
- `next.config.ts` adds production CSP and security headers. Production keeps `script-src 'self'`, isolates the audited Next.js hydration exception in `script-src-elem 'self' 'unsafe-inline'`, and blocks inline event attributes with `script-src-attr 'none'`.
- The residual inline hydration risk and removal path remain documented in `docs/csp-hardening.md`.
- `public/sw.js` and its response handling are unchanged from `origin/main`; no service-worker durability claim is part of this candidate.
- Preview verification must inspect the actual HTTP response header and exercise hydrated Builder input; a source-only CSP check is insufficient.
- `src/app/robots.ts` is allow-all, so the protected Preview remains **HOLD** unless every GET-only smoke response proves platform-level `X-Robots-Tag: noindex` and Deployment Protection. Do not promote a Preview merely because individual private pages contain metadata-level `noindex`.

## 7. Completed local checks and remaining Preview conditions

At pre-manifest application head `b0434caefe345ed8fb3cda17a3fe5d18880044d6`, the current branch produced these local facts:

1. The current branch is `codex/first-customer-discovery-accessibility`; local `origin/main` is `7910525c539408535e343ea1eff7fe8ebc510bec`.
2. The application delta is 108 files, 10,233 insertions and 554 deletions; `git diff --name-only --diff-filter=D origin/main..HEAD` returns no file. English-card and Job Move routes remain in the successful production build.
3. `git diff --check` passes. The manifest finalization commit must leave the working tree clean and must not alter `package-lock.json`.
4. `npm run quality:gate` passes, including the production build of 108 pages, lint, security/CSP/JSON-LD/navigation, Stripe Checkout/Product/failure handling, entitlement ordering/isolation, Resume Pro Builder storage/mobile/interview/onboarding/privacy, anonymous funnel, `test:push-exclusion`, database operations and secret scan. This release has no push-delivery test or runtime.
5. A production-mode local server returned HTTP 200 for `/resume-pro` with the expected CSP, including `script-src 'self'`, `script-src-attr 'none'`, `object-src 'none'`, `form-action 'self'` and `frame-ancestors 'none'`.
6. `npm run payments:check -- --preflight --strict --verify-stripe --verify-database` runs only inside an intentionally configured target environment while Checkout remains off and with the separately approved read-only audit database credential injected for that command. Strict mode fails when either remote verification flag is absent; local environment settings alone can never produce a launch pass. The command is not part of Stage 1.
7. If payments remain off, confirm the purchase CTA is unavailable and no Checkout request occurs. Confirm push remains disabled; do not invoke a provider or cron test in this release.

### Stage 1 GET-only smoke contract

After explicit Preview approval, use authenticated GET requests only for `/`, `/resume-builder`, `/resume-pro`, `/resources/english-resume-achievement-examples`, `/terms`, `/purchase-information`, `/privacy`, `/contact`, `/payment-help`, `/robots.txt` and `/sitemap.xml`. Application pages must return 200, hydrated Builder input must work, `/resume-pro` must omit the Checkout form and show the unavailable/preview state, and every response must carry the required CSP and platform-level `X-Robots-Tag` containing `noindex`. An unauthenticated request must be intercepted by Deployment Protection rather than return the application page with HTTP 200.

Do not send any Stage 1 POST, do not add a `session_id` to the success URL and do not open the paid workspace as a smoke test. In particular, never call:

- `POST /api/checkout/resume-pro`
- `POST /api/stripe/webhook`
- `POST /api/resume-pro/access/activate`
- `POST /api/resume-pro/access/release`
- `POST /api/resume-pro/restore`
- `POST /api/resume-pro/restore-code`
- `POST /api/job-move-survey`
- operator/performance connection endpoints, database migrations, accounting export, SMTP delivery or Web Push delivery

The following are code-level environment-isolation expectations, not Stage 1 smoke instructions. Verifying them with POST belongs to a separately approved integration stage.

| Normal-form request with Stage 1 environment | Expected fail-closed result | External boundary not reached |
| --- | --- | --- |
| Valid same-origin Checkout POST, accepted terms and JSON response requested while `PAYMENTS_ENABLED=false` | HTTP 503, `Cache-Control: no-store`, public `checkout_unavailable`, `retryable=false` | no Stripe Price lookup, first-sale DB claim or Checkout Session creation |
| Webhook POST while `STRIPE_WEBHOOK_SECRET` is unassigned | HTTP 503 with `Cache-Control: no-store` before signature processing | no Stripe client, entitlement/first-sale DB or SMTP/outbox delivery |
| Restore POST while `PAYMENTS_ENTITLEMENT_STORE` and database variables are unassigned | HTTP 503 `restore_unavailable` with `Cache-Control: no-store` | no Neon query, access-session issuance or cookie grant |
| Otherwise valid Job Move survey POST while `ZOHO_SMTP_APP_PASSWORD` is unassigned | HTTP 503 survey-unavailable response | no SMTP connection or survey email delivery |

Stage 1 records these as static/runtime contract expectations only and sends none of the POST requests.

## 8. Rollback and stop criteria

- **Historical candidate:** `7904086` remains permanently non-deployable. The rebuilt mainline preserves the 19 main-only commits and has passed the local Preview gate.
- **Protected Preview HOLD:** do not create, promote or alias the Preview until the full local post-finalization SHA can be compared with the full Vercel Source SHA and the Preview scope, protection, global `noindex`, analytics isolation and alias isolation evidence plan is ready.
- **Credential scope leak:** stop if any live/Production Stripe, Neon, SMTP, accounting, session-signing or other Production credential is assigned or inherited in the Preview environment, even when a feature switch is false.
- **Wrong environment or alias:** stop immediately if Vercel reports Production, any Production/custom-domain alias changes, the Source SHA differs, or the deployment URL is being used as identity evidence. Leave the existing Production deployment untouched and restore its prior alias only through a separately approved operation.
- **External-call evidence:** stop if Stage 1 invokes Stripe, Neon, SMTP, Web Push, accounting export, migrations or any prohibited POST. Setting `PAYMENTS_ENABLED=false` does not waive this stop condition.
- **Indexing or analytics leakage:** stop if any smoke response lacks platform-level `noindex`, if Deployment Protection permits unauthenticated application HTTP 200, or if Preview analytics can enter Production metrics.
- **Live evidence HOLD:** do not enable Production payments until the actual customer-visible Checkout transaction seller, issued receipt/invoice issuer and tax-liability presentation are recorded. `BUSINESS_LEGAL_NAME` identifies the product provider only and is not proof of the Managed Payments Merchant of Record.
- **Build, CSP or hydration failure:** stop and restore the last known-good application deployment; do not weaken CSP ad hoc.
- **Checkout/Product/tax/support/seller failure:** keep or set `PAYMENTS_ENABLED=false`; no customer should reach Checkout.
- **Webhook, entitlement, recovery, refund or shared-device privacy failure:** disable payments and retain all database/event evidence. Do not repair by granting access from a success URL.
- **Push schema/provider uncertainty or any push 404/410 pattern:** keep `PUSH_REMINDERS_ENABLED=false`; do not drop tables or retry sends without durable claims.
- **CI not required or bypassed:** no release, even if a local gate passed.
- **Secret scan finding:** stop immediately, rotate the affected credential outside this repository, remove it from history using the approved incident process, then rerun the full gate.

Stage 1 rollback means do not promote the Preview and preserve the last known-good Production deployment, aliases, environment variables and external-service state. Do not drop or mutate a database, expire a Stripe object, send an email, retry a webhook or change a Production secret as part of Preview rollback. Disabling/deleting the Preview, removing a remote branch or restoring an alias is itself a separately approved external change.

This manifest authorises no deployment, push, remote branch, alias change, migration, key change, external API call, payment, refund, customer contact or Production configuration change.
