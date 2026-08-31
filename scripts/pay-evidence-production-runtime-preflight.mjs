import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

export const payEvidenceRuntimePreflightPath = "/api/operator/pay-evidence-runtime-preflight";
export const payEvidenceRuntimePreflightPass = "PAY_EVIDENCE_PRODUCTION_RUNTIME_PREFLIGHT=PASS environment=production source_sha=exact shared_payments=on pay_evidence=off managed_payments=configured config=verified stripe=read-only-pass open_pay_evidence_sessions=zero database=runtime-schema-pass operator_monitoring=smtp smtp=verify-pass email_sent=no secrets_printed=no";
export const payEvidenceRuntimePreflightMonitoredPass = "PAY_EVIDENCE_PRODUCTION_RUNTIME_PREFLIGHT=PASS environment=production source_sha=exact shared_payments=on pay_evidence=off managed_payments=configured config=verified stripe=read-only-pass open_pay_evidence_sessions=zero database=runtime-schema-pass operator_monitoring=manual-first-sale smtp=not-run email_sent=no secrets_printed=no";
export const payEvidenceRuntimePreflightFail = "PAY_EVIDENCE_PRODUCTION_RUNTIME_PREFLIGHT=FAIL environment=unverified source_sha=unverified shared_payments=unverified pay_evidence=unverified managed_payments=unverified config=unverified stripe=unverified open_pay_evidence_sessions=unverified database=unverified smtp=unverified email_sent=no secrets_printed=no launch=NO-GO";

const exactShaPattern = /^[a-f0-9]{40}$/;
const scriptsDirectory = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(scriptsDirectory, "..");
const launcherPath = resolve(scriptsDirectory, "invoke-vercel-cli-with-ascii-hostname.mjs");
const environmentExamplePath = resolve(projectRoot, ".env.example");
const vercelPackage = "vercel@59.5.0";

function parseDeploymentOrigin(value) {
  let url;
  try {
    url = new URL(value);
  } catch {
    return null;
  }
  if (
    url.protocol !== "https:"
    || !url.hostname.endsWith(".vercel.app")
    || url.hostname === "vercel.app"
    || url.username
    || url.password
    || url.port
    || url.pathname !== "/"
    || url.search
    || url.hash
  ) return null;
  return url.origin;
}

function protectedResponse(response) {
  const noindex = response?.headers?.get?.("x-robots-tag")?.toLowerCase() ?? "";
  return [302, 401, 403].includes(response?.status) && noindex.includes("noindex");
}

function cleanCliEnvironment() {
  const childEnvironment = { ...process.env };
  const environmentExample = readFileSync(environmentExamplePath, "utf8");
  const projectVariableNames = [...environmentExample.matchAll(/^\s*([A-Z][A-Z0-9_]*)\s*=/gm)]
    .map((match) => match[1]);
  for (const variableName of [
    ...projectVariableNames,
    "ENTITLEMENT_DB_DATABASE_URL",
    "VERCEL_AUTOMATION_BYPASS_SECRET",
    "VERCEL_TOKEN",
    "NODE_OPTIONS",
  ]) delete childEnvironment[variableName];
  return childEnvironment;
}

export function buildPayEvidenceRuntimePreflightRequestBody(input) {
  return JSON.stringify({
    expectedSha: input.expectedSha,
    expectedEndpointId: input.expectedEndpointId,
    challenge: input.challenge,
    auditKeyHmac: input.auditKeyHmac,
    accountingKeyHmac: input.accountingKeyHmac,
  });
}

export function buildPayEvidenceVercelCurlArguments({ deploymentOrigin }) {
  return [
    "--yes",
    `--package=${vercelPackage}`,
    "--",
    "node",
    launcherPath,
    "curl",
    payEvidenceRuntimePreflightPath,
    "--deployment",
    deploymentOrigin,
    "--",
    "--request",
    "POST",
    "--header",
    "Content-Type: application/json",
    "--header",
    "x-hoju-pay-evidence-runtime-preflight: pay-evidence-read-only-v1",
    "--data-binary",
    "@-",
    "--silent",
    "--show-error",
    "--fail-with-body",
  ];
}

