import {
  auditProductionDeploymentEvidence,
  formatProductionDeploymentFail,
  formatProductionDeploymentPass,
  ProductionDeploymentEvidenceError,
} from "./production-deployment-evidence.mjs";

function readExpectedSha(argumentsList) {
  if (argumentsList.length !== 2 || argumentsList[0] !== "--expected-sha") return null;
  return argumentsList[1];
}

try {
  const result = await auditProductionDeploymentEvidence({
    expectedSha: readExpectedSha(process.argv.slice(2)),
    bypassSecret: process.env.VERCEL_AUTOMATION_BYPASS_SECRET?.trim() || null,
  });
  console.log(formatProductionDeploymentPass());
  console.log(`PRODUCTION_DEPLOYMENT_URL=${result.deploymentUrl}`);
  console.log(`PRODUCTION_PUBLIC_URL=${result.publicUrl}`);
} catch (error) {
  const reason = error instanceof ProductionDeploymentEvidenceError ? error.reason : "unexpected_error";
  console.log(formatProductionDeploymentFail(reason));
  process.exitCode = 1;
}
