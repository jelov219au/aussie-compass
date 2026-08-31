# Tenancy, repairs and bond sources — 31 August 2026

## Outcome

Verified the official bodies and purpose of all **15** tenancy/repair/bond URLs
left in the original restricted/network-error queue after the critical and
health-safety reviews. **All 15 retained; no URL replacement required.**
Together, **110 of the original 160** have a documented disposition; **50 remain**.
This is destination and selected-content verification, not a full legal review.
The original HTTP baseline and earlier dated reports remain unchanged.

[Per-URL evidence](audits/tenancy-source-review-2026-08-31.json) retains historical
reference line numbers and documents scope, cautions and six supporting pages.
Four supporting URLs are newly connected; two are navigation evidence only.
No login, form completion, application, call, email or personal-data entry occurred.

## Corrections users can act on

- TAS Condition Report: clarify that the two-day return period begins on
  **receipt of the report**, not a presumed moving day.
  [CBOS condition reports](https://cbos.tas.gov.au/topics/housing/renting/beginning-tenancy/condition-reports).
- TAS repairs: remove unconditional waiting until a response period expires.
  An Order for repairs application may be made earlier; the Commissioner may
  account for the remaining period when deciding when to issue an order.
  The form index describes the application PDF as hard-copy, not an online form.
  [Requesting repairs](https://cbos.tas.gov.au/topics/housing/renting/rental-maintenance-repairs-changes/requesting-repairs).
- TAS safety: the detailed Urgent page's 24-hour owner-contact condition is not
  a universal completion deadline or a waiting rule for Emergency repairs.
  Added linked general/urgent/emergency definitions and preserved qualified
  repairer, reimbursement and no-unilateral-rent-withholding safeguards.
  [Urgent repairs](https://cbos.tas.gov.au/topics/housing/renting/rental-maintenance-repairs-changes/urgent-repairs),
  [Emergency repairs](https://cbos.tas.gov.au/topics/housing/renting/rental-maintenance-repairs-changes/emergency-repairs).
- TAS bond: **10 days from the owner's claim lodgement** is distinct from
  **10 working days after dispute notification** for evidence. Court appeal
  deadlines must be checked separately in the determination.
  [Claiming](https://www.cbos.tas.gov.au/topics/housing/renting/bonds/claiming-a-bond),
  [Disputing](https://www.cbos.tas.gov.au/topics/housing/renting/bonds/disputes-about-a-bond/disputing-a-bond-claim).
- SA bond: add the direct non-consented-claim and counter-offer guide.
  Managing-party non-response within 14 days of a tenant claim is not presented
  as every tenant's response period; tenants must use their actual notice.
  Final inspection remains recommended evidence preparation, not an unsupported
  universal legal prerequisite to initiating a refund.
  [CBS dispute process](https://www.cbs.sa.gov.au/sections/renting/bonds/settling-a-bond-dispute).
- NT bond: separate the landlord's seven-business-day return/retention duties
  from tenant NTCAT filing, and include statutory-declaration/undisputed-balance
  evidence. RT06 termination, RT12 unclaimed bond and NTCAT applications differ.
  [Common disputes](https://nt.gov.au/property/private-renters/renters-your-rights-and-responsibilities/common-tenancy-disputes).

## Official-page ambiguities kept visible

NT Consumer Affairs' [forms index](https://consumeraffairs.nt.gov.au/for-consumers/residential-tenancies)
and NT Government's [tenant notices](https://nt.gov.au/property/private-renters/renters-your-rights-and-responsibilities/notices-for-tenants-to-landlords)
use different RT04a/RT04b labels. Both remain useful, but the UI now says to confirm
the form's title, sender and recipient with Consumer Affairs. No uninspected PDF
has been declared the correct notice.

The TAS claim page mixes “three days” and “three working days” for starting a
claim after key return. We retain the conditional tenant-start guidance and
refer users to MyBond/RDA instead of imposing one universal numeric start rule.
Historical COVID text and processing estimates are not treated as current
eligibility rules, appeal periods or guaranteed resolution times.

## Compatibility and verification

**주의사항과 함께 호환**: same resource URLs, data and components across desktop,
mobile web and installed PWA; external authorities require connectivity.
Existing home → resource/inspection navigation is preserved.
Selected SA/TAS/NT cards use short checkpoints, labelled external actions,
native keyboard-operable selects and polite updates. No new dependency,
persisted selection, network request, personal input or tracking.

The library now has **35 articles, 375 sections and 240 article source entries**;
the static inventory has **348 distinct URLs**. Two dynamic templates remain
outside the source-review counts. Whole-article review dates did not advance;
dated notes state precisely which local corrections were checked.

`npm run test:tenancy-source-review` checks the immutable 15-source subset,
references, zero overlap with earlier reviews, cumulative count and wording/UI
safeguards without network access. Also run source-audit, critical/health review,
rental repair/bond depth, content-depth/audit, cross-surface, accessibility,
visual hierarchy, security, Rental live-status and document contracts, targeted
ESLint, TypeScript and whitespace checks. Release evidence belongs in the
operations CURRENT_STATE entry, not a claim of testing every device.

No local full build, added dev server, payment environment, Checkout,
entitlement, first-sale gate or provider configuration changes.

## Next priority

Within the remaining **50**, review hardship/financial support and complaint
routes next: eligibility, deadlines, free-help boundaries and live destinations.
Then review transport/provider and other routine official links. Access
restriction alone is not evidence that a link is dead.

This report succeeds the [health-safety review](health-safety-source-review-2026-08-31.md);
its historical 65-remaining figure stays intact.
