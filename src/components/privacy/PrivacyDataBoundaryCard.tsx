"use client";

import { useMemo, useState } from "react";

type PrivacyActivity =
  | "browse"
  | "use_local_tool"
  | "export_import_file"
  | "submit_survey"
  | "send_email"
  | "start_checkout"
  | "use_paid_access"
  | "open_external_service";

type PrivacyDecision = "continue" | "limit" | "delete" | "contact";

type PrivacyNextAction =
  | "continue_current_activity"
  | "stay_local_and_avoid_external_submit"
  | "use_coarse_non_identifying_inputs"
  | "do_not_load_video_or_external_link"
  | "clear_selected_tool_data"
  | "open_browser_site_data_help"
  | "delete_backup_file"
  | "open_privacy_request_email"
  | "open_provider_privacy_or_delete_route";

type PrivacyBoundaryOutcome = {
  selected_activity: PrivacyActivity;
  data_location: string;
  data_categories: string;
  not_collected_boundary: string;
  retention_delete_route: string;
  third_party_route: string;
  decision: PrivacyDecision;
  next_action: PrivacyNextAction;
};

type ProviderLink = { label: string; href: string };
type ActivityDetails = {
  label: string;
  location: string;
  categories: string;
  notCollected: string;
  retention: string;
  thirdParty: string;
  providers: ProviderLink[];
};

const vercelPrivacy = { label: "Vercel Web Analytics 개인정보 안내", href: "https://vercel.com/docs/analytics/privacy-policy" };
const vercelDpa = { label: "Vercel 국제 처리·하위 처리자 안내", href: "https://vercel.com/legal/dpa" };
const stripePrivacy = { label: "Stripe 호주 개인정보 안내", href: "https://stripe.com/au/privacy" };
const stripeTransfers = { label: "Stripe 국제 데이터 이전 안내", href: "https://stripe.com/au/legal/dta" };
const zohoPrivacy = { label: "Zoho Mail 데이터 위치 안내", href: "https://www.zoho.com/mail/gdpr.html" };
const googlePrivacy = { label: "Google·YouTube·Maps 개인정보 안내", href: "https://policies.google.com/privacy" };

