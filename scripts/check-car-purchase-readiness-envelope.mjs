import assert from "node:assert/strict";
import { createHash, generateKeyPairSync, sign } from "node:crypto";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { runInNewContext } from "node:vm";
const require=createRequire(import.meta.url), ts=require("typescript"), cache=new Map();
function load(name){
  if(cache.has(name))return cache.get(name);
  const compiledModule={exports:{}};
  runInNewContext(ts.transpileModule(readFileSync(new URL(`../src/lib/${name}.ts`,import.meta.url),"utf8"),
    {compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2017}}).outputText,
  {module:compiledModule,exports:compiledModule.exports,Buffer,URL,require:id=>{
    if(id==="server-only")return {}; if(id.startsWith("./"))return load(id.slice(2));
    if(id==="node:crypto")return require(id);throw Error("Unexpected import");
  }});cache.set(name,compiledModule.exports);return compiledModule.exports;
}
const {createCarReadinessEnvelope:create}=load("carPurchaseProReadinessEnvelope");
const {createCarPrivilegeCatalogCollector:collect,carPrivilegeCatalogSql:sql}=load("carPurchaseProReadinessPrivilegeCatalog");
const {carReadinessFunctionNames:names,carReadinessConstraintTables:tables,carReadinessCheckIds:ids}=load("carPurchaseProReadinessEvidence");
const copy=v=>JSON.parse(JSON.stringify(v)),sha="a".repeat(64),other="b".repeat(64),time=Date.parse("2026-09-04T00:00:00Z");
const signing=generateKeyPairSync("ed25519"),wrongSigner=generateKeyPairSync("ed25519");
const publicPem=signing.publicKey.export({type:"spki",format:"pem"});
const digest=json=>createHash("sha256").update(json,"utf8").digest("hex");
const signed=(report,key=signing.privateKey)=>{const reportJson=JSON.stringify(report);return {reportJson,issuerKeyId:report.issuerKeyId,
  signature:sign(null,Buffer.from("car-readiness-report-v1\n"+reportJson),key).toString("base64")};};
// Synthetic fixture only: no real approval, executed report, key registry or DB.
const environment={databaseIdentity:"synthetic-provider-project-branch-db",runtimeRole:"test_app",ownerRole:"test_owner",
  mode:"test",deployment:"nonproduction",origin:"https://example.invalid"};
const offer={productCode:"car_purchase_pro",currency:"aud",billing:"one_time",priceCents:1234,
  stripePriceId:"price_Synthetic",stripeProductId:"prod_Synthetic",termsVersion:"2026-09-04"};
const triggerTables=["payment_webhook_events","entitlement_event_tombstones","first_sale_gate_events","car_purchase_exception_receipts"];
const raw={database_name:"test_db",inspection_role:"test_inspector",server_version:180006,read_only:"on",isolation:"repeatable read",
  search_path:"pg_catalog, pg_temp",replication_role:"origin",
  functions:names.map(name=>({name,signature:`public.${name}(text)`,kind:"f",definition_sha256:sha,owner:"test_owner",
    security_definer:true,settings:["search_path=public, pg_temp"],runtime_execute:false,grants:[]})),
  constraints:tables.map(table=>({table,name:"synthetic_constraint",definition_sha256:sha,validated:true,enforced:true,
    internal_count:0,internal_healthy:true,index_healthy:true})),
  triggers:triggerTables.map(table=>({table,name:"synthetic_trigger",definition_sha256:sha,enabled:"O",function_signature:`public.${names[0]}(text)`})),
  tables:tables.map(name=>({name,ordinary:true,internal_healthy:true})),
  privileges:{roles:[{name:"test_app",superuser:false,create_role:false,create_db:false,replication:false,bypass_rls:false,
    inherit:true,login:true,settings_sha256:sha}],memberships:[],schemas:[{name:"public",usage:true,create:false,grant:false}],
    tables:tables.map(name=>({name,select:true,write:false,grant:false,rls:false,force_rls:false,policies_sha256:sha})),
    columns:tables.map(table=>({table,name:"id",select:true,write:false,grant:false,supported:true,definition_sha256:sha})),sequences:[],
    guards:{database_create:false,database_temp:true,replication_parameter:false,unreviewed_definer:false,function_grant:false,outside_schema_create:false,outside_writes:false}}};
const config={databaseName:"test_db",inspectionRole:"test_inspector",expectedColumns:tables.map(table=>({table,name:"id"})),expectedSequences:[]};
const plan={...config,runtimeRole:"test_app",expectedSignatures:raw.functions.map(({name,signature})=>({name,signature})),
  expectedConstraints:raw.constraints.map(({table,name})=>({table,name})),expectedTriggers:raw.triggers.map(({table,name})=>({table,name}))};
