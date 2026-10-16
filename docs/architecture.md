# Sika Cuisine — System Architecture

## Architecture Pattern: Modular Monolith on Next.js 16 App Router

Sika Cuisine is architected as a cohesive **Modular Monolith** using the Next.js 16 App Router, TypeScript, and Prisma ORM.

```
┌─────────────────────────────────────────────────────────────┐
│                    Client Layer (React 19)                  │
│  - Cinematic Showcase Pages (Home, Menu, About, Contact)    │
│  - Client Context (CartContext, FlyingCartAnimation)        │
│  - Interactive Modals & Slide-over Drawer                   │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTPS (Server Actions & Route Handlers)
┌──────────────────────────────▼──────────────────────────────┐
│                    Next.js Server Layer                     │
│  - Server Actions: createOrderAction (Server-Authoritative) │
│  - Route Handlers: /api/webhooks/paystack (HMAC Protected)  │
│  - Middleware & Session Guards (JWT / Jose)                 │
└──────────────────────────────┬──────────────────────────────┘
                               │
               ┌───────────────┴───────────────┐
               │                               │
┌──────────────▼──────────────┐ ┌──────────────▼──────────────┐
│  Database Layer (PostgreSQL) │ │   Payment Gateway (Paystack) │
│  - Prisma 6 ORM             │ │  - Mobile Money (MTN, Telecel)│
│  - Integer Pesewas Schema   │ │  - Cards (Visa, Mastercard) │
│  - Status History & Audits  │ │  - HMAC SHA512 Webhooks     │
└─────────────────────────────┘ └─────────────────────────────┘
```

## Core Architectural Modules

1. **Presentation & UI (`src/components/*`):**
   - React 19 Client and Server Components.
   - Tailwind CSS with dark palette and rich crimson gradients.
   - Self-hosted Google Fonts (`next/font`) ensuring zero external network latency in Ghana.

2. **Domain & Business Logic (`src/lib/*`):**
   - `currency.ts`: Zero floating-point drift, integer pesewas mathematics.
   - `delivery-zones.ts`: Sunyani locality matrix and fee lookup.
   - `paystack.ts`: Official transaction initialization, verification, and HMAC webhook processing.

3. **Data Access Layer (`src/lib/prisma.ts` & `prisma/schema.prisma`):**
   - Typed schema with strict referential integrity, indexes, and historical price snapshots.
