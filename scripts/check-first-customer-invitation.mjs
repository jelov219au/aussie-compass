import { readFileSync } from "node:fs";

const page = readFileSync("src/app/first-customer-invitation/page.tsx", "utf8");
const desk = readFileSync("src/components/tools/FirstCustomerInvitationDesk.tsx", "utf8");
const boundaries = readFileSync("scripts/check-public-boundaries.mjs", "utf8");
const checklist = readFileSync("docs/live-payment-launch-checklist.md", "utf8");

const errors = [];
const requireText = (source, text, label) => {
  if (!source.includes(text)) errors.push(`${label}: missing ${JSON.stringify(text)}`);
};

requireText(page, "requireLocalOperatorAccess();", "operator access");
requireText(page, "robots: { index: false, follow: false }", "search boundary");
requireText(page, "이 화면에는 고객 이름, 이메일, 이력서나 공고 내용을 입력하거나 저장하지 않습니다.", "privacy boundary");
requireText(desk, '"use client";', "client boundary");
requireText(desk, "checks.every", "all-confirmed gate");
requireText(desk, "disabled={!allConfirmed}", "disabled copy gate");
requireText(desk, "navigator.clipboard.writeText(invitation)", "clipboard-only action");
requireText(desk, "https://hojucompass.com/resume-pro", "official product URL");
requireText(desk, "두 번째 알림을 보내지 않기로 확인했습니다.", "no-reminder rule");
requireText(desk, "15분·24시간·첫 정산 증거 확인", "post-payment evidence");
requireText(desk, "데이터베이스 gate를 동시성 판단 기준", "database authority");
requireText(checklist, "Opt-in first-customer invitation", "source checklist");
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
