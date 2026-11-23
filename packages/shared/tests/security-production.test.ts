import test from "node:test";
import assert from "node:assert/strict";
import * as crypto from "crypto";
import {
  buildOrderStatusHistoryNote,
  canAccessWorkspace,
  canConfirmOrFulfilOrder,
  computePercentageDelta,
  escapeCsvCell,
  evaluatePaymentRetrySafety,
  formatCustomerTimelineNote,
  formatFirstName,
  formatFulfilmentStatusLabel,
  formatFulfilmentTypeLabel,
  formatInitials,
  formatPaymentMethodLabel,
  formatPaymentStatusLabel,
  formatTimeOfDayGreeting,
  getAnalyticsPeriodBounds,
  getDashboardForRole,
  getDateRangeBounds,
  isAllowedMobileReturnUrl,
  isAvailabilityOnlyMenuPatch,
  isOperationalQueueOrder,
  isRoleAuthorizedForTransition,
  isValidOrderTransition,
  normalizeCustomerCohortKey,
  parseAnalyticsPeriod,
  phoneRegex,
  resolveCartOwnerTransition,
  resolveCustomerAuthRedirect,
  shouldAutoRefundOrder,
} from "../src/index.js";

// ============================================================================
// 1. PAYSTACK WEBHOOK HMAC-SHA512 SIGNATURE VERIFICATION INVARIANTS
// ============================================================================
function signPaystackBody(rawBody: string, secret: string): string {
  return crypto.createHmac("sha512", secret).update(rawBody).digest("hex");
}

function verifyPaystackSignature(
  rawBody: string,
  signatureHeader: string,
  secret: string
): boolean {
  if (!secret || !signatureHeader) return false;
  const expected = signPaystackBody(rawBody, secret);
  if (expected.length !== signatureHeader.length) return false;
  return crypto.timingSafeEqual(
    Buffer.from(expected, "utf8"),
    Buffer.from(signatureHeader, "utf8")
  );
}

test("Paystack Webhook Security: validates constant-time HMAC-SHA512 signatures", () => {
  const secret = "sk_test_sika_webhook_secret_key_for_hmac_verification";
  const payload = JSON.stringify({
    event: "charge.success",
    data: { reference: "SIKA-REF-001", amount: 16800, currency: "GHS" },
  });

  const validSig = signPaystackBody(payload, secret);
  assert.equal(verifyPaystackSignature(payload, validSig, secret), true);

  // Tampered amount must fail verification immediately
  const tamperedPayload = JSON.stringify({
    event: "charge.success",
    data: { reference: "SIKA-REF-001", amount: 100, currency: "GHS" },
  });
  assert.equal(verifyPaystackSignature(tamperedPayload, validSig, secret), false);

  // Wrong secret or missing header must fail verification
  assert.equal(
    verifyPaystackSignature(payload, validSig, "wrong_secret_key"),
    false
  );
  assert.equal(verifyPaystackSignature(payload, "", secret), false);
});

// ============================================================================
// 2. INVITE / PASSWORD RESET TOKEN HASHING & EXPIRATION BOUNDARIES
// ============================================================================
test("Security Tokens: SHA-256 digests are deterministic, one-way, and 64 hex chars", () => {
  const rawToken = crypto.randomBytes(32).toString("hex");
  const digestA = crypto.createHash("sha256").update(rawToken).digest("hex");
  const digestB = crypto.createHash("sha256").update(rawToken).digest("hex");

  assert.equal(rawToken.length, 64);
  assert.equal(digestA.length, 64);
  assert.equal(digestA, digestB);
  assert.notEqual(digestA, rawToken);

  const now = Date.now();
  const validExpiry = new Date(now + 24 * 60 * 60_000);
  const expired = new Date(now - 1_000);
  assert.equal(validExpiry.getTime() > now, true);
  assert.equal(expired.getTime() > now, false);
});

