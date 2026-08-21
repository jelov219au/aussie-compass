import "server-only";

import { cookies } from "next/headers";
import type { EntitlementRecord } from "@/lib/entitlements";
import { getConfiguredEntitlementStore } from "@/lib/neonEntitlementStore";
import {
  createEofyProRestoreCode,
  decodeEofyProAccessToken,
  encodeEofyProAccessToken,
  eofyProAccessLifetimeSeconds,
  hashEofyProRestoreCode,
} from "@/lib/eofyProTokens";

const accessCookieName = process.env.NODE_ENV === "production"
  ? "__Host-hoju_eofy_pro_access"
  : "hoju_eofy_pro_access";

function getSessionSecret() {
  const value = process.env.ENTITLEMENT_SESSION_SECRET?.trim();
  return value && value.length >= 32 ? value : null;
}

export async function setEofyProAccessCookie(entitlement: EntitlementRecord) {
  const secret = getSessionSecret();
  if (!secret) throw new Error("EOFY Pack Pro access sessions are not configured.");
  const cookieStore = await cookies();
  cookieStore.set(accessCookieName, encodeEofyProAccessToken(entitlement, secret), {
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

export async function getActiveEofyProEntitlement() {
  const store = getConfiguredEntitlementStore();
  if (!store) return null;
  const cookieStore = await cookies();
  const payload = decodeEofyProAccessToken(cookieStore.get(accessCookieName)?.value, getSessionSecret());
  if (!payload) return null;
  return store.findActiveById(payload.entitlementId, "eofy_pro");
}

export const createEofyProRestore = createEofyProRestoreCode;
export const hashEofyProRestore = hashEofyProRestoreCode;
