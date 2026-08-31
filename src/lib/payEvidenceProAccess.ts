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
