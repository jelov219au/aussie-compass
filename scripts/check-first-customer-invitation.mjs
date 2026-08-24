import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { isFirstCustomerGoCurrent } from "../src/lib/firstCustomerLaunchPolicy.ts";

const page = readFileSync("src/app/first-customer-invitation/page.tsx", "utf8");
const desk = readFileSync("src/components/tools/FirstCustomerInvitationDesk.tsx", "utf8");
const decision = readFileSync("src/lib/firstCustomerLaunchDecision.ts", "utf8");
const policy = readFileSync("src/lib/firstCustomerLaunchPolicy.ts", "utf8");
const request = readFileSync("src/components/tools/ResumeProLaunchInterestLink.tsx", "utf8");
const boundaries = readFileSync("scripts/check-public-boundaries.mjs", "utf8");
const checklist = readFileSync("docs/live-payment-launch-checklist.md", "utf8");
const productionAudit = readFileSync("docs/production-first-sale-readiness-audit-2026-08-24.md", "utf8");
const compactProductionAudit = productionAudit.replace(/\s+/g, " ");

const errors = [];
const requireText = (source, text, label) => {
  if (!source.includes(text)) errors.push(`${label}: missing ${JSON.stringify(text)}`);
};

requireText(page, "requireLocalOperatorAccess();", "operator access");
requireText(page, "robots: { index: false, follow: false }", "search boundary");
requireText(page, "이 화면에는 고객 이름, 이메일, 이력서나 공고 내용을 입력하거나 저장하지 않습니다.", "privacy boundary");
requireText(desk, '"use client";', "client boundary");
requireText(desk, "checks.every", "all-confirmed gate");
requireText(desk, "isFirstCustomerGoCurrent(decision, clock)", "time-limited audited release gate");
requireText(desk, "isFirstCustomerGoCurrent(decision, Date.now())", "copy-time release recheck");
requireText(desk, "const copyAllowed = releaseGateOpen && allConfirmed;", "combined copy gate");
requireText(desk, "disabled={!copyAllowed}", "disabled copy gate");
requireText(desk, "disabled={!releaseGateOpen}", "disabled checklist gate");
requireText(desk, "navigator.clipboard.writeText(invitation)", "clipboard-only action");
requireText(desk, "https://hojucompass.com/resume-pro", "official product URL");
requireText(desk, "두 번째 알림을 보내지 않기로 확인했습니다.", "no-reminder rule");
requireText(desk, "15분·24시간·첫 정산 증거 확인", "post-payment evidence");
requireText(desk, "데이터베이스 gate를 동시성 판단 기준", "database authority");
requireText(desk, "개인 초대·추적 정보가 없는 공개 채용 공고 링크", "operator public-job-ad boundary");
requireText(desk, "window.setInterval(updateClock, 15_000)", "automatic GO expiry clock");
requireText(desk, "GO 만료 잠금", "expired GO state");
requireText(desk, 'aria-live="polite"', "expiry status announcement");
for (const field of [
  "지원하려는 직무:",
  "지원 마감일(YYYY-MM-DD, 모르면 미정):",
  "공개 채용 공고 링크(있다면, 개인 초대·추적 링크 제외):",
  "무료 이력서 경력 초안: 있음 / 아직 없음",
]) requireText(request, field, "customer qualification request");
requireText(request, "이력서 원문, 회사 내부정보, 여권·비자·TFN·주소·생년월일 또는 결제정보는 보내지 마세요.", "request privacy boundary");
requireText(checklist, "Opt-in first-customer invitation", "source checklist");
for (const boundary of ["canonical UTC `approvedAt`", "`validUntil` timestamps no more than 60 minutes apart", "automatically relocks at expiry", "repeat the strict audit instead of extending the old decision"]) {
  requireText(checklist, boundary, "time-limited owner approval runbook");
}
requireText(page, "decision={firstCustomerLaunchDecision}", "server decision handoff");
requireText(decision, 'status: "no_go"', "current Production decision");
requireText(decision, 'auditedAt: "2026-08-24"', "decision evidence date");
requireText(decision, "approvedAt: null", "NO-GO approval boundary");
requireText(decision, "validUntil: null", "NO-GO expiry boundary");
requireText(decision, 'import "server-only";', "server-only decision source");
for (const boundary of [
  "firstCustomerGoWindowMs = 60 * 60 * 1000",
  "utcTimestampPattern",
  "!Number.isFinite(now)",
  'decision.status !== "go"',
  "decision.blockers.length > 0",
  "approvedAt > now",
  "validUntil <= now",
  "validUntil - approvedAt <= firstCustomerGoWindowMs",
]) requireText(policy, boundary, "time-limited GO policy");

