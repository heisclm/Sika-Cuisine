# CHAPTER TWO
# LITERATURE REVIEW

---

## 2.1 Introduction

The transition from physical storefronts and manual service encounters to digital, internet-mediated commercial ecosystems represents one of the most profound socio-technical shifts in contemporary business management and applied computer science [1]. While early electronic commerce focused predominantly on the asynchronous retail of non-perishable consumer commodities, advancements in distributed computing, real-time database synchronization, and digital financial technologies have catalysed the rapid emergence of on-demand electronic services [2]. Within this expanded horizon, Online Food Delivery (OFD) platforms have evolved from novelty conveniences into critical socio-economic infrastructure, fundamentally reshaping how culinary enterprises produce, package, bill, and dispatch prepared meals to consumers [3], [4].

However, the design, engineering, and sustained adoption of digital food ordering platforms cannot be viewed through a purely generic technological lens. Developing and deploying software within emerging economies—and specifically within secondary urban centres in Sub-Saharan Africa—demands deep architectural adaptation to localized infrastructural, economic, and behavioural realities [5], [8]. The operational assumptions that underpin Western digital aggregators (such as ubiquitous high-speed broadband, structured alphanumeric postal addresses, and credit-card-centric payment settlement) break down rapidly when applied to regional Ghanaian municipalities such as Sunyani in the Bono Region [10]. In these micro-economies, mobile telecommunication networks, interoperable Mobile Money (MoMo) wallets, and informal neighborhood-based navigation form the foundational digital rails [6], [7], [12].

This chapter provides a comprehensive, academically grounded literature review examining the theoretical paradigms, architectural concepts, and empirical systems that inform the design and implementation of the **Sika Cuisine Web Ordering and Delivery Tracking System**. The chapter begins with an overview of localized food e-commerce, establishing formal definitions for core concepts such as server-authoritative computing, integer currency representation, and cryptographic webhook architectures. It then critically reviews relevant theoretical models, focusing on the Technology Acceptance Model (TAM), the DeLone and McLean Information Systems Success Model, and Institutional Trust paradigms. Furthermore, it conducts an empirical evaluation of existing food delivery channels utilized in Ghana, identifying their systemic strengths, vulnerabilities, and operational gaps. Finally, the chapter synthesizes these insights into a comparative analytical framework, establishing the conceptual and empirical foundation for the engineering methodology detailed in subsequent chapters.

---

## 2.2 Overview of the Study

The modern restaurant sector operates at the intersection of perishable inventory management, time-sensitive culinary production, and localized distribution logistics [13]. Over the past decade, the rapid penetration of smartphones across Ghana has accelerated consumer expectations for on-demand digital services [6]. Where customers previously relied on physical patronage or word-of-mouth dining choices, they now increasingly seek digital channels that provide visual menu discovery, clear pricing, and remote convenience [3].

Despite this demand, culinary enterprises located outside Ghana's primary metropolitan centers (Accra and Kumasi) face significant operational barriers [9], [10]. Sunyani, the administrative capital of the Bono Region, exemplifies this secondary metropolitan challenge. As an educational and commercial hub hosting institutions such as the Catholic University of Ghana (CUG) in Fiapre, the University of Energy and Natural Resources (UENR), and the Sunyani Technical University (STU), the municipality features a dense, tech-savvy population of tertiary students, faculty, healthcare personnel, and civil servants [10], [11]. However, local food service establishments, including Sika Cuisine Restaurant, have largely been left without dedicated software infrastructure tailored to their operating environment.

To understand the socio-technical ecosystem within which this project is situated, it is essential to define the core technical and operational concepts that govern modern web-based food ordering architectures.

### 2.2.1 Definition of Key Terms and Concepts

To ensure academic and conceptual clarity throughout this dissertation, the following terms and operational concepts are defined within the scope of this study:

* **Online Food Delivery (OFD) System:**  
  A socio-technical software platform that facilitates the electronic browsing, selection, customization, ordering, payment, and fulfilment tracking of prepared culinary meals between a restaurant enterprise and distributed end-users over internet protocols [2], [4].

