import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";

export const eofyProAccessLifetimeSeconds = 60 * 60 * 24 * 30;
export const eofyProRestoreLifetimeSeconds = 60 * 60 * 24 * 30;

type AccessInput = { id: string; productCode: string; status: string };
export type EofyProAccessPayload = { v: 1; entitlementId: string; productCode: "eofy_pro"; exp: number };

function requireSecret(secret: string | null | undefined) {
  const value = secret?.trim();
  if (!value || value.length < 32) throw new Error("EOFY Pack Pro access sessions are not configured.");
  return value;
}

function sign(encodedPayload: string, secret: string) {
  return createHmac("sha256", secret).update(encodedPayload).digest("base64url");
}

export function encodeEofyProAccessToken(entitlement: AccessInput, secret: string, nowMs = Date.now()) {
  const signingSecret = requireSecret(secret);
  if (entitlement.productCode !== "eofy_pro" || entitlement.status !== "active" || !/^\d+$/.test(entitlement.id)) {
    throw new Error("An active EOFY Pack Pro entitlement is required.");
  }
  const payload: EofyProAccessPayload = {
    v: 1,
    entitlementId: entitlement.id,
    productCode: "eofy_pro",
    exp: Math.floor(nowMs / 1000) + eofyProAccessLifetimeSeconds,
  };
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${encoded}.${sign(encoded, signingSecret)}`;
}

export function decodeEofyProAccessToken(value: string | undefined, secret: string | null | undefined, nowMs = Date.now()) {
  const signingSecret = secret?.trim();
  if (!signingSecret || signingSecret.length < 32 || !value) return null;
  const [encoded, suppliedSignature, extra] = value.split(".");
  if (!encoded || !suppliedSignature || extra) return null;
  const expected = Buffer.from(sign(encoded, signingSecret));
  const supplied = Buffer.from(suppliedSignature);
  if (expected.length !== supplied.length || !timingSafeEqual(expected, supplied)) return null;
  try {
    const payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as Partial<EofyProAccessPayload>;
    if (payload.v !== 1 || payload.productCode !== "eofy_pro" || typeof payload.entitlementId !== "string"
      || !/^\d+$/.test(payload.entitlementId) || typeof payload.exp !== "number"
      || payload.exp <= Math.floor(nowMs / 1000)) return null;
    return payload as EofyProAccessPayload;
  } catch {
    return null;
  }
}

export function createEofyProRestoreCode(nowMs = Date.now()) {
  const token = randomBytes(32).toString("base64url");
  return { token, tokenHash: hashEofyProRestoreCode(token), expiresAt: new Date(nowMs + eofyProRestoreLifetimeSeconds * 1000) };
}

export function hashEofyProRestoreCode(token: string) {
  return createHash("sha256").update(token.trim()).digest("hex");
}
