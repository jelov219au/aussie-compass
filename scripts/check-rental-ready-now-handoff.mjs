import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
  createRentalReadyNowHandoff,
  parseRentalReadyNowHandoff,
  rentalReadyNowHandoffLifetimeMs,
} from "../src/lib/rentalReadyNowHandoff.ts";

const now = Date.parse("2026-08-24T00:00:00.000Z");
const handoff = createRentalReadyNowHandoff({ propertyLabel: "  Carlton\n 후보 A  ", mode: "rent", reviewedCount: 18.9, concernCount: 3 }, now);
assert.deepEqual(handoff, { version: 1, propertyLabel: "Carlton 후보 A", mode: "rent", reviewedCount: 18, concernCount: 3, createdAt: now });
assert.equal(createRentalReadyNowHandoff({ propertyLabel: "Buy", mode: "buy", reviewedCount: 1, concernCount: 1 }, now), null, "purchase inspections must not enter a rental application");
assert.deepEqual(parseRentalReadyNowHandoff(JSON.stringify(handoff), now + rentalReadyNowHandoffLifetimeMs), handoff);
assert.equal(parseRentalReadyNowHandoff(JSON.stringify(handoff), now + rentalReadyNowHandoffLifetimeMs + 1), null, "handoffs must expire after 24 hours");
assert.equal(parseRentalReadyNowHandoff("not-json", now), null);

const freeTool = await readFile(new URL("../src/components/tools/PropertyInspectionChecklist.tsx", import.meta.url), "utf8");
const workspace = await readFile(new URL("../src/components/tools/RentalApplicationWorkspace.tsx", import.meta.url), "utf8");
assert.ok(freeTool.includes("rentalReadyNowHandoffStorageKey") && freeTool.includes("router.push(\"/rental-application-pro?from=property-inspection-checklist\")"), "free results must continue through the Rental introduction");
assert.ok(freeTool.includes("방문 메모와 세부 체크 결과는 옮기지 않습니다"), "the handoff must explain its privacy boundary");
assert.ok(workspace.includes("readRentalReadyNowHandoff") && workspace.includes("clearRentalReadyNowHandoff"), "the Pro workspace must consume the handoff once");
assert.ok(workspace.includes("didInitialiseRef.current") && workspace.includes("if (didInitialiseRef.current) return"), "React development checks must not replay and overwrite the imported handoff");
assert.ok(workspace.includes('stage: "inspected"') && workspace.includes("무료 집 방문 결과의 최소 정보만"), "the imported property must open as an inspected candidate");
assert.ok(!freeTool.includes("/api/checkout/rental-application-pro"), "the free result must never skip the product introduction");
assert.ok(!freeTool.includes("resume_pro") && !workspace.includes("resume_pro"), "the Rental handoff must not touch Resume Pro state");

console.log("Rental ready-now privacy-minimised handoff checks passed.");
