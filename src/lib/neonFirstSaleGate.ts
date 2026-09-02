import "server-only";

import { neon } from "@neondatabase/serverless";

import payEvidenceAccessFunctions from "@/data/pay-evidence-access-functions.json";
import payEvidenceAlertFunction from "@/data/pay-evidence-alert-function.json";
import { getEntitlementDatabaseUrl } from "@/lib/entitlementConfig";
import type { FirstSaleClaimResult, FirstSaleGateStore } from "@/lib/firstSaleGate";

type ClaimRow = {
  outcome: FirstSaleClaimResult["outcome"];
  generation: number | string | null;
  stripe_checkout_session_id: string | null;
};

function getConnectionString() {
  const value = getEntitlementDatabaseUrl();

  if (!value || (!value.startsWith("postgres://") && !value.startsWith("postgresql://"))) {
    throw new Error("The first-sale gate database is not configured.");
  }

  return value;
}

export async function isPaymentRuntimeSchemaReady(requiredProductCode: "rental_application_pro" | "pay_evidence_pro" | "eofy_pro" | "leaving_australia_pro" = "rental_application_pro") {
  try {
    const sql = neon(getConnectionString(), {
      readOnly: true,
      fetchOptions: { signal: AbortSignal.timeout(5_000) },
    });
    const rows = await sql`
      with required_runtime_functions(signature) as (
        values
          ('public.claim_first_sale_reservation(text,text,timestamptz,text,text,integer)'),
          ('public.attach_first_sale_checkout(text,bigint,text,text,timestamptz)'),
          ('public.release_failed_first_sale_reservation(text,bigint,text,text)'),
          ('public.release_verified_abandoned_first_sale(text,bigint,text)'),
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
          ('public.find_active_purchase_entitlement_by_id(bigint,text)')
      )
      select
        coalesce((
          select bool_and(
            to_regprocedure(signature) is not null
            and coalesce(has_function_privilege(current_user, to_regprocedure(signature), 'EXECUTE'), false)
          )
          from required_runtime_functions
        ), false)
        and to_regclass('public.payment_operator_alert_outbox') is not null
        and to_regprocedure('public.payment_operator_alert_from_receipt()') is not null
        and exists (
          select 1 from pg_constraint
          where conrelid = 'public.first_sale_gates'::regclass
            and contype = 'c'
            and position('rental_application_pro' in pg_get_constraintdef(oid)) > 0
        )
        and exists (
          select 1 from pg_constraint
          where conrelid = 'public.first_sale_gate_events'::regclass
            and contype = 'c'
            and position('rental_application_pro' in pg_get_constraintdef(oid)) > 0
        )
        and coalesce(position(
          'on conflict on constraint stripe_payment_object_links_pkey do nothing'
          in lower(pg_get_functiondef(to_regprocedure(
            'public.apply_entitlement_event(text,text,boolean,timestamptz,text,text,text,text,text,text,text)'
          )))
        ) > 0, false) as ready
    ` as { ready: boolean }[];
    if (rows[0]?.ready !== true) return false;
    if (requiredProductCode === "rental_application_pro") return true;

    const productRows = await sql`
      select
        exists (
          select 1 from pg_constraint
          where conrelid = 'public.first_sale_gates'::regclass
            and contype = 'c'
            and position(${requiredProductCode} in pg_get_constraintdef(oid)) > 0
        )
        and exists (
          select 1 from pg_constraint
          where conrelid = 'public.first_sale_gate_events'::regclass
            and contype = 'c'
            and position(${requiredProductCode} in pg_get_constraintdef(oid)) > 0
        )
        and position(
          ${requiredProductCode}
          in pg_get_functiondef(to_regprocedure(
            'public.apply_first_sale_paid_event(text,text,boolean,timestamptz,text,text,integer,text,text,text,text,text)'
          ))
        ) > 0 as ready
    ` as { ready: boolean }[];
    if (productRows[0]?.ready !== true) return false;
    if (requiredProductCode !== "pay_evidence_pro") return true;

    // A legacy overload or a product name in a comment is not sufficient.
    // Check every current access body and the alert reset by the legacy migration.
    const accessRows = await sql`
      select count(*) = 6 and coalesce(bool_and(
        p.oid is not null
        and md5(replace(p.prosrc, chr(13) || chr(10), chr(10))) = expected."afterHash"
        and p.prosecdef
        and p.proowner = to_regrole('hoju_migration_owner')
        and coalesce(p.proconfig @> array['search_path=public, pg_temp'], false)
        and coalesce(has_function_privilege(current_user, p.oid, 'EXECUTE'), false)
        and not exists (
          select 1 from aclexplode(coalesce(p.proacl, acldefault('f', p.proowner)))
          where grantee = 0 and privilege_type = 'EXECUTE'
        )
      ), false) as ready
      from jsonb_to_recordset(${JSON.stringify([...payEvidenceAccessFunctions, payEvidenceAlertFunction])}::jsonb)
        as expected(signature text, "afterHash" text)
      left join pg_proc p on p.oid = to_regprocedure(expected.signature)
    ` as { ready: boolean }[];
    return accessRows[0]?.ready === true;
  } catch {
    return false;
  }
}

