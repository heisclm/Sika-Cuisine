# CHAPTER FIVE
# SUMMARY, CONCLUSION, AND RECOMMENDATIONS

---

## 5.1 Introduction

This final chapter synthesizes the research, architectural design, software implementation, and empirical verification conducted throughout the Sika Cuisine multi-platform food ordering and delivery tracking project. Beginning with the operational and financial vulnerabilities identified within Sunyani’s food service sector in Chapter One, progressing through the theoretical and technological literature synthesized in Chapter Two, the Agile Scrum methodology and UML 2.5 blueprints formulated in Chapter Three, and the full-stack monorepo implementation and automated testing documented in Chapter Four, this chapter consolidates the study's outcomes. Specifically, it presents a structured summary of the project, maps the realized system against the original research objectives, articulates formal engineering conclusions, and offers actionable operational and future research recommendations for Sika Cuisine Restaurant and the broader Ghanaian hospitality technology ecosystem.

---

## 5.2 Summary of the Study

The primary aim of this study was to design, implement, and verify a secure, server-authoritative multi-platform food ordering, cross-platform mobile application, and delivery tracking system tailored to **Sika Cuisine Restaurant** in Sunyani, Bono Region, Ghana.

In **Chapter One**, the study examined the structural inefficiencies of informal telephone and WhatsApp-based meal ordering in secondary Ghanaian urban centers. Key problems included frequent order specification errors during peak kitchen hours, absence of real-time preparation visibility for customers, manual Mobile Money reconciliation overhead, vulnerability to fake SMS payment alerts, client-side price tampering, floating-point rounding drift in currency computations, and inconsistent dispatch fee negotiations across Sunyani localities such as Sunyani Central, Fiapre (CUG/UENR corridor), Berlin Top, Penkwase, New Dormaa, and Abesim [10], [15].

**Chapter Two** reviewed foundational technology adoption and software engineering literature, integrating an extended Technology Acceptance Model (TAM), the DeLone and McLean Information Systems Success Model, and Institutional Trust theory to explain how perceived security, financial transparency, and low-latency usability govern digital ordering adoption in Ghana. It further evaluated native, Progressive Web App (PWA), and cross-platform React Native/Expo architectures [27], [38], [39], establishing why a unified monorepo approach best balances performance, offline resilience, and maintainability.

**Chapter Three** adopted the **Agile Scrum framework** across six iterative sprints [45], eliciting twelve functional requirements and five non-functional invariants from Sika Cuisine stakeholders, kitchen personnel, campus dispatch riders, and local students. Formal UML 2.5 models—including Use Case, Domain Class, Sequence, and State Machine diagrams [46]—defined strict actor boundaries, unidirectional lifecycle transitions, and a three-lane server-authoritative checkout and cryptographic settlement flow.

**Chapter Four** documented the concrete realization of the platform as an npm workspace monorepo (`sika-cuisine@0.1.0`) comprising `packages/shared`, `apps/web`, and `apps/mobile`, backed by an 11-model PostgreSQL 16 and Prisma 6 database schema. The web storefront (Next.js 16 and React 19) delivered an editorial menu experience alongside role-isolated operations portals (`/admin`, `/kitchen`, `/cashier`, `/rider`), while the cross-platform mobile client (React Native 0.88 and Expo SDK 58) provided thumb-zone ergonomics, `AsyncStorage` offline menu caching, `SecureStore` credential encryption, and deep-link payment return handling. Automated verification via `npx tsx --test` across `shared.test.ts`, `api-integration.test.ts`, and `security-production.test.ts` achieved **43 passing assertions out of 43 executed (100% pass rate) in 1,665.13 ms**, confirming financial precision, HMAC SHA-512 webhook authenticity, RBAC workspace isolation, and injection resistance.

---

## 5.3 Objective-by-Objective Achievement Matrix

Table 5.1 evaluates each specific technical objective established in Section 1.4 against its implemented software artifact and verified evidence.

**Table 5.1: Traceability Matrix of Project Objectives and Realized Outcomes**

| Objective (Section 1.4) | Realized Software Artifact | Verification & Observed Evidence | Status |
| :--- | :--- | :--- | :--- |
| **1. System Requirements & Architectural Modeling** | Complete SRS, 4-tier modular architecture, and UML 2.5 diagrams (Use Case, Class, Sequence, State Machine, Deployment, Flowchart). | Documented and verified in Chapters Three and Four (`docs/CHAPTER_THREE.md`, `docs/figures/`). | **Achieved** |
| **2. Multi-Client Full-Stack & Mobile Implementation** | Monorepo uniting Next.js 16 (`apps/web`), Expo SDK 58 / React Native 0.88 (`apps/mobile`), and TypeScript core (`@sika/shared`). | Both clients consume shared contracts, schemas, and domain utilities without duplicated logic. | **Achieved** |
| **3. Zero-Drift Financial & Payment Architecture** | Integer pesewas engine (`currency.ts`) and Paystack Ghana integration with `/api/webhooks/paystack`. | Verified by 5 currency math tests, server-side cart recalculation, and constant-time HMAC SHA-512 checks. | **Achieved** |
| **4. Deterministic Locality-Based Logistics** | Sunyani zone matrix (`delivery-zones.ts`) covering Fiapre, Berlin Top, Penkwase, Abesim, New Dormaa, and Sunyani Central. | Verified locality fee resolution and `0` pesewas invariant for `COLLECTION` orders in `shared.test.ts`. | **Achieved** |
| **5. Mobile Offline Resilience & Secure Storage** | Local menu/order caching (`offline-order-cache.ts` via `AsyncStorage`) and encrypted token storage (`SecureStore`). | Mobile client preserves browsing during network drops and guards deep-link callbacks (`mobile-callback`). | **Achieved** |
| **6. Real-Time Kitchen State Machine & Portals** | Unidirectional FSM (`state-machine/index.ts`), `OrderStatusHistory` audit trail, and `/admin`, `/kitchen`, `/cashier`, `/rider` portals. | Verified by 6 state-machine tests, 5 RBAC workspace isolation tests, and payment bypass gate checks. | **Achieved** |
| **7. System Evaluation & Security Validation** | Three automated test suites (`shared.test.ts`, `api-integration.test.ts`, `security-production.test.ts`). | **43/43 tests passed** in `1,665.13 ms`, covering OWASP API threats, CSV injection, and double-debit protection. *(Field UAT & load testing scoped as future work.)* | **Achieved (Automated)** |

