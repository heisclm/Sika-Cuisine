# APPENDICES

---

## APPENDIX A: SYSTEM DEPLOYMENT AND SETUP GUIDE

This appendix documents the exact configuration and deployment procedure for the Sika Cuisine monorepo (`apps/web`, `apps/mobile`, and `packages/shared`) based on the repository's `.env.example`, `package.json`, and Expo configuration.

### A.1 Prerequisites
* **Node.js & npm:** Node.js 20 LTS (or higher) with npm workspaces.
* **PostgreSQL:** PostgreSQL 16 database providing both a pooled runtime URL (`DATABASE_URL`) and a direct migration URL (`DIRECT_URL`).
* **Paystack Merchant Account:** Paystack Ghana keys (`NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` and `PAYSTACK_SECRET_KEY`).
* **Mobile Runtime:** Expo Go or Android/iOS emulator for `apps/mobile` (Expo SDK 58, `com.sikacuisine.app`).

### A.2 Environment Configuration

**1. Root & Web Server (`.env`):**  
Copy `.env.example` to `.env` at the repository root and configure the required variables:
* **Core & Database:** `NEXT_PUBLIC_APP_URL`, `DATABASE_URL`, `DIRECT_URL`
* **Authentication:** `AUTH_SECRET` and `JWT_SECRET` (minimum 32 random bytes in production)
* **Paystack:** `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY`, `PAYSTACK_SECRET_KEY`, and optional `PAYSTACK_WEBHOOK_SECRET`
* **Optional Infrastructure:** Upstash Redis rate limiting (`UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`), Supabase Storage (`SUPABASE_URL`, `SUPABASE_SECRET_KEY`, `SUPABASE_STORAGE_BUCKET`), and notifications (`GMAIL_USER`/`GMAIL_APP_PASSWORD`, `RESEND_API_KEY`, `ARKESEL_API_KEY`, `HUBTEL_CLIENT_ID`, `EXPO_ACCESS_TOKEN`).

**2. Mobile Client (`apps/mobile/.env`):**  
Copy `apps/mobile/.env.example` to `apps/mobile/.env` and point `EXPO_PUBLIC_API_URL` to the backend API:
* Android emulator: `EXPO_PUBLIC_API_URL=http://10.0.2.2:3000/api/v1`
* Physical device / Production: LAN IP (`http://<LAN-IP>:3000/api/v1`) or production HTTPS URL (`https://sikacuisine.com/api/v1`, matching `app.json`).

### A.3 Installation, Database Migration, and Seeding
1. **Install all monorepo dependencies:**
   ```bash
   npm install
   ```
2. **Generate Prisma client and apply production migrations:**
   ```bash
   npm run db:generate
   npm run db:migrate:deploy
   ```
3. **Seed initial Sunyani menu categories, dishes, and default accounts:**
   ```bash
   npm run db:seed
   ```

### A.4 Web Application Verification, Build, and Startup (`@sika/web`)
1. **Run the automated verification suite:**
   ```bash
   npm test
   ```
2. **Build and launch the Next.js 16 production server:**
   ```bash
   npm run build
   npm start
   ```

### A.5 Mobile Application Startup (`@sika/mobile`)
1. **Start the Expo Metro bundler:**
   ```bash
   npm run start --workspace=@sika/mobile
   ```
2. **Launch on Android or iOS:**
   ```bash
   npm run android --workspace=@sika/mobile
   npm run ios --workspace=@sika/mobile
   ```

### A.6 Paystack Webhook & Deep-Link Configuration
* **Paystack Webhook URL:** Register `https://<your-domain>/api/webhooks/paystack` in the Paystack Dashboard under **Settings → API Keys & Webhooks**. Incoming `charge.success` events are verified using HMAC SHA-512 (`crypto.timingSafeEqual()`).
* **Mobile Deep-Link Scheme:** Configured in `apps/mobile/app.json` as `sikacuisine` (`sikacuisine://`), allowing `/api/v1/payments/mobile-callback` to return users cleanly to the mobile app after Paystack checkout.

---

## APPENDIX B: SUNYANI MUNICIPAL DELIVERY ZONE TARIFFS

Implemented in `packages/shared/src/utils/delivery-zones.ts` using integer pesewas ($100\text{ pesewas} = \text{GH₵ } 1.00$). Pickup (`COLLECTION`) orders unconditionally incur **GH₵ 0.00**.

* **Zone 1 — Central & Campus (GH₵ 8.00 | 30 mins):** Sunyani Central, Fiapre, UENR Campus, Area 1–4, Post Office / Market Area, Victoria Park.
* **Zone 2 — Residential & Mid-Belt (GH₵ 12.00 | 40 mins):** Abesim, Berlin Top, New Dormaa, Sunyani Magazine, Penkwase, Estate, Sunyani Senior High Area.
* **Zone 3 — Extended Periphery (GH₵ 15.00 | 50 mins):** Kotokrom, Yawhima, Baakoniaba, Chiraa Road, Mayfair Area, Watchman, Tanoso Road.
* **Zone 4 — Outer Regional Boundary (GH₵ 20.00 | 60 mins):** Sunyani Airport Enclave, Dumasua, Nsoatre Junction, Kwatire, Adantia Area.
* **Fallback Baseline (GH₵ 12.00 | 40 mins):** Applied automatically when an unmapped Sunyani locality is specified for delivery.

---

## APPENDIX C: AUTOMATED TEST SUITE EXECUTION SUMMARY

Executed via `npm test` (`npx tsx --test`) across `shared.test.ts`, `api-integration.test.ts`, and `security-production.test.ts`:

```text
> sika-cuisine@0.1.0 test
> npx tsx --test packages/shared/tests/shared.test.ts packages/shared/tests/api-integration.test.ts packages/shared/tests/security-production.test.ts

ℹ tests 43
ℹ suites 0
ℹ pass 43
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 1665.127
```

All **43 assertions**—covering integer pesewas currency math, Sunyani delivery zone fees, order state-machine transitions, server-side cart recalculation, constant-time HMAC SHA-512 webhook verification, RBAC workspace isolation, CSV formula neutralization, and mobile callback deep-link security—passed with zero failures.
