// Preparation module. Production workspace stays closed until DB-backed access/restore is connected.
// Token verification alone never proves that an entitlement remains active or a restore code is unused.
import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";

export const carPurchaseProAccessLifetimeSeconds = 60 * 60 * 24 * 30;
export const carPurchaseProRestoreLifetimeSeconds = 60 * 60 * 24 * 30;

type CarPurchaseProAccessInput = {
  id: string;
  productCode: string;
  status: string;
};

export type CarPurchaseProAccessPayload = {
  v: 2;
  entitlementId: string;
  productCode: "car_purchase_pro";
  accessSessionId: string;
  exp: number;
};

function requireSessionSecret(secret: string | null | undefined) {
  const value = secret?.trim();
  if (!value || value.length < 32) throw new Error("Car Purchase Pack Pro access sessions are not configured.");
  return value;
}
function sign(encoded: string, secret: string) {
  return createHmac("sha256", secret).update("car-purchase-pro-token-v1:" + encoded).digest("base64url");
}
export function encodeCarPurchaseProAccessToken(
  entitlement: CarPurchaseProAccessInput,
  accessSessionId: string,
  secret: string,
  nowMs = Date.now(),
) {
  const signingSecret = requireSessionSecret(secret);
  if (!Number.isFinite(nowMs)) throw new Error("Invalid access timestamp.");
  if (entitlement.productCode !== "car_purchase_pro" || entitlement.status !== "active" || !/^\d+$/.test(entitlement.id)) {
    throw new Error("An active Car Purchase Pack Pro entitlement is required.");
  }
  if (!/^[A-Za-z0-9_-]{43}$/.test(accessSessionId)) throw new Error("Invalid access session identifier.");
  const payload: CarPurchaseProAccessPayload = {
    v: 2,
    entitlementId: entitlement.id,
    productCode: "car_purchase_pro",
    accessSessionId,
    exp: Math.floor(nowMs / 1000) + carPurchaseProAccessLifetimeSeconds,
  };
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${encoded}.${sign(encoded, signingSecret)}`;
}

export function decodeCarPurchaseProAccessToken(
  value: string | undefined,
  secret: string | null | undefined,
  nowMs = Date.now(),
) {
  const signingSecret = secret?.trim();
  if (!signingSecret || signingSecret.length < 32 || !value || value.length > 4096 || !Number.isFinite(nowMs)) return null;
  const [encoded, suppliedSignature, extra] = value.split(".");
  if (!encoded || !/^[A-Za-z0-9_-]+$/.test(encoded) || !/^[A-Za-z0-9_-]{43}$/.test(suppliedSignature) || extra !== undefined) return null;
  const expected = Buffer.from(sign(encoded, signingSecret));
  const supplied = Buffer.from(suppliedSignature);
  if (expected.length !== supplied.length || !timingSafeEqual(expected, supplied)) return null;
  try {
    const payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as Partial<CarPurchaseProAccessPayload>;
    if (payload.v !== 2
      || payload.productCode !== "car_purchase_pro"
      || typeof payload.entitlementId !== "string"
      || !/^\d+$/.test(payload.entitlementId)
      || typeof payload.accessSessionId !== "string"
      || !/^[A-Za-z0-9_-]{43}$/.test(payload.accessSessionId)
      || typeof payload.exp !== "number" || !Number.isSafeInteger(payload.exp)
      || payload.exp <= Math.floor(nowMs / 1000)) return null;
    return payload as CarPurchaseProAccessPayload;
  } catch {
    return null;
  }
}

export function deriveCarPurchaseProAccessSessionId(
  source: "activation" | "restore",
  sourceHash: string,
  secret: string,
) {
  const signingSecret = requireSessionSecret(secret);
  if ((source !== "activation" && source !== "restore") || !/^[a-f0-9]{64}$/.test(sourceHash)) throw new Error("A hashed access source is required.");
  return createHmac("sha256", signingSecret)
    .update(`car-purchase-pro-access-v1:${source}:${sourceHash}`)
    .digest("base64url");
}

export function hashCarPurchaseProAccessSessionId(accessSessionId: string) {
  if (!/^[A-Za-z0-9_-]{43}$/.test(accessSessionId)) throw new Error("Invalid access session identifier.");
  return createHash("sha256").update("car-purchase-pro-session-v1:" + accessSessionId).digest("hex");
}

export function createCarPurchaseProRestoreCode(nowMs = Date.now()) {
  if (!Number.isFinite(nowMs)) throw new Error("Invalid restore timestamp.");
  const token = randomBytes(32).toString("base64url");
  return {
    token,
    tokenHash: hashCarPurchaseProRestoreCode(token),
    expiresAt: new Date(nowMs + carPurchaseProRestoreLifetimeSeconds * 1000),
  };
}

export function hashCarPurchaseProRestoreCode(token: string) {
  const normalized = token.trim();
  if (!/^[A-Za-z0-9_-]{43}$/.test(normalized)) throw new Error("Invalid restore code.");
  return createHash("sha256").update("car-purchase-pro-restore-code-v1:" + normalized).digest("hex");
}

export function hashCarPurchaseProRestoreNonce(nonce: string) {
  if (!/^[A-Za-z0-9_-]{40,128}$/.test(nonce)) throw new Error("Invalid restore nonce.");
  return createHash("sha256").update("car-purchase-pro-nonce-v1:" + nonce).digest("hex");
}

export function deriveCarPurchaseProRestoreSourceHash(tokenHash: string, nonceHash: string) {
  if (!/^[a-f0-9]{64}$/.test(tokenHash) || !/^[a-f0-9]{64}$/.test(nonceHash)) {
    throw new Error("Hashed restore credentials are required.");
  }
  return createHash("sha256")
    .update(`car-purchase-pro-restore-v1:${tokenHash}:${nonceHash}`)
    .digest("hex");
}
