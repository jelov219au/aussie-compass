import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
  beginResumeProDevicePurge,
  clearResumeProDeviceData,
  completeResumeProDevicePurge,
  resumeProApplicationsStorageKey,
  resumeProDraftStorageKey,
  resumeProStarStoriesStorageKey,
  resumeStorageKey,
} from "../src/lib/resumeProDeviceStorage.ts";

class MemoryStorage {
  #values = new Map();

  get length() { return this.#values.size; }
  key(index) { return [...this.#values.keys()][index] ?? null; }
  getItem(key) { return this.#values.get(key) ?? null; }
  setItem(key, value) { this.#values.set(key, String(value)); }
  removeItem(key) { this.#values.delete(key); }
}

const storage = new MemoryStorage();
for (const key of [
  resumeStorageKey,
  resumeProDraftStorageKey,
  resumeProApplicationsStorageKey,
  resumeProStarStoriesStorageKey,
  "aussie-compass-resume-v0",
  "hoju-compass-resume-pro-interview-v0",
]) storage.setItem(key, `private:${key}`);
storage.setItem("hoju-compass-reading-history-v1", "keep me");

const purgeEvents = new EventTarget();
const sessionStorage = new MemoryStorage();
let staleWriteAllowed = true;
const staleWrite = setTimeout(() => {
  if (staleWriteAllowed) storage.setItem(resumeProDraftStorageKey, "stale auto-save");
}, 10);
purgeEvents.addEventListener("hoju-compass:resume-pro-device-purge", () => {
  staleWriteAllowed = false;
  clearTimeout(staleWrite);
});
beginResumeProDevicePurge(sessionStorage, purgeEvents, 1_000);
assert.equal(completeResumeProDevicePurge(storage, sessionStorage, 2_000), true, "a fresh completed cookie release must authorize one local purge");
assert.equal(storage.getItem("hoju-compass-reading-history-v1"), "keep me", "unrelated local data must be preserved");
await new Promise((resolve) => setTimeout(resolve, 20));
assert.equal(storage.getItem(resumeProDraftStorageKey), null, "a late write must not expose the previous user after deletion");

storage.setItem(resumeStorageKey, JSON.stringify({ name: "New User" }));
assert.equal(completeResumeProDevicePurge(storage, sessionStorage, 3_000), false, "the one-time purge proof must be consumed on the redirect landing");
assert.match(storage.getItem(resumeStorageKey), /New User/, "new data created after deletion must survive a later workspace visit");

beginResumeProDevicePurge(sessionStorage, purgeEvents, 10_000);
assert.equal(completeResumeProDevicePurge(storage, sessionStorage, 30_000), false, "an expired purge proof must not delete newly created data");
assert.match(storage.getItem(resumeStorageKey), /New User/, "new data must survive an expired deletion request");

const emptyStorage = new MemoryStorage();
assert.deepEqual(clearResumeProDeviceData(emptyStorage), [], "empty browser storage must be safe to clear");

const privacyTools = await readFile(new URL("../src/components/tools/ResumeProDevicePrivacyTools.tsx", import.meta.url), "utf8");
const workspace = await readFile(new URL("../src/components/tools/ResumeProWorkspace.tsx", import.meta.url), "utf8");
const accessRoute = await readFile(new URL("../src/app/api/resume-pro/access/release/route.ts", import.meta.url), "utf8");
const resumePage = await readFile(new URL("../src/app/resume-pro/page.tsx", import.meta.url), "utf8");
const requestSecurity = await readFile(new URL("../src/lib/requestSecurity.ts", import.meta.url), "utf8");

for (const contract of [
  "접근만 해제 · 데이터 유지",
  "이 기기의 Resume Pro 데이터까지 삭제",
  "삭제한 내용은 복구할 수 없습니다",
  "disabled={!deleteConfirmed || deleting}",
  "접근 해제 + 이 기기 데이터 완전 삭제",
]) assert.ok(privacyTools.includes(contract), `device-deletion safety copy is missing: ${contract}`);

assert.ok(
  privacyTools.indexOf("await fetch") < privacyTools.indexOf("completeResumeProDevicePurge(window.localStorage, window.sessionStorage)"),
  "local data must only be purged after the cookie-release response succeeds",
);
assert.ok(privacyTools.includes('"X-Hoju-Compass-Mutation": "device-purge"'), "the cookie-release request must carry non-simple same-origin mutation proof");
assert.ok(accessRoute.includes("clearResumeProAccessCookie"), "the release route must expire the entitlement cookie");
assert.ok(accessRoute.indexOf("clearResumeProAccessCookie") < accessRoute.indexOf("{ released: true }"), "the device-purge API must clear the cookie before returning a non-redirecting success response");
assert.ok(accessRoute.includes('"Cache-Control": "no-store"'), "the device-purge success response must not be cached");
assert.ok(requestSecurity.includes('fetchSite !== "same-origin" && !explicitMutationProof'), "production mutations must require standard or explicit non-simple same-origin proof when Origin is omitted");
assert.ok(requestSecurity.includes('x-hoju-compass-mutation') && requestSecurity.includes('=== "device-purge"'), "only the allowlisted device-purge mutation proof may replace an omitted Origin");
assert.ok(requestSecurity.includes('if (origin && !explicitMutationProof)'), "proxy-rewritten Origin values may only be replaced by the non-simple device-purge proof");
assert.ok(requestSecurity.includes('new URL(origin).origin !== new URL(request.url).origin'), "origin validation must compare against the actual received request URL");
assert.ok(requestSecurity.includes('fetchSite === "cross-site"'), "cross-site mutations must remain rejected");
assert.ok(
  workspace.includes("window.addEventListener(resumeProDevicePurgeEventName, handleDevicePurge)"),
  "the active workspace must handle the current-tab purge event",
);
assert.ok(workspace.includes("[draftSaveTimerRef, applicationsSaveTimerRef, starStoriesSaveTimerRef]"), "all pending auto-save timers must be cancelled together");
assert.equal(workspace.match(/if \(!loaded \|\| purgingRef\.current\) return;/g)?.length, 3, "all auto-save paths must stay stopped for the purged page lifetime");
assert.ok(resumePage.includes('deviceData === "deleted"'), "the completed deletion must have a distinct confirmation message");

console.log("Resume Pro shared-device privacy contracts passed.");
