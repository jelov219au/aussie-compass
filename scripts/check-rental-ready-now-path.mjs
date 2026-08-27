import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
  createRentalReadyNowImportReceipt,
  createRentalReadyNowHandoff,
  parseRentalReadyNowHandoff,
  rentalReadyNowHandoffLifetimeMs,
  rentalReadyNowHandoffStorageKey,
  rentalReadyNowReceiptMatches,
  readRentalReadyNowHandoff,
  readRentalReadyNowSavedFlag,
} from "../src/lib/rentalReadyNowHandoff.ts";

class MemoryStorage {
  #values = new Map();
  getItem(key) { return this.#values.get(key) ?? null; }
  setItem(key, value) { this.#values.set(key, String(value)); }
  removeItem(key) { this.#values.delete(key); }
}

const [offerPage, freePage, freeProject, freeTool, workspace, commerce] = await Promise.all([
  readFile(new URL("../src/app/rental-application-pro/page.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/app/property-inspection-checklist/page.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/components/tools/LocalProjectChecklist.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/components/tools/PropertyInspectionChecklist.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/components/tools/RentalApplicationWorkspace.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/lib/commerce.ts", import.meta.url), "utf8"),
]);

const now = Date.parse("2026-08-25T00:00:00.000Z");
const handoff = createRentalReadyNowHandoff({ propertyLabel: "  Carlton\n 후보 A  ", mode: "rent", reviewedCount: 18.9, concernCount: 30 }, now);
assert.deepEqual(handoff, { version: 1, propertyLabel: "Carlton 후보 A", mode: "rent", reviewedCount: 18, concernCount: 18, createdAt: now });
assert.equal(createRentalReadyNowHandoff({ propertyLabel: "Buy", mode: "buy", reviewedCount: 1, concernCount: 1 }, now), null, "purchase inspections must not enter a rental application");
assert.deepEqual(parseRentalReadyNowHandoff(JSON.stringify(handoff), now + rentalReadyNowHandoffLifetimeMs), handoff);
assert.equal(parseRentalReadyNowHandoff(JSON.stringify(handoff), now + rentalReadyNowHandoffLifetimeMs + 1), null, "handoffs must expire after 24 hours");
assert.equal(parseRentalReadyNowHandoff("not-json", now), null);
const expiredStorage = new MemoryStorage();
expiredStorage.setItem(rentalReadyNowHandoffStorageKey, JSON.stringify(handoff));
assert.equal(readRentalReadyNowHandoff(expiredStorage, now + rentalReadyNowHandoffLifetimeMs + 1), null);
assert.equal(expiredStorage.getItem(rentalReadyNowHandoffStorageKey), null, "an expired handoff must be physically removed when this browser next reads it");
const malformedStorage = new MemoryStorage();
malformedStorage.setItem(rentalReadyNowHandoffStorageKey, "not-json");
assert.equal(readRentalReadyNowHandoff(malformedStorage, now), null);
assert.equal(malformedStorage.getItem(rentalReadyNowHandoffStorageKey), null, "a malformed handoff must not remain on a shared browser");
const validStorage = new MemoryStorage();
validStorage.setItem(rentalReadyNowHandoffStorageKey, JSON.stringify(handoff));
assert.deepEqual(readRentalReadyNowHandoff(validStorage, now), handoff);
assert.notEqual(validStorage.getItem(rentalReadyNowHandoffStorageKey), null, "a valid handoff must remain available for its one-time import");
assert.doesNotThrow(() => readRentalReadyNowHandoff({
  getItem: () => JSON.stringify(handoff),
  removeItem: () => { throw new Error("blocked"); },
}, now + rentalReadyNowHandoffLifetimeMs + 1), "blocked cleanup must not break the workspace fallback");
for (const [invalidCreatedAt, observationTime] of [
  [String(now), now],
  [null, 0],
  [now + 0.5, now + 0.5],
  [Number.MAX_SAFE_INTEGER + 1, Number.MAX_SAFE_INTEGER + 1],
  [-1, -1],
]) {
  assert.equal(
    parseRentalReadyNowHandoff(JSON.stringify({ ...handoff, createdAt: invalidCreatedAt }), observationTime),
    null,
    `handoff timestamps must be non-negative safe integers: ${String(invalidCreatedAt)}`,
  );
}
for (const invalidNow of [Number.NaN, Number.POSITIVE_INFINITY, -1, now + 0.5, Number.MAX_SAFE_INTEGER + 1]) {
  assert.equal(
    createRentalReadyNowHandoff({ propertyLabel: "Invalid timestamp", mode: "rent", reviewedCount: 1, concernCount: 0 }, invalidNow),
    null,
    "handoff creation must not emit a timestamp that cannot survive an idempotent receipt round trip",
  );
}
const receipt = createRentalReadyNowImportReceipt(handoff);
assert.equal(rentalReadyNowReceiptMatches(receipt, handoff), true, "a persisted receipt must make a failed handoff cleanup retry idempotent");
assert.equal(rentalReadyNowReceiptMatches({ ...receipt, sourceCreatedAt: now + 1 }, handoff), false, "a later handoff must remain importable");
assert.equal(rentalReadyNowReceiptMatches({ mode: "rent", reviewedCount: 18, concernCount: 18 }, handoff), false, "legacy summaries without a receipt must not hide a new handoff");
assert.equal(readRentalReadyNowSavedFlag({ getItem: () => "saved" }, "first-success"), true);
assert.equal(readRentalReadyNowSavedFlag({ getItem: () => { throw new Error("blocked after successful import"); } }, "first-success"), false, "a later status read failure must not escape and replace a successful or duplicate-import message");

const closedStart = offerPage.indexOf(") : (", offerPage.indexOf("{checkoutAvailable ? ("));
const closedEnd = offerPage.indexOf(")}", closedStart);
assert.ok(closedStart >= 0 && closedEnd > closedStart, "the unavailable Rental state needs a dedicated ready-now branch");
const closedBranch = offerPage.slice(closedStart, closedEnd);

for (const contract of [
  'href="/property-inspection-checklist#house-hunt-project"',
  "무료로 다음 행동 저장하기",
  'href="/property-inspection-checklist"',
  "방문 체크리스트 사용",
]) assert.ok(closedBranch.includes(contract), `the unavailable Rental action path is missing: ${contract}`);

const projectAction = closedBranch.indexOf('href="/property-inspection-checklist#house-hunt-project"');
const inspectionAction = closedBranch.indexOf('href="/property-inspection-checklist"');
assert.ok(projectAction >= 0 && projectAction < inspectionAction, "the working saved project must precede the generic checklist in mobile and DOM order");
assert.equal((closedBranch.match(/min-h-12/g) ?? []).length, 2, "both ready-now Rental actions need 48px mobile targets");
assert.doesNotMatch(closedBranch, /유료 검증 준비 중|disabled|checkout|결제 시작/, "the closed state must not present a disabled or paid dead end as an action");

assert.ok(freePage.includes('id="house-hunt-project"') && freePage.includes('className="mt-10 scroll-mt-24"'), "the direct free-project link needs a stable, offset destination");
assert.ok(freePage.indexOf('id="house-hunt-project"') < freePage.indexOf('<LocalProjectChecklist storageKey="house-hunt-project"'), "the destination must wrap the working project checklist");
for (const capability of [
  "localStorage.getItem(storageKey)",
  "localStorage.setItem(storageKey",
  "checked, targetDate",
  "캘린더 리마인더 받기",
]) assert.ok(freeProject.includes(capability), `the promoted free project is missing its working capability: ${capability}`);

assert.ok(offerPage.includes("Rental Pack 결제는 아직 열리지 않았어요."), "the free-first state must remain explicit that payment is unavailable");
assert.ok(offerPage.includes("지원·계약·입주 체크 상태와 목표일을 현재 브라우저에 저장"), "the landing must name the immediate free result accurately");
assert.ok(!offerPage.includes("후보 비교부터 지원·계약·입주까지 체크 상태와 목표일을 현재 브라우저에 저장"), "the landing must not overstate candidate storage or comparison");
assert.ok(offerPage.includes("A$14.90"), "the displayed Rental price must remain unchanged");
assert.ok(offerPage.includes("paymentReadiness.ready || testCheckoutAvailable"), "the Rental checkout readiness switch must remain unchanged");
assert.ok(commerce.includes("RENTAL_APPLICATION_PRO_PAYMENTS_ENABLED"), "the Rental checkout kill switch must remain fail-closed");
assert.ok(freeTool.includes("rentalReadyNowHandoffStorageKey") && freeTool.includes("router.push(\"/rental-application-pro?from=property-inspection-checklist\")"), "free results must continue through the Rental introduction");
assert.ok(freeTool.includes("방문 메모와 세부 체크 결과는 옮기지 않습니다"), "the handoff must explain its privacy boundary");
assert.ok(workspace.includes("readRentalReadyNowHandoff") && workspace.includes("clearRentalReadyNowHandoff"), "the Pro workspace must consume the handoff once");
assert.ok(workspace.includes("inspectionSummary") && workspace.includes("방문 메모와 세부 체크 결과는 가져오지 않았습니다"), "the workspace must retain only the aggregate inspection summary");
const importedHandoffBlock = workspace.slice(workspace.indexOf("if (importedHandoff)"));
assert.ok(importedHandoffBlock.indexOf("window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextWorkspace))") < importedHandoffBlock.indexOf("clearRentalReadyNowHandoff(window.localStorage)"), "the imported result must persist before its one-time handoff is cleared");
assert.ok(workspace.includes("rentalReadyNowReceiptMatches") && workspace.indexOf("const handoffAlreadyImported") < workspace.indexOf("nextWorkspace.packs.length < MAX_PACKS"), "a cleanup retry must deduplicate before applying the six-candidate limit");
assert.ok(workspace.includes("The persisted import receipt makes a later retry idempotent"), "handoff cleanup failure must not abort the imported workspace state");
assert.ok(workspace.includes("readRentalReadyNowSavedFlag(window.localStorage, FIRST_SUCCESS_KEY)"), "a later first-success read failure must not overwrite a completed or duplicate import status");
assert.ok(workspace.includes("무료 방문 결과 원본은 삭제하지 않았습니다"), "a workspace storage failure must explain that the retry source was preserved without exposing an internal handoff term");
assert.ok(!freeTool.includes("/api/checkout/rental-application-pro"), "the free result must never skip the product introduction");
assert.ok(!freeTool.includes("resume_pro") && !workspace.includes("resume_pro"), "the Rental handoff must not touch Resume Pro state");

console.log("Rental Pack ready-now free project and privacy-minimised Pro handoff contracts passed.");
