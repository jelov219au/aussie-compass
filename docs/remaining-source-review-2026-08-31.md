# Final access-limited source review — 2026-08-31

Base: `081550adcb3f63548cda5f95b7623624e53e152d` (includes the published
checkout-OFF Pay Evidence preparation). Branch: `codex/remaining-source-review-20260831`.

## Result and limits

Reviewed the final 24 URLs from the immutable original 160 restricted/network-error
entries: 21 retained, three replaced, zero unreviewed destinations in that queue.
Twenty official pages were read through the web reader, two through the official
browser after reader restrictions/failures, and two commercial marketplace pages
were read as discovery destinations only. A bot restriction was not called a dead
link. The machine-readable evidence is
[the final ledger](audits/remaining-source-review-2026-08-31.json).

| Review batch | Reviewed | Retained | Replaced |
| --- | ---: | ---: | ---: |
| Critical | 73 | 68 | 5 |
| Health and safety | 22 | 19 | 3 |
| Tenancy | 15 | 15 | 0 |
| Hardship and utilities | 26 | 26 | 0 |
| Remaining transport/vehicle/routine | 24 | 21 | 3 |
| Original access-limited queue total | 160 | 149 | 11 |

This closes that historical queue, not all future link maintenance. It does not
certify every article fact, every external form or dataset, individual providers,
all eligibility permutations or a successful application/booking. The separate
initial repair ledger, original 340-URL inventory, and historical batch counts
remain unchanged. New supporting URLs are tracked separately, not counted as
additional original queue entries. No authenticated account, paid PPSR search,
seller contact, application, feedback or actual transaction was used.

## Repairs and useful additions

- PTV's old disruption and night-tram URLs resolve to the general Transport
  Victoria home page. Replaced with [Disruptions](https://transport.vic.gov.au/disruptions/disruptions-information)
  and [late-night travel](https://transport.vic.gov.au/plan-a-journey/travel-tips-and-resources/late-night-public-transport).
  The visitor hub and myki URLs still redirect correctly and remain connected.
- ACT's old policenews crime link resolves to news. Replaced with
  [Crime Statistics](https://police.act.gov.au/crime-statistics); explain its current
  map fault and download alternative. SA suburb/postcode data exclude sexual
  offences; VIC recorded-crime trends can reflect law and police-practice changes.
  No safety rankings or copied datasets.
- VIC licence six months does not reset on leaving and returning. SA conversion
  requires an accepted official translation rather than IDP alone; the public
  checker was followed for current Korean licence, age 20+, held over three years,
  through its all-tests result (theory, three-month permit, HPT/practical and
  certificate). This one example does not settle every age/history combination.
  TAS P1 online booking is not the same as every assessment. NT Class C interim
  conditions include a full NT licensed front-seat supervisor, 80 km/h and zero BAC.
- [PPSR](https://www.ppsr.gov.au/carcheck): purchase-day/day-before timing,
  certificate retention, VIN accuracy, differing online/phone fees, incomplete
  NEVDIS and absent TAS stolen data. The existing disclaimer and Powered by PPSR
  sources support the new limits. Copy-checking an old certificate is not a fresh
  search. Mechanics, title/seller authority and registration remain separate.
- [VIC contactless](https://transport.vic.gov.au/tickets-and-payments/contactless)
  is full fare; concessions keep myki, the same payment medium must be used, and
  V/Line rollout is route-dependent. [myki tap guidance](https://transport.vic.gov.au/tickets-and-payments/myki/tap-on-and-off-with-myki)
  supplies the Free Tram Zone exception rather than attributing it to a visitor hub.
- Arrival checklist: international-student USI should be addressed before departure;
  existing identifiers and exemptions still need checking. Moving checklist:
  Centrelink final submission, Receipt ID, follow-up tasks, no duplicate pending
  update, and relationship-safety ordering. Local checklist IDs/storage unchanged.
- APSC STAR guidance, TPB register, NT/Adelaide transport and the two marketplaces
  needed no substantive replacement. Marketplace access is not a vehicle/seller
  endorsement. Institution labels reflect current destinations.

## Compatibility and verification

주의사항과 함께 호환: same Next.js routes and shared data on desktop, mobile web
and installed PWA; official external pages require internet. Existing home → tools/
resources routes remain. Static notes add no client state; the existing licence
select has a labelled region, polite updates and 48px control. Extra conditions
appear only for the selected jurisdiction. No data collection or storage changes.

React review: static data remains outside render; existing selection derives during
render, no effect or duplicate state; stable keys, semantic region rather than an
orphan tabpanel, direct imports, no new dependency or client-side network work.
Whole-article updated dates are not advanced for a selected-topic review.

Run `npm run test:remaining-source-review` for complete original-set coverage,
non-overlap, references, replacement wiring and focused content/accessibility
guards without external requests. Also run the earlier ledgers and relevant
content, driver, cross-surface, visual, accessibility and protected-release contracts,
targeted ESLint, TypeScript and whitespace. Release SHA, remote build and actual
public-browser observations belong in operations CURRENT_STATE, not a guessed
completion stamp here. No local full build or new dev server.

## Next priority

Source triage is complete for the original queue. Next prioritise small-screen and
installed-PWA usability: actual 320/768px checks, keyboard focus, state changes,
external-link recovery and existing local-data preservation. Keep factual audits
and device checks separate. Then schedule future source refreshes only if requested;
this review creates no automation. The separately approved Rental release lane
must preserve the then-current main and remain outside this content change.
