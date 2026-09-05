import "server-only";

import { cookies } from "next/headers";

import type { EntitlementRecord } from "@/lib/entitlements";
import { getConfiguredEntitlementStore } from "@/lib/neonEntitlementStore";
import {
  createPayEvidenceProRestoreCode,
  decodePayEvidenceProAccessToken,
  derivePayEvidenceProAccessSessionId,
  derivePayEvidenceProRestoreSourceHash,
  encodePayEvidenceProAccessToken,
  hashPayEvidenceProAccessSessionId,
  hashPayEvidenceProRestoreCode,
  hashPayEvidenceProRestoreNonce,
  payEvidenceProAccessLifetimeSeconds,
} from "@/lib/payEvidenceProTokens";

const accessCookieName = process.env.NODE_ENV === "production"
  ? "__Host-hoju_pay_evidence_pro_access"
  : "hoju_pay_evidence_pro_access";

function getSessionSecret() {
  const value = process.env.ENTITLEMENT_SESSION_SECRET?.trim();
  return value && value.length >= 32 ? value : null;
}

export function isPayEvidenceEntitlementSessionConfigured() {
  return Boolean(getSessionSecret());
}

export async function setPayEvidenceProAccessCookie(entitlement: EntitlementRecord, accessSessionId: string) {
  const secret = getSessionSecret();
  if (!secret) throw new Error("Pay Evidence Pack Pro access sessions are not configured.");
  const cookieStore = await cookies();
  cookieStore.set(accessCookieName, encodePayEvidenceProAccessToken(entitlement, accessSessionId, secret), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: payEvidenceProAccessLifetimeSeconds,
    priority: "high",
  });
}

export async function clearPayEvidenceProAccessCookie() {
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

export async function getPayEvidenceProAccessPayload() {
  const cookieStore = await cookies();
  return decodePayEvidenceProAccessToken(cookieStore.get(accessCookieName)?.value, getSessionSecret());
}

export async function getActivePayEvidenceProEntitlement() {
  const store = getConfiguredEntitlementStore();
  if (!store) return null;
  const payload = await getPayEvidenceProAccessPayload();
  if (!payload) return null;
  return store.findActiveByAccessSession({
    entitlementId: payload.entitlementId,
    productCode: "pay_evidence_pro",
    accessSessionHash: hashPayEvidenceProAccessSessionId(payload.accessSessionId),
  });
}

// A missing cookie and an unverifiable existing cookie are different checkout
// states. Only a definite absence may proceed to a new payment reservation.
export async function getPayEvidenceProCheckoutAccess(cookieHeader: string | null): Promise<"none" | "active" | "unknown"> {
  try {
    const values = (await cookies()).getAll(accessCookieName);
    // RequestCookies may collapse duplicate names, so also check the raw header.
    const rawCount = (cookieHeader ?? "").split(";")
      .filter(part => part.split("=", 1)[0].trim() === accessCookieName).length;
    if (rawCount !== values.length || rawCount > 1) return "unknown";
    if (values.length === 0) return "none";
    if (values.length !== 1) return "unknown";
    const payload = decodePayEvidenceProAccessToken(values[0]?.value, getSessionSecret());
    if (!payload || !/^[1-9]\d{0,18}$/.test(payload.entitlementId)
      || BigInt(payload.entitlementId) > BigInt("9223372036854775807")) return "unknown";
    const store = getConfiguredEntitlementStore();
    if (!store) return "unknown";
    const entitlement = await store.findActiveByAccessSession({
      entitlementId: payload.entitlementId, productCode: "pay_evidence_pro",
      accessSessionHash: hashPayEvidenceProAccessSessionId(payload.accessSessionId),
    });
    if (entitlement === null) return "none";
    return entitlement?.id === payload.entitlementId && entitlement.productCode === "pay_evidence_pro"
      && entitlement.status === "active" ? "active" : "unknown";
  } catch { return "unknown"; }
}

export function createPayEvidenceAccessSession(source: "activation" | "restore", sourceHash: string) {
  const secret = getSessionSecret();
  if (!secret) throw new Error("Pay Evidence Pack Pro access sessions are not configured.");
  const accessSessionId = derivePayEvidenceProAccessSessionId(source, sourceHash, secret);
  return {
    accessSessionId,
    accessSessionHash: hashPayEvidenceProAccessSessionId(accessSessionId),
    accessSessionRefLast8: accessSessionId.slice(-8),
    expiresAt: new Date(Date.now() + payEvidenceProAccessLifetimeSeconds * 1000),
  };
}

export function hashPayEvidenceAccessSessionId(accessSessionId: string) {
  return hashPayEvidenceProAccessSessionId(accessSessionId);
}

export function createPayEvidenceRestoreCode() {
  return createPayEvidenceProRestoreCode();
}

export function hashPayEvidenceRestoreCode(token: string) {
  return hashPayEvidenceProRestoreCode(token);
}

export function createPayEvidenceRestoreAccessSession(tokenHash: string, nonce: string) {
  const nonceHash = hashPayEvidenceProRestoreNonce(nonce);
  const sourceHash = derivePayEvidenceProRestoreSourceHash(tokenHash, nonceHash);
  return { nonceHash, accessSession: createPayEvidenceAccessSession("restore", sourceHash) };
}
