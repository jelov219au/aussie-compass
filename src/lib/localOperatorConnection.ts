import "server-only";

import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const localEnvPath = path.join(process.cwd(), ".env.local");
type SupportedKey =
  | "VERCEL_TOKEN"
  | "VERCEL_PROJECT_ID"
  | "VERCEL_TEAM_ID"
  | "STRIPE_ACCOUNTING_KEY"
  | "STRIPE_PERFORMANCE_KEY";

function parseEnvFile(contents: string) {
  const values = new Map<string, string>();
  for (const line of contents.split(/\r?\n/)) {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (match) values.set(match[1], match[2].trim());
  }
  return values;
}

async function readLocalEnvFile() {
  if (process.env.NODE_ENV === "production") return "";
  try {
    return await readFile(localEnvPath, "utf8");
  } catch {
    return "";
  }
}

export async function getLocalOperatorConnectionValue(key: SupportedKey) {
  const environmentValue = process.env[key]?.trim();
  if (environmentValue) return environmentValue;
  const values = parseEnvFile(await readLocalEnvFile());
  return values.get(key)?.trim();
}

function upsertEnvLine(contents: string, key: SupportedKey, value: string) {
  const line = `${key}=${value}`;
  const pattern = new RegExp(`^${key}=.*$`, "m");
  if (pattern.test(contents)) return contents.replace(pattern, line);
  const separator = contents.length === 0 || contents.endsWith("\n") ? "" : "\n";
  return `${contents}${separator}${line}\n`;
}

export async function saveLocalOperatorConnection(input: {
  vercelToken?: string;
  vercelTeamId?: string;
  stripePerformanceKey?: string;
}) {
  if (process.env.NODE_ENV === "production") throw new Error("Local operator connection is unavailable.");

  let contents = await readLocalEnvFile();
  if (input.vercelToken) contents = upsertEnvLine(contents, "VERCEL_TOKEN", input.vercelToken);
  if (input.vercelTeamId) contents = upsertEnvLine(contents, "VERCEL_TEAM_ID", input.vercelTeamId);
  if (input.stripePerformanceKey) contents = upsertEnvLine(contents, "STRIPE_PERFORMANCE_KEY", input.stripePerformanceKey);
  await writeFile(localEnvPath, contents, { encoding: "utf8", mode: 0o600 });
}
