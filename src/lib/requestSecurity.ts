import "server-only";

type MutationRequestOptions = {
  maxBodyBytes?: number;
  allowedContentTypes?: string[];
};

export type MutationRequestCheck =
  | { ok: true }
  | { ok: false; status: 400 | 403 | 413; error: string };

function normalizedContentType(value: string | null) {
  return value?.split(";", 1)[0]?.trim().toLowerCase() ?? "";
}

export async function validateSameOriginMutation(
  request: Request,
  options: MutationRequestOptions = {},
): Promise<MutationRequestCheck> {
  const origin = request.headers.get("origin");
  const fetchSite = request.headers.get("sec-fetch-site")?.toLowerCase();
  const explicitMutationProof = request.headers.get("x-hoju-compass-mutation") === "device-purge";
  const requiresOrigin = process.env.VERCEL_ENV === "production";

  if (!origin && requiresOrigin && fetchSite !== "same-origin" && !explicitMutationProof) {
    return { ok: false, status: 403, error: "Same-origin request evidence is required." };
  }

  if (origin && !explicitMutationProof) {
    try {
      if (new URL(origin).origin !== new URL(request.url).origin) {
        return { ok: false, status: 403, error: "Invalid request origin." };
      }
    } catch {
      return { ok: false, status: 403, error: "Invalid request origin." };
    }
  }

  if (fetchSite === "cross-site") {
    return { ok: false, status: 403, error: "Cross-site request rejected." };
  }

  const contentLengthHeader = request.headers.get("content-length");
  if (contentLengthHeader && options.maxBodyBytes) {
    const contentLength = Number(contentLengthHeader);
    if (!Number.isFinite(contentLength) || contentLength < 0) {
      return { ok: false, status: 400, error: "Invalid request length." };
    }
    if (contentLength > options.maxBodyBytes) {
      return { ok: false, status: 413, error: "Request body is too large." };
    }
  }

  if (options.allowedContentTypes?.length) {
    const contentType = normalizedContentType(request.headers.get("content-type"));
    if (!options.allowedContentTypes.includes(contentType)) {
      return { ok: false, status: 400, error: "Unsupported request content type." };
    }
  }

  if (options.maxBodyBytes) {
    try {
      const body = await request.clone().arrayBuffer();
      if (body.byteLength > options.maxBodyBytes) {
        return { ok: false, status: 413, error: "Request body is too large." };
      }
    } catch {
      return { ok: false, status: 400, error: "Invalid request body." };
    }
  }

  return { ok: true };
}
