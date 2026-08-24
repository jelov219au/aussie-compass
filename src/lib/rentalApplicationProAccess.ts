import "server-only";

import { cookies } from "next/headers";

import type { EntitlementRecord } from "@/lib/entitlements";
import { getConfiguredEntitlementStore } from "@/lib/neonEntitlementStore";
import {
  createRentalApplicationProRestoreCode,
  decodeRentalApplicationProAccessToken,
  deriveRentalApplicationProAccessSessionId,
  deriveRentalApplicationProRestoreSourceHash,
  encodeRentalApplicationProAccessToken,
  hashRentalApplicationProAccessSessionId,
  hashRentalApplicationProRestoreCode,
  hashRentalApplicationProRestoreNonce,
  rentalApplicationProAccessLifetimeSeconds,
} from "@/lib/rentalApplicationProTokens";

const accessCookieName = process.env.NODE_ENV === "production"
  ? "__Host-hoju_rental_application_pro_access"
  : "hoju_rental_application_pro_access";

function getSessionSecret() {
  const value = process.env.ENTITLEMENT_SESSION_SECRET?.trim();
  return value && value.length >= 32 ? value : null;
}

export function isRentalApplicationEntitlementSessionConfigured() {
  return Boolean(getSessionSecret());
}

export async function setRentalApplicationProAccessCookie(entitlement: EntitlementRecord, accessSessionId: string) {
  const secret = getSessionSecret();
  if (!secret) throw new Error("Rental Application Pack Pro access sessions are not configured.");
  const cookieStore = await cookies();
  cookieStore.set(accessCookieName, encodeRentalApplicationProAccessToken(entitlement, accessSessionId, secret), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: rentalApplicationProAccessLifetimeSeconds,
    priority: "high",
  });
}

export async function clearRentalApplicationProAccessCookie() {
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

export async function getRentalApplicationProAccessPayload() {
  const cookieStore = await cookies();
  return decodeRentalApplicationProAccessToken(cookieStore.get(accessCookieName)?.value, getSessionSecret());
}

export async function getActiveRentalApplicationProEntitlement() {
  const store = getConfiguredEntitlementStore();
  if (!store) return null;

  const payload = await getRentalApplicationProAccessPayload();
  if (!payload) return null;
  return store.findActiveByAccessSession({
    entitlementId: payload.entitlementId,
    productCode: "rental_application_pro",
    accessSessionHash: hashRentalApplicationProAccessSessionId(payload.accessSessionId),
  });
}

export function createRentalApplicationAccessSession(source: "activation" | "restore", sourceHash: string) {
  const secret = getSessionSecret();
  if (!secret) throw new Error("Rental Application Pack Pro access sessions are not configured.");
  const accessSessionId = deriveRentalApplicationProAccessSessionId(source, sourceHash, secret);
  return {
    accessSessionId,
    accessSessionHash: hashRentalApplicationProAccessSessionId(accessSessionId),
    accessSessionRefLast8: accessSessionId.slice(-8),
    expiresAt: new Date(Date.now() + rentalApplicationProAccessLifetimeSeconds * 1000),
  };
}

export function hashRentalApplicationAccessSessionId(accessSessionId: string) {
  return hashRentalApplicationProAccessSessionId(accessSessionId);
}

export function createRentalApplicationRestoreCode() {
  return createRentalApplicationProRestoreCode();
}

export function hashRentalApplicationRestoreCode(token: string) {
  return hashRentalApplicationProRestoreCode(token);
}

export function createRentalApplicationRestoreAccessSession(tokenHash: string, nonce: string) {
  const nonceHash = hashRentalApplicationProRestoreNonce(nonce);
  const sourceHash = deriveRentalApplicationProRestoreSourceHash(tokenHash, nonceHash);
  return { nonceHash, accessSession: createRentalApplicationAccessSession("restore", sourceHash) };
}
