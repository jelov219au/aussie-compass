import "server-only";
import { createCarPurchaseAccessLifecycle } from "./carPurchaseProAccessLifecycle";
import { createCarPurchaseAccessStore, type CarPurchaseAccessQuery } from "./carPurchaseProAccessStore";
import { createCarPurchaseAccessHttp } from "./carPurchaseProAccessHttp";
import { createCarPurchaseCheckoutCreation } from "./carPurchaseProCheckoutCreation";
import type { CarPurchaseStripeProvider } from "./carPurchaseProStripeProvider";
import { createCarPurchaseCheckoutGate } from "./carPurchaseProCheckoutGate";
import { createCarPurchaseCheckoutHttp } from "./carPurchaseProCheckoutHttp";
import { isCarPurchaseApprovedOffer, type CarPurchaseApprovedOffer } from "./carPurchaseProCheckoutContract";
import { createCarPurchaseCheckoutVerifier } from "./carPurchaseProPurchase";
import { decodeCarPurchaseProAccessToken, hashCarPurchaseProAccessSessionId } from "./carPurchaseProTokens";
import { carPurchaseProAccessCookieName, createCarPurchaseWorkspaceAccess } from "./carPurchaseProWorkspaceAccess";

type Mode = "test" | "live";
type CookieReader = Parameters<typeof createCarPurchaseWorkspaceAccess>[0]["readCookies"];
const record = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value);
const offerFields = ["productCode", "currency", "billing", "priceCents", "stripePriceId", "stripeProductId", "termsVersion"] as const;

