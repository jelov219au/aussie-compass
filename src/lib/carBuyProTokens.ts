import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";

export const carBuyProAccessLifetimeSeconds = 60 * 60 * 24 * 30;
export const carBuyProRestoreLifetimeSeconds = 60 * 60 * 24 * 30;

type AccessInput = { id: string; productCode: string; status: string };
export type CarBuyProAccessPayload = { v: 1; entitlementId: string; productCode: "car_buy_pro"; exp: number };

function requireSecret(secret: string | null | undefined) {
  const value = secret?.trim();
  if (!value || value.length < 32) throw new Error("Car Buy Pack Pro access sessions are not configured.");
  return value;
}

function sign(encodedPayload: string, secret: string) {
  return createHmac("sha256", secret).update(encodedPayload).digest("base64url");
}

export function encodeCarBuyProAccessToken(entitlement: AccessInput, secret: string, nowMs = Date.now()) {
  const signingSecret = requireSecret(secret);
  if (entitlement.productCode !== "car_buy_pro" || entitlement.status !== "active" || !/^\d+$/.test(entitlement.id)) {
    throw new Error("An active Car Buy Pack Pro entitlement is required.");
  }
  const payload: CarBuyProAccessPayload = {
    v: 1,
    entitlementId: entitlement.id,
    productCode: "car_buy_pro",
    exp: Math.floor(nowMs / 1000) + carBuyProAccessLifetimeSeconds,
  };
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${encoded}.${sign(encoded, signingSecret)}`;
}

export function decodeCarBuyProAccessToken(value: string | undefined, secret: string | null | undefined, nowMs = Date.now()) {
  const signingSecret = secret?.trim();
  if (!signingSecret || signingSecret.length < 32 || !value) return null;
  const [encoded, suppliedSignature, extra] = value.split(".");
  if (!encoded || !suppliedSignature || extra) return null;
  const expected = Buffer.from(sign(encoded, signingSecret));
  const supplied = Buffer.from(suppliedSignature);
  if (expected.length !== supplied.length || !timingSafeEqual(expected, supplied)) return null;
  try {
    const payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as Partial<CarBuyProAccessPayload>;
    if (payload.v !== 1 || payload.productCode !== "car_buy_pro" || typeof payload.entitlementId !== "string"
      || !/^\d+$/.test(payload.entitlementId) || typeof payload.exp !== "number"
      || payload.exp <= Math.floor(nowMs / 1000)) return null;
    return payload as CarBuyProAccessPayload;
  } catch {
    return null;
  }
}

export function createCarBuyProRestoreCode(nowMs = Date.now()) {
  const token = randomBytes(32).toString("base64url");
  return { token, tokenHash: hashCarBuyProRestoreCode(token), expiresAt: new Date(nowMs + carBuyProRestoreLifetimeSeconds * 1000) };
}

export function hashCarBuyProRestoreCode(token: string) {
  return createHash("sha256").update(token.trim()).digest("hex");
}