// One mocked fixture bootstrap computes the canonical catalog pins, no SQL.
const observation=await collect({...plan,query:async()=>[copy(raw)]})();assert.equal(observation.ok,true);
const baseReports=Object.fromEntries(ids.map(id=>[id,{version:"car-readiness-report-v1",id,issuerKeyId:"issuer_one",candidateCommit:"a".repeat(40),
  environment,offer,issuedAt:time-2000,expiresAt:time+90000,result:"PASS",evidenceClass:"executed",artifactSha256:sha}]));
const manifest={version:"car-readiness-evidence-v1",approvalId:"CAR-PURCHASE-LAUNCH",candidateCommit:"a".repeat(40),approvedAt:time-1000,expiresAt:time+120000,
  environment,offer,inventory:{functions:observation.functions,constraints:observation.constraints,triggers:observation.triggers,
    runtimePrivileges:observation.runtimePrivileges,checks:ids.map(id=>({id,passed:true,evidenceSha256:digest(JSON.stringify(baseReports[id]))}))}};
const binding={version:"car-deployment-binding-v1",candidateCommit:manifest.candidateCommit,environment,offer,databaseName:"test_db",inspectionRole:"test_inspector"};
let checks=0,reportReads=0,catalogQueries=0;
async function check({changeReport=()=>{},changeWire=()=>{},changeManifest=()=>{},changeBinding=()=>{},changeCatalog=()=>{},changeEnvelope=()=>{},configure=()=>{},
  expected=false,noQuery=false,noReports=false,atQuery}={}){
  const m=copy(manifest),reports=copy(baseReports);changeReport(reports[ids[0]]);
  const wires=Object.fromEntries(ids.map(id=>[id,signed(reports[id])]));
  m.inventory.checks=m.inventory.checks.map(c=>({...c,evidenceSha256:digest(wires[c.id].reportJson)}));changeManifest(m);
  let now=time;const beforeReports=reportReads,beforeQueries=catalogQueries;
  const deps={approvedManifestJson:JSON.stringify(m),catalogConfig:copy(config),trustedReportKeys:{issuer_one:publicPem},now:()=>now,
    readReport:async id=>{assert.ok(ids.includes(id));const wire=copy(wires[id]);changeWire(wire,id);return wire;},
    query:async request=>{assert.equal(request.sql,sql);assert.equal(request.options.readOnly,true);
      assert.equal(request.options.isolation,"repeatable read");const row=copy(raw),bound=copy(binding);changeCatalog(row);changeBinding(bound);
      if(atQuery!==undefined)now=atQuery;const envelope={binding:bound,rows:[row],challenge:request.challenge,observedAt:now};
      changeEnvelope(envelope);return envelope;}};
  configure(deps);
  const read=deps.readReport,query=deps.query;
  if(typeof read==="function")deps.readReport=async id=>{reportReads++;return read(id);};
  if(typeof query==="function")deps.query=async request=>{catalogQueries++;return query(request);};
  const result=await create(deps)();assert.equal(result.ok,expected);
  if(expected){assert.equal(result.salesAuthorized,false);assert.equal(Object.hasOwn(result,"accessFunctions"),false);
    assert.equal(reportReads-beforeReports,11);assert.equal(catalogQueries-beforeQueries,1);}
  if(noQuery)assert.equal(catalogQueries,beforeQueries);if(noReports)assert.equal(reportReads,beforeReports);
  checks++;return result;
}
await check({expected:true});
for(const key of Object.keys(baseReports[ids[0]]))await check({changeReport:r=>{delete r[key];},noQuery:true});
for(const [key,value] of Object.entries({version:"other",id:ids[1],issuerKeyId:"unknown",candidateCommit:"b".repeat(40),
  issuedAt:time+1,expiresAt:time,result:"FAIL",evidenceClass:"mock",artifactSha256:"UNKNOWN"}))await check({changeReport:r=>r[key]=value,noQuery:true});
