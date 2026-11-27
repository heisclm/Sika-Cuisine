# Sika Cuisine — Full-Stack Web & Native Mobile Ordering Platform

A production-ready online food ordering, Paystack payment, kitchen operations, and Sunyani courier dispatch monorepo built for **Sika Cuisine Restaurant** on Commercial Street, **Sunyani Central, Bono Region, Ghana**.

Built across **Web (`apps/web`)**, **Native Mobile (`apps/mobile`)**, and **Shared Domain Core (`packages/shared`)** using **Next.js 16.4.6 (App Router)**, **Expo SDK 58 / React Native**, **TypeScript**, **PostgreSQL (Supabase)**, **Prisma ORM**, and **Paystack**.

---

## Key Platform Capabilities

1. **Strict Integer Pesewas Financial Standard:**
   - All prices, option deltas, Sunyani delivery tariffs, and subtotals are stored and calculated strictly in integer pesewas (`100 pesewas = GH₵ 1.00`, e.g. `4000 = GH₵ 40.00`).
   - Formatting and arithmetic are shared across Web, Mobile, and API routes via `packages/shared`.

2. **Unified Server-Authoritative Checkout & Idempotency:**
   - Both Web (`/checkout`) and Mobile (`CheckoutScreen`) submit directly to `POST /api/v1/orders` with an `Idempotency-Key` header to prevent duplicate orders on unstable connections.
   - The server discards client-submitted prices, verifies item availability and live PostgreSQL menu/option prices, calculates Sunyani zone tariffs (`GH₵ 0.00` for Counter Pickup), persists orders atomically via `prisma.$transaction`, and initializes live Paystack transactions when `paymentMethod === "PAYSTACK"`.

3. **Brand Design & Editorial Food Presentation:**
   - Deep Black (`#101010`), Charcoal (`#1C1C1C`), Elevated Dark (`#262626`), Crimson Red (`#D71920`), Readable Red (`#F0444A`), and Warm White (`#F5F1EA`).
   - Synchronized 4:3 dark-moody Ghanaian culinary photography shared between `apps/web/public/images/dishes/` and `apps/mobile/assets/dishes/`.
   - In-card live `− qty +` steppers, floating mobile-web Order Tray bar, live `Kitchen Open` / `Ordering Paused` status pills, and active customer order banners.

4. **Automatic Role-Switched Native Mobile App (`apps/mobile`):**
   - **Customer-First Auth + Discreet Rider Portal:** Defaults to Customer Sign In / Create Account / Track as Guest, with a subtle footer link (*`Sika Delivery Team? Rider Portal Sign In →`*) for couriers.
   - **Customer Shell (4 Tabs):** `Home`, `Menu`, `Orders`, `Account` with SecureStore JWT persistence, live menu caching, and offline order history caching.
   - **Delivery Rider Shell (`DELIVERY_RIDER`, 3 Tabs):** Automatically switches to **`SIKA DISPATCH`** upon courier sign-in (`Active Drops`, `Completed`, `Rider Hub`), with 15-second live polling, unmistakable `COLLECT CASH ON DELIVERY` vs `PREPAID (PAYSTACK)` payment strips, Sunyani locality/landmark-first address cards, one-tap Customer Call & Google Maps launch, COD cash handover confirmation, and shift reconciliation totals.
   - **Admin/Staff Redirect:** Non-courier staff signing into mobile see a direct prompt to open the full Web Operations Console (`/admin`).

