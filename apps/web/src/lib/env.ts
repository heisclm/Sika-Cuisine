/**
 * @file apps/web/src/lib/env.ts
 * @description Centralized environment URL resolution and safe boolean diagnostics
 * for Sika Cuisine Web, API handlers, SEO metadata, and health checks.
 */

const DEFAULT_PUBLIC_ORIGIN = "https://sikacuisine.com";
const DEFAULT_DEV_ORIGIN = "http://localhost:3000";

function normalizeOrigin(raw?: string): string {
  return (raw || "").trim().replace(/\/+$/, "");
}

function isLocalhostUrl(url: string): boolean {
  return /^https?:\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0)(:\d+)?(\/|$)/i.test(url);
}

/**
 * Resolves the runtime application URL used for transactional emails,
 * password reset/invite links, and Paystack callback URLs.
 */
export function getAppUrl(): string {
  const configured = normalizeOrigin(process.env.NEXT_PUBLIC_APP_URL);
  if (configured) return configured;
  return process.env.NODE_ENV === "production"
    ? DEFAULT_PUBLIC_ORIGIN
    : DEFAULT_DEV_ORIGIN;
}

/**
 * Resolves the canonical public website origin used in SEO `metadataBase`,
 * `sitemap.xml`, `robots.txt`, and JSON-LD schemas so localhost never leaks to crawlers.
 */
export function getSiteOrigin(): string {
  const configured = normalizeOrigin(process.env.NEXT_PUBLIC_APP_URL);
  if (configured && !isLocalhostUrl(configured)) {
    return configured;
  }
  return DEFAULT_PUBLIC_ORIGIN;
}

export interface EnvDiagnostics {
  databaseConfigured: boolean;
  authSecretStrong: boolean;
  paystackConfigured: boolean;
  paystackMode: "live" | "test" | "unconfigured";
  redisRateLimitConfigured: boolean;
  storageConfigured: boolean;
  emailConfigured: boolean;
  smsConfigured: boolean;
}

/**
 * Returns non-secret operational configuration booleans for runtime health telemetry.
 */
export function getEnvDiagnostics(): EnvDiagnostics {
  const paystackSecret = process.env.PAYSTACK_SECRET_KEY?.trim() || "";
  const authSecret =
    process.env.AUTH_SECRET?.trim() || process.env.JWT_SECRET?.trim() || "";
  const smsConfigured =
    Boolean(process.env.ARKESEL_API_KEY?.trim()) ||
    Boolean(
      process.env.HUBTEL_CLIENT_ID?.trim() && process.env.HUBTEL_CLIENT_SECRET?.trim()
    );

  return {
    databaseConfigured: Boolean(process.env.DATABASE_URL?.trim()),
    authSecretStrong: authSecret.length >= 32,
    paystackConfigured: Boolean(paystackSecret),
    paystackMode: !paystackSecret
      ? "unconfigured"
      : paystackSecret.startsWith("sk_live_")
      ? "live"
      : "test",
    redisRateLimitConfigured: Boolean(
      process.env.UPSTASH_REDIS_REST_URL?.trim() &&
        process.env.UPSTASH_REDIS_REST_TOKEN?.trim()
    ),
    storageConfigured: Boolean(
      process.env.SUPABASE_URL?.trim() &&
        (process.env.SUPABASE_SECRET_KEY?.trim() ||
          process.env.SUPABASE_SERVICE_ROLE_KEY?.trim())
    ),
    emailConfigured: Boolean(process.env.RESEND_API_KEY?.trim()),
    smsConfigured,
  };
}
