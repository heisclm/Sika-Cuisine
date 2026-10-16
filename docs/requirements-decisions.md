# Sika Cuisine — Requirements & Architectural Decision Log

## 1. Confirmed Architectural Decisions

| Decision Area | Decision Made | Rationale |
| :--- | :--- | :--- |
| **Operating Location** | Sunyani, Bono Region, Ghana | Client confirmed operational center in Sunyani. Delivery zones, addresses, and contacts tailored specifically for Sunyani neighborhoods. |
| **Framework & Engine** | Next.js 16 (App Router) | Client selected Next.js 16 to leverage latest performance, async request APIs, React 19, and Turbopack compiler. |
| **Runtime Environment** | Node.js `v24.11.1` | Client confirmed preference for Node 24 runtime installed in their NVM environment. |
| **Typography Strategy** | Next.js Self-Hosted Fonts | Editorial serif (*Playfair Display*) and modern sans-serif (*Plus Jakarta Sans*) downloaded and self-hosted with zero external Google CDN runtime dependency in Ghana. |
| **Currency Storage** | Strict Integer Pesewas | 100% elimination of floating-point drift. 1 GHS = 100 pesewas. Handled with integer math across database, backend, and Paystack. |
| **Pricing Authority** | Server-Authoritative | Client totals and prices are discarded at checkout. The server recalculates all amounts from authoritative snapshots. |
| **Payment Provider** | Official Paystack API | Server-side transaction initialization, HMAC SHA512 webhook signature verification, and idempotent event logging. |

---

## 2. Outstanding Client Business Decisions

The following policy and business configuration points remain open for client confirmation:

1. **Payment Methods Acceptance:**
   - Confirm whether Cash on Delivery (COD) will be offered alongside Paystack Mobile Money / Cards.
2. **Delivery Fee Overrides:**
   - Review default Sunyani delivery fee matrix (GH₵15.00 for Sunyani Central/Penkwase; GH₵20.00 for Fiapre/Berlin Top/STU; GH₵25.00 for Abesim/Airport).
3. **Official Menu Roster:**
   - Replace designated Ghanaian placeholders with official dish descriptions, photos, and exact prices.
4. **Kitchen Operating Schedule:**
   - Confirm daily operating hours for Sunyani kitchen.
