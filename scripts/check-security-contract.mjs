import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { serializeJsonLd } from "../src/lib/jsonLd.ts";
import { safeExternalHttpUrl, safeInternalNavigationPath } from "../src/lib/safeNavigation.ts";

const projectFile = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");
const originalNodeEnv = process.env.NODE_ENV;
const originalVercelEnv = process.env.VERCEL_ENV;

async function loadHeaderRules(nodeEnv, vercelEnv, cacheKey) {
  process.env.NODE_ENV = nodeEnv;
  if (vercelEnv === undefined) delete process.env.VERCEL_ENV;
  else process.env.VERCEL_ENV = vercelEnv;
  const configUrl = new URL(`../next.config.ts?security-contract=${cacheKey}`, import.meta.url);
  const config = (await import(configUrl.href)).default;
  return config.headers();
}

const productionHeaderRules = await loadHeaderRules("production", "production", "production");
const previewHeaderRules = await loadHeaderRules("production", "preview", "preview");
const developmentHeaderRules = await loadHeaderRules("development", undefined, "development");
if (originalNodeEnv === undefined) delete process.env.NODE_ENV;
else process.env.NODE_ENV = originalNodeEnv;
if (originalVercelEnv === undefined) delete process.env.VERCEL_ENV;
else process.env.VERCEL_ENV = originalVercelEnv;

const [requestSecurity, cspDecision, jsonLdComponent, dashboard, bookmarkStorage, jobTracker, serviceWorker, serviceWorkerRegistration, nswProvider, nswRoute, railPlanner] = await Promise.all([
  projectFile("src/lib/requestSecurity.ts"),
  projectFile("docs/csp-hardening.md"),
  projectFile("src/components/seo/JsonLd.tsx"),
  projectFile("src/components/dashboard/MyCompassDashboard.tsx"),
  projectFile("src/lib/bookmarks.ts"),
  projectFile("src/components/tools/JobApplicationTracker.tsx"),
  projectFile("public/sw.js"),
  projectFile("src/components/pwa/ServiceWorkerRegistration.tsx"),
  projectFile("src/lib/nswPlanningDataProvider.ts"),
  projectFile("src/app/api/nsw-planning-snapshot/route.ts"),
  projectFile("src/components/tools/RailWorkAlertPlanner.tsx"),
]);

function headerValue(rules, source, key) {
  const rule = rules.find((item) => item.source === source);
  return rule?.headers.find((item) => item.key.toLowerCase() === key.toLowerCase())?.value;
}

function parseCsp(value) {
  assert.ok(value, "Content-Security-Policy header must be configured");
  return new Map(value.split(";").map((item) => item.trim()).filter(Boolean).map((item) => {
    const [name, ...sources] = item.split(/\s+/);
    return [name, sources];
  }));
}

const productionCsp = parseCsp(headerValue(productionHeaderRules, "/(.*)", "Content-Security-Policy"));
const developmentCsp = parseCsp(headerValue(developmentHeaderRules, "/(.*)", "Content-Security-Policy"));

assert.equal(
  headerValue(previewHeaderRules, "/(.*)", "X-Robots-Tag"),
  "noindex, nofollow",
  "authenticated Preview responses must carry a global noindex header",
);
assert.equal(
  headerValue(productionHeaderRules, "/(.*)", "X-Robots-Tag"),
  undefined,
  "Production responses must remain indexable",
);
assert.equal(
  headerValue(developmentHeaderRules, "/(.*)", "X-Robots-Tag"),
  undefined,
  "local development must not masquerade as a protected Preview",
);

assert.deepEqual(productionCsp.get("script-src"), ["'self'"], "production script-src must not allow inline scripts, eval, wildcards, data, or remote schemes");
assert.deepEqual(developmentCsp.get("script-src"), ["'self'", "'unsafe-eval'"], "unsafe-eval must be limited to the documented development requirement");
assert.deepEqual(productionCsp.get("script-src-elem"), ["'self'", "'unsafe-inline'"], "the audited Next.js inline bootstrap exception must stay isolated to script elements");
assert.deepEqual(productionCsp.get("script-src-attr"), ["'none'"], "inline event-handler attributes must remain blocked");
assert.deepEqual(productionCsp.get("connect-src"), ["'self'"], "browser code must not connect directly to TfNSW, Google Maps or another external data API");

for (const directive of ["default-src", "object-src", "base-uri", "form-action", "frame-ancestors"]) {
  assert.ok(productionCsp.has(directive), `Production CSP directive is missing: ${directive}`);
}

for (const header of [
  "Strict-Transport-Security",
  "X-Content-Type-Options",
  "Referrer-Policy",
  "Permissions-Policy",
]) {
  assert.ok(headerValue(productionHeaderRules, "/(.*)", header), `Security header is missing: ${header}`);
}
assert.equal(
  headerValue(productionHeaderRules, "/(.*)", "Permissions-Policy"),
  "camera=(), microphone=(), geolocation=(), usb=()",
  "the installed app must not gain browser geolocation or device permissions",
);

