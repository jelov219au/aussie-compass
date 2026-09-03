import "server-only";
import { carCatalogContextColumns, carFunctionCatalogCtes, createCarFunctionCatalogCollector,
  type CarFunctionCatalogTransaction } from "./carPurchaseProReadinessFunctionCatalog";

type Row = Record<string, unknown>;
const exact = (v: unknown, keys: readonly string[]): v is Row => !!v && typeof v === "object" && !Array.isArray(v)
  && Object.keys(v).length === keys.length && keys.every(k => Object.prototype.hasOwnProperty.call(v, k));
const id = (v: unknown): v is string => typeof v === "string" && /^[a-z_][a-z0-9_]{0,62}$/.test(v);
const hash = (v: unknown): v is string => typeof v === "string" && /^[a-f0-9]{64}$/.test(v);
const identity = (r: Row) => r.table + "." + r.name;
const baseKeys = ["database_name", "inspection_role", "server_version", "read_only", "isolation", "search_path", "functions"];

// Three bound values: runtime role, reviewed function names, reviewed table names.
// One SELECT reuses the function CTEs; no second transaction or cached snapshot.
export const carSchemaCatalogCtes = `${carFunctionCatalogCtes}, selected_tables as (
  select c.* from pg_catalog.pg_class c join pg_catalog.pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public' and c.relname = any($3::text[]) order by c.oid limit 65
), selected_constraints as (
  select con.*, c.relname from pg_catalog.pg_constraint con join selected_tables c on c.oid = con.conrelid
  order by con.oid limit 257
), constraint_descriptors as (
  select pg_catalog.jsonb_build_object('table', con.relname, 'name', con.conname,
    'validated', con.convalidated, 'enforced', coalesce((pg_catalog.to_jsonb(con)->>'conenforced')::boolean, true),
    'internal_count', linked.count, 'internal_healthy', linked.healthy,
    'index_healthy', con.conindid = 0 or coalesce(i.indisvalid and i.indisready and i.indislive, false),
    'definition_sha256', pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(pg_catalog.replace(
      pg_catalog.jsonb_build_object('version', 'car-constraint-definition-v1',
        'definition', pg_catalog.replace(pg_catalog.pg_get_constraintdef(con.oid, false), E'\\r\\n', E'\\n'),
        'backingIndex', case when con.conindid = 0 then null else pg_catalog.replace(pg_catalog.pg_get_indexdef(con.conindid), E'\\r\\n', E'\\n') end,
        'internalTriggers', linked.definitions)::text, E'\\r\\n', E'\\n'), 'UTF8')), 'hex')) as descriptor
  from selected_constraints con left join pg_catalog.pg_index i on i.indexrelid = con.conindid
  cross join lateral (
    select count(*)::integer as count,
      coalesce(bool_and(t.tgenabled in ('O', 'A') and fn.nspname = 'pg_catalog'), true) as healthy,
      coalesce(pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object(
        'table', pg_catalog.format('%I.%I', tn.nspname, tc.relname), 'name', t.tgname,
        'definition', pg_catalog.replace(pg_catalog.pg_get_triggerdef(t.oid, false), E'\\r\\n', E'\\n'), 'enabled', t.tgenabled,
        'function', pg_catalog.format('%I.%I(%s)', fn.nspname, f.proname, pg_catalog.oidvectortypes(f.proargtypes)))
        order by tn.nspname collate "C", tc.relname collate "C", t.tgname collate "C"), '[]'::jsonb) as definitions
    from (select * from pg_catalog.pg_trigger where tgconstraint = con.oid and tgisinternal order by oid limit 129) t
    join pg_catalog.pg_class tc on tc.oid = t.tgrelid join pg_catalog.pg_namespace tn on tn.oid = tc.relnamespace
    join pg_catalog.pg_proc f on f.oid = t.tgfoid join pg_catalog.pg_namespace fn on fn.oid = f.pronamespace
  ) linked
), selected_triggers as (
  select t.*, c.relname from pg_catalog.pg_trigger t join selected_tables c on c.oid = t.tgrelid
  where not t.tgisinternal order by t.oid limit 257
), trigger_descriptors as (
  select pg_catalog.jsonb_build_object('table', t.relname, 'name', t.tgname, 'enabled', t.tgenabled,
    'function_signature', pg_catalog.format('%I.%I(%s)', n.nspname, p.proname, pg_catalog.oidvectortypes(p.proargtypes)),
    'definition_sha256', pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(
      pg_catalog.replace(pg_catalog.pg_get_triggerdef(t.oid, false), E'\\r\\n', E'\\n'), 'UTF8')), 'hex')) as descriptor
  from selected_triggers t join pg_catalog.pg_proc p on p.oid = t.tgfoid join pg_catalog.pg_namespace n on n.oid = p.pronamespace
)`;
export const carSchemaCatalogColumns = `${carCatalogContextColumns}, pg_catalog.current_setting('session_replication_role') as replication_role,
  coalesce((select pg_catalog.jsonb_agg(descriptor) from descriptors), '[]'::jsonb) as functions,
  coalesce((select pg_catalog.jsonb_agg(descriptor) from constraint_descriptors), '[]'::jsonb) as constraints,
  coalesce((select pg_catalog.jsonb_agg(descriptor) from trigger_descriptors), '[]'::jsonb) as triggers,
  coalesce((select pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object('name', c.relname,
    'ordinary', c.relkind = 'r' and not c.relispartition and not exists (
      select 1 from pg_catalog.pg_inherits where inhrelid = c.oid or inhparent = c.oid),
    'internal_healthy', not exists (select 1 from pg_catalog.pg_trigger t where t.tgrelid = c.oid and t.tgisinternal
      and (t.tgconstraint = 0 or t.tgenabled not in ('O', 'A') or not exists (
        select 1 from pg_catalog.pg_constraint where oid = t.tgconstraint) or not exists (
        select 1 from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid = p.pronamespace
        where p.oid = t.tgfoid and n.nspname = 'pg_catalog'))))) from selected_tables c), '[]'::jsonb) as tables
`;
export const carSchemaCatalogSql = `${carSchemaCatalogCtes} select ${carSchemaCatalogColumns}`;

