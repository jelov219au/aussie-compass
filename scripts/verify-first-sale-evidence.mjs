import { readFile } from "node:fs/promises";

import {
  containsSensitiveEvidence,
  createFirstSaleEvidenceTemplate,
  evaluateFirstSaleEvidence,
  evidencePhases,
} from "./first-sale-evidence-contract.mjs";

function argumentValue(name) {
  const inline = process.argv.find((argument) => argument.startsWith(`${name}=`));
  if (inline) return inline.slice(name.length + 1);
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

if (process.argv.includes("--template")) {
  console.log(JSON.stringify(createFirstSaleEvidenceTemplate(), null, 2));
  process.exit(0);
}

const filePath = argumentValue("--file");
const phase = argumentValue("--phase");

if (!filePath || !evidencePhases.includes(phase)) {
  console.error("STOP  사용법: npm run first-sale:evidence -- --file <private-json> --phase <15m|24h|payout>");
  process.exit(2);
}

let raw;
try {
  raw = await readFile(filePath, "utf8");
} catch {
  console.error("STOP  증거 파일을 읽을 수 없습니다. 경로와 읽기 권한을 확인하세요.");
  process.exit(2);
}

if (containsSensitiveEvidence(raw)) {
  console.error("STOP  증거 파일에 이메일, 전체 결제 식별자, 비밀 키 또는 연결 문자열 패턴이 있습니다.");
  console.error("전체 값은 제거하고 마지막 8자 suffix와 고정 PASS/MISSING/FAIL만 남기세요.");
  process.exit(2);
}

let packet;
try {
  packet = JSON.parse(raw);
} catch {
  console.error("STOP  증거 파일이 유효한 JSON이 아닙니다.");
  process.exit(2);
}

const result = evaluateFirstSaleEvidence(packet, phase);
if (result.errors.length > 0) {
  console.error("STOP  증거 파일 구조가 고정 계약과 일치하지 않습니다.");
  for (const error of result.errors) console.error(`FAIL  ${error}`);
  process.exit(2);
}

const counts = { PASS: 0, MISSING: 0, FAIL: 0 };
for (const row of result.rows) counts[row.status] += 1;

console.log(`First-sale post-payment evidence (${phase})`);
console.log("고객정보, 전체 식별자, 원문 영수증과 비밀 값은 출력하지 않습니다.");
for (const row of result.rows) console.log(`${row.status.padEnd(7)} ${row.check}`);
console.log(`결과: ${result.decision} — PASS ${counts.PASS}, MISSING ${counts.MISSING}, FAIL ${counts.FAIL}`);

if (!result.passed) {
  console.log(phase === "15m"
    ? "신규 판매를 열지 말고 재결제를 요청하지 마세요. owner 에스컬레이션이 필요합니다."
    : "두 번째 판매를 열지 마세요. 누락 증거를 원래 시스템에서 다시 확인해야 합니다.");
  process.exit(1);
}

console.log("이 판정은 읽기 전용입니다. 결제 활성화, 고객 연락, 환불 또는 gate reopen을 승인하지 않습니다.");
