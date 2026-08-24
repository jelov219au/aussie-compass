import assert from "node:assert/strict";

import {
  auditProductionDeploymentEvidence,
  formatProductionDeploymentFail,
  formatProductionDeploymentPass,
  ProductionDeploymentEvidenceError,
} from "./production-deployment-evidence.mjs";

const expectedSha = "a".repeat(40);
const deploymentApiUrl = "https://api.github.com/repos/jelov219au/aussie-compass/deployments?environment=Production&per_page=100";
const statusesUrl = "https://api.github.com/repos/jelov219au/aussie-compass/deployments/123/statuses";
const deploymentOrigin = "https://aussie-compass-production-aussiecompass.vercel.app";
const publicOrigin = "https://hojucompass.com";
const productPath = "/resume-pro";
const restorePath = "/resume-pro/restore?status=invalid";
const deploymentId = "dpl_ExactProductionFixture";
const paymentOffBody = `<html data-dpl-id="${deploymentId}"><span>Pro 작업 공간 출시 준비 중</span><p>현재는 제품 미리보기 단계이며 결제·계정 생성·개인정보 수집이 진행되지 않습니다.</p></html>`;
const restoreBody = `<html data-dpl-id="${deploymentId}"><p id="resume-pro-restore-notice" aria-atomic="true">invalid</p></html>`;

function jsonResponse(value, url) {
  return { ok: true, status: 200, url, json: async () => value };
}

function textResponse(value, url) {
  return { ok: true, status: 200, url, text: async () => value };
}

function deploymentFixture(overrides = {}) {
  return {
    id: 123,
    sha: expectedSha,
    ref: expectedSha,
    task: "deploy",
    original_environment: "Production",
    environment: "Production",
    creator: { login: "vercel[bot]" },
    statuses_url: statusesUrl,
    created_at: "2026-08-24T12:00:00.000Z",
    ...overrides,
  };
}

function statusFixture(overrides = {}) {
  return {
    state: "success",
    environment: "Production",
    creator: { login: "vercel[bot]" },
    environment_url: deploymentOrigin,
    target_url: deploymentOrigin,
    created_at: "2026-08-24T12:01:00.000Z",
    ...overrides,
  };
}

function createFixtureFetch({ deployments = [deploymentFixture()], statuses = [statusFixture()], pages = {} } = {}) {
  const pageBodies = new Map([
    [`${deploymentOrigin}${productPath}`, paymentOffBody],
    [`${deploymentOrigin}${restorePath}`, restoreBody],
    [`${publicOrigin}${productPath}`, paymentOffBody],
    [`${publicOrigin}${restorePath}`, restoreBody],
    ...Object.entries(pages),
  ]);

  return async (input) => {
    const url = input.toString();
    if (url === deploymentApiUrl) return jsonResponse(deployments, url);
    if (url === statusesUrl) return jsonResponse(statuses, url);
    if (pageBodies.has(url)) return textResponse(pageBodies.get(url), url);
    throw new Error("unexpected fixture URL");
  };
}

async function expectFailure(reason, input) {
  await assert.rejects(
    auditProductionDeploymentEvidence(input),
    (error) => error instanceof ProductionDeploymentEvidenceError && error.reason === reason,
  );
}

const result = await auditProductionDeploymentEvidence({ expectedSha, fetchImpl: createFixtureFetch() });
assert.equal(result.expectedSha, expectedSha);
assert.equal(result.deploymentId, deploymentId);
assert.equal(formatProductionDeploymentPass(), "PRODUCTION_DEPLOYMENT_EVIDENCE=PASS source_sha=exact environment=production deployment=success origins=same-dpl-id public_markers=verified payments=off secrets_printed=no");

await expectFailure("invalid_expected_sha", { expectedSha: expectedSha.slice(0, 7), fetchImpl: createFixtureFetch() });
await expectFailure("production_deployment_missing", {
  expectedSha,
  fetchImpl: createFixtureFetch({
    deployments: [deploymentFixture({ original_environment: "Preview", environment: "Preview" })],
  }),
});
await expectFailure("production_source_sha_mismatch", {
  expectedSha,
  fetchImpl: createFixtureFetch({
    deployments: [deploymentFixture({ sha: "b".repeat(40), ref: "b".repeat(40) })],
  }),
});
await expectFailure("production_deployment_not_successful", {
  expectedSha,
  fetchImpl: createFixtureFetch({ statuses: [statusFixture({ state: "success", environment: "Preview" })] }),
});
await expectFailure("deployment_origin_mismatch", {
  expectedSha,
  fetchImpl: createFixtureFetch({
    pages: {
      [`${deploymentOrigin}${productPath}`]: paymentOffBody.replace(deploymentId, "dpl_DifferentExactShaDeployment"),
    },
  }),
});
await expectFailure("deployment_origin_mismatch", {
  expectedSha,
  fetchImpl: createFixtureFetch({
    pages: {
      [`${publicOrigin}${productPath}`]: paymentOffBody.replace(deploymentId, "dpl_DifferentPublicDeployment"),
    },
  }),
});
await expectFailure("restore_marker_mismatch", {
  expectedSha,
  fetchImpl: createFixtureFetch({
    pages: {
      [`${publicOrigin}${restorePath}`]: restoreBody.replace('id="resume-pro-restore-notice"', 'id="missing-marker"'),
    },
  }),
});
await expectFailure("payments_not_proven_off", {
  expectedSha,
  fetchImpl: createFixtureFetch({
    pages: {
      [`${publicOrigin}${productPath}`]: paymentOffBody.replace("</html>", '<div id="resume-pro-checkout"></div></html>'),
    },
  }),
});

const failLine = formatProductionDeploymentFail("production_deployment_missing");
assert.match(failLine, /^PRODUCTION_DEPLOYMENT_EVIDENCE=FAIL .* launch=NO-GO reason=production_deployment_missing$/);
assert.doesNotMatch(failLine, /https?:|token|credential|secret=/i);

console.log("Production deployment evidence fails closed on Preview, SHA, status, alias and public-marker mismatches.");
