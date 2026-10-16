# Sika Cuisine — Security Controls & Threat Mitigations

## 1. Price Tampering Defense
- **Threat:** Client inspects or intercepts request payload to alter dish prices, delivery fees, or cart totals.
- **Defense:** Server-Authoritative Calculation. In `src/app/actions/order.ts`, all incoming client prices and totals are discarded. The backend queries authoritative database records, recalculates line items, adds option deltas, computes delivery fees based on the verified Sunyani locality, and issues the immutable order.

## 2. Paystack Webhook Authentication & Replay Prevention
- **Threat:** Malicious actors sending spoofed `charge.success` HTTP requests or replaying old webhooks.
- **Defense:**
  1. Cryptographic HMAC SHA512 signature validation against `process.env.PAYSTACK_WEBHOOK_SECRET`.
  2. Timing-safe comparison using `crypto.timingSafeEqual` to thwart timing attacks.
  3. Unique constraint on `eventId` in `PaystackWebhookEvent` ensuring idempotent single-execution.

## 3. Session Security & CSRF
- **Authentication:** Stateless JWTs signed using `HS256` via `jose`.
- **Cookies:** `httpOnly: true`, `sameSite: "lax"`, and `secure: true` in production environments.
- **Passwords:** Salted bcrypt hashing with 12 rounds.

## 4. HTTP Headers & Content Security Policy
- `X-Frame-Options: DENY` (Clickjacking prevention).
- `X-Content-Type-Options: nosniff` (MIME sniffing prevention).
- `Referrer-Policy: strict-origin-when-cross-origin`.
- Restrictive image domains configured in `next.config.ts`.
