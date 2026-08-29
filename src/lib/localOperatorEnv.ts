export type LocalOperatorConnectionKey =
  | "VERCEL_TOKEN"
  | "VERCEL_PROJECT_ID"
  | "VERCEL_TEAM_ID"
  | "STRIPE_ACCOUNTING_KEY"
  | "STRIPE_PERFORMANCE_KEY";

export function parseLocalOperatorEnvFile(contents: string) {
  const values = new Map<string, string>();
  for (const line of contents.split(/\r?\n/)) {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (match) values.set(match[1], match[2].trim());
  }
  return values;
}

export function upsertLocalOperatorEnvLine(contents: string, key: LocalOperatorConnectionKey, value: string) {
  const line = `${key}=${value}`;
  const pattern = new RegExp(`^${key}=.*$`, "m");
  if (pattern.test(contents)) return contents.replace(pattern, line);
  const separator = contents.length === 0 || contents.endsWith("\n") ? "" : "\n";
  return `${contents}${separator}${line}\n`;
}
