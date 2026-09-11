import type { TaxGuideNextAction } from "./taxGuideNextAction";

export const taxGuideFieldLabels: Record<keyof TaxGuideNextAction, string> = {
  income_year: "대상 회계연도",
  lodging_path: "선택한 신고 경로",
  due_state: "현재 확인할 사항",
  due_or_recheck: "기한 또는 재확인 시점",
  official_route: "확인할 공식 안내",
  next_action: "다음 행동",
};

const states: Record<string, string> = {
  official_source_unavailable: "공식 안내를 다시 확인해야 합니다",
  lodgment_obligation_unknown: "신고 의무·개인 기한 확인이 필요합니다",
  individual_ato_due_date_overrides: "ATO에 표시된 개인 신고기한을 확인하세요",
  prior_late_or_overdue_action_required: "미신고·기한 경과 또는 ATO 통지 확인이 필요합니다",
  agent_registration_or_scope_check: "세무사의 등록 상태와 업무 범위를 확인하세요",
  agent_schedule_confirmation_required: "세무사와 개인 신고 일정을 확인하세요",
  general_self_lodge_date: "직접 신고의 일반 기한입니다",
};

const actions: Record<string, string> = {
  check_ato_individual_due_date: "ATO에서 내 개인 신고기한 확인하기",
  check_lodgment_obligation: "ATO에서 신고 의무 확인하기",
  lodge_or_contact_ato_now: "ATO 신고·연락 경로 지금 확인하기",
  confirm_due_date_with_registered_agent: "등록 세무사에게 ATO 기한 확인하기",
  verify_agent_in_tpb_register: "TPB Public Register에서 등록 확인하기",
  verify_agent_registration_scope: "TPB에서 등록 범위 확인하기",
  stop_and_choose_registered_tax_agent: "지급·제출을 멈추고 TPB 등록 확인하기",
  retry_official_source_on_recheck_date: "공식 페이지를 재확인하기",
};

const timing: Record<string, string> = {
  "CHECK NOW": "지금 확인하세요",
  NOW: "지금 조치가 필요합니다",
  "STOP BEFORE PAYMENT/LODGMENT": "수수료 지급·신고서 제출 전에 멈추고 확인하세요",
  "STOP AND CHECK TAX-AGENT SCOPE": "진행을 멈추고 소득세 신고 업무 범위를 확인하세요",
  "CHECK SERVICE/SCOPE NOW": "서비스와 등록 업무 범위를 지금 확인하세요",
  "RECHECK IN ATO/AGENT SYSTEM": "ATO·세무사 시스템에 반영됐는지 다시 확인하세요",
  "AGENT/ATO DATE UNKNOWN": "개인 신고기한이 아직 확인되지 않았습니다",
};

function timingLabel(value: string) {
  if (timing[value]) return timing[value];
  const retry = /^RECHECK (\d{4}-\d{2}-\d{2}) AEST$/.exec(value);
  if (retry) return `${retry[1]}에 다시 확인하세요`;
  const date = /^(\d{4}-\d{2}-\d{2})( TODAY| general only)?$/.exec(value);
  if (date) return `${date[1]}${date[2] === " TODAY" ? " · 오늘" : date[2] ? " · 일반 기한, 개인 기한 확인 필요" : ""}`;
  return "공식 안내에서 확인하세요";
}

/** Display only: preserve the original decision, date and official destination. */
export function presentTaxGuideNextAction(result: TaxGuideNextAction): TaxGuideNextAction {
  const paths: Record<string, string> = { unknown: "아직 결정하지 않음", selfLodge: "myTax 직접 신고", registeredAgent: "등록 세무사 이용" };
  return {
    income_year: result.income_year === "unknown" ? "확인 필요" : result.income_year,
    lodging_path: paths[result.lodging_path] ?? "신고 경로 확인 필요",
    due_state: states[result.due_state] ?? "공식 안내 확인이 필요합니다",
    due_or_recheck: timingLabel(result.due_or_recheck),
    official_route: result.official_route.startsWith("https://www.tpb.gov.au/") ? "TPB 세무사 등록·업무 범위 안내" : "ATO 신고 안내",
    next_action: actions[result.next_action] ?? "공식 안내 확인하기",
  };
}
