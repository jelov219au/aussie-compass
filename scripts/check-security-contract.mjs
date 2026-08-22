import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { serializeJsonLd } from "../src/lib/jsonLd.ts";
import { safeExternalHttpUrl, safeInternalNavigationPath } from "../src/lib/safeNavigation.ts";

const projectFile = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");
const originalNodeEnv = process.env.NODE_ENV;

async function loadHeaderRules(nodeEnv, cacheKey) {
  process.env.NODE_ENV = nodeEnv;
  const configUrl = new URL(`../next.config.ts?security-contract=${cacheKey}`, import.meta.url);
  const config = (await import(configUrl.href)).default;
  return config.headers();
}

const productionHeaderRules = await loadHeaderRules("production", "production");
const developmentHeaderRules = await loadHeaderRules("development", "development");
if (originalNodeEnv === undefined) delete process.env.NODE_ENV;
else process.env.NODE_ENV = originalNodeEnv;

const [requestSecurity, cspDecision, jsonLdComponent, dashboard, jobTracker] = await Promise.all([
  projectFile("src/lib/requestSecurity.ts"),
  projectFile("docs/csp-hardening.md"),
  projectFile("src/components/seo/JsonLd.tsx"),
  projectFile("src/components/dashboard/MyCompassDashboard.tsx"),
  projectFile("src/components/tools/JobApplicationTracker.tsx"),
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

assert.deepEqual(productionCsp.get("script-src"), ["'self'"], "production script-src must not allow inline scripts, eval, wildcards, data, or remote schemes");
assert.deepEqual(developmentCsp.get("script-src"), ["'self'", "'unsafe-eval'"], "unsafe-eval must be limited to the documented development requirement");
assert.deepEqual(productionCsp.get("script-src-elem"), ["'self'", "'unsafe-inline'"], "the audited Next.js inline bootstrap exception must stay isolated to script elements");
assert.deepEqual(productionCsp.get("script-src-attr"), ["'none'"], "inline event-handler attributes must remain blocked");

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

assert.ok(dashboard.includes("safeInternalNavigationPath(bookmark.href)"), "Imported bookmark links must be constrained to local paths");
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
