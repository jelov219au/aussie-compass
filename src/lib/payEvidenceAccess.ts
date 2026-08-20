import "server-only";

import { cookies } from "next/headers";
import type { EntitlementRecord } from "@/lib/entitlements";
import { getConfiguredEntitlementStore } from "@/lib/neonEntitlementStore";
import {
  createPayEvidenceRestoreCode,
  decodePayEvidenceAccessToken,
  encodePayEvidenceAccessToken,
  hashPayEvidenceRestoreCode,
  payEvidenceAccessLifetimeSeconds,
} from "@/lib/payEvidenceTokens";

const accessCookieName = process.env.NODE_ENV === "production"
  ? "__Host-hoju_pay_evidence_access"
  : "hoju_pay_evidence_access";

function getSessionSecret() {
  const value = process.env.ENTITLEMENT_SESSION_SECRET?.trim();
  return value && value.length >= 32 ? value : null;
}

export async function setPayEvidenceAccessCookie(entitlement: EntitlementRecord) {
  const secret = getSessionSecret();
  if (!secret) throw new Error("Pay Evidence Pro access sessions are not configured.");
  const cookieStore = await cookies();
  cookieStore.set(accessCookieName, encodePayEvidenceAccessToken(entitlement, secret), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: payEvidenceAccessLifetimeSeconds,
    priority: "high",
  });
}

export async function clearPayEvidenceAccessCookie() {
  const cookieStore = await cookies();
  cookieStore.set(accessCookieName, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 0,
    expires: new Date(0),
    priority: "high",
  });
}

export async function getActivePayEvidenceEntitlement() {
  const store = getConfiguredEntitlementStore();
  if (!store) return null;
  const cookieStore = await cookies();
  const payload = decodePayEvidenceAccessToken(cookieStore.get(accessCookieName)?.value, getSessionSecret());
  if (!payload) return null;
  return store.findActiveById(payload.entitlementId, "pay_evidence_pro");
}

export const createPayEvidenceRestore = createPayEvidenceRestoreCode;
export const hashPayEvidenceRestore = hashPayEvidenceRestoreCode;
