import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";

export const payEvidenceProAccessLifetimeSeconds = 60 * 60 * 24 * 30;
export const payEvidenceProRestoreLifetimeSeconds = 60 * 60 * 24 * 30;

type PayEvidenceProAccessInput = {
  id: string;
  productCode: string;
  status: string;
};

export type PayEvidenceProAccessPayload = {
  v: 2;
  entitlementId: string;
  productCode: "pay_evidence_pro";
  accessSessionId: string;
  exp: number;
};

function requireSessionSecret(secret: string | null | undefined) {
  const value = secret?.trim();
  if (!value || value.length < 32) throw new Error("Pay Evidence Pack Pro access sessions are not configured.");
  return value;
}

function sign(encoded: string, secret: string) {
  return createHmac("sha256", secret).update(encoded).digest("base64url");
}

export function encodePayEvidenceProAccessToken(
  entitlement: PayEvidenceProAccessInput,
  accessSessionId: string,
  secret: string,
  nowMs = Date.now(),
) {
  const signingSecret = requireSessionSecret(secret);
  if (entitlement.productCode !== "pay_evidence_pro" || entitlement.status !== "active" || !/^\d+$/.test(entitlement.id)) {
    throw new Error("An active Pay Evidence Pack Pro entitlement is required.");
  }
  if (!/^[A-Za-z0-9_-]{43}$/.test(accessSessionId)) throw new Error("Invalid access session identifier.");
  const payload: PayEvidenceProAccessPayload = {
    v: 2,
    entitlementId: entitlement.id,
    productCode: "pay_evidence_pro",
    accessSessionId,
    exp: Math.floor(nowMs / 1000) + payEvidenceProAccessLifetimeSeconds,
  };
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${encoded}.${sign(encoded, signingSecret)}`;
}

export function decodePayEvidenceProAccessToken(
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
    const payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as Partial<PayEvidenceProAccessPayload>;
    if (payload.v !== 2
      || payload.productCode !== "pay_evidence_pro"
      || typeof payload.entitlementId !== "string"
      || !/^\d+$/.test(payload.entitlementId)
      || typeof payload.accessSessionId !== "string"
      || !/^[A-Za-z0-9_-]{43}$/.test(payload.accessSessionId)
      || typeof payload.exp !== "number"
      || payload.exp <= Math.floor(nowMs / 1000)) return null;
    return payload as PayEvidenceProAccessPayload;
  } catch {
    return null;
  }
}

export function derivePayEvidenceProAccessSessionId(
  source: "activation" | "restore",
  sourceHash: string,
  secret: string,
) {
  const signingSecret = requireSessionSecret(secret);
  if (!/^[a-f0-9]{64}$/.test(sourceHash)) throw new Error("A hashed access source is required.");
  return createHmac("sha256", signingSecret)
    .update(`pay-evidence-pro-access-v1:${source}:${sourceHash}`)
    .digest("base64url");
}

export function hashPayEvidenceProAccessSessionId(accessSessionId: string) {
  if (!/^[A-Za-z0-9_-]{43}$/.test(accessSessionId)) throw new Error("Invalid access session identifier.");
  return createHash("sha256").update(accessSessionId).digest("hex");
}

export function createPayEvidenceProRestoreCode(nowMs = Date.now()) {
  const token = randomBytes(32).toString("base64url");
  return {
    token,
    tokenHash: hashPayEvidenceProRestoreCode(token),
    expiresAt: new Date(nowMs + payEvidenceProRestoreLifetimeSeconds * 1000),
  };
}

export function hashPayEvidenceProRestoreCode(token: string) {
  return createHash("sha256").update(token.trim()).digest("hex");
}

export function hashPayEvidenceProRestoreNonce(nonce: string) {
  if (!/^[A-Za-z0-9_-]{40,128}$/.test(nonce)) throw new Error("Invalid restore nonce.");
  return createHash("sha256").update(nonce).digest("hex");
}

export function derivePayEvidenceProRestoreSourceHash(tokenHash: string, nonceHash: string) {
  if (!/^[a-f0-9]{64}$/.test(tokenHash) || !/^[a-f0-9]{64}$/.test(nonceHash)) {
    throw new Error("Hashed restore credentials are required.");
  }
  return createHash("sha256")
    .update(`pay-evidence-pro-restore-v1:${tokenHash}:${nonceHash}`)
    .digest("hex");
}
