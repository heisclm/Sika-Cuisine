# Sika Cuisine — Business Requirements Document (BRD)

**Project:** Sika Cuisine Online Food Ordering & Delivery Tracking Platform  
**Target Market:** Sunyani, Bono Region, Ghana  
**Currency:** Ghana Cedi (GHS / GH₵) — Integer Pesewas Standard  
**Document Version:** 1.0 (October 2026)

---

## 1. Business Objectives

1. **Digital Ordering Transition:** Transition Sika Cuisine from manual phone/WhatsApp order intake to an automated, server-authoritative web ordering platform.
2. **Delivery Optimization for Sunyani:** Provide clear, upfront delivery fee structures and accurate preparation expectations across key Sunyani localities (Sunyani Central, Fiapre / UENR, Berlin Top, Abesim, Penkwase, etc.).
3. **Cash Flow & Frictionless Payment:** Integrate Paystack to enable instant mobile money payments (MTN MoMo, Telecel Cash, AT Money) and debit cards with automated reconciliation.
4. **Kitchen Operations Control:** Equip kitchen staff with a real-time order dashboard to review, accept, prepare, and dispatch orders with full auditability.
5. **Brand Elevation:** Present a visually premium, cinematic culinary experience inspired by high-end dining showcases to strengthen customer loyalty.

---

## 2. Customer User Journeys

- **Browse & Discover:** Customers can explore curated Ghanaian delicacies with descriptions, spice levels, high-res photos, and clear GHS pricing.
- **Customization:** Customers can tailor their dishes (e.g. choose charcoal-grilled tilapia vs. fried chicken, select shito spice level, request special packing instructions).
- **Cart & Micro-Interactions:** Dishes fly smoothly into the cart with instant feedback and accurate integer pesewas subtotal calculations.
- **Sunyani Delivery or Collection:** Customers select either home/office delivery to their Sunyani neighborhood or kitchen pickup in Sunyani Central.
- **Secure Payment:** Instant mobile money or card payment via Paystack, or option to pay Cash on Delivery/Collection.
- **Order Tracking:** Live visual status timeline tracking the order through kitchen preparation and courier dispatch.

---

## 3. Restaurant Staff User Journeys

- **Live Orders Board:** Real-time visibility into incoming orders categorized by status (`Pending Confirmation`, `Preparing`, `Out for Delivery`, `Completed`).
- **Status Advancement:** One-click transitions advancing orders with authorized timestamps and staff accountability.
- **Order Rejection & Exception Handling:** Ability to reject orders with recorded business reasons (e.g., out-of-stock ingredients, delivery address out of service bounds).
- **Menu Availability Controls:** Real-time toggling of dish availability to prevent sold-out items from being ordered.

---

## 4. Scope Exclusions

As confirmed in the project requirements:
- No live GPS map tracking (accurate status timelines are used instead).
- No complex multi-branch routing or franchise management (tailored to single restaurant operations in Sunyani).
- No speculative third-party aggregator integrations.
