import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { runInNewContext } from "node:vm";
const require=createRequire(import.meta.url), ts=require("typescript"), cache=new Map();
function load(name){
  if(cache.has(name)) return cache.get(name);
  const compiledModule={exports:{}};
  runInNewContext(ts.transpileModule(readFileSync(new URL(`../src/lib/${name}.ts`,import.meta.url),"utf8"),
    {compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2017}}).outputText,
  {module:compiledModule,exports:compiledModule.exports,require:id=>{
    if(id==="server-only")return {}; if(id.startsWith("./"))return load(id.slice(2));
    if(id==="node:crypto")return require(id); throw Error("Unexpected import");
  }});cache.set(name,compiledModule.exports);return compiledModule.exports;
}
const {createCarPrivilegeCatalogCollector:create,carPrivilegeCatalogSql:sql}=load("carPurchaseProReadinessPrivilegeCatalog");
const copy=v=>JSON.parse(JSON.stringify(v)), sha="a".repeat(64), other="b".repeat(64);
const fn={name:"guard_one",signature:"public.guard_one()",kind:"f",definition_sha256:sha,owner:"test_owner",
  security_definer:true,settings:["search_path=public, pg_temp"],runtime_execute:false,grants:[]};
const roles=[{name:"test_app",superuser:false,create_role:false,create_db:false,replication:false,bypass_rls:false,
  inherit:true,login:true,settings_sha256:sha}];
roles.push({...roles[0],name:"test_reader",login:false});
const privileges={roles,memberships:[{member:"test_app",role:"test_reader",grantor:"test_owner",admin:false,inherit:true,set:true}],
  schemas:[{name:"public",usage:true,create:false,grant:false}],tables:[{name:"test_holds",select:true,write:false,grant:false,rls:false,force_rls:false,policies_sha256:sha}],
  columns:[{table:"test_holds",name:"id",select:true,write:false,grant:false,supported:true,definition_sha256:sha},
    {table:"test_holds",name:"status",select:true,write:false,grant:false,supported:true,definition_sha256:other}],
  sequences:[{schema:"public",name:"test_holds_id_seq",select:false,write:false,grant:false,definition_sha256:sha}],
  guards:{database_create:false,database_temp:true,replication_parameter:false,unreviewed_definer:false,function_grant:false,outside_schema_create:false,outside_writes:false}};
const snapshot={database_name:"test_db",inspection_role:"test_inspector",server_version:180006,read_only:"on",isolation:"repeatable read",
  search_path:"pg_catalog, pg_temp",replication_role:"origin",functions:[fn],
  constraints:[{table:"test_holds",name:"test_pk",definition_sha256:sha,validated:true,enforced:true,internal_count:0,internal_healthy:true,index_healthy:true}],
  triggers:[{table:"test_holds",name:"test_guard",definition_sha256:sha,enabled:"O",function_signature:fn.signature}],
  tables:[{name:"test_holds",ordinary:true,internal_healthy:true}],privileges};
const plan={databaseName:"test_db",inspectionRole:"test_inspector",runtimeRole:"test_app",
  expectedSignatures:[{name:fn.name,signature:fn.signature}],expectedConstraints:[{table:"test_holds",name:"test_pk"}],
  expectedTriggers:[{table:"test_holds",name:"test_guard"}],expectedColumns:privileges.columns.map(({table,name})=>({table,name})),
  expectedSequences:["test_holds_id_seq"]};
