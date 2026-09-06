import Link from "next/link";
import type { EditorialTrustNextAction } from "@/lib/editorialTrust";

const fields = ["content_scope","reliance_state","source_authority","jurisdiction_date_eligibility","checked_on_effective_version","correction_state","human_ownership","disclosure_state","next_action"] as const;
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
  return <section data-editorial-trust data-reliance={outcome.reliance_state} className={`${compact ? "mt-6 p-4" : "mt-6 p-5 sm:p-6"} border-2 border-navy bg-white shadow-sm`} aria-labelledby={compact ? undefined : "editorial-trust-heading"}>
    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gold-ink">editorial_trust_next_action</p>
    {!compact ? <h2 id="editorial-trust-heading" className="mt-1 text-xl font-semibold text-navy">이 정보의 근거부터 확인하세요</h2> : null}
    <p className="mt-2 text-sm font-semibold leading-6 text-navy">{copy[outcome.next_action][0]}</p>
    <p className="mt-1 text-xs leading-5 text-muted">발행일·파일 수정일·배포일·HTTP 200은 출처 확인일이나 현재 효력의 증거가 아닙니다.</p>
    <Link href={href} className="mt-3 inline-flex min-h-11 items-center border-b-2 border-gold text-sm font-semibold text-navy">{copy[outcome.next_action][1]} →</Link>
    <details className="mt-2"><summary className="flex min-h-11 cursor-pointer items-center text-sm font-semibold text-navy">9개 신뢰 필드 보기</summary><dl className="grid gap-2 sm:grid-cols-3">{fields.map(field => <div key={field} className="min-w-0 border border-border bg-surface p-3"><dt className="font-mono text-xs text-muted">{field}</dt><dd className="mt-1 break-words text-xs font-semibold leading-5 text-navy">{format(outcome[field])}</dd></div>)}</dl></details>
  </section>;
}

function format(value: unknown) { return typeof value === "string" ? value : Array.isArray(value) ? value.join(" · ") : Object.entries(value as Record<string,string>).map(([key,item]) => `${key}: ${item}`).join(" · "); }
