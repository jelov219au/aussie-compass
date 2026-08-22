import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

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

const [requestSecurity, cspDecision] = await Promise.all([
  projectFile("src/lib/requestSecurity.ts"),
  projectFile("docs/csp-hardening.md"),
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

const serviceWorkerCsp = parseCsp(headerValue(productionHeaderRules, "/sw.js", "Content-Security-Policy"));
assert.deepEqual(serviceWorkerCsp.get("script-src"), ["'self'"], "the service worker must not inherit the framework inline-script exception");

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

const guardedRoutes = [
  "src/app/api/checkout/resume-pro/route.ts",
  "src/app/api/push/reminders/route.ts",
  "src/app/api/push/subscriptions/route.ts",
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

console.log("CSP source budgets, security headers, and mutation-request contracts passed.");