// ============================================================================
// 3. GHANA PHONE VALIDATION & NORMALIZATION
// ============================================================================
function normalizeGhanaPhone(raw: string): string {
  const digits = raw.replace(/[^\d]/g, "");
  if (digits.startsWith("233") && digits.length >= 12) return digits;
  if (digits.startsWith("0") && digits.length === 10) return `233${digits.slice(1)}`;
  return digits;
}

test("Ghana Phone Rules: accepts local & +233 formats and normalizes for SMS", () => {
  assert.equal(phoneRegex.test("0244123456"), true);
  assert.equal(phoneRegex.test("0533376760"), true);
  assert.equal(phoneRegex.test("+233533376760"), true);
  assert.equal(phoneRegex.test("12345"), false);

  assert.equal(normalizeGhanaPhone("0533376760"), "233533376760");
  assert.equal(normalizeGhanaPhone("+233 533 376 760"), "233533376760");
});

// ============================================================================
// 4. RIDER & CUSTOMER ISOLATION IN STATE MACHINE RBAC
// ============================================================================
test("Dispatch RBAC: restricts riders strictly to courier delivery steps", () => {
  assert.equal(
    isValidOrderTransition("DELIVERY", "READY_FOR_DISPATCH", "OUT_FOR_DELIVERY"),
    true
  );
  assert.equal(
    isRoleAuthorizedForTransition(
      "DELIVERY_RIDER",
      "READY_FOR_DISPATCH",
      "OUT_FOR_DELIVERY"
    ).authorized,
    true
  );
  assert.equal(
    isRoleAuthorizedForTransition(
      "DELIVERY_RIDER",
      "OUT_FOR_DELIVERY",
      "DELIVERED"
    ).authorized,
    true
  );

  // Rider must NEVER confirm pending orders or prepare kitchen orders
  assert.equal(
    isRoleAuthorizedForTransition("DELIVERY_RIDER", "PENDING", "CONFIRMED")
      .authorized,
    false
  );
  assert.equal(
    isRoleAuthorizedForTransition("DELIVERY_RIDER", "CONFIRMED", "PREPARING")
      .authorized,
    false
  );

  // Customers cannot advance fulfilment to kitchen or delivery states
  assert.equal(
    isRoleAuthorizedForTransition("CUSTOMER", "PENDING", "CONFIRMED").authorized,
    false
  );
  assert.equal(
    isRoleAuthorizedForTransition("CUSTOMER", "OUT_FOR_DELIVERY", "DELIVERED")
      .authorized,
    false
  );
});

// ============================================================================
// 5. ROLE-SEPARATED DASHBOARD ROUTING & WORKSPACE RBAC
// ============================================================================
test("Role Routing: maps each role to its dedicated portal and label", () => {
  assert.equal(getDashboardForRole("ADMIN").path, "/admin");
  assert.equal(getDashboardForRole("STAFF_CASHIER").path, "/cashier");
  assert.equal(getDashboardForRole("STAFF_KITCHEN").path, "/kitchen");
  assert.equal(getDashboardForRole("DELIVERY_RIDER").path, "/rider");
  assert.equal(getDashboardForRole("CUSTOMER").path, "/account");
  assert.equal(getDashboardForRole(null).path, "/account");
  assert.equal(getDashboardForRole("UNKNOWN_ROLE").path, "/account");
});

