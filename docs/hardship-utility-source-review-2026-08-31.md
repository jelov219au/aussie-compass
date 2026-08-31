# Hardship, utility and complaint sources — 31 August 2026

## Outcome

All 26 selected original restricted/network-error links remain useful:
26 retained, zero replacements. Together with the critical (73), health-safety
(22) and tenancy (15) reviews, 136 of 160 have a documented disposition;
24 remain. This is destination and selected-content verification, not a full
legal/financial review or a guarantee of every source statement.

[Per-URL evidence](audits/hardship-utility-source-review-2026-08-31.json) preserves
the original reference lines. AFCA's three links returned automated 403s but
their public pages were readable in the browser. The NT jurisdiction detail
also needed a browser after automated timeouts. No login, personal input,
claim, complaint, call or email was submitted.

## Changes users can act on

- Four clearly labelled help actions now appear near the hardship article's
  introduction: essential expenses, telecom, energy and financial-firm disputes.
  The energy guide now exposes the existing shared state selector directly.
- DSS community Emergency Relief is free and has no citizenship/residency
  requirement. Availability and form of help still depend on the provider.
  It is not Centrelink Crisis Payment.
  [DSS financial crisis support](https://www.dss.gov.au/supporting-people-financial-crises).
- For Crisis Payment **Other Extreme Circumstances only**, added eligibility,
  exclusions, contact/claim within seven days of deciding unable to return home,
  and claim within fourteen days after contacting Services Australia. Other
  payment types have separate rules; online access is not the only contact route.
  [Eligibility](https://www.servicesaustralia.gov.au/who-can-get-crisis-payment-for-other-extreme-circumstances?context=52754).
- Telecom hardship application assessment (five business days) and outcome
  notification (two business days) are distinct from urgent complaint resolution
  (two business days where the stated urgent conditions apply).
  [Consumer assistance](https://www.acma.gov.au/help-if-you-cant-pay-your-bill),
  [Complaint rules](https://www.acma.gov.au/how-complain-your-telco).
- Removed the implication that a financial firm's written refusal must arrive
  before asking AFCA for help after no reply or an unsatisfactory response.
  A hardship request need not use a dedicated formal process.
  [AFCA hardship](https://www.afca.org.au/make-a-complaint/financial-hardship-complaints).
- AER retail hardship scope names ACT/NSW/QLD/SA/TAS; VIC/WA/NT differ.
  VIC Best Offer is retailer-specific; TAS's two-year complaint period starts
  with awareness. NT pricing is not an assistance form and Power and Water is
  not every resident's retailer. NT Ombudsman expressly lists Power and Water/
  Jacana Energy; users must check jurisdiction rather than assume every private
  retailer is covered.
  [Energy rights](https://www.energy.gov.au/households/your-rights-energy-customer),
  [NT jurisdiction](https://ombudsman.nt.gov.au/complaints/what-can-i-complaint-about).
- FEG: qualifying citizenship/visa at employment end, effective claim within
  twelve months of the later employment-end or insolvency date, unpaid super
  exclusion and proof-of-debt alternative. Separation certificates are conditional,
  not automatic for every departure. Existing bank ID guidance now also covers
  ongoing checks on existing customers without treating an incoming request as genuine.
  [FEG claim requirements](https://www.dewr.gov.au/fair-entitlements-guarantee/claimants/making-feg-claim),
  [AUSTRAC ID checks](https://www.austrac.gov.au/general-public/why-you-might-be-asked-id).

## Limitations and ambiguities

ACMA's complaint page contains both five-day and ten-working-day wording for
implementing an agreed resolution. No universal agreed-completion deadline was
added; users should obtain a written date and escalate delays. The consumer
hardship page's urgency list is read alongside the more explicit complaint page.

The DSS-linked grants directory loaded filters but returned no results; it is
not presented as a verified local provider match. The card links the public
Emergency Relief explanation, which provides further service-finding guidance.
No exact energy prices or future October 2026 VIC disconnection threshold were
copied as current universal rules. AFCA receiving-bank expansion is not an
automatic refund guarantee or a declaration that the separate Scams Prevention
Framework has commenced.

## Compatibility and checks

주의사항과 함께 호환: common Next.js routes/data for desktop, mobile web and
installed PWA; external agencies require internet. Existing home → resources
navigation remains intact. Static help cards add no client state, data collection,
storage or new dependency. State selection remains labelled and keyboard-operable
with polite updates. React review: direct imports, server-rendered static cards,
stable keys, no effects/network waterfall or duplicated PWA implementation.

The library now has 35 articles, 377 sections and 244 article source entries.
Four newly connected supporting URLs bring the static inventory to 352.
Whole-article factual dates are not advanced for a selected-topic review;
new supporting summaries/UI carry the verification date.

Run `npm run test:hardship-utility-source-review` for offline subset, reference,
non-overlap, cumulative-count and wording/UI guards. Also check previous ledgers,
content/financial-hardship/job-ending depth, cross-surface, accessibility, visual,
security, Rental live status, docs, targeted ESLint, TypeScript and whitespace.
Actual release and browser observations are recorded in operations CURRENT_STATE.
No local full build or new dev server; payment env, Checkout, entitlement,
first-sale gate, provider settings and other worktrees remain untouched.

## Next priority

Review the remaining 24 original access-limited sources, prioritising transport/
vehicle provider eligibility and service limits, then remaining routine links.
Do not infer a dead link from a bot restriction. Reconcile the completed original
queue with new supporting sources separately; do not claim all live links were
re-crawled or all article facts reviewed.

This succeeds the [tenancy review](tenancy-source-review-2026-08-31.md);
its historical 50-remaining count stays intact.
