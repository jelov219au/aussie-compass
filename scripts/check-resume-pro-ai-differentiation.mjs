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
  [page.includes('"job-ad-checker": {') && page.includes('"resume-builder-complete": {') && page.includes("entryContinuations[entry]"), "고의도 무료 작업에서 온 방문자에게만 다음 단계 맥락을 이어 보여야 합니다."],
  [page.includes("표현 후보를 찾았다면, 실제 근거를 지원서 전체에 한 번만 연결하세요") && page.includes("경력 초안이 있다면, 지원할 공고 하나에 맞춰 제출 묶음을 완성하세요"), "무료 점검과 이력서 완성의 다음 유료 작업이 각각 구체적이어야 합니다."],
  [page.includes("이 페이지·URL·분석 이벤트·안내 요청문으로 넘어오지 않습니다") && page.includes("현재 브라우저에 남고 URL·분석 이벤트·안내 요청문에 포함되지 않습니다"), "전환 맥락은 원문이 이동하거나 분석·이메일로 전송된다는 오해를 막아야 합니다."],
  [page.includes('aria-labelledby="entry-continuation-heading"') && page.includes('id="entry-continuation-heading"'), "전환 연속성 안내에는 접근 가능한 섹션 제목이 필요합니다."],
  [prohibitedClaims.every((claim) => !page.includes(claim)), "AI 우월·취업 결과 보장 표현을 사용하면 안 됩니다."],
];

const failures = checks.filter(([passed]) => !passed).map(([, message]) => message);
if (failures.length) {
  failures.forEach((message) => console.error(`FAIL: ${message}`));
  process.exit(1);
}

console.log("Resume Pro AI differentiation contract passed.");
