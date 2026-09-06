import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const source = fs.readFileSync('src/lib/jobEndDeadline.ts', 'utf8');
const compiled = { exports: {} };
new Function('exports', 'require', 'module', ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText)(compiled.exports, require, compiled);
const { buildJobEndDeadline: build, JOB_END_ROUTES: R, validJobEndDate } = compiled.exports;
const base = { event: 'final_pay_under_instrument', today: '2026-09-07', terminationDate: '2026-09-07' };
const notice = { event: 'payment_in_lieu', notice: 'payout' };
const cert = { event: 'requested_employment_certificate', certificate: 'recipientRequested', requestDate: '2026-09-07' };
const cases = [
 ['JE01', {instrument:'verified7'}, 'instrument_due_verified','2026-09-14','final','check_final_pay_items'],
 ['JE02', {instrument:'award_unknown'}, 'instrument_due_unknown','CHECK NOW','final','check_award_agreement_contract'],
 ['JE03', {instrument:'verifiedDate',verifiedDue:'2026-09-10'},'instrument_due_verified','2026-09-10','final','check_final_pay_items'],
 ['JE04', {instrument:'agreement_unknown'},'instrument_due_unknown','CHECK NOW','final','check_award_agreement_contract'],
 ['JE05', {instrument:'contract_only',verifiedDue:'2026-09-10'},'instrument_due_unknown','CHECK NOW','final','check_award_agreement_contract'],
 ['JE06', {instrument:'award_free'},'instrument_due_unknown','CHECK NOW','final','check_award_agreement_contract'],
 ['JE07', {instrument:'verified7',terminationDate:''},'instrument_due_unknown','GET TERMINATION DATE','final','check_award_agreement_contract'],
 ['JE08', {instrument:'verified7',terminationDate:'2026-09-12'},'instrument_due_verified','2026-09-19 Saturday','final','check_final_pay_items'],
 ['JE09', {instrument:'verified7',publicHolidayRuleUnknown:true},'instrument_due_unknown','CHECK INSTRUMENT; NO AUTO-SHIFT','final','check_award_agreement_contract'],
 ['JE10', {...notice,terminationDate:'2026-09-10'},'due_before_or_on_termination_day','ON OR BEFORE 2026-09-10','final','ask_employer_for_payment_in_lieu_record'],
 ['JE11', {...notice,paymentMissing:true,today:'2026-09-08'},'overdue_action_required','NOW','help','contact_fwo_now'],
 ['JE12', {...notice,terminationDate:'',paymentMissing:true},'instrument_due_unknown','CHECK TERMINATION DATE NOW','final','ask_employer_for_payment_in_lieu_record'],
 ['JE13', {...notice,notice:'worked'},'not_applicable','N/A FOR PAYMENT IN LIEU','final','check_final_pay_items'],
 ['JE14', {...notice,notice:'partial',terminationDate:'2026-09-11'},'due_before_or_on_termination_day','ON OR BEFORE 2026-09-11','final','ask_employer_for_payment_in_lieu_record'],
 ['JE15', cert,'certificate_due_14_days_from_request','2026-09-21','person','submit_certificate_to_services_australia'],
 ['JE16', {...cert,requestDate:'2026-09-12'},'certificate_due_14_days_from_request','2026-09-26 Saturday; NO AUTO-SHIFT','person','submit_certificate_to_services_australia'],
 ['JE17', {...cert,certificate:'newClaim'},'certificate_request_or_condition_unknown','CHECK CLAIM TASK NOW','person','request_employment_separation_certificate'],
 ['JE18', {...cert,certificate:'employerEmployeeRequest'},'certificate_due_14_days_from_request','2026-09-21','employer','give_certificate_to_requester'],
 ['JE19', {...cert,certificate:'employerAgencyRequest'},'certificate_due_14_days_from_request','2026-09-21','employer','give_certificate_to_requester'],
 ['JE20', {...cert,certificate:'noRequest'},'not_applicable','NO DUE UNTIL REQUEST/CONDITION','person','request_employment_separation_certificate'],
 ['JE21', {...cert,requestDate:''},'certificate_request_or_condition_unknown','CHECK REQUEST DATE NOW','person','submit_certificate_to_services_australia'],
 ['JE22', {...cert,cannotGetCertificate:true},'certificate_due_14_days_from_request','2026-09-21','person','use_services_australia_alternative_evidence'],
 ['JE23', {...cert,requestDate:'2026-08-20',certificateOutstanding:true},'overdue_action_required','NOW','person','submit_certificate_to_services_australia'],
 ['JE24', {finalItem:'redundancy'},'instrument_due_unknown','CHECK NOW','redundancy','check_redundancy_entitlement'],
 ['JE25', {finalItem:'annualLeave'},'instrument_due_unknown','CHECK WITH FINAL-PAY RULE','leave','check_unused_annual_leave'],
 ['JE26', {finalItem:'sickLeave'},'instrument_due_unknown','CHECK FINAL-PAY ITEMS NOW','final','check_final_pay_items'],
 ['JE27', {finalItem:'super',instrument:'verified7'},'instrument_due_unknown','SEPARATE SUPER CHECK','super','check_super_separately'],
 ['JE28', {instrument:'verifiedDate',verifiedDue:'2026-09-03',paymentMissing:true},'overdue_action_required','NOW','help','start_fwo_underpayment_steps'],
 ['JE29', {event:'unknown',urgentLoss:true},'overdue_action_required','NOW','help','contact_fwo_now'],
 ['JE30', {...cert,hardship:true},'overdue_action_required','NOW','person','contact_services_australia_hardship_line'],
 ['JE31', {event:'unknown'},'instrument_due_unknown','CHOOSE EVENT NOW','final','choose_event_type'],
 ['JE32', {sourceUnavailable:true},'official_source_unavailable','RECHECK 2026-09-08 AEST','final','retry_official_source_on_recheck_date'],
 ['JE33', {...cert,sourceUnavailable:true},'official_source_unavailable','RECHECK 2026-09-08 AEST','person','retry_official_source_on_recheck_date'],
];
const fields = ['event_type','applicability','due_state','due_or_recheck','official_route','next_action','external_evidence_state'];
for (const [id, input, state, due, route, action] of cases) {
 const r = build({...base,...input});
 assert.deepEqual(Object.keys(r),fields,id+' field contract');
 assert.deepEqual([r.due_state,r.due_or_recheck,r.official_route,r.next_action],[state,due,R[route],action],id);
 assert.equal(r.external_evidence_state,'not_checked',id+' no evidence inference');
 assert.doesNotMatch(JSON.stringify(r), /"(?:owed|paid|submitted|resolved)"/,id);
}
for (const date of ['', 'not-a-date','2026-02-30','2026-13-01','2026-1-1']) {
 assert.equal(validJobEndDate(date),false);
 assert.equal(build({...base,instrument:'verified7',terminationDate:date,paymentMissing:true}).due_state,'instrument_due_unknown');
 assert.equal(build({...base,...cert,requestDate:date,certificateOutstanding:true}).due_state,'certificate_request_or_condition_unknown');
}
assert.equal(validJobEndDate('2028-02-29'),true);
assert.equal(build({...base,instrument:'verified7',terminationDate:'2026-10-01'}).due_or_recheck,'2026-10-08','DST does not alter calendar math');
assert.equal(build({...base,instrument:'unknown',paymentMissing:true}).due_state,'instrument_due_unknown','missing money does not invent a due date');
assert.equal(build({...base,...notice,notice:'unknown',paymentMissing:true,today:'2026-09-08'}).due_state,'instrument_due_unknown','applicability required');
assert.equal(build({...base,...cert,certificate:'unknown',requestDate:'2026-08-01',certificateOutstanding:true}).due_state,'certificate_request_or_condition_unknown','request date alone is insufficient');
assert.equal(build({...base,...cert,requestDate:'2026-08-20'}).due_state,'certificate_due_14_days_from_request','elapsed date does not infer non-submission');
assert.equal(build({...base,...cert,certificate:'newClaim',hardship:true}).next_action,'request_employment_separation_certificate','recipient hardship branch requires recipient condition');
for(const evidence of ['not_checked','requested','received_not_verified','verified_by_user_outside_product','unavailable']) {
 assert.equal(build({...base,evidence}).external_evidence_state,evidence);
 assert.equal(build({...base,evidence}).due_state,'instrument_due_unknown');
}
const component=fs.readFileSync('src/components/resources/JobEndDeadlineNextAction.tsx','utf8');
assert.doesNotMatch(component,/localStorage|sessionStorage|fetch\(|sendBeacon|track\(/,'memory only, no analytics or backend');
console.log('JOB_END_DEADLINE=PASS JE01-JE33; additional date, privacy, applicability and evidence assertions. JE34-JE36 require browser verification.');
