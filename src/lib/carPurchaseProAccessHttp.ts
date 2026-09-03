import type { createCarPurchaseAccessLifecycle } from "./carPurchaseProAccessLifecycle";
import { carPurchaseProAccessLifetimeSeconds } from "./carPurchaseProTokens";
import { readCarPurchaseRequestBody } from "./carPurchaseProRequestBody";

type Operation = "activate" | "restore" | "restore-code" | "release";
type Service = ReturnType<typeof createCarPurchaseAccessLifecycle>;
const destinations = { workspace: "/car-purchase-pro/workspace", released: "/car-purchase-pro?access=released" };

function json(body: object, status: number, extra: Record<string, string> = {}) {
  return Response.json(body, { status, headers: { "Cache-Control": "no-store", Pragma: "no-cache",
    "Referrer-Policy": "no-referrer", "X-Content-Type-Options": "nosniff", ...extra } });
}

export function createCarPurchaseAccessHttp(deps: {
  service: Service | null;
  enabled: boolean;
  expectedOrigin: string;
  environment: "production" | "development";
}) {
  const production = deps.environment !== "development";
  const cookieName = production ? "__Host-hoju_car_purchase_pro_access" : "hoju_car_purchase_pro_access";
  const cookie = (value: string, clear = false) => `${cookieName}=${value}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${clear ? 0 : carPurchaseProAccessLifetimeSeconds}${production ? "; Secure" : ""}${clear ? "; Expires=Thu, 01 Jan 1970 00:00:00 GMT" : ""}`;

  return async function handle(operation: Operation, request: Request): Promise<Response> {
    if (request.method !== "POST") return json({ code: "method_not_allowed" }, 405, { Allow: "POST" });
    try {
      const expected = new URL(deps.expectedOrigin);
      if (expected.origin !== deps.expectedOrigin || (production && expected.protocol !== "https:")
        || !["http:", "https:"].includes(expected.protocol)) return json({ code: "access_unavailable" }, 503);
      // Explicit mutation headers are not allowed to bypass Origin checks.
      if (request.headers.get("origin") !== expected.origin || new URL(request.url).origin !== expected.origin
        || request.headers.get("sec-fetch-site") === "cross-site") return json({ code: "request_rejected" }, 403);
      if (!deps.enabled || !deps.service) return json({ code: "access_unavailable" }, 503);

      const type = request.headers.get("content-type")?.split(";", 1)[0].trim().toLowerCase();
      const formOperation = operation === "activate" || operation === "restore";
      if ((formOperation || type) && type !== "application/x-www-form-urlencoded") return json({ code: "unsupported_content_type" }, 415);
      const body = await readCarPurchaseRequestBody(request);
      if (typeof body === "number") return json({ code: body === 413 ? "request_too_large" : "invalid_request" }, body);
      const fields = new URLSearchParams(body);
      const names = operation === "activate" ? ["session_id", "activation_nonce"] : operation === "restore" ? ["restore_code", "restore_nonce"] : [];
      if ([...fields.keys()].some(name => !names.includes(name)) || names.some(name => fields.getAll(name).length !== 1)) return json({ code: "invalid_fields" }, 400);

      const rawCookies = request.headers.get("cookie") ?? "";
      if (rawCookies.length > 8192) return json({ code: "invalid_cookie" }, 400);
      const values = rawCookies.split(";").map(part => part.trim()).filter(part => part.startsWith(cookieName + "=")).map(part => part.slice(cookieName.length + 1));
      if (values.length > 1 || (values[0]?.length ?? 0) > 4096) return json({ code: "invalid_cookie" }, 400);
      const token = values[0];
      if (operation === "activate" || operation === "restore") {
        const result = operation === "activate"
          ? await deps.service.activate(fields.get("session_id")!, fields.get("activation_nonce")!)
          : await deps.service.restore(fields.get("restore_code")!, fields.get("restore_nonce")!);
        if (!result.ok) return json({ code: `${operation}_${result.reason}` }, result.reason === "invalid" ? 400 : result.reason === "denied" ? 409 : 503);
        if (!/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]{43}$/.test(result.accessToken) || result.accessToken.length > 4096) return json({ code: "access_unavailable" }, 503);
        // Access credentials go only into the HttpOnly cookie, never JSON or a redirect URL.
        return json({ code: `${operation}_ready`, destination: destinations.workspace }, 200, { "Set-Cookie": cookie(result.accessToken) });
      }
      if (operation === "restore-code") {
        const result = await deps.service.issueRestoreCode(token);
        if (!result.ok) return json({ code: `restore_code_${result.reason}` }, result.reason === "unavailable" ? 503 : 401);
        return json({ code: result.code, expiresAt: result.expiresAt.toISOString() }, 200);
      }
      if (operation !== "release") return json({ code: "invalid_operation" }, 400);
      const result = await deps.service.release(token);
      if (!result.ok) return json({ code: "release_unavailable" }, 503);
      return json({ released: true, destination: destinations.released }, 200, { "Set-Cookie": cookie("", true) });
    } catch { return json({ code: "access_unavailable" }, 503); }
  };
}
