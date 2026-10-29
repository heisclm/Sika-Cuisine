import test from "node:test";
import assert from "node:assert/strict";
import {
  pesewasToGhs,
  ghsToPesewas,
  formatPesewasToGhs,
  calculateLineTotalPesewas,
  calculateOrderTotalPesewas,
  calculateDeliveryFeePesewas,
  SUNYANI_DELIVERY_ZONES,
  DEFAULT_DELIVERY_FEE_PESEWAS,
  isValidOrderTransition,
  getAllowedNextStatuses,
  isRoleAuthorizedForTransition,
  createOrderSchema,
  loginSchema,
  registerSchema,
} from "../src/index.js";

// ============================================================================
// 1. FINANCIAL & CURRENCY TESTS (INTEGER PESEWAS)
// ============================================================================
test("Currency: converts integer pesewas to GHS correctly", () => {
  assert.equal(pesewasToGhs(4000), 40.0);
  assert.equal(pesewasToGhs(4550), 45.5);
  assert.equal(pesewasToGhs(0), 0.0);
  assert.throws(() => pesewasToGhs(45.5 as any), TypeError);
});

test("Currency: converts GHS to integer pesewas correctly", () => {
  assert.equal(ghsToPesewas(40.0), 4000);
  assert.equal(ghsToPesewas(45.5), 4550);
  assert.equal(ghsToPesewas(0.0), 0);
});

test("Currency: formats pesewas with GH₵ currency display", () => {
  const formatted = formatPesewasToGhs(4550);
  assert.ok(formatted.includes("45.50"));
  assert.ok(formatted.includes("GH₵") || formatted.includes("GHS"));
});

test("Currency: calculates line item totals in pesewas", () => {
  // Base 4000 pesewas (GH₵40), quantity 2, options +500 pesewas (GH₵5)
  // (4000 + 500) * 2 = 9000 pesewas (GH₵90)
  const lineTotal = calculateLineTotalPesewas(4000, 2, 500);
  assert.equal(lineTotal, 9000);
});

test("Currency: calculates order grand total", () => {
  const total = calculateOrderTotalPesewas({
    subtotalPesewas: 8000,
    deliveryFeePesewas: 1200,
    discountPesewas: 500,
  });
  assert.equal(total, 8700);
});

// ============================================================================
// 2. DELIVERY ZONE & ZERO-FEE PICKUP TESTS
// ============================================================================
test("Delivery: collection (pickup) unconditionally incurs 0 pesewas delivery fee", () => {
  assert.equal(calculateDeliveryFeePesewas("COLLECTION", "Fiapre"), 0);
  assert.equal(calculateDeliveryFeePesewas("COLLECTION", "Abesim"), 0);
  assert.equal(calculateDeliveryFeePesewas("COLLECTION", "Sunyani Airport"), 0);
  assert.equal(calculateDeliveryFeePesewas("COLLECTION", null), 0);
});

test("Delivery: resolves Sunyani municipal zones accurately", () => {
  // Zone 1: 800 pesewas (GH₵8.00)
  assert.equal(calculateDeliveryFeePesewas("DELIVERY", "Fiapre"), 800);
  assert.equal(calculateDeliveryFeePesewas("DELIVERY", "UENR Campus"), 800);

  // Zone 2: 1200 pesewas (GH₵12.00)
  assert.equal(calculateDeliveryFeePesewas("DELIVERY", "Abesim"), 1200);
  assert.equal(calculateDeliveryFeePesewas("DELIVERY", "Berlin Top"), 1200);

  // Zone 3: 1500 pesewas (GH₵15.00)
  assert.equal(calculateDeliveryFeePesewas("DELIVERY", "Kotokrom"), 1500);

  // Zone 4: 2000 pesewas (GH₵20.00)
  assert.equal(calculateDeliveryFeePesewas("DELIVERY", "Sunyani Airport Enclave"), 2000);

  // Unrecognized locality defaults to standard fallback
  assert.equal(calculateDeliveryFeePesewas("DELIVERY", "Unknown Street"), DEFAULT_DELIVERY_FEE_PESEWAS);
});

