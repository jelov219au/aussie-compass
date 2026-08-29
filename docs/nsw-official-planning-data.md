# NSW official planning data scaffold

This scaffold is not a live-data launch. Without an explicitly selected live mode and a server-only TfNSW API key, `/api/nsw-planning-snapshot` returns labelled fixture data with `officialRealtime=false`. If live mode is selected without a valid key, or either official response fails validation, the route returns HTTP 503 with no notices. It never silently substitutes demo data for a failed live request. `officialRealtime=true` means only that the response came from the configured official endpoints; it is not an independent claim that each source record is current.

## Official source candidates

- Rail trackwork and disruptions: Transport for NSW Trip Planner Service Alert API, `GET https://api.transport.nsw.gov.au/v1/tp/add_info`. The official API manual describes `add_info` as current public-transport service status and incident information; the initial adapter requests the Sydney date, `filterPublicationStatus=current` and rail mode. The GTFS-R alternative is `GET https://api.transport.nsw.gov.au/v2/gtfs/alerts/sydneytrains`; its official train specification explicitly includes line alerts such as delays and trackwork, but it needs a reviewed Protocol Buffers decoder before use. Sources: [Trip Planner API](https://opendata.transport.nsw.gov.au/data/dataset/trip-planner-apis/resource/917c66c3-8123-4a0f-b1b1-b4220f32585d/view/7c21e37e-5c4c-4085-91b7-5cffee8a44c0), [Sydney Trains realtime specification](https://opendata.transport.nsw.gov.au/sites/default/files/2026-04/Real%20Time%20Train%20Technical%20Document%20v3_7_Open_Data.pdf).
- Construction and roadwork: Live Traffic Hazards `GET https://api.transport.nsw.gov.au/v1/live/hazards/roadwork/open`. The official dataset defines this as current and planned roadworks in GeoJSON and distinguishes network-impacting work. Sources: [Live Traffic Hazards dataset](https://opendata.transport.nsw.gov.au/data/dataset/live-traffic-hazards), [Live Traffic NSW developer guide](https://opendata.transport.nsw.gov.au/sites/default/files/2025-08/Live%20Traffic%20NSW%20Developer%20Guide%202023-10%20v1.9_opendata_AUG25.pdf).

TfNSW requires an API key in the server-side `Authorization: apikey …` header and advises proxying rather than exposing it in browser markup. Its default Bronze limits are 5 requests per second and 60,000 per day. Real-time public transport feeds generally update every 10–15 seconds. Source: [TfNSW API Basics](https://opendata.transport.nsw.gov.au/developers/api-basics).

## Runtime boundary

1. `NswPlanningDataProvider` is the only server boundary. The browser never receives the API key or calls TfNSW directly.
2. Only hard-coded HTTPS URLs on `api.transport.nsw.gov.au` are accepted. Requests are GET-only, reject redirects, time out after five seconds and reject non-JSON, non-200 or responses over 1 MB.
3. Parsers allowlist fields, strip markup, cap text and item counts, and reject the entire source when its envelope or an included record is malformed. A failure in either rail or roadwork makes the combined live result unavailable.
4. Next server fetch caching is explicit: 30 seconds for rail alerts and 60 seconds for roadworks. A per-instance single-flight and one-second minimum live-read interval add a local throttle. This is defence in depth, not a distributed quota guarantee; Production monitoring must still watch TfNSW 401/403 and quota responses.
5. The public Route Handler itself is dynamic and `private, no-store`; only validated upstream fetches use the Next server cache. Demo and unavailable responses are never cached as official data.
6. `status`, `officialRealtime`, `X-Hoju-Data-Mode` and the Korean notice must remain visible to any future UI. Only `status=live` may be described as official data, and even then users must be sent to the official source before travel.

## Data trust fields

Schema version 2 includes a `sources` record for each upstream dataset. Every record exposes `sourceName`, `sourceRecordTitle`, `sourceUrl`, `sourceUpdatedAt`, `collectedAt`, `expectedRefreshInterval`, `freshnessStatus`, `licenceReviewStatus`, `licenceName`, `licenceUrl`, `attributionText`, `transformationSummary`, `hojuInterpretation`, `limitations` and `errorReportPath`.

- `retrievedAt`/`collectedAt` is Hoju Compass collection time. It must never be presented as the upstream `sourceUpdatedAt`.
- Fixture mode uses `NOT_COLLECTED`; failed live reads use `SOURCE_UNAVAILABLE`. A validated official response currently uses `FRESHNESS_UNKNOWN` because neither adapter extracts an upstream record-update timestamp or a dataset refresh interval. It must not be labelled `CURRENT`.
- The generic TfNSW Data Licence says that CC BY 4.0 applies unless otherwise stated, but it does not replace review of the exact Trip Planner API and Live Traffic Hazards dataset terms. Until that review is recorded, `licenceReviewStatus=review_required` and the licence/attribution fields remain `null`; live publication remains blocked.
- `transformationSummary` states what the adapter changed. `hojuInterpretation` separately states what Hoju Compass adds and does not guarantee. `/contact` is the correction path; do not request travel history, exact addresses, ticket/card data or full screenshots.

## Activation gate

Keep fixture mode until an owner separately acquires and approves a TfNSW application key, each exact dataset licence and attribution are reviewed, upstream freshness metadata (or a documented `FRESHNESS_UNKNOWN` presentation) is approved, both adapters pass captured redacted schema fixtures, quota monitoring exists, and a protected Preview shows demo/live/unavailable states distinctly. Do not add the key to source, browser code, logs, URLs or client-visible errors. Enabling live mode, adding an environment value and deploying are separate operator actions outside this scaffold.
