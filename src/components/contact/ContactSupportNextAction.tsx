"use client";

import { useMemo, useState } from "react";

type SupportNeed =
  | "general_inquiry"
  | "payment_access"
  | "refund_dispute"
  | "privacy_request"
  | "partnership"
  | "immediate_danger";

type SupportNextAction =
  | "open_general_support_email"
  | "open_payment_access_email"
  | "open_refund_dispute_email"
  | "open_privacy_request_email"
  | "open_partnership_email"
  | "call_000_or_open_official_help";

type ContactSupportOutcome = {
  selected_support_need: SupportNeed;
  destination_and_offline_fallback: string;
  minimum_information: string;
  do_not_send: string;
  attachment_redaction: string;
  sent_folder_and_bounce_action: string;
  response_target_and_follow_up: string;
  next_action: SupportNextAction;
};

type SupportDetails = {
  label: string;
  destination: string;
  minimumInformation: string;
  doNotSend: string;
  attachmentRedaction: string;
  deliveryCheck: string;
  responseAndFollowUp: string;
  nextAction: SupportNextAction;
  subject: string;
  prompts: string[];
};

const sharedSensitiveBoundary = "카드번호·CVC·계좌 비밀번호·인증번호·TFN·신분증/비자 원문·복구 코드·영수증 전체·이력서 원문";
const sharedRedaction = "스크린샷을 첨부한다면 이름, 주소, 이메일, 전체 결제 참조와 문서 내용을 가린 뒤 보냅니다. 원본 파일은 필요하지 않습니다.";
const sharedDeliveryCheck = "메일 앱이 열렸다는 화면만으로 발송 완료로 보지 않습니다. 보낸 편지함 또는 보낼 편지함을 확인합니다. 반송되면 주소를 추측해 다시 보내지 말고 이 /contact 페이지의 현재 공식 주소를 다시 확인합니다.";
const sharedOffline = "인터넷이 없으면 민감정보를 뺀 초안을 기기에만 작성하고 연결이 돌아온 뒤 mailto로 직접 보냅니다. 사이트에는 offline queue나 자동 제출이 없습니다.";

