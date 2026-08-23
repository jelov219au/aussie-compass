import { readFileSync } from "node:fs";

const page = readFileSync("src/app/first-customer-invitation/page.tsx", "utf8");
const desk = readFileSync("src/components/tools/FirstCustomerInvitationDesk.tsx", "utf8");
const decision = readFileSync("src/lib/firstCustomerLaunchDecision.ts", "utf8");
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
requireText(desk, 'const releaseGateOpen = decision.status === "go";', "audited release gate");
requireText(desk, "const copyAllowed = releaseGateOpen && allConfirmed;", "combined copy gate");
requireText(desk, "disabled={!copyAllowed}", "disabled copy gate");
requireText(desk, "disabled={!releaseGateOpen}", "disabled checklist gate");
requireText(desk, "navigator.clipboard.writeText(invitation)", "clipboard-only action");
requireText(desk, "https://hojucompass.com/resume-pro", "official product URL");
requireText(desk, "두 번째 알림을 보내지 않기로 확인했습니다.", "no-reminder rule");
requireText(desk, "15분·24시간·첫 정산 증거 확인", "post-payment evidence");
requireText(desk, "데이터베이스 gate를 동시성 판단 기준", "database authority");
requireText(desk, "개인 초대·추적 정보가 없는 공개 채용 공고 링크", "operator public-job-ad boundary");
for (const field of [
  "지원하려는 직무:",
  "지원 마감일(YYYY-MM-DD, 모르면 미정):",
  "공개 채용 공고 링크(있다면, 개인 초대·추적 링크 제외):",
  "무료 이력서 경력 초안: 있음 / 아직 없음",
]) requireText(request, field, "customer qualification request");
requireText(request, "이력서 원문, 회사 내부정보, 여권·비자·TFN·주소·생년월일 또는 결제정보는 보내지 마세요.", "request privacy boundary");
requireText(checklist, "Opt-in first-customer invitation", "source checklist");
requireText(page, "decision={firstCustomerLaunchDecision}", "server decision handoff");
requireText(decision, 'status: "no_go"', "current Production decision");
requireText(decision, 'auditedAt: "2026-08-24"', "decision evidence date");
requireText(decision, 'import "server-only";', "server-only decision source");
if ((decision.match(/^    "/gm) ?? []).length !== 8) errors.push("current NO-GO decision must enumerate eight known blockers");
for (const [decisionMarker, evidenceSource, evidenceMarker] of [
  ["Production post-migration", compactProductionAudit, "Production functional rehearsal is still missing"],
  ["공개 support email", compactProductionAudit, "business-profile support email is absent"],
  ["live runtime key", compactProductionAudit, "proven live restricted runtime key"],
  ["Neon endpoint pin", compactProductionAudit, "missing strict-audit Neon endpoint pin"],
  ["실 SMTP", compactProductionAudit, "Real SMTP transport proof is still missing"],
  ["Managed Payments Checkout·영수증", compactProductionAudit, "Managed Payments Checkout and issued receipt/invoice wording"],
  ["등록 세무사", compactProductionAudit, "registered tax agent"],
  ["accounting preflight", checklist, ".\\scripts\\run-accounting-preflight.ps1"],
]) {
  requireText(decision, decisionMarker, "audited blocker decision");
  requireText(evidenceSource, evidenceMarker, "audited blocker evidence");
}
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
