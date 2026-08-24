import { readFile } from "node:fs/promises";

import {
  containsSensitiveRegisteredTaxAgentHandoffEvidence,
  createRegisteredTaxAgentHandoffTemplate,
  evaluateRegisteredTaxAgentHandoff,
} from "./registered-tax-agent-handoff-contract.mjs";

function argumentValue(name) {
  const inline = process.argv.find((argument) => argument.startsWith(`${name}=`));
  if (inline) return inline.slice(name.length + 1);
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

if (process.argv.includes("--template")) {
  console.log(JSON.stringify(createRegisteredTaxAgentHandoffTemplate(), null, 2));
  process.exit(0);
}

const filePath = argumentValue("--file");
if (!filePath) {
  console.error("STOP  사용법: npm run accounting:tax-agent-handoff -- --file <private-status-json>");
  process.exit(2);
}

let raw;
try {
  raw = await readFile(filePath, "utf8");
} catch {
  console.error("STOP  세무사 handoff 상태 파일을 읽을 수 없습니다. 경로와 읽기 권한을 확인하세요.");
  process.exit(2);
}

if (containsSensitiveRegisteredTaxAgentHandoffEvidence(raw)) {
  console.error("STOP  상태 파일에 이름, ABN, 연락처, 금액, 전체 식별자, URL, 조언 원문 또는 비밀 값 패턴이 있습니다.");
  console.error("모든 원본과 참조는 승인된 private 위치에 두고 고정 상태만 입력하세요.");
  process.exit(2);
}

let packet;
try {
  packet = JSON.parse(raw);
} catch {
  console.error("STOP  세무사 handoff 상태 파일이 유효한 JSON이 아닙니다.");
  process.exit(2);
}

const result = evaluateRegisteredTaxAgentHandoff(packet);
if (result.errors.length > 0) {
  console.error("STOP  세무사 handoff 상태 파일 구조가 고정 계약과 일치하지 않습니다.");
  for (const error of result.errors) console.error(`FAIL  ${error}`);
  process.exit(2);
}

const counts = { PASS: 0, MISSING: 0, FAIL: 0 };
for (const row of result.rows) counts[row.status] += 1;

console.log("Registered tax-agent first-sale handoff status");
console.log("이름, ABN, 연락처, 금액, 전체 식별자, URL, 조언 원문과 private 참조는 출력하지 않습니다.");
for (const row of result.rows) console.log(`${row.status.padEnd(7)} ${row.check}`);

if (!result.passed) {
  console.log(`REGISTERED_TAX_AGENT_HANDOFF_GATE=HOLD mode=production product=resume_pro adviser_registration=${packet.adviser_registration_verified.toLowerCase()} overall=${packet.overall_tax_handoff} unresolved=${result.unresolved} sensitive_data_printed=no`);
  console.log(`결과: HOLD — PASS ${counts.PASS}, MISSING ${counts.MISSING}, FAIL ${counts.FAIL}`);
  console.log("첫 고객 결제를 열지 말고 등록 세무사 확인, 처리 결론과 private 원본 보존을 완료하세요.");
  process.exit(1);
}

console.log("REGISTERED_TAX_AGENT_HANDOFF_GATE=PASS mode=production product=resume_pro adviser_registration=verified overall=PASS unresolved=0 sensitive_data_printed=no");
console.log("이 판정은 세무·법률 조언이 아니며 결제, 환불, 고객 연락, 신고, 장부 입력, 설정 변경 또는 sale-gate reopen을 승인하지 않습니다.");