const supportDetails: Record<SupportNeed, SupportDetails> = {
  general_inquiry: {
    label: "일반 문의·콘텐츠 정정·도구 오류",
    destination: `현재 페이지에 표시된 Hoju Compass 공식 지원 이메일. ${sharedOffline}`,
    minimumInformation: "관련 페이지/도구, 확인한 문장 또는 문제 행동, 기기·브라우저, 대략적인 발생 시각, 기대 결과와 실제 결과",
    doNotSend: sharedSensitiveBoundary,
    attachmentRedaction: sharedRedaction,
    deliveryCheck: sharedDeliveryCheck,
    responseAndFollowUp: "일반 문의 응답 목표는 UNKNOWN입니다. 접수 회신에 목표 시점이 있으면 그 시점이 지난 다음 영업일에 같은 thread로 한 번만 후속합니다. 목표 시점이 없으면 임의 SLA를 만들지 않고 현재 /contact 공지를 다시 확인합니다.",
    nextAction: "open_general_support_email",
    subject: "일반 문의",
    prompts: ["관련 페이지 또는 도구:", "확인이 필요한 내용:", "기기와 브라우저:", "발생한 대략적 시각·시간대:", "기대 결과 / 실제 결과:"],
  },
  payment_access: {
    label: "결제 확인·Pro 접근·복구",
    destination: `현재 페이지에 표시된 Hoju Compass 공식 지원 이메일. ${sharedOffline}`,
    minimumInformation: "제품명, 결제일과 대략적 시각·시간대, 구매 이메일, Stripe 영수증/결제 참조 마지막 8자, 개인정보를 가린 오류 문구, 이미 시도한 방법",
    doNotSend: `${sharedSensitiveBoundary}·전체 Stripe/영수증 링크. 같은 제품을 다시 결제하지 않습니다.`,
    attachmentRedaction: sharedRedaction,
    deliveryCheck: sharedDeliveryCheck,
    responseAndFollowUp: "접근 문제만 4영업시간 이내 확인 결과 또는 다음 조치 안내를 목표로 합니다. 결제 상태 확인과 일반 답변 SLA는 UNKNOWN입니다. 접근 문제는 4영업시간이 지난 다음 영업일, 그 밖에는 안내받은 목표 시점이 지난 다음 영업일에 같은 thread로 한 번만 후속합니다.",
    nextAction: "open_payment_access_email",
    subject: "결제 및 접근 지원",
    prompts: ["제품명:", "문제 유형(결제 확인 / 접근 / 복구):", "결제일·대략적 시각·시간대:", "구매 이메일:", "Stripe 영수증 또는 결제 참조 마지막 8자:", "가린 오류 문구:", "이미 시도한 방법:"],
  },
  refund_dispute: {
    label: "환불 요청·중복 결제·분쟁",
    destination: `현재 페이지에 표시된 Hoju Compass 공식 지원 이메일. ${sharedOffline}`,
    minimumInformation: "제품명, 구매 이메일, 결제일, 각 Stripe 참조 마지막 8자, 환불/중복/분쟁 중 요청 유형, 원하는 해결과 간단한 이유",
    doNotSend: `${sharedSensitiveBoundary}·은행 화면 전체·전체 Stripe payload. 요청만으로 환불 완료나 분쟁 결론이 되지 않습니다.`,
    attachmentRedaction: sharedRedaction,
    deliveryCheck: sharedDeliveryCheck,
    responseAndFollowUp: "환불·분쟁 응답 목표는 UNKNOWN입니다. 접수 회신이 제시한 목표 시점이 지난 다음 영업일에 같은 thread로 한 번만 후속합니다. 본인 결제가 아니거나 카드 위험이 계속되면 이메일 답변을 기다리지 말고 카드 발급사에 즉시 연락합니다.",
    nextAction: "open_refund_dispute_email",
    subject: "환불 또는 분쟁 지원",
    prompts: ["제품명:", "요청 유형(환불 / 중복 결제 / 분쟁):", "구매 이메일:", "결제일:", "각 Stripe 참조 마지막 8자:", "원하는 해결과 간단한 이유:"],
  },
  privacy_request: {
    label: "개인정보 접근·정정·삭제·incident",
    destination: `현재 페이지에 표시된 Hoju Compass 공식 지원 이메일. 처리·보존·제공자 경계는 /privacy에서 확인합니다. ${sharedOffline}`,
    minimumInformation: "요청 유형, 관련 활동/제품, 대략적인 날짜, 찾거나 지울 사본의 위치, 회신받을 이메일과 확인에 꼭 필요한 최소 정보",
    doNotSend: `${sharedSensitiveBoundary}·신분증 사본. 본인확인이 더 필요하면 이유와 최소 방법을 먼저 안내받습니다.`,
    attachmentRedaction: sharedRedaction,
    deliveryCheck: sharedDeliveryCheck,
    responseAndFollowUp: "개인정보 요청과 incident의 일반 응답 목표는 UNKNOWN입니다. 접수 회신의 목표 시점 뒤 같은 thread로 한 번만 후속합니다. 불만이 해결되지 않으면 /privacy의 OAIC complaint 경로를 확인합니다.",
    nextAction: "open_privacy_request_email",
    subject: "개인정보 요청",
    prompts: ["요청 유형(접근 / 정정 / 삭제 / 제한 / 불만 / incident):", "관련 활동 또는 제품:", "대략적인 날짜:", "관련 사본 위치(브라우저 / 파일 / Hoju email·server / provider):", "확인에 필요한 최소 정보:"],
  },
  partnership: {
    label: "제휴·기관 협력 제안",
    destination: `현재 페이지에 표시된 Hoju Compass 공식 지원 이메일. ${sharedOffline}`,
    minimumInformation: "기관/사업명, 공개 웹사이트, 담당자 이름과 회신 이메일, 제안 목적, 대상 사용자, 원하는 다음 한 단계",
    doNotSend: `${sharedSensitiveBoundary}·고객 명단·비공개 계약서·API key·secret·로그인 정보·공개 전 내부 자료`,
    attachmentRedaction: "첫 메일에는 첨부하지 않습니다. 공개 URL로 설명하고, 파일이 꼭 필요하면 수신자가 범위와 전송 방법을 확인한 뒤 민감정보를 제거합니다.",
    deliveryCheck: sharedDeliveryCheck,
    responseAndFollowUp: "제휴 문의 응답 목표는 UNKNOWN입니다. 접수 회신에 목표 시점이 있으면 그 시점이 지난 다음 영업일에 같은 thread로 한 번만 후속하며, 없으면 임의 SLA를 표시하지 않습니다.",
    nextAction: "open_partnership_email",
    subject: "제휴 및 기관 협력 제안",
    prompts: ["기관 또는 사업명:", "공개 웹사이트:", "담당자 이름과 회신 이메일:", "제안 목적과 대상 사용자:", "원하는 다음 한 단계:"],
  },
  immediate_danger: {
    label: "긴급·즉시 생명 또는 안전 위험",
    destination: "이메일이 아닙니다. 호주 안의 즉시 위험은 Triple Zero 000입니다. 인터넷이 없으면 가능하고 안전한 경우 유선전화·공중전화·주변 사람의 도움을 이용합니다.",
    minimumInformation: "000 연결 뒤 Police, Fire 또는 Ambulance 중 필요한 서비스, 현재 위치, 무슨 일이 일어났는지, 위험에 놓인 사람 수",
    doNotSend: "Hoju Compass 이메일로 긴급 정보·신분증·건강 기록을 보내거나 답변을 기다리지 않습니다.",
    attachmentRedaction: "스크린샷이나 파일을 준비하지 않습니다. 준비 때문에 000 연락을 늦추지 않습니다.",
    deliveryCheck: "000 통화가 연결됐는지 확인하고 상담원의 지시를 따릅니다. 이메일 sent folder·bounce 확인은 적용되지 않습니다.",
    responseAndFollowUp: "Hoju Compass 응답 목표는 적용되지 않습니다. 즉시 위험이 아니면 공식 도움 연락처에서 상황별 운영시간과 fallback을 확인합니다.",
    nextAction: "call_000_or_open_official_help",
    subject: "",
    prompts: [],
  },
};

