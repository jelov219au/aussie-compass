import "server-only";
import { createHash } from "node:crypto";

type Row = Record<string, unknown>;
const exact = (v: unknown, keys: readonly string[]): v is Row => !!v && typeof v === "object" && !Array.isArray(v)
  && Object.keys(v).length === keys.length && keys.every(k => Object.prototype.hasOwnProperty.call(v, k));
const identifier = (v: unknown): v is string => typeof v === "string" && /^[a-z_][a-z0-9_]{0,62}$/.test(v);
const sha256 = (v: unknown): v is string => typeof v === "string" && /^[a-f0-9]{64}$/.test(v);
const cleanText = (v: unknown, limit: number): v is string => typeof v === "string" && v.length > 0
  && v.length <= limit && v.trim() === v && !/[\x00-\x1f]/.test(v);

// A function ACL is a set, not a PostgreSQL presentation string. OIDs are not
// portable identities. PUBLIC is null, distinct from any quoted role name.
export function hashCarFunctionExecuteAcl(value: unknown): string | null {
  if (!Array.isArray(value) || value.length > 128) return null;
  const seen = new Set<string>();
  const tuples: Array<[string, string | null, "EXECUTE", boolean]> = [];
  for (const grant of value) {
    if (!exact(grant, ["grantor", "grantee", "privilege", "grantable"])
      || !identifier(grant.grantor) || !(grant.grantee === null || identifier(grant.grantee))
      || grant.privilege !== "EXECUTE" || typeof grant.grantable !== "boolean") return null;
    const identity = JSON.stringify([grant.grantor, grant.grantee, grant.privilege]);
    if (seen.has(identity)) return null;
    seen.add(identity); tuples.push([grant.grantor, grant.grantee, "EXECUTE", grant.grantable]);
  }
  tuples.sort((a, b) => { const left = JSON.stringify(a), right = JSON.stringify(b); return left < right ? -1 : left > right ? 1 : 0; });
  return createHash("sha256").update(JSON.stringify({ version: "car-function-execute-acl-v1", grants: tuples }), "utf8").digest("hex");
}

// Fixed catalog-only SELECT. Values are [runtime role, reviewed function names].
// The injected transaction client must set the options below BEFORE this query.
// No user-defined function is executed, and full function definitions stay in DB.
export const carFunctionCatalogCtes = `
with recursive runtime_role as (
  select oid from pg_catalog.pg_roles where rolname = $1::text
), selected_functions as (
  select p.*, n.nspname from pg_catalog.pg_proc p
  join pg_catalog.pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public' and p.proname = any($2::text[])
  order by p.oid limit 257
), descriptors as (
  select pg_catalog.jsonb_build_object(
    'name', p.proname, 'kind', p.prokind,
    'signature', pg_catalog.format('%I.%I(%s)', p.nspname, p.proname, pg_catalog.oidvectortypes(p.proargtypes)),
    'definition_sha256', case when p.prokind = 'f' then pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(
      pg_catalog.replace(pg_catalog.pg_get_functiondef(p.oid), E'\\r\\n', E'\\n'), 'UTF8')), 'hex') else null end,
    'owner', pg_catalog.pg_get_userbyid(p.proowner), 'security_definer', p.prosecdef,
    'settings', coalesce(pg_catalog.to_jsonb(p.proconfig), '[]'::jsonb),
    'runtime_execute', case when r.oid is null then null else pg_catalog.has_function_privilege(r.oid, p.oid, 'EXECUTE') end,
    'grants', coalesce((select pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object(
      'grantor', pg_catalog.pg_get_userbyid(a.grantor),
      'grantee', case when a.grantee = 0 then null else pg_catalog.pg_get_userbyid(a.grantee) end,
      'privilege', a.privilege_type, 'grantable', a.is_grantable))
      from (select * from pg_catalog.aclexplode(coalesce(p.proacl, pg_catalog.acldefault('f', p.proowner))) limit 129) a), '[]'::jsonb)
  ) as descriptor from selected_functions p left join runtime_role r on true
)`;
export const carCatalogContextColumns = `pg_catalog.current_database() as database_name, current_user as inspection_role,
  pg_catalog.current_setting('server_version_num')::integer as server_version,
  pg_catalog.current_setting('transaction_read_only') as read_only,
  pg_catalog.current_setting('transaction_isolation') as isolation,
  pg_catalog.current_setting('search_path') as search_path`;
export const carFunctionCatalogSql = `${carFunctionCatalogCtes}
select ${carCatalogContextColumns},
  coalesce((select pg_catalog.jsonb_agg(descriptor) from descriptors), '[]'::jsonb) as functions
`;

