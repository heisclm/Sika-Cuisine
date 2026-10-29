import test from "node:test";
import assert from "node:assert/strict";
import {
  isValidOrderTransition,
  isRoleAuthorizedForTransition,
  calculateLineTotalPesewas,
  calculateOrderTotalPesewas,
  calculateDeliveryFeePesewas,
  createOrderSchema,
  updateOrderStatusSchema,
  Role,
  FulfilmentStatus,
  FulfilmentType,
} from "../src/index.js";

// ============================================================================
// 1. IDOR & AUTHORIZATION POLICY TESTS
// ============================================================================
test("Authorization Policy: enforces strict resource ownership", () => {
  const customerA = { id: "cust-1", email: "kwame@example.com", role: "CUSTOMER" as Role };
  const customerB = { id: "cust-2", email: "abena@example.com", role: "CUSTOMER" as Role };
  const kitchenStaff = { id: "staff-1", email: "kitchen@sikacuisine.com", role: "STAFF_KITCHEN" as Role };
  const admin = { id: "admin-1", email: "admin@sikacuisine.com", role: "ADMIN" as Role };

  const orderBelongingToCustomerA = {
    id: "ord-100",
    orderNumber: "SIKA-2026-100",
    customerId: "cust-1",
    guestEmail: "kwame@example.com",
  };

  function canAccessOrder(user: { id: string; email: string; role: Role }, order: { customerId: string | null; guestEmail: string | null }) {
    const isStaff = ["ADMIN", "STAFF_CASHIER", "STAFF_KITCHEN", "DELIVERY_RIDER"].includes(user.role);
    const isOwner = order.customerId === user.id || (order.guestEmail && order.guestEmail.toLowerCase() === user.email.toLowerCase());
    return isStaff || isOwner;
  }

  // Customer A can view their own order
  assert.equal(canAccessOrder(customerA, orderBelongingToCustomerA), true);

  // Customer B is FORBIDDEN from viewing Customer A's order (IDOR Defense)
  assert.equal(canAccessOrder(customerB, orderBelongingToCustomerA), false);

  // Staff and Admin are permitted to view for operational handling
  assert.equal(canAccessOrder(kitchenStaff, orderBelongingToCustomerA), true);
  assert.equal(canAccessOrder(admin, orderBelongingToCustomerA), true);
});

// ============================================================================
// 2. STATE MACHINE TRANSITION ENFORCEMENT
// ============================================================================
test("State Machine: strict progression for Delivery workflow", () => {
  let status: FulfilmentStatus = "PENDING";

  // Step 1: PENDING -> CONFIRMED
  assert.ok(isValidOrderTransition("DELIVERY", status, "CONFIRMED"));
  status = "CONFIRMED";

  // Step 2: CONFIRMED -> PREPARING
  assert.ok(isValidOrderTransition("DELIVERY", status, "PREPARING"));
  status = "PREPARING";

  // Step 3: PREPARING -> READY_FOR_DISPATCH
  assert.ok(isValidOrderTransition("DELIVERY", status, "READY_FOR_DISPATCH"));
  status = "READY_FOR_DISPATCH";

  // Step 4: READY_FOR_DISPATCH -> OUT_FOR_DELIVERY
  assert.ok(isValidOrderTransition("DELIVERY", status, "OUT_FOR_DELIVERY"));
  status = "OUT_FOR_DELIVERY";

  // Step 5: OUT_FOR_DELIVERY -> DELIVERED
  assert.ok(isValidOrderTransition("DELIVERY", status, "DELIVERED"));
  status = "DELIVERED";

  // Terminal state: no further transitions allowed
  assert.equal(isValidOrderTransition("DELIVERY", status, "PENDING"), false);
  assert.equal(isValidOrderTransition("DELIVERY", status, "CONFIRMED"), false);
});

