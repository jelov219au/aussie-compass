import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const evidence = await readFile(
  new URL("../docs/managed-payments-customer-document-evidence.md", import.meta.url),
  "utf8",
);
const compactEvidence = evidence.replace(/\s+/g, " ");

for (const status of ["PRESENT", "ABSENT", "UNVERIFIED", "NOT_ISSUED"]) {
  assert.ok(evidence.includes(`\`${status}\``), `missing evidence status: ${status}`);
}

const artifacts = ["checkout", "receipt", "invoice"];
const items = ["transaction_seller", "document_issuer", "transaction_support_route"];
const expectedKeys = artifacts.flatMap((artifact) => items.map((item) => `${artifact}.${item}`));
const actualKeys = [...evidence.matchAll(/`(checkout|receipt|invoice)\.(transaction_seller|document_issuer|transaction_support_route)`/g)]
  .map((match) => `${match[1]}.${match[2]}`);
assert.equal(expectedKeys.length, 9, "Checkout, Receipt and Invoice must each have three fixed evidence rows");
assert.deepEqual(actualKeys, expectedKeys, "the blank template must contain the ordered Checkout, Receipt and Invoice item rows");
assert.doesNotMatch(evidence, /`issued_document\./, "the template must not collapse Receipt and Invoice into one evidence group");

for (const contract of [
  "visible wording location",
  "observation time with timezone",
  "customer name, email address or postal/billing address",
  "full Stripe object IDs",
  "receipt URL, invoice URL, hosted-document URL, access token or query string",
  "screenshot, PDF, receipt or invoice file in the repository",
  "Never commit a completed live evidence table",
  "at least one existing receipt or invoice was inspected",
  "all three rows for each positively unissued document type are `NOT_ISSUED`",
  "Never collapse both types into one `Receipt or Invoice` group",
  "an uninspected issued artifact or an unknown artifact set makes the result",
  "CUSTOMER_DOCUMENT_TRUST_GATE=GO|NO-GO",
]) {
  assert.ok(compactEvidence.includes(contract), `customer-document evidence contract is missing: ${contract}`);
}

assert.ok(
  evidence.includes("all three fixed rows for\nevery issued document are `PRESENT`") || evidence.includes("all three fixed rows for every issued document are `PRESENT`"),
  "GO must require every actually issued payment document to pass",
);
assert.ok(evidence.includes("does not authorise any Stripe setting, payment,\nrefund, document or customer-data change"), "the procedure must remain read-only");
assert.ok(evidence.includes("does not decide legal, tax or\naccounting treatment"), "the procedure must not make legal, tax or accounting conclusions");
assert.doesNotMatch(evidence, /\b(?:cs|pi|ch|re|in)_(?:test|live)?_[A-Za-z0-9]{8,}\b/, "the blank runbook must not contain a real-looking Stripe object ID");
assert.doesNotMatch(evidence, /https:\/\/[^\s]*(?:receipt|invoice)[^\s]*/i, "the runbook must not contain a hosted receipt or invoice URL");

console.log("Managed Payments customer-document evidence contract passed.");
