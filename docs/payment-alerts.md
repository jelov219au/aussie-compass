# Pro payment operator alerts

The signed Stripe webhook can send private operational alerts to `support@hojucompass.com` for:

- paid Checkout sessions whose `product_code` is supported by the entitlement system
- full or partial refunds
- dispute creation and status changes

The email contains the product, amount, customer email when supplied to Checkout, and Stripe reference IDs. It never includes card details, authentication data, API keys or the full webhook payload. Entitlement processing remains independent: a Zoho outage is logged but never blocks or reverses a customer's paid access.

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
3. Redeploy Production.
4. Complete one controlled live purchase and full refund, then confirm that one purchase alert and one refund alert arrive in the support mailbox.
5. Revoke the app password immediately if it is ever pasted into source code, chat, logs or a public environment.

The default host is `smtppro.zoho.com`, but Zoho says the exact host depends on the account type and data centre. Use the value displayed in the mailbox's own server-configuration screen.
