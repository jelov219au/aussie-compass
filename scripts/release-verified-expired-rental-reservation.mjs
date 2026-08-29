import { neon } from "@neondatabase/serverless";

const databaseUrl = process.env.PAYMENTS_RUNTIME_OPERATION_URL?.trim() ?? "";
const expectedCheckoutLast8 = process.env.PAYMENTS_EXPECTED_CHECKOUT_LAST8?.trim() ?? "";
const verifiedCheckoutSessionId = process.env.PAYMENTS_VERIFIED_EXPIRED_CHECKOUT_SESSION_ID?.trim() ?? "";
const verifiedGeneration = Number(process.env.PAYMENTS_VERIFIED_EXPIRED_GENERATION ?? "");
const fail = "RENTAL_EXPIRED_RESERVATION_RELEASE=FAIL product=rental_application_pro verified_expired_unpaid=no secrets_printed=no";

if (
  !/^postgres(?:ql)?:\/\//.test(databaseUrl)
  || !/^[A-Za-z0-9]{8}$/.test(expectedCheckoutLast8)
  || !/^cs_live_[A-Za-z0-9]+$/.test(verifiedCheckoutSessionId)
  || !verifiedCheckoutSessionId.endsWith(expectedCheckoutLast8)
  || !Number.isSafeInteger(verifiedGeneration)
  || verifiedGeneration < 1
) {
  console.log(fail);
  process.exit(1);
}

try {
  const sql = neon(databaseUrl, {
    fetchOptions: { signal: AbortSignal.timeout(15_000) },
  });
  const rows = await sql`
    select public.release_verified_abandoned_first_sale(
      'rental_application_pro',
      ${verifiedGeneration},
      ${verifiedCheckoutSessionId}
    ) as released
  `;
  const released = rows.length === 1 && rows[0]?.released === true;
  console.log(released
    ? "RENTAL_EXPIRED_RESERVATION_RELEASE=PASS product=rental_application_pro verified_expired_unpaid=yes gate=OPEN secrets_printed=no"
    : fail);
  if (!released) process.exitCode = 1;
} catch {
  console.log(fail);
  process.exitCode = 1;
} finally {
  delete process.env.PAYMENTS_RUNTIME_OPERATION_URL;
  delete process.env.PAYMENTS_EXPECTED_CHECKOUT_LAST8;
  delete process.env.PAYMENTS_VERIFIED_EXPIRED_CHECKOUT_SESSION_ID;
  delete process.env.PAYMENTS_VERIFIED_EXPIRED_GENERATION;
}