* **Server-Authoritative Architecture:**  
  A software engineering paradigm wherein the central application server possesses absolute, non-negotiable authority over the computation and validation of business rules, data states, and financial transactions. Under this model, client-side browsers and mobile devices are treated as inherently untrusted presentation layers; all prices, line totals, delivery fees, and order states submitted by the client are systematically discarded and recalculated by the server from authoritative database records before state mutation occurs [15], [32].

* **Integer Pesewas Standard (Zero Floating-Point Drift):**  
  A financial computing standard in which all monetary figures are represented, manipulated, and persisted strictly as unsigned or signed integers denoting the lowest currency denomination—in Ghana, the Pesewa ($1\text{ Ghana Cedi [GHS]} = 100\text{ pesewas}$). This methodology completely avoids the use of IEEE 754 floating-point approximations (such as `FLOAT` or `DOUBLE` data types), thereby mathematically eliminating accumulated rounding errors and fractional drift during fiscal computations [27], [28].

* **Cryptographic Webhook Architecture:**  
  An asynchronous, server-to-server communication protocol whereby a payment gateway (e.g., Paystack) notifies an application server of a completed financial transaction by issuing an HTTP `POST` payload. To ensure message authenticity and prevent forgery, the incoming payload is cryptographically validated using Hash-based Message Authentication Codes (HMAC SHA512) paired with timing-safe string comparison algorithms [16], [32].

* **Kitchen Fulfilment State Machine:**  
  A formal computational model comprising a finite set of discrete, mutually exclusive order states (`PENDING_CONFIRMATION`, `CONFIRMED`, `PREPARING`, `READY_FOR_COLLECTION`, `OUT_FOR_DELIVERY`, `COMPLETED`, `REJECTED`, `CANCELLED`) and a deterministic set of authorized, unidirectional transitions governed by kitchen staff and verified system events, preventing race conditions or orphaned operational states.

* **Locality-Based Delivery Matrix:**  
  A deterministic logistical framework that maps predefined geographical neighbourhoods, suburban clusters, and campus corridors within a municipality (such as Sunyani Central, Fiapre, Berlin Top, Penkwase, and Abesim) to standardized transit fees and expected preparation-dispatch timelines, bypassing the failure modes of unstructured postal geocoding in emerging markets [10].

### 2.2.2 Current State of the Field

The contemporary landscape of food delivery services in Ghana is defined by a pronounced duality between national aggregators operating in major metropolitan areas and informal social commerce prevailing in regional urban centers [5], [12]. 

In Accra, Tema, and Kumasi, multinational aggregators and localized tech companies (such as Bolt Food, Hubtel, and previously Jumia Food and Glovo) have established structured multi-vendor marketplaces [9], [29]. These platforms leverage venture capital funding, dedicated motorbike delivery fleets, and integrated payment switches to facilitate on-demand delivery [4], [30]. However, empirical analyses of their operations reveal severe limitations: their high commission structures (typically extracting between 20% and 35% of gross order values from restaurants), rigorous formal requirements, and geographic concentration render them unviable for deployment in secondary regional cities like Sunyani [3], [10].

Consequently, regional culinary enterprises and their patrons have defaulted to informal social messaging networks—predominantly WhatsApp Business, direct cellular calls, and Instagram direct messaging—as ad-hoc ordering channels [12]. While these tools provide immediate accessibility and zero upfront software acquisition costs, extensive research demonstrates that social chat applications fail as transactional business engines [12], [13]. Voice calls and unstructured chat logs lack database concurrency control, introduce miscommunication in meal customization, provide zero automated order queueing for kitchen staff, and force customers into risky peer-to-peer Mobile Money transfers that require manual SMS verification [14], [33]. This manual friction fuels operational bottlenecks, accounting discrepancies, and consumer distrust [10], [14].

Technically, small enterprise web applications deployed in regional markets often suffer from significant software vulnerabilities. Many web shops built on generic content management systems (CMS) execute financial calculations within client-side JavaScript, leaving them vulnerable to parameter tampering where malicious users alter price parameters prior to checkout [32]. Furthermore, reliance on standard floating-point datatypes introduces rounding discrepancies that conflict with payment gateway integer expectations, leading to reconciliation failures [16], [27]. The current state of the field highlights an acute need for bespoke, lightweight, server-authoritative web architectures tailored specifically to the operational, economic, and logistical contexts of regional African municipalities.

---

## 2.3 Review of Theoretical Concepts

