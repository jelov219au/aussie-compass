import "server-only";

import { cookies } from "next/headers";
import type { EntitlementRecord } from "@/lib/entitlements";
import { getConfiguredEntitlementStore } from "@/lib/neonEntitlementStore";
import { createRentalProRestoreCode, decodeRentalProAccessToken, encodeRentalProAccessToken, hashRentalProRestoreCode, rentalProAccessLifetimeSeconds } from "@/lib/rentalProTokens";

const accessCookieName = process.env.NODE_ENV === "production" ? "__Host-hoju_rental_application_pro_access" : "hoju_rental_application_pro_access";
function getSessionSecret() {
  const value = process.env.ENTITLEMENT_SESSION_SECRET?.trim();
  return value && value.length >= 32 ? value : null;
}

export function isRentalEntitlementSessionConfigured() {
  return Boolean(getSessionSecret());
}

function encodeAccessToken(entitlement: EntitlementRecord) {
  const secret = getSessionSecret();
  if (!secret) throw new Error("Rental Pro access sessions are not configured.");
  return encodeRentalProAccessToken(entitlement, secret);
}

export async function setRentalProAccessCookie(entitlement: EntitlementRecord) {
  const cookieStore = await cookies();
  cookieStore.set(accessCookieName, encodeAccessToken(entitlement), { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict", path: "/", maxAge: rentalProAccessLifetimeSeconds, priority: "high" });
}

export async function clearRentalProAccessCookie() {
  const cookieStore = await cookies();
  cookieStore.set(accessCookieName, "", { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict", path: "/", maxAge: 0, expires: new Date(0), priority: "high" });
}

export async function getActiveRentalProEntitlement() {
  const store = getConfiguredEntitlementStore();
  if (!store) return null;
  const cookieStore = await cookies();
  const payload = decodeRentalProAccessToken(cookieStore.get(accessCookieName)?.value, getSessionSecret());
  if (!payload) return null;
  return store.findActiveById(payload.entitlementId, "rental_application_pro");
}

export function createRentalRestoreCode() { return createRentalProRestoreCode(); }
export function hashRentalRestoreCode(token: string) { return hashRentalProRestoreCode(token); }
