import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const page = await readFile(new URL("../src/app/leave-guide/page.tsx", import.meta.url), "utf8");

for (const phrase of [
  "Casual이라고 모든 휴가가 없는 것은 아닙니다",
  "가족·가정폭력 휴가",
  "Compassionate Leave",
  "Community Service Leave",
  "Parental Leave",
  "Long Service Leave",
  "승인, 지시, Cash out은 서로 다른 절차예요",
  "퇴사할 때 Annual leave와 Sick leave 처리는 달라요",
  "직장 Injury와 Sick leave는 같은 판단이 아니에요",
]) {
  assert.ok(page.includes(phrase), `leave guide is missing: ${phrase}`);
}

for (const question of [
  "Could you confirm my current leave balance in hours",
  "Please confirm whether my leave request has been approved",
  "What evidence is required under my award, agreement or workplace policy?",
  "Please provide the award or agreement clause",
  "Could you itemise the annual leave",
]) {
  assert.ok(page.includes(question) && page.includes("—"), `copy-ready leave question needs its Korean meaning: ${question}`);
}

assert.ok((page.match(/href: "https:\/\/www\.fairwork\.gov\.au/g) ?? []).length >= 11, "leave guide needs the full set of verified Fair Work entry points");
assert.ok(page.includes('href="/resources/australia-workplace-injury-workers-compensation-guide"'), "leave guide must separate sick leave from workers compensation");
assert.doesNotMatch(page, /createCheckout|stripe\.checkout|PAYMENTS_ENABLED|paymentReadiness/i, "leave content changes must remain outside payment flows");

console.log("LEAVE_GUIDE_DEPTH=PASS leave-types>=8 official-sources>=11 copy-questions=5");
