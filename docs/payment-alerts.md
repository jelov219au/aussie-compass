# Pro payment operator alerts

The signed Stripe webhook can send private operational alerts to `support@hojucompass.com` for:

- paid Checkout sessions whose `product_code` is supported by the entitlement system
- full or partial refunds
- dispute creation and status changes

The email contains the product, amount, status and only the last eight characters of relevant Stripe references. It never includes customer email, card details, authentication data, API keys, complete Stripe identifiers or the webhook payload.

For payment, refund and dispute events, `apply_entitlement_event` inserts a non-PII `payment_operator_alert_outbox` intent in the same PostgreSQL transaction as the webhook receipt and entitlement mutation. A rollback removes both; a commit leaves a pending intent. The webhook claims that intent and sends it before returning HTTP 200. A temporary SMTP failure releases the lease and returns HTTP 503 so the same signed Stripe event can retry delivery without repeating the entitlement mutation. A sent intent is never sent again.

PaymentIntent retrieval or verification can fail before the entitlement transaction begins. That path records a separate `fulfillment_attention` intent through the guarded database wrapper, attempts delivery, and always returns HTTP 503. If recording the failure intent also fails, the handler remains fail-closed and relies on Stripe's signed-event retry; it never grants access or reports success.

The outbox stores only a one-way event lookup key, reference suffixes and fixed allowlisted fields. Its key is `event_key + alert_kind`; its lifecycle is `pending → sent` with attempts and lease timestamps. Runtime direct DML is forbidden.

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
3. Apply and verify `schema_migrations.version=20260823_payment_operator_alert_outbox_v1`, the outbox table, four guarded delivery functions and effective runtime privileges described in `docs/first-sale-gate-runbook.md`.
4. Redeploy Production.
5. Complete one controlled live purchase and full refund, then confirm that one purchase alert and one refund alert arrive in the support mailbox. Inject one SMTP failure in Sandbox and prove `503 + pending → retry → sent + 200 → duplicate without another email`.
6. Revoke the app password immediately if it is ever pasted into source code, chat, logs or a public environment.

The default host is `smtppro.zoho.com`, but Zoho says the exact host depends on the account type and data centre. Use the value displayed in the mailbox's own server-configuration screen.
