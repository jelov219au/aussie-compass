import fs from "node:fs";

const llmsRoute = fs.readFileSync("src/app/llms.txt/route.ts", "utf8");
const robots = fs.readFileSync("src/app/robots.ts", "utf8");

const requiredLlmsFragments = [
  '"/resume-builder"',
  '"/resume-job-ad-checker"',
  '"/resume-pro"',
  '"/resources/australia-resume-template-submission-checklist"',
  '"/resources/australia-cover-letter-job-ad-checklist"',
  "current price and availability",
  "do not require Resume Pro",
  "not an Australian government service",
  "text/plain; charset=utf-8",
];

for (const fragment of requiredLlmsFragments) {
  if (!llmsRoute.includes(fragment)) {
    throw new Error(`AI discovery contract is missing: ${fragment}`);
  }
}

for (const publicPath of ['"/llms.txt"']) {
  if (!robots.includes(publicPath)) {
    throw new Error(`robots.ts does not explicitly allow ${publicPath}`);
  }
}

for (const privatePath of [
  '"/api/"',
  '"/resume-pro/restore"',
  '"/resume-pro/success"',
  '"/resume-pro/workspace"',
]) {
  if (!robots.includes(privatePath)) {
    throw new Error(`robots.ts does not protect ${privatePath}`);
  }
}

if (/\b(?:A\$|AUD)\s*\d/i.test(llmsRoute)) {
  throw new Error("llms.txt must defer price and availability to the canonical product page.");
}

console.log("AI discovery and crawler-boundary contract passed.");
