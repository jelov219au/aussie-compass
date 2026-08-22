# Pro payment operator alerts

The signed Stripe webhook can send private operational alerts to `support@hojucompass.com` for:

- paid Checkout sessions whose `product_code` is supported by the entitlement system
- full or partial refunds
- dispute creation and status changes

The email contains the product, amount, status and only the last eight characters of relevant Stripe references. It never includes customer email, card details, authentication data, API keys, complete Stripe identifiers or the webhook payload.

For payment, refund and dispute events, the receipt trigger inserts a non-PII `payment_operator_alert_outbox` intent in the same PostgreSQL transaction as the webhook receipt and entitlement mutation. A rollback removes both; a commit leaves a pending intent. A claim returns exactly `claimed`, `sent`, `busy` or `missing`; only `claimed` may send SMTP. `busy` and SMTP failure return HTTP 503 so the same signed Stripe event retries without repeating the entitlement mutation. An expired lease can be reclaimed, while `sent` returns 200 without another email.

PaymentIntent retrieval or verification can fail before the entitlement transaction begins. That path records a separate `fulfillment_attention` intent through the guarded database wrapper, attempts delivery, and always returns HTTP 503. If recording the failure intent also fails, the handler remains fail-closed and relies on Stripe's signed-event retry; it never grants access or reports success.

The outbox stores only a one-way event lookup key, reference suffixes and fixed allowlisted fields. Its key is `event_key + alert_kind`; its lifecycle is `pending → sent` with attempts and lease timestamps. A stable privacy-safe Message-ID is reused if SMTP accepted a message but the mark-sent write failed, so the logical alert remains one incident even if a mailbox displays a duplicate. Runtime direct table access and internal enqueue execution are forbidden.

## Production configuration

1. In the `support@hojucompass.com` Zoho account, create a dedicated application-specific password named `Hoju Compass Vercel payment alerts`.
2. Store the following only as Vercel Production secrets/settings:
   - `PAYMENT_ALERTS_ENABLED=true`
   - `PAYMENT_ALERT_TO_EMAIL=support@hojucompass.com`
   - `PAYMENT_ALERT_FROM_EMAIL=support@hojucompass.com`
   - `ZOHO_SMTP_HOST` using the exact SMTP host shown by the mailbox
   - `ZOHO_SMTP_PORT=465`
   - `ZOHO_SMTP_USER=support@hojucompass.com`
   - `ZOHO_SMTP_APP_PASSWORD` with the dedicated app password
3. After `20260823_first_sale_gate_charge_link_v2`, apply `docs/migrations/20260823_payment_operator_alert_outbox_v1.sql` and verify its version, table, receipt trigger, explicit claim outcomes, guarded delivery functions and effective runtime privileges described in `docs/first-sale-gate-runbook.md`.
4. Redeploy Production.
5. Complete one controlled live purchase and full refund, then confirm that one purchase alert and one refund alert actually arrive in the monitored mailbox. Record only received booleans, timestamps and reference suffixes. Inject one SMTP failure and two-worker interleaving in Sandbox and prove `claimed + busy → 503`, `pending → retry → sent + 200`, stale-lease recovery, and sent duplicate without another send attempt.
6. Revoke the app password immediately if it is ever pasted into source code, chat, logs or a public environment.

The default host is `smtppro.zoho.com`, but Zoho says the exact host depends on the account type and data centre. Use the value displayed in the mailbox's own server-configuration screen.
