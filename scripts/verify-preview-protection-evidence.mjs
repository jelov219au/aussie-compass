import {
  auditPreviewProtectionEvidence,
  formatPreviewProtectionFail,
  formatPreviewProtectionPass,
  PreviewProtectionEvidenceError,
} from "./preview-protection-evidence.mjs";

function readOrigin(argumentsList) {
  if (argumentsList.length !== 2 || argumentsList[0] !== "--origin") return null;
  return argumentsList[1];
}

try {
  await auditPreviewProtectionEvidence({ origin: readOrigin(process.argv.slice(2)) });
  console.log(formatPreviewProtectionPass());
} catch (error) {
  const reason = error instanceof PreviewProtectionEvidenceError
    ? error.reason
    : "unexpected_error";
  console.log(formatPreviewProtectionFail(reason));
  process.exitCode = 1;
}
