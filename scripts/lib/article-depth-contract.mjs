import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

// The Aug 31 audit has 35 canonical resources after the public-holiday merge.
// Two Sep 3 imported articles extend that catalog; imports do not bypass depth.
const audit = readFileSync(new URL("../../docs/content-depth-audit-2026-08-31.md", import.meta.url), "utf8");
const auditedSlugs = [...new Set([...audit.matchAll(/^- `([a-z0-9]+(?:-[a-z0-9]+)+)`\r?$/gm)].map(match => match[1]))];
assert.equal(auditedSlugs.length, 35, "historical resource audit changed; reconcile the explicit catalog baseline");
const expectedSlugs = [...auditedSlugs, "used-car-inspection-report-next-steps", "rental-inspection-to-application-guide"].sort();

export function validateArticleDepth(articles) {
  assert.deepEqual(articles.map(article => article.slug).sort(), expectedSlugs, "the complete runtime resource catalog must match the audited 35 plus the two reviewed imports");
  let totalSections = 0, totalSources = 0;
  for (const article of articles) {
    const substantive = article.sections.filter(section => typeof section.heading === "string" && section.heading.trim()
      && [...(section.paragraphs ?? []), ...(section.bullets ?? [])].some(text => typeof text === "string" && text.trim()));
    assert.ok(substantive.length >= 6, `${article.slug} needs at least six substantive sections`);
    const sources = article.sources ?? [];
    assert.ok(new Set(sources.map(source => source.href)).size >= 3, `${article.slug} needs at least three distinct official source entry points`);
    totalSections += article.sections.length; totalSources += sources.length;
  }
  return { articleCount: articles.length, totalSections, totalSources };
}
