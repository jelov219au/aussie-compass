import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
const source=fs.readFileSync('src/lib/visaPreparationNextAction.ts','utf8');
const compiled={exports:{}};
new Function('exports','module',ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText)(compiled.exports,compiled);
const {buildVisaNextAction:build,VISA_ROUTES:R,VISA_STAGES:stages,VISA_FAMILIES:families,VISA_STOPS:stops,VISA_ACTIONS:actions}=compiled.exports;
const fields=['applicant_selected_stage','applicant_selected_visa_family','stable_official_route','prerequisites','what_not_to_do','next_check_and_external_evidence'];
const P={
 explore:['purpose_selected','current_location_context_known'],
 docs:['subclass_or_stream_page_selected_by_user','apply_location_condition_checked','official_document_checklist_open'],
 ready:['official_account_access','answers_and_applicants_reviewed','external_copy_location_chosen'],
 wait:['official_account_access','acknowledgement_or_status_available','contact_details_current'],
 rfi:['official_request_letter_available','request_due_date_read','official_account_access'],
 health:['official_health_request_available','HAP_ID_available_outside_product','approved_provider_location_checked'],
 bio:['official_biometrics_letter_available','VLN_prefix_checked_outside_product','official_app_or_ABCC_path_checked'],
 decision:['written_decision_notice_available','official_account_access','external_copy_location_chosen'],
 verify:['official_account_access','correspondence_available_outside_product'],
};
const day='2026-09-07',tomorrow='2026-09-08',kept='kept_outside_hoju_compass';
const cases=[];
const exploreStops=['do_not_select_subclass_for_user','do_not_infer_course_or_student_eligibility','do_not_infer_sponsorship_or_work_rights','do_not_infer_relationship_or_sponsor_eligibility','do_not_infer_protection_criteria_or_safe_route','do_not_start_application_until_user_confirms_official_option'];
const familyList=['visit','study','work','family','humanitarian_or_protection','other_or_unsure'];
familyList.forEach((family,k)=>cases.push([`VP0${k+1}`,{stage:'exploring',family},'HA-EXPLORE','explore_options',P.explore,exploreStops[k],tomorrow,'not_needed']));
const docSpecs=[['HA-APPLY','open_selected_visa_step_by_step','do_not_turn_generic_list_into_mandatory_requirements'],['HA-ATTACH','check_form_attachment_instructions','do_not_email_documents_to_department'],['HA-APPLY','open_selected_visa_step_by_step','do_not_infer_occupation_sponsor_or_skills_documents'],['HA-ATTACH','check_form_attachment_instructions','do_not_collect_relationship_evidence_in_hoju_compass'],['HA-APPLY','open_selected_visa_step_by_step','do_not_request_claim_or_identity_narrative'],['HA-EXPLORE','confirm_official_option_before_documents','do_not_build_document_list_without_selected_official_page']];
familyList.forEach((family,k)=>{const [route,action,stop]=docSpecs[k];cases.push([`VP${String(k+7).padStart(2,'0')}`,{stage:'preparing_documents',family},route,action,k===5?P.explore:P.docs,stop,tomorrow,k===5?'not_needed':'not_yet'])});
const rfi={stage:'further_information_requested',requestVerified:true},health={stage:'health_exam_requested',requestVerified:true},bio={stage:'biometrics_requested',requestVerified:true};
cases.push(
 ['VP13',{stage:'ready_to_submit',family:'work',reviewed:true,evidence:kept},'IMMI-LOGIN','review_and_submit_in_official_account',P.ready,'if_answers_documents_stream_or_apply_location_are_unconfirmed',day,kept],
 ['VP14',{stage:'ready_to_submit',family:'study',reviewed:true,evidence:kept},'IMMI-LOGIN','review_and_submit_in_official_account',P.ready,'do_not_treat_ready_to_submit_as_submitted',day,kept],
 ['VP15',{stage:'ready_to_submit',family:'family',reviewed:false},'IMMI-LOGIN','review_each_applicant_before_submit',P.ready,'do_not_submit_with_unreviewed_applicant_or_attachment',tomorrow,'not_yet'],
 ['VP16',{stage:'submitted_waiting',family:'visit',evidence:kept},'HA-AFTER','check_messages_actions_and_status',P.wait,'do_not_book_nonrefundable_travel_before_written_grant',tomorrow,kept],
 ['VP17',{stage:'submitted_waiting',family:'work',evidence:kept},'HA-AFTER','check_messages_actions_and_status',P.wait,'do_not_treat_status_progress_as_work_right_or_grant',tomorrow,kept],
 ['VP18',{stage:'submitted_waiting',family:'humanitarian_or_protection',evidence:kept},'HA-AFTER','check_messages_actions_and_status',P.wait,'do_not_infer_refusal_or_grant_from_silence',tomorrow,kept],
 ['VP19',{...rfi,family:'family',requestDue:'2026-09-15'},'HA-AFTER','attach_requested_information_in_immiaccount',P.rfi,'do_not_replace_request_letter_due_with_generic_processing_time','request_letter_due:2026-09-15; next_check:2026-09-08','not_yet'],
 ['VP20',{...rfi,family:'work',requestDue:'2026-09-12',cannotMeetDue:true,evidence:kept},'HA-AFTER','notify_department_with_details_and_evidence',P.rfi,'do_not_assume_delay_notice_grants_extension','request_letter_due:2026-09-12; next_check:2026-09-07',kept],
 ['VP21',{...rfi,family:'other_or_unsure',requestVerified:false},'IMMI-LOGIN','verify_request_in_official_messages',P.verify,'do_not_follow_email_links_or_upload_before_official_verification','UNKNOWN_FOLLOW_UP','not_yet'],
 ['VP22',{...health,family:'visit',requestDue:'2026-09-20',health:'arrange',evidence:kept},'HA-HEALTH','arrange_only_requested_examinations',P.health,'do_not_use_unapproved_clinic_or_enter_HAP_ID_here','request_letter_due:2026-09-20; next_check:2026-09-08',kept],
 ['VP23',{...health,family:'study',health:'hap_missing'},'HA-AFTER','recheck_health_assessment_and_referral_letter',['official_account_access','official_health_request_available'],'do_not_invent_or_store_HAP_ID','request_letter_due','not_yet'],
 ['VP24',{...health,family:'work',health:'examined',evidence:kept},'HA-EMEDICAL','check_health_submission_status',P.health,'do_not_treat_examination_or_submission_as_visa_decision',tomorrow,kept],
 ['VP25',{...health,family:'family',health:'outside_provider'},'HA-LOCATIONS','find_current_approved_panel_physician',P.health,'do_not_use_legacy_or_fixed_clinic_list','request_letter_due; next_check:2026-09-08','not_yet'],
 ['VP26',{...bio,family:'visit',biometrics:'aui',evidence:kept},'HA-BIOMETRICS','follow_australian_immi_app_steps',P.bio,'do_not_enter_VLN_passport_or_photo_in_hoju_compass','request_letter_due; next_check:2026-09-08',kept],
 ['VP27',{...bio,family:'study',biometrics:'non_aui'},'HA-LOCATIONS','follow_letter_to_current_ABCC_path',P.bio,'do_not_force_app_or_choose_unofficial_centre','request_letter_due; next_check:2026-09-08','not_yet'],
 ['VP28',{...bio,family:'work',biometrics:'unknown'},'HA-BIOMETRICS','check_letter_and_choose_app_or_ABCC',P.bio,'do_not_guess_AUI_eligibility_or_collect_VLN','UNKNOWN_FOLLOW_UP','not_yet'],
 ['VP29',{stage:'decision_received',family:'visit',decision:'grant',evidence:kept},'HA-VEVO','check_current_in_effect_details_and_conditions',P.decision,'do_not_copy_identifiers_or_assume_all_letter_conditions_from_family',day,kept],
 ['VP30',{stage:'decision_received',family:'family',decision:'refusal',evidence:kept},'OMARA-REGISTER','verify_registered_migration_agent_if_seeking_help',['written_decision_notice_available','external_copy_location_chosen'],'do_not_infer_review_right_or_deadline_from_generic_content','UNKNOWN_FOLLOW_UP',kept],
 ['VP31',{stage:'decision_received',family:'work'},'HA-AFTER','verify_written_decision_in_official_account',P.verify,'do_not_treat_submitted_health_or_biometrics_as_decision',day,'not_yet'],
 ['VP33',{...rfi,family:'study',requestDue:'2026-09-10',requestTopic:'processing'},'HA-AFTER','respond_to_request_letter',P.rfi,'do_not_use_processing_median_as_response_deadline','request_letter_due:2026-09-10; next_check:2026-09-07','not_yet'],
 ['VP34',{stage:'submitted_waiting',family:'family',waiting:'times',evidence:kept},'HA-TIMES','view_indicative_processing_time',P.wait,'do_not_convert_median_to_personal_decision_date','2026-09-14',kept],
 ['VP35',{...rfi,family:'humanitarian_or_protection',requestTopic:'character'},'HA-CHARACTER','follow_exact_character_request',P.rfi,'do_not_collect_criminal_history_or_police_document_here','request_letter_due','not_yet'],
 ['VP36',{stage:'preparing_documents',family:'family',help:'agent',evidence:kept},'OMARA-REGISTER','search_name_or_MARN',['agent_name_or_MARN_available_outside_product','service_scope_to_confirm'],'do_not_pay_or_share_documents_until_registration_identity_is_checked',day,kept],
 ['VP37',{stage:'ready_to_submit',family:'other_or_unsure',help:'scam',evidence:kept},'HA-SCAM','check_or_report_scam',['official_offer_or_message_available_outside_product'],'do_not_pay_submit_or_use_false_material',day,kept],
 ['VP38',{stage:'submitted_waiting',family:'visit',sourceUnavailable:true,evidence:kept},'HA-AFTER','retry_official_source_on_2026-09-08',P.wait,'do_not_use_cached_status_or_deadline_as_current',tomorrow,kept],
 ['VP39',{...health,family:'work',health:'privacy',evidence:kept},'HA-HEALTH','follow_request_outside_product',P.health,'do_not_input_or_analyse_identifier_health_or_document_content','request_letter_due; next_check:2026-09-08',kept],
);
for(const [id,input,route,action,prerequisites,stop,date,evidence]of cases){
 const r=build({today:day,...input});assert.deepEqual(Object.keys(r),fields,id+' exact root fields');
 assert.deepEqual(r,{applicant_selected_stage:input.stage,applicant_selected_visa_family:input.family,stable_official_route:{source_id:route,href:R[route],one_action:action},prerequisites,what_not_to_do:'stop_'+stop,next_check_and_external_evidence:{next_check_date:date,external_evidence_kept:evidence}},id);
}
for(const input of [{stage:'',family:''},{stage:'exploring',family:''},{stage:'',family:'work'},{stage:'bogus',family:'work'},{stage:'toString',family:'visit'}])assert.equal(build({...input,today:day}),null,'VP32 no defaults/no outcome');
for(const stage of Object.keys(stages))for(const family of Object.keys(families)){
 const r=build({stage,family,today:day});assert.deepEqual(Object.keys(r),fields);assert(r.prerequisites.length<=3);assert(stops[r.what_not_to_do]);assert(actions[r.stable_official_route.one_action]);assert.equal(r.applicant_selected_stage,stage);assert.equal(r.applicant_selected_visa_family,family);assert.notEqual(r.next_check_and_external_evidence.external_evidence_kept,kept,'no inferred external evidence');
}
const personal={stage:'submitted_waiting',family:'study',waiting:'times',requestKind:'further_information_requested',requestVerified:true,requestDue:'2026-09-10',today:day};
assert.equal(build(personal).stable_official_route.source_id,'HA-AFTER','personal request outranks processing guide');
assert.equal(build({...personal,help:'agent'}).stable_official_route.source_id,'HA-AFTER','request before routine agent lookup');
assert.equal(build({...personal,nextCheck:'2026-10-01'}).next_check_and_external_evidence.next_check_date,'request_letter_due:2026-09-10; next_check:2026-09-07','late reminder cannot extend due');
assert.equal(build({...personal,cannotMeetDue:true,nextCheck:'2026-09-09'}).next_check_and_external_evidence.next_check_date,'request_letter_due:2026-09-10; next_check:2026-09-07','cannot meet due means check today');
assert.equal(build({...personal,requestVerified:false}).stable_official_route.source_id,'IMMI-LOGIN');
assert.equal(build({...personal,requestDue:'2026-02-30'}).next_check_and_external_evidence.next_check_date,'request_letter_due');
assert.equal(build({...personal,requestDue:'2026-09-05'}).next_check_and_external_evidence.next_check_date,'request_letter_due:2026-09-05; next_check:2026-09-07','retain expired personal due without declaring decision');
assert.equal(build({...personal,sourceUnavailable:true}).what_not_to_do,'stop_do_not_use_cached_status_or_deadline_as_current');
const component=fs.readFileSync('src/components/tools/VisaPreparationNextAction.tsx','utf8');assert.doesNotMatch(component,/localStorage|sessionStorage|navigator\.clipboard|window\.print|fetch\(|sendBeacon|track\(/);
const page=fs.readFileSync('src/app/visa-preparation-guide/page.tsx','utf8');assert(page.includes('<VisaPreparationNextAction/>'));assert.doesNotMatch(page,/Visa Finder|contact-us-subsite/);assert(page.indexOf('<VisaPreparationNextAction/>')<page.indexOf('<LocalProjectChecklist'));
console.log('VISA_NEXT_ACTION=PASS VP01–VP39, 48 stage/family combinations, request precedence, invalid dates, no inferred evidence and privacy. VP40–VP41 require browser checks.');
