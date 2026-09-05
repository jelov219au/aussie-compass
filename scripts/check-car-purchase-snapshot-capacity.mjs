import assert from "node:assert/strict";
import * as car from "../src/lib/carPurchasePro.ts";

let checks = 0;
const candidate = car.emptyCarCandidate("complete-candidate");
Object.assign(candidate, { alias: "차".repeat(80), inspectionNote: "검".repeat(1000), reason: "이".repeat(1000), handoverNote: "인".repeat(1000) });
candidate.issues = Array.from({ length: car.maxCarIssues }, (_, index) => {
  const issue = car.emptyCarIssue(`issue-${index}`);
  for (const key of ["title", "source", "reply", "question", "evidence", "recheckNote"]) issue[key] = "가".repeat(1000);
  return issue;
});
const draft = { candidates: [candidate], snapshots: [] };
assert.equal(car.validCarDraft(draft), true); checks++;
const originalJson = car.serializeCarDraft(draft), rendered = car.carCandidateText(candidate);
assert(rendered.length > 80000, "This supported input must exercise the former snapshot limit"); checks++;
const saved = car.addCarSnapshot(draft, candidate, "snapshot-one", "2026-09-04T04:00:00.000Z");
const serialized = car.serializeCarDraft(saved);
assert.deepEqual(car.parseCarArchive(serialized), saved);
assert.equal(saved.snapshots[0].text, rendered);
assert.equal(car.serializeCarDraft(draft), originalJson); checks++;
// JSON/device storage and the human-readable export all preserve the whole text.
let local = null;
const storage = () => ({ getItem: () => local, setItem: (key, value) => { assert.equal(key, car.carPurchaseStorageKey); local = value; } });
assert.equal(car.saveCarDraft(storage, saved, null).kind, "saved");
assert.deepEqual(car.readCarDraft(storage).draft, saved);
assert(car.carDraftText(saved).includes(rendered)); checks++;
const changed = { ...candidate, inspectionNote: "later edit", issues: [] };
assert.equal({ ...saved, candidates: [changed] }.snapshots[0].text, rendered); checks++;
// Longer snapshots must still respect the existing total UTF-8 archive cap.
const another = car.addCarSnapshot(saved, candidate, "snapshot-two", "2026-09-04T05:00:00.000Z");
assert.throws(() => car.serializeCarDraft(another), /1MB/);
assert.equal(car.serializeCarDraft(saved), serialized); checks++;
const oversizedText = { ...saved, snapshots: [{ ...saved.snapshots[0], text: "x".repeat(car.carArchiveMaxBytes + 1) }] };
assert.equal(car.validCarDraft(oversizedText), false); checks++;
console.log(JSON.stringify({ status: "PASS", checks, snapshotCharacters: rendered.length,
  archiveBytes: new TextEncoder().encode(serialized).byteLength, noTruncation: true, browserAndPwa: "NOT_RUN" }));
