import "server-only";

type Handler = (payload: string, signature: string) => Promise<unknown>;
type Delegate = (payload: string, signature: string) => Promise<Response>;
const limit = 1024 * 1024;
const record = (value: unknown): value is Record<string, unknown> => !!value && typeof value === "object" && !Array.isArray(value);
function response(status: number) {
  return Response.json(status === 200 ? { received: true } : { error: status >= 500 ? "Webhook retry required." : "Webhook request rejected." },
    { status, headers: { "Cache-Control": "no-store", ...(status === 503 ? { "Retry-After": "60" } : {}),
      ...(status === 405 ? { Allow: "POST" } : {}) } });
}
async function rawBody(request: Request): Promise<string | number> {
  const length = request.headers.get("content-length");
  if (length !== null && (!/^\d+$/.test(length) || !Number.isSafeInteger(Number(length)))) return 400;
  if (length !== null && Number(length) > limit) return 413;
  if (!request.body || request.bodyUsed || request.body.locked) return 400;
  const reader = request.body.getReader(), chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > limit) { void reader.cancel().catch(() => {}); return 413; }
      chunks.push(value);
    }
    if (size === 0 || (length !== null && Number(length) !== size)) return 400;
    const bytes = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
    // ignoreBOM:true preserves a leading BOM rather than silently stripping it.
    // Decode once; never parse, trim or reserialize before Stripe verification.
    return new TextDecoder("utf-8", { fatal: true, ignoreBOM: true }).decode(bytes);
  } catch { void reader.cancel().catch(() => {}); return 400; }
  finally { reader.releaseLock(); }
}

// Isolated POST factory. No new route is mounted and no fallback ACK is allowed.
export function createCarPurchaseWebhookHttp(deps: { handle: Handler | null; continueOtherProducts?: Delegate | null }) {
  const { handle, continueOtherProducts } = deps;
  return async function post(request: Request): Promise<Response> {
    if (typeof handle !== "function") return response(503);
    if (request.method !== "POST") return response(405);
    const signature = request.headers.get("stripe-signature");
    if (!signature || signature.length > 4096) return response(400);
    if (request.headers.get("content-type")?.split(";", 1)[0].trim().toLowerCase() !== "application/json"
      || ![null, "identity"].includes(request.headers.get("content-encoding"))) return response(415);
    const payload = await rawBody(request);
    if (typeof payload !== "string") return response(payload);
    try {
      const result = await handle(payload, signature);
      if (!record(result)) return response(503);
      if (result.ok === true && result.handled === false && Object.keys(result).length === 2) {
        if (typeof continueOtherProducts !== "function") return response(503);
        const other = await continueOtherProducts(payload, signature);
        if (!(other instanceof Response)) return response(503);
        const headers = new Headers(other.headers);
        headers.set("Cache-Control", "no-store");
        return new Response(other.body, { status: other.status, statusText: other.statusText, headers });
      }
      if (result.ok === true && result.handled === true && Object.keys(result).length === 4
        && typeof result.outcome === "string" && ["processed", "duplicate", "tombstoned", "ignored_stale"].includes(result.outcome)
        && typeof result.alert === "string" && ["sent", "already_sent", "not_requested"].includes(result.alert)
        && (result.outcome !== "ignored_stale" || result.alert === "not_requested")) return response(200);
      if (result.ok === false && Object.keys(result).length === 2 && typeof result.reason === "string"
        && ["invalid_signature", "invalid_event", "wrong_environment", "contract_mismatch"].includes(result.reason)) return response(400);
      // unavailable, persistence_failed, alert_busy, alert_delivery_failed and any
      // malformed/unknown result all retain retry responsibility with 503.
      return response(503);
    } catch { return response(503); }
  };
}
