# Hoju Compass Pro product rollout

This document keeps public product labels aligned with the checkout and access systems that actually exist. A workspace being functionally useful does not make it ready to sell.

## Current status

| Product | Public status | Workspace | Payment and access |
| --- | --- | --- | --- |
| Resume Pro | Live when the production readiness contract passes | Complete and protected in production | Live one-time purchase, signed-webhook entitlement, recovery and refund revocation verified on 20 August 2026 |
| Rental Pack Pro | Controlled release readiness | Expanded 20-candidate local workspace reconciled with current `main`; protected by its own entitlement in deployed builds | Checkout, success, recovery and release code complete; live Product and Price exist, and the product-specific switch remains off |
| Pay Evidence Pack Pro | Feature validation | Implemented as a local-only prototype | No public checkout or entitlement yet |
| EOFY Pack Pro | Feature validation | Implemented as a local-only prototype | No public checkout or entitlement yet |
| Leaving Australia Pack Pro | Feature validation | Implemented as a local-only prototype | No public checkout or entitlement yet |

The homepage and Pro catalogue must derive Resume Pro's live label from the production payment-readiness contract. They must never infer availability from a hard-coded date or price.

## Next product: Rental Pack Pro

`Rental Pack Pro` is the customer-facing name. `Rental Application Pack Pro` remains the formal checkout and purchase-record name so existing product metadata, terms and support records stay unambiguous. The product is the next candidate because its expanded workspace reduces repeated work across multiple applications while remaining a preparation package rather than a legal or tenancy decision.

The product-isolation foundation and application flow are implemented: Resume Pro and Rental Application Pack use separate product codes throughout checkout metadata, webhook grants, signed access cookies, active-entitlement lookups and restore-code consumption. Rental Application Pack also has its own Price variable and product-specific kill switch. A read-only Production Neon query on 29 August 2026 confirmed that the existing product-code constraint already permits `rental_application_pro`; no constraint migration is required for the controlled live test.

Before public sale:

1. Confirm A$14.90 as the one-time price after the paid-flow test. The public name is `Rental Pack Pro`; the formal checkout record remains `Rental Application Pack Pro`. The 30-day period applies to the device session and one-time restore code, not expiry of an active purchase entitlement.
2. Keep the verified Product-code constraint in place; the Production database check passed on 29 August 2026.
3. Keep the dedicated live Stripe Product and one-time AUD 14.90 inclusive Price active, and validate its currency, amount, mode, Product metadata and active state through the product-aware launch audit.
4. Verify the implemented server-only Checkout reuses Managed Payments and seller-detail safeguards and records purchase-terms version `2026-08-22`.
5. Verify the implemented production workspace gate accepts only an active `rental_application_pro` entitlement.
6. Verify the implemented product-specific success, access recovery, release and payment-help paths.
7. Verify test purchase, duplicate and out-of-order webhooks, recovery-code single use, full refund and immediate access revocation.
8. Complete one controlled live purchase and full refund before changing the public status to available.

Checkout-off Production preparation completed on 29 August 2026 with the Rental switch set to `false`. The preserved release work was subsequently reconciled with `main` at `c2025ff` in merge commit `40d0b76`; payment, webhook, entitlement, access-session and first-sale conflicts retain `main`'s newer security architecture. After Rental contracts, current-main payment preflight contracts, TypeScript, full lint, build and secret scanning passed, the owner approved the reconciled preparation deployment. Exact source `072fe2a18b7b1349edf1ceca17e5c4bb882e22cf` was promoted as Vercel Production deployment `F1qCXD7cuD8G1cM1q5T7EYjxjJXn`, reached `Ready`, and passed public checkout-off and unauthorised-workspace checks on `hojucompass.com`. The Rental switch remains `false`; checkout activation and a controlled charge still require separate action-time approval.

### Rental accounting isolation gate

The Stripe Balance Transaction export is an account-level source ledger. It has
no trustworthy `product_code`, so Rental rows will arrive in the same source
file as Resume Pro, payouts and account-level adjustments. Never infer a product
from amount, description, statement descriptor, alert subject, timing or payout
batch. Adding a guessed product column to that immutable source is also
forbidden.

