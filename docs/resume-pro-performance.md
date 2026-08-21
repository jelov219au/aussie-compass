# Resume Pro performance report

The `/resume-pro-performance` route is an operator-only local report. It stays
out of public navigation, search, the sitemap and production access until real
admin authentication exists.

## Data sources

- Vercel Web Analytics supplies aggregate `Resume Pro Viewed` and
  `Checkout Started` event counts grouped by the allowlisted `entry` value.
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
- `결제 시작 → 결제 완료` shows whether checkout confidence, price or terms
  may need attention.
- Do not change copy from a handful of visits. The report deliberately marks
  sources with fewer than 10 visits as needing more data.
- Stripe revenue is gross completed payment value before refunds.