const activities: Record<PrivacyActivity, ActivityDetails> = {
  browse: {
    label: "일반 페이지 보기",
    location: "memory_only · browser cache · vercel",
    categories: "기술 요청 정보와 Web Analytics data point",
    notCollected: "회원 계정·광고 프로필을 만들지 않습니다. URL query는 분석 전 제거하며 parse 실패나 다른 origin은 전송하지 않습니다.",
    retention: "브라우저 site data는 브라우저 설정에서 지웁니다. Vercel 보존 기간과 실제 처리 국가는 현 설정에서 UNKNOWN이며 제공자 계약·설정을 정기 검토합니다.",
    thirdParty: "Vercel이 호스팅·보안·분석을 처리합니다. 미국이 주요 처리 위치이며 다른 국가와 하위 처리자 경로가 있을 수 있습니다.",
    providers: [vercelPrivacy, vercelDpa],
  },
  use_local_tool: {
    label: "무료·Pro 로컬 도구 사용",
    location: "browser_local · memory_only",
    categories: "workspace text, 날짜, 금액, 진행 상태와 메모",
    notCollected: "Hoju 서버는 작업 원문·원본 증빙을 받지 않습니다. 다만 사용자가 입력한 개인정보·금융 관련 원문은 이 브라우저에 남을 수 있습니다.",
    retention: "도구별 검증된 삭제 기능 또는 브라우저의 전체 site data 삭제를 사용합니다. 일반 브라우저와 설치형 PWA 사본은 서로 다를 수 있습니다.",
    thirdParty: "도구 계산·저장은 로컬입니다. 페이지 요청 자체의 기술 정보는 Vercel이 처리할 수 있습니다.",
    providers: [vercelPrivacy],
  },
  export_import_file: {
    label: "JSON 백업 만들기·불러오기",
    location: "browser_local · downloaded_plaintext_file",
    categories: "선택한 34개 도구의 workspace 원문과 manifest metadata",
    notCollected: "백업 파일은 Hoju 서버에 업로드되지 않습니다. 구매 이용권·접근 쿠키·복구 코드·결제 증빙도 포함하지 않습니다.",
    retention: "브라우저 기록과 내려받은 평문 파일은 별도 사본입니다. 각 파일과 각 브라우저/PWA 사본을 필요한 위치에서 따로 삭제합니다.",
    thirdParty: "파일을 cloud, 메신저나 이메일에 옮기면 사용자가 고른 해당 제공자가 처리하며 위치·기간은 provider current policy를 따릅니다.",
    providers: [],
  },
  submit_survey: {
    label: "Job Move 설문 제출",
    location: "hoju_server · zoho_mail_au · 30-day browser cookie",
    categories: "고정 선택 답변, startedAt, 정상 시 빈 honeypot, random response ID와 receipt time",
    notCollected: "이름·이메일·전화·회사·비자 정보·자유 입력을 요구하지 않습니다. startedAt과 honeypot은 4초~24시간 bot 검증 뒤 메일 본문에 넣지 않습니다.",
    retention: "지원 메일 운영자만 제품 방향 검토에 사용합니다. 90일마다 필요성을 검토하고, 미해결 사안·법적 보존 사유가 없으면 수신 12개월 안에 삭제합니다.",
    thirdParty: "요청 검증은 Hoju/Vercel 경로, 선택 답변·무작위 ID·수신 시각 메일은 Zoho Mail AU service data location에서 처리됩니다.",
    providers: [zohoPrivacy, vercelDpa],
  },
  send_email: {
    label: "문의·1회 안내 이메일 보내기",
    location: "selected mail app · zoho_mail_au",
    categories: "보낸 email address/display name, subject와 body",
    notCollected: "web contact form은 없습니다. 카드/CVC·전체 영수증·복구 코드·신분증 원문을 보내지 않도록 안내합니다.",
    retention: "일반 문의는 마지막 연락 뒤 24개월 이내 검토·삭제하고, 1회 안내 주소는 발송·철회 뒤 30일 안에 삭제합니다. 미해결 분쟁·법적 보존은 예외입니다.",
    thirdParty: "사용자가 고른 mail app/provider와 Hoju의 Zoho Mail AU가 처리합니다. 하위 처리자·지원 접근이 호주에만 있다고 단정하지 않습니다.",
    providers: [zohoPrivacy],
  },
  start_checkout: {
    label: "Stripe Checkout 시작",
    location: "stripe_or_link · hoju_server · zoho_mail_au",
    categories: "payment/contact/tax/invoice data, transaction IDs/status/time, product·amount·status/reason·reference suffix alert",
    notCollected: "전체 카드번호·CVC는 Hoju가 직접 받지 않으며 Stripe/Link가 처리합니다. 작업공간 원문도 결제 DB나 운영 알림에 넣지 않습니다.",
    retention: "Stripe/provider 삭제 경로와 Hoju privacy request를 구분합니다. 조정 완료된 비필수 alert email은 12개월 안에 삭제하지만 법정 최소 거래 기록은 보통 5년 남을 수 있습니다.",
    thirdParty: "Stripe/Link는 global·cross-border 경로, Zoho Mail AU는 제한된 운영 알림을 처리합니다. 이 거래의 정확한 처리 국가는 UNKNOWN입니다.",
    providers: [stripePrivacy, stripeTransfers, zohoPrivacy],
  },
  use_paid_access: {
    label: "구매 이용권·복구 사용",
    location: "browser cookie · sessionStorage · hoju_server · vercel",
    categories: "entitlement IDs/status/time, signed access session, restore token hash·expiry·use state",
    notCollected: "서버 이용권 DB는 Resume·Rental·Pay Evidence·EOFY·Leaving 작업 원문과 원본 증빙을 저장하지 않습니다. Car 판매·이용권은 아직 열려 있지 않습니다.",
    retention: "제품별 접근 쿠키는 30일이며 서버 상태를 매번 재확인합니다. 미사용 복구 hash는 만료·새 코드 발급 때 무효화하며 삭제·정정 요청은 Hoju에 문의합니다.",
    thirdParty: "Hoju의 호스팅·database provider가 접근 상태를 처리할 수 있습니다. 실제 처리 국가와 provider 보존 기간은 현 공개 설정에서 UNKNOWN입니다.",
    providers: [vercelDpa, stripePrivacy],
  },
  open_external_service: {
    label: "영상·지도·외부 사이트 열기",
    location: "selected_external_provider",
    categories: "IP/browser technical data와 URL에 넣은 query·출발지·목적지",
    notCollected: "외부 링크를 열기 전까지 Hoju가 목적지 서비스에 대신 제출하지 않습니다. 열면 해당 provider가 URL과 기술 정보를 받을 수 있습니다.",
    retention: "외부 provider의 privacy/delete route를 사용합니다. Hoju의 site data를 지워도 provider 사본은 자동 삭제되지 않습니다.",
    thirdParty: "Google·YouTube·Maps 또는 사용자가 선택한 정부·외부 서비스가 별도 처리자가 됩니다. 실제 국가·하위 처리자는 provider current policy를 확인합니다.",
    providers: [googlePrivacy],
  },
};

