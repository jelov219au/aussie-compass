import "server-only";

import { cookies } from "next/headers";

import type { EntitlementRecord } from "@/lib/entitlements";
import { getConfiguredEntitlementStore } from "@/lib/neonEntitlementStore";
import {
  createResumeProRestoreCode,
  decodeResumeProAccessToken,
  encodeResumeProAccessToken,
  hashResumeProRestoreCode,
  resumeProAccessLifetimeSeconds,
} from "@/lib/resumeProTokens";

const accessCookieName = process.env.NODE_ENV === "production"
  ? "__Host-hoju_resume_pro_access"
  : "hoju_resume_pro_access";
function getSessionSecret() {
  const value = process.env.ENTITLEMENT_SESSION_SECRET?.trim();
  return value && value.length >= 32 ? value : null;
}

export function isEntitlementSessionConfigured() {
  return Boolean(getSessionSecret());
}

function encodeAccessToken(entitlement: EntitlementRecord) {
  const secret = getSessionSecret();
  if (!secret) throw new Error("Resume Pro access sessions are not configured.");
  return encodeResumeProAccessToken(entitlement, secret);
}

function decodeAccessToken(value: string | undefined) {
  return decodeResumeProAccessToken(value, getSessionSecret());
}

export async function setResumeProAccessCookie(entitlement: EntitlementRecord) {
  const cookieStore = await cookies();
  cookieStore.set(accessCookieName, encodeAccessToken(entitlement), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: resumeProAccessLifetimeSeconds,
    priority: "high",
  });
}

export async function clearResumeProAccessCookie() {
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

export async function getActiveResumeProEntitlement() {
  const store = getConfiguredEntitlementStore();
  if (!store) return null;

  const cookieStore = await cookies();
  const payload = decodeAccessToken(cookieStore.get(accessCookieName)?.value);
  if (!payload) return null;
  return store.findActiveById(payload.entitlementId);
}

export function createRestoreCode() {
  return createResumeProRestoreCode();
}

export function hashRestoreCode(token: string) {
  return hashResumeProRestoreCode(token);
}
