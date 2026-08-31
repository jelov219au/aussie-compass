# Content source-link maintenance

## Scope and safety

The audit covers `src/data/articles.ts`, the shared resource page, the 17 standalone
guides listed in `scripts/audit-content-source-links.mjs`, and their statically
imported tool/data modules. It does not execute application code or follow imports
into payment, API, environment, account or runtime-service modules.

It extracts complete literal HTTP(S) URLs from TypeScript syntax, not comments.
Repeated URLs and fragment variants share one request. Dynamic URL templates are
counted separately and require a specific UI test; they are not claimed as checked.
Source inventories can include official sources, public service providers and the
marketplace links deliberately offered by the used-car guide. Not every URL is a
government source.

Compatibility: **주의사항과 함께 호환**. Corrections are made in the shared web,
mobile and installed-PWA content, not separate platform copies. External sources
remain online-only. No service-worker caching, local-storage schema, tracking,
lead capture or payment behavior is added by the audit.

## Run

Use the repository's installed dependencies and Node.js 22 or newer:

```text
npm run audit:content-sources
npm run audit:content-sources -- --check
npm run test:content-source-audit
npm run test:critical-source-review
```

The first command is a read-only local inventory with no network requests. The
second explicitly enables public GET requests: at most four source hosts at once,
one sequential worker per host, a 12-second per-URL deadline, at most five followed
redirects and a bounded HTML preview for titles. No cookies, Authorization header,
provider key or user form input is used. Complete literal URLs are trusted project
content, not public user input; this is an operator script, not a public URL-fetch API.
Credentials and local/IP-literal URL targets are rejected.

Output goes to stdout as JSON; progress goes to stderr. The command does not alter
source URLs, write files, deploy, schedule itself or change provider settings.
The regression command uses in-memory response fixtures and makes no network calls.
The critical-source review contract additionally validates the dated manual
evidence ledger and changed content safeguards; it also runs entirely offline.

## Interpret evidence before editing

- `reachable`: an HTTP success response, not proof that every statement is current.
- `redirected`: inspect the destination title and content; a homepage or search page
  is not automatically an equivalent source. Do not blindly replace every redirect.
- `restricted`: 401, 403 or 429. It may be bot protection or an account boundary,
  not a dead page. Keep it separate from confirmed broken links.
- `review-page`: a success response with a known error/challenge title. Confirm
  through the official site before changing the link.
- `http-error`: review the original URL and find its official replacement; a
  transient 5xx alone is not proof that the resource has permanently disappeared.
- `network-error`: DNS, connection, certificate or timeout failure. Record the
  limitation and use an independent official-source check; do not mark it verified.
- Redirect loops, limits, missing locations and unsafe targets require review.

For an edit, record the old URL, new URL, affected source file(s), verification
date and why the destination supports the same user action. Prefer an equivalent
official detail page over a generic homepage. If only a broader official starting
point is available, adjust the nearby description to state what users must find.
Do not update an article's entire factual-review date solely because a URL responds.

## Release checks

Run the source-audit fixtures, affected content contracts, cross-surface, security
and Rental live-status contracts, targeted ESLint, TypeScript and whitespace checks.
URL-only changes do not require launching another local development server.
If changing layout or interaction too, use the normal responsive browser checks.
Confirm the Production source SHA and corrected public links after deployment.
Record unresolved access limitations, not just a green success count, in the dated
audit result and the operations `CURRENT_STATE.md`.
