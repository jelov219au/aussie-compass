# Hoju Compass Pro product rollout

This document keeps public product labels aligned with the checkout and access systems that actually exist. A workspace being functionally useful does not make it ready to sell.

## Current status

| Product | Public status | Workspace | Payment and access |
| --- | --- | --- | --- |
| Resume Pro | Live when the production readiness contract passes | Complete and protected in production | Live one-time purchase, signed-webhook entitlement, recovery and refund revocation verified on 20 August 2026 |
| Rental Application Pack Pro | Feature validation | Implemented as a local-only prototype | No public checkout or entitlement yet |
| Pay Evidence Pack Pro | Feature validation | Implemented as a local-only prototype | No public checkout or entitlement yet |
| EOFY Pack Pro | Feature validation | Implemented as a local-only prototype | No public checkout or entitlement yet |
| Leaving Australia Pack Pro | Feature validation | Implemented as a local-only prototype | No public checkout or entitlement yet |

The homepage and Pro catalogue must derive Resume Pro's live label from the production payment-readiness contract. They must never infer availability from a hard-coded date or price.

## Next product: Rental Application Pack Pro

Rental Application Pack Pro is the next candidate because the workspace is already implemented and its output is a preparation package rather than a tax, employment-law or migration decision.

The product-isolation foundation is now in progress: Resume Pro and Rental Application Pack use separate product codes throughout webhook grants, active-entitlement lookups and restore-code consumption. The database constraint expansion must be applied and verified before any Rental checkout test is enabled.

Before public sale:

1. Confirm the final product name, one-time price, included access period and refund wording.
2. Apply and verify the prepared product-code constraint expansion in the entitlement database.
3. Add a dedicated Stripe Product and one-time Price, then validate its currency, amount and active state on the server.
4. Create checkout only from the server, reuse the Managed Payments and seller-detail safeguards, and store the purchase-terms version.
5. Protect the production workspace with the matching active entitlement. Keep the local-only gate until this is complete.
6. Add product-specific success, access recovery, release and payment-help paths.
7. Verify test purchase, duplicate and out-of-order webhooks, recovery-code single use, full refund and immediate access revocation.
8. Complete one controlled live purchase and full refund before changing the public status to available.

## Later products

- Pay Evidence Pack Pro needs an additional employment-information review so the tool does not present an entered difference as a legal underpayment finding.
- EOFY Pack Pro needs an additional tax-information review so it remains preparation support and does not calculate deductions or promise a refund.
- Leaving Australia Pack Pro needs an additional migration, tax and Super review so it does not determine visa, residency or DASP eligibility.

Until each product passes the same checkout, entitlement, recovery and refund gates as Resume Pro, its production workspace remains inaccessible and its displayed amount remains a proposed price rather than a chargeable offer.
