import "server-only";
import { createCarPurchaseWebhookFulfillment, type CarPurchaseExceptionEvent, type CarPurchaseReversalEvent } from "./carPurchaseProWebhookFulfillment";
import { createCarPurchaseWebhookStore } from "./carPurchaseProWebhookStore";
import { createCarPurchaseExceptionStore, type CarPurchaseExceptionQuery } from "./carPurchaseProExceptionStore";
import { createCarPurchaseAlertOutbox } from "./carPurchaseProAlertOutbox";
import { deliverCarPurchaseOperatorAlert, type CarPurchaseAlertSender } from "./carPurchaseProOperatorAlerts";

type FulfillmentConfig = Parameters<typeof createCarPurchaseWebhookFulfillment>[0];
type AlertInput = CarPurchaseExceptionEvent | CarPurchaseReversalEvent;

// Preparation only: no route, connection or transport is created. A caller must
// continue shared routing on handled:false and retry alert_busy/delivery_failed.
export function createCarPurchaseWebhookPipeline(deps: Omit<FulfillmentConfig, "store" | "exceptionStore"> & {
  query: CarPurchaseExceptionQuery;
  sender: CarPurchaseAlertSender | null;
  checkAlertPrerequisites: (() => Promise<boolean>) | null;
}) {
  const config = { ...deps };
  const { query, sender, checkAlertPrerequisites, checkPrerequisites } = config;
  const store = createCarPurchaseWebhookStore(config);
  const exceptionStore = createCarPurchaseExceptionStore(config);
  const outbox = createCarPurchaseAlertOutbox({ query, expectedMode: config.expectedMode });
  return async function handle(payload: string, signature: string) {
    if (typeof query !== "function" || typeof sender !== "function" || typeof checkAlertPrerequisites !== "function"
      || typeof checkPrerequisites !== "function") return { ok: false as const, reason: "unavailable" as const };
    // Per-request capture prevents concurrent requests exchanging verified identities.
    // Capture only after the strict query adapter has accepted persistence evidence;
    // send only after fulfillment has independently accepted the same result.
    const captured: AlertInput[] = [];
    const fulfill = createCarPurchaseWebhookFulfillment({ ...config,
      checkPrerequisites: async (offer, mode) => await checkPrerequisites(offer, mode) === true
        && await checkAlertPrerequisites() === true,
      store: {
        applyPaidEventAndEntitlement: input => store.applyPaidEventAndEntitlement(input),
        async applyReversal(input) {
          const result = await store.applyReversal(input);
          captured.push(input);
          return result;
        },
      },
      exceptionStore: {
        async applyExceptionAndEnqueueAlert(input) {
          const result = await exceptionStore.applyExceptionAndEnqueueAlert(input);
          captured.push(input);
          return result;
        },
      },
    });
    const result = await fulfill(payload, signature);
    if (!result.ok || !result.handled) return result;
    if (captured.length === 0) return { ...result, alert: "not_requested" as const };
    if (captured.length !== 1) return { ok: false as const, reason: "alert_delivery_failed" as const, persisted: true as const };
    try {
      const delivered = await deliverCarPurchaseOperatorAlert(captured[0], outbox, sender);
      // A busy lease can later fail; without a connected independent retry worker,
      // acknowledging it would lose retry responsibility. The future HTTP adapter
      // must map this to a retryable response, not acknowledge successful delivery.
      if (delivered.outcome === "busy") return { ok: false as const, reason: "alert_busy" as const, persisted: true as const };
      return { ...result, alert: delivered.outcome };
    } catch {
      return { ok: false as const, reason: "alert_delivery_failed" as const, persisted: true as const };
    }
  };
}