5. **Web Operations & Admin CMS (`/admin`):**
   - **Kitchen & Dispatch KDS:** 15-second live queue, role-enforced state machine transitions, and rider assignment.
   - **Analytics & Performance Suite (`/admin` → Analytics & Performance):** Interactive Daily (24h), Weekly (7d), Monthly (30d), and Yearly (12m) revenue & order volume charts, period-over-period growth deltas, Top-Selling Dishes & Sunyani delivery zone leaderboards, per-worker throughput & speed tables (Delivery Rider COD cash reconciliation & road times, Cashier confirmation speeds, Kitchen KDS prep times), Customer retention cohorts & VIP leaderboard, plus 1-click CSV report export.
   - **Automated Paystack Refunds:** Automatic full Paystack refund initiation (`POST /refund`) whenever a paid online order is rejected or cancelled, with live refund polling reconciliation (`GET /refund/:id`), `refund.processed` / `refund.failed` webhook handling, and a Super Admin manual retry endpoint.
   - **Menu Catalog Manager:** Full Create/Edit Dish modal with Supabase Storage (or local) photo upload, availability toggles, and option groups.
   - **Settings & Sunyani Delivery Zones:** Live Kitchen Open / Ordering Paused switch, pickup/delivery toggles, operating hours, and zone tariff editor.
   - **Team & Invite Provisioning (`ADMIN`-only):** Invite-first creation for Kitchen Staff, Cashiers, Delivery Riders, and Administrators using **24-hour Private Setup Links** (Email, SMS, Clipboard Copy, or WhatsApp share) plus instant suspension (`User.isActive = false`).

6. **Multi-Channel Notifications, In-App Bell & Account Recovery:**
   - Branded HTML business email receipts, status updates, refund receipts & password resets via **Free Gmail App Password SMTP** (`GMAIL_USER` + `GMAIL_APP_PASSWORD`), generic SMTP, or **Resend** (`RESEND_API_KEY`).
   - Real-time **In-App Notification Bell** (`InAppNotification`) across both Web (`Navbar`) and Mobile (`MobileNotificationBell`).
   - Ghanaian SMS (Arkesel v2 / Hubtel fallback), Expo Push notifications, self-service `/forgot-password` & `/reset-password`, and PostgreSQL `NotificationLog` audit trail.

7. **Production SEO, Security Headers & CI:**
   - Server-rendered `/menu/[slug]` dish pages with dynamic `generateMetadata()`, Schema.org `Restaurant`, `MenuItem` (`GHS`), and `BreadcrumbList` JSON-LD, dynamic Prisma `sitemap.xml`, hardened `robots.txt`, dynamic `/opengraph-image`, `icon.png` / `apple-icon.png`, HSTS + `Content-Security-Policy` headers, structured JSON logging, and automated GitHub Actions CI (`.github/workflows/ci.yml`).

---

## Local Development Quick Start

### 1. Prerequisites
- **Node.js:** `v20.x` LTS (or `v22.x`/`v24.x`)
- **npm:** `v10+`
- **PostgreSQL / Supabase:** PostgreSQL 14+ database instance

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Copy the root environment template to `.env` and fill in your PostgreSQL, Auth, and Paystack keys:
```bash
cp .env.example .env
```
Important `.env` rules for a new device:
- Set **`DATABASE_URL`** (pooled runtime connection string) and **`DIRECT_URL`** (direct PostgreSQL URL for Prisma migrations).
- Set **`AUTH_SECRET`** and **`JWT_SECRET`** to a random **32+ character** string (required for signing in when running `npm run build && npm start` or production deployments). Generate one cleanly with:
  ```bash
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  ```
- Keep **`NODE_ENV`** unset (or `"development"`) during local setup so `npm run db:seed` creates local test accounts and storefront fallback/logging behaves cleanly.

For Mobile development, copy the mobile environment template:
```bash
cp apps/mobile/.env.example apps/mobile/.env
```
- Use `http://10.0.2.2:3000/api/v1` for the Android emulator, your computer's LAN IP (e.g. `http://192.168.1.50:3000/api/v1`) when testing on a physical phone via Expo Go, or your live HTTPS URL (e.g. `https://sika-cuisine.vercel.app/api/v1`).