test("Workspace Access: isolates Admin, Cashier, Kitchen, Rider, and Customer panels", () => {
  // ADMIN can supervise admin, cashier, and kitchen (not courier-only rider console)
  assert.equal(canAccessWorkspace("ADMIN", "admin"), true);
  assert.equal(canAccessWorkspace("ADMIN", "cashier"), true);
  assert.equal(canAccessWorkspace("ADMIN", "kitchen"), true);
  assert.equal(canAccessWorkspace("ADMIN", "rider"), false);

  // STAFF_CASHIER strictly locked to /cashier
  assert.equal(canAccessWorkspace("STAFF_CASHIER", "cashier"), true);
  assert.equal(canAccessWorkspace("STAFF_CASHIER", "admin"), false);
  assert.equal(canAccessWorkspace("STAFF_CASHIER", "kitchen"), false);
  assert.equal(canAccessWorkspace("STAFF_CASHIER", "rider"), false);

  // STAFF_KITCHEN strictly locked to /kitchen
  assert.equal(canAccessWorkspace("STAFF_KITCHEN", "kitchen"), true);
  assert.equal(canAccessWorkspace("STAFF_KITCHEN", "admin"), false);
  assert.equal(canAccessWorkspace("STAFF_KITCHEN", "cashier"), false);
  assert.equal(canAccessWorkspace("STAFF_KITCHEN", "rider"), false);

  // DELIVERY_RIDER strictly locked to /rider
  assert.equal(canAccessWorkspace("DELIVERY_RIDER", "rider"), true);
  assert.equal(canAccessWorkspace("DELIVERY_RIDER", "admin"), false);
  assert.equal(canAccessWorkspace("DELIVERY_RIDER", "cashier"), false);
  assert.equal(canAccessWorkspace("DELIVERY_RIDER", "kitchen"), false);

  // CUSTOMER barred from all operational workspaces
  assert.equal(canAccessWorkspace("CUSTOMER", "admin"), false);
  assert.equal(canAccessWorkspace("CUSTOMER", "cashier"), false);
  assert.equal(canAccessWorkspace("CUSTOMER", "kitchen"), false);
  assert.equal(canAccessWorkspace("CUSTOMER", "rider"), false);
});

test("Menu Stock RBAC: identifies availability-only toggles vs Admin catalog edits", () => {
  assert.equal(isAvailabilityOnlyMenuPatch({ isAvailable: false }), true);
  assert.equal(isAvailabilityOnlyMenuPatch({ isAvailable: true }), true);

  assert.equal(
    isAvailabilityOnlyMenuPatch({ isAvailable: false, basePricePesewas: 5000 }),
    false
  );
  assert.equal(isAvailabilityOnlyMenuPatch({ basePricePesewas: 8500 }), false);
  assert.equal(isAvailabilityOnlyMenuPatch({ name: "Jollof" }), false);
  assert.equal(isAvailabilityOnlyMenuPatch({}), false);
});

test("Kitchen KDS RBAC: permits prep/ready states and forbids order confirmation, rejection, or handover", () => {
  assert.equal(
    isRoleAuthorizedForTransition("STAFF_KITCHEN", "CONFIRMED", "PREPARING").authorized,
    true
  );
  assert.equal(
    isRoleAuthorizedForTransition("STAFF_KITCHEN", "PREPARING", "READY_FOR_DISPATCH")
      .authorized,
    true
  );
  assert.equal(
    isRoleAuthorizedForTransition("STAFF_KITCHEN", "PREPARING", "READY_FOR_PICKUP")
      .authorized,
    true
  );

  // Kitchen must NOT confirm/reject pending orders or mark collected/delivered
  assert.equal(
    isRoleAuthorizedForTransition("STAFF_KITCHEN", "PENDING", "CONFIRMED").authorized,
    false
  );
  assert.equal(
    isRoleAuthorizedForTransition("STAFF_KITCHEN", "PENDING", "REJECTED").authorized,
    false
  );
  assert.equal(
    isRoleAuthorizedForTransition("STAFF_KITCHEN", "READY_FOR_PICKUP", "COLLECTED")
      .authorized,
    false
  );
  assert.equal(
    isRoleAuthorizedForTransition("STAFF_KITCHEN", "OUT_FOR_DELIVERY", "DELIVERED")
      .authorized,
    false
  );
});

