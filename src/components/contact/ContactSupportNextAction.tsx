"use client";

import { useMemo, useState } from "react";

type IssueCategory =
  | "general"
  | "payment_access"
  | "refund"
  | "technical_error"
  | "content_correction"
  | "privacy_deletion"
  | "partnership_feedback"
  | "urgent_or_deadline";

type SupportChannel = "self_help" | "hoju_email" | "documented_transaction_support" | "issuer_or_bank" | "official_service";
type ResponseExpectation = "not_sent" | "unknown" | "access_target_4_business_hours" | "proposed_initial_2_business_days" | "proposed_privacy_30_calendar_days" | "no_wait_use_official_service";
type ContactNextAction = "use_self_help" | "prepare_email" | "verify_sent" | "wait" | "follow_up_same_thread" | "use_official_service_now";

type ContactSupportOutcome = {
  issue_category: IssueCategory;
  self_help_route: string;
  minimal_evidence_categories: readonly string[];
  do_not_send: readonly string[];
  channel: SupportChannel;
  response_expectation: ResponseExpectation;
  escalation_or_follow_up: string;
  next_action: ContactNextAction;
};

type SupportDetails = {
  label: string;
  selfHelpRoute: string;
  selfHelpHref: string;
  selfHelpLabel: string;
  minimalEvidence: readonly string[];
  doNotSend: readonly string[];
  channel: SupportChannel;
  responseExpectation: ResponseExpectation;
  escalation: string;
  nextAction: ContactNextAction;
  subject: string;
  prompts: readonly string[];
};

const commonDoNotSend = [
  "카드번호 전체·일부, CVC, bank login, OTP",
  "passport, TFN, HAP ID, visa, Medicare 원문",
  "복구 코드, cookie/token, 전체 session/payment/customer/receipt ID",
  "전체 영수증·Payslip·statement·resume·이력서 원문·세무·렌트·건강 문서",
  "workspace·backup·screenshot 원본, token/query가 든 URL",
  "스크린샷을 첨부한다면 이름, 주소, 이메일, 전체 결제 참조와 문서 내용을 가린 뒤 보냅니다. 원본 파일은 필요하지 않습니다.",
] as const;

const emailLifecycle = "메일 앱이 열렸다는 화면은 발송 완료가 아닙니다. 보낸 편지함 또는 보낼 편지함을 확인합니다. 반송되면 주소를 추측하지 말고 이 /contact 페이지의 현재 주소를 다시 확인합니다. 인터넷이 없으면 민감정보를 뺀 초안을 기기에만 두고 연결 뒤 mailto로 직접 보내며, 사이트에는 offline queue나 자동 제출이 없습니다.";