const decisionLabels: Array<{ id: PrivacyDecision; label: string; detail: string }> = [
  { id: "continue", label: "계속", detail: "위 경계를 확인하고 진행" },
  { id: "limit", label: "최소화", detail: "입력·외부 전송 범위를 줄이기" },
  { id: "delete", label: "삭제", detail: "지울 사본과 위치를 고르기" },
  { id: "contact", label: "문의", detail: "접근·정정·삭제·불만 요청" },
];

const nextByDecision: Record<PrivacyActivity, Record<PrivacyDecision, PrivacyNextAction>> = {
  browse: { continue: "continue_current_activity", limit: "do_not_load_video_or_external_link", delete: "open_browser_site_data_help", contact: "open_privacy_request_email" },
  use_local_tool: { continue: "continue_current_activity", limit: "use_coarse_non_identifying_inputs", delete: "clear_selected_tool_data", contact: "open_privacy_request_email" },
  export_import_file: { continue: "continue_current_activity", limit: "stay_local_and_avoid_external_submit", delete: "delete_backup_file", contact: "open_privacy_request_email" },
  submit_survey: { continue: "continue_current_activity", limit: "stay_local_and_avoid_external_submit", delete: "open_privacy_request_email", contact: "open_privacy_request_email" },
  send_email: { continue: "continue_current_activity", limit: "use_coarse_non_identifying_inputs", delete: "open_privacy_request_email", contact: "open_privacy_request_email" },
  start_checkout: { continue: "continue_current_activity", limit: "stay_local_and_avoid_external_submit", delete: "open_provider_privacy_or_delete_route", contact: "open_privacy_request_email" },
  use_paid_access: { continue: "continue_current_activity", limit: "stay_local_and_avoid_external_submit", delete: "open_privacy_request_email", contact: "open_privacy_request_email" },
  open_external_service: { continue: "continue_current_activity", limit: "do_not_load_video_or_external_link", delete: "open_provider_privacy_or_delete_route", contact: "open_provider_privacy_or_delete_route" },
};

