import "server-only";

import { neon } from "@neondatabase/serverless";
import { NextResponse } from "next/server";

import { getEntitlementDatabaseUrl } from "@/lib/entitlementConfig";

export const runtime = "nodejs";

const STAGE_TWO_BRANCH = "codex/stage2-resume-payment-sandbox";

type SchemaCheckRow = {
  schema_migrations: boolean;
  first_sale_gates: boolean;
  first_sale_gate_events: boolean;
  claim_function: boolean;
  claim_executable: boolean;
  attach_function: boolean;
  attach_executable: boolean;
  release_failed_function: boolean;
  release_failed_executable: boolean;
  release_abandoned_function: boolean;
  release_abandoned_executable: boolean;
  paid_event_function: boolean;
  paid_event_executable: boolean;
};

function unavailable(status = 404) {
  return NextResponse.json({ available: false }, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
}

function classifyDatabaseError(error: unknown) {
  const code = typeof error === "object" && error !== null && "code" in error
    ? String(error.code)
    : "";

  if (code === "42P01") return "missing_table";
  if (code === "42883") return "missing_function";
  if (code === "42501") return "insufficient_privilege";
  return "database_request_failed";
}

export async function GET() {
  if (
    process.env.VERCEL_ENV !== "preview"
    || process.env.VERCEL_GIT_COMMIT_REF !== STAGE_TWO_BRANCH
    || process.env.FIRST_SALE_GATE_ENABLED !== "true"
    || process.env.PAYMENTS_ENTITLEMENT_STORE !== "neon"
  ) {
    return unavailable();
  }

  const connectionString = getEntitlementDatabaseUrl();
  if (
    !connectionString
    || (!connectionString.startsWith("postgres://") && !connectionString.startsWith("postgresql://"))
  ) {
    return unavailable(503);
  }

  try {
    const sql = neon(connectionString);
    const rows = await sql`
      select
        to_regclass('public.schema_migrations') is not null as schema_migrations,
        to_regclass('public.first_sale_gates') is not null as first_sale_gates,
        to_regclass('public.first_sale_gate_events') is not null as first_sale_gate_events,
        to_regprocedure('public.claim_first_sale_reservation(text,text,timestamptz,text,text,integer)') is not null as claim_function,
        coalesce(has_function_privilege(current_user, to_regprocedure('public.claim_first_sale_reservation(text,text,timestamptz,text,text,integer)'), 'EXECUTE'), false) as claim_executable,
        to_regprocedure('public.attach_first_sale_checkout(text,bigint,text,text,timestamptz)') is not null as attach_function,
        coalesce(has_function_privilege(current_user, to_regprocedure('public.attach_first_sale_checkout(text,bigint,text,text,timestamptz)'), 'EXECUTE'), false) as attach_executable,
        to_regprocedure('public.release_failed_first_sale_reservation(text,bigint,text,text)') is not null as release_failed_function,
        coalesce(has_function_privilege(current_user, to_regprocedure('public.release_failed_first_sale_reservation(text,bigint,text,text)'), 'EXECUTE'), false) as release_failed_executable,
        to_regprocedure('public.release_verified_abandoned_first_sale(text,bigint,text)') is not null as release_abandoned_function,
        coalesce(has_function_privilege(current_user, to_regprocedure('public.release_verified_abandoned_first_sale(text,bigint,text)'), 'EXECUTE'), false) as release_abandoned_executable,
        to_regprocedure('public.apply_first_sale_paid_event(text,text,boolean,timestamptz,text,text,integer,text,text,text,text,text)') is not null as paid_event_function,
        coalesce(has_function_privilege(current_user, to_regprocedure('public.apply_first_sale_paid_event(text,text,boolean,timestamptz,text,text,integer,text,text,text,text,text)'), 'EXECUTE'), false) as paid_event_executable
    ` as SchemaCheckRow[];
    const checks = rows[0];

    if (!checks) {
      return NextResponse.json({ available: true, ready: false, category: "empty_result" }, {
        status: 503,
        headers: {
          "Cache-Control": "no-store",
          "X-Robots-Tag": "noindex, nofollow",
        },
      });
    }

    return NextResponse.json({
      available: true,
      ready: Object.values(checks).every(Boolean),
      checks,
    }, {
      headers: {
        "Cache-Control": "no-store",
        "X-Robots-Tag": "noindex, nofollow",
      },
    });
  } catch (error) {
    return NextResponse.json({
      available: true,
      ready: false,
      category: classifyDatabaseError(error),
    }, {
      status: 503,
      headers: {
        "Cache-Control": "no-store",
        "X-Robots-Tag": "noindex, nofollow",
      },
    });
  }
}
