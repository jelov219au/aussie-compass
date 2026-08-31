import "server-only";

import { cookies } from "next/headers";

import type { EntitlementRecord } from "@/lib/entitlements";
import { getConfiguredEntitlementStore } from "@/lib/neonEntitlementStore";
import {
  createLeavingAustraliaProRestoreCode,
  decodeLeavingAustraliaProAccessToken,
  deriveLeavingAustraliaProAccessSessionId,
  deriveLeavingAustraliaProRestoreSourceHash,
  encodeLeavingAustraliaProAccessToken,
  hashLeavingAustraliaProAccessSessionId,
  hashLeavingAustraliaProRestoreCode,
  hashLeavingAustraliaProRestoreNonce,
  leavingAustraliaProAccessLifetimeSeconds,
} from "@/lib/leavingAustraliaProTokens";

const accessCookieName = process.env.NODE_ENV === "production"
  ? "__Host-hoju_leaving_australia_pro_access"
  : "hoju_leaving_australia_pro_access";

function getSessionSecret() {
  const value = process.env.ENTITLEMENT_SESSION_SECRET?.trim();
  return value && value.length >= 32 ? value : null;
}
export function isLeavingAustraliaEntitlementSessionConfigured() {
  return Boolean(getSessionSecret());
}
export async function setLeavingAustraliaProAccessCookie(entitlement: EntitlementRecord, accessSessionId: string) {
  const secret = getSessionSecret();
  if (!secret) throw new Error("Leaving Australia Pack Pro access sessions are not configured.");
  const cookieStore = await cookies();
  cookieStore.set(accessCookieName, encodeLeavingAustraliaProAccessToken(entitlement, accessSessionId, secret), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: leavingAustraliaProAccessLifetimeSeconds,
    priority: "high",
  });
}

export async function clearLeavingAustraliaProAccessCookie() {
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

export async function getLeavingAustraliaProAccessPayload() {
  const cookieStore = await cookies();
  return decodeLeavingAustraliaProAccessToken(cookieStore.get(accessCookieName)?.value, getSessionSecret());
}

export async function getActiveLeavingAustraliaProEntitlement() {
  const store = getConfiguredEntitlementStore();
  if (!store) return null;
  const payload = await getLeavingAustraliaProAccessPayload();
  if (!payload) return null;
  return store.findActiveByAccessSession({
    entitlementId: payload.entitlementId,
    productCode: "leaving_australia_pro",
    accessSessionHash: hashLeavingAustraliaProAccessSessionId(payload.accessSessionId),
  });
}

export function createLeavingAustraliaAccessSession(source: "activation" | "restore", sourceHash: string) {
  const secret = getSessionSecret();
  if (!secret) throw new Error("Leaving Australia Pack Pro access sessions are not configured.");
  const accessSessionId = deriveLeavingAustraliaProAccessSessionId(source, sourceHash, secret);
  return {
    accessSessionId,
    accessSessionHash: hashLeavingAustraliaProAccessSessionId(accessSessionId),
    accessSessionRefLast8: accessSessionId.slice(-8),
    expiresAt: new Date(Date.now() + leavingAustraliaProAccessLifetimeSeconds * 1000),
  };
}

export function hashLeavingAustraliaAccessSessionId(accessSessionId: string) {
  return hashLeavingAustraliaProAccessSessionId(accessSessionId);
}

export function createLeavingAustraliaRestoreCode() {
  return createLeavingAustraliaProRestoreCode();
}

export function hashLeavingAustraliaRestoreCode(token: string) {
  return hashLeavingAustraliaProRestoreCode(token);
}

export function createLeavingAustraliaRestoreAccessSession(tokenHash: string, nonce: string) {
  const nonceHash = hashLeavingAustraliaProRestoreNonce(nonce);
  const sourceHash = deriveLeavingAustraliaProRestoreSourceHash(tokenHash, nonceHash);
  return { nonceHash, accessSession: createLeavingAustraliaAccessSession("restore", sourceHash) };
}