The conceptualization, software design, and behavioural adoption of the Sika Cuisine platform are grounded in three established theoretical models within Information Systems (IS) and software engineering: the Technology Acceptance Model (TAM), the DeLone and McLean Information Systems Success Model, and Institutional Trust Theory.

### 2.3.1 The Technology Acceptance Model (TAM) and Extended TAM

Originally formulated by Fred D. Davis in 1989, the Technology Acceptance Model (TAM) remains one of the most robust and widely applied theoretical frameworks for explaining user adoption of computer technologies and information systems [19]. Grounded in the Theory of Reasoned Action (TRA), TAM posits that an individual’s behavioural intention to use a system is primarily determined by two core cognitive constructs: **Perceived Usefulness (PU)** and **Perceived Ease of Use (PEOU)** [19]. Davis defines Perceived Usefulness as *"the degree to which a person believes that using a particular system would enhance his or her job performance,"* while Perceived Ease of Use is defined as *"the degree to which a person believes that using a particular system would be free of effort"* [19, p. 320].

```
+-----------------------------------------------------------------------------------------+
|                    THE EXTENDED TECHNOLOGY ACCEPTANCE MODEL (TAM)                       |
+-----------------------------------------------------------------------------------------+
|                                                                                         |
|   [ External Variables ]                                                                |
|   - Mobile Money Integration (MoMo)                                                     |
|   - Transparent Sunyani Zone Pricing   ----+                                            |
|   - Server-Authoritative Reliability        |                                           |
|                                             v                                           |
|                                  +-----------------------+                              |
|                                  |  Perceived Ease of    |                              |
|                                  |      Use (PEOU)       |                              |
|                                  +-----------+-----------+                              |
|                                              |                                          |
|                                              |       +-----------------------+          |
|                                              +------>| Perceived Usefulness  |          |
|                                              |       |         (PU)          |          |
|                                              |       +-----------+-----------+          |
|                                              |                   |                      |
|                                              v                   v                      |
|   [ Contextual Moderators ]      +-------------------------------------------+          |
|   - Perceived Financial Risk     |  Attitude & Behavioral Intention to Use   |          |
|   - Institutional System Trust   |                  (BIU)                    |          |
|                                  +---------------------+---------------------+          |
|                                                        |                                |
|                                                        v                                |
|                                          +---------------------------+                  |
|                                          | Actual System Usage (ASU) |                  |
|                                          +---------------------------+                  |
+-----------------------------------------------------------------------------------------+
```

In subsequent expansions of the model—such as TAM2 by Venkatesh and Davis (2000) and empirical adaptations to mobile commerce in Sub-Saharan Africa by Ofori et al. (2018) and Boateng et al. (2022)—scholars demonstrated that standard TAM must be extended with external contextual variables to accurately reflect emerging market dynamics [5], [8], [20]. In the context of the Sika Cuisine platform:
* **Perceived Usefulness (PU):** Consumers and restaurant personnel evaluate whether the web ordering platform saves time, eliminates telephone miscommunication, provides accurate delivery timelines across Sunyani localities, and streamlines kitchen workflows.
* **Perceived Ease of Use (PEOU):** Focuses on the elimination of cognitive friction. By deploying a mobile-first, responsive web architecture that requires no app store installation, incorporates localized Sunyani neighborhood selectors, and features intuitive culinary customization micro-interactions, the system maximizes ease of use across diverse demographic segments [17], [34].
* **Extended Variable: Mobile Money Self-Efficacy and Perceived Financial Security:** As demonstrated by Ofori et al. (2018), the continuous use of digital commercial platforms in Ghana is heavily dictated by the user's confidence in automated mobile payment gateways [5]. Integrating Paystack’s automated USSD prompt infrastructure significantly elevates user intention to transact by eliminating manual payment transfer errors [16].

### 2.3.2 The DeLone and McLean Information Systems (IS) Success Model

While TAM focuses on psychological determinants of adoption, the DeLone and McLean (D&M) Information Systems Success Model (1992, updated 2003) provides a multidimensional framework for assessing the engineering quality, operational performance, and organizational value of an information system [21], [22]. The updated D&M model identifies six interrelated dimensions of system success: **System Quality**, **Information Quality**, **Service Quality**, **Use / Intention to Use**, **User Satisfaction**, and **Net Benefits** [22].

