import assert from "node:assert/strict";
import { access, readFile, readdir } from "node:fs/promises";

const markdownFiles = (await readdir(new URL("../docs/", import.meta.url)))
  .filter((name) => name.endsWith(".md"))
  .map((name) => `docs/${name}`);
const referencePattern = /`(docs\/[A-Za-z0-9._/-]+\.(?:md|sql))`/g;
const missing = [];

for (const sourcePath of markdownFiles) {
  const source = await readFile(new URL(`../${sourcePath}`, import.meta.url), "utf8");
  for (const match of source.matchAll(referencePattern)) {
    try {
      await access(new URL(`../${match[1]}`, import.meta.url));
    } catch {
      missing.push(`${sourcePath} -> ${match[1]}`);
    }
  }
}

assert.deepEqual(missing, [], `internal operating documents contain missing references:\n${missing.join("\n")}`);

for (const requiredPath of [
  "docs/production-first-sale-readiness-audit-2026-08-24.md",
  "docs/live-payment-launch-checklist.md",
  "docs/first-payment-24-hour-operations-packet.md",
  "docs/first-sale-isolated-rehearsal.md",
  "docs/payment-alerts.md",
  "docs/accounting-reconciliation.md",
]) {
  await access(new URL(`../${requiredPath}`, import.meta.url));
}

console.log(`Document reference contract passed (${markdownFiles.length} operating documents checked).`);
