import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import fs from "node:fs";
import { localTypeScriptLoader } from "./lib/load-local-typescript.mjs";

const load = localTypeScriptLoader();
const { categories, phrases } = load("src/data/englishPhrases.ts");
assert.equal(phrases.length, 30, "current phrase catalogue changed; visible counts must be reviewed from source data");
assert.equal(new Set(phrases.map((phrase) => phrase.id)).size, phrases.length, "phrase IDs must remain unique");
assert.deepEqual(
  [...new Set(phrases.map((phrase) => phrase.category))].sort(),
  ["bank", "essential", "health", "home", "work"],
  "content must retain five actual categories",
);
assert.deepEqual(
  [...categories.filter((category) => !["all", "saved"].includes(category.id)).map((category) => category.id)].sort(),
  ["bank", "essential", "health", "home", "work"],
  "all/saved must not be counted as content categories",
);

const home = fs.readFileSync("src/app/page.tsx", "utf8");
const expectedOrder = ["<Hero />", "<ToolsSection />", "<PersonalRouteFinder />", "<ReturnVisitSection />", "<HomeInstallBanner />", "<PremiumToolsSection />", "<ArticlesSection />", "<HomeTrustBar />"];
let previous = -1;
for (const marker of expectedOrder) {
  const index = home.indexOf(marker);
  assert.ok(index > previous, `home section order is wrong near ${marker}`);
  previous = index;
}

const toolsSection = fs.readFileSync("src/components/sections/ToolsSection.tsx", "utf8");
const toolsPage = fs.readFileSync("src/app/tools/page.tsx", "utf8");
const phrasePage = fs.readFileSync("src/app/english-phrase-cards/page.tsx", "utf8");
assert.ok(toolsSection.includes('import { phrases } from "@/data/englishPhrases"'));
assert.ok(toolsSection.includes("상황별 {phrases.length}개 문장 보기"));
assert.ok(toolsPage.includes('import { phrases } from "@/data/englishPhrases"'));
assert.ok(toolsPage.includes("`상황별 ${phrases.length}개 문장`"));
assert.ok(phrasePage.includes("전체 {phrases.length}개 문장"));
for (const source of [home, toolsSection, toolsPage, phrasePage]) assert.ok(!source.includes("25개 문장"), "stale 25-phrase claim remains");

const installComponent = fs.readFileSync("src/components/sections/HomeInstallBanner.tsx", "utf8");
assert.ok(installComponent.includes('eventName="Home Navigation"'));
assert.ok(installComponent.includes('section: "home_install", destination: "install"'));
assert.ok(installComponent.includes("iPhone · Android 설치 안내"));
assert.ok(installComponent.includes('href="/install"'));
const css = fs.readFileSync("src/components/sections/HomeInstallBanner.module.css");
const priorManifest = JSON.parse(fs.readFileSync("outputs/night-20260905/header-search-candidate/candidate-manifest.json", "utf8"));
const priorCssHash = priorManifest.files.find((file) => file.path === "src/components/sections/HomeInstallBanner.module.css")?.sha256;
assert.equal(createHash("sha256").update(css).digest("hex"), priorCssHash, "standalone install hiding CSS must remain unchanged");

console.log(JSON.stringify({ status: "PASS", phrases: phrases.length, uniqueIds: phrases.length, contentCategories: 5 }));
