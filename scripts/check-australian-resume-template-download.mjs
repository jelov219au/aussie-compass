import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";

const [asset, assetStat, component, articlePage, builderPage, articles, privacy, generator, packageSource] = await Promise.all([
  readFile(new URL("../public/downloads/australian-resume-template-hoju-compass.docx", import.meta.url)),
  stat(new URL("../public/downloads/australian-resume-template-hoju-compass.docx", import.meta.url)),
  readFile(new URL("../src/components/analytics/ResumeTemplateDownloadLink.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/app/resources/[slug]/page.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/app/resume-builder/page.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/data/articles.ts", import.meta.url), "utf8"),
  readFile(new URL("../docs/privacy-safe-analytics.md", import.meta.url), "utf8"),
  readFile(new URL("./build-australian-resume-template.py", import.meta.url), "utf8"),
  readFile(new URL("../package.json", import.meta.url), "utf8"),
]);

assert.equal(asset.subarray(0, 2).toString("ascii"), "PK", "download must be an OOXML ZIP file");
assert.ok(assetStat.size > 10_000, "downloaded DOCX is unexpectedly small");
assert.ok(assetStat.size < 250_000, "downloaded DOCX should remain lightweight");

assert.ok(component.startsWith('"use client";'), "analytics must stay in a small client boundary");
assert.ok(component.includes('href={resumeTemplateHref} download'), "link must download the fixed public DOCX");
assert.ok(component.includes('track("Resume Template Downloaded", { entry, format: "docx" })'), "download must emit the fixed event contract");
assert.match(component, /try\s*\{[\s\S]*track\([\s\S]*\}\s*catch/, "analytics failure must not interrupt the download");
assert.doesNotMatch(component, /localStorage|sessionStorage|URLSearchParams|window\.location|document\.cookie/, "download analytics must not read visitor data");
assert.match(component, /"article_resume_template"\s*\|\s*"resume_builder"/, "entries must be fixed in code");

for (const source of [articlePage, builderPage]) {
  assert.ok(source.includes("ResumeTemplateDownloadLink"), "both high-intent pages must expose the Word template");
}
for (const phrase of ["호주 이력서 양식 무료 다운로드", "Word·PDF", "A4 DOCX", "표·사진·그래픽 없이"]) {
  assert.ok(articles.includes(phrase), `article is missing acquisition phrase: ${phrase}`);
}
for (const phrase of ["Professional Summary", "Core Skills", "Employment Experience", "Education & Training", "Licences & Certifications"]) {
  assert.ok(generator.includes(phrase), `generator is missing required section: ${phrase}`);
}
assert.doesNotMatch(generator, /add_table|text_box|add_picture/, "ATS template must avoid tables, text boxes and images");
assert.ok(privacy.includes("`Resume Template Downloaded` | `entry`, `format`"), "privacy contract must document the fixed event");
assert.ok(packageSource.includes('"test:resume-template-download": "node scripts/check-australian-resume-template-download.mjs"'), "package test command is missing");

console.log("Australian resume template download contract passed.");
