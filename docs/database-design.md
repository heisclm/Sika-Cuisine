# Sika Cuisine — Database Design & Schema Reference

## Technology: PostgreSQL with Prisma ORM

All financial amounts are modeled strictly as **integer pesewas (`Int`)** to avoid IEEE-754 floating-point inaccuracies.

### Key Entities & Field Standards

1. **`User`:**
   - Identity and authentication. Roles: `CUSTOMER`, `STAFF`, `ADMIN`.
   - Stores `passwordHash` (bcrypt with 12 salt rounds).

2. **`MenuCategory` & `MenuItem`:**
   - Categorization and dish presentation.
   - `MenuItem.basePricePesewas Int`: Base price in pesewas (e.g. 6500 = GH₵65.00).
   - `isAvailable Boolean`: Real-time toggle for kitchen inventory.

3. **`MenuItemOptionGroup` & `MenuItemOption`:**
   - Configurable options (proteins, sides, shito pepper levels).
   - `MenuItemOption.priceDeltaPesewas Int`: Additional price in pesewas.

4. **`DeliveryAddress`:**
   - Tailored for Sunyani with `areaLocality` (e.g. Fiapre, Berlin Top, Abesim) and `landmark`.

5. **`Order` & `OrderItem`:**
   - Decoupled `fulfilmentStatus` and `paymentStatus`.
   - Immutable historical snapshots: `itemNameSnapshot`, `unitPricePesewas`, `selectedOptionsSnapshot Json`.
   - Changes to menu items do NOT alter historical records.

6. **`PaymentAttempt` & `PaystackWebhookEvent`:**
   - Full audit trail of Paystack transaction references, amounts in pesewas, and webhook idempotency tracking with unique `eventId`.
