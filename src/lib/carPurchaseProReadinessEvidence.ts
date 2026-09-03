import "server-only";
import { randomUUID } from "node:crypto";
import { isCarPurchaseApprovedOffer } from "./carPurchaseProCheckoutContract";

// Preparation only: no collector, connection, runtime binding or launch permission.
// Manifest and query must be trusted server dependencies, never request input.
export const carReadinessFunctionNames = Object.freeze([
  "apply_entitlement_event", "apply_guarded_entitlement_event", "apply_first_sale_paid_event",
  "claim_first_sale_reservation", "attach_first_sale_checkout", "release_failed_first_sale_reservation",
  "release_verified_abandoned_first_sale", "lock_first_sale_from_paid_event", "approve_next_first_sale",
  "consume_checkout_activation", "consume_entitlement_restore_token", "release_purchase_access_session",
  "find_active_purchase_entitlement_by_access_session", "find_active_purchase_entitlement_by_checkout",
  "find_active_purchase_entitlement_by_id", "create_entitlement_restore_token",
  "record_payment_operator_alert_intent", "enqueue_payment_operator_alert_failure",
  "payment_operator_alert_from_receipt", "claim_payment_operator_alert_intent",
  "mark_payment_operator_alert_sent", "release_payment_operator_alert_claim",
  "apply_car_purchase_exception_event_v1", "apply_car_purchase_reversal_event_v1",
  "car_purchase_sale_hold_blocks_v1", "assert_car_purchase_grant_allowed_v1",
  "car_purchase_sale_hold_guards_ready_v1", "car_purchase_alert_outbox_ready_v1",
  "lock_car_purchase_operator_alert_v1", "claim_car_purchase_operator_alert_v1",
  "finish_car_purchase_operator_alert_v1", "mark_car_purchase_operator_alert_sent_v1",
  "release_car_purchase_operator_alert_claim_v1",
] as const);
export const carReadinessConstraintTables = Object.freeze([
  "purchase_entitlements", "purchase_access_sessions", "purchase_restore_tokens",
  "purchase_restore_activations", "purchase_checkout_activations", "payment_webhook_events",
  "first_sale_gates", "first_sale_gate_events", "payment_operator_alert_outbox",
  "entitlement_event_tombstones", "stripe_payment_object_links",
  "car_purchase_exception_receipts", "car_purchase_payment_holds",
] as const);
export const carReadinessCheckIds = Object.freeze([
  "access_lifecycle", "hold_admission_and_settlement", "monotonic_reversal",
  "exception_atomicity", "alert_identity_and_lease", "database_concurrency",
  "webhook_signature_and_routing", "managed_payments", "customer_journey",
  "alert_sender_and_retry", "migration_and_rollback",
] as const);
const triggerTables = ["payment_webhook_events", "entitlement_event_tombstones",
  "first_sale_gate_events", "car_purchase_exception_receipts"];
const version = "car-readiness-evidence-v1";
const maxAgeMs = 60_000;
type Row = Record<string, unknown>;
const record = (v: unknown): v is Row => !!v && typeof v === "object" && !Array.isArray(v);
const exact = (v: unknown, keys: readonly string[]): v is Row => record(v)
  && Object.keys(v).length === keys.length && keys.every(k => Object.prototype.hasOwnProperty.call(v, k));
const text = (v: unknown, limit = 255): v is string => typeof v === "string"
  && v.length > 0 && v.length <= limit && v.trim() === v && !/[\x00-\x1f]/.test(v);