let checks=0,calls=0;
async function check({mutate=()=>{},configure=()=>{},expected=false,noQuery=false,output}={}){
  const options=copy(plan);configure(options);const before=calls;
  const result=await create({...options,query:async request=>{
    calls++;assert.equal(request.sql,sql);assert.deepEqual(copy(request.values),["test_app",["guard_one"],["test_holds"]]);
    assert.equal(request.options.readOnly,true);assert.equal(request.options.isolation,"repeatable read");
    for(const item of [request,request.values,request.values[1],request.values[2],request.options])assert.equal(Object.isFrozen(item),true);
    const row=copy(snapshot);mutate(row);return output?output(row):[row];
  }})();
  assert.equal(result.ok,expected);assert.equal(calls-before,noQuery?0:1);
  if(result.ok){assert.equal(result.readiness,false);assert.equal(result.runtimePrivileges.tableWrites,false);
    assert.equal(result.runtimePrivileges.superuser,false);assert.equal(result.runtimePrivileges.bypassRls,false);
    for(const [key,value] of Object.entries(result.runtimePrivileges))if(key.endsWith("Sha256"))assert.match(value,/^[a-f0-9]{64}$/);}
  checks++;return result;
}
const base=await check({expected:true});
const reordered=await check({expected:true,mutate:r=>{r.privileges.roles.reverse();r.privileges.columns.reverse();}});
assert.deepEqual(copy(base.runtimePrivileges),copy(reordered.runtimePrivileges));checks++;
for(const key of ["roles","memberships","schemas","tables","columns","sequences"]){
  await check({mutate:r=>r.privileges[key].push(copy(r.privileges[key][0]))});
  await check({mutate:r=>r.privileges[key][0].extra=true});
  await check({mutate:r=>r.privileges[key]=null});
  for(const field of Object.keys(privileges[key][0])) await check({mutate:r=>{delete r.privileges[key][0][field];}});
}
for(const key of Object.keys(privileges))await check({mutate:r=>{delete r.privileges[key];}});
for(const key of ["superuser","create_role","create_db","replication","bypass_rls"]){
  await check({mutate:r=>r.privileges.roles[0][key]=true});
  await check({mutate:r=>r.privileges.roles[1][key]=true});
}
await check({mutate:r=>r.privileges.roles[0].settings_sha256="UNKNOWN"});
await check({mutate:r=>r.privileges.roles.pop()});
await check({mutate:r=>r.privileges.memberships=[]});
await check({mutate:r=>r.privileges.memberships[0].admin=true});
await check({mutate:r=>r.privileges.memberships[0].member="other_role"});
await check({mutate:r=>r.privileges.schemas[0].create=true});
await check({mutate:r=>r.privileges.schemas[0].grant=true});
for(const key of ["tables","columns","sequences"]){
  for(const flag of ["write","grant"])await check({mutate:r=>r.privileges[key][0][flag]=true});
  await check({mutate:r=>r.privileges[key][0].name="unexpected"});
  await check({mutate:r=>r.privileges[key].pop()});
}
for(const key of ["database_create","replication_parameter","unreviewed_definer","function_grant","outside_schema_create","outside_writes"])await check({mutate:r=>r.privileges.guards[key]=true});
for(const key of Object.keys(privileges.guards))await check({mutate:r=>{delete r.privileges.guards[key];}});
await check({mutate:r=>r.privileges.columns[0].supported=false});
await check({mutate:r=>r.privileges.columns[0].definition_sha256="UNKNOWN"});
await check({mutate:r=>r.privileges.tables[0].policies_sha256="UNKNOWN"});
await check({mutate:r=>r.privileges.sequences[0].definition_sha256="UNKNOWN"});
await check({mutate:r=>r.privileges.sequences[0].schema="other"});
for(const version of [140000,150006,190000,"180006"])await check({mutate:r=>r.server_version=version});
await check({expected:true,mutate:r=>r.server_version=160000});
await check({mutate:r=>r.privileges.extra=true});
await check({mutate:r=>r.extra=true});
await check({mutate:r=>r.privileges.guards.extra=false});
for(const [path,hashKey] of [["settings","roleAttributesSha256"],["membership","membershipsSha256"],["schema","schemaPrivilegesSha256"],
  ["column","tablePrivilegesSha256"],["sequence","tablePrivilegesSha256"],["policies","tablePrivilegesSha256"]]){
  const changed=await check({expected:true,mutate:r=>{
    if(path==="settings")r.privileges.roles[0].settings_sha256=other;
    if(path==="membership"){r.privileges.memberships[0].inherit=false;r.privileges.memberships[0].set=false;}
    if(path==="schema")r.privileges.schemas[0].usage=false;
    if(path==="column")r.privileges.columns[0].definition_sha256=other;
    if(path==="sequence")r.privileges.sequences[0].definition_sha256=other;
    if(path==="policies")r.privileges.tables[0].policies_sha256=other;
  }});assert.notEqual(changed.runtimePrivileges[hashKey],base.runtimePrivileges[hashKey]);checks++;
}
for(const key of ["expectedColumns","expectedSequences"]){
  for(const value of [null,{},[null]])await check({configure:p=>p[key]=value,noQuery:true});
}
await check({configure:p=>p.expectedColumns=[],noQuery:true});
await check({configure:p=>p.expectedColumns.push(copy(p.expectedColumns[0])),noQuery:true});
await check({configure:p=>p.expectedSequences.push(p.expectedSequences[0]),noQuery:true});
await check({configure:p=>p.expectedColumns[0].name="x;drop",noQuery:true});
await check({configure:p=>p.expectedSequences=["x;drop"],noQuery:true});
await check({configure:p=>p.expectedColumns[0].extra=true,noQuery:true});
await check({expected:true,configure:p=>p.expectedSequences=[],mutate:r=>r.privileges.sequences=[]});
for(const raw of [null,{},[],[snapshot,snapshot]])await check({output:()=>raw});
const failure=await check({output:()=>{throw Error("private database credentials");}});
assert.equal(JSON.stringify(failure).includes("private"),false);checks++;
const pending=[];
const collector=create({...plan,query:()=>new Promise(resolve=>pending.push(resolve))});
const first=collector(),second=collector(),different=copy(snapshot);different.privileges.columns[0].definition_sha256=other;
pending[1]([different]);pending[0]([snapshot]);
const a=await first,b=await second;assert.equal(a.ok&&b.ok,true);
assert.equal(a.runtimePrivileges.tablePrivilegesSha256,base.runtimePrivileges.tablePrivilegesSha256);
assert.notEqual(b.runtimePrivileges.tablePrivilegesSha256,base.runtimePrivileges.tablePrivilegesSha256);checks+=2;
console.log(JSON.stringify({status:"PASS",checks,mockSingleStatementCalls:calls,interleavedCalls:2,actualSqlCalls:0,
  sqlParsed:false,actualPrivilegeOrColumnHashesVerified:false,readiness:false,productionConnected:false}));
