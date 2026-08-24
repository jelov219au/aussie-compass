import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

import {
  auditPreviewProtectionEvidence,
  formatPreviewProtectionFail,
  formatPreviewProtectionPass,
  previewProtectionPaths,
  PreviewProtectionEvidenceError,
  validatePreviewOrigin,
} from "./preview-protection-evidence.mjs";

const origin = "https://aussie-compass-git-candidate-aussiecompass.vercel.app";

function protectedResponse(url, overrides = {}) {
  const location = new URL("https://vercel.com/sso-api");
  location.searchParams.set("url", url);
  location.searchParams.set("nonce", "redacted-fixture-nonce");
  return {
    status: 302,
    url,
    headers: new Headers({
      Location: location.toString(),
      "X-Robots-Tag": "noindex",
    }),
    ...overrides,
  };
}

function createFixtureFetch({ mutateResponse } = {}) {
  const requests = [];
  const fetchImpl = async (input, options) => {
    const url = input.toString();
    requests.push({ url, options });
    const response = protectedResponse(url);
    return mutateResponse ? mutateResponse(response, requests.length - 1) : response;
  };
  return { fetchImpl, requests };
}

async function expectFailure(reason, input) {
  await assert.rejects(
    auditPreviewProtectionEvidence(input),
    (error) => error instanceof PreviewProtectionEvidenceError && error.reason === reason,
  );
}

const fixture = createFixtureFetch();
const result = await auditPreviewProtectionEvidence({ origin, fetchImpl: fixture.fetchImpl });
assert.equal(result.routesChecked, previewProtectionPaths.length);
assert.deepEqual(
  fixture.requests.map(({ url }) => new URL(url).pathname),
  previewProtectionPaths,
  "the runner must inspect only the fixed Stage 1 GET paths",
);
for (const { options } of fixture.requests) {
  assert.equal(options.method, "GET");
  assert.equal(options.redirect, "manual");
  assert.equal(options.credentials, "omit");
  assert.equal(options.body, undefined);
  assert.equal(Object.hasOwn(options.headers, "Cookie"), false);
}

assert.equal(validatePreviewOrigin(origin), origin);
for (const invalidOrigin of [
  "http://candidate.vercel.app",
  "https://vercel.app",
  "https://hojucompass.com",
  "https://candidate.vercel.app.evil.example",
  "https://user:password@candidate.vercel.app",
  "https://candidate.vercel.app:8443",
  "https://candidate.vercel.app/resume-pro",
  "https://candidate.vercel.app/?token=secret",
]) {
  assert.throws(
    () => validatePreviewOrigin(invalidOrigin),
    (error) => error instanceof PreviewProtectionEvidenceError && error.reason === "invalid_origin",
  );
}

await expectFailure("deployment_protection_missing", {
  origin,
  fetchImpl: createFixtureFetch({
    mutateResponse: (response) => ({ ...response, status: 200 }),
  }).fetchImpl,
});
await expectFailure("invalid_sso_redirect", {
  origin,
  fetchImpl: createFixtureFetch({
    mutateResponse: (response) => ({
      ...response,
      headers: new Headers({
        Location: "https://attacker.example/sso-api",
        "X-Robots-Tag": "noindex",
      }),
    }),
  }).fetchImpl,
});
await expectFailure("invalid_sso_redirect", {
  origin,
  fetchImpl: createFixtureFetch({
    mutateResponse: (response) => ({
      ...response,
      headers: new Headers({
        Location: "https://vercel.com/sso-api?url=https%3A%2F%2Fother.vercel.app%2F",
        "X-Robots-Tag": "noindex",
      }),
    }),
  }).fetchImpl,
});
await expectFailure("edge_noindex_missing", {
  origin,
  fetchImpl: createFixtureFetch({
    mutateResponse: (response) => ({
      ...response,
      headers: new Headers({ Location: response.headers.get("location") }),
    }),
  }).fetchImpl,
});
await expectFailure("preview_unavailable", {
  origin,
  fetchImpl: async () => { throw new Error("fixture network failure"); },
});

assert.equal(
  formatPreviewProtectionPass(),
  `PREVIEW_PROTECTION_EVIDENCE=PASS routes=${previewProtectionPaths.length} method=get redirects=blocked sso=vercel noindex=verified credentials=none cookies=none secrets_printed=no`,
);
const failLine = formatPreviewProtectionFail("deployment_protection_missing");
assert.match(failLine, /^PREVIEW_PROTECTION_EVIDENCE=FAIL .* launch=NO-GO reason=deployment_protection_missing$/);
assert.doesNotMatch(failLine, /https?:|nonce|token|cookie=|credential=|secret=/i);

const source = await readFile(new URL("./preview-protection-evidence.mjs", import.meta.url), "utf8");
assert.doesNotMatch(source, /process\.env|node:fs|writeFile|createWriteStream|appendFile/);
assert.doesNotMatch(source, /method:\s*["']POST["']|redirect:\s*["']follow["']|credentials:\s*["']include["']/);

const packageJson = JSON.parse(await readFile(new URL("../package.json", import.meta.url), "utf8"));
assert.match(
  packageJson.scripts["test:production-deployment-evidence"],
  /npm run test:preview-protection-evidence/,
  "the deployment evidence aggregate must include this contract",
);
assert.match(
  packageJson.scripts["quality:gate"],
  /npm run test:production-deployment-evidence/,
  "the quality gate must run the deployment evidence aggregate",
);

const invalidCli = spawnSync(process.execPath, [
  fileURLToPath(new URL("./verify-preview-protection-evidence.mjs", import.meta.url)),
  "--origin",
  "https://hojucompass.com",
], { encoding: "utf8" });
assert.equal(invalidCli.status, 1);
assert.match(invalidCli.stdout.trim(), /^PREVIEW_PROTECTION_EVIDENCE=FAIL .* reason=invalid_origin$/);
assert.equal(invalidCli.stderr, "");

console.log("Preview protection evidence is fixed-path GET-only, redirect-blocked, credential-free and fail-closed.");
