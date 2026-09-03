import "server-only";
import { createHash } from "node:crypto";
import { carSchemaCatalogColumns, carSchemaCatalogCtes, createCarSchemaCatalogCollector,
  type CarSchemaCatalogQuery } from "./carPurchaseProReadinessSchemaCatalog";

type Row = Record<string, unknown>;
const exact = (v: unknown, keys: readonly string[]): v is Row => !!v && typeof v === "object" && !Array.isArray(v)
  && Object.keys(v).length === keys.length && keys.every(k => Object.prototype.hasOwnProperty.call(v, k));
const id = (v: unknown): v is string => typeof v === "string" && /^[a-z_][a-z0-9_]{0,62}$/.test(v);
const hash = (v: unknown): v is string => typeof v === "string" && /^[a-f0-9]{64}$/.test(v);
const bools = (r: Row, keys: readonly string[]) => keys.every(k => typeof r[k] === "boolean");
const order = (a: string, b: string) => a < b ? -1 : a > b ? 1 : 0;
// Only validated records with fixed scalar schemas reach this serializer.
function fingerprint(version: string, groups: Record<string, Row[]>): string {
  const normalized = Object.keys(groups).sort().map(key => [key, groups[key].map(row =>
    Object.keys(row).sort().map(field => [field, row[field]])).sort((a, b) => order(JSON.stringify(a), JSON.stringify(b)))]);
  return createHash("sha256").update(JSON.stringify([version, normalized]), "utf8").digest("hex");
}

