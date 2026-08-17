import "server-only";

import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

import type { EntitlementRecord } from "@/lib/entitlements";
import { getConfiguredEntitlementStore } from "@/lib/neonEntitlementStore";

const accessCookieName = process.env.NODE_ENV === "production"
  ? "__Host-hoju_resume_pro_access"
  : "hoju_resume_pro_access";
const sessionLifetimeSeconds = 60 * 60 * 24 * 30;
const restoreLifetimeSeconds = 60 * 60 * 24 * 30;

type AccessPayload = {
  v: 1;
  entitlementId: string;
  productCode: "resume_pro";
  exp: number;
};

function getSessionSecret() {
  const value = process.env.ENTITLEMENT_SESSION_SECRET?.trim();
  return value && value.length >= 32 ? value : null;
}

export function isEntitlementSessionConfigured() {
  return Boolean(getSessionSecret());
}

function sign(encodedPayload: string, secret: string) {
  return createHmac("sha256", secret).update(encodedPayload).digest("base64url");
}

function encodeAccessToken(entitlement: EntitlementRecord) {
  const secret = getSessionSecret();
  if (!secret || entitlement.productCode !== "resume_pro" || entitlement.status !== "active") {
    throw new Error("Resume Pro access sessions are not configured.");
  }

  const payload: AccessPayload = {
    v: 1,
    entitlementId: entitlement.id,
    productCode: "resume_pro",
    exp: Math.floor(Date.now() / 1000) + sessionLifetimeSeconds,
  };
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${encoded}.${sign(encoded, secret)}`;
}

function decodeAccessToken(value: string | undefined) {
  const secret = getSessionSecret();
  if (!secret || !value) return null;

  const [encoded, suppliedSignature, extra] = value.split(".");
  if (!encoded || !suppliedSignature || extra) return null;

  const expected = Buffer.from(sign(encoded, secret));
  const supplied = Buffer.from(suppliedSignature);
  if (expected.length !== supplied.length || !timingSafeEqual(expected, supplied)) return null;

  try {
    const payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as Partial<AccessPayload>;
    if (payload.v !== 1
      || payload.productCode !== "resume_pro"
      || typeof payload.entitlementId !== "string"
      || !/^\d+$/.test(payload.entitlementId)
      || typeof payload.exp !== "number"
      || payload.exp <= Math.floor(Date.now() / 1000)) return null;
    return payload as AccessPayload;
  } catch {
    return null;
  }
}

export async function setResumeProAccessCookie(entitlement: EntitlementRecord) {
  const cookieStore = await cookies();
  cookieStore.set(accessCookieName, encodeAccessToken(entitlement), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: sessionLifetimeSeconds,
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
  const token = randomBytes(32).toString("base64url");
  return {
    token,
    tokenHash: hashRestoreCode(token),
    expiresAt: new Date(Date.now() + restoreLifetimeSeconds * 1000),
  };
}

export function hashRestoreCode(token: string) {
  return createHash("sha256").update(token.trim()).digest("hex");
}
