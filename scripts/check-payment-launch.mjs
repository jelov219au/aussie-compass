import Stripe from "stripe";

import {
  assertResumeProStripeProduct,
  getResumeProStripeProductConfig,
} from "../src/lib/resumeProStripeProduct.ts";
import { paymentAlertsConfigured } from "../src/lib/paymentAlerts.ts";

const strict = process.argv.includes("--strict");
const preflight = process.argv.includes("--preflight");
const verifyStripe = process.argv.includes("--verify-stripe");
const verifyDatabase = process.argv.includes("--verify-database");
const isProduction = process.env.VERCEL_ENV === "production";
const expectedStripeMode = isProduction ? "live" : "test";

function present(value) {
  return Boolean(value?.trim());
}

function secretMode(value) {
  const candidate = value?.trim() ?? "";
  if (/^[rs]k_test_/.test(candidate)) return "test";
  if (/^[rs]k_live_/.test(candidate)) return "live";
  return candidate ? "invalid" : "missing";
}

function neonEndpointId(value) {
  try {
    const hostname = new URL(value?.trim() ?? "").hostname.toLowerCase();
    if (!hostname.endsWith(".neon.tech")) return "";

    const endpointLabel = hostname.split(".")[0];
    const endpointId = endpointLabel.endsWith("-pooler")
      ? endpointLabel.slice(0, -"-pooler".length)
      : endpointLabel;
    return /^ep-[a-z0-9-]+$/.test(endpointId) ? endpointId : "";
  } catch {
    return "";
  }
}

const abnDigits = process.env.BUSINESS_ABN?.replace(/\D/g, "") ?? "";
const supportEmail = process.env.NEXT_PUBLIC_SUPPORT_EMAIL?.trim() ?? "";
const runtimeStripeKey = process.env.STRIPE_SECRET_KEY?.trim() ?? "";
const stripeAuditKey = process.env.PAYMENTS_STRIPE_AUDIT_KEY?.trim() ?? "";
const stripeMode = secretMode(runtimeStripeKey);
const stripeAuditMode = secretMode(stripeAuditKey);
const stripeAuditKeySeparated = stripeAuditKey.startsWith("rk_")
  && stripeAuditMode === expectedStripeMode
  && stripeAuditKey !== runtimeStripeKey;
const tradingName = process.env.BUSINESS_TRADING_NAME?.trim() || "Hoju Compass";
const entitlementDatabaseUrl = process.env.ENTITLEMENT_DB_URL?.trim()
  || process.env.ENTITLEMENT_DB_DATABASE_URL?.trim()
  || "";
const auditDatabaseUrl = process.env.PAYMENTS_AUDIT_DB_URL?.trim() || "";
const expectedNeonEndpointId = process.env.PAYMENTS_EXPECTED_NEON_ENDPOINT_ID?.trim().toLowerCase() || "";
const runtimeNeonEndpointId = neonEndpointId(entitlementDatabaseUrl);
const auditNeonEndpointId = neonEndpointId(auditDatabaseUrl);
const preflightRemoteBoundaryReady = !preflight || process.env.PAYMENTS_ENABLED === "false";
const runtimeStripeRemoteBoundaryReady = preflightRemoteBoundaryReady
  && stripeMode === expectedStripeMode
  && runtimeStripeKey.startsWith("rk_")
  && process.env.STRIPE_RESUME_PRO_PRICE_ID?.trim().startsWith("price_")
  && process.env.STRIPE_RESUME_PRO_PRODUCT_ID?.trim().startsWith("prod_")
  && process.env.STRIPE_RESUME_PRO_TAX_CODE?.trim().startsWith("txcd_");
const stripeAuditRemoteBoundaryReady = runtimeStripeRemoteBoundaryReady
  && stripeAuditKeySeparated
  && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(supportEmail);
const databaseRemoteBoundaryReady = preflightRemoteBoundaryReady
  && /^postgres(?:ql)?:\/\//.test(entitlementDatabaseUrl)
  && /^postgres(?:ql)?:\/\//.test(auditDatabaseUrl)
  && /^ep-[a-z0-9-]+$/.test(expectedNeonEndpointId)
  && runtimeNeonEndpointId === expectedNeonEndpointId
  && auditNeonEndpointId === expectedNeonEndpointId;

