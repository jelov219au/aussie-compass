# Pro payment operator alerts

The signed Stripe webhook can send private operational alerts to `support@hojucompass.com` for:

- paid Checkout sessions whose `product_code` is supported by the entitlement system
- full or partial refunds
- dispute creation and status changes

The email contains the product, amount, status and only the last eight characters of relevant Stripe references. It never includes customer email, card details, authentication data, API keys, complete Stripe identifiers or the webhook payload.

An alert is not accounting product-attribution evidence. Checkout alerts may
show the allowlisted metadata label, while refund and dispute alerts can omit a
product label; none proves the complete Checkout → PaymentIntent → Charge →
Balance Transaction chain. Never classify Resume or Rental revenue, refunds,
fees, taxes or payouts from an email subject, amount, suffix or arrival time.
Use the private source relationship and the isolation gate in
`docs/pro-product-rollout.md`.

For payment, refund and dispute events, the receipt trigger inserts a non-PII `payment_operator_alert_outbox` intent in the same PostgreSQL transaction as the webhook receipt and entitlement mutation. A rollback removes both; a commit leaves a pending intent. A claim returns exactly `claimed`, `sent`, `busy` or `missing`; only `claimed` may send SMTP. `busy` and SMTP failure return HTTP 503 so the same signed Stripe event retries without repeating the entitlement mutation. An expired lease can be reclaimed, while `sent` returns 200 without another email.

PaymentIntent retrieval or verification can fail before the entitlement transaction begins. That path records a separate `fulfillment_attention` intent through the guarded database wrapper, attempts delivery, and always returns HTTP 503. If recording the failure intent also fails, the handler remains fail-closed and relies on Stripe's signed-event retry; it never grants access or reports success.

The outbox stores only a one-way event lookup key, reference suffixes and fixed allowlisted fields. Its key is `event_key + alert_kind`; its lifecycle is `pending → sent` with attempts and lease timestamps. A stable privacy-safe Message-ID is reused if SMTP accepted a message but the mark-sent write failed, so the logical alert remains one incident even if a mailbox displays a duplicate. Runtime direct table access and internal enqueue execution are forbidden.

## Production configuration

1. In the `owner@hojucompass.com` Zoho account, create a dedicated application-specific password named `Hoju Compass Vercel payment alerts`. `support@hojucompass.com` is the monitored send/receive alias, not the SMTP login.
2. Store the following only as Vercel Production secrets/settings:
   - `PAYMENT_ALERTS_ENABLED=true`
   - `PAYMENT_ALERT_TO_EMAIL=support@hojucompass.com`
   - `PAYMENT_ALERT_FROM_EMAIL=support@hojucompass.com`
   - `ZOHO_SMTP_HOST=smtppro.zoho.com.au`
   - `ZOHO_SMTP_PORT=465`
   - `ZOHO_SMTP_USER=owner@hojucompass.com`
   - `ZOHO_SMTP_APP_PASSWORD` with the dedicated app password

`paymentAlertsConfigured()` and the fail-closed `payments:check` preflight
require the Australian tenant host, port `465`, the real `owner@hojucompass.com`
SMTP login and the verified `support@hojucompass.com` alias for From, To and
`NEXT_PUBLIC_SUPPORT_EMAIL`. A disabled alert switch, invalid tuple or missing app password keeps live Checkout closed. This
configuration proof does not replace the controlled real-email delivery test.

Payment SMTP credentials do not activate the public research survey email path.
Keep `RESEARCH_SURVEY_EMAIL_ENABLED=false` until that path has separately approved
abuse controls and delivery operations.

With `PAYMENTS_ENABLED=false`, verify SMTP authentication without placing the
app password in shell history:

```powershell
.\scripts\run-payment-alert-transport-check.ps1
```

This command is pinned to the Australian tenant endpoint `smtppro.zoho.com.au:465`, refuses a preloaded app
password or send acknowledgement, and prompts for the dedicated Zoho app
password using masked secure input. It authenticates but sends no message. After
restoring the previous non-secret process environment, removing the process-only
password and acknowledgement, and zeroing the converted password buffer, it
records success only as
`PAYMENT_ALERT_TRANSPORT=PASS mode=production payments_off=yes smtp=verified send_requested=no message_sent=no secrets_printed=no`.
After the mailbox owner approves exactly one harmless delivery test, run:

```powershell
.\scripts\run-payment-alert-transport-check.ps1 -SendTest
```