Keep the Rental product switch off until a private attribution index proves all
of the following for the same Stripe mode and accounting window:

1. The private product catalogue maps `rental_application_pro` to its own exact
   Stripe Product and Price and proves neither is a Resume Pro identifier. Store
   full identifiers only in the approved private accounting location.
2. The controlled Rental Checkout's signed `metadata.product_code`, exact Price,
   PaymentIntent, Charge and Balance Transaction form one source-system chain.
   A payment-alert product label is operational notice only, not this evidence.
3. Every refund, dispute or chargeback inherits `rental_application_pro` only
   through its original Charge/PaymentIntent/Checkout chain. Amount matching or
   a nearby Rental alert is never sufficient.
4. A fee or tax amount is allocated to Rental only when the source relationship
   and applicable private document prove it. Anything account-level or unclear
   remains `UNALLOCATED`; customer-facing tax and Managed Payments withheld
   amounts remain `UNRESOLVED` until the registered tax-agent gate and source
   document support the treatment.
5. Payouts stay in the shared Stripe clearing reconciliation. A payout may
   contain multiple products and must never be relabelled as Rental revenue.
6. For `gross_amount`, `fee_amount` and `net_amount`, the sum of the Resume,
   Rental, other-product and `UNALLOCATED` private views exactly equals the
   immutable shared source ledger for the same `environment + currency + UTC
   window`. Rental purchase/refund posting must not change the Resume subledger
   totals.

The redacted PASS line is classifier output, not a manual checklist value.
Generate a fresh exact-shape template and run it only against a completed copy
in the approved private accounting location:

```powershell
npm.cmd run accounting:product-isolation -- --template
npm.cmd run accounting:product-isolation -- --file <private-json-path>
```

The current template is `schema_version=2`. A v1 file lacks the exact
Price→Product and non-app/UNALLOCATED checks and is a structural `STOP`; create
a fresh private input rather than copying prior PASS values.

The template requires separate Resume and Rental results for catalogue Product,
Price identity, amount/currency, signed Checkout `product_code`, Checkout →
PaymentIntent → Charge → Balance Transaction, refund/dispute and
support/entitlement linkage. It also requires cross-product proof that Product,
Price, PaymentIntent, Charge and Balance Transaction identities are distinct and
that any non-app Product or unmatched account-level row is excluded from Resume
and Rental and retained as `UNALLOCATED`, while the shared source ledger still
reconciles. An unrelated active Stripe Product is not a Resume launch blocker
and must not be disabled or altered for this gate. Keep full identifiers and
source documents out of the JSON. Do not copy Resume PASS values into Rental rows. The
Resume-only `first-sale:evidence` packet cannot prove Rental isolation and must
not be cloned with a changed `product_code`.

Only the exact live result
`ACCOUNTING_PRODUCT_ISOLATION=PASS mode=live products=resume_pro+rental_application_pro price_identity=PASS source_chain=PASS adjustment_support_chain=PASS non_app_unallocated=PASS shared_reconciliation=PASS unresolved=0`
is rollout evidence. A `mode=test` PASS is not live launch evidence. Any
`MISSING`/`FAIL`, missing or reused Product/Price identity, broken
PaymentIntent chain, cross-product refund/support link, non-zero reconciliation
difference, malformed file, hand-written result or interrupted command remains
`ACCOUNTING_PRODUCT_ISOLATION=UNRESOLVED` and launch `NO-GO`. Rental product
switch remains off. This accounting PASS does not enable the product, set a
price, make a sale, issue a refund or decide tax treatment.

## Later products

- Pay Evidence Pack Pro needs an additional employment-information review so the tool does not present an entered difference as a legal underpayment finding.
- EOFY Pack Pro needs an additional tax-information review so it remains preparation support and does not calculate deductions or promise a refund.
- Leaving Australia Pack Pro needs an additional migration, tax and Super review so it does not determine visa, residency or DASP eligibility.

Until each product passes the same checkout, entitlement, recovery and refund gates as Resume Pro, its production workspace remains inaccessible and its displayed amount remains a proposed price rather than a chargeable offer.
