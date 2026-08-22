import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const [client, subscriptions, reminders, cron, worker, privacy, schedule] = await Promise.all([
  readFile("src/components/tools/PushReminderManager.tsx", "utf8"),
  readFile("src/app/api/push/subscriptions/route.ts", "utf8"),
  readFile("src/app/api/push/reminders/route.ts", "utf8"),
  readFile("src/app/api/cron/push-reminders/route.ts", "utf8"),
  readFile("public/sw.js", "utf8"),
  readFile("src/app/privacy/page.tsx", "utf8"),
  readFile("vercel.json", "utf8"),
]);

assert.match(client, /map\(\(\{ id, title, category, date, leadDays \}\)/, "Push sync must omit reminder notes.");
assert.doesNotMatch(client, /JSON\.stringify\([^)]*note/, "Push requests must not serialize notes.");
assert.match(subscriptions, /validateSameOriginMutation/, "Subscription mutations must check same-origin requests.");
assert.match(subscriptions, /allowedHost/, "Push endpoints must use an allowlist.");
assert.match(subscriptions, /시험 알림/, "New subscriptions must be verified with a welcome notification.");
assert.match(reminders, /body\.reminders\.length > 50/, "Server reminder count must be bounded.");
assert.match(cron, /timingSafeEqual/, "Cron authentication must use constant-time comparison.");
assert.match(cron, /status === 404 \|\| status === 410/, "Expired push endpoints must be removed.");
assert.match(worker, /addEventListener\("push"/, "The service worker must display push messages.");
assert.match(worker, /!message\.url\.startsWith\("\/\/"\)/, "Notification URLs must stay same-origin.");
assert.match(privacy, /선택형 푸시 리마인더/, "Privacy copy must disclose optional push processing.");
assert.equal(JSON.parse(schedule).crons[0].path, "/api/cron/push-reminders");

console.log("Push-reminder privacy and security contract passed.");
