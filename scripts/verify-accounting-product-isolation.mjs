import { readFile } from "node:fs/promises";

import {
  containsSensitiveProductIsolationEvidence,
  createAccountingProductIsolationTemplate,
  evaluateAccountingProductIsolation,
} from "./accounting-product-isolation-contract.mjs";

function argumentValue(name) {
  const inline = process.argv.find((argument) => argument.startsWith(`${name}=`));
  if (inline) return inline.slice(name.length + 1);
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

if (process.argv.includes("--template")) {
  console.log(JSON.stringify(createAccountingProductIsolationTemplate(), null, 2));
  process.exit(0);
}

const filePath = argumentValue("--file");
if (!filePath) {
  console.error("STOP  사용법: npm run accounting:product-isolation -- --file <private-json>");
  process.exit(2);
}

let raw;
try {
  raw = await readFile(filePath, "utf8");
} catch {
  console.error("STOP  증거 파일을 읽을 수 없습니다. 경로와 읽기 권한을 확인하세요.");
  process.exit(2);
}

if (containsSensitiveProductIsolationEvidence(raw)) {
  console.error("STOP  증거 파일에 고객정보, 전체 Stripe 식별자, 비밀 키 또는 연결 문자열 패턴이 있습니다.");
  console.error("원본 식별자는 private source에 두고 고정 PASS/MISSING/FAIL 결과만 남기세요.");
  process.exit(2);
}

let packet;
try {
  packet = JSON.parse(raw);
} catch {
  console.error("STOP  증거 파일이 유효한 JSON이 아닙니다.");
  process.exit(2);
}

const result = evaluateAccountingProductIsolation(packet);
if (result.errors.length > 0) {
  console.error("STOP  증거 파일 구조가 고정 계약과 일치하지 않습니다.");
  for (const error of result.errors) console.error(`FAIL  ${error}`);
  process.exit(2);
}

const counts = { PASS: 0, MISSING: 0, FAIL: 0 };
for (const row of result.rows) counts[row.status] += 1;
console.log("Accounting product-isolation evidence");
console.log("고객정보, 전체 Stripe 식별자, 문서 원문과 비밀 값은 출력하지 않습니다.");
for (const row of result.rows) console.log(`${row.status.padEnd(7)} ${row.check}`);

if (!result.passed) {
  console.log(`ACCOUNTING_PRODUCT_ISOLATION=UNRESOLVED mode=${packet.environment} products=resume_pro+rental_application_pro unresolved=${result.unresolved}`);
  console.log(`결과: UNRESOLVED — PASS ${counts.PASS}, MISSING ${counts.MISSING}, FAIL ${counts.FAIL}`);
  console.log("Rental product switch를 열지 말고 원래 시스템의 누락 chain을 다시 확인하세요.");
  process.exit(1);
}

console.log(`ACCOUNTING_PRODUCT_ISOLATION=PASS mode=${packet.environment} products=resume_pro+rental_application_pro price_identity=PASS source_chain=PASS adjustment_support_chain=PASS non_app_unallocated=PASS shared_reconciliation=PASS unresolved=0`);
console.log("이 판정은 읽기 전용이며 가격 변경, 결제, 환불, 고객 연락, 장부 입력 또는 세무 판단을 승인하지 않습니다.");
