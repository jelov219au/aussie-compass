import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const page = readFileSync(resolve("src/app/resume-pro/page.tsx"), "utf8");
const workspace = readFileSync(resolve("src/components/tools/ResumeProWorkspace.tsx"), "utf8");

const valueHeading = page.indexOf("지원할수록 내 준비 자료가 쌓입니다.");
const checkout = page.indexOf("<ResumeProCheckoutForm");

const checks = [
  [valueHeading >= 0 && checkout >= 0 && valueHeading < checkout, "지속 효용 안내가 결제 폼보다 먼저 보여야 합니다."],
  [page.includes("회사별 지원서 저장") && page.includes("STAR 경험 재사용") && page.includes("지원서 묶음 내보내기"), "구매 전 세 가지 지속 효용이 모두 보여야 합니다."],
  [page.includes("현재 브라우저에 저장됩니다"), "구매 전에 로컬 저장 범위를 명확히 알려야 합니다."],
  [workspace.includes("hoju-compass-resume-pro-star-stories-v1"), "STAR 경험은 전용 로컬 저장소에 보관되어야 합니다."],
  [workspace.includes("REUSABLE STAR EXPERIENCE") && workspace.includes("selectedStarStory"), "선택한 STAR 경험이 지원서 묶음에 포함되어야 합니다."],
  [workspace.includes("현재 브라우저에 최대 20개 저장") && workspace.includes("현재 지원서에 연결"), "STAR 경험의 저장·재사용 상태를 사용자에게 설명해야 합니다."],
];

const failures = checks.filter(([passed]) => !passed).map(([, message]) => message);
if (failures.length) {
  failures.forEach((message) => console.error(`FAIL: ${message}`));
  process.exit(1);
}

console.log("Resume Pro mobile conversion value contract passed.");