### 4. Verify Database, Apply Migrations & Seed Data
```bash
# 1. Verify PostgreSQL connectivity from root .env
npx tsx prisma/check-connection.ts

# 2. Generate Prisma Client
npx prisma generate

# 3. Apply versioned PostgreSQL migrations (creates User.passwordChangedAt, etc.)
npm run db:migrate:deploy

# 4. Seed categories, dishes, Sunyani zones, and local dev role accounts
npm run db:seed
```
> **Note:** Both `prisma/check-connection.ts` and `npm run db:seed` automatically read root `.env`.
> In development mode (`NODE_ENV` unset or not `"production"`), `npm run db:seed` provisions ready-to-test accounts:
> - **Customer:** `customer@sikacuisine.com` / `Customer123!@#`
> - **Admin:** `admin@sikacuisine.com` / `Admin123!@#` (`/admin/login`)
> - **Kitchen Staff:** `staff@sikacuisine.com` / `Staff123!@#` (`/kitchen`)
> - **Cashier:** `cashier@sikacuisine.com` / `Cashier123!@#` (`/cashier`)
> - **Delivery Rider:** `rider@sikacuisine.com` / `Rider123!@#` (Mobile Rider Portal)

### 5. Run Verification Checks
```bash
npx prisma validate
npm test
npx tsc --noEmit -p apps/web/tsconfig.json
npm run typecheck --workspace=@sika/mobile
npm run build --workspace=@sika/web
```

### 6. Start Web & Mobile Dev Servers
```bash
# Terminal 1 — Start Next.js Web & REST API (http://localhost:3000)
npm run dev

# Terminal 2 — Start Expo Mobile bundler
npm run start --workspace=@sika/mobile
```

---

## Building a Standalone Android APK (Without Android Studio)

You can compile a standalone installable Android **`.apk`** completely in the cloud using **Expo Application Services (EAS Build)** — **no Android Studio, Java JDK, or Android SDK installation is required on your PC**.

`apps/mobile/eas.json` is preconfigured with `"buildType": "apk"` under the `preview` profile.

### Step 1: Check Your API URL Before Building (Important!)
A standalone `.apk` bakes in your backend URL (`EXPO_PUBLIC_API_URL`) at build time:
- Your local `apps/mobile/.env` uses your computer's hotspot/Wi-Fi IP (e.g. `EXPO_PUBLIC_API_URL=http://10.117.133.3:3000/api/v1`).
- However, `apps/mobile/eas.json` overrides `preview` builds with its `"env"` block (`"EXPO_PUBLIC_API_URL": "https://sika-cuisine.vercel.app/api/v1"`).

Choose one of these two setups before running the build:
1. **Option A — Web Backend Deployed Online (Recommended for 4G/5G & Any Wi-Fi):**
   - Deploy `apps/web` to an HTTPS host (e.g. Vercel, Render, or Railway).
   - Set `"EXPO_PUBLIC_API_URL"` under `build.preview.env` in `apps/mobile/eas.json` to your live HTTPS URL (e.g. `"https://your-sika-web.vercel.app/api/v1"`).
   - Your `.apk` will work anywhere on mobile data or Wi-Fi even when your laptop is off.
2. **Option B — Testing the `.apk` Against `npm run dev` on Your Laptop Over Wi-Fi:**
   - Set `"EXPO_PUBLIC_API_URL"` under `build.preview.env` in `apps/mobile/eas.json` to your laptop's LAN IP (e.g. `"http://10.117.133.3:3000/api/v1"`).
   - Note: Android 9+ blocks plain `http://` LAN requests in standalone `.apk` builds by default unless cleartext traffic (`usesCleartextTraffic: true`) is enabled in `apps/mobile/app.json`.

### Step 2: Build the `.apk` in Expo Cloud
Run the following commands in PowerShell / Terminal:

1. **Install the Expo EAS CLI globally:**
   ```powershell
   npm install -g eas-cli
   ```
