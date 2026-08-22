import { randomBytes } from "node:crypto";
import { writeFile } from "node:fs/promises";
import webpush from "web-push";

const outputPath = ".env.push.local";
const vapid = webpush.generateVAPIDKeys();
const cronSecret = randomBytes(32).toString("base64url");
const contents = [
  "# Generated locally for Hoju Compass Web Push. Never commit or share this file.",
  "PUSH_REMINDERS_ENABLED=true",
  `NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY=${vapid.publicKey}`,
  `WEB_PUSH_PRIVATE_KEY=${vapid.privateKey}`,
  "WEB_PUSH_SUBJECT=mailto:support@hojucompass.com",
  `CRON_SECRET=${cronSecret}`,
  "",
].join("\n");

try {
  await writeFile(outputPath, contents, { encoding: "utf8", flag: "wx", mode: 0o600 });
  console.log(`Created ${outputPath}. Its values were not printed.`);
} catch (error) {
  if (error && typeof error === "object" && "code" in error && error.code === "EEXIST") {
    console.error(`${outputPath} already exists. Refusing to overwrite the active key pair.`);
    process.exitCode = 1;
  } else {
    throw error;
  }
}