const supportDetails: Record<IssueCategory, SupportDetails> = {
  general: {
    label: "일반 문의",
    selfHelpRoute: "contact_templates",
    selfHelpHref: "#contact-type-heading",
    selfHelpLabel: "상세 문의 템플릿 확인",
    minimalEvidence: ["관련 공개 page/tool", "문의 목적 범주", "대략적인 시각·시간대"],
    doNotSend: commonDoNotSend,
    channel: "hoju_email",
    responseExpectation: "unknown",
    escalation: `${emailLifecycle} 일반 SLA는 UNKNOWN입니다. 접수 회신에 목표 시점이 있을 때만 그 시점 다음 영업일에 같은 thread로 한 번만 재문의합니다.`,
    nextAction: "prepare_email",
    subject: "일반 문의",
    prompts: ["관련 공개 페이지 또는 도구:", "문의 목적:", "대략적인 시각·시간대:", "원하는 다음 행동:"],
  },
  payment_access: {
    label: "결제 확인·Pro 접근·복구",
    selfHelpRoute: "payment_help",
    selfHelpHref: "/payment-help",
    selfHelpLabel: "재결제 전 결제·접근 도움 확인",
    minimalEvidence: ["공개 product", "payment/access 문제 범주", "대략적인 결제 시각·시간대", "결제 reference 마지막 8자", "안전한 오류 범주"],
    doNotSend: commonDoNotSend,
    channel: "hoju_email",
    responseExpectation: "access_target_4_business_hours",
    escalation: `${emailLifecycle} 접근 문제만 4영업시간 이내 확인 결과 또는 다음 조치 안내를 목표로 합니다. 4영업시간 뒤 다음 영업일에 같은 thread로 한 번만 재문의하며, 추가 결제는 하지 않습니다.`,
    nextAction: "use_self_help",
    subject: "결제 및 접근 지원",
    prompts: ["제품명:", "문제 유형(결제 확인 / 접근 / 복구):", "결제일·대략적인 시각·시간대:", "구매 이메일(메일 앱에서만 입력):", "Stripe 참조 마지막 8자:", "가린 오류 범주:", "이미 시도한 방법:"],
  },
  refund: {
    label: "환불 요청·중복 결제·분쟁",
    selfHelpRoute: "purchase_information",
    selfHelpHref: "/purchase-information",
    selfHelpLabel: "환불·구매 조건과 결제 도움 확인",
    minimalEvidence: ["공개 product", "refund/duplicate/dispute 범주", "대략적인 결제 시각·시간대", "각 결제 reference 마지막 8자", "원하는 해결 범주"],
    doNotSend: commonDoNotSend,
    channel: "documented_transaction_support",
    responseExpectation: "unknown",
    escalation: `${emailLifecycle} 환불·분쟁 SLA는 UNKNOWN이며 요청만으로 완료되지 않습니다. 접수 회신의 목표 시점 뒤 같은 thread로 한 번만 재문의합니다. 본인 결제가 아니거나 카드 위험이 계속되면 issuer_or_bank를 즉시 이용합니다.`,
    nextAction: "use_self_help",
    subject: "환불 또는 분쟁 지원",
    prompts: ["제품명:", "요청 유형(환불 / 중복 결제 / 분쟁):", "결제일·대략적인 시각·시간대:", "구매 이메일(메일 앱에서만 입력):", "각 Stripe 참조 마지막 8자:", "원하는 해결 범주:"],
  },
  technical_error: {
    label: "기술 오류·저장 문제",
    selfHelpRoute: "browser_retry_and_contact_templates",
    selfHelpHref: "#contact-type-heading",
    selfHelpLabel: "도구 오류 템플릿 확인",
    minimalEvidence: ["공개 page/tool", "기기·브라우저 범주", "문제 직전 행동", "안전한 오류 범주", "대략적인 시각·시간대"],
    doNotSend: commonDoNotSend,
    channel: "hoju_email",
    responseExpectation: "unknown",
    escalation: `${emailLifecycle} 기술 문의 SLA는 UNKNOWN입니다. 접수 회신의 목표 시점 뒤 같은 thread로 한 번만 재문의하고, workspace 원문이나 backup을 첨부하지 않습니다.`,
    nextAction: "prepare_email",
    subject: "기술 오류 문의",
    prompts: ["관련 공개 페이지 또는 도구:", "기기·브라우저:", "문제 직전 행동:", "가린 오류 범주:", "대략적인 시각·시간대:"],
  },
  content_correction: {
    label: "콘텐츠 정정·공식 출처",
    selfHelpRoute: "editorial_policy",
    selfHelpHref: "/editorial-policy",
    selfHelpLabel: "출처·정정 원칙 확인",
    minimalEvidence: ["공개 page", "확인이 필요한 문장 범주", "확인 시각", "공개 official source URL"],
    doNotSend: commonDoNotSend,
    channel: "hoju_email",
    responseExpectation: "unknown",
    escalation: `${emailLifecycle} 정정 문의 SLA는 UNKNOWN입니다. 접수 회신에 목표 시점이 있을 때만 같은 thread로 한 번 재문의합니다.`,
    nextAction: "prepare_email",
    subject: "콘텐츠 정정 요청",
    prompts: ["관련 공개 페이지:", "확인이 필요한 문장:", "확인한 시각:", "공개 공식 출처 URL:"],
  },
  privacy_deletion: {
    label: "개인정보 접근·정정·삭제·incident",
    selfHelpRoute: "privacy_and_data_transfer",
    selfHelpHref: "/privacy#retention-delete",
    selfHelpLabel: "브라우저·파일·Hoju·provider 사본 구분",
    minimalEvidence: ["access/correction/delete/incident 범주", "관련 공개 activity/product", "대략적인 날짜", "browser/file/Hoju/provider 사본 범주"],
    doNotSend: commonDoNotSend,
    channel: "hoju_email",
    responseExpectation: "unknown",
    escalation: `${emailLifecycle} 개인정보 요청 SLA는 UNKNOWN입니다. 접수 회신의 목표 시점 뒤 같은 thread로 한 번 재문의하고, 해결되지 않은 불만은 /privacy의 OAIC 경로를 확인합니다.`,
    nextAction: "use_self_help",
    subject: "개인정보 요청",
    prompts: ["요청 유형(접근 / 정정 / 삭제 / 제한 / 불만 / incident):", "관련 활동 또는 제품:", "대략적인 날짜:", "사본 위치 범주(browser / file / Hoju / provider):", "확인에 필요한 최소 정보(메일 앱에서만 입력):"],
  },
  partnership_feedback: {
    label: "제휴·기관 협력·피드백",
    selfHelpRoute: "contact_templates",
    selfHelpHref: "#contact-type-heading",
    selfHelpLabel: "공식 이메일 경계 확인",
    minimalEvidence: ["기관·사업 공개명", "공개 website", "제안 목적 범주", "대상 사용자 범주", "원하는 다음 행동"],
    doNotSend: [...commonDoNotSend, "고객 명단·비공개 계약서·API key·secret·공개 전 내부 자료"],
    channel: "hoju_email",
    responseExpectation: "unknown",
    escalation: `${emailLifecycle} 제휴·피드백 SLA는 UNKNOWN입니다. 접수 회신에 목표 시점이 있을 때만 같은 thread로 한 번 재문의합니다. 첫 메일에는 첨부하지 않습니다.`,
    nextAction: "prepare_email",
    subject: "제휴·기관 협력·피드백",
    prompts: ["기관 또는 사업 공개명:", "공개 웹사이트:", "제안 목적과 대상 사용자:", "원하는 다음 행동:", "회신 이메일(메일 앱에서만 입력):"],
  },
  urgent_or_deadline: {
    label: "긴급·위기·법률/세무/이민 마감",
    selfHelpRoute: "help_directory",
    selfHelpHref: "/help-directory",
    selfHelpLabel: "상황별 공식 도움 연락처",
    minimalEvidence: ["필요한 official service 범주", "현재 위치", "즉시 위험 여부", "적용되는 deadline 범주"],
    doNotSend: [...commonDoNotSend, "긴급·위기·마감 내용을 Hoju email로 보내고 답변을 기다리는 행동"],
    channel: "official_service",
    responseExpectation: "no_wait_use_official_service",
    escalation: "생명·안전 위험, 진행 중 범죄 또는 의료 응급이면 지금 000에 전화합니다. 스크린샷이나 자료 준비 때문에 000 연락을 늦추지 않습니다. 그 밖의 위기·법률·세무·이민 마감은 /help-directory에서 현재 official service를 확인하며 Hoju email 답변을 기다리지 않습니다. 인터넷이 없으면 가능하고 안전한 경우 유선전화·공중전화·주변 사람의 도움을 이용합니다.",
    nextAction: "use_official_service_now",
    subject: "",
    prompts: [],
  },
};

