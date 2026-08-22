import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const page = readFileSync(resolve("src/app/resume-pro/page.tsx"), "utf8");
const builder = readFileSync(resolve("src/components/tools/ResumeBuilder.tsx"), "utf8");
const workspace = readFileSync(resolve("src/components/tools/ResumeProWorkspace.tsx"), "utf8");
const deviceStorage = readFileSync(resolve("src/lib/resumeProDeviceStorage.ts"), "utf8");
const articlePage = readFileSync(resolve("src/app/resources/[slug]/page.tsx"), "utf8");
const articleNextStep = readFileSync(resolve("src/components/resources/ArticleNextStep.tsx"), "utf8");
const articles = readFileSync(resolve("src/data/articles.ts"), "utf8");
const searchPage = readFileSync(resolve("src/app/search/page.tsx"), "utf8");
const builderPage = readFileSync(resolve("src/app/resume-builder/page.tsx"), "utf8");
const toolsSection = readFileSync(resolve("src/components/sections/ToolsSection.tsx"), "utf8");

const valueHeading = page.indexOf("지원할수록 내 준비 자료가 쌓입니다.");
const checkout = page.indexOf("<ResumeProCheckoutForm");
const completionPdf = builder.indexOf('saveAsPdf("completion_choice")');
const completionStar = builder.indexOf('href="/resources/english-resume-achievement-examples"', completionPdf);
const completionPro = builder.indexOf('href="/resume-pro?from=resume-builder-complete"');
const quickStart = builder.indexOf('aria-labelledby="resume-quick-start-heading"');
const quickStartEnd = builder.indexOf('>디자인</legend>', quickStart);
const quickStartSection = builder.slice(quickStart, quickStartEnd);
const earlyStar = quickStartSection.indexOf('href="/resources/english-resume-achievement-examples"');
const firstSavedExperienceInput = quickStartSection.indexOf('id="resume-quick-achievement"');
const articleMobileCta = articlePage.indexOf("내 사례를 무료로 저장하기");
const articleShare = articlePage.indexOf("<PageShareButton");

