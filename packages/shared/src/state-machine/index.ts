import { FulfilmentStatus, FulfilmentType, Role } from "../contracts/order";

/**
 * Valid transitions for Delivery orders:
 * PENDING -> CONFIRMED -> PREPARING -> READY_FOR_DISPATCH -> OUT_FOR_DELIVERY -> DELIVERED
 */
export const DELIVERY_TRANSITIONS: Record<FulfilmentStatus, FulfilmentStatus[]> = {
  PENDING: ["CONFIRMED", "REJECTED", "CANCELLED"],
  CONFIRMED: ["PREPARING", "CANCELLED"],
  PREPARING: ["READY_FOR_DISPATCH"],
  READY_FOR_DISPATCH: ["OUT_FOR_DELIVERY"],
  OUT_FOR_DELIVERY: ["DELIVERED"],
  DELIVERED: [], // Terminal
  READY_FOR_PICKUP: [], // Illegal for Delivery
  COLLECTED: [], // Illegal for Delivery
  CANCELLED: [], // Terminal
  REJECTED: [], // Terminal
};

/**
 * Valid transitions for Pickup / Collection orders:
 * PENDING -> CONFIRMED -> PREPARING -> READY_FOR_PICKUP -> COLLECTED
 */
export const PICKUP_TRANSITIONS: Record<FulfilmentStatus, FulfilmentStatus[]> = {
  PENDING: ["CONFIRMED", "REJECTED", "CANCELLED"],
  CONFIRMED: ["PREPARING", "CANCELLED"],
  PREPARING: ["READY_FOR_PICKUP"],
  READY_FOR_PICKUP: ["COLLECTED"],
  COLLECTED: [], // Terminal
  READY_FOR_DISPATCH: [], // Illegal for Pickup
  OUT_FOR_DELIVERY: [], // Illegal for Pickup
  DELIVERED: [], // Illegal for Pickup
  CANCELLED: [], // Terminal
  REJECTED: [], // Terminal
};

/**
 * Verifies whether a given transition is legal for the specified fulfilment workflow.
 */
export function isValidOrderTransition(
  fulfilmentType: FulfilmentType,
  currentStatus: FulfilmentStatus,
  targetStatus: FulfilmentStatus
): boolean {
  if (currentStatus === targetStatus) {
    return false;
  }

  const table = fulfilmentType === "COLLECTION" ? PICKUP_TRANSITIONS : DELIVERY_TRANSITIONS;
  const allowedNext = table[currentStatus] || [];
  return allowedNext.includes(targetStatus);
}

/**
 * Returns the list of permitted next statuses for an order.
 */
export function getAllowedNextStatuses(
  fulfilmentType: FulfilmentType,
  currentStatus: FulfilmentStatus
): FulfilmentStatus[] {
  const table = fulfilmentType === "COLLECTION" ? PICKUP_TRANSITIONS : DELIVERY_TRANSITIONS;
  return table[currentStatus] || [];
}

/**
 * Role-based authorization for order transitions.
 * Kitchen staff can move orders to PREPARING, READY_FOR_DISPATCH, or READY_FOR_PICKUP.
 * Cashier / Admin can confirm, reject, dispatch, complete, or cancel.
 * Customers can only cancel while in PENDING.
 */
export function isRoleAuthorizedForTransition(
  role: Role,
  currentStatus: FulfilmentStatus,
  targetStatus: FulfilmentStatus
): { authorized: boolean; reason?: string } {
  if (role === "ADMIN" || role === "STAFF_CASHIER") {
    return { authorized: true };
  }

  if (role === "STAFF_KITCHEN") {
    // Kitchen staff can accept into prep and mark ready
    const kitchenAllowed = ["PREPARING", "READY_FOR_DISPATCH", "READY_FOR_PICKUP"];
    if (kitchenAllowed.includes(targetStatus)) {
      return { authorized: true };
    }
    return {
      authorized: false,
      reason: `Kitchen staff is not authorized to transition order to ${targetStatus}.`,
    };
  }

  if (role === "DELIVERY_RIDER") {
    // Rider can pick up and deliver
    const riderAllowed = ["OUT_FOR_DELIVERY", "DELIVERED"];
    if (riderAllowed.includes(targetStatus)) {
      return { authorized: true };
    }
    return {
      authorized: false,
      reason: `Delivery riders are only authorized to advance to OUT_FOR_DELIVERY or DELIVERED.`,
    };
  }

  if (role === "CUSTOMER") {
    if (targetStatus === "CANCELLED" && currentStatus === "PENDING") {
      return { authorized: true };
    }
    return {
      authorized: false,
      reason: "Customers may only cancel orders before kitchen confirmation.",
    };
  }

  return { authorized: false, reason: "Unauthorized role." };
}
