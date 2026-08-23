import "server-only";

import { cookies } from "next/headers";

import type { EntitlementRecord } from "@/lib/entitlements";
import { getConfiguredEntitlementStore } from "@/lib/neonEntitlementStore";
import {
  createRentalApplicationProRestoreCode,
  decodeRentalApplicationProAccessToken,
  encodeRentalApplicationProAccessToken,
  hashRentalApplicationProRestoreCode,
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

export async function setRentalApplicationProAccessCookie(entitlement: EntitlementRecord) {
  const secret = getSessionSecret();
  if (!secret) throw new Error("Rental Application Pack Pro access sessions are not configured.");
  const cookieStore = await cookies();
  cookieStore.set(accessCookieName, encodeRentalApplicationProAccessToken(entitlement, secret), {
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

export async function getActiveRentalApplicationProEntitlement() {
  const store = getConfiguredEntitlementStore();
  if (!store) return null;

  const cookieStore = await cookies();
  const payload = decodeRentalApplicationProAccessToken(cookieStore.get(accessCookieName)?.value, getSessionSecret());
  if (!payload) return null;
  return store.findActiveById(payload.entitlementId, "rental_application_pro");
}

export function createRentalApplicationRestoreCode() {
  return createRentalApplicationProRestoreCode();
}

export function hashRentalApplicationRestoreCode(token: string) {
  return hashRentalApplicationProRestoreCode(token);
}
