# Sika Cuisine — Premium Web Ordering & Delivery System

A modern, high-performance web-based food ordering, payment, and delivery tracking platform built specifically for **Sika Cuisine Restaurant** in **Sunyani, Bono Region, Ghana**.

Built with **Next.js 16 (App Router)**, **TypeScript**, **Tailwind CSS**, **PostgreSQL**, **Prisma ORM**, and official **Paystack** payment integration.

---

## 🌟 Key Capabilities

1. **Strict Integer Pesewas Standard (Zero Floating-Point Drift):**
   - Monetary values are stored and calculated strictly as integer pesewas ($1\text{ GHS} = 100\text{ pesewas}$).
   - $\text{GH₵}50.00 = 5000\text{ pesewas}$, $\text{GH₵}125.50 = 12550\text{ pesewas}$.
   - Full currency formatter with localization and safe integer arithmetic (`src/lib/currency.ts`).

2. **Server-Authoritative Pricing & Checkout:**
   - Client-provided totals and line prices are strictly discarded.
   - The server re-computes subtotal, options delta, Sunyani zone delivery fees, and grand total from authoritative database snapshots.
   - Immutable price and name snapshots stored with every line item (`OrderItem`).

3. **Cinematic Culinary Interface:**
   - Dark aesthetic with radial glows (`#0a0a0d` to `#18181f`) and rich red gradients (`#e50914`).
   - Self-hosted editorial serif headlines (*Playfair Display*) and clean geometric sans-serif (*Plus Jakarta Sans*).
   - Protruding 3D circular plate showcase inspired by high-end dining interfaces.
   - Framer Motion add-to-cart flying micro-animation respecting reduced motion preferences.

4. **Sunyani Delivery Zone Matrix:**
   - Automated delivery fee and timeline calculation tailored for Sunyani localities:
     - Sunyani Central / Market Area
     - Fiapre & UENR Campus
     - Berlin Top
     - Abesim
     - New Dormaa
     - Penkwase
     - Airport Residential Area, Sunyani
     - Kotokrom

5. **Official Paystack Payment Integration:**
   - Server-side transaction initialization (`amount` in integer pesewas, currency `GHS`).
   - Supports Ghanaian payment channels: MTN Mobile Money, Telecel Cash, AT Money, and Debit/Credit Cards.
   - Cryptographically verified HMAC SHA512 webhook signature verification with timing-safe comparison.
   - Idempotent webhook event ledger preventing duplicate order fulfillment.

6. **Live Multi-Stage Order Tracking:**
   - Real-time visual timeline (`PENDING_CONFIRMATION` ➔ `CONFIRMED` ➔ `PREPARING` ➔ `OUT_FOR_DELIVERY` / `READY_FOR_COLLECTION` ➔ `COMPLETED`).
   - Grounded in actual kitchen statuses without fabricated GPS coordinates.

7. **Staff & Kitchen Administration Portal (`/admin`):**
   - Live incoming order board with revenue metrics and prep time trackers.
   - Valid status machine transitions (Accept, Prepare, Dispatch, Complete, Reject).
   - Real-time menu item availability controls.

---

## 🚀 Quick Start

### 1. Prerequisites
- **Node.js:** `v24.11.1` or `v20.x` LTS
- **npm:** `v10+` or `v11+`
- **PostgreSQL / Supabase:** PostgreSQL 14+ database instance

### 2. Environment Setup
Copy the environment template:
```bash
cp .env.example .env.local
```
Fill in your `DATABASE_URL`, `DIRECT_URL`, and Paystack API keys.

### 3. Install Dependencies
```bash
npm install
```

### 4. Database Setup & Seeding
```bash
# Generate Prisma Client
npx prisma generate

# Push schema to PostgreSQL database
npm run db:push

# Seed authentic Sunyani dishes and initial admin/staff accounts
npm run db:seed
```

### 5. Run Verification Test Suite
```bash
node scripts/test-currency.ts
```

### 6. Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📂 Project Structure

```
sika-cuisine/
├── prisma/
│   ├── schema.prisma                  # PostgreSQL schema definitions & relations
│   └── seed.ts                        # Curated Sunyani menu & test users
├── public/                            # Static images and icons
├── scripts/
│   └── test-currency.ts               # Currency engine unit test suite
├── src/
│   ├── app/
│   │   ├── (auth)/login/              # Staff & Customer authentication
│   │   ├── about/                     # Culinary heritage & Sunyani kitchen
│   │   ├── actions/                   # Server-authoritative mutations
│   │   │   └── order.ts               # Secure checkout & order creation
│   │   ├── admin/                     # Staff live order board & analytics
│   │   ├── api/webhooks/paystack/     # HMAC-verified idempotent webhook receiver
│   │   ├── checkout/                  # Sunyani delivery & Paystack payment
│   │   ├── contact/                   # Kitchen phone, location, & inquiry form
│   │   ├── menu/                      # Menu catalog, search, & option modal
│   │   ├── orders/[orderNumber]/      # Live multi-stage tracking timeline
│   │   ├── layout.tsx                 # Root layout with fonts & cart provider
│   │   └── page.tsx                   # Cinematic showcase homepage
│   ├── components/
│   │   ├── cart/                      # Cart drawer & flying item animation
│   │   ├── layout/                    # Navbar & Footer with Sunyani branding
│   │   └── menu/                      # Dish customizer modal
│   ├── context/
│   │   └── CartContext.tsx            # Global cart state in integer pesewas
│   ├── lib/
│   │   ├── auth/                      # Password hashing & JWT sessions
│   │   ├── currency.ts                # Strict integer pesewas math engine
│   │   ├── delivery-zones.ts          # Sunyani delivery matrix & fees
│   │   ├── paystack.ts                # Server Paystack API & HMAC verifier
│   │   ├── prisma.ts                  # Singleton Prisma Client
│   │   └── validation/                # Zod schemas (orders & auth)
│   └── types/                         # Shared TypeScript domain contracts
└── docs/                              # Architecture, BRD, SRS, & Security docs
```

---

## 🔒 Security Architecture

- **Zero Client Trust:** Prices, item availability, delivery fees, and discounts are strictly re-verified on the server.
- **Timing-Safe HMAC:** Paystack webhooks verify `x-paystack-signature` using `crypto.timingSafeEqual`.
- **Database Idempotency:** Webhook event IDs are deduplicated in `PaystackWebhookEvent`.
- **Protected Secrets:** Payment secret keys are strictly server-only and excluded from client bundles.
- **Input Sanitization:** All untrusted customer inputs validated through Zod schemas.
