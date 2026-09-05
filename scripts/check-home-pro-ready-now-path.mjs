import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const [section, homePage, catalogPage, finder, proPage, checkerPage, builderPage] = await Promise.all([
  readFile(new URL("../src/components/sections/PremiumToolsSection.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/app/page.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/app/pro/page.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/components/tools/ProProductFinder.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/app/resume-pro/page.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/app/resume-job-ad-checker/page.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/app/resume-builder/page.tsx", import.meta.url), "utf8"),
]);

assert.ok(homePage.includes("<PremiumToolsSection />"), "the ready-now path must be rendered on the public home page");
assert.ok(catalogPage.includes("<ProProductFinder resumeProLive={resumeProLive} rentalProLive={rentalProLive} packAvailability={packAvailability} />"), "the public Pro catalog must render the checkout-aware product finder");
assert.ok(checkerPage.includes("<ResumeJobAdChecker />"), "the primary free path must open the working local comparison tool");
assert.ok(builderPage.includes("<ResumeBuilder resumeProLive={resumeProLive} />"), "the secondary free path must open the working saved-draft Builder");

for (const contract of [
  'data-home-featured-product={featuredProduct?.id ?? "none"}',
  "지금 이용 가능한 Pro 없음",
  "지금 바로 할 수 있는 무료 다음 단계",
  "아래 도구는 제출·신고·구매를 대신 완료하지 않습니다.",
  "homePremiumFreeActions.map",
  '<Link href="/pro"',
  "준비 중인 Pro 상태 비교",
  '<ResumeProProofLink entry="home-premium"',
  "결제 전에 내 공고로 무료 확인 →",
]) assert.ok(section.includes(contract), `the public ready-now path is missing: ${contract}`);
assert.ok(section.includes('featuredProduct.id === "resume-pro"'), "Resume-specific proof and analytics must run only when Resume is the live feature");
assert.ok(section.includes("이력서·공고 원문을 서버로 전송하지 않아요"), "the live Resume proof must retain its local-only privacy boundary");

const unavailableFinderStart = finder.indexOf("const unavailableJobActions = (");
const unavailableFinderEnd = finder.indexOf("  );", unavailableFinderStart);
assert.ok(unavailableFinderStart >= 0 && unavailableFinderEnd > unavailableFinderStart, "the Pro finder needs a dedicated checkout-off action order");
const unavailableFinderActions = finder.slice(unavailableFinderStart, unavailableFinderEnd);
const finderFreeProof = unavailableFinderActions.indexOf('<ResumeProProofLink entry="pro-finder"');
const finderFreeBuilder = unavailableFinderActions.indexOf('<Link href="/resume-builder"');
const finderProPreview = unavailableFinderActions.indexOf('<ResumeProCtaLink href="/resume-pro?from=pro-finder"');
assert.ok(finderFreeProof >= 0 && finderFreeProof < finderFreeBuilder && finderFreeBuilder < finderProPreview, "when Resume Pro checkout is off, the public Pro finder must lead with working free proof and Builder before the product preview");
assert.match(unavailableFinderActions, /ResumeProProofLink[\s\S]*bg-gold[\s\S]*Link href="\/resume-builder"[\s\S]*min-h-12/, "the Pro finder must make its first checkout-off action a working 48px free CTA");
assert.ok(finder.includes("Resume Pro 가격은 A$19.90 1회 결제이며, 현재는 결제·이용 복구 안전 확인 중이라 판매하지 않아요."), "the Pro finder must preserve the fixed price and unavailable sales state");

const productCtaStart = proPage.indexOf('<div className="mt-10 flex flex-wrap items-start gap-3">');
const productCtaEnd = proPage.indexOf("</div>", productCtaStart);
assert.ok(productCtaStart >= 0 && productCtaEnd > productCtaStart, "the Resume Pro landing needs a stable primary action group");
const productCtas = proPage.slice(productCtaStart, productCtaEnd);
const productFreeProof = productCtas.indexOf("내 이력서와 공고 무료 비교하기 →");
const productFreeBuilder = productCtas.indexOf("무료 이력서 PDF 저장하기");
const productLaunchInterest = productCtas.indexOf("판매 시작 시 1회 안내 요청");
assert.ok(productFreeProof >= 0 && productFreeProof < productFreeBuilder && productFreeBuilder < productLaunchInterest, "when checkout is closed, the product landing must offer working free proof and a saved PDF before launch interest");
assert.match(productCtas, /ResumeProProofLink[\s\S]*min-h-12[\s\S]*Link href="\/resume-builder"[\s\S]*min-h-12/, "the Resume Pro ready-now actions need 48px mobile targets");
assert.doesNotMatch(productCtas, /Pro 작업 공간 출시 준비 중|aria-label="결제 기능 준비 중"/, "the Resume Pro primary action group must not lead with a disabled launch state");
assert.ok(proPage.includes("A$19.90") && proPage.includes("매달 빠져나가는 구독료 없이 한 번만 결제해요."), "the ready-now path must preserve the one-time Resume Pro value beside the free actions");

console.log("Home and Resume Pro ready-now free path contract passed.");