```
+------------------------------------------------------------------------------------+
|               DELONE & MCLEAN IS SUCCESS MODEL (MAPPED TO SIKA CUISINE)            |
+------------------------------------------------------------------------------------+
|                                                                                    |
|  +--------------------+                                                            |
|  |   System Quality   | ===> Next.js 16 SSR, Integer Pesewas Zero-Drift Math,       |
|  |                    |      Sub-Second Page Loads, Prisma ORM Resilience          |
|  +---------+----------+                                                            |
|            |                                                                       |
|  +---------v----------+                                                            |
|  | Information Quality| ===> Real-Time Spice Customization, Verified Menu Prices,  |
|  |                    |      Accurate Sunyani Delivery Tariffs, Status Timelines   |
|  +---------+----------+                                                            |
|            |                 +----------------------+      +--------------------+  |
|            +---------------->| User Satisfaction &  | ===> |    Net Benefits    |  |
|            |                 |   Intention to Use   |      | (Reduced Food Waste|  |
|  +---------v----------+      +----------------------+      |  Revenue Growth,   |  |
|  |  Service Quality   | ===> Paystack MoMo Integration,    |  Logistics Clarity)|  |
|  |                    |      Tamper-Sealed Packaging,      +--------------------+  |
|  +--------------------+      Automated SMS/Status Updates                          |
|                                                                                    |
+------------------------------------------------------------------------------------+
```

When mapped to the engineering and deployment of the Sika Cuisine system, the D&M model provides concrete operational metrics:
1. **System Quality:** Evaluates the technical architecture of the web platform—specifically its sub-second page delivery via Next.js Server Components, relational data integrity managed through PostgreSQL and Prisma ORM, and zero floating-point arithmetic drift [15], [18], [27].
2. **Information Quality:** Measures the clarity, accuracy, and currency of data presented to customers and kitchen operators. In Sika Cuisine, this is realized through dynamic dish descriptions, explicit ingredient customization options, transparent locality delivery fees, and deterministic status progression [23], [24].
3. **Service Quality:** Encompasses the responsiveness of the payment gateway, the promptness of kitchen order confirmation, and the reliability of dispatch couriers [2], [22].
4. **User Satisfaction & Net Benefits:** Directly impacts restaurant profitability by eliminating missed telephone orders, cutting administrative overhead, preventing food spoilage from miscommunicated tickets, and providing customers with hot meals [3], [24].

### 2.3.3 Institutional Trust vs. Interpersonal Trust and Perceived Financial Risk

Trust is widely recognized as a foundational prerequisite for electronic commerce adoption, especially in environments characterized by financial vulnerability and digital fraud [14], [25]. Information systems literature distinguishes between two fundamental modes of trust: **Interpersonal Trust** and **Institutional (Systemic) Trust** [25], [26].

* **Interpersonal Trust:** Governs informal, peer-to-peer transactions where a customer evaluates the personal honesty, character, and benevolence of an individual seller or telephone operator [25]. Under Sika Cuisine's prior manual ordering model, transactions relied entirely on interpersonal trust. A customer who sent money to a staff member's personal phone number faced substantial interpersonal risk: if the order was delayed or forgotten, the customer had no systemic recourse, and restaurant management had no digital audit log [12], [14].
* **Institutional Trust:** Replaces personal reliance with structural assurances, legal guarantees, and deterministic software controls [25], [26]. Institutional trust occurs when the transacting party places confidence in the technological safeguards of the platform itself [26]. 

The Sika Cuisine architecture shifts the operational paradigm from interpersonal vulnerability to institutional certainty. By implementing server-side price snapshots, automated Paystack payment verification, and an auditable kitchen state machine, the platform acts as a neutral, trusted intermediary [16], [32]. Customers no longer need to assess whether an individual staff member will properly record their order; the software guarantees that funds are recognized only upon cryptographic confirmation and that orders are immediately committed to the kitchen queue [15], [25].

---

## 2.4 Review of Empirical Studies

To evaluate where existing systems fall short and justify the engineering choices behind Sika Cuisine, this section reviews three primary digital commerce models utilized in Ghana: national multi-vendor food aggregators, indigenous merchant super-apps, and informal social commerce channels.

