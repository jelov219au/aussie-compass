# Tax and used-car first-action measurement

This change preserves the tax decision engine, dates and official destinations.
`taxGuidePresentation` maps its existing output to Korean display labels. Internal
field names remain only in data attributes for diagnostics, not visible copy.

`Home Search` adds the fixed `used_car` topic for explicit Korean/English car
purchase terms. Classification does not change search results or transmit the
query. Career, house-inspection and tax-deduction controls retain their topics.

## Tool Started contract

| Property | Allowed value in this release |
| --- | --- |
| schema_version | `1` |
| tool | `tax_return_guide`, `tax_prep_tracker`, `used_car_comparison` |
| entry | `unknown` — no acquisition context has been established |

The first accepted checklist toggle, nonblank vehicle name, valid nonnegative
cost edit, check change or candidate addition emits once per mounted tool.
For `tax_prep_tracker`, the first record accepted by both field and full-record
validation emits after adding it to the screen. Opening the entry shortcut,
editing a draft, rejected submissions, year changes, restoration and CSV export
do not emit a start. This is not proof that browser storage succeeded; the storage
notice remains authoritative. The ledger is measured separately from its guide.
Rendering, restoration, focus, blank input, invalid cost, reset and subsequent
edits do not emit another start. The event is not task completion, tax lodgment,
vehicle approval, a paid entitlement or a purchase. Never attach field values,
record IDs, names, prices, checkbox IDs, storage contents or search text.

Deduplication uses a component ref. New mounts may produce new starts; aggregate
starts are not unique people and cannot reconstruct individual user journeys.
An analytics error does not prevent editing. The existing URL sanitizer still
removes query/fragment. No server-side event or new persistent identifier is added.

## QA entry procedure

Use the existing session flag `hoju-compass-internal-review=1` before QA. With an
approved browser test runner, inject it into the exact site origin before the
first page script, and intercept Analytics requests throughout the review:

```js
await context.addInitScript(({ origin }) => {
  if (location.origin === origin) {
    sessionStorage.setItem("hoju-compass-internal-review", "1");
  }
}, { origin: baseOrigin });
await context.route(/\/_vercel\/insights\/|va\.vercel-scripts\.com/, route =>
  route.fulfill({ status: 200, body: "" }));
```

If manually setting the flag on an already opened site, record the first visit
as potentially counted. Reload after setting it. The flag is session/origin
scoped; check each new tab and installed PWA separately. A blocked storage access
does not prove exclusion. The network block is the fallback in automated QA.
Do not exclude all Australian or desktop visitors or rewrite historical totals.

Tests deliberately checking ordinary analytics omit the flag, intercept all
outbound traffic and record SDK calls locally. This is how normal-mode behavior
can be tested without creating production traffic. Do not send synthetic events
to the live Analytics service as acceptance evidence.

## Validation and release

- `npm run test:traffic-first-action`: actual component-handler tests with mocked
  hooks, storage and Analytics. Checks tax display combinations, search topics,
  QA pageview/event filtering, deduplication and fixed payloads. It is not a DOM,
  hydration, network-delivery or installed-PWA test.
- `npm run test:tax-guide-due-tpb` and `npm run test:tax-return-depth`: preserve
  existing decisions, official links and content boundaries.
- The new test is registered in `quality:gate`. Running that gate also builds;
  follow the repository's explicit build/server authorization requirement.
- Before release: production build, relevant browser checks at 320/768/1440px,
  keyboard/status announcement, save/restore, blocked-storage handling and PWA
  parity. Record exact deployment SHA, effective measurement start and remaining
  device limitations. Do not call source-only verification a production pass.

Reports should use the same interval and production scope, with QA handling and
release time documented. `Tool Started / pageviews` can be an approximate aggregate
interaction indicator, not a user-level conversion rate. Search impressions and
clicks come from the respective search console and may use a different timezone
or delayed window from Web Analytics.
