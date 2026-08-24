import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const [section, homePage, checkerPage, builderPage] = await Promise.all([
  readFile(new URL("../src/components/sections/PremiumToolsSection.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/app/page.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/app/resume-job-ad-checker/page.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/app/resume-builder/page.tsx", import.meta.url), "utf8"),
]);

assert.ok(homePage.includes("<PremiumToolsSection />"), "the ready-now path must be rendered on the public home page");
assert.ok(checkerPage.includes("<ResumeJobAdChecker />"), "the primary free path must open the working local comparison tool");
assert.ok(builderPage.includes("<ResumeBuilder resumeProLive={resumeProLive} />"), "the secondary free path must open the working saved-draft Builder");

const closedStart = section.indexOf(") : (");
const closedEnd = section.indexOf(")}", closedStart);
assert.ok(closedStart >= 0 && closedEnd > closedStart, "the unavailable Resume Pro state needs a dedicated ready-now branch");
const closedBranch = section.slice(closedStart, closedEnd);

for (const contract of [
  "무료 공고 점검은 지금 이용 가능",
  "판매를 기다리지 않아도 실제 이력서와 공고를 지금 비교할 수 있어요.",
  '<ResumeProProofLink entry="home-premium"',
  "결제 전에 내 공고로 무료 확인 →",
  '<Link href="/resume-builder"',
  "실제 경력 초안 저장하기 →",
  "회사별 저장·재사용 방식 미리 보기",
  "무료 비교와 경력 저장은 바로 사용할 수 있어요.",
]) assert.ok(section.includes(contract), `the public ready-now path is missing: ${contract}`);

const freeProof = closedBranch.indexOf('<ResumeProProofLink entry="home-premium"');
const freeBuilder = closedBranch.indexOf('<Link href="/resume-builder"');
const proPreview = closedBranch.indexOf('<ResumeProCtaLink href="/resume-pro?from=home-premium"');
assert.ok(freeProof >= 0 && freeProof < freeBuilder && freeBuilder < proPreview, "when sales are unavailable, working free comparison and saved-draft actions must precede the Pro preview in mobile and DOM order");
assert.match(closedBranch, /ResumeProProofLink[\s\S]*min-h-12[\s\S]*Link href="\/resume-builder"[\s\S]*min-h-12/, "both ready-now mobile actions need 48px targets");
assert.doesNotMatch(closedBranch, /출시 준비 중|결제 시작|checkout|disabled/, "the unavailable state must not lead with a dead-end or imply checkout availability");

console.log("Home Resume Pro ready-now free path contract passed.");
