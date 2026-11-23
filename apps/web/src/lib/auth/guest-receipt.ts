import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const GUEST_RECEIPT_COOKIE_NAME = "sika_guest_receipts";
const DEV_FALLBACK_SECRET =
  "sika_cuisine_dev_only_secret_key_sunyani_ghana_min_32_bytes";

function getSigningKey(): Uint8Array {
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

export async function readGuestReceiptOrderNumbers(): Promise<string[]> {
  try {
    const cookieStore = await cookies();
    const raw = cookieStore.get(GUEST_RECEIPT_COOKIE_NAME)?.value;
    if (!raw) return [];
    const { payload } = await jwtVerify(raw, getSigningKey(), {
      algorithms: ["HS256"],
    });
    const list = payload.orders;
    if (!Array.isArray(list)) return [];
    return list
      .filter((entry): entry is string => typeof entry === "string")
      .map((entry) => entry.trim().toUpperCase());
  } catch {
    return [];
  }
}

/**
 * Appends an order number to the HttpOnly signed guest-receipt cookie (`24h` TTL, max 10 orders)
 * so Web guest buyers can inspect full delivery contact/address details after checkout
 * without exposing PII to arbitrary third-party tracking lookups.
 */
export async function setGuestReceiptCookie(orderNumber: string): Promise<void> {
  const normalized = orderNumber.trim().toUpperCase();
  if (!normalized) return;

  const existing = await readGuestReceiptOrderNumbers();
  const merged = [normalized, ...existing.filter((n) => n !== normalized)].slice(0, 10);

  const token = await new SignJWT({ orders: merged })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(getSigningKey());

  const cookieStore = await cookies();
  cookieStore.set(GUEST_RECEIPT_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24,
  });
}

/**
 * Checks whether the current browser holds a signed guest-receipt cookie authorizing
 * PII display for `orderNumber`.
 */
export async function hasGuestReceiptAccess(orderNumber: string): Promise<boolean> {
  const normalized = orderNumber.trim().toUpperCase();
  if (!normalized) return false;
  const list = await readGuestReceiptOrderNumbers();
  return list.includes(normalized);
}