// PostgreSQL 16-18 contract: no query is run without a separately supplied adapter.
// Reachability is deliberately conservative: even NOINHERIT/SET FALSE edges count.
export const carPrivilegeCatalogSql = `${carSchemaCatalogCtes}, role_closure(oid) as (
  select oid from runtime_role union select m.roleid from pg_catalog.pg_auth_members m join role_closure c on c.oid = m.member
), role_rows as (
  select r.* from pg_catalog.pg_roles r join role_closure c on c.oid = r.oid order by r.oid limit 65
), member_rows as (
  select m.* from pg_catalog.pg_auth_members m join role_closure c on c.oid = m.member order by m.oid limit 129
), column_rows as (
  select a.*, c.relname from pg_catalog.pg_attribute a join selected_tables c on c.oid = a.attrelid
  where a.attnum > 0 and not a.attisdropped order by a.attrelid, a.attnum limit 513
), sequence_rows as (
  select s.* from pg_catalog.pg_class s where s.relkind = 'S' and (
    exists (select 1 from pg_catalog.pg_depend d join selected_tables t on t.oid = d.refobjid
      where d.classid = 'pg_catalog.pg_class'::regclass and d.objid = s.oid and d.refclassid = 'pg_catalog.pg_class'::regclass and d.deptype in ('a','i'))
    or exists (select 1 from pg_catalog.pg_depend d join pg_catalog.pg_attrdef a on a.oid = d.objid
      join selected_tables t on t.oid = a.adrelid where d.classid = 'pg_catalog.pg_attrdef'::regclass
      and d.refclassid = 'pg_catalog.pg_class'::regclass and d.refobjid = s.oid)) order by s.oid limit 129
), privilege_payload as (
 select pg_catalog.jsonb_build_object(
 'roles', coalesce((select pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object('name', r.rolname,
   'superuser', r.rolsuper, 'create_role', r.rolcreaterole, 'create_db', r.rolcreatedb,
   'replication', r.rolreplication, 'bypass_rls', r.rolbypassrls, 'inherit', r.rolinherit, 'login', r.rolcanlogin,
   'settings_sha256', pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(coalesce((select pg_catalog.jsonb_agg(
     pg_catalog.jsonb_build_object('database', case when s.setdatabase = 0 then null else d.datname end,
       'role',case when s.setrole=0 then null else r.rolname end,'settings',s.setconfig)
     order by d.datname collate "C" nulls first, s.setrole=0 desc) from pg_catalog.pg_db_role_setting s left join pg_catalog.pg_database d on d.oid = s.setdatabase
     where s.setrole in (0,r.oid) and (s.setdatabase=0 or d.datname=pg_catalog.current_database()))::text, '[]'), 'UTF8')), 'hex'))) from role_rows r), '[]'::jsonb),
 'memberships', coalesce((select pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object(
   'member', pg_catalog.pg_get_userbyid(m.member), 'role', pg_catalog.pg_get_userbyid(m.roleid),
   'grantor', pg_catalog.pg_get_userbyid(m.grantor), 'admin', m.admin_option, 'inherit', m.inherit_option, 'set', m.set_option))
   from member_rows m), '[]'::jsonb),
 'schemas', coalesce((select pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object('name', n.nspname,
   'usage', exists(select 1 from role_closure r where pg_catalog.has_schema_privilege(r.oid,n.oid,'USAGE')),
   'create', exists(select 1 from role_closure r where r.oid=n.nspowner or pg_catalog.has_schema_privilege(r.oid,n.oid,'CREATE')),
   'grant', exists(select 1 from role_closure r where pg_catalog.has_schema_privilege(r.oid,n.oid,'USAGE WITH GRANT OPTION,CREATE WITH GRANT OPTION'))))
   from pg_catalog.pg_namespace n where n.nspname = 'public'), '[]'::jsonb),
 'tables', coalesce((select pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object('name', t.relname,
   'select', exists(select 1 from role_closure r where pg_catalog.has_table_privilege(r.oid,t.oid,'SELECT')),
   'write', exists(select 1 from role_closure r where r.oid=t.relowner or pg_catalog.has_table_privilege(r.oid,t.oid,'INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER')),
   'grant', exists(select 1 from role_closure r where pg_catalog.has_table_privilege(r.oid,t.oid,'SELECT WITH GRANT OPTION,INSERT WITH GRANT OPTION,UPDATE WITH GRANT OPTION,DELETE WITH GRANT OPTION,TRUNCATE WITH GRANT OPTION,REFERENCES WITH GRANT OPTION,TRIGGER WITH GRANT OPTION')),
   'rls', t.relrowsecurity, 'force_rls', t.relforcerowsecurity,
   'policies_sha256',pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(pg_catalog.jsonb_build_object('version','car-rls-policies-v1',
     'policies',coalesce((select pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object('name',p.polname,'command',p.polcmd,'permissive',p.polpermissive,
       'roles',(select pg_catalog.jsonb_agg(case when x=0 then null else pg_catalog.pg_get_userbyid(x) end
         order by case when x=0 then null else pg_catalog.pg_get_userbyid(x) end collate "C" nulls first) from pg_catalog.unnest(p.polroles) x),
       'using',pg_catalog.replace(pg_catalog.pg_get_expr(p.polqual,p.polrelid,false),E'\\r\\n',E'\\n'),
       'check',pg_catalog.replace(pg_catalog.pg_get_expr(p.polwithcheck,p.polrelid,false),E'\\r\\n',E'\\n')) order by p.polname collate "C")
       from pg_catalog.pg_policy p where p.polrelid=t.oid),'[]'::jsonb))::text,'UTF8')),'hex'))) from selected_tables t), '[]'::jsonb),
 'columns', coalesce((select pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object('table', a.relname, 'name', a.attname,
   'select', exists(select 1 from role_closure r where pg_catalog.has_column_privilege(r.oid,a.attrelid,a.attnum,'SELECT')),
   'write', exists(select 1 from role_closure r where pg_catalog.has_column_privilege(r.oid,a.attrelid,a.attnum,'INSERT,UPDATE,REFERENCES')),
   'grant', exists(select 1 from role_closure r where pg_catalog.has_column_privilege(r.oid,a.attrelid,a.attnum,'SELECT WITH GRANT OPTION,INSERT WITH GRANT OPTION,UPDATE WITH GRANT OPTION,REFERENCES WITH GRANT OPTION')),
   'supported', tn.nspname = 'pg_catalog' and (a.attcollation = 0 or cn.nspname = 'pg_catalog'),
   'definition_sha256', pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(pg_catalog.jsonb_build_object(
     'version','car-column-definition-v1','ordinal',a.attnum,'type',pg_catalog.format_type(a.atttypid,a.atttypmod),
     'notNull',a.attnotnull,'identity',a.attidentity,'generated',a.attgenerated,'hasMissing',a.atthasmissing,
     'missingValue',pg_catalog.to_jsonb(a.attmissingval),'dimensions',a.attndims,
     'collation',case when a.attcollation=0 then null else pg_catalog.format('%I.%I',cn.nspname,co.collname) end,
     'expression',pg_catalog.replace(pg_catalog.pg_get_expr(ad.adbin,ad.adrelid,false),E'\\r\\n',E'\\n'))::text,'UTF8')),'hex')))
   from column_rows a join pg_catalog.pg_type ty on ty.oid=a.atttypid join pg_catalog.pg_namespace tn on tn.oid=ty.typnamespace
   left join pg_catalog.pg_attrdef ad on ad.adrelid=a.attrelid and ad.adnum=a.attnum
   left join pg_catalog.pg_collation co on co.oid=a.attcollation left join pg_catalog.pg_namespace cn on cn.oid=co.collnamespace), '[]'::jsonb),
 'sequences', coalesce((select pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object('name',s.relname,'schema',n.nspname,
   'select',exists(select 1 from role_closure r where pg_catalog.has_sequence_privilege(r.oid,s.oid,'SELECT')),
   'write',exists(select 1 from role_closure r where r.oid=s.relowner or pg_catalog.has_sequence_privilege(r.oid,s.oid,'USAGE,UPDATE')),
   'grant',exists(select 1 from role_closure r where pg_catalog.has_sequence_privilege(r.oid,s.oid,'SELECT WITH GRANT OPTION,USAGE WITH GRANT OPTION,UPDATE WITH GRANT OPTION')),
   'definition_sha256',pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(pg_catalog.jsonb_build_object('version','car-sequence-definition-v1',
     'type',pg_catalog.format_type(q.seqtypid,null),'start',q.seqstart,'increment',q.seqincrement,'min',q.seqmin,
     'max',q.seqmax,'cache',q.seqcache,'cycle',q.seqcycle)::text,'UTF8')),'hex')))
   from sequence_rows s join pg_catalog.pg_namespace n on n.oid=s.relnamespace join pg_catalog.pg_sequence q on q.seqrelid=s.oid), '[]'::jsonb),
 'guards', pg_catalog.jsonb_build_object(
   'database_create',exists(select 1 from role_closure r join pg_catalog.pg_database d on d.datname=pg_catalog.current_database()
     where r.oid=d.datdba or pg_catalog.has_database_privilege(r.oid,d.oid,'CREATE,CREATE WITH GRANT OPTION')),
   'database_temp',exists(select 1 from role_closure r where pg_catalog.has_database_privilege(r.oid,pg_catalog.current_database(),'TEMP')),
   'replication_parameter',exists(select 1 from role_closure r where pg_catalog.has_parameter_privilege(r.oid,'session_replication_role','SET,ALTER SYSTEM')),
   'unreviewed_definer',exists(select 1 from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace cross join role_closure r
     where n.nspname !~ '^pg_' and n.nspname <> 'information_schema' and p.prosecdef
     and not exists(select 1 from selected_functions f where f.oid=p.oid) and pg_catalog.has_function_privilege(r.oid,p.oid,'EXECUTE')),
   'function_grant',exists(select 1 from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace cross join role_closure r
     where n.nspname !~ '^pg_' and n.nspname <> 'information_schema'
     and (r.oid=p.proowner or pg_catalog.has_function_privilege(r.oid,p.oid,'EXECUTE WITH GRANT OPTION'))),
   'outside_schema_create',exists(select 1 from pg_catalog.pg_namespace n cross join role_closure r
     where n.nspname <> 'public' and n.nspname !~ '^pg_' and n.nspname <> 'information_schema'
     and (r.oid=n.nspowner or pg_catalog.has_schema_privilege(r.oid,n.oid,'CREATE,CREATE WITH GRANT OPTION'))),
   'outside_writes',exists(select 1 from pg_catalog.pg_class c join pg_catalog.pg_namespace n on n.oid=c.relnamespace cross join role_closure r
     where n.nspname !~ '^pg_' and n.nspname <> 'information_schema'
     and not exists(select 1 from selected_tables t where t.oid=c.oid)
     and not exists(select 1 from sequence_rows s where s.oid=c.oid)
     and ((c.relkind in ('r','p','v','m','f') and (r.oid=c.relowner or pg_catalog.has_table_privilege(r.oid,c.oid,'INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER')
       or pg_catalog.has_any_column_privilege(r.oid,c.oid,'INSERT,UPDATE,REFERENCES')))
       or (c.relkind='S' and (r.oid=c.relowner or pg_catalog.has_sequence_privilege(r.oid,c.oid,'USAGE,UPDATE')))))
 )) as value
)
select ${carSchemaCatalogColumns}, (select value from privilege_payload) as privileges
`;