// ============================================================================
// 6. PAYSTACK BYPASS PREVENTION, DOUBLE-DEBIT GUARD & MOBILE CALLBACK ALLOWLIST
// ============================================================================
test("Payment Bypass Gate: blocks confirmation/prep of unpaid Paystack orders while allowing Cash", () => {
  // Unpaid PAYSTACK order must NOT be confirmed or prepared
  assert.equal(
    canConfirmOrFulfilOrder("PAYSTACK", "PENDING", "CONFIRMED").allowed,
    false
  );
  assert.equal(
    canConfirmOrFulfilOrder("PAYSTACK", "FAILED", "PREPARING").allowed,
    false
  );
  // Aborting an unpaid PAYSTACK order remains permitted
  assert.equal(
    canConfirmOrFulfilOrder("PAYSTACK", "PENDING", "CANCELLED").allowed,
    true
  );
  assert.equal(
    canConfirmOrFulfilOrder("PAYSTACK", "PENDING", "REJECTED").allowed,
    true
  );

  // Paid PAYSTACK and Cash-on-Handover orders pass normally
  assert.equal(
    canConfirmOrFulfilOrder("PAYSTACK", "PAID", "CONFIRMED").allowed,
    true
  );
  assert.equal(
    canConfirmOrFulfilOrder("CASH_ON_DELIVERY", "PENDING", "CONFIRMED").allowed,
    true
  );
  assert.equal(
    canConfirmOrFulfilOrder("CASH_ON_COLLECTION", "PENDING", "CONFIRMED").allowed,
    true
  );

  // Cashier/Kitchen operational queue filter excludes unpaid PAYSTACK only
  assert.equal(
    isOperationalQueueOrder({ paymentMethod: "PAYSTACK", paymentStatus: "PENDING" }),
    false
  );
  assert.equal(
    isOperationalQueueOrder({ paymentMethod: "PAYSTACK", paymentStatus: "FAILED" }),
    false
  );
  assert.equal(
    isOperationalQueueOrder({ paymentMethod: "PAYSTACK", paymentStatus: "PAID" }),
    true
  );
  assert.equal(
    isOperationalQueueOrder({
      paymentMethod: "CASH_ON_DELIVERY",
      paymentStatus: "PENDING",
    }),
    true
  );
});

test("Double-Debit Guard: evaluates gateway attempt statuses before permitting retry", () => {
  assert.equal(
    evaluatePaymentRetrySafety(["abandoned", "success"]).action,
    "ALREADY_PAID"
  );
  assert.equal(
    evaluatePaymentRetrySafety(["failed", "ongoing"]).action,
    "WAIT_PENDING"
  );
  assert.equal(
    evaluatePaymentRetrySafety(["pending"]).action,
    "WAIT_PENDING"
  );
  assert.equal(
    evaluatePaymentRetrySafety(["failed", "abandoned"]).action,
    "ALLOW_RETRY"
  );
  assert.equal(evaluatePaymentRetrySafety([]).action, "ALLOW_RETRY");
});

test("Mobile Callback Security: permits app deep links and rejects open redirects", () => {
  assert.equal(
    isAllowedMobileReturnUrl("sikacuisine://payment-callback", false),
    true
  );
  assert.equal(
    isAllowedMobileReturnUrl("exp://192.168.1.10:8081/--/payment-callback", true),
    true
  );
  // Expo dev URLs must be rejected in production mode
  assert.equal(
    isAllowedMobileReturnUrl("exp://192.168.1.10:8081/--/payment-callback", false),
    false
  );
  // Open redirects and script schemes must always fail
  assert.equal(isAllowedMobileReturnUrl("https://evil.example/phish", true), false);
  assert.equal(isAllowedMobileReturnUrl("javascript:alert(1)", true), false);
  assert.equal(
    isAllowedMobileReturnUrl("sikacuisine://payment-callback@evil.com", true),
    false
  );
});

