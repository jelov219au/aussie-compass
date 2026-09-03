// Server-side preparation only. No runtime routes, cookies, or live store are connected.
// The route adapter must enforce same-origin mutations, no-store responses and secure cookies.
import { createHash } from "node:crypto";
import {
  carPurchaseProAccessLifetimeSeconds, createCarPurchaseProRestoreCode,
  decodeCarPurchaseProAccessToken, deriveCarPurchaseProAccessSessionId,
  deriveCarPurchaseProRestoreSourceHash, encodeCarPurchaseProAccessToken,
  hashCarPurchaseProAccessSessionId, hashCarPurchaseProRestoreCode,
  hashCarPurchaseProRestoreNonce,
} from "./carPurchaseProTokens";

const productCode = "car_purchase_pro" as const;
type Entitlement = {
  id: string; productCode: string; status: string;
  checkoutSessionId?: string; customerId?: string;
};
type AccessSession = {
  accessSessionHash: string; accessSessionRefLast8: string; expiresAt: Date;
};
type AccessLookup = { entitlementId: string; productCode: typeof productCode; accessSessionHash: string };
type ConsumeResult = { outcome: string; entitlement?: Entitlement };

// The eventual DB adapter must enforce these operations atomically. A mock is not proof of DB correctness.
export interface CarPurchaseAccessStore {
  consumeCheckoutActivation(input: {
    checkoutSessionId: string; productCode: typeof productCode; customerId: string;
    nonceHash: string; accessSession: AccessSession;
  }): Promise<ConsumeResult>;
  consumeRestoreTokenHash(input: {
    tokenHash: string; productCode: typeof productCode; nonceHash: string; accessSession: AccessSession;
  }): Promise<ConsumeResult>;
  findActiveByAccessSession(input: AccessLookup): Promise<Entitlement | null>;
  releaseAccessSession(input: AccessLookup): Promise<boolean>;
  createRestoreTokenHash(input: {
    entitlementId: string; productCode: typeof productCode; tokenHash: string; expiresAt: Date;
  }): Promise<void>;
}
type Failure = { ok: false; reason: "invalid" | "unavailable" | "denied" };
type AccessResult = Failure | { ok: true; accessToken: string };
const failed = (reason: Failure["reason"]): Failure => ({ ok: false, reason });
const active = (value: Entitlement | null | undefined): value is Entitlement =>
  !!value && value.productCode === productCode && value.status === "active" && /^\d+$/.test(value.id);
const consumed = (result: ConsumeResult) => result.outcome === "consumed" || result.outcome === "idempotent";

