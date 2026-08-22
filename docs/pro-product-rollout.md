# Hoju Compass Pro product rollout

This document keeps public product labels aligned with the checkout and access systems that actually exist. A workspace being functionally useful does not make it ready to sell.

## Current status

| Product | Public status | Workspace | Payment and access |
| --- | --- | --- | --- |
| Resume Pro | Live when the production readiness contract passes | Complete and protected in production | Live one-time purchase, signed-webhook entitlement, recovery and refund revocation verified on 20 August 2026 |
| Rental Application Pack Pro | Paid-flow validation | Implemented and protected by its own entitlement in deployed builds | Checkout, success, recovery and release code complete; product-specific switch remains off until controlled verification |
| Pay Evidence Pack Pro | Feature validation | Implemented as a local-only prototype | No public checkout or entitlement yet |
| EOFY Pack Pro | Feature validation | Implemented as a local-only prototype | No public checkout or entitlement yet |
| Leaving Australia Pack Pro | Feature validation | Implemented as a local-only prototype | No public checkout or entitlement yet |

The homepage and Pro catalogue must derive Resume Pro's live label from the production payment-readiness contract. They must never infer availability from a hard-coded date or price.

## Next product: Rental Application Pack Pro

Rental Application Pack Pro is the next candidate because the workspace is already implemented and its output is a preparation package rather than a tax, employment-law or migration decision.

The product-isolation foundation and application flow are implemented: Resume Pro and Rental Application Pack use separate product codes throughout checkout metadata, webhook grants, signed access cookies, active-entitlement lookups and restore-code consumption. Rental Application Pack also has its own Price variable and product-specific kill switch. The database constraint expansion must be applied and verified before the switch is enabled in a test environment.

Before public sale:

1. Confirm the proposed product name and A$14.90 one-time price after the paid-flow test. The 30-day period applies to the device session and one-time restore code, not expiry of an active purchase entitlement.
2. Apply and verify the prepared product-code constraint expansion in the entitlement database.
3. Add a dedicated Stripe Product and one-time Price, then validate its currency, amount and active state on the server.
4. Verify the implemented server-only Checkout reuses Managed Payments and seller-detail safeguards and records purchase-terms version `2026-08-22`.
5. Verify the implemented production workspace gate accepts only an active `rental_application_pro` entitlement.
6. Verify the implemented product-specific success, access recovery, release and payment-help paths.
7. Verify test purchase, duplicate and out-of-order webhooks, recovery-code single use, full refund and immediate access revocation.
8. Complete one controlled live purchase and full refund before changing the public status to available.

## Later products

- Pay Evidence Pack Pro needs an additional employment-information review so the tool does not present an entered difference as a legal underpayment finding.
- EOFY Pack Pro needs an additional tax-information review so it remains preparation support and does not calculate deductions or promise a refund.
- Leaving Australia Pack Pro needs an additional migration, tax and Super review so it does not determine visa, residency or DASP eligibility.

Until each product passes the same checkout, entitlement, recovery and refund gates as Resume Pro, its production workspace remains inaccessible and its displayed amount remains a proposed price rather than a chargeable offer.