const baseGo = {
  status: "go",
  auditedAt: "2026-08-24",
  approvedAt: "2026-08-24T00:00:00.000Z",
  validUntil: "2026-08-24T01:00:00.000Z",
  blockers: [],
};
assert.equal(isFirstCustomerGoCurrent(baseGo, Date.parse("2026-08-24T00:30:00.000Z")), true, "a blocker-free GO inside its one-hour window should open");
assert.equal(isFirstCustomerGoCurrent(baseGo, Date.parse("2026-08-24T01:00:00.000Z")), false, "GO must close exactly at expiry");
assert.equal(isFirstCustomerGoCurrent({ ...baseGo, blockers: ["fixture"] }, Date.parse("2026-08-24T00:30:00.000Z")), false, "any blocker must keep GO closed");
assert.equal(isFirstCustomerGoCurrent({ ...baseGo, approvedAt: "2026-08-24T00:31:00.000Z" }, Date.parse("2026-08-24T00:30:00.000Z")), false, "a future approval time must fail closed");
assert.equal(isFirstCustomerGoCurrent({ ...baseGo, validUntil: "2026-08-24T01:00:00.001Z" }, Date.parse("2026-08-24T00:30:00.000Z")), false, "a GO window longer than one hour must fail closed");
assert.equal(isFirstCustomerGoCurrent({ ...baseGo, approvedAt: null }, Date.parse("2026-08-24T00:30:00.000Z")), false, "GO without an approval time must fail closed");
assert.equal(isFirstCustomerGoCurrent({ ...baseGo, approvedAt: "2026-08-24T00:00:00+00:00" }, Date.parse("2026-08-24T00:30:00.000Z")), false, "GO timestamps must use the canonical UTC format");
assert.equal(isFirstCustomerGoCurrent(baseGo, Number.NaN), false, "an invalid operator clock must fail closed");
if ((decision.match(/^    "/gm) ?? []).length !== 7) errors.push("current NO-GO decision must enumerate seven known blockers");
for (const [decisionMarker, evidenceSource, evidenceMarker] of [
  ["Production post-migration", compactProductionAudit, "Production functional rehearsal is still missing"],
  ["live runtime key", compactProductionAudit, "proven live restricted runtime key"],
  ["Neon endpoint pin", compactProductionAudit, "missing strict-audit Neon endpoint pin"],
  ["실 SMTP", compactProductionAudit, "Real SMTP transport proof is still missing"],
  ["Managed Payments Checkout·영수증", compactProductionAudit, "Managed Payments Checkout and every receipt/invoice actually issued"],
  ["등록 세무사", compactProductionAudit, "registered tax agent"],
  ["accounting preflight", checklist, ".\\scripts\\run-accounting-preflight.ps1"],
]) {
  requireText(decision, decisionMarker, "audited blocker decision");
  requireText(evidenceSource, evidenceMarker, "audited blocker evidence");
}
requireText(checklist, "[x] Add `support@hojucompass.com` as the Stripe live business-profile support email", "verified Stripe support email evidence");
requireText(boundaries, '["/first-customer-invitation", "src/app/first-customer-invitation/page.tsx"]', "operator route registry");
requireText(boundaries, '"src/components/tools/FirstCustomerInvitationDesk.tsx"', "operator file registry");

for (const forbidden of ["fetch(", "<form", "localStorage", "sessionStorage", "checkout.stripe.com", "stripe.com/pay", 'type="email"', 'name="email"', 'name="recipient"']) {
  if (desk.includes(forbidden)) errors.push(`invitation desk must not contain ${JSON.stringify(forbidden)}`);
}

if ((desk.match(/type="checkbox"/g) ?? []).length !== 1 || !desk.includes("checks.map")) {
  errors.push("invitation desk must render the fixed confirmation checklist");
}

if (errors.length) {
  console.error("First-customer invitation contract failed:\n");
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log("First-customer invitation remains operator-only, opt-in, clipboard-only and gated by every launch confirmation.");
