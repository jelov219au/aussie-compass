const repository = "jelov219au/aussie-compass";
const githubApiOrigin = "https://api.github.com";
const productionOrigin = "https://hojucompass.com";
const exactShaPattern = /^[0-9a-f]{40}$/;
const deploymentIdPattern = /^dpl_[A-Za-z0-9]+$/;
const productPath = "/resume-pro";
const restorePath = "/resume-pro/restore?status=invalid";

const canonicalPass = "PRODUCTION_DEPLOYMENT_EVIDENCE=PASS source_sha=exact environment=production deployment=success origins=same-dpl-id public_markers=verified payments=off secrets_printed=no";
const canonicalFail = "PRODUCTION_DEPLOYMENT_EVIDENCE=FAIL source_sha=unverified environment=unverified deployment=unverified origins=unverified public_markers=unverified payments=unverified secrets_printed=no launch=NO-GO";

export class ProductionDeploymentEvidenceError extends Error {
  constructor(reason) {
    super(reason);
    this.name = "ProductionDeploymentEvidenceError";
    this.reason = reason;
  }
}

function fail(reason) {
  throw new ProductionDeploymentEvidenceError(reason);
}

function isObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function parseDate(value) {
  const timestamp = typeof value === "string" ? Date.parse(value) : Number.NaN;
  return Number.isFinite(timestamp) ? timestamp : 0;
}

function assertGithubStatusesUrl(value) {
  let url;
  try {
    url = new URL(value);
  } catch {
    fail("invalid_statuses_url");
  }

  if (
    url.origin !== githubApiOrigin
    || !url.pathname.match(/^\/repos\/jelov219au\/aussie-compass\/deployments\/\d+\/statuses$/)
    || url.username
    || url.password
  ) fail("invalid_statuses_url");

  return url.toString();
}

function assertDeploymentOrigin(value) {
  let url;
  try {
    url = new URL(value);
  } catch {
    fail("invalid_deployment_url");
  }

  if (
    url.protocol !== "https:"
    || !url.hostname.endsWith(".vercel.app")
    || url.username
    || url.password
    || url.port
  ) fail("invalid_deployment_url");

  return url.origin;
}

function extractDeploymentId(body) {
  const match = typeof body === "string"
    ? body.match(/<html\b[^>]*\bdata-dpl-id="([^"]+)"/i)
    : null;
  return match && deploymentIdPattern.test(match[1]) ? match[1] : null;
}

async function readJson(fetchImpl, url, reason) {
  let response;
  try {
    response = await fetchImpl(url, {
      headers: {
        Accept: "application/vnd.github+json",
        "User-Agent": "hoju-compass-production-evidence/1.0",
        "X-GitHub-Api-Version": "2022-11-28",
      },
      redirect: "error",
      signal: AbortSignal.timeout(10_000),
    });
  } catch {
    fail(reason);
  }

  if (!response?.ok) fail(reason);
  try {
    return await response.json();
  } catch {
    fail(reason);
  }
}

async function readPage(fetchImpl, origin, path, reason) {
  const requestedUrl = new URL(path, origin);
  let response;
  try {
    response = await fetchImpl(requestedUrl, {
      headers: {
        Accept: "text/html",
        "Cache-Control": "no-cache",
        "User-Agent": "hoju-compass-production-evidence/1.0",
      },
      redirect: "follow",
      signal: AbortSignal.timeout(10_000),
    });
  } catch {
    fail(reason);
  }

  if (!response?.ok || response.status !== 200) fail(reason);

  let finalUrl;
  try {
    finalUrl = new URL(response.url);
  } catch {
    fail(reason);
  }
  if (finalUrl.origin !== requestedUrl.origin || finalUrl.pathname !== requestedUrl.pathname) fail(reason);

  let body;
  try {
    body = await response.text();
  } catch {
    fail(reason);
  }

  const deploymentId = extractDeploymentId(body);
  if (!deploymentId) fail("missing_public_deployment_id");
  return { body, deploymentId };
}

