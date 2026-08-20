import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";

export const payEvidenceAccessLifetimeSeconds = 60 * 60 * 24 * 30;
export const payEvidenceRestoreLifetimeSeconds = 60 * 60 * 24 * 30;

type AccessInput = { id: string; productCode: string; status: string };
export type PayEvidenceAccessPayload = { v: 1; entitlementId: string; productCode: "pay_evidence_pro"; exp: number };

function requireSecret(secret: string | null | undefined) {
  const value = secret?.trim();
  if (!value || value.length < 32) throw new Error("Pay Evidence Pro access sessions are not configured.");
  return value;
}

function sign(encodedPayload: string, secret: string) {
  return createHmac("sha256", secret).update(encodedPayload).digest("base64url");
}

export function encodePayEvidenceAccessToken(entitlement: AccessInput, secret: string, nowMs = Date.now()) {
  const signingSecret = requireSecret(secret);
  if (entitlement.productCode !== "pay_evidence_pro" || entitlement.status !== "active" || !/^\d+$/.test(entitlement.id)) {
    throw new Error("An active Pay Evidence Pro entitlement is required.");
  }
  const payload: PayEvidenceAccessPayload = {
    v: 1,
    entitlementId: entitlement.id,
    productCode: "pay_evidence_pro",
    exp: Math.floor(nowMs / 1000) + payEvidenceAccessLifetimeSeconds,
  };
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${encoded}.${sign(encoded, signingSecret)}`;
}

export function decodePayEvidenceAccessToken(value: string | undefined, secret: string | null | undefined, nowMs = Date.now()) {
  const signingSecret = secret?.trim();
  if (!signingSecret || signingSecret.length < 32 || !value) return null;
  const [encoded, suppliedSignature, extra] = value.split(".");
  if (!encoded || !suppliedSignature || extra) return null;
  const expected = Buffer.from(sign(encoded, signingSecret));
  const supplied = Buffer.from(suppliedSignature);
  if (expected.length !== supplied.length || !timingSafeEqual(expected, supplied)) return null;
  try {
    const payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as Partial<PayEvidenceAccessPayload>;
    if (payload.v !== 1 || payload.productCode !== "pay_evidence_pro" || typeof payload.entitlementId !== "string"
      || !/^\d+$/.test(payload.entitlementId) || typeof payload.exp !== "number"
      || payload.exp <= Math.floor(nowMs / 1000)) return null;
    return payload as PayEvidenceAccessPayload;
  } catch {
    return null;
  }
}

export function createPayEvidenceRestoreCode(nowMs = Date.now()) {
  const token = randomBytes(32).toString("base64url");
  return { token, tokenHash: hashPayEvidenceRestoreCode(token), expiresAt: new Date(nowMs + payEvidenceRestoreLifetimeSeconds * 1000) };
}

export function hashPayEvidenceRestoreCode(token: string) {
  return createHash("sha256").update(token.trim()).digest("hex");
}