// ============================================================================
// 3. ORDER STATE MACHINE TESTS
// ============================================================================
test("State Machine: valid delivery progression succeeds", () => {
  assert.ok(isValidOrderTransition("DELIVERY", "PENDING", "CONFIRMED"));
  assert.ok(isValidOrderTransition("DELIVERY", "CONFIRMED", "PREPARING"));
  assert.ok(isValidOrderTransition("DELIVERY", "PREPARING", "READY_FOR_DISPATCH"));
  assert.ok(isValidOrderTransition("DELIVERY", "READY_FOR_DISPATCH", "OUT_FOR_DELIVERY"));
  assert.ok(isValidOrderTransition("DELIVERY", "OUT_FOR_DELIVERY", "DELIVERED"));
});

test("State Machine: valid pickup progression succeeds", () => {
  assert.ok(isValidOrderTransition("COLLECTION", "PENDING", "CONFIRMED"));
  assert.ok(isValidOrderTransition("COLLECTION", "CONFIRMED", "PREPARING"));
  assert.ok(isValidOrderTransition("COLLECTION", "PREPARING", "READY_FOR_PICKUP"));
  assert.ok(isValidOrderTransition("COLLECTION", "READY_FOR_PICKUP", "COLLECTED"));
});

test("State Machine: forbids pickup states on delivery orders", () => {
  assert.equal(isValidOrderTransition("DELIVERY", "PREPARING", "READY_FOR_PICKUP"), false);
  assert.equal(isValidOrderTransition("DELIVERY", "READY_FOR_PICKUP", "COLLECTED"), false);
});

test("State Machine: forbids delivery states on pickup orders", () => {
  assert.equal(isValidOrderTransition("COLLECTION", "PREPARING", "READY_FOR_DISPATCH"), false);
  assert.equal(isValidOrderTransition("COLLECTION", "PREPARING", "OUT_FOR_DELIVERY"), false);
  assert.equal(isValidOrderTransition("COLLECTION", "READY_FOR_DISPATCH", "OUT_FOR_DELIVERY"), false);
  assert.equal(isValidOrderTransition("COLLECTION", "OUT_FOR_DELIVERY", "DELIVERED"), false);
});

test("State Machine: rejection and cancellation boundaries", () => {
  // Can reject from PENDING
  assert.ok(isValidOrderTransition("DELIVERY", "PENDING", "REJECTED"));
  assert.ok(isValidOrderTransition("COLLECTION", "PENDING", "REJECTED"));

  // Cannot reject after confirmation
  assert.equal(isValidOrderTransition("DELIVERY", "CONFIRMED", "REJECTED"), false);
  assert.equal(isValidOrderTransition("DELIVERY", "PREPARING", "REJECTED"), false);

  // Can cancel before kitchen prep
  assert.ok(isValidOrderTransition("DELIVERY", "PENDING", "CANCELLED"));
  assert.ok(isValidOrderTransition("DELIVERY", "CONFIRMED", "CANCELLED"));

  // Prohibited once in PREPARING or beyond
  assert.equal(isValidOrderTransition("DELIVERY", "PREPARING", "CANCELLED"), false);
  assert.equal(isValidOrderTransition("DELIVERY", "OUT_FOR_DELIVERY", "CANCELLED"), false);
  assert.equal(isValidOrderTransition("COLLECTION", "READY_FOR_PICKUP", "CANCELLED"), false);
});

