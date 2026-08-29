import {
  auditProductionDeploymentEvidence,
  formatProductionDeploymentFail,
  formatProductionDeploymentPass,
  ProductionDeploymentEvidenceError,
} from "./production-deployment-evidence.mjs";
import { spawnSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptsDirectory = dirname(fileURLToPath(import.meta.url));
const launcherPath = resolve(scriptsDirectory, "invoke-vercel-cli-with-ascii-hostname.mjs");
const projectRoot = resolve(scriptsDirectory, "..");
const deploymentIdPattern = /^dpl_[A-Za-z0-9]+$/;
// A cold authenticated Vercel CLI read has exceeded 60 seconds on this Windows
// operator host. Keep a finite per-page ceiling while allowing that observed path.
const protectedReadTimeoutMs = 120_000;
const protectedReadMaxBuffer = 8 * 1024 * 1024;

function readProtectedPageWithVercelCurl(deploymentOrigin, path) {
  const executable = process.platform === "win32" ? process.execPath : "npx";
  const npxArguments = process.platform === "win32"
    ? [resolve(dirname(process.execPath), "node_modules", "npm", "bin", "npx-cli.js")]
    : [];
  const childEnvironment = { ...process.env };
  delete childEnvironment.VERCEL_AUTOMATION_BYPASS_SECRET;
  delete childEnvironment.VERCEL_TOKEN;
  delete childEnvironment.NODE_OPTIONS;
  const result = spawnSync(executable, [
    ...npxArguments,
    "--yes",
    "--package=vercel@59.5.0",
    "--",
    "node",
    launcherPath,
    "curl",
    path,
    "--deployment",
    deploymentOrigin,
    "--",
    "--silent",
    "--show-error",
    "--fail-with-body",
  ], {
    cwd: projectRoot,
    encoding: "utf8",
    env: childEnvironment,
    timeout: protectedReadTimeoutMs,
    maxBuffer: protectedReadMaxBuffer,
    windowsHide: true,
  });
  if (result.status !== 0) throw new Error("protected deployment unavailable");
  const body = result.stdout ?? "";
  const match = body.match(/<html\b[^>]*\bdata-dpl-id="([^"]+)"/i);
  if (!match || !deploymentIdPattern.test(match[1])) throw new Error("deployment marker unavailable");
  return { body, deploymentId: match[1] };
}

function readExpectedSha(argumentsList) {
  if (argumentsList.length !== 2 || argumentsList[0] !== "--expected-sha") return null;
  return argumentsList[1];
}

try {
  const result = await auditProductionDeploymentEvidence({
    expectedSha: readExpectedSha(process.argv.slice(2)),
    bypassSecret: process.env.VERCEL_AUTOMATION_BYPASS_SECRET?.trim() || null,
    readProtectedPage: process.env.VERCEL_AUTOMATION_BYPASS_SECRET
      ? null
      : readProtectedPageWithVercelCurl,
  });
  console.log(formatProductionDeploymentPass());
  console.log(`PRODUCTION_DEPLOYMENT_URL=${result.deploymentUrl}`);
  console.log(`PRODUCTION_PUBLIC_URL=${result.publicUrl}`);
} catch (error) {
  const reason = error instanceof ProductionDeploymentEvidenceError ? error.reason : "unexpected_error";
  console.log(formatProductionDeploymentFail(reason));
  process.exitCode = 1;
}