const actionDetails: Record<PrivacyNextAction, { label: string; href: string }> = {
  continue_current_activity: { label: "선택한 활동의 상세 경계 확인", href: "#privacy-details" },
  stay_local_and_avoid_external_submit: { label: "로컬에만 두는 방법 확인", href: "#local-storage" },
  use_coarse_non_identifying_inputs: { label: "정확한 식별정보 대신 범주·별칭 사용", href: "#sensitive-information" },
  do_not_load_video_or_external_link: { label: "외부 서비스 불러오기 전 경계 확인", href: "#external-services" },
  clear_selected_tool_data: { label: "검증된 도구별 삭제 범위 확인", href: "/data-transfer#device-delete-heading" },
  open_browser_site_data_help: { label: "브라우저 site data 삭제 범위 확인", href: "#retention-delete" },
  delete_backup_file: { label: "백업 파일과 브라우저 사본을 따로 삭제", href: "#backup-files" },
  open_privacy_request_email: { label: "개인정보 요청·불만 이메일 열기", href: "/contact" },
  open_provider_privacy_or_delete_route: { label: "제공자 개인정보·삭제 경로 열기", href: "#third-parties" },
};

const fieldLabels: Record<keyof PrivacyBoundaryOutcome, string> = {
  selected_activity: "selected_activity",
  data_location: "data_location",
  data_categories: "data_categories",
  not_collected_boundary: "not_collected_boundary",
  retention_delete_route: "retention_delete_route",
  third_party_route: "third_party_route",
  decision: "decision",
  next_action: "next_action",
};

