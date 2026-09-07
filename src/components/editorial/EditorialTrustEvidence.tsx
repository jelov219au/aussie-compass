import Link from "next/link";
import type { EditorialTrustNextAction } from "@/lib/editorialTrust";

const fields = ["content_scope","reliance_state","source_authority","jurisdiction_date_eligibility","checked_on_effective_version","correction_state","human_ownership","disclosure_state","next_action"] as const;
const labels: Record<string, string> = {
  content_scope: "정보 유형", reliance_state: "현재 확인 상태", source_authority: "출처 유형",
  jurisdiction_date_eligibility: "적용 지역·시점·조건", checked_on_effective_version: "확인일·적용 기간",
  correction_state: "정정 상태", human_ownership: "작성·검토 책임", disclosure_state: "이해관계 안내", next_action: "다음 확인",
  jurisdiction: "적용 지역", claim_date_basis: "기준 시점", eligibility: "적용 조건", checked_on: "출처 확인일",
  effective_from: "적용 시작", effective_to: "적용 종료", version: "자료 버전", review_due: "재확인 예정",
  author: "작성", reviewer: "검토", accountable_owner: "운영 책임",
};
const values: Record<string, string> = {
  unknown: "확인 정보 없음", policy: "작성 원칙", article: "자료 글", tool: "도구", marketing: "제품 소개",
  current: "확인된 버전", review_due: "재확인 필요", stale: "재확인 시점 지남", broken_source: "출처 연결 확인 필요",
  correction_open: "정정 확인 중", corrected: "정정 완료", primary_law_or_regulator: "법령·감독 기관", official_service: "공식 기관 안내",
  official_dataset: "공식 데이터", expert_secondary: "전문가 해설", lived_experience: "경험 사례", commercial: "사업자 안내",
  none: "정정 기록 없음", open: "접수됨", reviewing: "검토 중", declined: "수정하지 않음", superseded: "새 내용으로 대체됨",
  own_paid_tool: "자체 유료 도구 관련", no_affiliate: "제휴 수익 없음", no_sponsorship: "협찬 없음",
};
const copy = {
  open_primary_source: ["공식 1차 원문을 열어 현재 적용 범위를 확인하세요.", "원문 열기"],
  continue_with_context: ["적용 범위와 한계를 함께 읽고 이어가세요.", "작성 원칙 보기"],
  do_not_rely: ["현재 근거만으로 중요한 결정을 확정하지 마세요.", "신뢰 기준 확인"],
  verify_jurisdiction_date_eligibility: ["관할·기준일·개인 조건을 공식 원문에서 다시 확인하세요.", "확인 기준 보기"],
  report_correction: ["충돌한 문장과 원문을 수정 제안으로 알려주세요.", "수정 제안 준비"],
  view_correction_log: ["검토 중인 문장은 변경 이력과 결정을 확인하세요.", "수정 원칙 보기"],
  stop_and_get_official_help: ["즉시 위험하면 글을 읽는 것보다 공식 긴급 도움을 먼저 이용하세요.", "공식 도움 찾기"],
} as const;

export function EditorialTrustEvidence({ outcome, primaryHref, compact = false }: { outcome: EditorialTrustNextAction; primaryHref?: string; compact?: boolean }) {
  const href = outcome.next_action === "stop_and_get_official_help" ? "/help-directory" : outcome.next_action === "report_correction" ? "/contact" : primaryHref ?? "/editorial-policy";
  return <section data-editorial-trust data-reliance={outcome.reliance_state} className={`${compact ? "mt-5 p-4" : "mt-6 p-5 sm:p-6"} rounded-xl border border-border bg-white`} aria-labelledby={compact ? undefined : "editorial-trust-heading"}>
    <p className="text-xs font-semibold text-gold-ink">출처와 적용 범위</p>
    {!compact ? <h2 id="editorial-trust-heading" className="mt-1 text-xl font-semibold text-navy">이 정보의 근거부터 확인하세요</h2> : null}
    <p className="mt-2 text-sm font-semibold leading-6 text-navy">{copy[outcome.next_action][0]}</p>
    <p className="mt-1 text-xs leading-5 text-muted">게시·수정 날짜와 출처 확인일은 다릅니다. 지금 내 상황에 적용되는지는 공식 원문과 함께 확인하세요.</p>
    <Link href={href} className="mt-3 inline-flex min-h-11 items-center border-b-2 border-gold text-sm font-semibold text-navy">{copy[outcome.next_action][1]} →</Link>
    <details className="mt-1"><summary className="flex min-h-11 cursor-pointer items-center text-sm font-semibold text-navy">확인 상태 자세히 보기</summary><dl className="grid gap-2 sm:grid-cols-3">{fields.map(field => <div key={field} className="min-w-0 rounded-lg border border-border bg-surface p-3"><dt className="text-xs text-muted">{labels[field]}</dt><dd className="mt-1 break-words text-xs font-semibold leading-5 text-navy">{field === "next_action" ? copy[outcome.next_action][0] : format(outcome[field])}</dd></div>)}</dl></details>
  </section>;
}

function format(value: unknown): string { return typeof value === "string" ? values[value] ?? value : Array.isArray(value) ? value.map(format).join(" · ") : Object.entries(value as Record<string,string>).map(([key,item]) => `${labels[key] ?? key}: ${format(item)}`).join(" · "); }
