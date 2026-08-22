import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";

const projectRoot = process.cwd();
const sourceRoot = path.join(projectRoot, "src");

const operatorRoutes = new Map([
  ["/campaign-link-builder", "src/app/campaign-link-builder/page.tsx"],
  ["/content-performance", "src/app/content-performance/page.tsx"],
  ["/content-planner", "src/app/content-planner/page.tsx"],
  ["/resume-pro-performance", "src/app/resume-pro-performance/page.tsx"],
  ["/social-card-maker", "src/app/social-card-maker/page.tsx"],
]);

const operatorOnlyFiles = new Set([
  ...operatorRoutes.values(),
  "src/components/tools/CampaignLinkBuilder.tsx",
  "src/components/tools/ContentPerformanceTracker.tsx",
  "src/components/tools/ContentPublishingPlanner.tsx",
  "src/components/tools/SocialCardMaker.tsx",
  "src/app/api/resume-pro-performance/connection/route.ts",
  "src/lib/resumeProPerformance.ts",
]);

function toProjectPath(filePath) {
  return path.relative(projectRoot, filePath).replaceAll("\\", "/");
}

function collectSourceFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const filePath = path.join(directory, entry.name);
    if (entry.isDirectory()) return collectSourceFiles(filePath);
    return /\.(?:ts|tsx)$/.test(entry.name) ? [filePath] : [];
  });
}

const errors = [];

for (const ignoreFile of [".gitignore", ".vercelignore"]) {
  const ignoredPaths = readFileSync(path.join(projectRoot, ignoreFile), "utf8")
    .split(/\r?\n/)
    .map((line) => line.trim().replace(/^\//, "").replace(/\/$/, ""));

  for (const privateDirectory of ["outputs", "private"]) {
    if (!ignoredPaths.includes(privateDirectory)) {
      errors.push(`${ignoreFile}: /${privateDirectory}/ must remain excluded from source and deployment uploads`);
    }
  }
}

for (const [route, pageFile] of operatorRoutes) {
  const source = readFileSync(path.join(projectRoot, pageFile), "utf8");
  if (!source.includes("requireLocalOperatorAccess();")) {
    errors.push(`${pageFile}: ${route} must call requireLocalOperatorAccess()`);
  }
  if (!/robots:\s*\{\s*index:\s*false,\s*follow:\s*false\s*\}/s.test(source)) {
    errors.push(`${pageFile}: ${route} must remain noindex, nofollow`);
  }
}

for (const filePath of collectSourceFiles(sourceRoot)) {
  const projectPath = toProjectPath(filePath);
  if (operatorOnlyFiles.has(projectPath)) continue;

  const source = readFileSync(filePath, "utf8");
  for (const route of operatorRoutes.keys()) {
    if (source.includes(route)) {
      errors.push(`${projectPath}: public source must not link to operator route ${route}`);
    }
  }
}

if (errors.length) {
  console.error("Operator/public boundary check failed:\n");
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log("Operator-only tools are hidden from public surfaces and protected in production.");