### 2.4.1 Overview of System 1: National Multi-Vendor Delivery Aggregators (Bolt Food / Jumia Food Ghana)

National multi-vendor delivery aggregators represent the mainstream paradigm of digital food commerce in West Africa [9], [29]. Operating on massive cloud infrastructures, these platforms onboard hundreds of independent restaurant vendors into a centralized marketplace, deploying contracted motorbike fleets to execute deliveries across metropolitan zones [4], [30].

```
+-----------------------------------------------------------------------------------+
|                        SYSTEM 1: NATIONAL AGGREGATOR MODEL                        |
|                                                                                   |
|  [ Customer App ] <===> [ Cloud Aggregator ] <===> [ Merchant App ] <===> Rider   |
|                                 |                                                 |
|                        Takes 20% - 35% Fee                                        |
|                     Restricted to Accra/Kumasi                                    |
|                     Relies on GPS / Map Density                                   |
+-----------------------------------------------------------------------------------+
```

#### Good Features (Strengths):
* **Established Payment and Logistics Infrastructures:** Aggregators provide fully integrated digital payment switches and real-time courier tracking [29].
* **High Consumer Reach and Marketing Density:** Multi-restaurant cataloging allows consumers to compare various cuisines within a unified application [4].
* **Strict Interface Design Standards:** Applications offer highly polished, native mobile user experiences with reliable payment processing [30].

#### Bad Features (Weaknesses & Operational Failures):
* **Extractive Commission Models:** National aggregators extract between 20% and 35% commission on gross sales, severely eroding the profit margins of indigenous food establishments operating on low markup thresholds [3], [4].
* **Geographical Exclusion of Secondary Municipalities:** Due to courier fleet overheads and localized infrastructure constraints, aggregators concentrate almost exclusively in Accra, Tema, and Kumasi, leaving regional capitals like Sunyani completely unserved [9], [10].
* **Customer Disconnection and Brand Dilution:** The restaurant loses direct contact with its customer base, as customer relationship data, phone numbers, and behavioural analytics remain proprietary to the aggregator [3], [30].
* **Inapplicability of GPS Pinning in Secondary Cities:** Aggregator systems depend heavily on continuous GPS map coordinates, which frequently fail or misroute couriers in semi-structured suburban layouts such as Berlin Top, Penkwase, and Fiapre [10].

### 2.4.2 Overview of System 2: Localized Merchant Super-Apps (Hubtel Ghana)

Hubtel Ghana represents an indigenous technological innovation, transitioning from a primary SMS gateway and fintech utility into a localized "super-app" facilitating bill payments, retail commerce, and food delivery [31]. Operating across several Ghanaian urban centres, Hubtel integrates directly with national mobile money switches and local retail merchants [5], [31].

```
+-----------------------------------------------------------------------------------+
|                           SYSTEM 2: HUBTEL SUPER-APP                              |
|                                                                                   |
|  [ All-in-One Super-App ] ===> Multi-Category Retail ===> Multi-Wallet Checkout   |
|                                           |                                       |
|                                High Cognitive Friction                            |
|                            Generic Non-Culinary Layouts                           |
|                            Limited Regional Kitchen Hardware                      |
+-----------------------------------------------------------------------------------+
```

#### Good Features (Strengths):
* **Deep Native Fintech Integration:** Hubtel possesses direct integrations with the Ghana Interbank Payment and Settlement Systems (GhIPSS), enabling seamless mobile money wallet debits across MTN, Telecel, and AT Money [7], [31].
* **Broad Local Footprint:** Unlike foreign aggregators, Hubtel has demonstrated operational capacity in secondary urban centers, onboarding local service providers [31].
* **Multi-Service Convenience:** Users can execute utility payments, airtime recharges, and food ordering within a single account ecosystem [5].

#### Bad Features (Weaknesses & Operational Failures):
* **High Interface Clutter and Cognitive Load:** Because Hubtel operates as an all-in-one super-app combining utilities, banking, retail, and food, users experience significant navigational clutter, conflicting with TAM principles of Perceived Ease of Use [19], [34].
* **Generic Product Representations:** The platform treats cooked culinary dishes identically to physical packaged commodities (e.g., groceries or electronics), lacking specialized interface controls for culinary customization (e.g., selecting meat cuts, starch accompaniments, and precise shito spice tolerances) [13], [31].
* **High Hardware and Operational Requirements:** Integrating with Hubtel typically requires the merchant to acquire specialized Point-of-Sale (POS) terminal hardware, introducing capital barriers for single-location regional restaurants [10], [31].

