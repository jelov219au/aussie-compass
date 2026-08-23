import { requireLocalOperatorAccess } from "@/lib/operatorOnly";
import { saveLocalOperatorConnection } from "@/lib/localOperatorConnection";
import { validateSameOriginMutation } from "@/lib/requestSecurity";

function isLoopback(hostname: string) {
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "[::1]";
}

function isSafeToken(value: string) {
  return value.length >= 20 && value.length <= 512 && !/[\r\n]/.test(value);
}

export async function POST(request: Request) {
  requireLocalOperatorAccess();

  const requestUrl = new URL(request.url);
  if (!isLoopback(requestUrl.hostname)) return new Response("Forbidden", { status: 403 });

  const security = await validateSameOriginMutation(request, {
    maxBodyBytes: 4 * 1024,
    allowedContentTypes: ["application/x-www-form-urlencoded", "multipart/form-data"],
  });
  if (!security.ok) {
    return new Response(security.error, {
      status: security.status,
      headers: { "Cache-Control": "no-store" },
    });
  }

  const form = await request.formData();
  const vercelToken = String(form.get("vercel_token") ?? "").trim();
  const vercelTeamId = String(form.get("vercel_team_id") ?? "").trim();
  const stripePerformanceKey = String(form.get("stripe_performance_key") ?? "").trim();

  const hasVercelToken = vercelToken.length > 0;
  const hasVercelTeamId = vercelTeamId.length > 0;
  const hasStripeKey = stripePerformanceKey.length > 0;
  const invalidVercelToken = hasVercelToken && !isSafeToken(vercelToken);
  const invalidVercelTeamId = hasVercelTeamId && !/^team_[A-Za-z0-9]+$/.test(vercelTeamId);
  const invalidStripeKey = hasStripeKey && !/^rk_(?:test|live)_[A-Za-z0-9]+$/.test(stripePerformanceKey);
  if ((!hasVercelToken && !hasVercelTeamId && !hasStripeKey) || invalidVercelToken || invalidVercelTeamId || invalidStripeKey) {
    return Response.redirect(new URL("/resume-pro-performance?connection=invalid", requestUrl), 303);
  }

  await saveLocalOperatorConnection({
    vercelToken: hasVercelToken ? vercelToken : undefined,
    vercelTeamId: hasVercelTeamId ? vercelTeamId : undefined,
    stripePerformanceKey: hasStripeKey ? stripePerformanceKey : undefined,
  });
  return Response.redirect(new URL("/resume-pro-performance?connection=saved", requestUrl), 303);
}
