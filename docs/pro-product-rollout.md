# Hoju Compass Pro product rollout

This document keeps public product labels aligned with the checkout and access systems that actually exist. A workspace being functionally useful does not make it ready to sell.

## Current status

| Product | Public status | Workspace | Payment and access |
| --- | --- | --- | --- |
| Resume Pro | Live when the production readiness contract passes | Complete and protected in production | Live one-time purchase, signed-webhook entitlement, recovery and refund revocation verified on 20 August 2026 |
| Rental Pack Pro | Controlled release readiness | Multi-property workspace with reusable profile and evidence library, property-isolated checklists and contact logs, due-action warnings, jurisdiction guidance and PDF/TXT/JSON export; protected by its own entitlement in deployed builds | Checkout, success, recovery, refund revocation and release code verified; product-specific switch remains off until live approval |
| Pay Evidence Pack Pro | Feature validation | Implemented as a local-only prototype | No public checkout or entitlement yet |
| EOFY Pack Pro | Feature validation | Implemented as a local-only prototype | No public checkout or entitlement yet |
| Leaving Australia Pack Pro | Feature validation | Implemented as a local-only prototype | No public checkout or entitlement yet |

The homepage and Pro catalogue must derive Resume Pro's live label from the production payment-readiness contract. They must never infer availability from a hard-coded date or price.

## Next product: Rental Pack Pro

`Rental Pack Pro` is the customer-facing name. `Rental Application Pack Pro` remains the formal checkout and purchase-record name so existing product metadata, terms and support records stay unambiguous. The product is the next candidate because its expanded workspace reduces repeated work across multiple applications while remaining a preparation package rather than a legal or tenancy decision.

The product-isolation foundation and application flow are implemented: Resume Pro and Rental Application Pack use separate product codes throughout checkout metadata, webhook grants, signed access cookies, active-entitlement lookups and restore-code consumption. Rental Application Pack also has its own Price variable and product-specific kill switch. A read-only Production Neon query on 29 August 2026 confirmed that the `purchase_entitlements_product_code_check` constraint already permits `rental_application_pro`; no additional product-code migration is required before the controlled live test.

The prior candidate-duplication flow copied property-specific document states and message drafts into a new property. That launch blocker was removed on 23 August 2026. Reusable evidence now has its own preparation state and review date, while a new property receives only lease-condition defaults; address, agent, messages, submission state, privacy checks and follow-up history stay isolated.

Before public sale:

1. Confirm A$14.90 as the one-time price after the paid-flow test. The public name is `Rental Pack Pro`; the 30-day period applies to the device session and one-time restore code, not expiry of an active purchase entitlement.
2. Keep the verified product-code constraint in place; the Production database check passed on 29 August 2026.
3. Add a dedicated Stripe Product and one-time Price, then validate its currency, amount and active state on the server.
4. Verify the implemented server-only Checkout reuses Managed Payments and seller-detail safeguards and records purchase-terms version `2026-08-22`.
5. Verify the implemented production workspace gate accepts only an active `rental_application_pro` entitlement.
6. Verify the implemented product-specific success, access recovery, release and payment-help paths.
7. Verify test purchase, duplicate and out-of-order webhooks, recovery-code single use, full refund and immediate access revocation.
8. Complete one controlled live purchase and full refund before changing the public status to available.

Before changing either Production switch, run `npm run payments:check -- --product=rental-application-pro --strict` in the target environment. The Rental mode verifies the shared payment contract plus the product-specific Price and kill switch without printing credentials or private seller values.

Checkout-off Production preparation completed on 29 August 2026: the live one-time AUD 14.90 inclusive Price exists and is Managed Payments eligible, the dedicated Production Price variable exists, the product switch remains `false`, and release commit `e687904` is deployed with the public page still reporting payment unavailable. A controlled live payment still requires a fresh deployment-conflict check, strict audit, explicit switch approval, one real purchase and a full refund with immediate entitlement revocation.

Integration is on hold pending deliberate reconciliation with current `main` at `97c8b5c`. A dry merge found substantial overlap with newer payment, entitlement, webhook and access-session security work, so the Rental changes must be replayed or reconciled onto that architecture and fully revalidated before any checkout switch change or controlled charge.

## Later products

- Pay Evidence Pack Pro needs an additional employment-information review so the tool does not present an entered difference as a legal underpayment finding.
- EOFY Pack Pro needs an additional tax-information review so it remains preparation support and does not calculate deductions or promise a refund.
- Leaving Australia Pack Pro needs an additional migration, tax and Super review so it does not determine visa, residency or DASP eligibility.

Until each product passes the same checkout, entitlement, recovery and refund gates as Resume Pro, its production workspace remains inaccessible and its displayed amount remains a proposed price rather than a chargeable offer.