// Preparation factory only. Production runtime files deliberately do not import it.
// readReadiness must be an approved SERVER probe of the exact DB/functions/ACLs,
// webhook and offer contract. Browser input and environment flags are not evidence.
// It returns { offer, mode, accessFunctions, runtimePrivileges, webhook,
// checkoutGate, managedPayments, customerJourney }; every required check is exactly true.
export function createCarPurchaseRuntimeAssembly(deps: {
  enabled: boolean;
  salesEnabled: boolean;
  approvedOffer: unknown;
  expectedMode: Mode | null;
  stripeMode: Mode | "missing" | "invalid";
  deployment: "production" | "nonproduction";
  environment: "production" | "development";
  expectedOrigin: string;
  secret: string | null;
  query: CarPurchaseAccessQuery | null;
  provider: CarPurchaseStripeProvider | null;
  readCookies: CookieReader;
  readReadiness: ((offer: Readonly<CarPurchaseApprovedOffer>, mode: Mode) => Promise<unknown>) | null;
  now?: () => number;
}) {
  const origin = deps.expectedOrigin;
  const environment = deps.environment;
  const closed = () => ({
    handleAccess: createCarPurchaseAccessHttp({ service: null, enabled: false, expectedOrigin: origin, environment }),
    handleCheckout: createCarPurchaseCheckoutHttp({ service: null, enabled: false, expectedOrigin: origin, environment }),
    hasWorkspaceAccess: async () => false,
  });
  const mode = deps.expectedMode;
  const secret = deps.secret?.trim();
  const query = deps.query, provider = deps.provider, readReadiness = deps.readReadiness;
  if (deps.enabled !== true || !isCarPurchaseApprovedOffer(deps.approvedOffer)
    || deps.approvedOffer.priceCents > 2147483647 || !secret || secret.length < 32
    || (mode !== "test" && mode !== "live") || deps.stripeMode !== mode
    || !["production", "nonproduction"].includes(deps.deployment)
    || (deps.deployment === "production") !== (mode === "live")
    || !["production", "development"].includes(environment)
    || (deps.deployment === "production" && environment !== "production")
    || typeof query !== "function" || !provider || typeof provider.retrievePrice !== "function"
    || typeof provider.createSession !== "function" || typeof provider.retrieveSession !== "function"
    || typeof readReadiness !== "function" || typeof deps.readCookies !== "function") return closed();
  try {
    const url = new URL(origin);
    if (url.origin !== origin || url.protocol !== "https:") return closed();
  } catch { return closed(); }

  const offer = Object.freeze({ ...deps.approvedOffer });
  const now = deps.now ?? Date.now;
  const readCookies = deps.readCookies;
  const salesEnabled = deps.salesEnabled === true;
  // Snapshot methods as well as config before the first asynchronous call.
  const retrievePrice = provider.retrievePrice.bind(provider);
  const createSession = provider.createSession.bind(provider);
  const retrieveSession = provider.retrieveSession.bind(provider);
  const ready = async (scope: "access" | "checkout") => {
    try {
      const result = await readReadiness(offer, mode);
      if (!record(result)) return false;
      const reportedOffer = result.offer;
      if (!isCarPurchaseApprovedOffer(reportedOffer)
        || !offerFields.every(field => reportedOffer[field] === offer[field]) || result.mode !== mode
        || result.accessFunctions !== true || result.runtimePrivileges !== true || result.webhook !== true) return false;
      return scope === "access" || (result.checkoutGate === true
        && result.managedPayments === true && result.customerJourney === true);
    } catch { return false; }
  };
  const store = createCarPurchaseAccessStore(query, now);
  const verify = createCarPurchaseCheckoutVerifier({ approvedOffer: offer, expectedMode: mode,
    stripeMode: mode, retrieveSession });
  const lifecycle = createCarPurchaseAccessLifecycle({ store, secret, getVerifiedCheckout: verify, now });
  const unavailable = { ok: false, reason: "unavailable" } as const;
  const access: ReturnType<typeof createCarPurchaseAccessLifecycle> = {
    activate: async (id, nonce) => await ready("access") ? lifecycle.activate(id, nonce) : unavailable,
    restore: async (code, nonce) => await ready("access") ? lifecycle.restore(code, nonce) : unavailable,
    getActive: async token => await ready("access") ? lifecycle.getActive(token) : null,
    issueRestoreCode: async token => await ready("access") ? lifecycle.issueRestoreCode(token) : unavailable,
    release: async token => await ready("access") ? lifecycle.release(token) : unavailable,
  };

  // Workspace denial is boolean, but checkout needs a tri-state result. In
  // particular, lifecycle.getActive() collapses DB errors to null, so using its
  // truthiness here would allow a new charge when current access is unknown.
  const hasActiveAccess = async (): Promise<boolean | null> => {
    try {
      const values = (await readCookies()).getAll(carPurchaseProAccessCookieName(environment));
      if (values.length === 0) return false;
      if (values.length !== 1) return null;
      const payload = decodeCarPurchaseProAccessToken(values[0]?.value, secret, now());
      if (!payload || !/^[1-9]\d{0,18}$/.test(payload.entitlementId)
        || BigInt(payload.entitlementId) > BigInt("9223372036854775807")) return null;
      const active = await store.findActiveByAccessSession({ entitlementId: payload.entitlementId,
        productCode: "car_purchase_pro", accessSessionHash: hashCarPurchaseProAccessSessionId(payload.accessSessionId) });
      return active !== null;
    } catch { return null; }
  };
  const checkout = createCarPurchaseCheckoutCreation({ enabled: salesEnabled, approvedOffer: offer,
    expectedMode: mode, stripeMode: mode, deployment: deps.deployment, expectedOrigin: origin,
    provider: { retrievePrice, createSession },
    gate: createCarPurchaseCheckoutGate({ query, approvedOffer: offer, expectedMode: mode, now }),
    checkPrerequisites: () => ready("checkout"), hasActiveAccess, now });
  return {
    handleAccess: createCarPurchaseAccessHttp({ service: access, enabled: true, expectedOrigin: origin, environment }),
    handleCheckout: createCarPurchaseCheckoutHttp({ service: checkout, enabled: salesEnabled, expectedOrigin: origin, environment }),
    hasWorkspaceAccess: createCarPurchaseWorkspaceAccess({ service: access, enabled: true, environment, readCookies }),
  };
}