test("State Machine: role-based transition authorization", () => {
  // Cashier and Admin can confirm
  assert.ok(isRoleAuthorizedForTransition("STAFF_CASHIER", "PENDING", "CONFIRMED").authorized);
  assert.ok(isRoleAuthorizedForTransition("ADMIN", "PENDING", "CONFIRMED").authorized);

  // Kitchen staff cannot confirm or reject pending orders
  assert.equal(isRoleAuthorizedForTransition("STAFF_KITCHEN", "PENDING", "CONFIRMED").authorized, false);
  assert.equal(isRoleAuthorizedForTransition("STAFF_KITCHEN", "PENDING", "REJECTED").authorized, false);

  // Kitchen staff CAN move confirmed order to PREPARING and READY_FOR_DISPATCH
  assert.ok(isRoleAuthorizedForTransition("STAFF_KITCHEN", "CONFIRMED", "PREPARING").authorized);
  assert.ok(isRoleAuthorizedForTransition("STAFF_KITCHEN", "PREPARING", "READY_FOR_DISPATCH").authorized);

  // Rider cannot transition to PREPARING
  assert.equal(isRoleAuthorizedForTransition("DELIVERY_RIDER", "CONFIRMED", "PREPARING").authorized, false);
  // Rider CAN transition to OUT_FOR_DELIVERY and DELIVERED
  assert.ok(isRoleAuthorizedForTransition("DELIVERY_RIDER", "READY_FOR_DISPATCH", "OUT_FOR_DELIVERY").authorized);
  assert.ok(isRoleAuthorizedForTransition("DELIVERY_RIDER", "OUT_FOR_DELIVERY", "DELIVERED").authorized);

  // Customer cannot transition to kitchen or staff states
  assert.equal(isRoleAuthorizedForTransition("CUSTOMER", "PENDING", "CONFIRMED").authorized, false);
  // Customer can cancel while in PENDING
  assert.ok(isRoleAuthorizedForTransition("CUSTOMER", "PENDING", "CANCELLED").authorized);
});

// ============================================================================
// 4. ZOD VALIDATION SCHEMA TESTS
// ============================================================================
test("Schema: validates valid delivery order", () => {
  const result = createOrderSchema.safeParse({
    fulfilmentType: "DELIVERY",
    paymentMethod: "PAYSTACK",
    customerInfo: {
      fullName: "Kwame Mensah",
      email: "kwame@example.com",
      phone: "+233244123456",
    },
    deliveryAddress: {
      recipientName: "Kwame Mensah",
      recipientPhone: "+233244123456",
      streetAddress: "House 44, Fiapre Rd",
      areaLocality: "Fiapre",
    },
    items: [
      {
        menuItemId: "dish-jollof",
        quantity: 2,
        selectedOptionIds: [],
      },
    ],
  });
  assert.ok(result.success);
});

test("Schema: rejects delivery order without delivery address", () => {
  const result = createOrderSchema.safeParse({
    fulfilmentType: "DELIVERY",
    paymentMethod: "PAYSTACK",
    customerInfo: {
      fullName: "Kwame Mensah",
      email: "kwame@example.com",
      phone: "+233244123456",
    },
    items: [
      {
        menuItemId: "dish-jollof",
        quantity: 1,
        selectedOptionIds: [],
      },
    ],
  });
  assert.equal(result.success, false);
});

test("Schema: rejects invalid payment pairings", () => {
  // Cash on Delivery requested for a Pickup order
  const invalidPickup = createOrderSchema.safeParse({
    fulfilmentType: "COLLECTION",
    paymentMethod: "CASH_ON_DELIVERY",
    customerInfo: {
      fullName: "Abena Osei",
      email: "abena@example.com",
      phone: "+233554123456",
    },
    items: [{ menuItemId: "dish-waakye", quantity: 1, selectedOptionIds: [] }],
  });
  assert.equal(invalidPickup.success, false);

  // Cash on Collection requested for a Delivery order
  const invalidDelivery = createOrderSchema.safeParse({
    fulfilmentType: "DELIVERY",
    paymentMethod: "CASH_ON_COLLECTION",
    customerInfo: {
      fullName: "Abena Osei",
      email: "abena@example.com",
      phone: "+233554123456",
    },
    deliveryAddress: {
      recipientName: "Abena Osei",
      recipientPhone: "+233554123456",
      streetAddress: "Airport Road",
      areaLocality: "Sunyani Airport",
    },
    items: [{ menuItemId: "dish-waakye", quantity: 1, selectedOptionIds: [] }],
  });
  assert.equal(invalidDelivery.success, false);
});
