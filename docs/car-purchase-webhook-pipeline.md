# Isolated car webhook persistence and alert pipeline

`createCarPurchaseWebhookPipeline` composes the signed fulfillment, strict paid/reversal/exception query adapters, car alert outbox and bounded-message delivery. Query, provider, signature verifier, readiness checks and sender are injected. No production route, SQL connection or email transport is created.

The request's verified exception/reversal input is captured only after the strict persistence adapter succeeds. Fulfillment must also accept its durable markers before an alert is claimed. A separate per-request capture prevents overlapping requests from exchanging identities. Failed signature, readiness, provider verification or persistence never starts alert delivery. Missing sender/query/readiness configuration fails closed before signature/provider access. The readiness callback must cover approved schema/function/ACL and sender prerequisites; it is not implemented by this factory.

Paid grants use the existing strict paid adapter and return `alert: not_requested`; this pipeline does not send paid confirmations. Unsupported events and other products return `handled: false`, which means the future shared route must continue its existing router, not acknowledge the event here. Refund/dispute lookup may need provider reads before determining the original purchase belongs to another product.

After accepted persistence, success returns the persistence outcome plus `alert: sent` or `already_sent`. A busy lease returns `ok: false, reason: alert_busy, persisted: true`. Delivery/claim/mark failures return `alert_delivery_failed` with `persisted: true` and no private error details. These require a retryable HTTP response until a separately verified retry worker owns responsibility; they must not become success acknowledgements. Receipt/restriction/hold/outbox remain durable across retries, and duplicate persistence still reaches alert delivery. No rollback, regrant or sale reopening is attempted on an alert failure. Delivery is at least once.

Validation is synthetic signed Stripe SDK input with mocked provider/query/sender, including deterministic overlapping-request interleaving. It is not SQL atomicity, real transport or shared-route verification. The factory remains unconnected; web/mobile/PWA use the same eventual server endpoint.

## Prepared HTTP boundary (not mounted)

`createCarPurchaseWebhookHttp` reads a POST body once with a 1 MiB byte limit. It rejects invalid declared length, length mismatch, unreadable/used/locked streams, invalid UTF-8 and unsupported content encoding/type. A leading BOM, whitespace and split UTF-8 characters are preserved; the adapter does not parse or reserialize JSON before the pipeline sees the original string and signature. The 2 KiB access-request reader is intentionally not used for signed webhooks.

Exact handled success with a completed/not-requested alert returns 200. Invalid signature/event/environment/contract returns 400. Unavailable/persistence/alert failure, busy lease or malformed pipeline output returns 503 with Retry-After:60. Responses are no-store and contain no internal error details. A handled:false result requires an explicit existing-product delegate; absence or failure returns 503. The delegate receives the same unchanged body/signature and must preserve its own signature verification and product routing. Its response status/body/headers are preserved with no-store imposed. The consumed Request is never passed as a readable fallback body.

This factory does not extract, replace or mount the existing shared Stripe route. That integration, real webhook retry behavior, current function/ACL readiness and real transport remain separate reviewed work.