2. **Sign in to your free Expo account** (create one at https://expo.dev/signup if needed):
   ```powershell
   eas login
   ```
3. **Move into the mobile app workspace and link your Expo project:**
   ```powershell
   cd "apps/mobile"
   eas project:init
   ```
   *(When prompted to create/link the project for `@your-username/sika-cuisine`, press **`Y`**.)*
4. **Trigger the cloud `.apk` build:**
   ```powershell
   eas build --platform android --profile preview
   ```
   - When asked **"Generate a new Android Keystore?"**, press **`Y` (Yes)** — Expo manages the Android signing key automatically in the cloud.
   - Expo's cloud servers will compile the `.apk` (typically ~5–10 minutes) and output a **direct `.apk` download link and QR code** in the terminal to install directly onto your Android phone.

---

## Creating the First Super Admin (Production Bootstrap)

Because public self-registration (`/register` and `POST /api/v1/auth/register`) is strictly locked to `CUSTOMER` accounts, the **first Super Admin (`ADMIN`)** must be provisioned directly against your production PostgreSQL database using the guarded seed script (`prisma/seed.ts`).

When `NODE_ENV=production` and `ALLOW_DEMO_SEED` is unset, `prisma/seed.ts` **automatically skips** all demo staff/customer accounts and sample orders, seeding only your root `ADMIN` user, restaurant settings, Sunyani delivery zones, and menu catalog.

### Step 1: Apply Migrations to Production Database
Ensure `.env` (or your terminal environment) points `DATABASE_URL` and `DIRECT_URL` to your live Supabase/PostgreSQL instance, then run:
```powershell
npm run db:migrate:deploy
```

### Step 2: Bootstrap the Super Admin Account
Run the production seed once with a private email and strong unique password (minimum 12 characters):

**Windows PowerShell:**
```powershell
$env:NODE_ENV = "production"
$env:SEED_ADMIN_EMAIL = "owner@sikacuisine.com"
$env:SEED_ADMIN_PASSWORD = "Use-A-Strong-Unique-Password-2026!"
npm run db:seed

# Immediately clear sensitive credentials from your terminal session
Remove-Item Env:SEED_ADMIN_PASSWORD
Remove-Item Env:SEED_ADMIN_EMAIL
Remove-Item Env:NODE_ENV
```

**macOS / Linux / CI Shell:**
```bash
NODE_ENV=production \
SEED_ADMIN_EMAIL="owner@sikacuisine.com" \
SEED_ADMIN_PASSWORD="Use-A-Strong-Unique-Password-2026!" \
npm run db:seed
```

> **Upgrading from a local dev database?** If `admin@sikacuisine.com` was previously seeded during development, use a fresh production email (e.g. `owner@sikacuisine.com`) above, sign into `/admin/login`, and suspend any leftover dev accounts from the **Team** tab.

### Step 3: Onboard Staff, Cashiers & Delivery Riders
1. Sign in at **`/admin/login`** with your new Super Admin credentials.
2. Navigate to **`/admin` → Team**.
3. Click **Add Staff / Rider**, select the operational role (`STAFF_KITCHEN`, `STAFF_CASHIER`, `DELIVERY_RIDER`, or `ADMIN`), and choose **Private Setup Link (Recommended)**.
4. Share the generated **24-hour setup link** via Email, SMS, Copy Link, or **WhatsApp** so each team member activates their account with their own private password at `/reset-password?token=...&invited=1`.

### Super Admin Security Rules
- **Never commit `SEED_ADMIN_PASSWORD`** into `.env`, Git, or cloud hosting dashboards — pass it only once during initial bootstrap.
- **Keep `ALLOW_DEMO_SEED` unset** in production so demo credentials and sample orders (`SIKA-2026-1001`, `SIKA-2026-1002`) are never created.
- **Password Recovery:** An active Super Admin can always recover access via `/forgot-password` (delivered through Resend/Arkesel or Hubtel).

---

## Pre-Launch Production Checklist

Before pointing live Sunyani traffic and real Mobile Money payments at your deployment:

1. **Production Environment Variables (Web Host):**
   - `NEXT_PUBLIC_APP_URL="https://sikacuisine.com"` (canonical origin for SEO, sitemaps, emails, and Paystack callbacks)
   - `DATABASE_URL` & `DIRECT_URL` pointing to production Supabase/PostgreSQL
   - `AUTH_SECRET` & `JWT_SECRET` set to random 32+ byte secrets (server throws in production if missing or shorter)
   - Live Paystack keys: `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY="pk_live_..."` and `PAYSTACK_SECRET_KEY="sk_live_..."`
   - Optional recommended production services: `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` (shared rate limiting), `SUPABASE_URL` + `SUPABASE_SECRET_KEY` (menu image uploads), `RESEND_API_KEY`, `ARKESEL_API_KEY` (or Hubtel), and `EXPO_ACCESS_TOKEN`.
2. **Paystack Webhook Registration:**
   - In the Paystack Dashboard, register your live webhook URL as `https://sikacuisine.com/api/webhooks/paystack`.
3. **Database Cleanup (If Upgrading from Dev Seed):**
   - Delete any local sample orders (`SIKA-2026-1001`, `SIKA-2026-1002`) and suspend local test accounts (`admin@sikacuisine.com`, `staff@sikacuisine.com`, `cashier@sikacuisine.com`, `rider@sikacuisine.com`, `customer@sikacuisine.com`) after creating your production Super Admin.
4. **Health & Uptime Verification:**
   - Point your uptime monitor at `GET https://sikacuisine.com/api/v1/health` and confirm `status: "healthy"`, `database: "connected"`, `authSecretStrong: true`, and `paystackMode: "live"`.
5. **Mobile Release Builds (`apps/mobile/eas.json`):**
   - `apps/mobile/eas.json` is preconfigured with `development`, `preview` (APK), and `production` profiles targeting `https://sika-cuisine.vercel.app/api/v1`. Run `npx eas build --platform android --profile production` from `apps/mobile` when ready to package native binaries.

---

## Project Structure

```text
Sika Cuisine/
├── .github/workflows/ci.yml           # Prisma validate, test suite, Web/Mobile tsc & Next build
├── packages/
│   └── shared/                        # Canonical currency, delivery zones, RBAC state machine, Zod & tests
├── prisma/
│   ├── migrations/                    # Versioned PostgreSQL migrations
│   ├── schema.prisma                  # Data models (User, Order, MenuItem, PushDeviceToken, etc.)
│   └── seed.ts                        # Guarded menu, zone & Super Admin bootstrap seed
└── apps/
    ├── web/                           # Next.js 16.4.6 storefront, Admin CMS & REST API
    │   ├── next.config.ts             # HSTS, CSP, image domains & X-Robots-Tag headers
    │   ├── public/images/dishes/      # Optimized 4:3 Ghanaian culinary photography
    │   └── src/
    │       ├── app/                   # App Router pages, SSR /menu/[slug], OG/sitemap/robots, /api/v1/*
    │       ├── components/            # DishCard, CartDrawer, FloatingMobileCartBar, Admin panels
    │       ├── context/               # CartContext, PublicConfigContext, ToastContext
    │       └── lib/                   # env, logger, auth, notifications, paystack, rate-limit, audit
    └── mobile/                        # Expo SDK 58 / React Native iOS & Android app
        ├── app.json                   # App scheme, identifiers, icons & production API origin
        ├── eas.json                   # EAS Build profiles (development / preview / production)
        ├── assets/dishes/             # Synced local culinary imagery
        └── src/
            ├── components/            # DishCard, ScalePressable, DishDetailModal, RiderShell
            ├── screens/               # Home, Menu, Cart, Checkout, Orders, Auth, StaffRedirect, rider/*
            └── services/              # api-client, SecureStore token storage, live menu & order caches
```

---

## Security & Quality Architecture

- **Zero Client Financial Trust:** Totals, option deltas, availability, and Sunyani zone tariffs are computed strictly server-side from PostgreSQL in integer pesewas.
- **Role-Based Access Control (RBAC) & Resource Isolation:** Every admin, staff, rider, and customer endpoint enforces JWT session verification, `User.isActive` checks, resource ownership (`customerId` / `assignedRiderId`), and state-machine invariants (`isValidOrderTransition` & `isRoleAuthorizedForTransition`).
- **Timing-Safe Webhook Verification & Idempotency:** Paystack webhooks verify `x-paystack-signature` HMAC-SHA512 digests with `crypto.timingSafeEqual` and deduplicate events in `PaystackWebhookEvent`; checkout requests support `Idempotency-Key` deduplication.
- **Hardened Browser & Crawler Controls:** Enforces HSTS, `Content-Security-Policy`, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, and `noindex`/`X-Robots-Tag` isolation across `/admin`, `/rider`, `/api`, `/checkout`, `/orders`, and auth portals.