type SchemaPlan = Omit<Parameters<typeof createCarSchemaCatalogCollector>[0], "query">;
type SchemaResult = Awaited<ReturnType<ReturnType<typeof createCarSchemaCatalogCollector>>>;
type RuntimePrivileges = { role: string; superuser: false; bypassRls: false; tableWrites: false;
  roleAttributesSha256: string; membershipsSha256: string; schemaPrivilegesSha256: string; tablePrivilegesSha256: string };
type Result = (Extract<SchemaResult, { ok: true }> & { runtimePrivileges: RuntimePrivileges })
  | Extract<SchemaResult, { ok: false }>;
const rootKeys = ["database_name", "inspection_role", "server_version", "read_only", "isolation", "search_path", "functions",
  "replication_role", "constraints", "triggers", "tables"];
function entries(value: unknown, keys: string[], booleanKeys: string[], identity: (r: Row) => string, limit: number): Row[] | null {
  if (!Array.isArray(value) || value.length > limit) return null;
  const seen = new Set<string>();
  for (const row of value) {
    if (!exact(row, keys) || !bools(row, booleanKeys) || seen.has(identity(row))) return null;
    seen.add(identity(row));
  }
  return value as Row[];
}
export function createCarPrivilegeCatalogCollector(deps: SchemaPlan & {
  expectedColumns: unknown; expectedSequences: unknown; query: CarSchemaCatalogQuery | null;
}): () => Promise<Result> {
  const query = deps.query;
  let saved: Record<string, unknown> | null;
  try { const { query: unused, ...rest } = deps; void unused; saved = JSON.parse(JSON.stringify(rest)); } catch { saved = null; }
  return async () => {
    const columnsPlan = saved?.expectedColumns, sequencesPlan = saved?.expectedSequences;
    if (!saved || typeof query !== "function" || !Array.isArray(columnsPlan) || !columnsPlan.length || columnsPlan.length > 512
      || !columnsPlan.every(r => exact(r,["table","name"]) && id(r.table) && id(r.name))
      || new Set(columnsPlan.map(r => r.table+"."+r.name)).size !== columnsPlan.length
      || !Array.isArray(sequencesPlan) || sequencesPlan.length > 128 || !sequencesPlan.every(id)
      || new Set(sequencesPlan).size !== sequencesPlan.length) return {ok:false,reason:"unconfigured"};
    let captured: Row | null = null;
    const result = await createCarSchemaCatalogCollector({ ...saved as SchemaPlan, query: async request => {
      const raw = await query(Object.freeze({...request,sql:carPrivilegeCatalogSql}));
      const row = Array.isArray(raw) && raw.length===1 ? raw[0] : null;
      if (!exact(row,[...rootKeys,"privileges"]) || !Number.isInteger(row.server_version)
        || (row.server_version as number)<160000 || (row.server_version as number)>=190000) return null;
      captured = JSON.parse(JSON.stringify(row)) as Row;
      return [Object.fromEntries(rootKeys.map(k => [k,captured![k]]))];
    } })();
    if (!result.ok) return result;
    const payload = (captured as Row | null)?.privileges;
    if (!exact(payload,["roles","memberships","schemas","tables","columns","sequences","guards"])) return {ok:false,reason:"catalog_mismatch"};
    const roleFlags=["superuser","create_role","create_db","replication","bypass_rls","inherit","login"];
    const roles=entries(payload.roles,["name",...roleFlags,"settings_sha256"],roleFlags,r=>String(r.name),64);
    const members=entries(payload.memberships,["member","role","grantor","admin","inherit","set"],["admin","inherit","set"],r=>r.member+"."+r.role+"."+r.grantor,128);
    const schemas=entries(payload.schemas,["name","usage","create","grant"],["usage","create","grant"],r=>String(r.name),1);
    const tables=entries(payload.tables,["name","select","write","grant","rls","force_rls","policies_sha256"],["select","write","grant","rls","force_rls"],r=>String(r.name),64);
    const columns=entries(payload.columns,["table","name","select","write","grant","supported","definition_sha256"],["select","write","grant","supported"],r=>r.table+"."+r.name,512);
    const sequences=entries(payload.sequences,["name","schema","select","write","grant","definition_sha256"],["select","write","grant"],r=>String(r.name),128);
    const guardKeys=["database_create","database_temp","replication_parameter","unreviewed_definer","function_grant","outside_schema_create","outside_writes"];
    const guards=payload.guards;
    if (!roles?.length || !members || !schemas || !tables || !columns || !sequences
      || !exact(guards,guardKeys) || !bools(guards,guardKeys)) return {ok:false,reason:"catalog_mismatch"};
    const roleNames=new Set(roles.map(r=>r.name));
    if (!roleNames.has(saved.runtimeRole) || roles.some(r=>!id(r.name)||!hash(r.settings_sha256)
      || roleFlags.slice(0,5).some(k=>r[k]!==false))
      || members.some(r=>!id(r.grantor)||!roleNames.has(r.member)||!roleNames.has(r.role)||r.admin!==false)
      || schemas.length!==1||schemas[0].name!=="public"||schemas[0].create!==false||schemas[0].grant!==false
      || guardKeys.filter(k=>k!=="database_temp").some(k=>guards[k]!==false)) return {ok:false,reason:"catalog_mismatch"};
    // Require an actually connected closure, not orphan role rows or omitted edges.
    const reachable=new Set<unknown>([saved.runtimeRole]);
    for(let pass=0;pass<roles.length;pass++) for(const m of members) if(reachable.has(m.member)) reachable.add(m.role);
    if (reachable.size!==roleNames.size) return {ok:false,reason:"catalog_mismatch"};
    const tableNames=new Set([...result.constraints,...result.triggers].map(r=>r.table));
    if(tables.length!==tableNames.size||tables.some(r=>!tableNames.has(r.name as string)||!hash(r.policies_sha256)||r.write||r.grant)
      ||columns.length!==columnsPlan.length||columns.some(r=>!tableNames.has(r.table as string)||!hash(r.definition_sha256)
        ||!columnsPlan.some(p=>p.table===r.table&&p.name===r.name)||r.write||r.grant||r.supported!==true)
      ||[...tableNames].some(name=>!columns.some(c=>c.table===name))
      ||sequences.length!==sequencesPlan.length||sequences.some(r=>r.schema!=="public"||!id(r.name)||!sequencesPlan.includes(r.name)||!hash(r.definition_sha256)||r.write||r.grant)) return {ok:false,reason:"catalog_mismatch"};
    return {...result,runtimePrivileges:{role:saved.runtimeRole as string,superuser:false,bypassRls:false,tableWrites:false,
      roleAttributesSha256:fingerprint("car-role-attributes-v1",{roles,guards:[guards]}),
      membershipsSha256:fingerprint("car-role-memberships-v1",{memberships:members}),
      schemaPrivilegesSha256:fingerprint("car-schema-privileges-v1",{schemas}),
      tablePrivilegesSha256:fingerprint("car-table-column-sequence-v1",{tables,columns,sequences})}};
  };
}
