# Car refunds: atomic restriction and operator alert contract

Status: local adapter and inert SQL draft only. No database implementation has
been applied, no runtime connected, and SQL parsing/transactions remain unverified.

`carPurchaseProWebhookStore.applyReversal` now calls the proposed
`public.apply_car_purchase_reversal_event_v1(text,text,boolean,timestamptz,text,text,text,text,text,text,text)`.
It no longer uses the general timestamp-based guarded function for car refunds.
The fixed 11 arguments remain event ID/type/mode/created, action, product,
checkout/PI/charge/customer and reason. The signed fulfillment layer still verifies
the current charge and exact original checkout/line items before this call.

The single returned row must retain the full verified relationship even without
an entitlement: product/checkout/PI/charge/customer are explicit for tombstones and
duplicates, not null placeholders. Outcomes are processed/duplicate/tombstoned;
ignored_stale is rejected. An existing row must be review/revoked for every outcome,
and a revoke command cannot return review. A null ID/status is allowed only for a
duplicate or tombstone with the same verified purchase identity.

Additional required evidence is exact event_id/event_type/livemode,
alert_kind=refund_event, strict true alert_durable/sale_hold_durable/
restriction_durable, and a string gate_state of OPEN/RESERVED/LOCKED. The active
gate can belong to a newer order: the transaction must preserve that gate and
protect the older exact entitlement. OPEN is safe only after every admission and
release path actually consults the durable hold under the common lock.

The store returns these durable markers to fulfillment. Fulfillment independently
rejects a generic mock/adapter that supplies only an outcome or reports stale
success, so a direct store substitution cannot silently bypass alert/hold evidence.
The public handler result remains the existing small outcome/error envelope.

The SQL review draft in `docs/drafts/car-purchase-exception-atomic-v1.sql` extends
the common atomic core to refund events and provides a wrapper with the exact
query result. The verified charge ID is the refund reference; immutable event IDs
distinguish separate refund events. current_status carries the verified refund
reason here, not an invented Stripe status. The wrapper shares receipt, monotonic
restriction, sale hold and refund alert writes with the exception transaction.
It never calls the generic timestamp-based grant/reversal function.

The draft remains inert: unconditional opening stop, always-false integration
readiness, no runtime grants and final rollback. Exact remote hash/ACL/constraint
changes, generic grant bypass prevention and approved offer are still required.
Do not remove these gates or claim SQL atomicity from mock query tests.

Validation preparation covers full/partial/failed refunds, before-grant tombstones,
duplicate active/review rejection for revoke, stale success rejection, missing
alert/hold/restriction evidence, full reference mismatch and persistence failure.
Separate real SQL cases must still prove rollback, duplicate replay, out-of-order
refund/paid/dispute sequences and concurrent execution after approved migration.
Operator rendering/lease/retry and actual sending remain separate future work.