// ============================================================================
// 7. AUTOMATED PAYSTACK REFUNDS, DATE FILTERS & CSV INJECTION SANITIZATION
// ============================================================================
test("Auto-Refund Eligibility: refunds strictly PAID Paystack orders on REJECTED/CANCELLED", () => {
  assert.equal(shouldAutoRefundOrder("PAYSTACK", "PAID", "REJECTED"), true);
  assert.equal(shouldAutoRefundOrder("PAYSTACK", "PAID", "CANCELLED"), true);

  // Non-terminal transitions must NOT trigger refunds
  assert.equal(shouldAutoRefundOrder("PAYSTACK", "PAID", "CONFIRMED"), false);
  assert.equal(shouldAutoRefundOrder("PAYSTACK", "PAID", "DELIVERED"), false);

  // Already refunded or unpaid Paystack must NOT double-refund
  assert.equal(shouldAutoRefundOrder("PAYSTACK", "PENDING", "REJECTED"), false);
  assert.equal(shouldAutoRefundOrder("PAYSTACK", "FAILED", "CANCELLED"), false);
  assert.equal(shouldAutoRefundOrder("PAYSTACK", "REFUND_PENDING", "REJECTED"), false);
  assert.equal(shouldAutoRefundOrder("PAYSTACK", "REFUNDED", "REJECTED"), false);

  // Cash orders are never refunded via Paystack
  assert.equal(shouldAutoRefundOrder("CASH_ON_DELIVERY", "PAID", "CANCELLED"), false);
  assert.equal(shouldAutoRefundOrder("CASH_ON_COLLECTION", "PENDING", "REJECTED"), false);
});

test("Date Range Bounds: computes accurate today, yesterday, 7d, 30d, year, and all bounds", () => {
  const anchor = new Date(2026, 10, 21, 14, 30, 0, 0);

  const today = getDateRangeBounds("today", anchor);
  assert.equal(today.gte?.getFullYear(), 2026);
  assert.equal(today.gte?.getDate(), 21);
  assert.equal(today.gte?.getHours(), 0);
  assert.equal(today.lt, undefined);

  const yesterday = getDateRangeBounds("yesterday", anchor);
  assert.equal(yesterday.gte?.getDate(), 20);
  assert.equal(yesterday.lt?.getDate(), 21);

  const sevenDays = getDateRangeBounds("7d", anchor);
  assert.equal(anchor.getTime() - (sevenDays.gte?.getTime() ?? 0), 7 * 24 * 60 * 60_000);

  const thirtyDays = getDateRangeBounds("30d", anchor);
  assert.equal(anchor.getTime() - (thirtyDays.gte?.getTime() ?? 0), 30 * 24 * 60 * 60_000);

  const yearBounds = getDateRangeBounds("year", anchor);
  assert.equal(yearBounds.gte?.getMonth(), 0);
  assert.equal(yearBounds.gte?.getDate(), 1);

  const all = getDateRangeBounds("all", anchor);
  assert.equal(all.gte, undefined);
  assert.equal(all.lt, undefined);
});

test("CSV Formula Injection Neutralization: safely escapes leading =/+/-/@ and quotes", () => {
  assert.equal(escapeCsvCell("=CMD('calc')"), "'=CMD('calc')");
  assert.equal(escapeCsvCell("+1+1"), "'+1+1");
  assert.equal(escapeCsvCell("-100"), "'-100");
  assert.equal(escapeCsvCell("@SUM(A1:A5)"), "'@SUM(A1:A5)");
  assert.equal(escapeCsvCell('Jollof, "Extra" Spicy'), '"Jollof, ""Extra"" Spicy"');
  assert.equal(escapeCsvCell(null), "");
  assert.equal(escapeCsvCell("SIKA-2026-AB12"), "SIKA-2026-AB12");
});

// ============================================================================
// 8. HUMAN-READABLE TIMELINE NOTES & STATUS LABEL SANITIZATION
// ============================================================================
test("Order Label Formatters: maps raw enum values cleanly for customers", () => {
  assert.equal(formatPaymentMethodLabel("CASH_ON_DELIVERY"), "Cash on Delivery");
  assert.equal(formatPaymentMethodLabel("CASH_ON_COLLECTION"), "Cash at Counter");
  assert.equal(formatPaymentMethodLabel("PAYSTACK"), "Paystack (MoMo & Card)");

  assert.equal(formatPaymentStatusLabel("REFUND_PENDING"), "Refund Processing");
  assert.equal(formatFulfilmentStatusLabel("READY_FOR_DISPATCH"), "Packed for Dispatch");
  assert.equal(formatFulfilmentStatusLabel("OUT_FOR_DELIVERY"), "Out for Delivery");
  assert.equal(formatFulfilmentTypeLabel("COLLECTION"), "Counter Pickup");
});

