import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
  containsSensitiveCustomerDocumentEvidence,
  createCustomerDocumentEvidenceTemplate,
  customerDocumentItems,
  customerDocumentRowKeys,
  evaluateCustomerDocumentEvidence,
} from "./managed-payments-customer-document-evidence-contract.mjs";

const evidence = await readFile(
  new URL("../docs/managed-payments-customer-document-evidence.md", import.meta.url),
  "utf8",
);
const firstPaymentPacket = await readFile(
  new URL("../docs/first-payment-24-hour-operations-packet.md", import.meta.url),
  "utf8",
);
const liveChecklist = await readFile(
  new URL("../docs/live-payment-launch-checklist.md", import.meta.url),
  "utf8",
);
const taxAgentHandoff = await readFile(
  new URL("../docs/registered-tax-agent-first-sale-handoff.md", import.meta.url),
  "utf8",
);
const verifier = await readFile(
  new URL("./verify-managed-payments-customer-document-evidence.mjs", import.meta.url),
  "utf8",
);
const packageSource = await readFile(new URL("../package.json", import.meta.url), "utf8");
const [purchaseInformation, terms, paymentHelp, paymentSupportHelper, paymentReadiness] = await Promise.all([
  readFile(new URL("../src/app/purchase-information/page.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/app/terms/page.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/app/payment-help/page.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/components/tools/PaymentSupportHelper.tsx", import.meta.url), "utf8"),
  readFile(new URL("../docs/payment-readiness.md", import.meta.url), "utf8"),
]);
const compactEvidence = evidence.replace(/\s+/g, " ");
const compactFirstPaymentPacket = firstPaymentPacket.replace(/\s+/g, " ");

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
  "`NOT_ISSUED` is allowed only for all three rows",
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

for (const boundary of [
  "고정 9행 private 관찰",
  "CUSTOMER_DOCUMENT_TRUST_GATE=GO",
  "한 그룹 안의 혼합 상태",
  "발행됐지만 미열람",
  "문서 gate는 `NO-GO`이고 24시간 인계는 `HOLD`",
  "Managed Payments 거래 지원 경로 또는 환불 처리 권한을 추정해서는 안 된다",
  "credit/tax 문서 연결과 판매자·발행자·세금 귀속은 `UNRESOLVED`",
  "금액·시각·다른 artifact의 문구로 장부 분류를 추정하지 않는다",
]) assert.ok(compactFirstPaymentPacket.includes(boundary), `the first-payment packet bypasses the nine-row document gate: ${boundary}`);
assert.ok(
  liveChecklist.includes("docs/managed-payments-customer-document-evidence.md")
    && liveChecklist.includes("every receipt/invoice actually issued"),
  "the live checklist must require the nine-row runbook for every issued customer document",
);
assert.ok(
  taxAgentHandoff.includes("private `CUSTOMER_DOCUMENT_TRUST_GATE=GO` observation reference")
    && taxAgentHandoff.includes("partial or `NO-GO` document observation is `UNRESOLVED`"),
  "the tax-agent handoff must not infer Managed Payments parties from partial customer-document evidence",
);

for (const publicSurface of [purchaseInformation, terms, paymentHelp]) {
  for (const conservativeBoundary of [
    "실제 발급 문서에 명확히 표시된 경우에만",
    "명확하지 않으면 추정하지 말고 Hoju Compass 제품 지원으로 문의하세요",
  ]) {
    assert.ok(
      publicSurface.includes(conservativeBoundary),
      `public payment guidance must fail closed when a Managed Payments party is unclear: ${conservativeBoundary}`,
    );
  }
}
for (const readinessBoundary of [
  "Treat a role as verified only when it and a populated business value are clearly customer-visible in that artifact",
  "Otherwise record `UNVERIFIED`, do not infer the role from `BUSINESS_*` or another artifact",
]) {
  assert.ok(
    paymentReadiness.includes(readinessBoundary),
    `payment readiness must preserve the same fail-closed customer-document boundary: ${readinessBoundary}`,
  );
}
for (const minimumSupportBoundary of [
  "제품명, 대략적인 결제 시각과 시간대",
  "영수증·인보이스 또는 결제 참조의 마지막 8자만",
  "영수증·인보이스 원문이나 링크, 전체 Stripe ID",
  "카드번호 전체·일부 또는 보안번호는 보내지 마세요",
]) {
  assert.ok(
    purchaseInformation.includes(minimumSupportBoundary),
    `purchase information must keep the support handoff privacy-minimal: ${minimumSupportBoundary}`,
  );
}
assert.ok(
  paymentSupportHelper.includes("[있다면 각 참조의 마지막 8자만 입력]")
    && paymentSupportHelper.includes("영수증 전체")
    && paymentSupportHelper.includes("판매자가 명확하지 않으면 그 점 기록"),
  "the support helper must preserve the same suffix-only customer handoff boundary",
);
assert.ok(
  compactFirstPaymentPacket.includes("영수증·인보이스 또는 결제 참조의 마지막 8자")
    && compactFirstPaymentPacket.includes("전체 Stripe ID")
    && compactFirstPaymentPacket.includes("영수증 원문"),
  "the operating packet must preserve suffix-only support records and keep full documents in their source system",
);
assert.ok(
  !purchaseInformation.includes("Stripe 영수증 정보를 보내 주세요"),
  "public guidance must not invite an unbounded receipt, URL or full Stripe identifier into support",
);