---

## 5.4 Conclusion

Based on the architectural implementation and empirical verification conducted in this project, the following formal conclusions are drawn:

1. **Monorepo Domain Sharing Eliminates Multi-Platform Drift:**  
   Consolidating financial arithmetic, delivery zone tariffs, Zod input schemas, and state-machine transitions within `@sika/shared` proved highly effective. By forcing both the Next.js 16 web server and the Expo 58 mobile application to execute identical domain rules, the system eliminates pricing inconsistencies and validation mismatches between browser and smartphone users.

2. **Integer Pesewas Arithmetic and Server-Authoritative Pricing Guarantee Ledger Integrity:**  
   Representing all monetary values strictly as integer pesewas ($1\text{ GHS} = 100\text{ pesewas}$) completely eradicates IEEE 754 floating-point rounding drift [28]. Pairing integer math with mandatory server-side price re-fetching and immutable `OrderItem` snapshotting ensures that client-side parameter tampering cannot alter payable totals and historical accounting audits remain invariant over time.

3. **Cryptographic Webhook Isolation Secures Mobile Money Settlements:**  
   Decoupling payment confirmation from client browser redirects—and requiring Paystack webhooks to pass constant-time HMAC SHA-512 verification alongside idempotent `PaystackWebhookEvent` logging—eliminates fake SMS alert scams and double-credit anomalies common in manual Mobile Money merchant workflows [16], [50].

4. **Role-Isolated Workflows Reduce Operational Friction in Sunyani:**  
   Partitioning operational responsibilities across `/kitchen`, `/cashier`, `/rider`, and `/admin` enforces clear accountability from meal preparation to final-mile delivery across Sunyani’s academic and residential zones, replacing unstructured phone calls with transparent, auditable state transitions.

---

## 5.5 Contributions to Knowledge and Practice

This project delivers both practical enterprise value and reusable software engineering patterns:

* **Practical Value for Regional Ghanaian Hospitality SMEs:** It provides Sika Cuisine Restaurant with a production-structured, commission-free direct ordering channel across web and mobile, reducing reliance on third-party aggregators while standardizing delivery pricing across Sunyani and Fiapre.
* **Reusable Blueprint for Zero-Drift West African E-Commerce:** The combination of a strict integer-subunit TypeScript currency engine, constant-time Paystack webhook verification, CSV formula-injection neutralization, and cross-platform Expo/Next.js monorepo architecture offers a replicable reference implementation for student developers and SMEs building digital commerce platforms across Ghana.

---

## 5.6 Recommendations

### 5.6.1 Operational Recommendations for Sika Cuisine Management

1. **Dedicated Kitchen & Counter Hardware:** Management should dedicate a wall-mounted tablet or desktop monitor exclusively to the `/kitchen` portal and a front-desk terminal to `/cashier` so order alerts are never missed during peak lunch and dinner rushes.
2. **Staff Role Hygiene and Onboarding:** Each chef, cashier, and campus dispatch rider should be provisioned with individual credentials mapped strictly to their operational `Role` (`STAFF_KITCHEN`, `STAFF_CASHIER`, `DELIVERY_RIDER`) rather than sharing a single `ADMIN` account, preserving the integrity of `OrderStatusHistory` and `AuditLog` records.
3. **Structured Landmark Prompts at Checkout:** Until formal street addressing expands across outer Sunyani suburbs, customer support and couriers should encourage customers in Fiapre, Berlin Top, and Abesim to include prominent landmarks (e.g., hostel names or junction references) in the `landmark` field to minimize dispatch call times.

### 5.6.2 Recommendations for Future Technical Enhancements and Research

1. **GhanaPostGPS and Opt-In Courier Telemetry:** Future iterations should integrate the **GhanaPostGPS** digital addressing API for deterministic coordinate resolution and introduce opt-in, battery-efficient foreground location pings for `/rider` couriers while an order is in the `OUT_FOR_DELIVERY` state.
2. **Offline-First Background Queueing on Mobile:** While the current Expo 58 application caches menus locally via `AsyncStorage`, future enhancements could implement a persisted offline mutation queue for courier delivery confirmations made in low-connectivity dead zones, synchronizing automatically once cellular data resumes.
3. **Longitudinal Field Usability (SUS) and Load Benchmarking:** Following live commercial rollout in Sunyani, future researchers should conduct a formal System Usability Scale (SUS) survey [56] with Sika Cuisine staff and university customers alongside automated stress-testing (e.g., simulating concurrent lunchtime spikes from CUG and UENR campuses) to measure real-world throughput and customer retention over time.

---

*(Note: All cited literature in this chapter cross-references the sequential bibliography `[1]`–`[56]` established across Chapters One through Four.)*
