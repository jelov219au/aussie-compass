# Vercel Production operator preflight

This operator path is read-only and must run while Production payments remain off. It never deploys, promotes, changes an environment variable or creates a Checkout Session.

## Authentication boundary

The Windows computer name cannot safely be used by Vercel CLI 59.5.0 as an HTTP User-Agent on this operator machine. Authenticate separately in a user-visible terminal through the pinned launcher:

```powershell
npx --yes --package=vercel@59.5.0 -- node .\scripts\invoke-vercel-cli-with-ascii-hostname.mjs login --no-color
```

Confirm the OAuth device request's location, time and account in the browser. The repository wrapper never starts login, accepts `--token`, reads a token or writes a token/environment file. Do not use `vercel env pull`, a token argument or a hand-written `.env` file.

## Integrated read-only run

Start a fresh PowerShell process with no payment, Stripe, database, audit, token or Vercel bypass values preloaded. Keep only `.env.example`; the wrapper refuses real dotenv files and stale process values.

```powershell
.\scripts\run-vercel-production-payment-preflight.ps1 `
  -ExpectedNeonEndpointId ep-owner-approved-primary `
  -ExpectedProductionSha 0123456789abcdef0123456789abcdef01234567
```

Vercel Sensitive values are non-readable after creation and are available only to the deployed runtime. The wrapper therefore never uses `vercel env run`, `vercel env pull`, a dotenv file, a token argument or a manually managed Deployment Protection bypass secret. It first proves the exact successful Production deployment and obtains its protected `vercel.app` origin. The protected runtime check is then sent with pinned `vercel curl --deployment`; the fixed response verifies Production, exact SHA, both payment switches, the remaining payment configuration, Resume Pro Product and zero open Checkout Sessions, the runtime database role/schema/endpoint, and SMTP transport without sending mail.

The inner wrapper requests the Account-read audit key and Balance Transactions-read accounting key only through masked prompts. It creates a one-time random challenge and sends only the challenge and each key's HMAC to the protected runtime. The runtime computes the same HMAC with its non-readable `STRIPE_SECRET_KEY`; it passes only if all three roles are distinct. Raw Stripe keys never enter the request body, command arguments or logs. After runtime PASS, the wrapper requests the `hoju_payment_auditor` URL, runs the standalone read-only Account/business-profile and audit-database check, then runs the accounting permission preflight. It removes process-scoped inputs and zeroes unmanaged plaintext buffers before the final result.

Only `VERCEL_PRODUCTION_PREFLIGHT=PASS ... payments=off ... secrets_printed=no` together with the inner canonical `FIRST_SALE_PREFLIGHT=PASS` is usable evidence. Any missing line, interruption or `FAIL` remains `NO-GO` and does not authorize enabling payments.