function assertRestoreMarkers(body) {
  if (!body.includes('id="resume-pro-restore-notice"') || !body.includes('aria-atomic="true"')) {
    fail("restore_marker_mismatch");
  }
}

function assertPaymentsOff(body) {
  if (
    !body.includes("Pro 작업 공간 출시 준비 중")
    || !body.includes("현재는 제품 미리보기 단계이며 결제·계정 생성·개인정보 수집이 진행되지 않습니다.")
    || body.includes('id="resume-pro-checkout"')
  ) fail("payments_not_proven_off");
}

export function validateExpectedProductionSha(value) {
  if (!exactShaPattern.test(value ?? "")) fail("invalid_expected_sha");
  return value;
}

export async function auditProductionDeploymentEvidence({ expectedSha, fetchImpl = fetch }) {
  validateExpectedProductionSha(expectedSha);

  const deploymentsUrl = new URL(`/repos/${repository}/deployments`, githubApiOrigin);
  deploymentsUrl.searchParams.set("environment", "Production");
  deploymentsUrl.searchParams.set("per_page", "100");
  const deployments = await readJson(fetchImpl, deploymentsUrl, "deployments_unavailable");
  if (!Array.isArray(deployments)) fail("invalid_deployments_response");

  const candidates = deployments
    .filter((deployment) => isObject(deployment)
      && deployment.task === "deploy"
      && deployment.environment === "Production"
      && deployment.original_environment === "Production"
      && deployment.creator?.login === "vercel[bot]")
    .sort((left, right) => parseDate(right.created_at) - parseDate(left.created_at));

  if (candidates.length === 0) fail("production_deployment_missing");
  const deployment = candidates[0];
  if (deployment.sha !== expectedSha || deployment.ref !== expectedSha) fail("production_source_sha_mismatch");
  const statusesUrl = assertGithubStatusesUrl(deployment.statuses_url);
  const statuses = await readJson(fetchImpl, statusesUrl, "deployment_status_unavailable");
  if (!Array.isArray(statuses) || statuses.length === 0) fail("deployment_status_missing");

  const status = [...statuses].sort((left, right) => parseDate(right.created_at) - parseDate(left.created_at))[0];
  if (
    !isObject(status)
    || status.state !== "success"
    || status.environment !== "Production"
    || status.creator?.login !== "vercel[bot]"
    || status.environment_url !== status.target_url
  ) fail("production_deployment_not_successful");

  const deploymentOrigin = assertDeploymentOrigin(status.environment_url);
  const [deploymentProduct, deploymentRestore, publicProduct, publicRestore] = await Promise.all([
    readPage(fetchImpl, deploymentOrigin, productPath, "deployment_product_unavailable"),
    readPage(fetchImpl, deploymentOrigin, restorePath, "deployment_restore_unavailable"),
    readPage(fetchImpl, productionOrigin, productPath, "public_product_unavailable"),
    readPage(fetchImpl, productionOrigin, restorePath, "public_restore_unavailable"),
  ]);

  const deploymentIds = new Set([
    deploymentProduct.deploymentId,
    deploymentRestore.deploymentId,
    publicProduct.deploymentId,
    publicRestore.deploymentId,
  ]);
  if (deploymentIds.size !== 1) fail("deployment_origin_mismatch");

  assertPaymentsOff(deploymentProduct.body);
  assertPaymentsOff(publicProduct.body);
  assertRestoreMarkers(deploymentRestore.body);
  assertRestoreMarkers(publicRestore.body);

  return {
    expectedSha,
    githubDeploymentId: deployment.id,
    deploymentId: deploymentProduct.deploymentId,
    deploymentUrl: deploymentOrigin,
    publicUrl: productionOrigin,
  };
}

export function formatProductionDeploymentPass() {
  return canonicalPass;
}

export function formatProductionDeploymentFail(reason) {
  const safeReason = /^[a-z0-9_]+$/.test(reason ?? "") ? reason : "unexpected_error";
  return `${canonicalFail} reason=${safeReason}`;
}