const checks = [
  ["결제 스위치", preflight ? process.env.PAYMENTS_ENABLED === "false" : process.env.PAYMENTS_ENABLED === "true", preflight ? "PAYMENTS_ENABLED=false" : "PAYMENTS_ENABLED=true"],
  ["Stripe 키 환경", stripeMode === expectedStripeMode, `${expectedStripeMode} 모드 키`],
  ["최소 권한 Stripe 키", process.env.STRIPE_SECRET_KEY?.trim().startsWith("rk_") ?? false, "rk_ 제한 키"],
  ["Stripe 감사 키 분리", stripeAuditKeySeparated, "같은 모드의 별도 Account Read 제한 키"],
  ["Resume Pro 가격", process.env.STRIPE_RESUME_PRO_PRICE_ID?.trim().startsWith("price_") ?? false, "price_ ID"],
  ["Resume Pro 상품", process.env.STRIPE_RESUME_PRO_PRODUCT_ID?.trim().startsWith("prod_") ?? false, "별도 prod_ ID"],
  ["Managed Payments 세금 분류", process.env.STRIPE_RESUME_PRO_TAX_CODE?.trim().startsWith("txcd_") ?? false, "승인된 txcd_ ID"],
  ["Managed Payments", process.env.STRIPE_MANAGED_PAYMENTS_ENABLED === "true", "활성화"],
  ["웹훅 서명", process.env.STRIPE_WEBHOOK_SECRET?.trim().startsWith("whsec_") ?? false, "whsec_ 비밀"],
  ["이용권 저장소", process.env.PAYMENTS_ENTITLEMENT_STORE === "neon", "Neon"],
  ["이용권 DB", /^postgres(?:ql)?:\/\//.test(entitlementDatabaseUrl), "Postgres 연결"],
  ["Neon endpoint 고정", /^ep-[a-z0-9-]+$/.test(expectedNeonEndpointId) && runtimeNeonEndpointId === expectedNeonEndpointId, "승인된 endpoint와 runtime 연결 일치"],
  ["감사 DB endpoint 일치", Boolean(expectedNeonEndpointId) && auditNeonEndpointId === expectedNeonEndpointId, "감사 연결도 같은 endpoint"],
  ["첫 판매 원자 게이트", process.env.FIRST_SALE_GATE_ENABLED === "true", "DB gate 활성화"],
  ["접근 세션 서명", (process.env.ENTITLEMENT_SESSION_SECRET?.trim().length ?? 0) >= 32, "32자 이상"],
  ["등록 사업명", tradingName.length <= 120, "Hoju Compass"],
  ["법적 판매자", present(process.env.BUSINESS_LEGAL_NAME), "고객 공개용"],
  ["ABN", /^\d{11}$/.test(abnDigits), "11자리"],
  ["지원 이메일", /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(supportEmail), "유효한 이메일"],
  ["운영 결제 알림", paymentAlertsConfigured(), "SMTP 인증·발신자·지원 수신함 일치"],
];

console.log(`Hoju Compass 결제 출시 점검 (${isProduction ? "Production" : "Preview/Local"}${preflight ? ", 결제 OFF 사전감사" : ""})`);
console.log("실제 키, 개인정보, 연결 문자열은 출력하지 않습니다.\n");

for (const [label, passed, requirement] of checks) {
  console.log(`${passed ? "PASS" : "WAIT"}  ${label} — ${requirement}`);
}

const pending = checks.filter(([, passed]) => !passed).length;
console.log(`\n결과: ${checks.length - pending}/${checks.length} 통과, ${pending}개 대기`);

let stripeProductVerified = false;
let zeroOpenCheckoutVerified = !preflight;
let stripeAccountVerified = false;
let stripeSupportProfileVerified = false;

if (verifyStripe && runtimeStripeRemoteBoundaryReady) {
  try {
    const config = getResumeProStripeProductConfig();
    const stripe = new Stripe(runtimeStripeKey, {
      maxNetworkRetries: 2,
      timeout: 10_000,
      telemetry: false,
    });
    const price = await stripe.prices.retrieve(config.priceId, { expand: ["product"] });
    assertResumeProStripeProduct(price, config, isProduction);
    stripeProductVerified = true;
    console.log("PASS  Stripe 원격 상품·세금 계약 — Product ID, tax code, 포함세 가격 일치");

    if (preflight) {
      const sessions = await stripe.checkout.sessions.list({ status: "open", limit: 100 });
      zeroOpenCheckoutVerified = sessions.data.length === 0 && sessions.has_more === false;
      console.log(`${zeroOpenCheckoutVerified ? "PASS" : "WAIT"}  기존 open Checkout — 0건, 추가 페이지 없음`);
    }
  } catch {
    stripeProductVerified = false;
    zeroOpenCheckoutVerified = false;
    console.log("WAIT  Stripe 런타임 원격 사전감사 — 상품·open Session 읽기 권한 확인 필요");
  }

  if (stripeAuditRemoteBoundaryReady && stripeProductVerified) {
    try {
      const auditStripe = new Stripe(stripeAuditKey, {
        maxNetworkRetries: 2,
        timeout: 10_000,
        telemetry: false,
      });
      const account = await auditStripe.accounts.retrieveCurrent();
      const requirements = account.requirements;
      stripeAccountVerified = account.charges_enabled === true
        && account.payouts_enabled === true
        && account.details_submitted === true
        && requirements?.disabled_reason == null
        && (requirements?.currently_due?.length ?? 0) === 0
        && (requirements?.past_due?.length ?? 0) === 0;
      console.log(`${stripeAccountVerified ? "PASS" : "WAIT"}  Stripe 계정 운영 상태 — 결제·지급 활성, 제출 완료, 현재·연체 요구사항 없음`);

      const profile = account.business_profile;
      const accountSupportEmail = profile?.support_email?.trim().toLowerCase() ?? "";
      stripeSupportProfileVerified = Boolean(
        profile?.name?.trim()
        && profile.url?.trim()
        && profile.support_phone?.trim()
        && accountSupportEmail
        && accountSupportEmail === supportEmail.toLowerCase()
        && account.settings?.payments?.statement_descriptor?.trim()
      );
      console.log(`${stripeSupportProfileVerified ? "PASS" : "WAIT"}  Stripe 구매자 지원 프로필 — 사업명, 웹사이트, 전화, 지원 이메일 일치, 명세서 문구`);
    } catch {
      stripeAccountVerified = false;
      stripeSupportProfileVerified = false;
      console.log("WAIT  Stripe 계정 프로필 사전감사 — 전용 Account Read 제한 키 확인 필요");
    }
  } else {
    stripeAccountVerified = false;
    stripeSupportProfileVerified = false;
    console.log("WAIT  Stripe 계정 프로필 사전감사 — 검증된 런타임 상품과 분리된 같은 모드의 rk_ 감사 키 필요");
  }
} else if (verifyStripe) {
  console.log("WAIT  Stripe 런타임 원격 사전감사 — 로컬 키·상품·모드 경계 미통과, 원격 조회 생략");
  console.log("WAIT  Stripe 계정 프로필 사전감사 — 로컬 런타임 경계 미통과, 원격 조회 생략");
} else {
  console.log(`${preflight || strict ? "WAIT" : "INFO"}  Stripe 원격 사전감사 — --verify-stripe 필요`);
}

let databaseVerified = false;

if (verifyDatabase && databaseRemoteBoundaryReady) {
  try {
    const { neon } = await import("@neondatabase/serverless");
    const readOnlyOptions = {
      readOnly: true,
      isolationLevel: "RepeatableRead",
      fetchOptions: { signal: AbortSignal.timeout(10_000) },
    };
    const runtimeSql = neon(entitlementDatabaseUrl, readOnlyOptions);
    const auditSql = neon(auditDatabaseUrl, readOnlyOptions);
    const runtimeRows = await runtimeSql`
      select
        current_database() = 'neondb' as expected_database,
        current_user = 'hoju_app_runtime' as least_privilege_runtime_role,
        coalesce(has_function_privilege(
          current_user,
          to_regprocedure('public.claim_first_sale_reservation(text,text,timestamptz,text,text,integer)'),
          'EXECUTE'
        ), false) as runtime_can_claim_reservation,
        coalesce(has_function_privilege(
          current_user,
          to_regprocedure('public.attach_first_sale_checkout(text,bigint,text,text,timestamptz)'),
          'EXECUTE'
        ), false) as runtime_can_attach_checkout,
        coalesce(has_function_privilege(
          current_user,
          to_regprocedure('public.apply_first_sale_paid_event(text,text,boolean,timestamptz,text,text,integer,text,text,text,text,text)'),
          'EXECUTE'
        ), false) as runtime_can_apply_paid_event,
        coalesce(has_function_privilege(
          current_user,
          to_regprocedure('public.consume_checkout_activation(text,text,text,text,text,text,timestamptz)'),
          'EXECUTE'
        ), false) as runtime_can_activate_access,
        coalesce(has_function_privilege(
          current_user,
          to_regprocedure('public.consume_entitlement_restore_token(text,text,text,text,text,timestamptz)'),
          'EXECUTE'
        ), false) as runtime_can_restore_access,
        not coalesce(has_function_privilege(
          current_user,
          to_regprocedure('public.approve_next_first_sale(text,text,text,integer,text)'),
          'EXECUTE'
        ), false) as runtime_cannot_approve_next_sale,
        not coalesce(has_table_privilege(
          current_user,
          'public.first_sale_gates',
          'INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER'
        ), false) as runtime_cannot_mutate_gate_table,
        not coalesce(has_table_privilege(
          current_user,
          'public.purchase_entitlements',
          'INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER'
        ), false) as runtime_cannot_mutate_entitlement_table,
        not coalesce(has_table_privilege(
          current_user,
          'public.payment_operator_alert_outbox',
          'INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER'
        ), false) as runtime_cannot_mutate_alert_table
    `;
    const auditRows = await auditSql`
      with
      protected_tables(qualified_name) as (
        values
          ('public.payment_webhook_events'),
          ('public.purchase_entitlements'),
          ('public.purchase_restore_tokens'),
          ('public.purchase_checkout_activations'),
          ('public.purchase_access_sessions'),
          ('public.purchase_restore_activations'),
          ('public.entitlement_event_tombstones'),
          ('public.stripe_payment_object_links'),
          ('public.payment_operator_alert_outbox'),
          ('public.first_sale_gates'),
          ('public.first_sale_gate_events')
      ),
      mutation_privileges(privilege_name) as (
        values ('INSERT'), ('UPDATE'), ('DELETE'), ('TRUNCATE'), ('REFERENCES'), ('TRIGGER')
      ),
      blocked_functions(signature) as (
        values
          ('public.apply_entitlement_event(text,text,boolean,timestamptz,text,text,text,text,text,text,text)'),
          ('public.claim_first_sale_reservation(text,text,timestamptz,text,text,integer)'),
          ('public.attach_first_sale_checkout(text,bigint,text,text,timestamptz)'),
          ('public.release_failed_first_sale_reservation(text,bigint,text,text)'),
          ('public.release_verified_abandoned_first_sale(text,bigint,text)'),
          ('public.lock_first_sale_from_paid_event(text,text,text,boolean,timestamptz)'),
          ('public.apply_first_sale_paid_event(text,text,boolean,timestamptz,text,text,integer,text,text,text,text,text)'),
          ('public.apply_guarded_entitlement_event(text,text,boolean,timestamptz,text,text,text,text,text,text,text)'),
          ('public.consume_entitlement_restore_token(text,text,text,text,text,timestamptz)'),
          ('public.create_entitlement_restore_token(bigint,text,text,timestamptz)'),
          ('public.enqueue_payment_operator_alert_failure(text,text,boolean,text,text,text)'),
          ('public.claim_payment_operator_alert_intent(text,text,text)'),
          ('public.mark_payment_operator_alert_sent(text,text,text)'),
          ('public.release_payment_operator_alert_claim(text,text,text)'),
          ('public.consume_checkout_activation(text,text,text,text,text,text,timestamptz)'),
          ('public.release_purchase_access_session(bigint,text,text)'),
          ('public.find_active_purchase_entitlement_by_access_session(bigint,text,text)'),
          ('public.find_active_purchase_entitlement_by_checkout(text,text)'),
          ('public.find_active_purchase_entitlement_by_id(bigint,text)'),
          ('public.approve_next_first_sale(text,text,text,integer,text)'),
          ('public.prevent_first_sale_gate_event_mutation()'),
          ('public.prevent_entitlement_tombstone_mutation()'),
          ('public.record_payment_operator_alert_intent(text,text,boolean,text)'),
          ('public.payment_operator_alert_from_receipt()'),
          ('public.release_checkout_activation(bigint,text)')
      ),
      target_function as (
        select pg_get_functiondef(
          to_regprocedure(
            'public.apply_entitlement_event(text,text,boolean,timestamptz,text,text,text,text,text,text,text)'
          )
        ) as definition
      )
      select
        current_database() = 'neondb' as expected_database,
        current_user = 'hoju_payment_auditor' as least_privilege_audit_role,
        coalesce((
          select not rolsuper
            and not rolcreatedb
            and not rolcreaterole
            and not rolreplication
            and not rolbypassrls
            and not rolinherit
          from pg_roles
          where rolname = current_user
        ), false) as audit_role_has_safe_attributes,
        not pg_has_role(current_user, 'neon_superuser', 'MEMBER')
          and not pg_has_role(current_user, 'hoju_migration_owner', 'MEMBER')
          and not pg_has_role(current_user, 'hoju_app_runtime', 'MEMBER')
          and not pg_has_role(current_user, 'hoju_owner_operator', 'MEMBER')
          as audit_does_not_inherit_elevated_roles,
        coalesce(has_table_privilege(
          current_user,
          'public.schema_migrations',
          'SELECT'
        ), false) as audit_can_read_migration_ledger,
        coalesce(has_table_privilege(
          current_user,
          'public.first_sale_gates',
          'SELECT'
        ), false) as audit_can_read_first_sale_gate,
        not coalesce(has_schema_privilege(
          current_user,
          'public',
          'CREATE'
        ), false) as audit_cannot_create_in_public_schema,
        (
          select bool_and(
            to_regclass(table_name.qualified_name) is not null
            and not coalesce(has_table_privilege(
              current_user,
              to_regclass(table_name.qualified_name),
              privilege.privilege_name
            ), false)
          )
          from protected_tables table_name
          cross join mutation_privileges privilege
        ) as audit_has_no_protected_table_mutation,
        (
          select bool_and(
            to_regprocedure(blocked.signature) is not null
            and not coalesce(has_function_privilege(
              current_user,
              to_regprocedure(blocked.signature),
              'EXECUTE'
            ), false)
          )
          from blocked_functions blocked
        ) as audit_cannot_execute_payment_functions,
        (
          select count(distinct version) = 7
          from public.schema_migrations
          where version = any(array[
            '20260823_first_sale_gate_charge_link_v2',
            '20260823_payment_operator_alert_outbox_v1',
            '20260823_checkout_activation_nonce_v1',
            '20260823_purchase_access_sessions_v1',
            '20260823_restore_activation_nonce_v1',
            '20260823_payment_least_privilege_roles_v1',
            '20260824_entitlement_link_conflict_v1'
          ])
        ) as required_migrations_present,
        position(
          'on conflict on constraint stripe_payment_object_links_pkey do nothing'
          in lower((select definition from target_function))
        ) > 0 as named_entitlement_link_constraint_active,
        not exists (
          select 1 from public.first_sale_gates where state = 'RESERVED'
        ) as no_reservation_in_flight
      from target_function
    `;
    const results = [runtimeRows[0], auditRows[0]];
    databaseVerified = results.every((result) => Boolean(result)
      && Object.values(result).every((value) => value === true));
    console.log(`${databaseVerified ? "PASS" : "WAIT"}  Production DB 사전감사 — 필수 migration, runtime·audit 최소권한, 예약 없음`);
  } catch {
    databaseVerified = false;
    console.log("WAIT  Production DB 사전감사 — 연결, migration 또는 runtime 권한 확인 필요");
  }
} else if (verifyDatabase) {
  console.log("WAIT  Production DB 사전감사 — 승인 endpoint와 두 연결의 로컬 경계 미통과, 원격 조회 생략");
} else {
  console.log(`${preflight || strict ? "WAIT" : "INFO"}  Production DB 사전감사 — --verify-database 필요`);
}

const stripeRemoteVerified = stripeProductVerified
  && stripeAccountVerified
  && stripeSupportProfileVerified
  && zeroOpenCheckoutVerified;
const failClosedAudit = strict || preflight;
if (failClosedAudit && (pending > 0 || !verifyStripe || !verifyDatabase || !stripeRemoteVerified || !databaseVerified)) process.exitCode = 1;
