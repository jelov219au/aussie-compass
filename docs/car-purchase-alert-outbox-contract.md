# Car operator alert outbox query contract (not deployed)

`createCarPurchaseAlertOutbox` accepts an injected query and explicit test/live mode. It creates no connection, transport or runtime binding. The existing generic claim function returns incomplete identity for sent/busy; it is not sufficient for this adapter.

Three proposed functions use five fixed parameters: event ID, alert kind, product code (`car_purchase_pro`), livemode boolean and SHA-256 claim-token hash. The plaintext 32-byte random token stays in the caller. Only its hash reaches the query. Claims must filter by exact event identity, kind, product and mode before acquiring or renewing any lease.

- `claim_car_purchase_operator_alert_v1`: returns one row with `claim_outcome`, `event_id`, `livemode`, `alert_kind`, `event_type`, `event_ref_last8`, `product_code`, `checkout_ref_last8`, `payment_intent_ref_last8`, `charge_ref_last8`, `attempts`.
- `mark_car_purchase_operator_alert_sent_v1`: returns one boolean aliased `marked`.
- `release_car_purchase_operator_alert_claim_v1`: returns one boolean aliased `released`.

Claim outcomes are claimed/sent/busy/missing. All outcomes require exact requested identity and event suffix. Claimed/sent/busy also require event type consistent with kind, checkout/PI suffixes, charge suffix for refund/dispute (null for checkout attention), and integer attempts 1–1000. Missing returns null event type and purchase suffixes, with attempts 0; identity columns describe the request, not a fabricated existing receipt. Reject unknown, incomplete, extra or multiple rows. Do not coerce string booleans or counters.

The SQL implementation must join the car atomic receipt/full event identity and durable intent, never authorize from suffixes alone. Product/mode must constrain the mutation itself, including mark/release. Mark/release additionally match a pending row's current lease hash; a replaced token cannot complete or release another claim. Missing/mismatched product or mode must not mutate an unrelated alert. Sent is terminal; busy does not acquire a second lease. Lease expiry and retry must be concurrency-tested in an isolated approved database before runtime connection.

The delivery layer independently matches intent event type and every purchase suffix against the verified event before sending. A mismatched intent is not sent or marked; its lease may expire. Delivery is at least once: a transport success followed by uncertain mark can retry, so exactly-once email is not promised. Stable messageId helps downstream deduplication but is not a guarantee. Attempts over 1000 fail closed and require operator review; do not silently drop them.

SQL review draft: `docs/drafts/car-purchase-alert-outbox-v1.sql`. It is intentionally inert (opening exception, false readiness, no runtime grants, final rollback), not parsed or executed. It adds a private receipt/intent validator with an alert-row lock, three public-contract wrappers and a private finish helper. Exact event ID selects the append-only receipt before validating the keyed intent; suffixes alone never authorize a lease. Orphan/mismatched rows raise instead of being repaired. A genuinely absent receipt and intent yields missing. Mark requires an unexpired current token; release may clear its own expired token. A replaced token cannot mark/release. Alert readiness is independent of the sales-enabled flag.

Future isolated-database acceptance matrix (prepared, none executed):

| Case | Required result |
| --- | --- |
| First pending intent | Claimed; attempts increments once; exact identity returned; token hash only stored |
| Two concurrent claimers | One claimed, one busy; one lease owner |
| Lease expiry and reclaim | New token owns lease; attempts increments once |
| Stale token mark/release after reclaim | False; current owner and counters unchanged |
| Expired token before reclaim | Mark false; same-token release permitted |
| Mark with current unexpired token | Sent with timestamp; lease cleared; next claim sent |
| Release with current token | Pending with lease cleared; attempts preserved; retry can claim |
| Missing receipt and intent | Missing with exact requested identity and null intent fields |
| Receipt without durable intent, or orphan intent | Exception; no mutation |
| Wrong product/mode/kind/type/reference | Exception; no mutation, including sent/busy/finish paths |
| Null, malformed or mismatched lease state | Exception; no mutation |
| Attempts 999/1000 | Final claim reaches 1000; active lease can finish; later reclaim requires review |
| Concurrent exception duplicate and alert claim | No deadlock or partial receipt; lock order remains gate/payment before alert |
| Sales disabled after purchase | Alert delivery remains available when alert prerequisites are satisfied |

Remote schema/hash/ACL checks, actual constraint changes, SQL parse/acceptance/concurrency tests and real sender integration remain pending. Generic outbox behavior and all other products remain untouched. The adapter is server-only shared infrastructure for web/mobile/PWA; no browser behavior changes or installation verification are claimed.