test("Customer Timeline Sanitizer: upgrades legacy raw DB notes without exposing internal staff names", () => {
  assert.equal(
    formatCustomerTimelineNote("PENDING", "Order submitted online via CASH_ON_DELIVERY."),
    "Order placed with Cash on Delivery — awaiting cashier confirmation."
  );
  assert.equal(
    formatCustomerTimelineNote("PENDING", "Order submitted online via CASH_ON_COLLECTION."),
    "Order placed with Cash at Counter — awaiting cashier confirmation."
  );

  const dispatchNote = formatCustomerTimelineNote(
    "READY_FOR_DISPATCH",
    "Status updated to READY_FOR_DISPATCH by Clement."
  );
  assert.equal(dispatchNote, "Meal packed and ready for rider pickup.");
  assert.equal(dispatchNote.includes("_"), false);
  assert.equal(dispatchNote.includes("Clement"), false);

  assert.equal(
    buildOrderStatusHistoryNote("OUT_FOR_DELIVERY"),
    "Your delivery rider is on the way."
  );
});

// ============================================================================
// 9. ADMIN ANALYTICS PERIOD BUCKETS, DELTAS & CUSTOMER COHORT UNIFICATION
// ============================================================================
test("Analytics Period Bounds: generates 24 hourly, 7 daily, 30 daily, and 12 monthly buckets", () => {
  const anchor = new Date("2026-11-21T14:30:00Z");

  assert.equal(parseAnalyticsPeriod("WEEKLY"), "weekly");
  assert.equal(parseAnalyticsPeriod("invalid"), "daily");

  const daily = getAnalyticsPeriodBounds("daily", anchor);
  assert.equal(daily.buckets.length, 24);
  assert.equal(daily.previousEnd.getTime(), daily.currentStart.getTime());

  const weekly = getAnalyticsPeriodBounds("weekly", anchor);
  assert.equal(weekly.buckets.length, 7);
  assert.equal(weekly.previousEnd.getTime(), weekly.currentStart.getTime());

  const monthly = getAnalyticsPeriodBounds("monthly", anchor);
  assert.equal(monthly.buckets.length, 30);
  assert.equal(monthly.previousEnd.getTime(), monthly.currentStart.getTime());

  const yearly = getAnalyticsPeriodBounds("yearly", anchor);
  assert.equal(yearly.buckets.length, 12);
  assert.equal(yearly.previousEnd.getTime(), yearly.currentStart.getTime());
});

test("Analytics Deltas & Customer Cohort Keys: computes growth % and unifies Ghana phone variants", () => {
  assert.equal(computePercentageDelta(15000, 10000), 50);
  assert.equal(computePercentageDelta(5000, 10000), -50);
  assert.equal(computePercentageDelta(10000, 0), 100);
  assert.equal(computePercentageDelta(0, 0), 0);

  // Registered user ID takes precedence
  assert.equal(
    normalizeCustomerCohortKey({ customerId: "usr_123", guestPhone: "0591744454" }),
    "user:usr_123"
  );
  // Guest local 059... and international +23359... unify to the exact same cohort key
  assert.equal(
    normalizeCustomerCohortKey({ guestPhone: "059 174 4454" }),
    "phone:233591744454"
  );
  assert.equal(
    normalizeCustomerCohortKey({ guestPhone: "+233591744454" }),
    "phone:233591744454"
  );
});

