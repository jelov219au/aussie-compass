# Visa, tax and wage source recheck — 31 August 2026

## Outcome and scope

Reviewed all **73** Home Affairs (9), ATO (21, including its developer site) and
Fair Work (43) URLs previously classified as restricted or network-error by the
[baseline audit](content-source-audit-2026-08-31.md).

- 68 existing destinations retained.
- 3 ATO pages genuinely displayed **404 - Page not found** in the public browser;
  equivalent current guidance was found through official navigation.
- 2 other ATO links improved: a raw content API and a developer-oriented entry
  now point to readable public guidance. These are **not** counted as 404s.
- All 73 have a retrieved current destination or verified replacement. This is
  source-path and selected-content verification, **not** full legal/tax validation
  of every statement on every linked page.
- **87** other restricted/network-error entries remain in the original baseline.
  The original automated results have not been overwritten as network successes.

The [per-URL ledger](audits/critical-source-review-2026-08-31.json) records the
original URL/status, source references at base SHA, current destination, method,
title, action and exact scope of evidence. References' line numbers belong to
base SHA `e8190f66a2776d49ee5065fdd5d795f95df062cd`, not the edited line positions.

## Changed destinations

| Original use | Finding | Verified public replacement |
| --- | --- | --- |
| Payday Super | Developer page works, but is not the best reader entry | [ATO Payday Super for employers](https://www.ato.gov.au/businesses-and-organisations/super-for-employers/payday-super) |
| Bank interest / TFN | Raw API access restricted; not confirmed missing | [ATO bank accounts and income bonds](https://www.ato.gov.au/individuals-and-families/investments-and-assets/investing-in-bank-accounts-and-income-bonds) |
| Job-ending Super | Old employee-SG path displays 404 | [ATO Super from your employer](https://www.ato.gov.au/individuals-and-families/super-for-individuals-and-families/super/growing-and-keeping-track-of-your-super/super-from-your-employer) |
| Unpaid Super | Old path displays 404; Fair Work's official link redirects to current guidance | [ATO Unpaid super from your employer](https://www.ato.gov.au/individuals-and-families/super-for-individuals-and-families/super/growing-and-keeping-track-of-your-super/unpaid-super-from-your-employer) |
| Pre-fill | Old path displays 404; myGov's official link redirects to current guidance | [ATO Pre-fill availability](https://www.ato.gov.au/individuals-and-families/your-tax-return/how-to-lodge-your-tax-return/lodge-your-tax-return-online-with-mytax/pre-fill-availability) |

The original employee-SG reference was a starting point for checking entitlement,
not a final-pay category calculator; its replacement summary preserves that limit.

## Content corrections supported by the recheck

### Payday Super

The guide now distinguishes payday-based calculation and ATO's recommendation to
send on payday from the fund-receipt deadline. The general deadline is seven
business days; eligible first contributions for a new employee/new complying
fund can have 20 business days. Overlapping deadlines and out-of-cycle payments
also have specific rules. Whole-state/territory public holidays anywhere in
Australia affect the business-day definition. Pre-July 2026 payments remain under
the earlier quarterly rules. [ATO payment deadlines, updated 10 August 2026](https://www.ato.gov.au/businesses-and-organisations/super-for-employers/paying-super-on-payday/payment-deadlines-for-payday-super).

Some ATO contractor/unpaid-super pages still contain older quarterly links or
wording. Retain those pages for eligibility/reporting, but do not use their older
timing paragraphs as evidence for post-1 July 2026 deadlines.

### Pre-fill

The public availability page does not publish employer-specific readiness. The
summary now directs readers to check their own income statement/tax-ready status
separately, and still warns about incomplete or incorrect automatic information.
No tax return or account was opened.

### Working Holiday Maker statistics

The June 2025 report is a dated historical source, not a promise about current
applications. The article now separates:

- Korea's 12,374 first-417 grants across **FY2024–25** (table 2.14, printed p32).
- All-country first-417 grants of 72,202, up 1.2%, in **January–June 2025** (summary, p8).
- All-country first-417 grant rate of 99.8% for **decided** applications in that
  six-month period (table 3.01, p42), not a Korean-only rate or pending applications.

The denominator is grants plus refusals, not all lodged applications. The
[official June 2025 report](https://www.homeaffairs.gov.au/research-and-stats/files/working-holiday-report-june-25.PDF)
and [report index](https://www.homeaffairs.gov.au/research-and-statistics/statistics/visa-statistics/visit)
are linked on the article. Visitor reports and WHM reports must not be conflated.
The PDF check used extracted text/tables; screenshot retrieval did not return
an inspectable image, so no visual-PDF-verification claim is made.

### Other evidence retained

- Fair Work's 2026 national minimum figures match the current guide. Applicable
  awards, classifications and pay-period timing remain separate checks.
- Home Affairs' services-outside-Australia page worked in the browser: selecting
  Republic of Korea and expanding Panel physician displayed named clinics.
  Clinic availability and bookings were not checked.
- Visa Finder's public choices rendered; VEVO and account/application functions
  were not entered. This does not recommend a visa or assess an individual case.

## Compatibility, verification and boundaries

**주의사항과 함께 호환**: desktop web, mobile web and installed PWA share these
source literals and article data. Official external sites need an online
connection. No new client code, browser storage, tracking or platform copy.

Run `npm run test:critical-source-review` and `npm run test:content-source-audit`
for offline coverage/regression checks. The first test protects the exact 73-entry
queue, all five source changes, the 87-entry remainder, Payday exceptions and WHM
period/population wording. It makes no network requests.

Pre-release checks passed: the two source-review contracts; Super, tax-return,
job-ending, hardship, bond-exit, rental-repair and workplace-injury contracts;
content depth/audit and public-holiday canonical contracts; cross-surface,
visual-hierarchy, public-data, Rental live-status, security and document contracts;
targeted ESLint, TypeScript, secret scanning and whitespace checks.

Five older topic tests still expected 36 articles even though the earlier
public-holiday deduplication made the canonical library 35. Only that stale count
assertion was corrected; all topic-specific section, source, action and
payment-boundary assertions remain and pass. The library now has 35 articles,
372 sections and 233 source entries; the static URL inventory has 342 unique URLs.

No local full build or extra development server was started. Exact Production
SHA and public-page checks are recorded in the operations state after the
ordinary Git-triggered deployment.

No Checkout, entitlement, first-sale-gate, payment environment, provider
configuration, financial transaction, form submission or user data was changed.
Whole-article factual-review dates were not advanced merely for working links;
the revised statistical and deadline sections have their own review date.

## Next priority

From the remaining 87 entries, verify **healthcare access/complaints and workplace
injury/compensation** first: Medicare, health complaint bodies, claims and emergency
contact pathways can affect immediate safety, care costs or deadlines. Then
complete tenancy/bond, financial-hardship and transport/provider source checks.
Do not call any remaining access-limited source dead without independent evidence.
