import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";

export const eofyProAccessLifetimeSeconds = 60 * 60 * 24 * 30;
export const eofyProRestoreLifetimeSeconds = 60 * 60 * 24 * 30;

type EofyProAccessInput = {
  id: string;
  productCode: string;
  status: string;
};

export type EofyProAccessPayload = {
  v: 2;
  entitlementId: string;
  productCode: "eofy_pro";
  accessSessionId: string;
  exp: number;
};

function requireSessionSecret(secret: string | null | undefined) {
  const value = secret?.trim();
  if (!value || value.length < 32) throw new Error("EOFY Pack Pro access sessions are not configured.");
  return value;
}
function sign(encoded: string, secret: string) {
  return createHmac("sha256", secret).update(encoded).digest("base64url");
}

export function encodeEofyProAccessToken(
  entitlement: EofyProAccessInput,
  accessSessionId: string,
  secret: string,
  nowMs = Date.now(),
) {
  const signingSecret = requireSessionSecret(secret);
  if (entitlement.productCode !== "eofy_pro" || entitlement.status !== "active" || !/^\d+$/.test(entitlement.id)) {
    throw new Error("An active EOFY Pack Pro entitlement is required.");
  }
  if (!/^[A-Za-z0-9_-]{43}$/.test(accessSessionId)) throw new Error("Invalid access session identifier.");
  const payload: EofyProAccessPayload = {
    v: 2,
    entitlementId: entitlement.id,
    productCode: "eofy_pro",
    accessSessionId,
    exp: Math.floor(nowMs / 1000) + eofyProAccessLifetimeSeconds,
  };
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${encoded}.${sign(encoded, signingSecret)}`;
}

export function decodeEofyProAccessToken(
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
    const payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as Partial<EofyProAccessPayload>;
    if (payload.v !== 2
      || payload.productCode !== "eofy_pro"
      || typeof payload.entitlementId !== "string"
      || !/^\d+$/.test(payload.entitlementId)
      || typeof payload.accessSessionId !== "string"
      || !/^[A-Za-z0-9_-]{43}$/.test(payload.accessSessionId)
      || typeof payload.exp !== "number"
      || payload.exp <= Math.floor(nowMs / 1000)) return null;
    return payload as EofyProAccessPayload;
  } catch {
    return null;
  }
}

export function deriveEofyProAccessSessionId(
  source: "activation" | "restore",
  sourceHash: string,
  secret: string,
) {
  const signingSecret = requireSessionSecret(secret);
  if (!/^[a-f0-9]{64}$/.test(sourceHash)) throw new Error("A hashed access source is required.");
  return createHmac("sha256", signingSecret)
    .update(`eofy-pro-access-v1:${source}:${sourceHash}`)
    .digest("base64url");
}

export function hashEofyProAccessSessionId(accessSessionId: string) {
  if (!/^[A-Za-z0-9_-]{43}$/.test(accessSessionId)) throw new Error("Invalid access session identifier.");
  return createHash("sha256").update(accessSessionId).digest("hex");
}

export function createEofyProRestoreCode(nowMs = Date.now()) {
  const token = randomBytes(32).toString("base64url");
  return {
    token,
    tokenHash: hashEofyProRestoreCode(token),
    expiresAt: new Date(nowMs + eofyProRestoreLifetimeSeconds * 1000),
  };
}

export function hashEofyProRestoreCode(token: string) {
  return createHash("sha256").update(token.trim()).digest("hex");
}

export function hashEofyProRestoreNonce(nonce: string) {
  if (!/^[A-Za-z0-9_-]{40,128}$/.test(nonce)) throw new Error("Invalid restore nonce.");
  return createHash("sha256").update(nonce).digest("hex");
}

export function deriveEofyProRestoreSourceHash(tokenHash: string, nonceHash: string) {
  if (!/^[a-f0-9]{64}$/.test(tokenHash) || !/^[a-f0-9]{64}$/.test(nonceHash)) {
    throw new Error("Hashed restore credentials are required.");
  }
  return createHash("sha256")
    .update(`eofy-pro-restore-v1:${tokenHash}:${nonceHash}`)
    .digest("hex");
}
