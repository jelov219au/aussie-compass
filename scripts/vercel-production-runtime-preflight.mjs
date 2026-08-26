import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

export const runtimePreflightPath = "/api/operator/payment-runtime-preflight";
export const runtimePreflightPass = "PRODUCTION_RUNTIME_PAYMENT_PREFLIGHT=PASS environment=production source_sha=exact payments=off managed_payments=configured config=verified stripe=read-only-pass open_sessions=zero database=runtime-schema-pass smtp=verify-pass email_sent=no secrets_printed=no";
export const runtimePreflightFail = "PRODUCTION_RUNTIME_PAYMENT_PREFLIGHT=FAIL environment=unverified source_sha=unverified payments=unverified managed_payments=unverified config=unverified stripe=unverified open_sessions=unverified database=unverified smtp=unverified email_sent=no secrets_printed=no launch=NO-GO";

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

export function buildVercelCurlArguments({ deploymentOrigin, expectedSha, expectedEndpointId }) {
  const requestBody = JSON.stringify({ expectedSha, expectedEndpointId });
  return [
    "--yes",
    `--package=${vercelPackage}`,
    "--",
    "node",
    launcherPath,
    "curl",
    runtimePreflightPath,
    "--deployment",
    deploymentOrigin,
    "--no-color",
    "--",
    "--request",
    "POST",
    "--header",
    "Content-Type: application/json",
    "--header",
    "x-hoju-runtime-preflight: read-only-v1",
    "--data-raw",
    requestBody,
    "--silent",
    "--show-error",
    "--fail-with-body",
  ];
}

function defaultRunVercelCurl(input) {
  const executable = process.platform === "win32" ? "npx.cmd" : "npx";
  const result = spawnSync(executable, buildVercelCurlArguments(input), {
    cwd: projectRoot,
    encoding: "utf8",
    env: cleanCliEnvironment(),
    timeout: 60_000,
    windowsHide: true,
  });

  return {
    status: result.status,
    stdout: result.stdout ?? "",
  };
}

export async function verifyVercelProductionRuntimePreflight({
  deploymentOrigin: rawDeploymentOrigin,
  expectedSha,
  expectedEndpointId,
  fetchImpl = fetch,
  runVercelCurl = defaultRunVercelCurl,
}) {
  const deploymentOrigin = parseDeploymentOrigin(rawDeploymentOrigin);
  if (
    !deploymentOrigin
    || !exactShaPattern.test(expectedSha ?? "")
    || !/^ep-[a-z0-9-]+$/.test(expectedEndpointId ?? "")
  ) return false;

  let unauthenticatedResponse;
  try {
    unauthenticatedResponse = await fetchImpl(new URL(runtimePreflightPath, deploymentOrigin), {
      method: "GET",
      headers: {
        Accept: "text/plain",
        "Cache-Control": "no-cache",
        "User-Agent": "hoju-compass-runtime-preflight-protection/1.0",
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
    result = await runVercelCurl({ deploymentOrigin, expectedSha, expectedEndpointId });
  } catch {
    return false;
  }

  if (result?.status !== 0) return false;
  const lines = String(result.stdout ?? "").split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  return lines.length === 1 && lines[0] === runtimePreflightPass;
}

function parseArguments(argumentsList) {
  if (
    argumentsList.length !== 6
    || argumentsList[0] !== "--deployment"
    || argumentsList[2] !== "--expected-sha"
    || argumentsList[4] !== "--expected-endpoint"
  ) return null;

  return {
    deploymentOrigin: argumentsList[1],
    expectedSha: argumentsList[3],
    expectedEndpointId: argumentsList[5],
  };
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  const passed = options
    ? await verifyVercelProductionRuntimePreflight(options)
    : false;
  console.log(passed ? runtimePreflightPass : runtimePreflightFail);
  if (!passed) process.exitCode = 1;
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  await main();
}
