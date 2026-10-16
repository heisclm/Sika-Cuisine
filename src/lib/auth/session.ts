import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { Role } from "@prisma/client";

const SESSION_COOKIE_NAME = "sika_session_token";
const DEFAULT_SECRET = "sika_cuisine_super_secret_jwt_key_2026_sunyani_ghana_min_32_chars";
const SECRET_KEY = new TextEncoder().encode(
  process.env.AUTH_SECRET || process.env.JWT_SECRET || DEFAULT_SECRET
);

export interface SessionUser {
  id: string;
  email: string;
  fullName: string;
  phone: string;
  role: Role;
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
    .sign(SECRET_KEY);
}

/**
 * Verifies and decodes a signed JWT session token.
 */
export async function verifySessionToken(token: string): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET_KEY, {
      algorithms: ["HS256"],
    });

    return {
      id: payload.sub as string,
      email: payload.email as string,
      fullName: payload.fullName as string,
      phone: payload.phone as string,
      role: payload.role as Role,
    };
  } catch {
    return null;
  }
}

/**
 * Sets an HTTP-only, secure, SameSite session cookie.
 */
export async function setSessionCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
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
 * Clears the session cookie on logout.
 */
export async function clearSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}
