import { SignJWT, jwtVerify } from "jose";
import { cookies, headers } from "next/headers";
import { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getAppUrl } from "@/lib/env";

const SESSION_COOKIE_NAME = "sika_session_token";
const DEV_FALLBACK_SECRET =
  "sika_cuisine_dev_only_secret_key_sunyani_ghana_min_32_bytes";

/**
 * Resolves the HMAC-SHA256 signing key lazily at request time.
 * Fails hard in production if AUTH_SECRET / JWT_SECRET is absent or under 32 characters.
 */
function getJwtSecretKey(): Uint8Array {
  const configured = process.env.AUTH_SECRET || process.env.JWT_SECRET;
  if (configured && configured.trim().length >= 32) {
    return new TextEncoder().encode(configured.trim());
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "Security configuration error: AUTH_SECRET or JWT_SECRET (min 32 chars) must be set in production."
    );
  }

  return new TextEncoder().encode(DEV_FALLBACK_SECRET);
}

export interface SessionUser {
  id: string;
  email: string;
  fullName: string;
  phone: string;
  role: Role;
  createdAt?: string;
  tokenIssuedAt?: number;
}

export type AuthVerificationResult =
  | { state: "authenticated"; user: SessionUser }
  | { state: "unauthenticated" | "revoked" }
  | { state: "db_unavailable"; fallbackUser: SessionUser };

const USER_STATUS_CACHE_TTL_MS = 15_000;
const MAX_USER_CACHE_ENTRIES = 500;
const userStatusCache = new Map<
  string,
  { user: SessionUser | null; passwordChangedAtMs: number | null; expiresAt: number }
>();

/**
 * Immediately clears a cached auth verification record after an account deactivation, password reset, or role change.
 */
export function invalidateUserSessionCache(userId: string): void {
  userStatusCache.delete(userId);
}

function writeUserStatusCache(
  userId: string,
  user: SessionUser | null,
  passwordChangedAtMs: number | null = null
): void {
  if (userStatusCache.size >= MAX_USER_CACHE_ENTRIES) {
    const oldestKey = userStatusCache.keys().next().value;
    if (oldestKey) userStatusCache.delete(oldestKey);
  }
  userStatusCache.set(userId, {
    user,
    passwordChangedAtMs,
    expiresAt: Date.now() + USER_STATUS_CACHE_TTL_MS,
  });
}

/**
 * Encrypts user identity into a tamper-proof signed JWT.
 */
export async function createSessionToken(user: SessionUser): Promise<string> {
  return new SignJWT({
    sub: user.id,
    email: user.email,
    fullName: user.fullName,
    phone: user.phone,
    role: user.role,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getJwtSecretKey());
}

/**
 * Verifies and decodes a signed JWT session token.
 */
export async function verifySessionToken(token: string): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, getJwtSecretKey(), {
      algorithms: ["HS256"],
    });

    return {
      id: payload.sub as string,
      email: payload.email as string,
      fullName: payload.fullName as string,
      phone: payload.phone as string,
      role: payload.role as Role,
      tokenIssuedAt: typeof payload.iat === "number" ? payload.iat : undefined,
    };
  } catch {
    return null;
  }
}

/**
 * Determines whether auth cookies should carry the `Secure` attribute.
 * Enables `Secure` on HTTPS deployments while permitting local HTTP testing
 * (e.g. `npm start` on `http://localhost:3000` or LAN IPs).
 */
export async function shouldUseSecureCookies(): Promise<boolean> {
  if (process.env.NODE_ENV !== "production") return false;

  try {
    const headerStore = await headers();
    const forwardedProto = headerStore
      .get("x-forwarded-proto")
      ?.split(",")[0]
      ?.trim()
      .toLowerCase();
    if (forwardedProto === "https") return true;
    if (forwardedProto === "http") return false;

    const origin = headerStore.get("origin")?.trim().toLowerCase();
    if (origin?.startsWith("https://")) return true;
    if (origin?.startsWith("http://")) return false;

    const host = headerStore.get("host")?.trim().toLowerCase() || "";
    if (
      host.startsWith("localhost") ||
      host.startsWith("127.") ||
      host.startsWith("10.") ||
      host.startsWith("192.168.")
    ) {
      return false;
    }
  } catch {
    // Outside request context; fall back to configured app URL protocol
  }

  return getAppUrl().startsWith("https://");
}