for (const boundary of [
  'const OFFLINE_URL = "/offline"',
  "cache.add(OFFLINE_URL)",
  'event.request.mode !== "navigate"',
  "fetch(event.request).catch(() => caches.match(OFFLINE_URL))",
]) assert.ok(serviceWorker.includes(boundary), `service worker offline boundary is missing: ${boundary}`);
assert.equal((serviceWorker.match(/cache\.add\(/g) ?? []).length, 1, "only the static offline fallback may be added to the PWA cache");
assert.doesNotMatch(serviceWorker, /cache\.(?:put|addAll|matchAll)|caches\.open\([^)]*\)[\s\S]*fetch\([^)]*\)[\s\S]*(?:put|add)/, "network, API and error responses must never be written to Cache Storage");
assert.doesNotMatch(serviceWorker, /nsw-planning-snapshot|api\.transport\.nsw\.gov\.au|NSW_TRANSPORT_API_KEY|Authorization/, "the service worker must not know about official-data endpoints or credentials");
assert.ok(serviceWorkerRegistration.includes('process.env.NODE_ENV !== "production"'), "service worker registration must remain Production-only");
assert.ok(serviceWorkerRegistration.includes('navigator.serviceWorker.register("/sw.js")'), "the app must register only its same-origin service worker");

assert.ok(nswProvider.startsWith('import "server-only"'), "the TfNSW provider and API key must remain server-only");
assert.ok(nswProvider.includes("process.env.NSW_TRANSPORT_API_KEY"), "the server provider must read the TfNSW key only from server environment state");
assert.doesNotMatch(nswProvider, /console\.|[?&](?:key|token)=/i, "the provider must not log credentials or place them in URLs");
assert.doesNotMatch(nswRoute, /NSW_TRANSPORT_API_KEY|Authorization|process\.env|console\./, "the public route must not serialize, read or log the TfNSW credential");
assert.doesNotMatch(railPlanner, /\/api\/nsw-planning-snapshot|NSW_TRANSPORT_API_KEY|fetch\(|geolocation/, "the current public rail UI must remain local/link-only and must not consume live or fixture API data");
assert.ok(railPlanner.includes("https://www.google.com/maps/search/?api=1") && railPlanner.includes('target="_blank"') && railPlanner.includes('rel="noreferrer"'), "Google Maps must remain an explicit external top-level navigation without referrer data");

for (const evidence of [
  "Next.js 16.3.1",
  "script-src-elem 'self' 'unsafe-inline'",
  "script-src-attr 'none'",
  "dynamic rendering",
  "experimental SRI",
  "inline `<script>`",
]) {
  assert.ok(cspDecision.includes(evidence), `The CSP residual-risk decision is incomplete: ${evidence}`);
}

for (const contract of [
  "sec-fetch-site",
  "content-length",
  "request.clone().arrayBuffer()",
  "Request body is too large.",
  "allowedContentTypes",
]) {
  assert.ok(requestSecurity.includes(contract), `Mutation-request contract is missing: ${contract}`);
}

const hostileJsonLd = serializeJsonLd({ title: "</script><script>alert(1)</script>" });
assert.equal(hostileJsonLd.includes("</script>"), false, "JSON-LD must not be able to close its script element");
assert.ok(hostileJsonLd.includes("\\u003c/script>"), "JSON-LD must escape opening angle brackets before HTML serialization");
assert.ok(jsonLdComponent.includes("serializeJsonLd(data)"), "The JSON-LD script sink must use the audited serializer");

assert.equal(safeInternalNavigationPath("/resources/example?q=1#summary"), "/resources/example?q=1#summary");
for (const unsafePath of ["//attacker.example/phish", "https://attacker.example/phish", "/\\attacker.example/phish", "javascript:alert(1)", "data:text/html,<script>alert(1)</script>"]) {
  assert.equal(safeInternalNavigationPath(unsafePath), null, `Unsafe internal navigation path was accepted: ${unsafePath}`);
}

assert.equal(safeExternalHttpUrl("https://jobs.example/role"), "https://jobs.example/role");
assert.equal(safeExternalHttpUrl("http://jobs.example/role"), "http://jobs.example/role");
for (const unsafeUrl of ["javascript:alert(1)", "data:text/html,<script>alert(1)</script>", "file:///etc/passwd", "//attacker.example/phish"]) {
  assert.equal(safeExternalHttpUrl(unsafeUrl), null, `Unsafe external URL was accepted: ${unsafeUrl}`);
}

assert.ok(dashboard.includes("readCompassRecords") && bookmarkStorage.includes("safeInternalNavigationPath"), "Imported bookmark links must be validated before the dashboard renders them");
assert.ok(jobTracker.includes("safeApplications(JSON.parse(stored))"), "Imported job records must be validated before rendering");
assert.ok(jobTracker.includes("safeExternalHttpUrl(item.link)"), "Imported job links must be constrained to HTTP(S)");

const guardedRoutes = [
  "src/app/api/checkout/resume-pro/route.ts",
  "src/app/api/resume-pro-performance/connection/route.ts",
  "src/app/api/resume-pro/access/activate/route.ts",
  "src/app/api/resume-pro/access/release/route.ts",
  "src/app/api/resume-pro/restore-code/route.ts",
  "src/app/api/resume-pro/restore/route.ts",
];

for (const route of guardedRoutes) {
  const source = await projectFile(route);
  assert.ok(source.includes("await validateSameOriginMutation(request"), `${route} must validate mutation requests`);
  assert.ok(source.includes("maxBodyBytes"), `${route} must cap request bodies`);
}

const webhook = await projectFile("src/app/api/stripe/webhook/route.ts");
for (const contract of ["webhooks.constructEvent", "maxWebhookPayloadBytes", "stripe-signature"]) {
  assert.ok(webhook.includes(contract), `Webhook security contract is missing: ${contract}`);
}

console.log("CSP, JSON-LD, safe navigation, security headers, and mutation-request contracts passed.");
