import { getAppUrl, getSiteOrigin } from "@/lib/env";

/**
 * Validates the HTTP `Origin` header on cookie-authenticated state-changing requests.
 * Native mobile Bearer requests and same-origin browser calls pass; forged cross-origin
 * form/fetch submissions from third-party sites are rejected.
 */
export function verifySameOriginMutation(req: Request): boolean {
  const authHeader = req.headers.get("authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return true;
  }

  const originHeader = req.headers.get("origin")?.trim();
  if (!originHeader) {
    // Direct non-browser clients (e.g., server tools / curl) without an Origin header.
    return true;
  }

  let normalizedOrigin: string;
  try {
    normalizedOrigin = new URL(originHeader).origin;
  } catch {
    return false;
  }

  const allowedOrigins = new Set<string>();
  try {
    allowedOrigins.add(new URL(req.url).origin);
  } catch {
  }
  try {
    allowedOrigins.add(new URL(getAppUrl()).origin);
  } catch {
  }
  try {
    allowedOrigins.add(new URL(getSiteOrigin()).origin);
  } catch {
  }

  const forwardedHost = req.headers.get("x-forwarded-host")?.split(",")[0]?.trim();
  const forwardedProto =
    req.headers.get("x-forwarded-proto")?.split(",")[0]?.trim() || "https";
  if (forwardedHost) {
    try {
      allowedOrigins.add(new URL(`${forwardedProto}://${forwardedHost}`).origin);
    } catch {
    }
  }

  const hostHeader = req.headers.get("host")?.trim();
  if (hostHeader) {
    try {
      const reqIsHttp = req.url.startsWith("http://");
      const protocol =
        reqIsHttp ||
        hostHeader.startsWith("localhost") ||
        hostHeader.startsWith("127.") ||
        hostHeader.startsWith("10.") ||
        hostHeader.startsWith("192.168.")
          ? "http"
          : forwardedProto;
      allowedOrigins.add(new URL(`${protocol}://${hostHeader}`).origin);
    } catch {
    }
  }

  return allowedOrigins.has(normalizedOrigin);
}
