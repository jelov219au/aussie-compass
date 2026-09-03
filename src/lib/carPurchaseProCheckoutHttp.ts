import type { createCarPurchaseCheckoutCreation } from "./carPurchaseProCheckoutCreation";
import { readCarPurchaseRequestBody } from "./carPurchaseProRequestBody";

type Service = ReturnType<typeof createCarPurchaseCheckoutCreation>;
function json(body: object, status: number, extra: Record<string, string> = {}) {
  return Response.json(body, { status, headers: { "Cache-Control": "no-store", Pragma: "no-cache",
    "Referrer-Policy": "no-referrer", "X-Content-Type-Options": "nosniff", ...extra } });
}
function safeCheckoutUrl(value: string) {
  if (typeof value !== "string" || value.length > 8192) return false;
  try {
    const url = new URL(value);
    return url.origin === "https://checkout.stripe.com" && !url.username && !url.password
      && /^\/c\/pay\/cs_(test|live)_[A-Za-z0-9]{1,240}$/.test(url.pathname);
  } catch { return false; }
}

// JSON response contract for the future checkout UI. No cookie/access grant is
// issued here, and a successful create is not proof that payment completed.
export function createCarPurchaseCheckoutHttp(deps: {
  service: Service | null;
  enabled: boolean;
  expectedOrigin: string;
}) {
  return async function handle(request: Request): Promise<Response> {
    if (request.method !== "POST") return json({ code: "method_not_allowed" }, 405, { Allow: "POST" });
    try {
      const expected = new URL(deps.expectedOrigin);
      if (expected.origin !== deps.expectedOrigin || expected.protocol !== "https:") return json({ code: "checkout_unavailable" }, 503);
      if (request.headers.get("origin") !== expected.origin || new URL(request.url).origin !== expected.origin
        || request.headers.get("sec-fetch-site")?.toLowerCase() === "cross-site") return json({ code: "request_rejected" }, 403);
      if (deps.enabled !== true || !deps.service) return json({ code: "checkout_unavailable" }, 503);
      if (request.headers.get("content-type")?.split(";", 1)[0].trim().toLowerCase() !== "application/x-www-form-urlencoded") {
        return json({ code: "unsupported_content_type" }, 415);
      }
      const body = await readCarPurchaseRequestBody(request);
      if (typeof body === "number") return json({ code: body === 413 ? "request_too_large" : "invalid_request" }, body);
      const fields = new URLSearchParams(body);
      const names = ["terms_accepted", "terms_version"];
      if ([...fields.keys()].some(name => !names.includes(name)) || names.some(name => fields.getAll(name).length !== 1)) {
        return json({ code: "invalid_fields" }, 400);
      }
      const version = fields.get("terms_version")!;
      if (fields.get("terms_accepted") !== "yes" || !/^\d{4}-\d{2}-\d{2}$/.test(version)
        || !Number.isFinite(Date.parse(version)) || new Date(version).toISOString().slice(0, 10) !== version) {
        return json({ code: "checkout_invalid_terms" }, 400);
      }
      const result = await deps.service(version);
      if (result.ok !== true) {
        switch (result.reason) {
          case "invalid_terms": return json({ code: "checkout_invalid_terms" }, 400);
          case "already_purchased": return json({ code: "checkout_already_purchased" }, 409);
          case "retry_later": return json({ code: "checkout_retry_later" }, 503);
          case "sales_closed": return json({ code: "checkout_sales_closed" }, 503);
          case "support_required": return json({ code: "checkout_support_required" }, 503);
          case "provider_rejected": return json({ code: "checkout_provider_rejected" }, 503);
          default: return json({ code: "checkout_unavailable" }, 503);
        }
      }
      if (!safeCheckoutUrl(result.checkoutUrl)) return json({ code: "checkout_unavailable" }, 503);
      return json({ checkoutUrl: result.checkoutUrl }, 200);
    } catch { return json({ code: "checkout_unavailable" }, 503); }
  };
}