const checks = [
  [valueHeading >= 0 && checkout >= 0 && valueHeading < checkout, "지속 효용 안내가 결제 폼보다 먼저 보여야 합니다."],
  [page.includes("회사별 지원서 저장") && page.includes("STAR 경험 재사용") && page.includes("지원서 묶음 내보내기"), "구매 전 세 가지 지속 효용이 모두 보여야 합니다."],
  [page.includes("현재 브라우저에 저장됩니다"), "구매 전에 로컬 저장 범위를 명확히 알려야 합니다."],
  [workspace.includes("resumeProStarStoriesStorageKey") && deviceStorage.includes("hoju-compass-resume-pro-star-stories-v1"), "STAR 경험은 전용 로컬 저장소에 보관되어야 합니다."],
  [workspace.includes("REUSABLE STAR EXPERIENCE") && workspace.includes("selectedStarStory"), "선택한 STAR 경험이 지원서 묶음에 포함되어야 합니다."],
  [workspace.includes("현재 브라우저에 {starStories.length} / {STAR_STORY_LIMIT}개 저장") && workspace.includes("현재 지원서에 연결"), "STAR 경험의 저장·재사용 상태를 사용자에게 설명해야 합니다."],
  [workspace.includes("STAR_STORY_LIMIT = 20") && workspace.includes("기존 경험을 삭제한 뒤 새 경험을 추가해 주세요"), "STAR 경험 한도에 도달하면 기존 데이터를 조용히 삭제하지 않아야 합니다."],
  [builder.includes("window.localStorage.setItem") && builder.includes("window.print()"), "무료 Builder의 브라우저 저장과 PDF 안내는 실제 기능과 일치해야 합니다."],
  [workspace.includes("applications.slice(0, 30)") && workspace.includes("downloadApplicationKit") && workspace.includes("resumeProStarStoriesStorageKey"), "회사별 지원서·STAR·지원서 묶음 Pro 설명은 실제 기능과 일치해야 합니다."],
  [!page.includes("Compass Cafe") && !page.includes("150 coffee") && !page.includes("150잔") && page.includes("[실제 근무처]") && page.includes("[verified result]"), "구매 전 예시에는 확인되지 않은 회사명이나 성과 수치를 넣지 않아야 합니다."],
  [articleMobileCta >= 0 && articleShare >= 0 && articleMobileCta < articleShare && articlePage.includes("inline-flex min-h-12"), "STAR 글의 무료 CTA는 모바일에서도 공유 버튼보다 먼저 보여야 합니다."],
  [articleNextStep.includes("무료 Builder에 성과 문장을 저장하고 PDF로 내보내세요") && articleNextStep.includes("STAR 면접 메모와 회사별 지원서 묶음"), "글의 무료·Pro 다음 단계가 실제 제품 경계와 일치해야 합니다."],
  [articles.includes('seoTitle: "호주 이력서 STAR 성과 문장 작성법과 실제 경험 예시"') && articlePage.includes("article.seoTitle ?? article.title"), "STAR 글의 검색 제목이 동적 메타데이터에 연결되어야 합니다."],
  [articlePage.includes("<ArticleJsonLd") && articlePage.includes("title={article.title}") && articlePage.includes("description={article.description}") && searchPage.includes("title: article.title") && searchPage.includes("description: article.description"), "검색 결과와 Article 구조화 데이터는 갱신된 제목·설명을 사용해야 합니다."],
  [builder.indexOf('id="resume-quick-achievement"') >= 0 && builder.indexOf('id="resume-quick-achievement"') < builder.indexOf(">디자인</legend>"), "모바일의 첫 저장 입력은 디자인 선택보다 먼저 보여야 합니다."],
  [builder.includes('value={resume.experiences[0]?.details ?? ""}') && builder.includes("updateFirstExperienceDetails"), "빠른 시작 입력은 실제 경력 데이터와 같은 로컬 저장 상태를 사용해야 합니다."],
  [builder.includes("AI 예시 대신") && builder.includes("무료 PDF로 내보내고"), "빠른 시작은 저장·내보내기 가치를 먼저 설명해야 합니다."],
  [completionPdf >= 0 && completionStar > completionPdf && completionPro > completionStar, "완료 화면은 무료 PDF, STAR 학습, Pro 순서여야 합니다."],
  [builder.includes("저장한 경험을 STAR로 다시 정리하기") && builder.includes("min-h-11"), "STAR 보조 링크는 내부 자료와 모바일 터치 크기를 보존해야 합니다."],
  [earlyStar >= 0 && earlyStar < firstSavedExperienceInput, "STAR 무료 글은 개인정보나 경력 입력 전에 키보드로 열 수 있어야 합니다."],
  [quickStartSection.includes("실제 경험을 STAR로 정리하는 법") && quickStartSection.includes("focus-visible:ring-2"), "조기 STAR 링크는 목적과 키보드 포커스를 명확히 보여야 합니다."],
  [!quickStartSection.includes("ResumeProCtaLink") && !quickStartSection.includes("/resume-pro"), "이력서 완료 전 빠른 시작 영역에 Pro CTA를 노출하면 안 됩니다."],
  [toolsSection.includes("내 실제 경험을 브라우저에 저장하고") && toolsSection.includes("PDF와 백업 파일로 내보내") && toolsSection.includes("다음 지원에도 다시 사용"), "홈 Builder 카드는 저장·내보내기·재사용이라는 검증된 가치를 설명해야 합니다."],
  [builderPage.includes("브라우저 자동 저장") && builderPage.includes("PDF·백업 내보내기") && builderPage.includes("실제 경험 다시 사용"), "Builder 첫 화면은 일반 문장 생성과 다른 세 가지 실제 기능을 보여야 합니다."],
  [builderPage.includes("입력하지 않은 성과나 자격을 만들어 주지 않아요"), "Builder 첫 화면은 사용자가 입력하지 않은 성과를 만든다는 암시를 금지해야 합니다."],
  [builderPage.indexOf("브라우저 자동 저장") < builderPage.indexOf("<ResumeBuilder"), "검증된 Builder 가치는 첫 입력 화면보다 먼저 보여야 합니다."],
];

const failures = checks.filter(([passed]) => !passed).map(([, message]) => message);
if (failures.length) {
  failures.forEach((message) => console.error(`FAIL: ${message}`));
  process.exit(1);
}

console.log("Resume Pro mobile conversion value contract passed.");