function passingPacket({ receipt = "PRESENT", invoice = "NOT_ISSUED" } = {}) {
  const packet = createCustomerDocumentEvidenceTemplate();
  packet.observed_at = "2026-08-25T00:30:00.000Z";
  packet.issued_document_set_verified = "PASS";
  for (const item of customerDocumentItems) packet.rows[`checkout.${item}`] = "PRESENT";
  for (const item of customerDocumentItems) packet.rows[`receipt.${item}`] = receipt;
  for (const item of customerDocumentItems) packet.rows[`invoice.${item}`] = invoice;
  return packet;
}

assert.equal(createCustomerDocumentEvidenceTemplate().schema_version, 1);
assert.deepEqual(Object.keys(createCustomerDocumentEvidenceTemplate().rows), customerDocumentRowKeys);
assert.equal(evaluateCustomerDocumentEvidence(createCustomerDocumentEvidenceTemplate()).decision, "NO-GO");
assert.equal(evaluateCustomerDocumentEvidence(passingPacket()).decision, "GO");
assert.equal(
  evaluateCustomerDocumentEvidence(passingPacket({ receipt: "NOT_ISSUED", invoice: "PRESENT" })).decision,
  "GO",
);

const unknownIssuedSet = passingPacket();
unknownIssuedSet.issued_document_set_verified = "MISSING";
assert.equal(evaluateCustomerDocumentEvidence(unknownIssuedSet).decision, "NO-GO");

const noIssuedDocumentInspected = passingPacket({ receipt: "NOT_ISSUED", invoice: "NOT_ISSUED" });
assert.equal(evaluateCustomerDocumentEvidence(noIssuedDocumentInspected).decision, "NO-GO");

const mixedUnissuedGroup = passingPacket({ receipt: "NOT_ISSUED", invoice: "PRESENT" });
mixedUnissuedGroup.rows["receipt.document_issuer"] = "UNVERIFIED";
assert.equal(evaluateCustomerDocumentEvidence(mixedUnissuedGroup).decision, "NO-GO");

const issuedDocumentMissingField = passingPacket();
issuedDocumentMissingField.rows["receipt.transaction_support_route"] = "ABSENT";
assert.equal(evaluateCustomerDocumentEvidence(issuedDocumentMissingField).decision, "NO-GO");

const missingObservationTime = passingPacket();
missingObservationTime.observed_at = null;
assert.equal(evaluateCustomerDocumentEvidence(missingObservationTime).decision, "NO-GO");

const nonCanonicalObservationTime = passingPacket();
nonCanonicalObservationTime.observed_at = "2026-08-25T10:30:00+10:00";
assert.ok(evaluateCustomerDocumentEvidence(nonCanonicalObservationTime).errors.includes("observed_at"));

const checkoutNotIssued = passingPacket();
checkoutNotIssued.rows["checkout.transaction_seller"] = "NOT_ISSUED";
assert.ok(evaluateCustomerDocumentEvidence(checkoutNotIssued).errors.includes("checkout_not_issued"));

const extraField = passingPacket();
extraField.rows.customer_email = "UNVERIFIED";
assert.ok(evaluateCustomerDocumentEvidence(extraField).errors.includes("rows_shape"));

const testMode = passingPacket();
testMode.environment = "test";
assert.ok(evaluateCustomerDocumentEvidence(testMode).errors.includes("environment"));

for (const unsafe of [
  "buyer@example.com",
  "https://pay.example.invalid/receipt?token=sensitive",
  "pi_1234567890ABCDEF",
  "in_1234567890ABCDEF",
  "rk_live_1234567890ABCDEF",
  "postgresql://operator:secret@example.invalid/database",
]) assert.equal(containsSensitiveCustomerDocumentEvidence(unsafe), true);
assert.equal(containsSensitiveCustomerDocumentEvidence(JSON.stringify(passingPacket())), false);

for (const forbiddenBoundary of ["process.env", "fetch(", "node:child_process", "new Stripe(", "writeFile", "mkdir"]) {
  assert.ok(!verifier.includes(forbiddenBoundary), `the customer-document classifier must stay local and read-only: ${forbiddenBoundary}`);
}
assert.ok(
  packageSource.includes('"managed-payments:documents": "node scripts/verify-managed-payments-customer-document-evidence.mjs"'),
  "package scripts must expose the private status classifier",
);
for (const outputBoundary of [
  "CUSTOMER_DOCUMENT_TRUST_GATE=GO mode=live",
  "CUSTOMER_DOCUMENT_TRUST_GATE=NO-GO mode=live",
  "secrets_printed=no",
]) {
  assert.ok(verifier.includes(outputBoundary), `the classifier is missing a canonical output boundary: ${outputBoundary}`);
}
for (const executableBoundary of [
  "npm.cmd run managed-payments:documents -- --template",
  "npm.cmd run managed-payments:documents -- --file <private-json-path>",
  "status-only JSON",
  "does not query Stripe",
  "CUSTOMER_DOCUMENT_TRUST_GATE=GO mode=live",
  "at least one existing Receipt or Invoice",
  "cannot replace the underlying artifact observation",
]) {
  assert.ok(compactEvidence.includes(executableBoundary), `customer-document executable gate is missing: ${executableBoundary}`);
}

console.log("Managed Payments customer-document evidence contract passed.");
