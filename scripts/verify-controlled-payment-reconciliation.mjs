import { readFile } from "node:fs/promises";

import {
  containsSensitiveControlledPaymentReconciliation,
  createControlledPaymentReconciliationTemplate,
  evaluateControlledPaymentReconciliation,
} from "./controlled-payment-reconciliation-contract.mjs";

function argumentValue(name) {
  const inline = process.argv.find((argument) => argument.startsWith(`${name}=`));
  if (inline) return inline.slice(name.length + 1);
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

if (process.argv.includes("--template")) {
  console.log(JSON.stringify(createControlledPaymentReconciliationTemplate(), null, 2));
  process.exit(0);
}

const filePath = argumentValue("--file");
if (!filePath) {
  console.error("STOP  사용법: npm run accounting:controlled-reconciliation -- --file <private-json>");
  process.exit(2);
}

let raw;
try {
  raw = await readFile(filePath, "utf8");
} catch {
  console.error("STOP  대사 상태 파일을 읽을 수 없습니다. 경로와 읽기 권한을 확인하세요.");
  process.exit(2);
}

if (containsSensitiveControlledPaymentReconciliation(raw)) {
  console.error("STOP  상태 파일에 금액, 고객정보, 전체 식별자, URL, 비밀 키 또는 연결 문자열 패턴이 있습니다.");
  console.error("원본 금액과 식별자는 private 회계 원본에 두고 고정 PASS/MISSING/FAIL만 남기세요.");
  process.exit(2);
}

let packet;
try {
  packet = JSON.parse(raw);
} catch {
  console.error("STOP  대사 상태 파일이 유효한 JSON이 아닙니다.");
  process.exit(2);
}

const result = evaluateControlledPaymentReconciliation(packet);
if (result.errors.length > 0) {
  console.error("STOP  대사 상태 파일 구조가 고정 계약과 일치하지 않습니다.");
  for (const error of result.errors) console.error(`FAIL  ${error}`);
  process.exit(2);
}

const counts = { PASS: 0, MISSING: 0, FAIL: 0 };
for (const row of result.rows) counts[row.status] += 1;

console.log("Controlled live payment reconciliation evidence");
console.log("금액, 고객정보, 전체 식별자, 은행정보, 원문 문서와 비밀 값은 출력하지 않습니다.");
for (const row of result.rows) console.log(`${row.status.padEnd(7)} ${row.check}`);

if (!result.passed) {
  console.log(`CONTROLLED_PAYMENT_RECONCILIATION=HOLD mode=live product=resume_pro outcome=${result.outcome} refund=${packet.refund_state} payout=${packet.payout_state} unresolved=${result.unresolved} amounts_printed=no identifiers_printed=no`);
  console.log(`결과: HOLD — PASS ${counts.PASS}, MISSING ${counts.MISSING}, FAIL ${counts.FAIL}`);
  console.log("첫 고객 결제를 열지 말고 private 원본에서 누락된 sale, fee, refund 또는 payout 대사를 완료하세요.");
  process.exit(1);
}

console.log(`CONTROLLED_PAYMENT_RECONCILIATION=PASS mode=live product=resume_pro outcome=${result.outcome} refund=${packet.refund_state} payout=${packet.payout_state} unresolved=0 amounts_printed=no identifiers_printed=no`);
console.log("이 판정은 읽기 전용이며 결제, 환불, 고객 연락, 장부 입력, 세무 판단, payout 또는 설정 변경을 승인하지 않습니다.");
