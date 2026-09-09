# Homepage conversion measurement

The `home-conversion-20260909` version accompanies task-oriented homepage links,
an optional route finder, and Korean task names in the Pro selector. It is a
single release hypothesis, not evidence of improved conversion. Homepage/search
copy, recommendation visibility and Pro presentation changed together; the effect
of an individual change cannot be isolated from a before/after comparison.

## Counting contract

All new events use one mounted homepage as the counting unit. A new visit to the
homepage resets the counts; selecting products or expanding content does not.
No visitor identifier is generated or persisted. Existing events remain for
compatibility and must not be added to the new counts.

| Event | Emitted when | Deduplication |
| --- | --- | --- |
| Home Visit | Homepage client mounts | Once per mount |
| Home Section Viewed | At least half of a short heading marker is visible for one continuous second while the document is visible | Once per marker per mount |
| Home Product Selected | Visitor activates a Pro selector | Once per product per mount; automatic initial selection excluded |
| Home Action | Visitor activates an allowlisted internal link inside the homepage main content | Once per section/destination/action per mount |
| Home First Action | First allowlisted link to a specific task, guide, product or sample | Once per mount |

The observed markers are `tasks`, `tools`, `pro`, and `pro_details`. They are
headings, not entire tall sections. Their exposure is not a claim that the visitor
read the content. Missing IntersectionObserver support skips exposure events;
links and other measurement remain usable. A very fast click can precede the
one-second exposure event, so these aggregate counts are not a strict sequential
funnel.

`Home First Action` excludes generic directories, search, installation and local
work resumption. Header/footer links, search-result navigation and tool completion
are outside this release's new counter. It measures a specific next-page action,
not task success or a purchase. A sample click is recorded as `action=sample`;
other links use `action=navigate`. Product views are not paid orders.

Fixed properties only: `version`, `section`, `destination`, `action`, `product`.
Destination paths and product IDs are allowlisted. Input values, search terms,
query strings, fragments and local record contents are never sent. Existing URL
sanitization removes query strings and fragments from analytics events.

## Reading the result

Use **event totals**, not Vercel's Visitors column, for both numerator and
denominator: `Home First Action / Home Visit`, with the same version, production
host and date interval. Counts are approximate because delivery can be blocked.
Do not add section/product counts: a single homepage visit may use several.
Compare raw counts alongside rates and segment by device/acquisition when the
sample permits. An increase in clicks without useful downstream activity is not
success. Naver/Google search clicks are upstream acquisition metrics and need
their own search-impression denominator.

## Internal review exclusion

Before an operator's QA session, set the fixed session-only flag in that tab:

```js
sessionStorage.setItem("hoju-compass-internal-review", "1");
location.reload();
```

This skips new homepage events and rejects all analytics through `beforeSend`,
including legacy events and page views. Clear it with `removeItem` when QA is
finished. The flag contains no personal input. It does not identify or subtract
historical operator visits or exclude other tabs automatically.

The scoped remote UI review blocks analytics network calls, captures SDK calls
locally, and checks the exclusion/sanitization callback. It also tests keyboard
selection, search safety, private search handoff, shared recommendation URLs and
preservation of invalid local records. An actual installed PWA and field speed
metrics require separate device/traffic evidence; they are not claimed by these
browser checks.
