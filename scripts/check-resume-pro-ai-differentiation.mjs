import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const page = readFileSync(resolve("src/app/resume-pro/page.tsx"), "utf8");
const checker = readFileSync(resolve("src/components/tools/ResumeJobAdChecker.tsx"), "utf8");
const workspace = readFileSync(resolve("src/components/tools/ResumeProWorkspace.tsx"), "utf8");

const sectionStart = page.indexOf('aria-labelledby="ai-role-heading"');
const checkout = page.indexOf("<ResumeProCheckoutForm");
const section = sectionStart >= 0 && checkout > sectionStart ? page.slice(sectionStart, checkout) : "";

const prohibitedClaims = ["AI보다 정확", "ChatGPT보다", "AI는 못", "취업 보장", "합격 보장"];
const checks = [
  [sectionStart >= 0 && checkout >= 0 && sectionStart < checkout, "AI 역할 안내는 결제 폼보다 먼저 보여야 합니다."],
  [section.includes("AI를 대신한다고 약속하지 않아요"), "Resume Pro가 AI를 대체한다고 주장하면 안 됩니다."],
  [section.includes("AI로 물어보기 좋은 일") && section.includes("무료로 확인하는 일") && section.includes("Resume Pro에 남기는 일"), "초안·무료 확인·Pro 축적의 역할을 모두 구분해야 합니다."],
  [section.includes("브라우저 안에서만 비교") && checker.includes("서버로 보내거나 브라우저에 저장하지 않습니다"), "무료 공고 점검의 로컬 처리 설명은 실제 기능과 일치해야 합니다."],
  [section.includes("회사별 이력서·커버레터·STAR 메모와 지원서 묶음") && workspace.includes("applications.slice(0, 30)") && workspace.includes("downloadApplicationKit") && workspace.includes("resumeProStarStoriesStorageKey"), "Pro의 재사용 설명은 실제 저장·내보내기 기능과 일치해야 합니다."],
  [section.includes("없는 경력·성과·자격을 만들지 않습니다"), "어떤 글쓰기 도구를 써도 사실을 만들어내지 않는 원칙을 명시해야 합니다."],
  [section.includes("<ResumeProProofLink entry={entry}") && section.includes("결제 전에 내 공고로 차이 확인하기"), "차이는 개인정보 안전한 무료 확인 링크로 직접 검증할 수 있어야 합니다."],
  [prohibitedClaims.every((claim) => !page.includes(claim)), "AI 우월·취업 결과 보장 표현을 사용하면 안 됩니다."],
];

const failures = checks.filter(([passed]) => !passed).map(([, message]) => message);
if (failures.length) {
  failures.forEach((message) => console.error(`FAIL: ${message}`));
  process.exit(1);
}

console.log("Resume Pro AI differentiation contract passed.");