const fieldLabels: Record<keyof ContactSupportOutcome, string> = {
  issue_category: "issue_category",
  self_help_route: "self_help_route",
  minimal_evidence_categories: "minimal_evidence_categories",
  do_not_send: "do_not_send",
  channel: "channel",
  response_expectation: "response_expectation",
  escalation_or_follow_up: "escalation_or_follow_up",
  next_action: "next_action",
};

function mailHref(email: string, details: SupportDetails) {
  const body = [
    ...details.prompts.flatMap((prompt) => [prompt, ""]),
    "스크린샷을 첨부한다면 이름, 주소, 이메일, 전체 결제 참조와 문서 내용을 가렸습니다. 원본 파일은 첨부하지 않았습니다.",
    "카드번호·CVC·비밀번호·인증번호·TFN·신분증/비자 원문·복구 코드·영수증 전체·workspace 원문은 포함하지 않았습니다.",
  ].join("\n");
  return `mailto:${email}?subject=${encodeURIComponent(`[Hoju Compass] ${details.subject}`)}&body=${encodeURIComponent(body)}`;
}

function displayValue(value: ContactSupportOutcome[keyof ContactSupportOutcome]) {
  return Array.isArray(value) ? value.join(" · ") : value;
}

export function ContactSupportNextAction({ supportEmail }: { supportEmail: string | null }) {
  const [issueCategory, setIssueCategory] = useState<IssueCategory | "">("");

  const outcome = useMemo<ContactSupportOutcome | null>(() => {
    if (!issueCategory) return null;
    const details = supportDetails[issueCategory];
    return {
      issue_category: issueCategory,
      self_help_route: details.selfHelpRoute,
      minimal_evidence_categories: details.minimalEvidence,
      do_not_send: details.doNotSend,
      channel: details.channel,
      response_expectation: details.responseExpectation,
      escalation_or_follow_up: details.escalation,
      next_action: details.nextAction,
    };
  }, [issueCategory]);

  const selectedDetails = issueCategory ? supportDetails[issueCategory] : null;
  const emailAction = supportEmail && selectedDetails && issueCategory !== "urgent_or_deadline"
    ? mailHref(supportEmail, selectedDetails)
    : null;

  return (
    <section className="mt-8 rounded-2xl border-2 border-navy bg-white p-5 shadow-[0_16px_35px_rgba(26,39,68,0.08)] sm:p-7" aria-labelledby="contact-next-action-heading">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gold-ink">Memory only · Email support boundary</p>
      <h2 id="contact-next-action-heading" className="mt-2 text-2xl font-semibold text-navy">먼저 해결 경로와 보낼 정보 범위를 확인하세요.</h2>
      <p className="mt-3 max-w-4xl text-sm leading-7 text-muted">선택은 이 화면 메모리에만 있고 URL·저장소·쿠키·clipboard·파일·메일·분석으로 자동 전송되지 않습니다. 사이트 form과 contact API는 없으며, 메일 앱에서 최종 확인해야 합니다.</p>

      <label htmlFor="issue-category" className="mt-5 block max-w-2xl text-sm font-semibold text-navy">지금 필요한 도움
        <select id="issue-category" value={issueCategory} onChange={(event) => setIssueCategory(event.target.value as IssueCategory | "")} className="mt-2 min-h-12 w-full rounded-lg border border-navy/25 bg-white px-3 text-sm font-medium text-navy">
          <option value="">문의 유형을 선택하세요</option>
          {(Object.keys(supportDetails) as IssueCategory[]).map((id) => <option key={id} value={id}>{supportDetails[id].label}</option>)}
        </select>
      </label>

      {!outcome || !selectedDetails ? <p className="mt-5 border-l-2 border-gold bg-gold/5 px-4 py-3 text-sm leading-6 text-navy" role="status">8개 유형 중 하나를 직접 고르면 self-help, 최소 증거, channel과 다음 행동이 나타납니다. 자동 발송은 없습니다.</p> : (
        <div className="mt-6" aria-live="polite">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-navy">contact_support_next_action</p>
          <p className="mt-2 text-sm leading-6 text-muted">현재 destination: <strong className="break-all text-navy">{issueCategory === "urgent_or_deadline" ? "official_service" : supportEmail ?? "UNKNOWN · 공식 이메일 미설정"}</strong></p>

          {issueCategory === "urgent_or_deadline" ? (
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              <a href="tel:000" className="inline-flex min-h-12 items-center justify-center rounded-lg bg-red-700 px-5 text-sm font-semibold text-white">즉시 위험이면 000 전화 →</a>
              <a href="https://www.infrastructure.gov.au/media-communications/phone/triple-zero/how-call-triple-zero-000" target="_blank" rel="noreferrer" className="inline-flex min-h-12 items-center justify-center rounded-lg border border-navy px-5 text-center text-sm font-semibold text-navy">Triple Zero 공식 안내 ↗</a>
              <a href="/help-directory" className="inline-flex min-h-12 items-center justify-center rounded-lg border border-navy px-5 text-center text-sm font-semibold text-navy sm:col-span-2">위기·마감별 공식 도움 연락처 →</a>
            </div>
          ) : (
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              <a href={selectedDetails.selfHelpHref} className="inline-flex min-h-12 items-center justify-center rounded-lg border border-navy px-5 text-center text-sm font-semibold text-navy">{selectedDetails.selfHelpLabel} →</a>
              {emailAction ? <a href={emailAction} className="inline-flex min-h-12 items-center justify-center rounded-lg bg-navy px-5 text-center text-sm font-semibold text-white">최소 정보로 메일 앱 열기 →</a> : <span className="flex min-h-12 items-center border-l-2 border-gold bg-surface px-4 text-sm text-muted">공식 이메일 UNKNOWN · 주소를 추측하지 마세요.</span>}
            </div>
          )}

          <dl className="mt-4 grid gap-3 md:grid-cols-2">
            {(Object.keys(fieldLabels) as Array<keyof ContactSupportOutcome>).map((field) => (
              <div key={field} className={`border p-4 ${field === "next_action" ? "border-gold bg-gold/5" : "border-border bg-surface"}`}>
                <dt className="font-mono text-xs text-muted">{fieldLabels[field]}</dt>
                <dd className="mt-2 break-words text-sm font-semibold leading-6 text-navy">{displayValue(outcome[field])}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-4 flex flex-col items-start gap-2 sm:flex-row sm:gap-6">
            <a href="/privacy#retention-delete" className="inline-flex min-h-11 items-center font-semibold text-navy underline decoration-gold underline-offset-4">개인정보·첨부·삭제 경계 →</a>
            <a href="/terms" className="inline-flex min-h-11 items-center font-semibold text-navy underline decoration-gold underline-offset-4">이용조건 →</a>
          </div>
        </div>
      )}
    </section>
  );
}
