import "server-only";

import { cookies } from "next/headers";

import type { EntitlementRecord } from "@/lib/entitlements";
import { getConfiguredEntitlementStore } from "@/lib/neonEntitlementStore";
import {
  createEofyProRestoreCode,
  decodeEofyProAccessToken,
  deriveEofyProAccessSessionId,
  deriveEofyProRestoreSourceHash,
  encodeEofyProAccessToken,
  hashEofyProAccessSessionId,
  hashEofyProRestoreCode,
  hashEofyProRestoreNonce,
  eofyProAccessLifetimeSeconds,
} from "@/lib/eofyProTokens";

const accessCookieName = process.env.NODE_ENV === "production"
  ? "__Host-hoju_eofy_pro_access"
  : "hoju_eofy_pro_access";

function getSessionSecret() {
  const value = process.env.ENTITLEMENT_SESSION_SECRET?.trim();
  return value && value.length >= 32 ? value : null;
}
export function isEofyEntitlementSessionConfigured() {
  return Boolean(getSessionSecret());
}

export async function setEofyProAccessCookie(entitlement: EntitlementRecord, accessSessionId: string) {
  const secret = getSessionSecret();
  if (!secret) throw new Error("EOFY Pack Pro access sessions are not configured.");
  const cookieStore = await cookies();
  cookieStore.set(accessCookieName, encodeEofyProAccessToken(entitlement, accessSessionId, secret), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: eofyProAccessLifetimeSeconds,
    priority: "high",
  });
}

export async function clearEofyProAccessCookie() {
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

export async function getEofyProAccessPayload() {
  const cookieStore = await cookies();
  return decodeEofyProAccessToken(cookieStore.get(accessCookieName)?.value, getSessionSecret());
}

export async function getActiveEofyProEntitlement() {
  const store = getConfiguredEntitlementStore();
  if (!store) return null;
  const payload = await getEofyProAccessPayload();
  if (!payload) return null;
  return store.findActiveByAccessSession({
    entitlementId: payload.entitlementId,
    productCode: "eofy_pro",
    accessSessionHash: hashEofyProAccessSessionId(payload.accessSessionId),
  });
}

export function createEofyAccessSession(source: "activation" | "restore", sourceHash: string) {
  const secret = getSessionSecret();
  if (!secret) throw new Error("EOFY Pack Pro access sessions are not configured.");
  const accessSessionId = deriveEofyProAccessSessionId(source, sourceHash, secret);
  return {
    accessSessionId,
    accessSessionHash: hashEofyProAccessSessionId(accessSessionId),
    accessSessionRefLast8: accessSessionId.slice(-8),
    expiresAt: new Date(Date.now() + eofyProAccessLifetimeSeconds * 1000),
  };
}

export function hashEofyAccessSessionId(accessSessionId: string) {
  return hashEofyProAccessSessionId(accessSessionId);
}

export function createEofyRestoreCode() {
  return createEofyProRestoreCode();
}

export function hashEofyRestoreCode(token: string) {
  return hashEofyProRestoreCode(token);
}

export function createEofyRestoreAccessSession(tokenHash: string, nonce: string) {
  const nonceHash = hashEofyProRestoreNonce(nonce);
  const sourceHash = deriveEofyProRestoreSourceHash(tokenHash, nonceHash);
  return { nonceHash, accessSession: createEofyAccessSession("restore", sourceHash) };
}