async function claimReservation(
  input: Parameters<FirstSaleGateStore["claimReservation"]>[0],
): Promise<FirstSaleClaimResult> {
  const sql = neon(getConnectionString());
  const rows = await sql`
    select * from claim_first_sale_reservation(
      ${input.productCode},
      ${input.claimTokenHash},
      ${input.expiresAt.toISOString()},
      ${input.environment},
      ${input.currency},
      ${input.amountCents}
    )
  ` as ClaimRow[];
  const row = rows[0];

  if (!row) throw new Error("The first-sale gate returned no claim result.");

  if (row.outcome === "claimed") {
    return {
      outcome: "claimed",
      generation: Number(row.generation),
      claimTokenHash: input.claimTokenHash,
      idempotencyKey: `${input.productCode}_first_sale_${input.claimTokenHash}`,
      expiresAt: input.expiresAt,
    };
  }

  if (row.outcome === "verify_expiry" && row.stripe_checkout_session_id) {
    return {
      outcome: "verify_expiry",
      generation: Number(row.generation),
      checkoutSessionId: row.stripe_checkout_session_id,
    };
  }

  if (row.outcome === "reserved" || row.outcome === "locked" || row.outcome === "manual_review") {
    return { outcome: row.outcome };
  }

  throw new Error("The first-sale gate returned an invalid claim result.");
}

async function attachCheckoutSession(
  input: Parameters<FirstSaleGateStore["attachCheckoutSession"]>[0],
) {
  const sql = neon(getConnectionString());
  const rows = await sql`
    select attach_first_sale_checkout(
      ${input.productCode},
      ${input.generation},
      ${input.claimTokenHash},
      ${input.checkoutSessionId},
      ${input.expiresAt.toISOString()}
    ) as attached
  ` as { attached: boolean }[];
  return rows[0]?.attached === true;
}

async function releaseFailedReservation(
  input: Parameters<FirstSaleGateStore["releaseFailedReservation"]>[0],
) {
  const sql = neon(getConnectionString());
  const rows = await sql`
    select release_failed_first_sale_reservation(
      ${input.productCode},
      ${input.generation},
      ${input.claimTokenHash},
      ${input.reason}
    ) as released
  ` as { released: boolean }[];
  return rows[0]?.released === true;
}

async function releaseVerifiedAbandoned(
  input: Parameters<FirstSaleGateStore["releaseVerifiedAbandoned"]>[0],
) {
  const sql = neon(getConnectionString());
  const rows = await sql`
    select release_verified_abandoned_first_sale(
      ${input.productCode},
      ${input.generation},
      ${input.checkoutSessionId}
    ) as released
  ` as { released: boolean }[];
  return rows[0]?.released === true;
}

async function applyPaidEventAndEntitlement(
  input: Parameters<FirstSaleGateStore["applyPaidEventAndEntitlement"]>[0],
) {
  const sql = neon(getConnectionString());
  const { receipt, command } = input;
  const rows = await sql`
    select apply_first_sale_paid_event(
      ${receipt.eventId},
      ${receipt.eventType},
      ${receipt.livemode},
      ${receipt.createdAt.toISOString()},
      ${command.productCode},
      ${command.currency},
      ${command.amountTotal},
      ${command.checkoutSessionId},
      ${command.paymentIntentId},
      ${command.chargeId},
      ${command.customerId},
      ${command.reason}
    ) as outcome
  ` as { outcome: "processed" | "duplicate" | "ignored_stale" }[];
  const outcome = rows[0]?.outcome;

  if (outcome !== "processed" && outcome !== "duplicate" && outcome !== "ignored_stale") {
    throw new Error("The first-sale paid transaction returned an invalid result.");
  }

  return { outcome };
}

export const neonFirstSaleGate: FirstSaleGateStore = {
  claimReservation,
  attachCheckoutSession,
  releaseFailedReservation,
  releaseVerifiedAbandoned,
  applyPaidEventAndEntitlement,
};

export function getConfiguredFirstSaleGate() {
  const databaseUrl = getEntitlementDatabaseUrl();
  return process.env.FIRST_SALE_GATE_ENABLED === "true"
    && process.env.PAYMENTS_ENTITLEMENT_STORE === "neon"
    && Boolean(databaseUrl?.match(/^postgres(?:ql)?:\/\//))
    ? neonFirstSaleGate
    : null;
}
