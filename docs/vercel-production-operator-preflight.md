# Vercel Production operator preflight

This operator path is read-only and must run while Production payments remain off. It never deploys, promotes, changes an environment variable or creates a Checkout Session.

## Authentication boundary

The Windows computer name cannot safely be used by Vercel CLI 59.5.0 as an HTTP User-Agent on this operator machine. Authenticate separately in a user-visible terminal through the pinned launcher:

```powershell
npx --yes --package=vercel@59.5.0 -- node .\scripts\invoke-vercel-cli-with-ascii-hostname.mjs login --no-color
```

Confirm the OAuth device request's location, time and account in the browser. The repository wrapper never starts login, accepts `--token`, reads a token or writes a token/environment file. Do not use `vercel env pull`, a token argument or a hand-written `.env` file.

## Integrated read-only run

Start a fresh PowerShell process with no payment, Stripe, database, audit or Vercel bypass values preloaded. Keep only `.env.example`; the wrapper refuses real dotenv files because Vercel CLI would allow them to override downloaded Production values.

```powershell
.\scripts\run-vercel-production-payment-preflight.ps1 `
  -ExpectedNeonEndpointId ep-owner-approved-primary `
  -ExpectedProductionSha 0123456789abcdef0123456789abcdef01234567
```

The wrapper fixes the project to `aussie-compass` and invokes `vercel env run -e production`, so Production environment values remain in process memory rather than a file. It derives the clean-process denylist from every variable name in `.env.example`, plus Vercel's managed database alias and operator-only variables, because local process values would otherwise override the downloaded Production environment.

The Vercel CLI and its `npx` parent never receive the Automation Bypass secret. Only the PowerShell child started by `env run` requests that value through a masked prompt, rejects a bypass value deployed in Vercel, and process-scopes it to a separate invocation of the existing `run-production-payment-preflight.ps1`. That existing wrapper remains solely responsible for masked Account-audit key, accounting key and audit-database input, exact deployment evidence and the final payments-off result. Both layers remove their temporary process values and zero unmanaged plaintext buffers before exit.

Only `VERCEL_PRODUCTION_PREFLIGHT=PASS ... payments=off ... secrets_printed=no` together with the inner canonical `FIRST_SALE_PREFLIGHT=PASS` is usable evidence. Any missing line, interruption or `FAIL` remains `NO-GO` and does not authorize enabling payments.
