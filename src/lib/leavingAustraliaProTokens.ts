import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";

export const leavingAustraliaProAccessLifetimeSeconds = 60 * 60 * 24 * 30;
export const leavingAustraliaProRestoreLifetimeSeconds = 60 * 60 * 24 * 30;

type LeavingAustraliaProAccessInput = {
  id: string;
  productCode: string;
  status: string;
};

export type LeavingAustraliaProAccessPayload = {
  v: 2;
  entitlementId: string;
  productCode: "leaving_australia_pro";
  accessSessionId: string;
  exp: number;
};

function requireSessionSecret(secret: string | null | undefined) {
  const value = secret?.trim();
  if (!value || value.length < 32) throw new Error("Leaving Australia Pack Pro access sessions are not configured.");
  return value;
}
function sign(encoded: string, secret: string) {
  return createHmac("sha256", secret).update(encoded).digest("base64url");
}
export function encodeLeavingAustraliaProAccessToken(
  entitlement: LeavingAustraliaProAccessInput,
  accessSessionId: string,
  secret: string,
  nowMs = Date.now(),
) {
  const signingSecret = requireSessionSecret(secret);
  if (entitlement.productCode !== "leaving_australia_pro" || entitlement.status !== "active" || !/^\d+$/.test(entitlement.id)) {
    throw new Error("An active Leaving Australia Pack Pro entitlement is required.");
  }
  if (!/^[A-Za-z0-9_-]{43}$/.test(accessSessionId)) throw new Error("Invalid access session identifier.");
  const payload: LeavingAustraliaProAccessPayload = {
    v: 2,
    entitlementId: entitlement.id,
    productCode: "leaving_australia_pro",
    accessSessionId,
    exp: Math.floor(nowMs / 1000) + leavingAustraliaProAccessLifetimeSeconds,
  };
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${encoded}.${sign(encoded, signingSecret)}`;
}

export function decodeLeavingAustraliaProAccessToken(
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
    const payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as Partial<LeavingAustraliaProAccessPayload>;
    if (payload.v !== 2
      || payload.productCode !== "leaving_australia_pro"
      || typeof payload.entitlementId !== "string"
      || !/^\d+$/.test(payload.entitlementId)
      || typeof payload.accessSessionId !== "string"
      || !/^[A-Za-z0-9_-]{43}$/.test(payload.accessSessionId)
      || typeof payload.exp !== "number"
      || payload.exp <= Math.floor(nowMs / 1000)) return null;
    return payload as LeavingAustraliaProAccessPayload;
  } catch {
    return null;
  }
}

export function deriveLeavingAustraliaProAccessSessionId(
  source: "activation" | "restore",
  sourceHash: string,
  secret: string,
) {
  const signingSecret = requireSessionSecret(secret);
  if (!/^[a-f0-9]{64}$/.test(sourceHash)) throw new Error("A hashed access source is required.");
  return createHmac("sha256", signingSecret)
    .update(`leaving-australia-pro-access-v1:${source}:${sourceHash}`)
    .digest("base64url");
}

export function hashLeavingAustraliaProAccessSessionId(accessSessionId: string) {
  if (!/^[A-Za-z0-9_-]{43}$/.test(accessSessionId)) throw new Error("Invalid access session identifier.");
  return createHash("sha256").update(accessSessionId).digest("hex");
}

export function createLeavingAustraliaProRestoreCode(nowMs = Date.now()) {
  const token = randomBytes(32).toString("base64url");
  return {
    token,
    tokenHash: hashLeavingAustraliaProRestoreCode(token),
    expiresAt: new Date(nowMs + leavingAustraliaProRestoreLifetimeSeconds * 1000),
  };
}

export function hashLeavingAustraliaProRestoreCode(token: string) {
  return createHash("sha256").update(token.trim()).digest("hex");
}

export function hashLeavingAustraliaProRestoreNonce(nonce: string) {
  if (!/^[A-Za-z0-9_-]{40,128}$/.test(nonce)) throw new Error("Invalid restore nonce.");
  return createHash("sha256").update(nonce).digest("hex");
}

export function deriveLeavingAustraliaProRestoreSourceHash(tokenHash: string, nonceHash: string) {
  if (!/^[a-f0-9]{64}$/.test(tokenHash) || !/^[a-f0-9]{64}$/.test(nonceHash)) {
    throw new Error("Hashed restore credentials are required.");
  }
  return createHash("sha256")
    .update(`leaving-australia-pro-restore-v1:${tokenHash}:${nonceHash}`)
    .digest("hex");
}