// ============================================================================
// 10. FIRST-NAME EXTRACTION, MONOGRAM INITIALS & SMART CUSTOMER AUTH REDIRECTS
// ============================================================================
test("First-Name & Initials Formatters: handles multi-part names and prevents UI overflow", () => {
  assert.equal(formatFirstName("Clement Kwame Osei Bonsu"), "Clement");
  assert.equal(formatFirstName("  clement   mensah "), "Clement");
  assert.equal(formatFirstName("CLEMENT MENSAH"), "Clement");
  assert.equal(formatFirstName(""), "Guest");
  assert.equal(formatFirstName("Supercalifragilisticexpialidocious", "Guest", 12), "Supercalifr…");

  assert.equal(formatInitials("Clement Kwame Osei"), "CK");
  assert.equal(formatInitials("Clement"), "CL");
  assert.equal(formatInitials(""), "SC");

  const evening = new Date("2026-11-21T19:00:00");
  assert.equal(
    formatTimeOfDayGreeting("Clement Kwame Osei", evening),
    "Good Evening, Clement"
  );
  assert.equal(formatTimeOfDayGreeting(null, evening), "Good Evening");
});

test("Customer Auth Redirect Resolver: prioritizes safe returnTo, then non-empty tray (/checkout), then home (/)", () => {
  assert.equal(resolveCustomerAuthRedirect({ cartItemCount: 0 }), "/");
  assert.equal(resolveCustomerAuthRedirect({ cartItemCount: 2 }), "/checkout");
  assert.equal(
    resolveCustomerAuthRedirect({ returnTo: "/menu", cartItemCount: 0 }),
    "/menu"
  );
  // Rejects open redirects and auth-loop paths
  assert.equal(
    resolveCustomerAuthRedirect({ returnTo: "https://evil.example.com", cartItemCount: 0 }),
    "/"
  );
  assert.equal(
    resolveCustomerAuthRedirect({ returnTo: "//evil.example.com", cartItemCount: 0 }),
    "/"
  );
  assert.equal(
    resolveCustomerAuthRedirect({ returnTo: "/login", cartItemCount: 0 }),
    "/"
  );
});

test("Cart Session Isolation: preserves guest->user checkout items and blocks User A -> User B leakage", () => {
  const userAItems = [{ id: "dish-jollof" }];
  const userBItems = [{ id: "dish-tilapia" }];
  const guestItems = [{ id: "dish-banku" }];

  // Guest adds dish then signs in -> carries guest items
  const guestToB = resolveCartOwnerTransition({
    currentOwnerId: null,
    nextOwnerId: "user-b",
    currentItems: guestItems,
    nextUserSavedItems: userBItems,
  });
  assert.equal(guestToB.nextOwnerId, "user-b");
  assert.deepEqual(guestToB.nextItems, guestItems);

  // Guest with empty tray signs in -> restores User B's saved items
  const emptyGuestToB = resolveCartOwnerTransition({
    currentOwnerId: null,
    nextOwnerId: "user-b",
    currentItems: [],
    nextUserSavedItems: userBItems,
  });
  assert.equal(emptyGuestToB.nextOwnerId, "user-b");
  assert.deepEqual(emptyGuestToB.nextItems, userBItems);

  // User A switches directly to User B -> User A's items NEVER leak to User B
  const userAToB = resolveCartOwnerTransition({
    currentOwnerId: "user-a",
    nextOwnerId: "user-b",
    currentItems: userAItems,
    nextUserSavedItems: userBItems,
  });
  assert.equal(userAToB.nextOwnerId, "user-b");
  assert.equal(userAToB.shouldPersistOutOwnerId, "user-a");
  assert.deepEqual(userAToB.nextItems, userBItems);

  // User A logs out / session expires -> active cart clears immediately
  const userAToGuest = resolveCartOwnerTransition({
    currentOwnerId: "user-a",
    nextOwnerId: null,
    currentItems: userAItems,
  });
  assert.equal(userAToGuest.nextOwnerId, null);
  assert.equal(userAToGuest.shouldPersistOutOwnerId, "user-a");
  assert.deepEqual(userAToGuest.nextItems, []);
});
