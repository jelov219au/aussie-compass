# Healthcare, Medicare and workplace safety source review — 31 August 2026

## Outcome

All **22** healthcare/Medicare/emergency/workplace-injury entries from the
original restricted/network-error queue now have a directly inspected official
destination or verified replacement: **19 retained, 3 repaired**. Together with
the earlier 73 visa/tax/wage checks, **95** of the original 160 access-limited
entries have a documented disposition; **65 remain**.

This is destination and selected-content verification, not a complete clinical
or legal review. The original HTTP audit stays unchanged. Two dynamic URL
templates are still outside these counts.
[Per-URL evidence](audits/health-safety-source-review-2026-08-31.json) records
original references, observed failure, current destination, method and scope.

## Three repairs

| Source | Observed issue | Verified current destination |
| --- | --- | --- |
| NT health complaints | Browser certificate hostname mismatch on www; no warning bypassed | [HCSCC non-www site](https://hcscc.nt.gov.au/) |
| SA workplace incident notification | Browser displays Page Not Found; footer supplies current route | [Notify us of a workplace incident](https://www.safework.sa.gov.au/notify/workplace-incident-notifications) |
| Triple Zero | Legacy URL redirects toward department hub and fetch fails; not counted as 404 | [Using other emergency numbers](https://www.infrastructure.gov.au/media-communications/phone/triple-zero/using-other-emergency-numbers) |

SA's replacement retains statutory reporting and site-preservation guidance,
separate from compensation. The emergency action remains 000. NT's official
[contact page](https://hcscc.nt.gov.au/contact-us) confirms the existing phone.
WA and Comcare were accessible through the public browser despite web-fetch
restrictions/timeouts, so their valid links were retained.

## Content and navigation corrections

- Healthcare complaints: choose **where care was provided**, not residence.
  For cross-border/telehealth uncertainty, ask the agency. The selected region
  is not saved. A separate insurance guidance card specifies Australian registered insurers
  for OSHC/OVHC complaints and excludes overseas unregistered providers, travel
  insurance and clinical quality, consistent with the existing article and
  [Ombudsman scope](https://www.ombudsman.gov.au/complaints/private-health-insurance-complaints).
- Medicare: the online limit for services over two years old is not presented
  as automatic expiry of every claim right. Ask Services Australia about
  appropriate alternative submission, documentation and Closed status;
  avoid duplicate claims. [Medicare claims](https://www.servicesaustralia.gov.au/medicare-claims?context=60092).
  The existing service-by-service bulk-billing and eligibility warnings were
  already accurate and were preserved.
- QLD: keep regulatory claim guidance and safety reporting distinct; add a
  clearly labelled **WorkCover-insured employers** claim-information link.
  The new WorkCover site/contact change from 10 August 2026 is acknowledged.
  Both the certificate and application are required; a certificate arriving
  from a hospital does not alone start a claim. Self-insurers remain separate.
  [Official claim guide](https://www.workcoverqld.com.au/claims-and-payments/claims/how-to-make-a-claim).
  No application form was opened or submitted.
- NSW: clarify first employer-notification date, primary/secondary injury and
  exempt-group boundaries instead of implying every psychological injury follows
  the new process. Relevant-conduct claims require a complete form.
  [SIRA worker/employer guide, updated 18 August 2026](https://www.sira.nsw.gov.au/workers-compensation/psychological-injuries-for-workers-and-employers).
- TAS: highlight the official usual six-month claim period and requirement to
  lodge before leaving employment if resigning; refer illness/deafness exceptions
  and individual deadlines to the authority.
  [Official worker claim guidance](https://www.worksafe.tas.gov.au/topics/compensation/workers-compensation/information-for-workers/how-to-make-a-workers-compensation-claim-as-worker).

No universal acceptance, payment amount or medical outcome is promised.
The national directory is retained as a scheme-finding source, not the authority
for newer provider phone numbers or an individual eligibility decision.

## Compatibility and checks

**주의사항과 함께 호환**: desktop/mobile web and installed PWA share the same
resource URLs, content and selectors. External official pages require connectivity.
The QLD/NSW extra actions use the existing labelled, keyboard-accessible select and
button layout; no new dependency, persisted state, fetch, tracking or form input.

The library has **35 articles, 373 sections and 235 article source entries**.
The static source inventory has **344 distinct URLs**. Whole-article review dates
were not advanced for link-only verification; new dated notes identify the
specific Medicare and claim guidance checks.

Run `npm run test:health-safety-source-review` for the offline regression:
all 22 original entries, three distinct failure classes, retained source wiring,
no overlap with the earlier 73, 65 remaining, and the new wording/privacy guards.
Also run the existing source, healthcare, workplace-injury, help-directory,
content-depth, cross-surface, visual, security, Rental-status and document checks,
targeted ESLint, TypeScript and whitespace checks. Exact checks and Production
SHA are recorded in the operations state after release.

No local full build, extra dev server, actual claim/complaint/call, health data,
payment environment, Checkout, entitlement or provider configuration is involved.

## Next priority

Verify the **tenancy, urgent-repair and bond-refund** entries within the remaining
65 access-limited URLs first, then hardship/financial and transport/provider
sources. Check jurisdiction, notice/filing deadlines and equivalent destination
content; do not equate a bot restriction with a dead link.

The earlier [73-source report](critical-source-review-2026-08-31.md) retains its
historical 87 remaining count. This report is its dated successor.
