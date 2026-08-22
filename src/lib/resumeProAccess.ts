import "server-only";

import { cookies } from "next/headers";

import type { EntitlementRecord } from "@/lib/entitlements";
import { getConfiguredEntitlementStore } from "@/lib/neonEntitlementStore";
import {
  createResumeProRestoreCode,
  decodeResumeProAccessToken,
  deriveResumeProAccessSessionId,
  deriveResumeProRestoreSourceHash,
  encodeResumeProAccessToken,
  hashResumeProRestoreCode,
  hashResumeProRestoreNonce,
  hashResumeProAccessSessionId,
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

function encodeAccessToken(entitlement: EntitlementRecord, accessSessionId: string) {
  const secret = getSessionSecret();
  if (!secret) throw new Error("Resume Pro access sessions are not configured.");
  return encodeResumeProAccessToken(entitlement, accessSessionId, secret);
}

function decodeAccessToken(value: string | undefined) {
  return decodeResumeProAccessToken(value, getSessionSecret());
}

export async function setResumeProAccessCookie(entitlement: EntitlementRecord, accessSessionId: string) {
  const cookieStore = await cookies();
  cookieStore.set(accessCookieName, encodeAccessToken(entitlement, accessSessionId), {
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

export async function getResumeProAccessPayload() {
  const cookieStore = await cookies();
  return decodeAccessToken(cookieStore.get(accessCookieName)?.value);
}

export async function getActiveResumeProEntitlement() {
  const store = getConfiguredEntitlementStore();
  if (!store) return null;

  const payload = await getResumeProAccessPayload();
  if (!payload) return null;
  return store.findActiveByAccessSession({
    entitlementId: payload.entitlementId,
    productCode: "resume_pro",
    accessSessionHash: hashResumeProAccessSessionId(payload.accessSessionId),
  });
}

export function createAccessSession(source: "activation" | "restore", sourceHash: string) {
  const secret = getSessionSecret();
  if (!secret) throw new Error("Resume Pro access sessions are not configured.");
  const accessSessionId = deriveResumeProAccessSessionId(source, sourceHash, secret);
  return {
    accessSessionId,
    accessSessionHash: hashResumeProAccessSessionId(accessSessionId),
    accessSessionRefLast8: accessSessionId.slice(-8),
    expiresAt: new Date(Date.now() + resumeProAccessLifetimeSeconds * 1000),
  };
}

export function hashAccessSessionId(accessSessionId: string) {
  return hashResumeProAccessSessionId(accessSessionId);
}

export function createRestoreCode() {
  return createResumeProRestoreCode();
}

export function hashRestoreCode(token: string) {
  return hashResumeProRestoreCode(token);
}

export function createRestoreAccessSession(tokenHash: string, nonce: string) {
  const nonceHash = hashResumeProRestoreNonce(nonce);
  const sourceHash = deriveResumeProRestoreSourceHash(tokenHash, nonceHash);
  return { nonceHash, accessSession: createAccessSession("restore", sourceHash) };
}
