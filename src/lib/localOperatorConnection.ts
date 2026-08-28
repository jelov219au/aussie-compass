import "server-only";

import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  parseLocalOperatorEnvFile,
  upsertLocalOperatorEnvLine,
} from "@/lib/localOperatorEnv";
import type { LocalOperatorConnectionKey } from "@/lib/localOperatorEnv";

const localEnvPath = path.join(process.cwd(), ".env.local");

async function readLocalEnvFile() {
  if (process.env.NODE_ENV === "production") return "";
  try {
    return await readFile(localEnvPath, "utf8");
  } catch {
    return "";
  }
}

export async function getLocalOperatorConnectionValue(key: LocalOperatorConnectionKey) {
  const environmentValue = process.env[key]?.trim();
  if (environmentValue) return environmentValue;
  const values = parseLocalOperatorEnvFile(await readLocalEnvFile());
  return values.get(key)?.trim();
}

export async function saveLocalOperatorConnection(input: {
  vercelToken?: string;
  vercelProjectId?: string;
  vercelTeamId?: string;
  stripePerformanceKey?: string;
}) {
  if (process.env.NODE_ENV === "production") throw new Error("Local operator connection is unavailable.");

  let contents = await readLocalEnvFile();
  if (input.vercelToken) contents = upsertLocalOperatorEnvLine(contents, "VERCEL_TOKEN", input.vercelToken);
  if (input.vercelProjectId) contents = upsertLocalOperatorEnvLine(contents, "VERCEL_PROJECT_ID", input.vercelProjectId);
  if (input.vercelTeamId) contents = upsertLocalOperatorEnvLine(contents, "VERCEL_TEAM_ID", input.vercelTeamId);
  if (input.stripePerformanceKey) contents = upsertLocalOperatorEnvLine(contents, "STRIPE_PERFORMANCE_KEY", input.stripePerformanceKey);
  await writeFile(localEnvPath, contents, { encoding: "utf8", mode: 0o600 });
}