### 2.4.3 Overview of System 3: Informal Social Commerce Channels (WhatsApp Business & Voice Calling)

Informal social commerce represents the default operational baseline currently utilized by Sika Cuisine and the vast majority of food service providers in Sunyani [10], [12]. Under this model, restaurants advertise daily food availability through WhatsApp status updates, receiving incoming orders via chat threads and cellular phone calls [12].

```
+-----------------------------------------------------------------------------------+
|                        SYSTEM 3: INFORMAL SOCIAL COMMERCE                         |
|                                                                                   |
|  [ Customer Phone ] <==== Chat / Voice ====> [ Personal Staff Phone ]             |
|                                                     |                             |
|                                          Manual Note-Taking                       |
|                                       Unverified MoMo Reversals                   |
|                                        Zero Database Audit Trail                  |
|                                         Kitchen Chaos & Bottlenecks               |
+-----------------------------------------------------------------------------------+
```

#### Good Features (Strengths):
* **Ubiquitous Access and Zero Learning Curve:** WhatsApp is installed on almost every smartphone in Ghana, requiring no user onboarding or registration hurdles [6], [12].
* **Direct Human Interaction:** Customers can negotiate or make direct inquiries via conversational messaging [12].
* **Zero Software Licensing Overhead:** Micro-enterprises incur no direct development or hosting expenses to launch a basic presence [10].

#### Bad Features (Weaknesses & Operational Failures):
* **Severe Communication and Production Failures:** In busy kitchen environments, manual transcription of orders from voice calls and text chats leads to frequent omissions of customer preferences (e.g., wrong accompaniments, incorrect soup choices), generating customer dissatisfaction and food waste [12], [13].
* **Total Absence of Transactional Authority:** WhatsApp possesses no transactional ledger, database concurrency controls, or automated order lifecycle states [12], [15].
* **High Vulnerability to Financial Fraud:** Reliance on manual mobile money transfers exposes the business to forged SMS payment confirmations, payment reversal scams, and unrecorded cash-pocketing by staff [14], [33].
* **Reconciliation Nightmares:** Management must spend hours cross-referencing incoming carrier SMS records with manual order notebooks, making financial auditability nearly impossible [10], [14].
* **Arbitrary Dispatch Logistics:** In the absence of an automated delivery matrix, delivery couriers negotiate dispatch fees on an ad-hoc basis, causing disputes with customers upon arrival [10].

---

## 2.5 Discussion and Gaps Identification

A systematic synthesis of the reviewed literature and empirical systems highlights a fundamental architectural void: existing solutions either present overly complex, cost-prohibitive multi-vendor models that exclude secondary regional cities, or collapse into chaotic, error-prone informal chat workflows [3], [10], [12]. 

To clearly position the contribution of this project, **Table 2.1** presents a comparative analysis contrasting the three existing systems against the proposed **Sika Cuisine Web Ordering and Delivery Tracking System**.

---

### Table 2.1: Comparative Matrix of Existing Systems vs. Proposed Sika Cuisine System