The second command is the only wrapper path that supplies the exact send
acknowledgement. It authenticates first and sends one message clearly labelled
`실제 결제 아님` to the monitored support inbox. Record only the received
boolean and UTC timestamp. Its successful final result is exactly
`PAYMENT_ALERT_TRANSPORT=PASS mode=production payments_off=yes smtp=verified send_requested=yes message_sent=one secrets_printed=no`.
It does not simulate a Stripe event and therefore does not replace the controlled
purchase/refund webhook rehearsal.

For both commands, endpoint mismatch, a forbidden preloaded credential or
acknowledgement, a cancelled or empty masked prompt, authentication/network
failure, send failure, and cleanup failure all exit 1 with exactly one final
`PAYMENT_ALERT_TRANSPORT=NO-GO mode=production payments_off=required smtp=unverified send_requested=<yes|no> message_sent=unverified secrets_printed=no reason=<allowlisted_reason>`
line after cleanup. The child verifier output is suppressed, so no address,
credential or transport error is copied into the operator record. If `-SendTest`
ends `NO-GO`, treat delivery as unverified and inspect the monitored inbox before
any later retry; an SMTP failure can be ambiguous after the server accepts a
message.
3. After `20260823_first_sale_gate_charge_link_v2`, apply `docs/migrations/20260823_payment_operator_alert_outbox_v1.sql` and verify its version, table, receipt trigger, explicit claim outcomes, guarded delivery functions and effective runtime privileges described in `docs/first-sale-gate-runbook.md`.
4. Redeploy Production.
5. Complete one controlled live purchase and full refund, then confirm that one purchase alert and one refund alert actually arrive in the monitored mailbox. Record only received booleans, timestamps and reference suffixes. Inject one SMTP failure and two-worker interleaving in Sandbox and prove `claimed + busy → 503`, `pending → retry → sent + 200`, stale-lease recovery, and sent duplicate without another send attempt.
6. Revoke the app password immediately if it is ever pasted into source code, chat, logs or a public environment.

## Status-only pre-customer support-alert gate

After the private transport, outbox and monitored-mailbox observations above are
complete, copy only their fixed outcomes into a separate private status JSON.
Do not put suffixes, event or Message-ID values, timestamps from individual
messages, email addresses, customer data, amounts, attempt counts, URLs,
credentials or message text in this JSON. Those details remain in the approved
private operations evidence.

```powershell
npm.cmd run payments:alerts:evidence -- --template
npm.cmd run payments:alerts:evidence -- --file <private-json-path>
```

The classifier reads one local file and does not query Stripe or the database,
authenticate to SMTP, inspect environment variables, send a message or write a
file. It requires payments-off transport checks, both exact no-send and labelled
send PASS results, monitored receipt of the labelled non-customer message, the
outbox migration and privilege proof, and controlled purchase and refund chains
whose signed webhook, single sent outbox intent and actual mailbox receipt are
all verified. It also requires the refund entitlement result, SMTP-failure 503,
busy-worker 503, stale-lease recovery, sent duplicate suppression and exclusion
of PII, full identifiers and secrets.

A transport PASS alone is insufficient: the no-send check proves only
authentication and the labelled send proves only direct SMTP delivery. Neither
proves that a signed purchase or refund webhook committed one outbox intent and
reached the monitored mailbox. Any `MISSING`, `FAIL`, unresolved state, changed
schema, non-production packet, missing final line or manually written PASS keeps
the first customer at `NO-GO`.

Only the exact final result beginning
`PAYMENT_REFUND_SUPPORT_ALERT_GATE=PASS mode=production` satisfies this one
support-alert gate. It does not replace `CUSTOMER_DOCUMENT_TRUST_GATE=GO`, which
checks seller, issuer and customer-visible support wording. It also does not
replace `CONTROLLED_PAYMENT_RECONCILIATION=PASS`, which checks gross, fee,
refund and payout source reconciliation. The first customer's later 15-minute
evidence must independently prove that customer's own outbox and mailbox
delivery; this pre-customer result cannot be copied forward as event proof.

The completed status file stays private and uncommitted. A PASS does not
authorise a payment, refund, customer contact, message send, credential use,
Production change or sale-gate reopen.

Zoho's [official SMTP guide](https://www.zoho.com/mail/help/zoho-smtp.html)
lists the tenant-specific SMTP endpoint with port `465` and SSL for paid organisations using a custom
domain and says the exact account/data-centre target must be confirmed in the
mailbox's Server Configuration Details. This wrapper currently pins that
documented target so an operator cannot redirect the app password with a
command-line host override. Before the first real check, the mailbox owner must
confirm the screen matches. If it does not, update and review the source pin and
contract together; do not bypass the pin at run time.
