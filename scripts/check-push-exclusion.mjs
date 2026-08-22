import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";

const excludedRuntimePaths = [
  "src/app/api/push/reminders/route.ts",
  "src/app/api/push/subscriptions/route.ts",
  "src/app/api/cron/push-reminders/route.ts",
  "docs/push-reminder-storage.sql",
  "src/lib/pushReminderStore.ts",
  "src/lib/webPush.ts",
];

async function exists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function optionalFile(path) {
  try {
    return await readFile(path, "utf8");
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") return "";
    throw error;
  }
}

const packageJson = JSON.parse(await readFile("package.json", "utf8"));
const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
const vercelConfig = await optionalFile("vercel.json");

for (const path of excludedRuntimePaths) {
  assert.equal(await exists(path), false, `First-payment release must not include push runtime: ${path}`);
}

assert.equal("web-push" in dependencies, false, "First-payment release must not install the Web Push library");
assert.equal(vercelConfig.includes("/api/cron/push-reminders"), false, "First-payment release must not schedule the push cron");
assert.equal("test:push-reminders" in packageJson.scripts, false, "The gate name must not imply that push delivery is included");
assert.equal("test:push-contract" in packageJson.scripts, false, "The deferred push-delivery contract must not enter this release");

console.log("Push routes, libraries, DDL, cron, dependencies, and delivery contracts remain excluded.");
