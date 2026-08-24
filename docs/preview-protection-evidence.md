# Preview Deployment Protection evidence

Run this read-only check after each Vercel Preview deployment succeeds and before the authenticated Stage 1 smoke test:

```powershell
npm run deployment:verify-preview-protection -- --origin https://<exact-preview-host>.vercel.app
```

The command accepts exactly one explicit HTTPS `vercel.app` origin. It sends unauthenticated `GET` requests only to the 11 fixed Stage 1 smoke paths in `docs/release-candidate-manifest-2026-08-23.md`, never follows a redirect, and requires every direct response to be a Vercel SSO `302` with `X-Robots-Tag` containing `noindex`. It does not send a body, credential or cookie, read an environment value, write a file, or print the origin, redirect nonce or response cookie.

Retain only this non-secret success line:

```text
PREVIEW_PROTECTION_EVIDENCE=PASS routes=11 method=get redirects=blocked sso=vercel noindex=verified credentials=none cookies=none secrets_printed=no
```

Any application `200`, non-302 response, redirect to a non-Vercel SSO target, target-URL mismatch, missing `noindex`, network failure or invalid origin emits one canonical `PREVIEW_PROTECTION_EVIDENCE=FAIL ... launch=NO-GO` line and exits 1.

This check proves only the unauthenticated Deployment Protection boundary and its edge-level `noindex`. It does not prove the full Source SHA, Preview environment-variable scoping, alias or analytics isolation, nor the authenticated application's CSP, hydration, payment-off UI or global `noindex`. The existing security contract protects the source-level authenticated Preview `noindex` rule; the separately approved authenticated Stage 1 GET-only smoke test remains required. Never add a Vercel bypass token or browser session to this command.

`npm run quality:gate` runs the deterministic contract through the existing deployment-evidence aggregate. CI never runs the networked operator command or contacts a Preview deployment.
