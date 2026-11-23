import { FulfilmentStatus, PaymentMethod, PaymentStatus } from "../contracts/order";

export interface PaymentGateResult {
  allowed: boolean;
  reason?: string;
}

export interface RetrySafetyResult {
  action: "ALREADY_PAID" | "WAIT_PENDING" | "ALLOW_RETRY";
  message: string;
}

/**
 * Prevents Cashiers or Kitchen staff from confirming or preparing an unpaid Paystack order.
 * Cash-on-Delivery and Cash-on-Collection are allowed while paymentStatus is PENDING.
 * Cancellation/rejection remain allowed regardless of payment state.
 */
export function canConfirmOrFulfilOrder(
  paymentMethod: PaymentMethod,
  paymentStatus: PaymentStatus,
  targetStatus: FulfilmentStatus
): PaymentGateResult {
  if (targetStatus === "CANCELLED" || targetStatus === "REJECTED") {
    return { allowed: true };
  }

  if (paymentMethod === "PAYSTACK" && paymentStatus !== "PAID") {
    return {
      allowed: false,
      reason:
        "Cannot advance an unpaid Paystack order. Online payment must be verified before confirmation or preparation.",
    };
  }

  return { allowed: true };
}

/**
 * Determines whether an order should appear in the Cashier and Kitchen live operational queues.
 * Unpaid online (PAYSTACK) orders are excluded until paymentStatus reaches PAID.
 */
export function isOperationalQueueOrder(order: {
  paymentMethod: string;
  paymentStatus: string;
}): boolean {
  return !(order.paymentMethod === "PAYSTACK" && order.paymentStatus !== "PAID");
}

/**
 * Evaluates all verified Paystack gateway statuses for an order before permitting another payment initialization.
 * Prevents double debits when a customer was already charged or has an active MoMo/Card prompt in flight.
 */
export function evaluatePaymentRetrySafety(
  gatewayStatuses: string[]
): RetrySafetyResult {
  const normalized = gatewayStatuses.map((s) => String(s || "").trim().toLowerCase());

  if (normalized.some((s) => s === "success")) {
    return {
      action: "ALREADY_PAID",
      message:
        "Your earlier payment has already been confirmed. You will not be charged again.",
    };
  }

  if (
    normalized.some(
      (s) =>
        s === "pending" ||
        s === "ongoing" ||
        s === "processing" ||
        s === "queued"
    )
  ) {
    return {
      action: "WAIT_PENDING",
      message:
        "A Mobile Money or card payment is currently processing. Please approve the prompt on your phone or tap Verify again in 30 seconds.",
    };
  }

  return {
    action: "ALLOW_RETRY",
    message: "No completed payment found. Safe to start a fresh payment attempt.",
  };
}

/**
 * Validates deep-link return targets used by Expo WebBrowser auth sessions so open-redirect
 * or script-scheme URLs can never be bounced through `/api/v1/payments/mobile-callback`.
 */
export function isAllowedMobileReturnUrl(
  rawUrl: string | null | undefined,
  allowExpoDevScheme: boolean
): boolean {
  if (!rawUrl || typeof rawUrl !== "string") return false;
  const trimmed = rawUrl.trim();
  if (!trimmed || trimmed.length > 300) return false;
  if (/[\s\u0000-\u001F]/.test(trimmed) || trimmed.includes("@")) {
    return false;
  }

  if (/^sikacuisine:\/\/payment-callback(\/[A-Za-z0-9._\-\/]*)?$/i.test(trimmed)) {
    return true;
  }

  if (
    allowExpoDevScheme &&
    /^exp:\/\/[A-Za-z0-9.\-:]+(\/[A-Za-z0-9._\-\/]*)?$/i.test(trimmed)
  ) {
    return true;
  }

  return false;
}