| Evaluation Criteria | System 1: National Aggregators (Bolt Food / Jumia) | System 2: Localized Super-Apps (Hubtel Ghana) | System 3: Informal Social Commerce (WhatsApp/Calls) | Proposed System: Sika Cuisine Web Platform |
| :--- | :--- | :--- | :--- | :--- |
| **Primary Target Market** | Major Metros (Accra, Kumasi) [9] | Multi-city, broad commercial [31] | Informal micro-merchants [12] | **Sunyani, Bono Region (Localized)** [10] |
| **Pricing & Calculation Authority** | Server-Authoritative (Central Cloud) | Server-Authoritative (Fintech Hub) | None (Manual human mental math) | **Server-Authoritative (Next.js & PostgreSQL)** [15] |
| **Financial Numerical Precision** | Proprietary internal currency units | Integer / Two-decimal database | Manual rounding (Vulnerable to error) | **Strict Integer Pesewas Standard (Zero Drift)** [27] |
| **Payment Verification Channel** | Cards, In-App Wallets, MoMo | Bank Cards & Multi-MoMo Rails | Unverified Manual Peer-to-Peer MoMo | **Paystack HMAC SHA512 Verified Webhooks** [16] |
| **Delivery Logistics Modeling** | Continuous GPS Lat/Long Pinning | Hybrid Street Address / Landmark | Arbitrary phone negotiation | **Deterministic Sunyani Locality Matrix** [10] |
| **Culinary Customization Level** | Standard modifier lists | Generic product SKUs (Low detail) | Unstructured free-text messaging | **Dedicated Dish & Spice Customization** [13] |
| **Kitchen Operations Integration** | Merchant tablet app required | Dedicated POS hardware terminal | None (Paper tickets, shouting in kitchen) | **Live Real-Time Kitchen Display Board (`/admin`)** |
| **Commission & Overhead Cost** | High (20% – 35% commission) [4] | Moderate merchant transaction fees | Low (Data bundle costs only) | **Zero Commission (100% Profit Retained)** |
| **Installation Requirement** | Native App Download (>50MB) | Native App Download (>60MB) | Native Messaging App (WhatsApp) | **Zero-Install Responsive Web Application (PWA)** [15] |

---

### Core Research and Engineering Gaps Identified

Based on the comparative analysis, this study identifies four fundamental architectural and operational gaps that current literature and commercial practice have left unaddressed in regional African markets:

1. **The Regional Exclusion Gap in Structured E-Commerce:**  
   Mainstream e-commerce research heavily investigates high-density metropolitan ecosystems, leaving single-enterprise restaurant operations in regional secondary cities (such as Sunyani) without scalable, accessible software solutions [9], [10]. There is an acute gap in empirical software engineering demonstrating how modern serverless and modular-monolithic frameworks can be deployed cost-effectively for standalone enterprises in developing regions [15].

2. **The Financial Precision and Integrity Gap:**  
   Most small-scale web ordering systems deployed in regional economies fail to enforce strict financial precision, inadvertently introducing accumulated rounding errors through floating-point math (`FLOAT`/`DOUBLE`) or leaving themselves exposed to client-side price manipulation [27], [32]. A rigorous, server-authoritative implementation that bridges the Ghanaian Integer Pesewas standard directly with Paystack’s cryptographic webhook infrastructure represents an unfulfilled operational need [16], [28].

3. **The Localized Logistics and Addressing Gap:**  
   Global platforms assume high-resolution spatial data and standardized street addresses. In regional Ghanaian municipalities like Sunyani, where street naming is informal and mobile data connectivity fluctuates, spatial coordinate models frequently fail [10]. There is a distinct gap for a software-driven, municipality-grounded locality matrix that maps recognized municipal clusters (Fiapre, Berlin Top, Penkwase, etc.) to deterministic fees and realistic kitchen dispatch intervals [10], [13].

4. **The Fulfilment State Transparency Gap:**  
   Informal commerce isolates the customer in a communication void once payment is initiated. Existing academic literature on food delivery consistently emphasizes that consumer anxiety increases exponentially with post-payment uncertainty [3], [14]. Developing a lightweight, reactive kitchen state machine that provides auditable milestone tracking (`CONFIRMED` $\rightarrow$ `PREPARING` $\rightarrow$ `OUT_FOR_DELIVERY` $\rightarrow$ `COMPLETED`) without requiring expensive proprietary hardware addresses a major usability void [2], [22].

---

## 2.6 Chapter Summary

This chapter has provided an extensive, academically grounded literature review establishing the theoretical, conceptual, and empirical foundations of this dissertation. By exploring the Technology Acceptance Model (TAM), the DeLone and McLean Information Systems Success Model, and Institutional Trust paradigms, the review established that user adoption in localized e-commerce is fundamentally driven by system reliability, computational precision, and the systemic mitigation of perceived financial risk. 

Furthermore, a critical evaluation of existing commercial models in Ghana—ranging from national aggregators (Bolt Food/Jumia) and merchant super-apps (Hubtel) to informal social commerce (WhatsApp)—revealed critical systemic vulnerabilities. These include extractive commission burdens, geographic exclusion of regional hubs like Sunyani, chaotic manual order transcription, vulnerability to mobile money fraud, and accumulated financial drift resulting from improper floating-point arithmetic. 

