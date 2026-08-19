import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";

export const resumeProAccessLifetimeSeconds = 60 * 60 * 24 * 30;
export const resumeProRestoreLifetimeSeconds = 60 * 60 * 24 * 30;

type ResumeProAccessInput = {
  id: string;
  productCode: string;
  status: string;
};

export type ResumeProAccessPayload = {
  v: 1;
  entitlementId: string;
  productCode: "resume_pro";
  exp: number;
};

function requireSessionSecret(secret: string | null | undefined) {
  const value = secret?.trim();
  if (!value || value.length < 32) throw new Error("Resume Pro access sessions are not configured.");
  return value;
}

function sign(encodedPayload: string, secret: string) {
  return createHmac("sha256", secret).update(encodedPayload).digest("base64url");
}

export function encodeResumeProAccessToken(
  entitlement: ResumeProAccessInput,
  secret: string,
  nowMs = Date.now(),
) {
  const signingSecret = requireSessionSecret(secret);
  if (entitlement.productCode !== "resume_pro" || entitlement.status !== "active" || !/^\d+$/.test(entitlement.id)) {
    throw new Error("An active Resume Pro entitlement is required.");
  }

  const payload: ResumeProAccessPayload = {
    v: 1,
    entitlementId: entitlement.id,
    productCode: "resume_pro",
    exp: Math.floor(nowMs / 1000) + resumeProAccessLifetimeSeconds,
  };
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${encoded}.${sign(encoded, signingSecret)}`;
}

export function decodeResumeProAccessToken(
  value: string | undefined,
  secret: string | null | undefined,
  nowMs = Date.now(),
) {
  const signingSecret = secret?.trim();
  if (!signingSecret || signingSecret.length < 32 || !value) return null;

  const [encoded, suppliedSignature, extra] = value.split(".");
  if (!encoded || !suppliedSignature || extra) return null;

  const expected = Buffer.from(sign(encoded, signingSecret));
  const supplied = Buffer.from(suppliedSignature);
  if (expected.length !== supplied.length || !timingSafeEqual(expected, supplied)) return null;

  try {
    const payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as Partial<ResumeProAccessPayload>;
    if (payload.v !== 1
      || payload.productCode !== "resume_pro"
      || typeof payload.entitlementId !== "string"
      || !/^\d+$/.test(payload.entitlementId)
      || typeof payload.exp !== "number"
      || payload.exp <= Math.floor(nowMs / 1000)) return null;
    return payload as ResumeProAccessPayload;
  } catch {
    return null;
  }
}

export function createResumeProRestoreCode(nowMs = Date.now()) {
  const token = randomBytes(32).toString("base64url");
  return {
    token,
    tokenHash: hashResumeProRestoreCode(token),
    expiresAt: new Date(nowMs + resumeProRestoreLifetimeSeconds * 1000),
  };
}

export function hashResumeProRestoreCode(token: string) {
  return createHash("sha256").update(token.trim()).digest("hex");
}
