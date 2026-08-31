import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const page = await readFile(new URL("../src/app/help-directory/page.tsx", import.meta.url), "utf8");

for (const contact of [
  ["000", "infrastructure.gov.au/media-communications/phone/triple-zero/using-other-emergency-numbers"],
  ["13 11 14", "lifeline.org.au"],
  ["1800 022 222", "healthdirect"],
  ["13 11 26", "healthdirect.gov.au/swallowed-substances"],
  ["1800 737 732", "1800respect.org.au"],
  ["131 450", "tisnational.gov.au"],
  ["13 13 94", "fairwork.gov.au"],
  ["1800 007 007", "ndh.org.au"],
  ["온라인 신고", "scamwatch.gov.au"],
]) {
  assert.ok(page.includes(contact[0]) && page.toLowerCase().includes(contact[1]), `help directory is missing verified contact: ${contact[0]}`);
}

for (const phrase of [
  "즉시 생명·안전 위험",
  "중독 의심, 아직 의식 있음",
  "임의로 토하게 하지 마세요",
  "휴대폰이나 인터넷 사용이 감시될 수 있다면",
  "전화요금 명세",
]) assert.ok(page.includes(phrase), `help directory safety guidance is missing: ${phrase}`);

assert.doesNotMatch(page, /createCheckout|stripe\.checkout|PAYMENTS_ENABLED|paymentReadiness/i, "help directory changes must remain outside payment flows");

console.log("HELP_DIRECTORY_DEPTH=PASS verified-contacts=9 urgent-routing=true monitored-device-warning=true");
