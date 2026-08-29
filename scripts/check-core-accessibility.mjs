import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const [
  globalStyles,
  hero,
  australianSky,
  homeSearch,
  tools,
  returnVisit,
  routeFinder,
  stories,
  articles,
  trustBar,
  premiumTools,
  proPage,
  proFinder,
  resumeBuilder,
  resumeProWorkspace,
  searchPage,
  siteSearch,
] = await Promise.all([
  readFile(new URL("../src/app/globals.css", import.meta.url), "utf8"),
  readFile(new URL("../src/components/sections/Hero.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/components/brand/AustralianSky.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/components/sections/HomeSearch.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/components/sections/ToolsSection.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/components/sections/ReturnVisitSection.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/components/sections/PersonalRouteFinder.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/components/sections/ExperienceStoriesSection.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/components/sections/ArticlesSection.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/components/sections/HomeTrustBar.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/components/sections/PremiumToolsSection.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/app/pro/page.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/components/tools/ProProductFinder.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/components/tools/ResumeBuilder.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/components/tools/ResumeProWorkspace.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/app/search/page.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/components/search/SiteSearch.tsx", import.meta.url), "utf8"),
]);

function rgb(hex) {
  return {
    r: Number.parseInt(hex.slice(1, 3), 16),
    g: Number.parseInt(hex.slice(3, 5), 16),
    b: Number.parseInt(hex.slice(5, 7), 16),
  };
}

function luminance(hex) {
  const channel = (value) => {
    const normalized = value / 255;
    return normalized <= 0.03928
      ? normalized / 12.92
      : ((normalized + 0.055) / 1.055) ** 2.4;
  };
  const color = rgb(hex);
  return 0.2126 * channel(color.r) + 0.7152 * channel(color.g) + 0.0722 * channel(color.b);
}

function contrast(foreground, background) {
  const foregroundLuminance = luminance(foreground);
  const backgroundLuminance = luminance(background);
  return (Math.max(foregroundLuminance, backgroundLuminance) + 0.05)
    / (Math.min(foregroundLuminance, backgroundLuminance) + 0.05);
}

assert.ok(globalStyles.includes("--color-gold-ink: #806515;"), "the light-surface gold ink token is missing");
for (const background of ["#ffffff", "#f8f7f4", "#f1efe9", "#edf3f2"]) {
  assert.ok(contrast("#806515", background) >= 4.5, `gold ink misses AA contrast on ${background}`);
}
assert.ok(contrast("#874b32", "#edf3f2") >= 4.5, "the hero rust label misses AA contrast");
assert.ok(contrast("#1a2744", "#ffffff") >= 3, "the outer focus ring misses non-text contrast on white");
assert.ok(contrast("#f8f7f4", "#1a2744") >= 3, "the inner focus ring misses non-text contrast on navy");
for (const focusContract of [
  ":where(a, button, input, select, textarea, summary):focus-visible",
  "outline: 3px solid var(--color-background);",
  "box-shadow: 0 0 0 5px var(--color-navy);",
  "@media (forced-colors: active)",
  "outline: 3px solid ButtonText;",
]) {
  assert.ok(globalStyles.includes(focusContract), `global keyboard focus contract is missing: ${focusContract}`);
}

for (const [source, marker] of [
  [hero, 'text-[#874b32]'],
  [australianSky, 'text-[#874b32]">START HERE, STAY READY'],
  [homeSearch, 'text-gold-ink">바로 찾아보기'],
  [tools, 'text-gold-ink">바로 써볼 수 있어요'],
  [returnVisit, "bg-surface text-sm text-gold-ink"],
  [routeFinder, 'text-gold-ink">내 상황에 맞춰보기'],
  [stories, 'text-[0.65rem] text-gold-ink'],
  [articles, 'text-gold-ink">{String(index+1)'],
  [trustBar, 'text-gold-ink">정보를 고르는 기준'],
  [premiumTools, 'text-gold-ink">정보를 찾은 다음'],
  [proPage, 'text-gold-ink">Hoju Compass Pro'],
  [proFinder, 'text-gold-ink">내 상황에 맞는 Pro 찾기'],
  [searchPage, 'text-gold-ink">막막한 순간에 찾아보세요'],
  [siteSearch, 'text-gold-ink">어떤 도움이 필요하세요?'],
  [siteSearch, 'text-2xl text-gold-ink'],
  [siteSearch, 'text-xs text-gold-ink">{String(index + 1)'],
]) {
  assert.ok(source.includes(marker), `audited light-surface contrast marker is missing: ${marker}`);
}

assert.ok(proFinder.includes('text-gold">지금 필요한 결과물'), "dark Pro finder panel must keep the brighter gold token");
assert.ok(tools.includes('text-gold">지금 바로 한 문장'), "dark homepage feature panel must keep the brighter gold token");

for (const source of [resumeBuilder, resumeProWorkspace]) {
  assert.doesNotMatch(source, /<h1[^>]*>\{resume\.name \|\| "Your Name"\}<\/h1>/, "an embedded resume preview must not create another page-level h1");
}

console.log("Core acquisition contrast, keyboard focus, and resume-preview heading contracts passed.");
