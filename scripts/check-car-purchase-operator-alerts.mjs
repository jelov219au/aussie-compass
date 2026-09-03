import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { runInNewContext } from "node:vm";
const require=createRequire(import.meta.url),ts=require("typescript"),compiledModule={exports:{}};
runInNewContext(ts.transpileModule(readFileSync(new URL("../src/lib/carPurchaseProOperatorAlerts.ts",import.meta.url),"utf8"),
  {compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2017}}).outputText,
  {exports:compiledModule.exports,module:compiledModule,Date,require:name=>name==="server-only"?{}:(()=>{throw Error("Unexpected import: "+name)})()});
const {deliverCarPurchaseOperatorAlert:deliver}=compiledModule.exports;
const now=new Date("2026-09-04T00:00:00Z"),token="a".repeat(43);
const ids={productCode:"car_purchase_pro",checkoutSessionId:"cs_test_alertFullCheckout123",paymentIntentId:"pi_alertFullPayment123",customerId:"cus_privateCustomer123"};
const pending={receipt:{eventId:"evt_alertPending123",eventType:"checkout.session.completed",livemode:false,createdAt:now},
  command:{...ids,chargeId:null,action:"pending",reason:"checkout_payment_pending",referenceId:ids.checkoutSessionId,currentStatus:"processing"}};
const failure={receipt:{...pending.receipt,eventId:"evt_alertFailure123",eventType:"checkout.session.async_payment_failed"},
  command:{...pending.command,action:"revoke",reason:"async_payment_failed",currentStatus:"requires_payment_method"}};
const refund={receipt:{...pending.receipt,eventId:"evt_alertRefund123",eventType:"refund.updated"},
  command:{...ids,chargeId:"ch_alertFullCharge123",action:"review",reason:"charge_partially_refunded"}};
const dispute={receipt:{...pending.receipt,eventId:"evt_alertDispute123",eventType:"charge.dispute.funds_reinstated"},
  command:{...ids,chargeId:"ch_alertFullCharge123",action:"review",reason:"dispute_requires_review",referenceId:"dp_alertDispute123",currentStatus:"won"}};
const suffix=value=>value.slice(-8);
function intent(input,patch={}){const c=input.command;return{outcome:"claimed",intent:{alertKind: input===refund?"refund_event":input===dispute?"dispute_event":"fulfillment_attention",
  eventType:input.receipt.eventType,eventRefLast8:suffix(input.receipt.eventId),productCode:"car_purchase_pro",checkoutRefLast8:suffix(c.checkoutSessionId),
  paymentIntentRefLast8:suffix(c.paymentIntentId),...(c.chargeId?{chargeRefLast8:suffix(c.chargeId)}:{}),attempts:1,claimToken:token,...patch}}}
let claims=[],marked=[],released=[],sent=[],claimResult=intent(pending),senderResult={outcome:"sent"};
let senderThrows=false,markResult=true,releaseThrows=false,checks=0;
const outbox={claim:async(eventId,kind)=>{claims.push([eventId,kind]);return claimResult},markSent:async(...args)=>{marked.push(args);return markResult},
  release:async(...args)=>{released.push(args);if(releaseThrows)throw Error("private release");return true}};
const sender=async value=>{sent.push(value);if(senderThrows)throw Error("private sender");return senderResult};
async function ok(input,outcome="sent"){const result=await deliver(input,outbox,sender);assert.equal(JSON.stringify(result),JSON.stringify({outcome}));checks++}
async function reject(input=pending,box=outbox,send=sender){await assert.rejects(deliver(input,box,send));checks++}
for(const input of [pending,failure,refund,dispute]){claimResult=intent(input);await ok(input);const msg=sent.at(-1);assert.equal(Object.isFrozen(msg),true);
  for(const value of [input.command.customerId,input.command.checkoutSessionId,input.command.paymentIntentId,input.command.chargeId,"metadata","secret",token])
    if(value)assert.equal(JSON.stringify(msg).includes(value),false);
  assert.ok(msg.text.includes(suffix(input.receipt.eventId)));assert.ok(msg.text.length<2000);assert.ok(msg.subject.length<160);
}
assert.ok(sent[0].subject.includes("대기"));assert.ok(sent[1].subject.includes("실패"));assert.ok(sent[2].text.includes("자동 복원하지 마세요"));
assert.ok(sent[3].text.includes("승소 또는 자금 반환"));assert.equal(marked.length,4);assert.equal(released.length,0);
for(const outcome of ["sent","busy"]){claimResult={outcome};const before=sent.length;await ok(pending,outcome==="sent"?"already_sent":"busy");assert.equal(sent.length,before)}
claimResult={outcome:"missing"};await reject();
for(const patch of [{alertKind:"refund_event"},{eventType:"refund.updated"},{eventRefLast8:"wrong"},{productCode:"eofy_pro"},
  {checkoutRefLast8:"wrong"},{paymentIntentRefLast8:"wrong"},{chargeRefLast8:"unexpected"},{attempts:0},{attempts:1001},{attempts:1.5},
  {claimToken:"short"},{privateField:"secret"}]){claimResult=intent(pending,patch);await reject()}
claimResult={...intent(pending),extra:true};await reject();
claimResult={outcome:"claimed",intent:null};await reject();
claimResult=null;await reject();
for(const [input,patch] of [[refund,{chargeRefLast8:"wrong"}],[dispute,{eventType:"charge.dispute.closed"}]]){claimResult=intent(input,patch);await reject(input)}
const beforeInvalid=claims.length;
for(const [input,patch] of [[pending,{productCode:"car_buy_pro"}],[pending,{checkoutSessionId:"cs_live_x"}],[pending,{paymentIntentId:"bad"}],
  [pending,{customerId:"bad"}],[pending,{referenceId:"cs_test_other"}],[pending,{reason:"checkout_paid"}],[failure,{action:"grant"}],
  [refund,{chargeId:"bad"}],[refund,{reason:"checkout_paid"}],[dispute,{referenceId:"re_bad"}],[dispute,{reason:"dispute_won_or_funds_reinstated"}]]){
  await reject({...input,command:{...input.command,...patch}})}
for(const patch of [{eventId:"bad"},{eventType:"invoice.paid"},{livemode:true},{createdAt:new Date(NaN)}])await reject({...pending,receipt:{...pending.receipt,...patch}});
assert.equal(claims.length,beforeInvalid,"Invalid inputs must not claim an alert.");
for(const patch of [{claim:null},{markSent:null},{release:null}])await reject(pending,{...outbox,...patch});
claimResult=intent(pending);senderThrows=true;await reject();senderThrows=false;assert.equal(released.length,1);
senderResult={outcome:"queued"};await reject();senderResult={outcome:"sent"};assert.equal(released.length,2);
markResult=false;await reject();markResult=true;assert.equal(released.length,3);
markResult=false;releaseThrows=true;await reject();markResult=true;releaseThrows=false;assert.equal(released.length,4);
// Retry after release claims again and sends the same bounded message.
const beforeRetry=sent.length;claimResult=intent(pending,{attempts:2});await ok(pending);assert.equal(sent.length,beforeRetry+1);
assert.equal(marked.at(-1)[2],token);assert.equal(claims.at(-1)[0],pending.receipt.eventId);
console.log(JSON.stringify({status:"PASS",checks,deliveredMocks:sent.length,releasePaths:released.length,actualMessagesSent:0,rawEventsPassedToSender:0}));
