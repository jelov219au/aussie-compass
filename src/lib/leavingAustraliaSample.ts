import type { DepartureDraft } from "./leavingAustraliaProStorage";
import { leavingTaskIds } from "./leavingAustraliaOutcome";

// Public fictional input uses the same draft fields and exporter as the paid workspace.
export const leavingSampleDraft: DepartureDraft = {
  departureDate: "2026-09-20",
  destination: "가상 예시 · 한국 귀국 준비",
  applicability: Object.fromEntries(leavingTaskIds.map(id => [id, ["utilities", "tax"].includes(id) ? "not_applicable" : "applicable"])),
  statuses: { bond: "waiting", "final-pay": "waiting", dasp: "todo" },
  settlements: [
    { id: "fictional-bond", kind: "Bond", label: "가상 집 A · 반환 확인", dueDate: "2026-09-22", amount: "1200.00", status: "followup", note: "가상 입력 금액. 반환 요청을 보냈지만 실제 입금은 아직 확인하지 못함. 확인 메일은 별도 보관." },
    { id: "fictional-pay", kind: "Final pay", label: "가상 직장 B · 최종 급여 대조", dueDate: "2026-09-18", amount: "", status: "followup", note: "최종 Payslip의 근무시간과 휴가 항목을 개인 근무 기록과 대조 중. 금액 미입력, 지급액 미확정." },
    { id: "fictional-dasp", kind: "DASP", label: "가상 펀드 C · 신청 전 준비", dueDate: "2026-09-25", amount: "", status: "expected", note: "아직 신청하지 않음. 실제 출국·임시비자 종료·Super 기록과 공식 신청 조건 확인 전. 예상액 계산 없음." },
  ],
  taskNotes: {
    bond: { nextAction: "반환 요청의 진행 상태와 추가로 필요한 자료를 확인하기", contact: "가상 집 A 관리 담당 · 관할 Bond 기관", followUpOn: "2026-09-22 · 개인 재확인일", completionNote: "반환 요청 확인 메일은 별도 보관. 입금 확인 전이므로 완료 아님." },
    "final-pay": { nextAction: "최종 Payslip과 근무 기록의 차이를 정리해 서면으로 문의하기", contact: "가상 직장 B 급여 담당", followUpOn: "2026-09-18 · 개인 재확인일", completionNote: "최종 Payslip과 개인 근무 기록은 별도 보관. 대조가 끝나지 않아 완료 아님." },
    dasp: { nextAction: "출국·임시비자 종료 여부와 Super 기록을 확인한 뒤 ATO 공식 안내 확인하기", contact: "가상 펀드 C · ATO 공식 안내", followUpOn: "2026-09-25 · 개인 재확인일", completionNote: "신청 전 준비 단계. 제출 확인이나 지급 명세 없음." },
  },
  questions: ["모든 기관·금액·날짜·적용 여부는 설명을 위한 가상 예시입니다. 날짜는 법정 기한이나 자동 알림이 아닙니다.", "호주 계좌와 해외 인증 수단을 유지해야 할 정산이 남아 있는가?"],
};

export const leavingSampleCases = [
  { taskId: "bond", title: "Bond 반환 확인 대기", settlementId: "fictional-bond" },
  { taskId: "final-pay", title: "최종 급여 대조 중", settlementId: "fictional-pay" },
  { taskId: "dasp", title: "DASP 신청 전 준비", settlementId: "fictional-dasp" },
] as const;
