import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

const articles = read("src/data/articles.ts");
const movingPage = read("src/app/moving-checklist/page.tsx");
const resourcePage = read("src/app/resources/[slug]/page.tsx");
const depthContract = read("scripts/check-content-depth-foundation.mjs");

const checks = [];
const expect = (condition, message) => checks.push({ condition, message });

const articleStart = articles.indexOf('slug: "australia-home-internet-moving-guide"');
const articleEnd = articles.indexOf('slug: "australia-bank-account-opening-guide"', articleStart);
const article = articles.slice(articleStart, articleEnd);

expect(articleStart >= 0 && articleEnd > articleStart, "the home-internet moving guide exists as a bounded resource article");
expect(article.includes('readingTime: "14분"'), "the guide records its expanded reading time");
expect(article.includes('updatedAt: "2026-08-30"'), "the guide records its official-source review date");
expect(article.includes('toolHref: "/moving-checklist"'), "the guide returns to the shared moving checklist");
expect(article.includes('relatedSlugs: ["australia-energy-plan-moving-home-guide", "australia-sim-esim-setup-guide", "rental-condition-report-bond-first-week-australia"]'), "the guide has a deliberate next-step sequence");
expect((article.match(/\{ heading:/g) ?? []).length >= 12, "the guide covers the full address-to-dispute decision path");
expect((article.match(/\{ label:/g) ?? []).length >= 8, "the guide exposes at least eight direct official source entries");

for (const phrase of [
  "주소 검색 결과와 실제 개통 가능일은 같은 말이 아니에요",
  "Private network",
  "CIS와 NBN Key Facts Sheet",
  "Typical busy period Download speed",
  "기존 집 종료일은 새 집 연결 확인 뒤로 잡으세요",
  "임차인이라면 설치 작업 허락을 먼저 받으세요",
  "NBN 로고가 있는 Connection box",
  "첫 Bill에서는 기간·주소·일회성 비용을 분리하세요",
  "Payment assistance",
  "Formal complaint",
  "Telecommunications Industry Ombudsman",
]) {
  expect(article.includes(phrase), `the guide includes: ${phrase}`);
}

for (const question of [
  "Can you confirm the exact service address, access technology and whether an installation visit is required?",
  "Please send me the CIS, NBN Key Facts Sheet and total minimum cost before I agree.",
  "What happens if the service is not connected by my requested date?",
  "I’m having difficulty paying my phone or internet bill.",
  "I am making a formal complaint about my internet connection or bill.",
]) {
  expect(article.includes(question) && article.includes("—"), `copy-ready question keeps its Korean meaning: ${question}`);
}

for (const officialUrl of [
  "https://www.nbnco.com.au/residential/moving-home",
  "https://www.acma.gov.au/choosing-right-product-or-plan",
  "https://www.acma.gov.au/choosing-nbn-plan",
  "https://www.accc.gov.au/consumers/telecommunications-and-internet/broadband-speeds",
  "https://www.acma.gov.au/managing-your-phone-bill",
  "https://www.acma.gov.au/telecommunications-financial-hardship-industry-standard",
  "https://www.acma.gov.au/how-complain-your-telco",
  "https://www.tio.com.au/",
]) {
  expect(article.includes(officialUrl), `the guide cites ${officialUrl}`);
}

expect(articles.includes('relatedSlugs: ["australia-home-internet-moving-guide", "australia-bank-account-opening-guide"]'), "the existing SIM guide links into the home-internet path without duplicating its content");
expect(movingPage.includes('href="/resources/australia-home-internet-moving-guide"'), "the moving checklist reaches the home-internet guide");
expect(movingPage.includes("주소별 NBN·대체망·기술과 설치·임시 데이터"), "the moving checklist distinguishes address network and installation status");
expect(movingPage.includes("NBN·Provider 장비 구분"), "the moving checklist distinguishes address-bound and provider equipment");
expect(movingPage.includes("<LocalProjectChecklist"), "the existing local moving checklist remains intact");
expect(movingPage.includes("<EnergySupportJurisdictionPicker/>"), "the existing energy support flow remains intact");
expect(depthContract.includes("articleBlocks.length, 34"), "the content-depth baseline is updated for the complete audited library");
expect(resourcePage.includes("generateStaticParams"), "the resource route statically includes the new article");
expect(resourcePage.includes("article.sources.map"), "the resource route renders every official source");
expect(resourcePage.includes("getRelatedArticles(article.slug)"), "the resource route renders deliberate related content");
expect(!/(stripe|checkout|affiliate|commission|paid ranking|lead capture)/i.test(article), "the guide has no payment, affiliate, commission, ranking-sale or lead-capture path");

const failed = checks.filter((check) => !check.condition);
if (failed.length > 0) {
  console.error(`Moving telecommunications contract failed (${failed.length}/${checks.length}):`);
  for (const check of failed) console.error(`- ${check.message}`);
  process.exit(1);
}

console.log(`Moving telecommunications contract passed (${checks.length} checks).`);
