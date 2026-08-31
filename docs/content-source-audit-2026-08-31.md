# Content source-link audit — 2026-08-31

## Result and scope

Audited the 35 resource articles, 17 standalone guides and their shared tool/data
imports: **37 files, 340 unique literal external URLs, 436 references** before
correction. Two dynamic URL templates were counted but excluded from requests.
This is link-health and destination review, **not full factual recertification**
of every article or a claim that all official pages were accessible.

Baseline public GET results:

| Result | URLs | Interpretation |
| --- | ---: | --- |
| HTTP success without redirect | 168 | Reachable, not necessarily factually current |
| Redirected | 10 | Destination reviewed; two had lost the intended context |
| Restricted (401/403/429) | 80 | Access limitation, not confirmed broken |
| Network error / timeout | 80 | Unverified by this network run |
| HTTP error | 2 | ACT 404 and invalid DASP hostname 400 |

The [baseline machine report](audits/content-source-links-2026-08-31.json)
preserves the original URLs, statuses, final destinations, titles, source files
and line references. It deliberately retains pre-fix failures as evidence.
The [repair ledger](audits/content-source-repairs-2026-08-31.json) records the
nine exact old/new mappings and follow-up verification separately.

## Corrections

Four substantive repairs and five equivalent direct-address updates were made.
Every replacement was opened on its official site and checked for the intended
content; a second operator GET returned **HTTP 200 with zero redirects for all nine**.
No forms, logins, payments or applications were submitted.

| Source | Problem / correction | Official destination |
| --- | --- | --- |
| ACT rental guide | Old Justice page returned 404. New ACT hub links the Renting Book, tenancy stages and dispute support. Existing tenancy/occupancy distinction remains. | [Rental laws in the ACT](https://www.act.gov.au/housing-planning-and-property/renting/rental-laws-in-the-act) |
| ATO DASP application | Removed invalid `www.` prefix from applicant hostname; retained the public How to apply entry and query. | [DASP How to apply](https://applicant.tr.super.ato.gov.au/applicants/default.aspx?pid=1) |
| Tasmania crime statistics | Old URL led to a 2015–16 supplement, not a current overview. New hub lists dated reports and dashboards. | [Tasmania Police Our Performance](https://www.police.tas.gov.au/about-us/our-performance/) |
| NSW weekend trackwork | Expired July notice now leads to a news index. Replaced with evergreen guidance; source summary now explains alerts, Trip Planner and changeable future calendars. | [About trackwork](https://transportnsw.info/travel-info/ways-to-get-around/train/about-trackwork) |
| NSW fares | Equivalent canonical destination. | [Tickets and fares](https://transportnsw.info/tickets-fares) |
| NSW crime statistics | Equivalent current hub; label describes the hub instead of implying a direct map. | [BOCSAR Crime and policing](https://bocsar.nsw.gov.au/statistics-dashboards/crime-and-policing.html) |
| WA crime statistics | Equivalent current official detail page. | [WA Police crime statistics](https://www.wa.gov.au/organisation/western-australia-police-force/crime-statistics) |
| PBS overview | Equivalent current official overview. | [About the PBS](https://www.pbs.gov.au/about) |
| ASIC debt collection | Equivalent canonical host and path. | [Debt collection](https://www.asic.gov.au/regulatory-resources/credit/debt-collection) |

Valid homepage/canonical redirects such as 1800RESPECT, EWOQ and SmartRider
were not changed merely for redirecting. Dates on entire articles were not
advanced just because links were checked.

## Remaining limitations and next priority

**160 URLs remain unverified by the automated run** (80 restricted + 80 network
failures). Do not label these dead, remove them or silently count them as passed.
The baseline report contains the exact review queue and affected pages.

An independent web read could open Fair Work's public-holiday guidance while the
operator network timed out on Fair Work. This demonstrates that network failures
are inconclusive; it does not clear all Fair Work URLs or certify their claims.

Next priority: cross-check the inaccessible **visa, tax and wage** sources through
their official navigation and browser-accessible pages, preserving a per-URL
evidence trail. Review relevant claims if an official rule or destination has
changed. Only then broaden to the remaining lower-risk providers.

## Implementation and verification boundaries

- Shared source literals serve desktop, mobile and installed PWA; no platform fork.
- No storage, consent, service-worker, checkout, entitlement, first-sale-gate,
  payment environment or provider configuration changed.
- The reusable [audit procedure](content-source-link-audit.md) defaults to an
  offline inventory. Network checks are explicit, rate-limited and read-only.
- Offline fixtures protect parser scope, redirects, restrictions and the nine
  repaired destinations. Content, cross-surface and payment-preservation
  contracts are run before release.
- No local dev server or local full build is needed for these source-only edits.
  Production readiness and exact Git SHA are recorded in the operations state
  after the normal deployment.
