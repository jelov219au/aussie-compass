import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";

export const rentalProAccessLifetimeSeconds = 60 * 60 * 24 * 30;
export const rentalProRestoreLifetimeSeconds = 60 * 60 * 24 * 30;

type RentalProAccessInput = { id: string; productCode: string; status: string };
export type RentalProAccessPayload = {
  v: 1;
  entitlementId: string;
  productCode: "rental_application_pro";
  exp: number;
};

function requireSessionSecret(secret: string | null | undefined) {
  const value = secret?.trim();
  if (!value || value.length < 32) throw new Error("Rental Pro access sessions are not configured.");
  return value;
}

function sign(encodedPayload: string, secret: string) {
  return createHmac("sha256", secret).update(encodedPayload).digest("base64url");
}

export function encodeRentalProAccessToken(entitlement: RentalProAccessInput, secret: string, nowMs = Date.now()) {
  const signingSecret = requireSessionSecret(secret);
  if (entitlement.productCode !== "rental_application_pro" || entitlement.status !== "active" || !/^\d+$/.test(entitlement.id)) {
    throw new Error("An active Rental Pro entitlement is required.");
  }
  const payload: RentalProAccessPayload = {
    v: 1,
    entitlementId: entitlement.id,
    productCode: "rental_application_pro",
    exp: Math.floor(nowMs / 1000) + rentalProAccessLifetimeSeconds,
  };
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${encoded}.${sign(encoded, signingSecret)}`;
}

export function decodeRentalProAccessToken(value: string | undefined, secret: string | null | undefined, nowMs = Date.now()) {
  const signingSecret = secret?.trim();
  if (!signingSecret || signingSecret.length < 32 || !value) return null;
  const [encoded, suppliedSignature, extra] = value.split(".");
  if (!encoded || !suppliedSignature || extra) return null;
  const expected = Buffer.from(sign(encoded, signingSecret));
  const supplied = Buffer.from(suppliedSignature);
  if (expected.length !== supplied.length || !timingSafeEqual(expected, supplied)) return null;
  try {
    const payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as Partial<RentalProAccessPayload>;
    if (payload.v !== 1 || payload.productCode !== "rental_application_pro" || typeof payload.entitlementId !== "string" || !/^\d+$/.test(payload.entitlementId) || typeof payload.exp !== "number" || payload.exp <= Math.floor(nowMs / 1000)) return null;
    return payload as RentalProAccessPayload;
  } catch {
    return null;
  }
}

export function createRentalProRestoreCode(nowMs = Date.now()) {
  const token = randomBytes(32).toString("base64url");
  return { token, tokenHash: hashRentalProRestoreCode(token), expiresAt: new Date(nowMs + rentalProRestoreLifetimeSeconds * 1000) };
}

export function hashRentalProRestoreCode(token: string) {
  return createHash("sha256").update(token.trim()).digest("hex");
}
