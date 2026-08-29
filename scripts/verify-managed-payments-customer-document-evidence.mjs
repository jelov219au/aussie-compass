import { readFile } from "node:fs/promises";

import {
  containsSensitiveCustomerDocumentEvidence,
  createCustomerDocumentEvidenceTemplate,
  evaluateCustomerDocumentEvidence,
} from "./managed-payments-customer-document-evidence-contract.mjs";

function argumentValue(name) {
  const inline = process.argv.find((argument) => argument.startsWith(`${name}=`));
  if (inline) return inline.slice(name.length + 1);
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

if (process.argv.includes("--template")) {
  console.log(JSON.stringify(createCustomerDocumentEvidenceTemplate(), null, 2));
  process.exit(0);
}

const filePath = argumentValue("--file");
if (!filePath) {
  console.error("STOP  사용법: npm run managed-payments:documents -- --file <private-json>");
  process.exit(2);
}

let raw;
try {
  raw = await readFile(filePath, "utf8");
} catch {
  console.error("STOP  증거 파일을 읽을 수 없습니다. 경로와 읽기 권한을 확인하세요.");
  process.exit(2);
}

if (containsSensitiveCustomerDocumentEvidence(raw)) {
  console.error("STOP  증거 파일에 고객정보, 전체 식별자, URL, 비밀 키 또는 연결 문자열 패턴이 있습니다.");
  console.error("원문 문서는 원래 시스템에 두고 고정 9행 상태만 private JSON에 남기세요.");
  process.exit(2);
}

let packet;
try {
  packet = JSON.parse(raw);
} catch {
  console.error("STOP  증거 파일이 유효한 JSON이 아닙니다.");
  process.exit(2);
}

const result = evaluateCustomerDocumentEvidence(packet);
if (result.errors.length > 0) {
  console.error("STOP  증거 파일 구조가 고정 9행 계약과 일치하지 않습니다.");
  for (const error of result.errors) console.error(`FAIL  ${error}`);
  process.exit(2);
}

const counts = { PRESENT: 0, ABSENT: 0, UNVERIFIED: 0, NOT_ISSUED: 0 };
for (const row of result.rows) counts[row.status] += 1;

console.log("Managed Payments customer-document evidence");
console.log("고객정보, 전체 식별자, 문서 원문, URL과 비밀 값은 출력하지 않습니다.");
for (const row of result.rows) console.log(`${row.status.padEnd(11)} ${row.check}`);

if (!result.passed) {
  console.log(`CUSTOMER_DOCUMENT_TRUST_GATE=NO-GO mode=live checkout=${result.artifactStates.checkout} receipt=${result.artifactStates.receipt} invoice=${result.artifactStates.invoice} issued_documents=${packet.issued_document_set_verified.toLowerCase()} secrets_printed=no`);
  console.log(`결과: NO-GO — PRESENT ${counts.PRESENT}, ABSENT ${counts.ABSENT}, UNVERIFIED ${counts.UNVERIFIED}, NOT_ISSUED ${counts.NOT_ISSUED}`);
  console.log("첫 고객 결제를 열지 말고 누락된 관찰을 원래 customer-facing artifact에서 다시 확인하세요.");
  process.exit(1);
}

console.log(`CUSTOMER_DOCUMENT_TRUST_GATE=GO mode=live checkout=PRESENT receipt=${result.artifactStates.receipt} invoice=${result.artifactStates.invoice} issued_documents=verified secrets_printed=no`);
console.log("이 판정은 읽기 전용이며 결제, 환불, 문서 생성·재전송, 고객 연락, 세무 판단 또는 설정 변경을 승인하지 않습니다.");
