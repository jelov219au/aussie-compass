import { readFile } from "node:fs/promises";

import {
  containsSensitivePaymentRefundSupportAlertEvidence,
  createPaymentRefundSupportAlertTemplate,
  evaluatePaymentRefundSupportAlertEvidence,
} from "./payment-refund-support-alert-contract.mjs";

function argumentValue(name) {
  const inline = process.argv.find((argument) => argument.startsWith(`${name}=`));
  if (inline) return inline.slice(name.length + 1);
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

if (process.argv.includes("--template")) {
  console.log(JSON.stringify(createPaymentRefundSupportAlertTemplate(), null, 2));
  process.exit(0);
}

const filePath = argumentValue("--file");
if (!filePath) {
  console.error("STOP  사용법: npm run payments:alerts:evidence -- --file <private-json>");
  process.exit(2);
}

let raw;
try {
  raw = await readFile(filePath, "utf8");
} catch {
  console.error("STOP  알림 증거 상태 파일을 읽을 수 없습니다. 경로와 읽기 권한을 확인하세요.");
  process.exit(2);
}

if (containsSensitivePaymentRefundSupportAlertEvidence(raw)) {
  console.error("STOP  상태 파일에 고객정보, 전체 식별자, suffix, URL, 비밀 키 또는 연결 문자열 패턴이 있습니다.");
  console.error("원본 전달 증거는 private 운영 기록에 두고 고정 PASS/MISSING/FAIL만 남기세요.");
  process.exit(2);
}

let packet;
try {
  packet = JSON.parse(raw);
} catch {
  console.error("STOP  알림 증거 상태 파일이 유효한 JSON이 아닙니다.");
  process.exit(2);
}

const result = evaluatePaymentRefundSupportAlertEvidence(packet);
if (result.errors.length > 0) {
  console.error("STOP  알림 증거 상태 파일 구조가 고정 계약과 일치하지 않습니다.");
  for (const error of result.errors) console.error(`FAIL  ${error}`);
  process.exit(2);
}

const counts = { PASS: 0, MISSING: 0, FAIL: 0 };
for (const row of result.rows) counts[row.status] += 1;

console.log("Controlled payment/refund support-alert evidence");
console.log("고객정보, 전체 식별자, suffix, 이메일 주소, 원문 메시지와 비밀 값은 출력하지 않습니다.");
for (const row of result.rows) console.log(`${row.status.padEnd(7)} ${row.check}`);

if (!result.passed) {
  console.log(`PAYMENT_REFUND_SUPPORT_ALERT_GATE=HOLD mode=production product=resume_pro transport=${packet.transport_state} purchase_alert=${packet.purchase_alert_state} refund_alert=${packet.refund_alert_state} unresolved=${result.unresolved} secrets_printed=no`);
  console.log(`결과: HOLD — PASS ${counts.PASS}, MISSING ${counts.MISSING}, FAIL ${counts.FAIL}`);
  console.log("첫 고객 결제를 열지 말고 private 원본에서 누락된 transport, outbox 또는 mailbox 증거를 확인하세요.");
  process.exit(1);
}

console.log("PAYMENT_REFUND_SUPPORT_ALERT_GATE=PASS mode=production product=resume_pro transport=verified purchase_alert=received refund_alert=received unresolved=0 secrets_printed=no");
console.log("이 판정은 읽기 전용이며 결제, 환불, 고객 연락, 메시지 전송, 설정 변경 또는 sale-gate reopen을 승인하지 않습니다.");