function defaultRunVercelCurl(input) {
  const executable = process.platform === "win32" ? process.execPath : "npx";
  const npxArguments = process.platform === "win32"
    ? [resolve(dirname(process.execPath), "node_modules", "npm", "bin", "npx-cli.js")]
    : [];
  const result = spawnSync(executable, [...npxArguments, ...buildPayEvidenceVercelCurlArguments(input)], {
    cwd: projectRoot,
    encoding: "utf8",
    env: cleanCliEnvironment(),
    input: buildPayEvidenceRuntimePreflightRequestBody(input),
    timeout: 60_000,
    windowsHide: true,
  });
  return { status: result.status, stdout: result.stdout ?? "" };
}

export async function verifyPayEvidenceProductionRuntimePreflight({
  deploymentOrigin: rawDeploymentOrigin,
  expectedSha,
  expectedEndpointId,
  challenge,
  auditKeyHmac,
  accountingKeyHmac,
  fetchImpl = fetch,
  runVercelCurl = defaultRunVercelCurl,
  onAcceptedPass,
}) {
  const deploymentOrigin = parseDeploymentOrigin(rawDeploymentOrigin);
  if (
    !deploymentOrigin
    || !exactShaPattern.test(expectedSha ?? "")
    || !/^ep-[a-z0-9-]+$/.test(expectedEndpointId ?? "")
    || !/^[a-f0-9]{64}$/.test(challenge ?? "")
    || !/^[a-f0-9]{64}$/.test(auditKeyHmac ?? "")
    || !/^[a-f0-9]{64}$/.test(accountingKeyHmac ?? "")
  ) return false;

  let unauthenticatedResponse;
  try {
    unauthenticatedResponse = await fetchImpl(new URL(payEvidenceRuntimePreflightPath, deploymentOrigin), {
      method: "GET",
      headers: {
        Accept: "text/plain",
        "Cache-Control": "no-cache",
        "User-Agent": "hoju-compass-pay-evidence-runtime-preflight-protection/1.0",
      },
      redirect: "manual",
      signal: AbortSignal.timeout(10_000),
    });
  } catch {
    return false;
  }
  if (!protectedResponse(unauthenticatedResponse)) return false;

  let result;
  try {
    result = await runVercelCurl({ deploymentOrigin, expectedSha, expectedEndpointId, challenge, auditKeyHmac, accountingKeyHmac });
  } catch {
    return false;
  }
  if (result?.status !== 0) return false;
  const lines = String(result.stdout ?? "").split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const accepted = lines.length === 1
    && (lines[0] === payEvidenceRuntimePreflightPass || lines[0] === payEvidenceRuntimePreflightMonitoredPass);
  if (accepted) onAcceptedPass?.(lines[0]);
  return accepted;
}

function parseArguments(argumentsList) {
  if (
    argumentsList.length !== 12
    || argumentsList[0] !== "--deployment"
    || argumentsList[2] !== "--expected-sha"
    || argumentsList[4] !== "--expected-endpoint"
    || argumentsList[6] !== "--challenge"
    || argumentsList[8] !== "--audit-key-hmac"
    || argumentsList[10] !== "--accounting-key-hmac"
  ) return null;
  return {
    deploymentOrigin: argumentsList[1],
    expectedSha: argumentsList[3],
    expectedEndpointId: argumentsList[5],
    challenge: argumentsList[7],
    auditKeyHmac: argumentsList[9],
    accountingKeyHmac: argumentsList[11],
  };
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  let acceptedPass = payEvidenceRuntimePreflightPass;
  const passed = options
    ? await verifyPayEvidenceProductionRuntimePreflight({
      ...options,
      onAcceptedPass: (line) => { acceptedPass = line; },
    })
    : false;
  console.log(passed ? acceptedPass : payEvidenceRuntimePreflightFail);
  if (!passed) process.exitCode = 1;
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  await main();
}