const hash = (v: unknown): v is string => typeof v === "string" && /^[a-f0-9]{64}$/.test(v);
const identifier = (v: unknown): v is string => typeof v === "string" && /^[a-z_][a-z0-9_]{0,62}$/.test(v);
const timestamp = (v: unknown): v is number => typeof v === "number" && Number.isSafeInteger(v) && v > 0;
function parse(v: unknown): unknown {
  if (typeof v !== "string" || v.length > 262_144) return null;
  try { return JSON.parse(v); } catch { return null; }
}
function rows(v: unknown, validate: (row: unknown) => boolean, identity: (row: Row) => string): v is Row[] {
  if (!Array.isArray(v) || v.length === 0 || v.length > 256 || !v.every(validate)) return false;
  return new Set(v.map(identity)).size === v.length;
}
function same(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (Array.isArray(a) && Array.isArray(b)) return a.length === b.length && a.every((v, i) => same(v, b[i]));
  return record(a) && record(b) && Object.keys(a).length === Object.keys(b).length
    && Object.keys(a).every(k => Object.prototype.hasOwnProperty.call(b, k) && same(a[k], b[k]));
}
const offerKeys = ["productCode", "currency", "billing", "priceCents", "stripePriceId", "stripeProductId", "termsVersion"];
function environment(v: unknown): v is Row {
  if (!exact(v, ["databaseIdentity", "runtimeRole", "ownerRole", "mode", "deployment", "origin"])) return false;
  if (!text(v.databaseIdentity) || !identifier(v.runtimeRole) || !identifier(v.ownerRole)
    || v.runtimeRole === v.ownerRole || !["test", "live"].includes(v.mode as string)
    || v.deployment !== (v.mode === "live" ? "production" : "nonproduction")) return false;
  try { const url = new URL(v.origin as string); return url.protocol === "https:" && url.origin === v.origin; }
  catch { return false; }
}
function inventory(v: unknown, env: Row): v is Row {
  if (!exact(v, ["functions", "constraints", "triggers", "runtimePrivileges", "checks"])) return false;
  if (!rows(v.functions, item => {
    if (!exact(item, ["name", "signature", "definitionSha256", "owner", "securityDefiner", "settings",
      "executeAclSha256", "runtimeExecute", "publicExecute"])) return false;
    if (!identifier(item.name) || !text(item.signature, 2048)
      || !item.signature.startsWith("public." + item.name + "(") || !item.signature.endsWith(")")
      || !hash(item.definitionSha256) || item.owner !== env.ownerRole || typeof item.securityDefiner !== "boolean"
      || !hash(item.executeAclSha256) || typeof item.runtimeExecute !== "boolean" || item.publicExecute !== false
      || !Array.isArray(item.settings) || item.settings.length > 16
      || !item.settings.every(s => text(s, 512)) || new Set(item.settings).size !== item.settings.length) return false;
    const searchPaths = item.settings.filter(s => (s as string).startsWith("search_path="));
    if (item.securityDefiner && (searchPaths.length !== 1
      || !["search_path=public,pg_temp", "search_path=pg_catalog,public,pg_temp"]
        .includes((searchPaths[0] as string).replace(/ /g, "")))) return false;
    // Owner reopening and internal helpers must never become app-callable.
    const internal = ["approve_next_first_sale", "apply_entitlement_event", "lock_first_sale_from_paid_event",
      "car_purchase_sale_hold_blocks_v1", "assert_car_purchase_grant_allowed_v1",
      "lock_car_purchase_operator_alert_v1", "finish_car_purchase_operator_alert_v1"];
    return !(internal.includes(item.name as string) && item.runtimeExecute === true);
  }, r => r.signature as string)) return false;
  if (!carReadinessFunctionNames.every(name => (v.functions as Row[]).some(f => f.name === name))) return false;
  if (!rows(v.constraints, item => exact(item, ["table", "name", "definitionSha256", "validated"])
    && identifier(item.table)
    && identifier(item.name) && hash(item.definitionSha256) && item.validated === true,
  r => r.table + "." + r.name)) return false;
  if (!carReadinessConstraintTables.every(table => (v.constraints as Row[]).some(c => c.table === table))) return false;
  if (!rows(v.triggers, item => exact(item, ["table", "name", "definitionSha256", "enabled"])
    && identifier(item.table) && identifier(item.name) && hash(item.definitionSha256)
    && (item.enabled === "O" || item.enabled === "A"), r => r.table + "." + r.name)) return false;
  if (!triggerTables.every(table => (v.triggers as Row[]).some(t => t.table === table))) return false;
  const privileges = v.runtimePrivileges;
  if (!exact(privileges, ["role", "superuser", "bypassRls", "tableWrites", "roleAttributesSha256",
    "membershipsSha256", "schemaPrivilegesSha256", "tablePrivilegesSha256"])
    || privileges.role !== env.runtimeRole || privileges.superuser !== false || privileges.bypassRls !== false
    || privileges.tableWrites !== false || ![privileges.roleAttributesSha256, privileges.membershipsSha256,
      privileges.schemaPrivilegesSha256, privileges.tablePrivilegesSha256].every(hash)) return false;
  return rows(v.checks, item => exact(item, ["id", "passed", "evidenceSha256"])
    && (carReadinessCheckIds as readonly unknown[]).includes(item.id) && item.passed === true
    && hash(item.evidenceSha256), r => r.id as string) && v.checks.length === carReadinessCheckIds.length;
}
function manifest(v: unknown): v is Row {
  if (!exact(v, ["version", "approvalId", "candidateCommit", "approvedAt", "expiresAt", "environment", "offer", "inventory"])
    || v.version !== version || v.approvalId !== "CAR-PURCHASE-LAUNCH"
    || typeof v.candidateCommit !== "string" || !/^[a-f0-9]{40}$/.test(v.candidateCommit)
    || !timestamp(v.approvedAt) || !timestamp(v.expiresAt) || v.expiresAt <= v.approvedAt
    || !environment(v.environment) || !exact(v.offer, offerKeys) || !isCarPurchaseApprovedOffer(v.offer)
    || v.offer.priceCents > 2147483647) return false;
  return inventory(v.inventory, v.environment);
}
function inventoryMatches(a: Row, b: Row): boolean {
  if (!same(a.runtimePrivileges, b.runtimePrivileges)) return false;
  for (const section of ["functions", "constraints", "triggers", "checks"] as const) {
    const key = (r: Row) => section === "functions" ? r.signature : section === "checks" ? r.id : r.table + "." + r.name;
    const left = a[section] as Row[], right = b[section] as Row[];
    if (left.length !== right.length || !left.every(row => {
      const found = right.find(other => key(other) === key(row));
      return found !== undefined && same(row, found);
    })) return false;
  }
  return true;
}

