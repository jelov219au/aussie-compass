import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

const actions = read("src/components/ui/actionStyles.ts");
const hero = read("src/components/sections/Hero.tsx");
const home = read("src/app/page.tsx");
const premium = read("src/components/sections/PremiumToolsSection.tsx");
const resources = read("src/components/resources/ResourcesDirectory.tsx");
const article = read("src/app/resources/[slug]/page.tsx");

for (const variant of ["primary", "secondary", "darkSecondary", "tertiary"]) {
  assert.match(actions, new RegExp(`${variant}:`), `Missing ${variant} action style.`);
}

assert.match(hero, /공식 원문 연결/);
assert.match(hero, /로그인 없이 바로 사용/);
assert.ok(!hero.includes("Hoju Compass를 만든 이유"), "The long origin story must stay out of the hero.");

assert.ok(home.indexOf("<PremiumToolsSection") < home.indexOf("<ArticlesSection"), "The product outcome must appear before the article feed.");
assert.match(premium, /Resume Pro 보기 · A\$19\.90/);
assert.match(premium, /공고별 이력서/);
assert.match(premium, /actionClass\("primary"/);
assert.match(premium, /actionClass\("secondary"/);

assert.match(resources, /자료 읽기/);
assert.match(resources, /TopicIcon/);
assert.match(article, /먼저 이것만/);
assert.match(article, /rounded-2xl border-2 border-navy\/10 bg-white/);

console.log("Visual hierarchy contract is present across home, Pro, and resources surfaces.");
