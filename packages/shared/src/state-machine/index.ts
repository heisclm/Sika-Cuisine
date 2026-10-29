/**
 * @file packages/shared/src/state-machine/index.ts
 * @description Pure deterministic finite automaton (DFA) governing Sika Cuisine order lifecycles.
 *
 * ARCHITECTURAL DESIGN & INVARIANTS:
 * 1. Dual-Workflow Isolation: Enforces mutually exclusive state trajectories for DELIVERY and COLLECTION (Pickup).
 *    Delivery states (READY_FOR_DISPATCH, OUT_FOR_DELIVERY, DELIVERED) cannot be entered by pickup orders.
 *    Pickup states (READY_FOR_PICKUP, COLLECTED) cannot be entered by delivery orders.
 * 2. Self-Transition Prevention: A state cannot transition into itself (currentStatus === targetStatus returns false).
 * 3. Terminal Immutability: Terminal states (DELIVERED, COLLECTED, CANCELLED, REJECTED) have empty outgoing transition sets.
 * 4. Principle of Least Privilege (RBAC): Enforces role boundaries on transitions to protect kitchen operations
 *    and prevent fraudulent customer cancellations post-food-preparation.
 */

import { FulfilmentStatus, FulfilmentType, Role } from "../contracts/order";

/**
 * Valid state transitions for Home/Office Delivery orders.
 *
 * Sequence:
 * PENDING -> CONFIRMED -> PREPARING -> READY_FOR_DISPATCH -> OUT_FOR_DELIVERY -> DELIVERED
 *
 * Terminal exits:
 * - CANCELLED: Allowed from PENDING or CONFIRMED (before cooking starts).
 * - REJECTED: Allowed from PENDING (by kitchen/cashier if out of stock or outside delivery radius).
 */
export const DELIVERY_TRANSITIONS: Record<FulfilmentStatus, FulfilmentStatus[]> = {
  PENDING: ["CONFIRMED", "REJECTED", "CANCELLED"],
  CONFIRMED: ["PREPARING", "CANCELLED"],
  PREPARING: ["READY_FOR_DISPATCH"],
  READY_FOR_DISPATCH: ["OUT_FOR_DELIVERY"],
  OUT_FOR_DELIVERY: ["DELIVERED"],
  DELIVERED: [], // Terminal success
  READY_FOR_PICKUP: [], // Invariant: Illegal for Delivery workflow
  COLLECTED: [], // Invariant: Illegal for Delivery workflow
  CANCELLED: [], // Terminal abort
  REJECTED: [], // Terminal rejection
};

/**
 * Valid state transitions for Restaurant Pickup / Takeaway orders.
 *
 * Sequence:
 * PENDING -> CONFIRMED -> PREPARING -> READY_FOR_PICKUP -> COLLECTED
 *
 * Terminal exits:
 * - CANCELLED: Allowed from PENDING or CONFIRMED (prior to meal preparation).
 * - REJECTED: Allowed from PENDING (by kitchen/cashier).
 */
export const PICKUP_TRANSITIONS: Record<FulfilmentStatus, FulfilmentStatus[]> = {
  PENDING: ["CONFIRMED", "REJECTED", "CANCELLED"],
  CONFIRMED: ["PREPARING", "CANCELLED"],
  PREPARING: ["READY_FOR_PICKUP"],
  READY_FOR_PICKUP: ["COLLECTED"],
  COLLECTED: [], // Terminal success
  READY_FOR_DISPATCH: [], // Invariant: Illegal for Pickup workflow
  OUT_FOR_DELIVERY: [], // Invariant: Illegal for Pickup workflow
  DELIVERED: [], // Invariant: Illegal for Pickup workflow
  CANCELLED: [], // Terminal abort
  REJECTED: [], // Terminal rejection
};

/**
 * Evaluates whether an order status transition is structurally legal according to the order's fulfilment workflow.
 *
 * @param fulfilmentType - Order fulfilment mode ('DELIVERY' | 'COLLECTION')
 * @param currentStatus - Current fulfilment state in database
 * @param targetStatus - Proposed next fulfilment state
 * @returns boolean - True if the transition exists in the workflow graph and is not a self-transition
 */