await check({changeReport:r=>r.extra=true,noQuery:true});
await check({changeReport:r=>r.environment.databaseIdentity="other-db",noQuery:true});
await check({changeReport:r=>r.environment.mode="live",noQuery:true});
await check({changeReport:r=>r.offer.priceCents++,noQuery:true});
await check({changeReport:r=>r.offer.extra=true,noQuery:true});
await check({changeReport:r=>r.issuedAt=time-500,noQuery:true}); // Occurred after manifest approval.
await check({changeReport:r=>r.expiresAt=time+5,atQuery:time+10}); // Expires during query.
for(const key of ["reportJson","signature","issuerKeyId"])await check({changeWire:w=>{delete w[key];},noQuery:true});
await check({changeWire:w=>w.extra=true,noQuery:true});
await check({changeWire:w=>w.reportJson+=" ",noQuery:true});
await check({changeWire:w=>w.reportJson="x".repeat(65537),noQuery:true});
await check({changeWire:w=>w.signature=Buffer.alloc(64).toString("base64"),noQuery:true});
await check({changeWire:w=>w.signature=w.signature.slice(0,-1),noQuery:true});
await check({changeWire:w=>w.signature=" "+w.signature.slice(1),noQuery:true});
await check({changeWire:w=>w.issuerKeyId="unknown",noQuery:true});
await check({changeWire:w=>w.signature=sign(null,Buffer.from("car-readiness-report-v1\n"+w.reportJson),wrongSigner.privateKey).toString("base64"),noQuery:true});
await check({changeWire:w=>w.signature=sign(null,Buffer.from(w.reportJson),signing.privateKey).toString("base64"),noQuery:true});
await check({changeManifest:m=>m.inventory.checks[0].evidenceSha256=other,noQuery:true});
await check({changeManifest:m=>m.approvalId="self-approved",noQuery:true,noReports:true});
await check({changeManifest:m=>m.expiresAt=time,noQuery:true,noReports:true});
for(const value of [null,{}, {issuer_one:"bad key"}, {issuer_one:signing.privateKey.export({type:"pkcs8",format:"pem"})},
  {issuer_one:generateKeyPairSync("ec",{namedCurve:"prime256v1"}).publicKey.export({type:"spki",format:"pem"})}]){
  await check({configure:d=>d.trustedReportKeys=value,noQuery:true,noReports:true});
}
await check({configure:d=>d.readReport=null,noQuery:true,noReports:true});
await check({configure:d=>d.query=null,noQuery:true,noReports:true});
await check({configure:d=>d.readReport=async()=>null,noQuery:true});
await check({configure:d=>d.readReport=async()=>{throw Error("private report storage");},noQuery:true});
for(const key of Object.keys(binding))await check({changeBinding:b=>{delete b[key];}});
await check({changeBinding:b=>b.extra=true});
await check({changeBinding:b=>b.environment.databaseIdentity="other-project-branch"});
await check({changeBinding:b=>b.candidateCommit="b".repeat(40)});
await check({changeBinding:b=>b.offer.stripePriceId="price_Other"});
await check({changeBinding:b=>b.databaseName="other_db"});
await check({changeBinding:b=>b.inspectionRole="other_inspector"});
await check({changeCatalog:r=>r.functions[0].definition_sha256=other});
await check({changeCatalog:r=>r.privileges.columns[0].definition_sha256=other});
await check({changeCatalog:r=>r.read_only="off"});
await check({changeEnvelope:e=>e.challenge="previous-request"});
await check({changeEnvelope:e=>e.observedAt=time-1});
await check({changeEnvelope:e=>e.observedAt=time+1});
await check({changeEnvelope:e=>{delete e.observedAt;}});
await check({changeEnvelope:e=>e.extra=true});
await check({atQuery:time+60001});
await check({atQuery:time-3000});
const failure=await check({configure:d=>d.query=async()=>{throw Error("private provider secret");}});
assert.equal(JSON.stringify(failure).includes("private"),false);checks++;
// Both calls read reports afresh, then independently await their own catalog result.
const pending=[],wires=Object.fromEntries(ids.map(id=>[id,signed(baseReports[id])]));
const deps={approvedManifestJson:JSON.stringify(manifest),catalogConfig:copy(config),trustedReportKeys:{issuer_one:publicPem},now:()=>time,
  readReport:async id=>copy(wires[id]),query:request=>new Promise(resolve=>pending.push({request,resolve}))};
const reader=create(deps);deps.catalogConfig.expectedColumns=[];deps.trustedReportKeys.issuer_one="changed";
const first=reader(),second=reader();await new Promise(setImmediate);assert.equal(pending.length,2);
const altered=copy(raw);altered.functions[0].definition_sha256=other;
pending[1].resolve({binding:copy(binding),rows:[altered],challenge:pending[1].request.challenge,observedAt:time});
pending[0].resolve({binding:copy(binding),rows:[copy(raw)],challenge:pending[0].request.challenge,observedAt:time});
assert.equal((await first).ok,true);assert.equal((await second).ok,false);checks+=2;
console.log(JSON.stringify({status:"PASS",checks,reportReads,catalogQueries,interleavedQueries:2,fixtureBootstrapQueries:1,
  crypto:"real Node Ed25519 with ephemeral synthetic keys",realSqlCalls:0,realApprovals:0,actualMessages:0,productionConnected:false}));