type PlanEntry = { table: string; name: string };
type SchemaTransaction = Readonly<{ sql: string; values: readonly [string, readonly string[], readonly string[]];
  options: CarFunctionCatalogTransaction["options"] }>;
export type CarSchemaCatalogQuery = (request: SchemaTransaction) => Promise<unknown>;
type FunctionPlan = Omit<Parameters<typeof createCarFunctionCatalogCollector>[0], "query">;
type FunctionResult = Awaited<ReturnType<ReturnType<typeof createCarFunctionCatalogCollector>>>;
type Result = { ok: true; functions: Extract<FunctionResult, { ok: true }>["functions"];
  constraints: Array<PlanEntry & { definitionSha256: string; validated: true }>;
  triggers: Array<PlanEntry & { definitionSha256: string; enabled: "O" | "A" }>; readiness: false }
  | { ok: false; reason: "unconfigured" | "catalog_unavailable" | "catalog_mismatch" };
function plan(value: unknown): PlanEntry[] | null {
  if (!Array.isArray(value) || value.length === 0 || value.length > 256) return null;
  const result: PlanEntry[] = [], seen = new Set<string>();
  for (const r of value) {
    if (!exact(r, ["table", "name"]) || !id(r.table) || !id(r.name) || seen.has(identity(r))) return null;
    seen.add(identity(r)); result.push({ table: r.table, name: r.name });
  }
  return result;
}
export function createCarSchemaCatalogCollector(deps: FunctionPlan & {
  expectedConstraints: unknown; expectedTriggers: unknown; query: CarSchemaCatalogQuery | null;
}): () => Promise<Result> {
  const constraints = plan(deps.expectedConstraints), triggers = plan(deps.expectedTriggers), query = deps.query;
  const tables = Object.freeze([...new Set([...(constraints ?? []), ...(triggers ?? [])].map(r => r.table))].sort());
  // The inner collector owns a detached, validated function plan. Each call gets
  // its own driver snapshot; never keep response rows in a shared closure.
  const { databaseName, inspectionRole, runtimeRole } = deps;
  let signatures: unknown;
  try { signatures = JSON.parse(JSON.stringify(deps.expectedSignatures)); } catch { signatures = null; }
  return async () => {
    if (!constraints || !triggers || tables.length > 64 || typeof query !== "function") return { ok: false, reason: "unconfigured" };
    let snapshot: Row | null = null;
    const collector = createCarFunctionCatalogCollector({ databaseName, inspectionRole, runtimeRole,
      expectedSignatures: signatures, query: async request => {
        const raw = await query(Object.freeze({ sql: carSchemaCatalogSql,
          values: Object.freeze([...request.values, tables]) as SchemaTransaction["values"], options: request.options }));
        const row = Array.isArray(raw) && raw.length === 1 ? raw[0] : null;
        if (!exact(row, [...baseKeys, "replication_role", "constraints", "triggers", "tables"])) return null;
        // Copy immediately so later driver mutations cannot change validated evidence.
        snapshot = JSON.parse(JSON.stringify(row)) as Row;
        return [Object.fromEntries(baseKeys.map(key => [key, snapshot![key]]))];
      } });
    const functions = await collector();
    if (!functions.ok) return functions;
    // Assignment happens inside the awaited query callback.
    const observed = snapshot as Row | null;
    if (!observed || observed.replication_role !== "origin" || !Array.isArray(observed.tables)
      || observed.tables.length !== tables.length) return { ok: false, reason: "catalog_mismatch" };
    const seenTables = new Set<string>();
    for (const row of observed.tables) {
      if (!exact(row, ["name", "ordinary", "internal_healthy"]) || !tables.includes(row.name as string)
        || seenTables.has(row.name as string) || row.ordinary !== true || row.internal_healthy !== true) return { ok: false, reason: "catalog_mismatch" };
      seenTables.add(row.name as string);
    }
    const outputConstraints: Extract<Result, { ok: true }>["constraints"] = [], outputTriggers: Extract<Result, { ok: true }>["triggers"] = [];
    for (const section of ["constraints", "triggers"] as const) {
      const expected = section === "constraints" ? constraints : triggers;
      const rows = observed[section];
      if (!Array.isArray(rows) || rows.length !== expected.length) return { ok: false, reason: "catalog_mismatch" };
      const seen = new Set<string>();
      for (const row of rows) {
        const keys = section === "constraints" ? ["table", "name", "definition_sha256", "validated", "enforced", "internal_count", "internal_healthy", "index_healthy"]
          : ["table", "name", "definition_sha256", "enabled", "function_signature"];
        if (!exact(row, keys) || !expected.some(r => r.table === row.table && r.name === row.name)
          || seen.has(identity(row)) || !hash(row.definition_sha256)) return { ok: false, reason: "catalog_mismatch" };
        seen.add(identity(row));
        const descriptor = { table: row.table as string, name: row.name as string, definitionSha256: row.definition_sha256 };
        if (section === "constraints") {
          if (row.validated !== true || row.enforced !== true || row.internal_healthy !== true || row.index_healthy !== true
            || !Number.isInteger(row.internal_count) || (row.internal_count as number) < 0 || (row.internal_count as number) > 128) return { ok: false, reason: "catalog_mismatch" };
          outputConstraints.push({ ...descriptor, validated: true });
        } else {
          if ((row.enabled !== "O" && row.enabled !== "A") || !functions.functions.some(f => f.signature === row.function_signature)) {
            return { ok: false, reason: "catalog_mismatch" };
          }
          outputTriggers.push({ ...descriptor, enabled: row.enabled });
        }
      }
    }
    const compare = (a: PlanEntry, b: PlanEntry) => identity(a) < identity(b) ? -1 : identity(a) > identity(b) ? 1 : 0;
    return { ok: true, functions: functions.functions, constraints: outputConstraints.sort(compare),
      triggers: outputTriggers.sort(compare), readiness: false };
  };
}
