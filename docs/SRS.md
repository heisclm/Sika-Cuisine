# Sika Cuisine — Software Requirements Specification (SRS)

**Target Stack:** Next.js 16 (App Router), TypeScript, Tailwind CSS, PostgreSQL, Prisma ORM, Paystack  
**Location:** Sunyani, Bono Region, Ghana  

---

## 1. Functional Requirements

### FR-01: Currency & Financial Precision
- All monetary amounts in the database, API payloads, calculations, and Paystack transactions MUST be stored and computed as **integer pesewas** ($1\text{ GHS} = 100\text{ pesewas}$).
- No floating-point multiplication or division for financial totals.
- Shared formatter `formatPesewasToGhs` displays `5000` as `"GH₵50.00"`.

### FR-02: Server-Authoritative Pricing
- When `/api/actions/order` is executed, the backend validates item IDs and option IDs against the authoritative database.
- Client-supplied prices and totals are strictly ignored.
- Delivery fee is recomputed based on the customer's selected Sunyani locality.
- Snapshots of item names, option names, and unit prices are immutably written to `OrderItem`.

### FR-03: Paystack Payment Gateway
- Server initiates Paystack transaction via `POST /transaction/initialize`.
- Transaction `amount` sent to Paystack in integer pesewas.
- Webhook endpoint `/api/webhooks/paystack` validates `x-paystack-signature` using HMAC SHA512.
- Webhook events are processed idempotently by recording event IDs in `PaystackWebhookEvent`.
- Browser redirect does NOT mark orders as paid; only verified webhook or server-to-server verification updates status.

### FR-04: Order Fulfilment State Machine
- Fulfilment status transitions:
  - `PENDING_CONFIRMATION` ➔ `CONFIRMED` ➔ `PREPARING` ➔ `OUT_FOR_DELIVERY` / `READY_FOR_COLLECTION` ➔ `COMPLETED`
  - Rejection: `PENDING_CONFIRMATION` ➔ `REJECTED`
  - Cancellation: `PENDING_CONFIRMATION` / `CONFIRMED` ➔ `CANCELLED`
- Customers cannot update their own order statuses to paid or delivered.

### FR-05: Premium Visual Interaction
- Add-to-cart flying micro-interaction animates dish representation towards the header cart icon.
- Cart drawer displays real-time item counts, options breakdown, and GHS totals.
- Motion obeys the `prefers-reduced-motion` media query.

---

## 2. Non-Functional Requirements

- **Performance:** Sub-1-second initial load, Turbopack optimized bundle size, self-hosted web fonts.
- **Security:** CSP headers, XSS prevention, SQL injection immunity via Prisma, timing-safe cryptographic comparisons.
- **Availability:** Offline resilience with fallback data structures if database pool experiences transient latency.
- **Accessibility:** WCAG AA contrast compliance on dark backgrounds, full keyboard navigation, aria-labels for icon buttons.
