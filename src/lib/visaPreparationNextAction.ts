export const VISA_STAGES = {
  exploring: "비자 유형을 알아보는 중",
  preparing_documents: "서류를 준비하는 중",
  ready_to_submit: "제출 전 최종 확인 중",
  submitted_waiting: "제출 후 답변을 기다리는 중",
  further_information_requested: "추가 정보·서류 요청을 받음",
  health_exam_requested: "신체검사 요청을 받음",
  biometrics_requested: "생체정보 요청을 받음",
  decision_received: "결정 안내를 받음",
} as const;
export const VISA_FAMILIES = { visit: "방문·관광", study: "학업", work: "취업·근무", family: "가족", humanitarian_or_protection: "인도적 사유·보호", other_or_unsure: "기타·아직 확실하지 않음" } as const;
export const VISA_ROUTES = {
  "HA-EXPLORE": "https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-finder",
  "IMMI-LOGIN": "https://online.immi.gov.au/lusc/login",
  "HA-APPLY": "https://immi.homeaffairs.gov.au/help-support/applying-online-or-on-paper/online/apply-and-manage-your-application",
  "HA-ATTACH": "https://immi.homeaffairs.gov.au/help-support/applying-online-or-on-paper/online/attach-documents-to-your-application",
  "HA-AFTER": "https://immi.homeaffairs.gov.au/help-support/applying-online-or-on-paper/online/after-you-apply",
  "HA-HEALTH": "https://immi.homeaffairs.gov.au/help-support/meeting-our-requirements/health/arrange-your-health-examinations",
  "HA-EMEDICAL": "https://immi.homeaffairs.gov.au/help-support/tools/emedical",
  "HA-LOCATIONS": "https://immi.homeaffairs.gov.au/help-support/contact-us/offices-and-locations/offices-in-australia/outside-australia",
  "HA-BIOMETRICS": "https://immi.homeaffairs.gov.au/help-support/meeting-our-requirements/biometrics/australian-immi-app",
  "HA-CHARACTER": "https://immi.homeaffairs.gov.au/help-support/meeting-our-requirements/character",
  "HA-TIMES": "https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-processing-times/global-visa-processing-times",
  "HA-VEVO": "https://immi.homeaffairs.gov.au/visas/already-have-a-visa/check-visa-details-and-conditions/check-conditions-online",
  "HA-SCAM": "https://immi.homeaffairs.gov.au/help-support/visa-scams",
  "OMARA-REGISTER": "https://portal.mara.gov.au/search-the-register-of-migration-agents/",
} as const;
export const VISA_PREREQUISITES = {
  purpose_selected: "방문·신청 목적을 직접 선택",
  current_location_context_known: "신청 위치 조건을 공식 페이지에서 확인",
  subclass_or_stream_page_selected_by_user: "직접 선택한 Subclass·Stream 공식 페이지",
  apply_location_condition_checked: "호주 안·밖 신청 조건 확인",
  official_document_checklist_open: "공식 신청서의 서류 목록",
  official_account_access: "공식 ImmiAccount에 접근 가능",
  answers_and_applicants_reviewed: "답변·첨부·신청자별 검토",
  external_copy_location_chosen: "외부 사본을 보관할 안전한 장소",
  acknowledgement_or_status_available: "공식 접수 확인 또는 신청 상태",
  contact_details_current: "최신 연락처",
  official_request_letter_available: "공식 계정에서 확인한 요청서",
  request_due_date_read: "요청서에 적힌 기한 확인",
  official_health_request_available: "공식 신체검사 요청서",
  HAP_ID_available_outside_product: "제품 밖에서 확인한 HAP ID",
  approved_provider_location_checked: "현재 승인된 검사기관 확인",
  official_biometrics_letter_available: "공식 생체정보 요청서",
  VLN_prefix_checked_outside_product: "제품 밖에서 확인한 VLN 접두어",
  official_app_or_ABCC_path_checked: "공식 App 또는 ABCC 경로 확인",
  written_decision_notice_available: "제품 밖에 보관한 서면 결정문",
  correspondence_available_outside_product: "제품 밖에 보관한 안내·연락 기록",
  agent_name_or_MARN_available_outside_product: "제품 밖에 보관한 대리인 이름·MARN",
  service_scope_to_confirm: "확인할 서비스 범위",
  official_offer_or_message_available_outside_product: "제품 밖에 보관한 제안·메시지",
} as const;
export const VISA_PRESETS = {
  explore: ["purpose_selected", "current_location_context_known"],
  docs: ["subclass_or_stream_page_selected_by_user", "apply_location_condition_checked", "official_document_checklist_open"],
  ready: ["official_account_access", "answers_and_applicants_reviewed", "external_copy_location_chosen"],
  wait: ["official_account_access", "acknowledgement_or_status_available", "contact_details_current"],
  rfi: ["official_request_letter_available", "request_due_date_read", "official_account_access"],
  health: ["official_health_request_available", "HAP_ID_available_outside_product", "approved_provider_location_checked"],
  bio: ["official_biometrics_letter_available", "VLN_prefix_checked_outside_product", "official_app_or_ABCC_path_checked"],
  decision: ["written_decision_notice_available", "official_account_access", "external_copy_location_chosen"],
} as const;
export const VISA_ACTIONS = {
  explore_options: "Explore visa options 열기",
  open_selected_visa_step_by_step: "내 비자의 공식 준비 순서 확인하기",
  check_form_attachment_instructions: "공식 신청서의 첨부 안내 확인하기",
  confirm_official_option_before_documents: "서류 준비 전에 공식 비자 유형 확인하기",
  review_and_submit_in_official_account: "공식 계정에서 제출 전 확인하기",
  review_each_applicant_before_submit: "공식 계정에서 신청자별로 검토하기",
  check_messages_actions_and_status: "신청 후 메시지·요청·상태 확인하기",
  attach_requested_information_in_immiaccount: "요청 자료의 공식 제출 방법 확인하기",
  notify_department_with_details_and_evidence: "기한 내 이행이 어려운 사정 알리는 방법",
  verify_request_in_official_messages: "공식 계정에서 요청서 확인하기",
  arrange_only_requested_examinations: "요청받은 검사 예약 안내 보기",
  recheck_health_assessment_and_referral_letter: "Health assessment·Referral letter 재확인",
  check_health_submission_status: "eMedical 제출 상태 확인 안내 보기",
  find_current_approved_panel_physician: "현재 승인된 해외 검사기관 찾기",
  follow_australian_immi_app_steps: "Australian Immi App 공식 조건·절차 보기",
  follow_letter_to_current_ABCC_path: "요청서에 맞는 공식 ABCC 경로 찾기",
  check_letter_and_choose_app_or_ABCC: "App·ABCC 구분을 공식 안내에서 확인",
  check_current_in_effect_details_and_conditions: "VEVO의 현재 비자·조건 확인하기",
  verify_registered_migration_agent_if_seeking_help: "도움을 받을 이민대리인 등록 확인하기",
  verify_written_decision_in_official_account: "공식 계정에서 서면 결정 확인하기",
  respond_to_request_letter: "일반 처리기간보다 요청서부터 확인하기",
  view_indicative_processing_time: "일반적인 처리기간 안내 보기",
  follow_exact_character_request: "요청받은 Character·Police 자료 안내 보기",
  search_name_or_MARN: "OMARA에서 이름·MARN으로 등록 확인",
  check_or_report_scam: "비자 사기 징후·신고 안내 확인하기",
  follow_request_outside_product: "신체검사 공식 경로에서만 자료 확인하기",
  retry_official_source: "공식 페이지 다시 확인하기",
} as const;
export const VISA_STOPS = {
  stop_do_not_select_subclass_for_user: "이 안내만으로 Subclass·Stream을 확정하지 마세요.",
  stop_do_not_infer_course_or_student_eligibility: "학업 목적만으로 과정·학생비자 자격을 판단하지 마세요.",
  stop_do_not_infer_sponsorship_or_work_rights: "근무 목적만으로 후원 자격·근무 권한을 판단하지 마세요.",
  stop_do_not_infer_relationship_or_sponsor_eligibility: "가족 관계만으로 신청·스폰서 자격을 판단하지 마세요.",
  stop_do_not_infer_protection_criteria_or_safe_route: "보호 요건·안전한 신청 경로를 이 안내로 판단하지 마세요.",
  stop_do_not_start_application_until_user_confirms_official_option: "정확한 공식 비자 유형을 확인하기 전 신청을 시작하지 마세요.",
  stop_do_not_turn_generic_list_into_mandatory_requirements: "일반 체크리스트를 필수 서류 목록으로 쓰지 마세요.",
  stop_do_not_email_documents_to_department: "문서를 일반 이메일로 보내지 말고 공식 첨부 절차를 확인하세요.",
  stop_do_not_infer_occupation_sponsor_or_skills_documents: "직업·스폰서·기술심사 서류를 임의로 정하지 마세요.",
  stop_do_not_collect_relationship_evidence_in_hoju_compass: "관계 입증 자료를 Hoju Compass에 입력하지 마세요.",
  stop_do_not_request_claim_or_identity_narrative: "신청 사유·신원 진술 원문을 이곳에 입력하지 마세요.",
  stop_do_not_build_document_list_without_selected_official_page: "정확한 공식 비자 페이지 없이 서류 목록을 확정하지 마세요.",
  stop_if_answers_documents_stream_or_apply_location_are_unconfirmed: "답변·서류·Stream·신청 위치가 미확인이면 제출을 멈추세요.",
  stop_do_not_treat_ready_to_submit_as_submitted: "Ready to submit을 제출 완료로 읽지 마세요.",
  stop_do_not_submit_with_unreviewed_applicant_or_attachment: "검토하지 않은 신청자·첨부가 있으면 제출하지 마세요.",
  stop_do_not_book_nonrefundable_travel_before_written_grant: "서면 승인 전 환불 불가 여행 일정을 확정하지 마세요.",
  stop_do_not_treat_status_progress_as_work_right_or_grant: "신청 상태의 진행을 근무 권한·승인으로 읽지 마세요.",
  stop_do_not_infer_refusal_or_grant_from_silence: "새 소식이 없다는 이유로 승인·거절을 추정하지 마세요.",
  stop_do_not_replace_request_letter_due_with_generic_processing_time: "일반 처리기간으로 개인 요청서의 기한을 바꾸지 마세요.",
  stop_do_not_assume_delay_notice_grants_extension: "지연 사정을 알렸다는 이유로 기한이 연장됐다고 생각하지 마세요.",
  stop_do_not_follow_email_links_or_upload_before_official_verification: "공식 계정에서 확인 전 이메일 링크를 따르거나 자료를 올리지 마세요.",
  stop_do_not_use_unapproved_clinic_or_enter_HAP_ID_here: "승인되지 않은 기관을 이용하거나 이곳에 HAP ID를 입력하지 마세요.",
  stop_do_not_invent_or_store_HAP_ID: "HAP ID를 추측하거나 이곳에 저장하지 마세요.",
  stop_do_not_treat_examination_or_submission_as_visa_decision: "검사·결과 전송 완료를 비자 결정으로 읽지 마세요.",
  stop_do_not_use_legacy_or_fixed_clinic_list: "오래된 고정 병원 목록만 보고 예약하지 마세요.",
  stop_do_not_enter_VLN_passport_or_photo_in_hoju_compass: "VLN·여권·사진은 이곳에 입력하지 마세요. App의 나머지 조건도 공식 안내에서 확인하세요.",
  stop_do_not_force_app_or_choose_unofficial_centre: "App 사용을 억지로 진행하거나 비공식 센터를 선택하지 마세요.",
  stop_do_not_guess_AUI_eligibility_or_collect_VLN: "접두어를 확인하지 않고 App 이용 가능 여부를 추측하지 마세요.",
  stop_do_not_copy_identifiers_or_assume_all_letter_conditions_from_family: "식별번호를 이곳에 복사하거나 목적만으로 결정문의 조건을 해석하지 마세요.",
  stop_do_not_infer_review_right_or_deadline_from_generic_content: "일반 안내로 재심 권리·기한을 추측하지 마세요. 결정문을 즉시 확인하세요.",
  stop_do_not_treat_submitted_health_or_biometrics_as_decision: "신청·신체검사·생체정보 제출을 서면 결정으로 읽지 마세요.",
  stop_do_not_use_processing_median_as_response_deadline: "처리기간 중앙값을 추가자료 답변 기한으로 쓰지 마세요.",
  stop_do_not_convert_median_to_personal_decision_date: "처리기간 안내를 개인 결정 예정일로 바꾸지 마세요.",
  stop_do_not_collect_criminal_history_or_police_document_here: "범죄경력·경찰증명 원문을 이곳에 입력하지 마세요.",
  stop_do_not_pay_or_share_documents_until_registration_identity_is_checked: "대리인의 등록·신원을 확인하기 전 결제하거나 문서를 보내지 마세요.",
  stop_do_not_pay_submit_or_use_false_material: "의심스러운 제안에 결제·제출하거나 허위 자료를 쓰지 마세요.",
  stop_do_not_use_cached_status_or_deadline_as_current: "확인할 수 없는 저장 화면을 현재 상태·기한으로 쓰지 마세요.",
  stop_do_not_input_or_analyse_identifier_health_or_document_content: "식별번호·건강정보·문서 내용을 이곳에 입력하지 마세요.",
} as const;
export type VisaStage = keyof typeof VISA_STAGES;
export type VisaFamily = keyof typeof VISA_FAMILIES;
export type VisaEvidence = "not_needed" | "not_yet" | "kept_outside_hoju_compass";
export type VisaInput = {
  stage: VisaStage | ""; family: VisaFamily | ""; today: string;
  requestKind?: "none" | "further_information_requested" | "health_exam_requested" | "biometrics_requested";
  requestVerified?: boolean; requestDue?: string; nextCheck?: string; evidence?: VisaEvidence;
  reviewed?: boolean; cannotMeetDue?: boolean; requestTopic?: "general" | "character" | "processing";
  health?: "arrange" | "hap_missing" | "examined" | "outside_provider" | "privacy";
  biometrics?: "unknown" | "aui" | "non_aui";
  decision?: "unknown" | "grant" | "refusal";
  waiting?: "status" | "times";
  help?: "none" | "agent" | "scam"; sourceUnavailable?: boolean;
};
export type VisaResult = {
  applicant_selected_stage: VisaStage;
  applicant_selected_visa_family: VisaFamily;
  stable_official_route: { source_id: keyof typeof VISA_ROUTES; href: string; one_action: string };
  prerequisites: readonly (keyof typeof VISA_PREREQUISITES)[];
  what_not_to_do: keyof typeof VISA_STOPS;
  next_check_and_external_evidence: { next_check_date: string; external_evidence_kept: VisaEvidence };
};
export function visaDateValid(value = ""): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(`${value}T00:00:00Z`)) && new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) === value;
}
function plus(value: string, days: number): string {
  if (!visaDateValid(value)) return "UNKNOWN_FOLLOW_UP";
  const date = new Date(`${value}T00:00:00Z`); date.setUTCDate(date.getUTCDate() + days); return date.toISOString().slice(0, 10);
}
export function visaToday(): string { return new Intl.DateTimeFormat("en-CA", { timeZone: "Australia/Brisbane" }).format(new Date()); }
export function buildVisaNextAction(i: VisaInput): VisaResult | null {
  if (!i.stage || !i.family || !Object.hasOwn(VISA_STAGES, i.stage) || !Object.hasOwn(VISA_FAMILIES, i.family)) return null;
  const selectedStage = i.stage, family = i.family;
  const stage = i.requestKind && i.requestKind !== "none" ? i.requestKind : selectedStage;
  const tomorrow = plus(i.today, 1), today = visaDateValid(i.today) ? i.today : "UNKNOWN_FOLLOW_UP";
  const requestStage = ["further_information_requested", "health_exam_requested", "biometrics_requested"].includes(stage);
  const requestDate = (check: string, includeUnknownCheck = false) => {
    if (!visaDateValid(i.requestDue)) return includeUnknownCheck ? `request_letter_due; next_check:${check}` : "request_letter_due";
    const due = i.requestDue!;
    const next = visaDateValid(check) && check <= due ? check : today;
    return `request_letter_due:${due}; next_check:${next}`;
  };
  const out = (source_id: keyof typeof VISA_ROUTES, one_action: string, prerequisites: VisaResult["prerequisites"], what_not_to_do: VisaResult["what_not_to_do"], date = tomorrow, defaultEvidence: VisaEvidence = "not_yet"): VisaResult => {
    const requestedCheck = visaDateValid(i.nextCheck) ? i.nextCheck! : undefined;
    let next = date;
    // A user reminder must never move a personal request deadline or delay an urgent check.
    const urgent = i.cannotMeetDue || (stage === "further_information_requested" && i.requestTopic === "processing") || stage === "decision_received";
    if (requestedCheck && !urgent && date !== today && date !== "UNKNOWN_FOLLOW_UP") {
      next = requestStage && i.requestVerified ? (visaDateValid(i.requestDue) ? requestDate(requestedCheck) : `request_letter_due; next_check:${requestedCheck}`) : requestedCheck;
    }
    if (requestStage && i.requestVerified && visaDateValid(i.requestDue) && i.requestDue! <= today) next = requestDate(today);
    return {
      applicant_selected_stage: selectedStage,
      applicant_selected_visa_family: family,
      stable_official_route: { source_id, href: VISA_ROUTES[source_id], one_action },
      prerequisites,
      what_not_to_do,
      next_check_and_external_evidence: { next_check_date: next, external_evidence_kept: i.evidence ?? defaultEvidence },
    };
  };
  const verify = () => out("IMMI-LOGIN", "verify_request_in_official_messages", ["official_account_access", "correspondence_available_outside_product"], "stop_do_not_follow_email_links_or_upload_before_official_verification", "UNKNOWN_FOLLOW_UP");
  if (i.sourceUnavailable) {
    const preset = stage === "exploring" ? VISA_PRESETS.explore : stage === "preparing_documents" ? VISA_PRESETS.docs : stage === "ready_to_submit" ? VISA_PRESETS.ready : stage === "health_exam_requested" ? VISA_PRESETS.health : stage === "biometrics_requested" ? VISA_PRESETS.bio : stage === "further_information_requested" ? VISA_PRESETS.rfi : stage === "decision_received" ? VISA_PRESETS.decision : VISA_PRESETS.wait;
    const route = stage === "exploring" ? "HA-EXPLORE" : stage === "preparing_documents" ? "HA-APPLY" : stage === "health_exam_requested" ? "HA-HEALTH" : stage === "biometrics_requested" ? "HA-BIOMETRICS" : "HA-AFTER";
    return out(route, `retry_official_source_on_${tomorrow}`, preset, "stop_do_not_use_cached_status_or_deadline_as_current", requestStage && i.requestVerified ? requestDate(tomorrow) : tomorrow);
  }
  if (i.help === "scam") return out("HA-SCAM", "check_or_report_scam", ["official_offer_or_message_available_outside_product"], "stop_do_not_pay_submit_or_use_false_material", today);
  if (requestStage) {
    if (!i.requestVerified) return verify();
    if (i.cannotMeetDue) return out("HA-AFTER", "notify_department_with_details_and_evidence", VISA_PRESETS.rfi, "stop_do_not_assume_delay_notice_grants_extension", requestDate(today));
    if (stage === "further_information_requested") {
      if (i.requestTopic === "character") return out("HA-CHARACTER", "follow_exact_character_request", VISA_PRESETS.rfi, "stop_do_not_collect_criminal_history_or_police_document_here", requestDate(tomorrow));
      if (i.requestTopic === "processing") return out("HA-AFTER", "respond_to_request_letter", VISA_PRESETS.rfi, "stop_do_not_use_processing_median_as_response_deadline", requestDate(today));
      return out("HA-AFTER", "attach_requested_information_in_immiaccount", VISA_PRESETS.rfi, "stop_do_not_replace_request_letter_due_with_generic_processing_time", requestDate(tomorrow));
    }
    if (stage === "health_exam_requested") {
      if (!i.health || i.health === "hap_missing") return out("HA-AFTER", "recheck_health_assessment_and_referral_letter", ["official_account_access", "official_health_request_available"], "stop_do_not_invent_or_store_HAP_ID", requestDate(tomorrow));
      if (i.health === "examined") return out("HA-EMEDICAL", "check_health_submission_status", VISA_PRESETS.health, "stop_do_not_treat_examination_or_submission_as_visa_decision", visaDateValid(i.requestDue) ? requestDate(tomorrow) : tomorrow);
      if (i.health === "outside_provider") return out("HA-LOCATIONS", "find_current_approved_panel_physician", VISA_PRESETS.health, "stop_do_not_use_legacy_or_fixed_clinic_list", requestDate(tomorrow, true));
      if (i.health === "privacy") return out("HA-HEALTH", "follow_request_outside_product", VISA_PRESETS.health, "stop_do_not_input_or_analyse_identifier_health_or_document_content", requestDate(tomorrow, true));
      return out("HA-HEALTH", "arrange_only_requested_examinations", VISA_PRESETS.health, "stop_do_not_use_unapproved_clinic_or_enter_HAP_ID_here", requestDate(tomorrow, true));
    }
    if (i.biometrics === "aui") return out("HA-BIOMETRICS", "follow_australian_immi_app_steps", VISA_PRESETS.bio, "stop_do_not_enter_VLN_passport_or_photo_in_hoju_compass", requestDate(tomorrow, true));
    if (i.biometrics === "non_aui") return out("HA-LOCATIONS", "follow_letter_to_current_ABCC_path", VISA_PRESETS.bio, "stop_do_not_force_app_or_choose_unofficial_centre", requestDate(tomorrow, true));
    return out("HA-BIOMETRICS", "check_letter_and_choose_app_or_ABCC", VISA_PRESETS.bio, "stop_do_not_guess_AUI_eligibility_or_collect_VLN", "UNKNOWN_FOLLOW_UP");
  }
  if (i.help === "agent") return out("OMARA-REGISTER", "search_name_or_MARN", ["agent_name_or_MARN_available_outside_product", "service_scope_to_confirm"], "stop_do_not_pay_or_share_documents_until_registration_identity_is_checked", today);
  if (stage === "decision_received") {
    if (i.decision === "grant") return out("HA-VEVO", "check_current_in_effect_details_and_conditions", VISA_PRESETS.decision, "stop_do_not_copy_identifiers_or_assume_all_letter_conditions_from_family", today);
    if (i.decision === "refusal") return out("OMARA-REGISTER", "verify_registered_migration_agent_if_seeking_help", ["written_decision_notice_available", "external_copy_location_chosen"], "stop_do_not_infer_review_right_or_deadline_from_generic_content", visaDateValid(i.requestDue) ? requestDate(today) : "UNKNOWN_FOLLOW_UP");
    return out("HA-AFTER", "verify_written_decision_in_official_account", ["official_account_access", "correspondence_available_outside_product"], "stop_do_not_treat_submitted_health_or_biometrics_as_decision", today);
  }
  if (stage === "submitted_waiting") {
    if (i.waiting === "times") return out("HA-TIMES", "view_indicative_processing_time", VISA_PRESETS.wait, "stop_do_not_convert_median_to_personal_decision_date", plus(i.today, 7));
    const stop = family === "work" ? "stop_do_not_treat_status_progress_as_work_right_or_grant" : family === "humanitarian_or_protection" ? "stop_do_not_infer_refusal_or_grant_from_silence" : "stop_do_not_book_nonrefundable_travel_before_written_grant";
    return out("HA-AFTER", "check_messages_actions_and_status", VISA_PRESETS.wait, stop);
  }
  if (stage === "ready_to_submit") {
    if (!i.reviewed) return out("IMMI-LOGIN", "review_each_applicant_before_submit", VISA_PRESETS.ready, "stop_do_not_submit_with_unreviewed_applicant_or_attachment");
    return out("IMMI-LOGIN", "review_and_submit_in_official_account", VISA_PRESETS.ready, family === "study" ? "stop_do_not_treat_ready_to_submit_as_submitted" : "stop_if_answers_documents_stream_or_apply_location_are_unconfirmed", today);
  }
  if (stage === "preparing_documents") {
    if (family === "other_or_unsure") return out("HA-EXPLORE", "confirm_official_option_before_documents", VISA_PRESETS.explore, "stop_do_not_build_document_list_without_selected_official_page", tomorrow, "not_needed");
    if (family === "study") return out("HA-ATTACH", "check_form_attachment_instructions", VISA_PRESETS.docs, "stop_do_not_email_documents_to_department");
    if (family === "family") return out("HA-ATTACH", "check_form_attachment_instructions", VISA_PRESETS.docs, "stop_do_not_collect_relationship_evidence_in_hoju_compass");
    return out("HA-APPLY", "open_selected_visa_step_by_step", VISA_PRESETS.docs, family === "work" ? "stop_do_not_infer_occupation_sponsor_or_skills_documents" : family === "humanitarian_or_protection" ? "stop_do_not_request_claim_or_identity_narrative" : "stop_do_not_turn_generic_list_into_mandatory_requirements");
  }
  const stops = { visit: "stop_do_not_select_subclass_for_user", study: "stop_do_not_infer_course_or_student_eligibility", work: "stop_do_not_infer_sponsorship_or_work_rights", family: "stop_do_not_infer_relationship_or_sponsor_eligibility", humanitarian_or_protection: "stop_do_not_infer_protection_criteria_or_safe_route", other_or_unsure: "stop_do_not_start_application_until_user_confirms_official_option" } as const;
  return out("HA-EXPLORE", "explore_options", VISA_PRESETS.explore, stops[family], tomorrow, "not_needed");
}
