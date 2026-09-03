# Car operator alert outbox query contract (not deployed)

`createCarPurchaseAlertOutbox` accepts an injected query and explicit test/live mode. It creates no connection, transport or runtime binding. The existing generic claim function returns incomplete identity for sent/busy; it is not sufficient for this adapter.

Three proposed functions use five fixed parameters: event ID, alert kind, product code (`car_purchase_pro`), livemode boolean and SHA-256 claim-token hash. The plaintext 32-byte random token stays in the caller. Only its hash reaches the query. Claims must filter by exact event identity, kind, product and mode before acquiring or renewing any lease.

- `claim_car_purchase_operator_alert_v1`: returns one row with `claim_outcome`, `event_id`, `livemode`, `alert_kind`, `event_type`, `event_ref_last8`, `product_code`, `checkout_ref_last8`, `payment_intent_ref_last8`, `charge_ref_last8`, `attempts`.
- `mark_car_purchase_operator_alert_sent_v1`: returns one boolean aliased `marked`.
- `release_car_purchase_operator_alert_claim_v1`: returns one boolean aliased `released`.

Claim outcomes are claimed/sent/busy/missing. All outcomes require exact requested identity and event suffix. Claimed/sent/busy also require event type consistent with kind, checkout/PI suffixes, charge suffix for refund/dispute (null for checkout attention), and integer attempts 1–1000. Missing returns null event type and purchase suffixes, with attempts 0; identity columns describe the request, not a fabricated existing receipt. Reject unknown, incomplete, extra or multiple rows. Do not coerce string booleans or counters.

The SQL implementation must join the car atomic receipt/full event identity and durable intent, never authorize from suffixes alone. Product/mode must constrain the mutation itself, including mark/release. Mark/release additionally match a pending row's current lease hash; a replaced token cannot complete or release another claim. Missing/mismatched product or mode must not mutate an unrelated alert. Sent is terminal; busy does not acquire a second lease. Lease expiry and retry must be concurrency-tested in an isolated approved database before runtime connection.

The delivery layer independently matches intent event type and every purchase suffix against the verified event before sending. A mismatched intent is not sent or marked; its lease may expire. Delivery is at least once: a transport success followed by uncertain mark can retry, so exactly-once email is not promised. Stable messageId helps downstream deduplication but is not a guarantee. Attempts over 1000 fail closed and require operator review; do not silently drop them.

SQL bodies, remote schema/hash/ACL checks, concurrency tests and real sender integration remain pending. Generic outbox behavior and all other products remain untouched. The new adapter is server-only shared infrastructure for web/mobile/PWA; no browser behavior changes or installation verification are claimed.
