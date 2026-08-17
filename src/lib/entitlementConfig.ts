import "server-only";

/**
 * Vercel's Neon integration prefixes its generated connection variable with
 * the store name. Keep the manual name as the primary override for other
 * hosts, while accepting the managed integration name without copying secrets.
 */
export function getEntitlementDatabaseUrl() {
  return process.env.ENTITLEMENT_DB_URL?.trim()
    || process.env.ENTITLEMENT_DB_DATABASE_URL?.trim();
}