const fieldLabels: Record<keyof ContactSupportOutcome, string> = {
  selected_support_need: "selected_support_need",
  destination_and_offline_fallback: "destination_and_offline_fallback",
  minimum_information: "minimum_information",
  do_not_send: "do_not_send",
  attachment_redaction: "attachment_redaction",
  sent_folder_and_bounce_action: "sent_folder_and_bounce_action",
  response_target_and_follow_up: "response_target_and_follow_up",
  next_action: "next_action",
};

function mailHref(email: string, details: SupportDetails) {
  const body = [
    ...details.prompts.flatMap((prompt) => [prompt, ""]),
    "스크린샷·첨부가 있다면 이름, 주소, 이메일, 전체 결제 참조와 문서 내용을 가렸습니다.",
    "카드번호·CVC·비밀번호·인증번호·TFN·신분증/비자 원문·복구 코드·영수증 전체·이력서 원문은 포함하지 않았습니다.",
  ].join("\n");
  return `mailto:${email}?subject=${encodeURIComponent(`[Hoju Compass] ${details.subject}`)}&body=${encodeURIComponent(body)}`;
}

export function ContactSupportNextAction({ supportEmail }: { supportEmail: string | null }) {
  const [supportNeed, setSupportNeed] = useState<SupportNeed | "">("");

  const outcome = useMemo<ContactSupportOutcome | null>(() => {
    if (!supportNeed) return null;
    const details = supportDetails[supportNeed];
    return {
      selected_support_need: supportNeed,
      destination_and_offline_fallback: supportNeed === "immediate_danger"
        ? details.destination
        : `${supportEmail ?? "공식 지원 이메일 UNKNOWN"} · ${details.destination}`,
      minimum_information: details.minimumInformation,
      do_not_send: details.doNotSend,
      attachment_redaction: details.attachmentRedaction,
      sent_folder_and_bounce_action: details.deliveryCheck,
      response_target_and_follow_up: details.responseAndFollowUp,
      next_action: details.nextAction,
    };
  }, [supportEmail, supportNeed]);

  const selectedDetails = supportNeed ? supportDetails[supportNeed] : null;
  const emailAction = supportEmail && selectedDetails && supportNeed !== "immediate_danger"
    ? mailHref(supportEmail, selectedDetails)
    : null;

  return (
    <section className="mt-8 rounded-2xl border-2 border-navy bg-white p-5 shadow-[0_16px_35px_rgba(26,39,68,0.08)] sm:p-7" aria-labelledby="contact-next-action-heading">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gold-ink">Memory only · Email support boundary</p>
      <h2 id="contact-next-action-heading" className="mt-2 text-2xl font-semibold text-navy">보낼 곳과 최소 정보부터 확인하세요.</h2>
      <p className="mt-3 max-w-4xl text-sm leading-7 text-muted">선택은 이 화면 메모리에만 있고 URL·저장소·쿠키·파일·메일·분석으로 자동 전송되지 않습니다. 결과를 확인한 뒤에만 메일 앱을 직접 여세요.</p>

      <label htmlFor="support-need" className="mt-5 block max-w-2xl text-sm font-semibold text-navy">지금 필요한 도움
        <select id="support-need" value={supportNeed} onChange={(event) => setSupportNeed(event.target.value as SupportNeed | "")} className="mt-2 min-h-12 w-full rounded-lg border border-navy/25 bg-white px-3 text-sm font-medium text-navy">
          <option value="">문의 유형을 선택하세요</option>
          {(Object.keys(supportDetails) as SupportNeed[]).map((id) => <option key={id} value={id}>{supportDetails[id].label}</option>)}
        </select>
      </label>

      {!outcome ? <p className="mt-5 border-l-2 border-gold bg-gold/5 px-4 py-3 text-sm leading-6 text-navy" role="status">유형을 직접 고르면 정확한 보낼 곳, 최소 정보와 다음 행동이 나타납니다. 메일은 자동으로 열리거나 발송되지 않습니다.</p> : (
        <div className="mt-6" aria-live="polite">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-navy">contact_support_next_action</p>
          {supportNeed === "immediate_danger" ? (
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              <a href="tel:000" className="inline-flex min-h-12 items-center justify-center rounded-lg bg-red-700 px-5 text-sm font-semibold text-white">지금 000 전화 →</a>
              <a href="https://www.infrastructure.gov.au/media-communications/phone/triple-zero/how-call-triple-zero-000" target="_blank" rel="noreferrer" className="inline-flex min-h-12 items-center justify-center rounded-lg border border-navy px-5 text-center text-sm font-semibold text-navy">Triple Zero 공식 안내 ↗</a>
              <a href="/help-directory" className="inline-flex min-h-12 items-center justify-center rounded-lg border border-navy px-5 text-center text-sm font-semibold text-navy sm:col-span-2">즉시 위험이 아닌 공식 도움 연락처 →</a>
            </div>
          ) : emailAction ? (
            <a href={emailAction} className="mt-4 inline-flex min-h-12 w-full items-center justify-between rounded-lg bg-navy px-5 text-sm font-semibold text-white sm:w-auto sm:min-w-80"><span>경계를 확인하고 메일 앱 열기</span><span aria-hidden="true">→</span></a>
          ) : (
            <p className="mt-4 border-l-2 border-gold bg-surface p-4 text-sm leading-6 text-muted">공식 이메일이 아직 설정되지 않았습니다. 주소를 추측하지 말고 이 페이지에서 현재 상태를 다시 확인하세요.</p>
          )}
          <dl className="mt-3 grid gap-3 md:grid-cols-2">
            {(Object.keys(fieldLabels) as Array<keyof ContactSupportOutcome>).map((field) => (
              <div key={field} className={`border p-4 ${field === "next_action" ? "border-gold bg-gold/5" : "border-border bg-surface"}`}>
                <dt className="font-mono text-xs text-muted">{fieldLabels[field]}</dt>
                <dd className="mt-2 break-words text-sm font-semibold leading-6 text-navy">{outcome[field]}</dd>
              </div>
            ))}
          </dl>
          {supportNeed === "privacy_request" ? <a href="/privacy#retention-delete" className="mt-3 inline-flex min-h-11 items-center font-semibold text-navy underline decoration-gold underline-offset-4">개인정보 사본·삭제 경계 확인 →</a> : null}
        </div>
      )}
    </section>
  );
}