export function createCarPurchaseAccessLifecycle(deps: {
  store: CarPurchaseAccessStore | null;
  secret: string | null;
  // Trusted adapter: retrieve from Stripe on the server and apply the approved offer/mode contract.
  // Never implement this callback by echoing a browser-submitted checkout/customer object.
  getVerifiedCheckout: (sessionId: string) => Promise<{ id: string; customerId: string } | null>;
  now?: () => number;
}) {
  const secret = deps.secret?.trim();
  const now = deps.now ?? Date.now;
  const configured = () => !!deps.store && !!secret && secret.length >= 32;
  const sessionFor = (source: "activation" | "restore", sourceHash: string, at: number) => {
    const id = deriveCarPurchaseProAccessSessionId(source, sourceHash, secret!);
    return { id, stored: { accessSessionHash: hashCarPurchaseProAccessSessionId(id), accessSessionRefLast8: id.slice(-8),
      expiresAt: new Date(at + carPurchaseProAccessLifetimeSeconds * 1000) } };
  };
  const lookupFor = (token: string | undefined) => {
    const payload = decodeCarPurchaseProAccessToken(token, secret, now());
    return payload ? { entitlementId: payload.entitlementId, productCode,
      accessSessionHash: hashCarPurchaseProAccessSessionId(payload.accessSessionId) } : null;
  };

  return {
    async activate(sessionId: string, nonce: string): Promise<AccessResult> {
      if (!/^cs_(test|live)_[A-Za-z0-9]{1,240}$/.test(sessionId) || !/^[A-Za-z0-9_-]{40,128}$/.test(nonce)) return failed("invalid");
      if (!configured()) return failed("unavailable");
      try {
        const checkout = await deps.getVerifiedCheckout(sessionId);
        if (!checkout || checkout.id !== sessionId || !/^cus_[A-Za-z0-9]{1,240}$/.test(checkout.customerId)) return failed("denied");
        const at = now();
        if (!Number.isFinite(at)) return failed("unavailable");
        const nonceHash = createHash("sha256").update("car-purchase-pro-activation-nonce-v1:" + nonce).digest("hex");
        const sourceHash = createHash("sha256").update(`car-purchase-pro-activation-v1:${sessionId}:${nonceHash}`).digest("hex");
        const session = sessionFor("activation", sourceHash, at);
        const result = await deps.store!.consumeCheckoutActivation({ checkoutSessionId: checkout.id, customerId: checkout.customerId,
          productCode, nonceHash, accessSession: session.stored });
        if (!consumed(result) || !active(result.entitlement) || result.entitlement.checkoutSessionId !== checkout.id
          || result.entitlement.customerId !== checkout.customerId) return failed("denied");
        return { ok: true, accessToken: encodeCarPurchaseProAccessToken(result.entitlement, session.id, secret!, at) };
      } catch { return failed("unavailable"); }
    },

    async restore(code: string, nonce: string): Promise<AccessResult> {
      if (!/^[A-Za-z0-9_-]{43}$/.test(code.trim()) || !/^[A-Za-z0-9_-]{40,128}$/.test(nonce)) return failed("invalid");
      if (!configured()) return failed("unavailable");
      try {
        const at = now();
        if (!Number.isFinite(at)) return failed("unavailable");
        const tokenHash = hashCarPurchaseProRestoreCode(code);
        const nonceHash = hashCarPurchaseProRestoreNonce(nonce);
        const session = sessionFor("restore", deriveCarPurchaseProRestoreSourceHash(tokenHash, nonceHash), at);
        const result = await deps.store!.consumeRestoreTokenHash({ tokenHash, nonceHash, productCode, accessSession: session.stored });
        if (!consumed(result) || !active(result.entitlement)) return failed("denied");
        return { ok: true, accessToken: encodeCarPurchaseProAccessToken(result.entitlement, session.id, secret!, at) };
      } catch { return failed("unavailable"); }
    },

    async getActive(token: string | undefined): Promise<Entitlement | null> {
      if (!configured()) return null;
      try {
        const lookup = lookupFor(token);
        if (!lookup) return null;
        const entitlement = await deps.store!.findActiveByAccessSession(lookup);
        return active(entitlement) && entitlement.id === lookup.entitlementId ? entitlement : null;
      } catch { return null; }
    },

    async issueRestoreCode(token: string | undefined): Promise<Failure | { ok: true; code: string; expiresAt: Date }> {
      if (!configured()) return failed("unavailable");
      try {
        const lookup = lookupFor(token);
        if (!lookup) return failed("denied");
        const entitlement = await deps.store!.findActiveByAccessSession(lookup);
        if (!active(entitlement) || entitlement.id !== lookup.entitlementId) return failed("denied");
        const restore = createCarPurchaseProRestoreCode(now());
        await deps.store!.createRestoreTokenHash({ entitlementId: entitlement.id, productCode,
          tokenHash: restore.tokenHash, expiresAt: restore.expiresAt });
        return { ok: true, code: restore.token, expiresAt: restore.expiresAt };
      } catch { return failed("unavailable"); }
    },

    async release(token: string | undefined): Promise<Failure | { ok: true; clearCookie: true }> {
      if (!token) return { ok: true, clearCookie: true };
      if (!configured()) return failed("unavailable");
      try {
        const lookup = lookupFor(token);
        if (!lookup) return { ok: true, clearCookie: true };
        if (!await deps.store!.releaseAccessSession(lookup)) return failed("unavailable");
        return { ok: true, clearCookie: true };
      } catch { return failed("unavailable"); }
    },
  };
}