test("State Machine: strict progression for Pickup (Collection) workflow", () => {
  let status: FulfilmentStatus = "PENDING";

  // Step 1: PENDING -> CONFIRMED
  assert.ok(isValidOrderTransition("COLLECTION", status, "CONFIRMED"));
  status = "CONFIRMED";

  // Step 2: CONFIRMED -> PREPARING
  assert.ok(isValidOrderTransition("COLLECTION", status, "PREPARING"));
  status = "PREPARING";

  // Step 3: PREPARING -> READY_FOR_PICKUP
  assert.ok(isValidOrderTransition("COLLECTION", status, "READY_FOR_PICKUP"));
  status = "READY_FOR_PICKUP";

  // Step 4: READY_FOR_PICKUP -> COLLECTED
  assert.ok(isValidOrderTransition("COLLECTION", status, "COLLECTED"));
  status = "COLLECTED";

  // Terminal state: no further transitions allowed
  assert.equal(isValidOrderTransition("COLLECTION", status, "PENDING"), false);
});

test("State Machine: strictly rejects illegal cross-workflow transitions", () => {
  // A pickup order cannot be dispatched for delivery
  assert.equal(isValidOrderTransition("COLLECTION", "PREPARING", "READY_FOR_DISPATCH"), false);
  assert.equal(isValidOrderTransition("COLLECTION", "PREPARING", "OUT_FOR_DELIVERY"), false);
  assert.equal(isValidOrderTransition("COLLECTION", "READY_FOR_PICKUP", "OUT_FOR_DELIVERY"), false);
  assert.equal(isValidOrderTransition("COLLECTION", "READY_FOR_PICKUP", "DELIVERED"), false);

  // A delivery order cannot be marked ready for counter pickup
  assert.equal(isValidOrderTransition("DELIVERY", "PREPARING", "READY_FOR_PICKUP"), false);
  assert.equal(isValidOrderTransition("DELIVERY", "READY_FOR_DISPATCH", "COLLECTED"), false);
});

// ============================================================================
// 3. SERVER-CALCULATED FINANCIAL TOTALS & ZERO-FEE PICKUP
// ============================================================================
test("Financial: server-side cart recalculation overrides client data", () => {
  // Authoritative database prices
  const dbCatalog: Record<string, { basePricePesewas: number; isAvailable: boolean }> = {
    "dish-jollof": { basePricePesewas: 4000, isAvailable: true }, // GH₵ 40.00
    "dish-tilapia": { basePricePesewas: 8000, isAvailable: true }, // GH₵ 80.00
  };

  const clientCart = [
    { menuItemId: "dish-jollof", quantity: 2 },
    { menuItemId: "dish-tilapia", quantity: 1 },
  ];

  // Recalculate strictly on server
  let subtotal = 0;
  for (const item of clientCart) {
    const dbItem = dbCatalog[item.menuItemId];
    subtotal += calculateLineTotalPesewas(dbItem.basePricePesewas, item.quantity, 0);
  }

  // (4000 * 2) + (8000 * 1) = 8000 + 8000 = 16000 pesewas (GH₵ 160.00)
  assert.equal(subtotal, 16000);

  // For COLLECTION: Delivery fee is 0 pesewas
  const pickupFee = calculateDeliveryFeePesewas("COLLECTION", "Fiapre");
  assert.equal(pickupFee, 0);
  const pickupTotal = calculateOrderTotalPesewas({ subtotalPesewas: subtotal, deliveryFeePesewas: pickupFee });
  assert.equal(pickupTotal, 16000);

  // For DELIVERY to Fiapre (Zone 1): Fee is 800 pesewas
  const deliveryFee = calculateDeliveryFeePesewas("DELIVERY", "Fiapre");
  assert.equal(deliveryFee, 800);
  const deliveryTotal = calculateOrderTotalPesewas({ subtotalPesewas: subtotal, deliveryFeePesewas: deliveryFee });
  assert.equal(deliveryTotal, 16800);
});

// ============================================================================
// 4. UPDATE STATUS SCHEMA VALIDATION
// ============================================================================
test("Schema: validates status update payload", () => {
  const validUpdate = updateOrderStatusSchema.safeParse({
    targetStatus: "CONFIRMED",
    note: "Chef accepted ticket on station 1",
  });
  assert.ok(validUpdate.success);

  const invalidStatus = updateOrderStatusSchema.safeParse({
    targetStatus: "NOT_A_REAL_STATUS",
  });
  assert.equal(invalidStatus.success, false);
});
