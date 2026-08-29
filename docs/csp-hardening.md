# CSP hardening decision

## Decision

Hoju Compass uses Next.js 16.3.1 App Router and keeps its statically generated public pages. The production policy therefore separates the framework compatibility exception from the default script policy:

- `script-src 'self'` is the production fallback and does not allow eval, inline code, wildcard sources, `data:`, or remote schemes.
- `script-src-elem 'self' 'unsafe-inline'` is the explicit temporary exception for Next.js-generated inline `<script>` bootstrap and React Server Component payloads.
- `script-src-attr 'none'` blocks inline event-handler attributes such as `onclick`, even though framework script elements remain allowed.
- Development alone adds `unsafe-eval`, which the local Next.js guide documents as necessary for React debugging.

This is a narrower policy than putting `unsafe-inline` in `script-src`, but it is not equivalent to a nonce-based strict CSP.

## Local framework and build evidence

The bundled `node_modules/next/dist/docs/01-app/02-guides/content-security-policy.md` guide says that nonce-based CSP requires a fresh nonce per request and dynamic rendering. It also states that static optimization, ISR and ordinary CDN caching are lost, and that Partial Prerendering is incompatible.

The unmodified 5e03759 production build generated 102 static pages. A production response for `/resume-builder` contained 14 script elements: nine external framework or page scripts, three non-executable JSON-LD blocks, and two executable inline Next.js hydration/RSC scripts without a nonce or hash.

Two stricter experiments were run locally:

1. Removing `unsafe-inline` from `script-src` left the inline hydration scripts blocked. The page HTML rendered, but changing the name field did not update the resume preview, demonstrating failed hydration.
2. Enabling Next.js experimental SRI with SHA-256 preserved all 102 static pages and added integrity attributes to some external chunks, but the two executable inline scripts remained unhashed and without a nonce. SRI alone therefore did not make a strict static CSP functional and was not retained.

## Alternatives for removing the element exception

### Per-request nonce

Add a Next.js Proxy that generates an unpredictable nonce for every matching request, sets it on both the request and response CSP headers, and dynamically renders every protected page so Next.js can attach the nonce to framework scripts. Applying this site-wide would remove static generation and CDN caching for the current public site. A narrower future migration could begin with Resume Builder and Resume Pro routes, but it must include browser regression coverage for navigation, hydration, checkout and restore flows.

### Hash-based policy

Next.js experimental SRI protects external assets but did not authorize the inline RSC payload in the tested 16.3.1 build. A complete CSP hash solution would need to calculate and publish hashes for every executable inline script. Dynamic RSC responses can vary per request, so a static header cannot safely enumerate all required hashes without a framework-supported build/runtime pipeline.

## Residual risk

Modern CSP3 browsers block inline event attributes because of `script-src-attr 'none'`, but an attacker who finds an HTML injection capable of adding an inline `<script>` element can still execute script under the temporary `script-src-elem 'unsafe-inline'` exception. Older browsers that do not understand `script-src-elem` fall back to strict `script-src 'self'`; they fail closed but may not hydrate the application.

The application must continue to rely on React escaping, avoid untrusted raw HTML, and keep JSON-LD serialization escaped. `style-src 'unsafe-inline'` is a separate CSS compatibility risk and does not authorize JavaScript.

The exception can be removed when Next.js externalizes or hashes its inline bootstrap for static App Router pages, or when the performance and hosting cost of nonce-backed dynamic rendering is accepted. Until then, the security contract evaluates the generated production and development policies, restricts the exception to script elements, blocks script attributes, and requires this decision record.
