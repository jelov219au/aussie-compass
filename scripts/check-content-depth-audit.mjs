import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const articles = await readFile(new URL("../src/data/articles.ts", import.meta.url), "utf8");
const audit = await readFile(new URL("../docs/content-depth-audit-2026-08-31.md", import.meta.url), "utf8");
const standard = await readFile(new URL("../docs/content-depth-standard.md", import.meta.url), "utf8");
const slugs = [...articles.matchAll(/slug: "([^"]+)"/g)].map((match) => match[1]);

assert.equal(slugs.length, 36, "content audit baseline must match the current resource count");
for (const slug of slugs) assert.ok(audit.includes(`\`${slug}\``), `content audit is missing resource: ${slug}`);

for (const route of [
  "/minimum-wage-guide", "/award-guide", "/casual-loading-guide", "/payslip-guide", "/underpayment-guide", "/leave-guide", "/super-guide",
  "/tax-return-guide", "/arrival-checklist", "/moving-checklist", "/visa-preparation-guide", "/leaving-australia-guide", "/help-directory",
  "/property-inspection-checklist", "/public-transport-guide", "/overseas-driver-licence-guide", "/used-car-comparison",
]) assert.ok(audit.includes(`\`${route}\``), `content audit is missing standalone guide: ${route}`);

assert.ok(standard.includes("리소스 글 36개") && standard.includes("378개 섹션과 235개 출처"), "content depth standard baseline is stale");
assert.ok(audit.includes("주의사항과 함께 호환") && audit.includes("설치형 PWA"), "audit must record cross-surface compatibility");
assert.ok(audit.includes("추가 고위험 콘텐츠 공백은 없다"), "audit must state the completion threshold");

console.log("CONTENT_DEPTH_AUDIT=PASS resources=36 standalone-guides=17 baseline=378/235");