export function isValidOrderTransition(
  fulfilmentType: FulfilmentType,
  currentStatus: FulfilmentStatus,
  targetStatus: FulfilmentStatus
): boolean {
  // Reject redundant self-transitions early to avoid spurious history logs
  if (currentStatus === targetStatus) {
    return false;
  }

  const table = fulfilmentType === "COLLECTION" ? PICKUP_TRANSITIONS : DELIVERY_TRANSITIONS;
  const allowedNext = table[currentStatus] || [];
  return allowedNext.includes(targetStatus);
}

/**
 * Retrieves all permitted subsequent statuses for an order given its current state and fulfilment workflow.
 * Useful for populating administrative UI action buttons and client-side next-step indicators.
 *
 * @param fulfilmentType - Order fulfilment mode ('DELIVERY' | 'COLLECTION')
 * @param currentStatus - Current fulfilment state
 * @returns FulfilmentStatus[] - Array of valid target statuses
 */
export function getAllowedNextStatuses(
  fulfilmentType: FulfilmentType,
  currentStatus: FulfilmentStatus
): FulfilmentStatus[] {
  const table = fulfilmentType === "COLLECTION" ? PICKUP_TRANSITIONS : DELIVERY_TRANSITIONS;
  return table[currentStatus] || [];
}

/**
 * Enforces server-side Role-Based Access Control (RBAC) on order state transitions.
 *
 * Authorization Matrix:
 * - ADMIN / STAFF_CASHIER: Full administrative authority across all transitions.
 * - STAFF_KITCHEN: Operational control over culinary prep ('PREPARING', 'READY_FOR_DISPATCH', 'READY_FOR_PICKUP').
 * - DELIVERY_RIDER: Transit control ('OUT_FOR_DELIVERY', 'DELIVERED').
 * - CUSTOMER: Restricted to canceling own order exclusively while in 'PENDING' status (prior to food prep).
 *
 * @param role - Authenticated actor's role
 * @param currentStatus - Current order fulfilment status
 * @param targetStatus - Desired target status
 * @returns Object indicating authorization result with user-friendly failure rationale
 */
export function isRoleAuthorizedForTransition(
  role: Role,
  currentStatus: FulfilmentStatus,
  targetStatus: FulfilmentStatus
): { authorized: boolean; reason?: string } {
  // High-privilege administrative roles have universal oversight
  if (role === "ADMIN" || role === "STAFF_CASHIER") {
    return { authorized: true };
  }

  // Kitchen team manages preparation and ready-for-handover states
  if (role === "STAFF_KITCHEN") {
    const kitchenAllowed: FulfilmentStatus[] = ["PREPARING", "READY_FOR_DISPATCH", "READY_FOR_PICKUP"];
    if (kitchenAllowed.includes(targetStatus)) {
      return { authorized: true };
    }
    return {
      authorized: false,
      reason: `Kitchen staff is not authorized to transition order to ${targetStatus}.`,
    };
  }

  // Delivery riders manage order pickup from restaurant and delivery to customer doorstep
  if (role === "DELIVERY_RIDER") {
    const riderAllowed: FulfilmentStatus[] = ["OUT_FOR_DELIVERY", "DELIVERED"];
    if (riderAllowed.includes(targetStatus)) {
      return { authorized: true };
    }
    return {
      authorized: false,
      reason: "Delivery riders are only authorized to advance orders to OUT_FOR_DELIVERY or DELIVERED.",
    };
  }

  // Customers can only cancel unconfirmed orders to prevent inventory loss
  if (role === "CUSTOMER") {
    if (targetStatus === "CANCELLED" && currentStatus === "PENDING") {
      return { authorized: true };
    }
    return {
      authorized: false,
      reason: "Customers may only cancel orders before kitchen confirmation and meal preparation.",
    };
  }

  return { authorized: false, reason: "Unauthorized role for status transition." };
}