export type CarReadinessQueryRequest = Readonly<{
  version: string; challenge: string; candidateCommit: string;
}>;
// Future approved adapter: one read-only transaction, metadata/evidence only.
// Return exactly [{ evidence_json: serializedEnvelope }]. This port cannot
// enforce SQL read-only behavior; the connection/transaction must enforce it.
export type CarReadinessQuery = (request: CarReadinessQueryRequest) => Promise<unknown>;
type Result = { ok: true; candidateCommit: string; checkedAt: number; salesAuthorized: false }
  | { ok: false; reason: "manifest_unapproved" | "evidence_unavailable" | "evidence_mismatch" };

export function createCarPurchaseReadinessEvidence(deps: {
  approvedManifestJson: unknown; query: CarReadinessQuery | null; now?: () => number;
}): () => Promise<Result> {
  const approved = parse(deps.approvedManifestJson);
  const valid = manifest(approved);
  const query = deps.query, now = deps.now ?? Date.now;
  return async () => {
    try {
      const start = now();
      if (!valid || !timestamp(start) || start < (approved.approvedAt as number)
        || start >= (approved.expiresAt as number)) return { ok: false, reason: "manifest_unapproved" };
      if (typeof query !== "function") return { ok: false, reason: "evidence_unavailable" };
      const challenge = randomUUID();
      const result = await query(Object.freeze({ version, challenge, candidateCommit: approved.candidateCommit as string }));
      const end = now();
      if (!timestamp(end) || end < start || end - start > maxAgeMs || end >= (approved.expiresAt as number)) {
        return { ok: false, reason: "evidence_mismatch" };
      }
      const row = Array.isArray(result) && result.length === 1 ? result[0] : null;
      const evidence = exact(row, ["evidence_json"]) ? parse(row.evidence_json) : null;
      if (!exact(evidence, ["version", "challenge", "candidateCommit", "observedAt", "readOnly",
        "environment", "offer", "inventory"]) || evidence.version !== version || evidence.challenge !== challenge
        || evidence.candidateCommit !== approved.candidateCommit || evidence.readOnly !== true
        || !timestamp(evidence.observedAt) || evidence.observedAt < start || evidence.observedAt > end
        || !same(evidence.environment, approved.environment) || !same(evidence.offer, approved.offer)
        || !inventory(evidence.inventory, approved.environment as Row)
        || !inventoryMatches(evidence.inventory, approved.inventory as Row)) return { ok: false, reason: "evidence_mismatch" };
      // A match validates supplied evidence only, not its provenance or deployment.
      // Deliberately not the boolean readiness shape accepted by RuntimeAssembly.
      return { ok: true, candidateCommit: approved.candidateCommit as string, checkedAt: end, salesAuthorized: false };
    } catch { return { ok: false, reason: "evidence_unavailable" }; }
  };
}