By identifying these critical gaps, this chapter has justified the technical necessity for designing and implementing the **Sika Cuisine Web Ordering and Delivery Tracking System**. The proposed platform combines a server-authoritative Next.js architecture, an integer pesewas financial engine, cryptographic Paystack webhook verification, and a localized Sunyani delivery matrix into a cohesive, production-grade enterprise platform. The engineering methodologies, structural diagrams, and algorithmic workflows required to realize this system are comprehensively detailed in Chapter Three.

---

## References

*(Continuing directly from Chapter One references [1] through [18])*

[19] F. D. Davis, "Perceived usefulness, perceived ease of use, and user acceptance of information technology," *MIS Quarterly*, vol. 13, no. 3, pp. 319–340, 1989.

[20] V. Venkatesh and F. D. Davis, "A theoretical extension of the Technology Acceptance Model: Four longitudinal field studies," *Management Science*, vol. 46, no. 2, pp. 186–204, 2000.

[21] W. H. DeLone and E. R. McLean, "Information systems success: The quest for the dependent variable," *Information Systems Research*, vol. 3, no. 1, pp. 60–95, 1992.

[22] W. H. DeLone and E. R. McLean, "The DeLone and McLean model of information systems success: A ten-year update," *Journal of Management Information Systems*, vol. 19, no. 4, pp. 9–30, 2003.

[23] Y. Wang, Z. Shen, J. Huang, and Y. Liu, "Influencing factors of the continuous usage intention of consumers of online food delivery platform based on an information system success model," *Frontiers in Psychology*, vol. 12, p. 747476, 2021.

[24] E. Erkmen and M. Turegun, "Success model of online food delivery system: The role of brand image in customer responses," *Journal of Hospitality and Tourism Technology*, vol. 13, no. 5, pp. 823–839, 2022.

[25] D. H. McKnight, V. Choudhury, and C. Kacmar, "Developing and validating trust measures for e-commerce: An integrative typology," *Information Systems Research*, vol. 13, no. 3, pp. 334–359, 2002.

[26] D. Gefen, E. Karahanna, and D. W. Straub, "Trust and TAM in online shopping: An integrated model," *MIS Quarterly*, vol. 27, no. 1, pp. 51–90, 2003.

[27] D. Goldberg, "What every computer scientist should know about floating-point arithmetic," *ACM Computing Surveys (CSUR)*, vol. 23, no. 1, pp. 5–48, 1991.

[28] IEEE Standards Association, *IEEE Standard for Floating-Point Arithmetic*, IEEE Standard 754-2019, New York, NY: IEEE, 2019.

[29] A. Mensah, E. N. Brako, and P. K. Owusu, "Evaluating online food delivery services and customer satisfaction in urban Ghana," *African Journal of Applied Research*, vol. 10, no. 1, pp. 88–104, 2024.

[30] E. N. Brako, J. O. Agyemang, and F. S. Asante, "Impact of digital food delivery platforms on traditional restaurants in Ghana: A cross-sectional analysis," *Asian Journal of Economics, Business and Accounting*, vol. 25, no. 2, pp. 45–59, 2025.

[31] Hubtel Limited, "Hubtel Developer Ecosystem and Merchant Integration Architecture Guide," Hubtel Documentation, Accra, Ghana, Tech. Whitepaper, 2025. [Online]. Available: https://developers.hubtel.com

[32] OWASP Foundation, "OWASP Top 10 API Security Risks – 2023: Broken Object Level Authorization and Server-Side Validation Failures," Open Web Application Security Project, Tech. Rep., 2023. [Online]. Available: https://owasp.org/www-project-api-security/

[33] K. Owusu-Kwateng, K. O. Acheampong, and K. A. Poku, "Evaluating mobile money adoption in Ghanaian retail: Security, trust, and operational constraints," *Journal of Financial Services Marketing*, vol. 22, no. 4, pp. 156–168, 2017.

[34] M. A. A. Cox and D. G. Jenkins, "Human-computer interaction and micro-interactions in mobile commerce checkout flows," *Interacting with Computers*, vol. 34, no. 3, pp. 201–217, 2022.
