# Resume Pro performance report

The `/resume-pro-performance` route is an operator-only local report. It stays
out of public navigation, search, the sitemap and production access until real
admin authentication exists.

## Data sources

- Vercel Web Analytics supplies aggregate site visitors, page views, `/pro`
  visitors, `/resume-pro` visitors, `Resume Builder Started`,
  `Resume Job Ad Viewed`, `Resume Job Ad Sample Viewed`, `Resume Job Ad Checked`, `Resume Pro CTA Clicked`,
  `Resume Pro Viewed`, `Resume Pro Free Proof Opened`,
  `Resume Pro Launch Interest` and `Checkout Started` counts.
  Builder and CTA events contain only fixed `surface` and anonymous page
  `context` values; visits and checkout starts use the allowlisted `entry`.
- Stripe supplies completed, paid Resume Pro Checkout Sessions grouped by the
  `acquisition_source` metadata value, with the PaymentIntent's expanded latest
  Charge used only to count full refunds and refund-adjusted totals.
- The report never reads or displays customer names, email addresses, card
  details, Checkout Session IDs or individual analytics records.

## Local setup

Open the local report and use its `성과 데이터 연결` form. The form is
available only on a loopback development address, accepts same-origin posts
only, and stores the values in the ignored `.env.local` file without showing
them again. Never commit that file.

The Vercel access token and `VERCEL_PROJECT_ID` are both required for traffic
collection. The form accepts the project ID directly so a new computer does not
remain permanently in `미수집` after saving only the token. In Vercel, find the
non-secret ID under the target project's **Settings → General → Project ID**;
enter the value beginning with `prj_`. Do not substitute the project name.

The same values can be added manually when needed:

```text
VERCEL_TOKEN=
VERCEL_PROJECT_ID=
VERCEL_TEAM_ID=
STRIPE_PERFORMANCE_KEY=
```

`VERCEL_TEAM_ID` is only needed for a team-owned project. Create the Vercel
access token for the account or team that owns the project.

`STRIPE_PERFORMANCE_KEY` must be a dedicated restricted key (`rk_live_` for
real sales or `rk_test_` for test data) with read access to Checkout Sessions
and PaymentIntents/Charges. The extra read is required to stop a fully refunded
controlled live test from appearing as a retained purchase. Do not reuse the
Checkout runtime key or the Balance-Transactions-only `STRIPE_ACCOUNTING_KEY`.
The accounting exporter and performance report intentionally use different
restricted keys so neither role receives the other's permissions. Apply an IP
access policy when practical.

The current project-scoped Vercel reporting token expires on 2026-11-19. Replace
it through the same local form before then. The report opens on today's partial
UTC window for a daily check and also supports 7, 30 and 90 day windows.

## Reading the funnel

- `사이트 방문자 → Resume Pro 상세 도달` is the period's anonymous aggregate
  reach ratio, not a person-level joined journey. Use the 7- or 30-day view
  before making product decisions from a small daily sample.
- `Pro 비교 페이지` counts visitors to `/pro`; `Resume Pro 상세 도달` counts
  visitors to `/resume-pro`. Do not add them together because one visitor can
  appear in both page totals.
- Page-visit totals and custom funnel events both explicitly filter to
  `environment=production`, so Preview checks do not enter either the reach
  denominators or customer-interest events.
- `Resume Pro 방문 → 결제 시작` shows whether the product page helps a
  visitor decide to begin checkout.
- `Resume Pro 방문 → 무료 확인 시작` shows whether the offer leads to a
  local-only Job Ad proof step before purchase. The event contains only the
  fixed acquisition entry, never resume or Job Ad text.
- `Resume Pro 방문 → 판매 시작 메일 준비 행동` is a pre-launch intent signal
  while Checkout remains closed. It counts a mail-app link click or successful
  fixed-request copy, with `method=mailto|copy`; it does not prove the message
  was sent. Always compare it with requests actually received in the support
  mailbox. It never sends the visitor's email address to analytics.
- `Builder 시작` and `Pro CTA 클릭` show the earlier aggregate steps. Do not
  treat them as person-level paths or join them to resume input, search text or
  URL queries.
- `공고 점검기 진입` separates reach from activation. `공고 예시 확인` is the fixed fictional one-click preview. `공고 맞춤 점검`
  remains reserved for a comparison the visitor starts with their own local
  inputs, so sample use does not inflate completed checks.
- `live 결제 완료` includes controlled live transactions and is not a customer
  count. `전액 환불` is removed from `유지 결제 후보`; partial refunds reduce
  the displayed net amount. A retained live payment is still only a candidate
  until the first-sale incident record confirms it came from a genuine customer.
- `결제 시작 → 유지 결제 후보` can indicate whether checkout confidence,
  price or terms need attention only after that manual customer check.
- Do not change copy from a handful of visits. The report deliberately marks
  sources with fewer than 10 visits as needing more data.
- The summary shows gross paid value, refund value and refund-adjusted net value.
  It is a conversion aid, not the accounting ledger; disputes, fees, payout and
  tax evidence remain in the private reconciliation workflow.
