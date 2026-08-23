import "server-only";

/**
 * Vercel's Neon integration prefixes its generated connection variable with
 * the store name. Keep the manual name as the primary override for other
 * hosts, while accepting the managed integration name without copying secrets.
 */
export function getEntitlementDatabaseUrl() {
  const connectionString = process.env.ENTITLEMENT_DB_URL?.trim()
    || process.env.ENTITLEMENT_DB_DATABASE_URL?.trim();

  if (
    !connectionString
    || process.env.VERCEL_ENV !== "preview"
    || process.env.VERCEL_GIT_COMMIT_REF !== "codex/stage2-resume-payment-sandbox"
    || process.env.STAGE2_DB_MIGRATIONS_ENABLED !== "true"
  ) {
    return connectionString;
  }

  const commitSha = process.env.VERCEL_GIT_COMMIT_SHA?.trim();
  if (!commitSha || !/^[a-f0-9]{40}$/i.test(commitSha)) return undefined;

  try {
    const sandboxUrl = new URL(connectionString);
    sandboxUrl.pathname = `/hoju_stage2_${commitSha.slice(0, 12).toLowerCase()}`;
    return sandboxUrl.toString();
  } catch {
    return undefined;
  }
}
