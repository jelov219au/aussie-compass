import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const projectFile = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");
const [nextConfig, requestSecurity] = await Promise.all([
  projectFile("next.config.ts"),
  projectFile("src/lib/requestSecurity.ts"),
]);

for (const directive of [
  "Content-Security-Policy",
  "default-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "Strict-Transport-Security",
  "X-Content-Type-Options",
  "Referrer-Policy",
  "Permissions-Policy",
]) {
  assert.ok(nextConfig.includes(directive), `Security-header contract is missing: ${directive}`);
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

console.log("Security headers and mutation-request contracts passed.");