export type CarFunctionCatalogTransaction = Readonly<{
  sql: string;
  values: readonly [string, readonly string[]];
  options: Readonly<{ readOnly: true; isolation: "repeatable read"; searchPath: "pg_catalog, pg_temp";
    statementTimeoutMs: 5000; lockTimeoutMs: 1000 }>;
}>;
export type CarFunctionCatalogQuery = (request: CarFunctionCatalogTransaction) => Promise<unknown>;
type FunctionDescriptor = {
  name: string; signature: string; definitionSha256: string; owner: string; securityDefiner: boolean;
  settings: string[]; executeAclSha256: string; runtimeExecute: boolean; publicExecute: boolean;
};
type Result = { ok: true; functions: FunctionDescriptor[]; readiness: false }
  | { ok: false; reason: "unconfigured" | "catalog_unavailable" | "catalog_mismatch" };

export function createCarFunctionCatalogCollector(deps: {
  databaseName: unknown; inspectionRole: unknown; runtimeRole: unknown;
  expectedSignatures: unknown; query: CarFunctionCatalogQuery | null;
}): () => Promise<Result> {
  const { databaseName, inspectionRole, runtimeRole, query } = deps;
  const input = deps.expectedSignatures;
  const signatures: Array<{ name: string; signature: string }> = [];
  let valid = cleanText(databaseName, 63) && identifier(inspectionRole) && identifier(runtimeRole)
    && Array.isArray(input) && input.length > 0 && input.length <= 256;
  if (valid && Array.isArray(input)) {
    for (const item of input) {
      if (!exact(item, ["name", "signature"]) || !identifier(item.name) || !cleanText(item.signature, 2048)
        || !item.signature.startsWith(`public.${item.name}(`) || !item.signature.endsWith(")")) { valid = false; break; }
      signatures.push({ name: item.name, signature: item.signature });
    }
    valid = valid && new Set(signatures.map(s => s.signature)).size === signatures.length;
  }
  const names = Object.freeze([...new Set(signatures.map(s => s.name))].sort());
  return async () => {
    if (!valid || typeof query !== "function") return { ok: false, reason: "unconfigured" };
    try {
      const values = Object.freeze([runtimeRole as string, names]) as readonly [string, readonly string[]];
      const result = await query(Object.freeze({ sql: carFunctionCatalogSql, values,
        options: Object.freeze({ readOnly: true, isolation: "repeatable read", searchPath: "pg_catalog, pg_temp",
          statementTimeoutMs: 5000, lockTimeoutMs: 1000 }) }));
      const row = Array.isArray(result) && result.length === 1 ? result[0] : null;
      if (!exact(row, ["database_name", "inspection_role", "server_version", "read_only", "isolation", "search_path", "functions"])
        || row.database_name !== databaseName || row.inspection_role !== inspectionRole
        || !Number.isInteger(row.server_version) || (row.server_version as number) < 140000 || (row.server_version as number) >= 190000
        || row.read_only !== "on" || row.isolation !== "repeatable read" || row.search_path !== "pg_catalog, pg_temp"
        || !Array.isArray(row.functions) || row.functions.length !== signatures.length) return { ok: false, reason: "catalog_mismatch" };
      const found = new Set<string>(), descriptors: FunctionDescriptor[] = [];
      for (const item of row.functions) {
        if (!exact(item, ["name", "kind", "signature", "definition_sha256", "owner", "security_definer", "settings", "runtime_execute", "grants"])
          || item.kind !== "f" || !signatures.some(s => s.name === item.name && s.signature === item.signature)
          || found.has(item.signature as string) || !sha256(item.definition_sha256) || !identifier(item.owner)
          || typeof item.security_definer !== "boolean" || typeof item.runtime_execute !== "boolean"
          || !Array.isArray(item.settings) || item.settings.length > 16 || !item.settings.every(s => cleanText(s, 512))
          || new Set(item.settings).size !== item.settings.length) return { ok: false, reason: "catalog_mismatch" };
        const aclHash = hashCarFunctionExecuteAcl(item.grants);
        if (!aclHash) return { ok: false, reason: "catalog_mismatch" };
        found.add(item.signature as string);
        descriptors.push({ name: item.name as string, signature: item.signature as string,
          definitionSha256: item.definition_sha256, owner: item.owner, securityDefiner: item.security_definer,
          settings: [...item.settings] as string[], executeAclSha256: aclHash, runtimeExecute: item.runtime_execute,
          publicExecute: (item.grants as Row[]).some(grant => grant.grantee === null) });
      }
      descriptors.sort((a, b) => a.signature < b.signature ? -1 : a.signature > b.signature ? 1 : 0);
      return { ok: true, functions: descriptors, readiness: false };
    } catch { return { ok: false, reason: "catalog_unavailable" }; }
  };
}
