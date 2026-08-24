import { readFile } from "node:fs/promises";

import {
  containsSensitiveProductionPathEvidence,
  createProductionPaymentPathEvidenceTemplate,
  evaluateProductionPaymentPathEvidence,
} from "./production-payment-path-evidence-contract.mjs";

const passLine = "PRODUCTION_PAYMENT_PATH_EVIDENCE=PASS mode=production payments_off=yes webhook=verified outbox=sent nonce=bound release=denied restore=verified identifiers_printed=no secrets_printed=no";
const failPrefix = "PRODUCTION_PAYMENT_PATH_EVIDENCE=FAIL mode=production payments_off=unverified webhook=unverified outbox=unverified nonce=unverified release=unverified restore=unverified identifiers_printed=no secrets_printed=no launch=NO-GO";

function fail(reason, exitCode = 1) {
  console.log(`${failPrefix} reason=${reason}`);
  process.exit(exitCode);
}

if (process.argv.length === 3 && process.argv[2] === "--template") {
  console.log(JSON.stringify(createProductionPaymentPathEvidenceTemplate(), null, 2));
  process.exit(0);
}

if (process.argv.length !== 4 || process.argv[2] !== "--file") fail("usage_error", 2);

let raw;
try {
  raw = await readFile(process.argv[3], "utf8");
} catch {
  fail("file_unavailable", 2);
}

if (containsSensitiveProductionPathEvidence(raw)) fail("sensitive_evidence", 2);

let packet;
try {
  packet = JSON.parse(raw);
} catch {
  fail("invalid_json", 2);
}

const result = evaluateProductionPaymentPathEvidence(packet);
if (!result.passed) fail(result.reason);
console.log(passLine);