export function PrivacyDataBoundaryCard({ supportEmail }: { supportEmail: string | null }) {
  const [activity, setActivity] = useState<PrivacyActivity | "">("");
  const [decision, setDecision] = useState<PrivacyDecision | null>(null);

  const outcome = useMemo<PrivacyBoundaryOutcome | null>(() => {
    if (!activity || !decision) return null;
    const details = activities[activity];
    return {
      selected_activity: activity,
      data_location: details.location,
      data_categories: details.categories,
      not_collected_boundary: details.notCollected,
      retention_delete_route: details.retention,
      third_party_route: details.thirdParty,
      decision,
      next_action: nextByDecision[activity][decision],
    };
  }, [activity, decision]);

  const privacyEmailHref = supportEmail
    ? `mailto:${supportEmail}?subject=${encodeURIComponent("[Hoju Compass] 개인정보 접근·정정·삭제·불만 요청")}&body=${encodeURIComponent([
      "요청 유형(접근 / 정정 / 삭제 / 불만 / incident):",
      "관련 활동 또는 제품:",
      "확인에 필요한 최소 정보:",
      "",
      "카드번호·CVC·전체 영수증·복구 코드·신분증 원문은 보내지 마세요.",
    ].join("\n"))}`
    : "/contact";

  const action = outcome ? actionDetails[outcome.next_action] : null;
  const actionHref = outcome?.next_action === "open_privacy_request_email" ? privacyEmailHref : action?.href;

  return (
    <section className="mt-8 rounded-2xl border-2 border-navy bg-white p-5 shadow-[0_16px_35px_rgba(26,39,68,0.08)] sm:p-7" aria-labelledby="privacy-boundary-heading">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gold-ink">Memory only · Privacy boundary</p>
      <h2 id="privacy-boundary-heading" className="mt-2 text-2xl font-semibold text-navy">활동별 데이터 경계를 확인하세요.</h2>
      <p className="mt-3 max-w-4xl text-sm leading-7 text-muted">아래 선택은 이 화면 메모리에만 있고 URL·브라우저 저장소·파일·메일·분석으로 보내지 않습니다. 활동과 결정을 직접 골라야 결과가 생깁니다.</p>

      <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_1.35fr]">
        <label className="text-sm font-semibold text-navy">1. 지금 하려는 활동
          <select value={activity} onChange={(event) => { setActivity(event.target.value as PrivacyActivity | ""); setDecision(null); }} className="mt-2 min-h-12 w-full rounded-lg border border-navy/25 bg-white px-3 text-sm font-medium text-navy">
            <option value="">활동을 선택하세요</option>
            {(Object.keys(activities) as PrivacyActivity[]).map((id) => <option key={id} value={id}>{activities[id].label}</option>)}
          </select>
        </label>
        <fieldset disabled={!activity}>
          <legend className="text-sm font-semibold text-navy">2. 경계를 확인한 뒤 내 결정</legend>
          <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {decisionLabels.map((item) => <button key={item.id} type="button" aria-pressed={decision === item.id} onClick={() => setDecision(item.id)} className={`min-h-12 rounded-lg border px-3 py-2 text-left transition disabled:cursor-not-allowed disabled:opacity-40 ${decision === item.id ? "border-navy bg-navy text-white" : "border-navy/20 bg-surface text-navy"}`}><strong className="block text-sm">{item.label}</strong><span className={`mt-1 block text-xs leading-4 ${decision === item.id ? "text-white/75" : "text-muted"}`}>{item.detail}</span></button>)}
          </div>
        </fieldset>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-2 lg:grid-cols-5" aria-label="데이터 경계 한눈 요약">
        {[
          ["로컬 저장", "도구 원문은 주로 현재 브라우저"],
          ["Hoju 서버", "설문 검증·이용권·거래 상태"],
          ["제3자", "Vercel·Zoho·Stripe·선택 서비스"],
          ["수집하지 않음", "계정·광고 프로필·raw card/CVC"],
          ["지우는 곳", "브라우저·파일·Hoju·provider 각각"],
        ].map(([title, body]) => <div key={title} className="border-l-2 border-gold bg-surface px-3 py-3"><strong className="block text-sm text-navy">{title}</strong><span className="mt-1 block text-xs leading-5 text-muted">{body}</span></div>)}
      </div>

      {!outcome ? <p className="mt-5 border-l-2 border-gold bg-gold/5 px-4 py-3 text-sm leading-6 text-navy" role="status">활동을 고른 뒤 계속·최소화·삭제·문의 중 하나를 직접 선택하세요. 자동으로 동의하거나 진행하지 않습니다.</p> : (
        <div className="mt-6" aria-live="polite">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-navy">privacy_data_boundary_next_action</p>
          <dl className="mt-3 grid gap-3 md:grid-cols-2">
            {(Object.keys(fieldLabels) as Array<keyof PrivacyBoundaryOutcome>).map((field) => <div key={field} className={`border p-4 ${field === "next_action" ? "border-gold bg-gold/5" : "border-border bg-surface"}`}><dt className="font-mono text-xs text-muted">{fieldLabels[field]}</dt><dd className="mt-2 break-words text-sm font-semibold leading-6 text-navy">{outcome[field]}</dd></div>)}
          </dl>
          {activities[outcome.selected_activity].providers.length > 0 ? <div className="mt-4 flex flex-wrap gap-2" aria-label="선택한 활동의 공식 제공자 개인정보 링크">{activities[outcome.selected_activity].providers.map((provider) => <a key={provider.href} href={provider.href} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center rounded-full border border-navy/20 px-4 text-xs font-semibold text-navy underline decoration-gold underline-offset-4">{provider.label} ↗</a>)}</div> : <p className="mt-4 text-xs leading-5 text-muted">고정된 외부 제공자는 없습니다. 파일을 옮기는 위치를 선택하면 그 제공자의 최신 개인정보 안내를 따르세요.</p>}
          {action && actionHref ? <a href={actionHref} className="mt-5 inline-flex min-h-12 w-full items-center justify-between rounded-lg bg-navy px-5 text-sm font-semibold text-white sm:w-auto sm:min-w-80"><span>{action.label}</span><span aria-hidden="true">→</span></a> : null}
          <p className="mt-3 text-xs leading-5 text-muted">한 사본을 지워도 브라우저·PWA·파일·메일·Stripe/provider·법정 거래 기록의 다른 사본은 자동으로 지워지지 않습니다.</p>
        </div>
      )}
    </section>
  );
}