/**
 * Sets an HTTP-only, SameSite session cookie (with `Secure` on HTTPS origins).
 */
export async function setSessionCookie(token: string): Promise<void> {
  const [cookieStore, secure] = await Promise.all([
    cookies(),
    shouldUseSecureCookies(),
  ]);
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

/**
 * Reads and verifies the current session from incoming request cookies.
 */
export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

/**
 * Verifies Bearer or HttpOnly cookie JWT and checks live account `isActive` + `role`
 * against PostgreSQL (with a 15-second per-user cache to collapse concurrent dashboard bursts).
 * Distinguishes explicit account deactivation (`revoked`) from transient DB connectivity failures
 * (`db_unavailable`) so temporary network timeouts never wipe valid user cookies.
 */
export async function verifyAuthUserStatus(
  req?: Request
): Promise<AuthVerificationResult> {
  let verified: SessionUser | null = null;

  if (req) {
    const authHeader = req.headers.get("authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const bearerToken = authHeader.substring(7).trim();
      verified = await verifySessionToken(bearerToken);
    }
  }

  if (!verified) {
    try {
      verified = await getSession();
    } catch {
      verified = null;
    }
  }

  if (!verified) {
    return { state: "unauthenticated" };
  }

  if (!process.env.DATABASE_URL?.trim()) {
    return { state: "authenticated", user: verified };
  }

  const isTokenRevokedByPasswordChange = (
    passwordChangedAtMs: number | null,
    tokenIssuedAt?: number
  ): boolean => {
    if (!passwordChangedAtMs || !tokenIssuedAt) return false;
    // Allow 2s clock tolerance between token creation and passwordChangedAt write
    return tokenIssuedAt < Math.floor(passwordChangedAtMs / 1000) - 2;
  };

  const cached = userStatusCache.get(verified.id);
  if (cached && cached.expiresAt > Date.now()) {
    if (
      !cached.user ||
      isTokenRevokedByPasswordChange(cached.passwordChangedAtMs, verified.tokenIssuedAt)
    ) {
      return { state: "revoked" };
    }
    return { state: "authenticated", user: cached.user };
  }

  try {
    const dbUser = await prisma.user.findUnique({
      where: { id: verified.id },
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        role: true,
        isActive: true,
        passwordChangedAt: true,
        createdAt: true,
      },
    });

    if (!dbUser || !dbUser.isActive) {
      writeUserStatusCache(verified.id, null, null);
      return { state: "revoked" };
    }

    const passwordChangedAtMs = dbUser.passwordChangedAt
      ? dbUser.passwordChangedAt.getTime()
      : null;

    const freshUser: SessionUser = {
      id: dbUser.id,
      email: dbUser.email,
      fullName: dbUser.fullName,
      phone: dbUser.phone,
      role: dbUser.role,
      createdAt: dbUser.createdAt.toISOString(),
    };
    writeUserStatusCache(verified.id, freshUser, passwordChangedAtMs);

    if (isTokenRevokedByPasswordChange(passwordChangedAtMs, verified.tokenIssuedAt)) {
      return { state: "revoked" };
    }
    return { state: "authenticated", user: freshUser };
  } catch (err) {
    console.warn("[AuthSession] Live DB verification failed:", err);
    return { state: "db_unavailable", fallbackUser: verified };
  }
}

/**
 * Dual-mode fail-closed authenticator used across protected API routes.
 * Returns the verified active user or `null`.
 */
export async function getAuthUser(req?: Request): Promise<SessionUser | null> {
  const verification = await verifyAuthUserStatus(req);
  if (verification.state === "authenticated") {
    return verification.user;
  }
  return null;
}

/**
 * Clears the session cookie on logout.
 */
export async function clearSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}
