import fs from "node:fs";
import path from "node:path";
import { loadArticleCatalog } from "./lib/load-article-catalog.mjs";

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

const articles = read("src/data/articles.ts");
const movingPage = read("src/app/moving-checklist/page.tsx");
const picker = read("src/components/tools/EnergySupportJurisdictionPicker.tsx");
const resourcePage = read("src/app/resources/[slug]/page.tsx");

const checks = [];
const expect = (condition, message) => checks.push({ condition, message });

const energyStart = articles.indexOf('slug: "australia-energy-plan-moving-home-guide"');
const energyEnd = articles.indexOf('slug: "australia-grocery-unit-price-budget-guide"', energyStart);
const energyArticle = articles.slice(energyStart, energyEnd);
const energyRecord = loadArticleCatalog().find(article => article.slug === "australia-energy-plan-moving-home-guide");

expect(energyStart >= 0 && energyEnd > energyStart, "energy guide exists as a bounded article");
expect(energyArticle.includes('readingTime: "15분"'), "energy guide keeps the expanded reading time");
const editedAt = energyRecord?.updatedAt;
expect(typeof editedAt === "string" && /^\d{4}-\d{2}-\d{2}$/.test(editedAt)
  && Number.isFinite(Date.parse(editedAt)) && new Date(editedAt).toISOString().slice(0, 10) === editedAt
  && editedAt >= "2026-09-05" && editedAt >= energyRecord.publishedAt,
"energy guide records a valid editorial date covering the Sep 5 worked-example revision, not a blanket official-source review date");
expect(energyRecord.sections.some(section => section.heading === "첫 전기요금 청구서를 계산해 보는 가상 예시")
  && energyRecord.sections.some(section => section.heading === "내 계산과 다른 금액은 차이를 물어보세요"), "the dated revision retains both the worked bill example and the practical follow-up");
expect(resourcePage.includes("modifiedTime: article.updatedAt ?? article.publishedAt"), "editorial updatedAt remains page modification metadata rather than an inferred source-review timestamp");
expect(energyArticle.includes('relatedSlugs: ["rental-condition-report-bond-first-week-australia", "casual-income-budget-australia", "emergency-fund-australia-guide"]'), "energy guide links to the intended next-step articles");
expect(energyArticle.includes("Can you confirm the plan name, tariff, supply charge and usage rates in writing?"), "connection questions include copy-ready English and Korean meaning");
expect(energyArticle.includes("Actual meter read인지 Estimated usage인지"), "first-bill review distinguishes actual and estimated readings");
expect(energyArticle.includes("I’m having difficulty paying this bill."), "payment difficulty request is copy-ready");
expect(energyArticle.includes("관할 Ombudsman으로 이어가세요"), "retailer complaint can escalate to the official dispute body");
expect(energyArticle.includes("AER 적용 Bill에는 더 나은 자사 Offer"), "better-offer wording is not presented as a market-wide cheapest plan");

for (const officialUrl of [
  "https://www.energy.gov.au/households/find-the-best-energy-deal",
  "https://www.energymadeeasy.gov.au/",
  "https://compare.energy.vic.gov.au/",
  "https://www.aer.gov.au/consumers/understanding-energy/understanding-your-energy-bill",
  "https://www.aer.gov.au/industry/retail/customer-hardship-policies",
  "https://www.energy.gov.au/households/your-rights-energy-customer",
]) {
  expect(energyArticle.includes(officialUrl), `energy guide cites ${officialUrl}`);
}

expect(movingPage.includes('import { EnergySupportJurisdictionPicker }'), "moving checklist imports the jurisdiction selector");
expect(movingPage.includes("<EnergySupportJurisdictionPicker/>"), "moving checklist renders the jurisdiction selector");
expect(movingPage.includes('href="/resources/australia-energy-plan-moving-home-guide"'), "moving checklist reaches the full energy guide");
expect(movingPage.includes("<LocalProjectChecklist"), "existing local moving checklist remains available");
expect(movingPage.includes("<MovingJurisdictionPicker/>"), "existing tenancy jurisdiction selector remains available");

for (const jurisdiction of ["ACT", "NSW", "VIC", "QLD", "SA", "TAS", "WA", "NT"]) {
  expect(picker.includes(`id: "${jurisdiction}"`), `energy selector includes ${jurisdiction}`);
}

for (const officialUrl of [
  "https://www.acat.act.gov.au/case-types/energy-and-water-cases",
  "https://www.energy.nsw.gov.au/households/bills/help",
  "https://www.ewov.com.au/",
  "https://www.ewoq.com.au/",
  "https://ewosa.com.au/about-ewosa/contact-us",
  "https://www.ombudsman.tas.gov.au/complaints/referrals-to-other-organisations/power%2C-electricity-and-gas",
  "https://energyandwater.ombudsman.wa.gov.au/complaints/make-your-complaint",
  "https://ombudsman.nt.gov.au/complaints",
]) {
  expect(picker.includes(officialUrl), `energy selector links to ${officialUrl}`);
}

expect((picker.match(/<select/g) ?? []).length === 1, "one native state selector controls the visible official card");
expect(picker.includes("useState<JurisdictionId>"), "selector state is a single primitive jurisdiction id");
expect(picker.includes('actionClass("primary")') && picker.includes('actionClass("secondary")') && picker.includes('actionClass("tertiary")'), "official links use visible shared actions");
expect(picker.includes('aria-live="polite"'), "selected state result is announced to assistive technology");
expect(!picker.includes("localStorage"), "jurisdiction choice is not persisted with personal data");
expect(!/(stripe|checkout|affiliate|commission|paid ranking|lead capture)/i.test(picker), "selector has no checkout, affiliate, commission, paid-ranking or lead-capture path");
expect(!/(stripe|checkout|affiliate|commission|paid ranking|lead capture)/i.test(energyArticle), "energy guide has no checkout, affiliate, commission, paid-ranking or lead-capture path");

expect(resourcePage.includes("article.sources.map"), "resource page renders official article sources");
expect(resourcePage.includes("getRelatedArticles(article.slug)"), "resource page renders curated related content");

const failed = checks.filter((check) => !check.condition);
if (failed.length > 0) {
  console.error(`Moving energy support contract failed (${failed.length}/${checks.length}):`);
  for (const check of failed) console.error(`- ${check.message}`);
  process.exit(1);
}

console.log(`Moving energy support contract passed (${checks.length} checks).`);
