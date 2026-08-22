# Resume Pro mobile preview audit

- Audited: 2026-08-23 (Australia/Sydney)
- Branch: `codex/resume-pro-mobile-conversion`
- Preview commit: `d32aeb0`
- Preview: `https://aussie-compass-dvp70kwaj-aussiecompass.vercel.app/resume-pro`
- Decision: **HOLD — P0 privacy boundary**

## Purchase path evidence

The pre-purchase path was checked without starting a real payment or changing live Stripe settings.

| Viewport | Result |
| --- | --- |
| 390 px | No horizontal overflow. Product value appears before checkout. Consent is required before the 48 px checkout button is enabled. Terms, refund and privacy links are present once each in the checkout section. |
| 768 px | No horizontal overflow. The same value-to-consent order and disabled-to-enabled checkout state were confirmed. The consent control meets the 24 px minimum pointer target. |
| Desktop (1280 px) | No horizontal overflow. Value, policy links and consent gating remain in the same order. |

The checkout uses a native labelled checkbox, ordinary links and a button in DOM order. Browser-default focus outlines remain visible. Automated Tab traversal could not be captured reliably by the browser harness, so this record does not claim end-to-end physical keyboard proof.

## Sandbox workspace evidence

- Empty state: no saved applications, no export action enabled, and the local-only privacy notice is visible.
- Persistence: one application and its selected STAR experience remained connected after reload on the same local test origin.
- Backward compatibility: older application drafts without `starStoryId` fall back to an empty selection.
- TXT package: the completion state was shown after export, and the contract test confirms that the selected reusable STAR experience is included.
- Privacy notice: the workspace states that drafts remain in the current browser and are not sent to an external AI or server.
- STAR limit: 20 records are retained. Creating a 21st record is now blocked instead of silently evicting the oldest record.

## Blocking P0

The access-release route clears only the Resume Pro access cookie. Resume, application and STAR drafts remain in browser storage. If a different entitlement is later activated on the same browser profile, the previous person's drafts may become visible.

This branch intentionally does not duplicate the quality team's complete-delete implementation. Launch remains blocked until that change is merged and a browser test demonstrates all of the following on a sandbox path:

1. Save resume, application and STAR data under entitlement A.
2. Release access and fully delete the locally stored Resume Pro data.
3. Activate entitlement B on the same browser profile.
4. Confirm that the workspace opens with no data from entitlement A.

No launch decision may be issued without that save-release-reactivate evidence.

## Gates

- `npm run lint`
- `npm run build`
- `npx tsc --noEmit`
- `npm run test:resume-mobile-value`
- `npm run test:stripe-contract`
- `npm run test:resume-pro-tokens`
- `npm run test:entitlement-ordering`
- `npm run test:product-entitlements`
- `npm run test:payment-alerts`
- `npm run security:secrets`
- `git diff --check`

All gates above passed for the preview code. They do not override the P0 hold.
