# Production deployment identity evidence

Run this read-only check only after the owner has separately approved and promoted a reviewed commit. It does not deploy, promote, alias, change an environment variable or enable payments.

```powershell
git rev-parse HEAD
git merge-base --is-ancestor 2f886c2 <full-approved-sha>
$env:VERCEL_AUTOMATION_BYPASS_SECRET = <process-only masked value>
npm run deployment:verify-production -- --expected-sha <full-approved-sha>
Remove-Item Env:VERCEL_AUTOMATION_BYPASS_SECRET
```

The verifier uses public GitHub GET requests and public-site GET requests. When Vercel Standard Protection covers the exact deployment origin, it additionally accepts the process-only `VERCEL_AUTOMATION_BYPASS_SECRET` header value created for this project. Never pass that value on the command line, store it in source or a tracked environment file, send it to the public custom domain, or print it. The integrated wrapper removes it from its process immediately after deployment identity succeeds. It requires all of the following in one run:

- the latest Vercel-bot GitHub deployment whose environment is `Production` to have the exact 40-character approved SHA, so an older historical Production match cannot pass;
- that Production deployment's latest Vercel status is `success`;
- the unique Vercel `data-dpl-id` to match across the exact-SHA deployment origin and `https://hojucompass.com` for both checked pages;
- the reviewed invalid-restore accessibility markers on both origins;
- the public Resume Pro page to show the payments-off launch-preparing state and no Checkout form.

Only the exact final line below is deployment-identity PASS:

```text
PRODUCTION_DEPLOYMENT_EVIDENCE=PASS source_sha=exact environment=production deployment=success origins=same-dpl-id public_markers=verified payments=off secrets_printed=no
```

A Preview deployment, abbreviated or mismatched SHA, missing/failed status, redirect, unavailable page, different `data-dpl-id` across either origin, missing marker or visible Checkout produces one canonical `PRODUCTION_DEPLOYMENT_EVIDENCE=FAIL ... launch=NO-GO` line and exit code 1. A successful Preview status never satisfies this gate. If Vercel Deployment Protection blocks the deployment origin and the process-only bypass value is absent or invalid, the check remains `NO-GO`. The bypass header is sent only to the exact `*.vercel.app` deployment origin. No GitHub token, cookie, query parameter or public-domain credential is used.
