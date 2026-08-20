import { NextRequest, NextResponse } from "next/server";
import { getConfiguredEntitlementStore } from "@/lib/neonEntitlementStore";
import { createRentalRestoreCode, getActiveRentalProEntitlement } from "@/lib/rentalProAccess";
import { validateSameOriginMutation } from "@/lib/requestSecurity";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const check = validateSameOriginMutation(request, { maxBodyBytes: 1024 });
  if (!check.ok) return NextResponse.json({ error: check.error }, { status: check.status, headers: { "Cache-Control": "no-store" } });
  const entitlement = await getActiveRentalProEntitlement();
  const store = getConfiguredEntitlementStore();
  if (!entitlement || !store) return NextResponse.json({ error: "Active Rental Pro access is required." }, { status: 401, headers: { "Cache-Control": "no-store" } });
  const restore = createRentalRestoreCode();
  await store.createRestoreTokenHash({ entitlementId: entitlement.id, productCode: "rental_application_pro", tokenHash: restore.tokenHash, expiresAt: restore.expiresAt });
  return NextResponse.json({ code: restore.token, expiresAt: restore.expiresAt.toISOString() }, { headers: { "Cache-Control": "no-store" } });
}
