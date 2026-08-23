# Resume Pro performance report

The `/resume-pro-performance` route is an operator-only local report. It stays
out of public navigation, search, the sitemap and production access until real
admin authentication exists.

## Data sources

- Vercel Web Analytics supplies aggregate `Resume Builder Started`,
  `Resume Job Ad Sample Viewed`, `Resume Job Ad Checked`, `Resume Pro CTA Clicked`,
  `Resume Pro Viewed`, `Resume Pro Free Proof Opened`,
  `Resume Pro Launch Interest` and `Checkout Started` counts.
  Builder and CTA events contain only fixed `surface` and anonymous page
  `context` values; visits and checkout starts use the allowlisted `entry`.
- Stripe supplies completed, paid Resume Pro Checkout Sessions grouped by the
  `acquisition_source` metadata value.
- The report never reads or displays customer names, email addresses, card
  details, Checkout Session IDs or individual analytics records.

## Local setup

Open the local report and use its `성과 데이터 연결` form. The form is
available only on a loopback development address, accepts same-origin posts
only, and stores the values in the ignored `.env.local` file without showing
them again. Never commit that file.

The same values can be added manually when needed:

```text
VERCEL_TOKEN=
VERCEL_PROJECT_ID=
VERCEL_TEAM_ID=
STRIPE_ACCOUNTING_KEY=
```

`VERCEL_TEAM_ID` is only needed for a team-owned project. Create the Vercel
access token for the account or team that owns the project.

`STRIPE_ACCOUNTING_KEY` must be a dedicated restricted key (`rk_live_` for
real sales or `rk_test_` for test data) with read access to Checkout Sessions.
Do not reuse the checkout write key. Apply an IP access policy when practical.

The current project-scoped Vercel reporting token expires on 2026-11-19. Replace
it through the same local form before then. The report supports 7, 30 and 90
day windows.

## Reading the funnel

- `Resume Pro 방문 → 결제 시작` shows whether the product page helps a
  visitor decide to begin checkout.
- `Resume Pro 방문 → 무료 확인 시작` shows whether the offer leads to a
  local-only Job Ad proof step before purchase. The event contains only the
  fixed acquisition entry, never resume or Job Ad text.
- `Resume Pro 방문 → 판매 시작 1회 안내 요청` is a pre-launch intent signal
  while Checkout remains closed. It counts only the mail-app link click and
  never sends the visitor's email address to analytics.
- `Builder 시작` and `Pro CTA 클릭` show the earlier aggregate steps. Do not
  treat them as person-level paths or join them to resume input, search text or
  URL queries.
- `공고 예시 확인` is the fixed fictional one-click preview. `공고 맞춤 점검`
  remains reserved for a comparison the visitor starts with their own local
  inputs, so sample use does not inflate completed checks.
- `결제 시작 → 결제 완료` shows whether checkout confidence, price or terms
  may need attention.
- Do not change copy from a handful of visits. The report deliberately marks
  sources with fewer than 10 visits as needing more data.
- Stripe revenue is gross completed payment value before refunds.
