/**
 * Human-readable display formatters for payment methods, order statuses,
 * and customer-facing timeline milestone notes (sanitizing legacy snake_case DB text).
 */

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  PAYSTACK: "Paystack (MoMo & Card)",
  CASH_ON_DELIVERY: "Cash on Delivery",
  CASH_ON_COLLECTION: "Cash at Counter",
};

const PAYMENT_STATUS_LABELS: Record<string, string> = {
  PENDING: "Pending",
  PAID: "Paid",
  FAILED: "Failed",
  REFUND_PENDING: "Refund Processing",
  REFUNDED: "Refunded",
};

const FULFILMENT_STATUS_LABELS: Record<string, string> = {
  PENDING: "Pending Confirmation",
  CONFIRMED: "Confirmed",
  PREPARING: "Preparing Meal",
  READY_FOR_DISPATCH: "Packed for Dispatch",
  OUT_FOR_DELIVERY: "Out for Delivery",
  DELIVERED: "Delivered",
  READY_FOR_PICKUP: "Ready for Pickup",
  COLLECTED: "Collected",
  CANCELLED: "Cancelled",
  REJECTED: "Declined",
};

const FULFILMENT_TYPE_LABELS: Record<string, string> = {
  DELIVERY: "Delivery",
  COLLECTION: "Counter Pickup",
};

function toTitleWords(raw: string): string {
  return raw
    .trim()
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (ch) => ch.toUpperCase());
}

export function formatPaymentMethodLabel(method?: string | null): string {
  if (!method) return "Order";
  const key = method.trim().toUpperCase();
  return PAYMENT_METHOD_LABELS[key] || toTitleWords(method);
}

export function formatPaymentStatusLabel(status?: string | null): string {
  if (!status) return "Pending";
  const key = status.trim().toUpperCase();
  return PAYMENT_STATUS_LABELS[key] || toTitleWords(status);
}

export function formatFulfilmentStatusLabel(status?: string | null): string {
  if (!status) return "Pending";
  const key = status.trim().toUpperCase();
  return FULFILMENT_STATUS_LABELS[key] || toTitleWords(status);
}

export function formatFulfilmentTypeLabel(type?: string | null): string {
  if (!type) return "Order";
  const key = type.trim().toUpperCase();
  return FULFILMENT_TYPE_LABELS[key] || toTitleWords(type);
}

/**
 * Generates clean, hospitality-grade milestone prose written to `OrderStatusHistory.note`
 * (never exposing raw `SNAKE_CASE` enums or internal staff names to customers).
 */
export function buildOrderStatusHistoryNote(
  status: string,
  opts?: { paymentMethod?: string | null; fulfilmentType?: string | null }
): string {
  const key = status.trim().toUpperCase();
  const payMethod = opts?.paymentMethod?.trim().toUpperCase();

  if (key === "PENDING") {
    if (payMethod === "PAYSTACK") {
      return "Order created with Paystack (MoMo & Card) — awaiting payment verification.";
    }
    if (payMethod === "CASH_ON_COLLECTION") {
      return "Order placed with Cash at Counter — awaiting cashier confirmation.";
    }
    if (payMethod === "CASH_ON_DELIVERY") {
      return "Order placed with Cash on Delivery — awaiting cashier confirmation.";
    }
    return "Order placed — awaiting front desk confirmation.";
  }

  switch (key) {
    case "CONFIRMED":
      return "Order confirmed by our front desk and sent to the kitchen.";
    case "PREPARING":
      return "Our chefs have started preparing your meal fresh.";
    case "READY_FOR_DISPATCH":
      return "Meal packed and ready for rider pickup.";
    case "OUT_FOR_DELIVERY":
      return "Your delivery rider is on the way.";
    case "DELIVERED":
      return "Order delivered. Enjoy your meal!";
    case "READY_FOR_PICKUP":
      return "Your order is hot and ready at our Sunyani counter.";
    case "COLLECTED":
      return "Order collected at the counter. Thank you!";
    case "CANCELLED":
      return "Order was cancelled.";
    case "REJECTED":
      return "Order could not be fulfilled by the kitchen.";
    default:
      return `Status updated to ${formatFulfilmentStatusLabel(key)}.`;
  }
}

/**
 * Normalizes any persisted `OrderStatusHistory.note` at display time so both new records
 * and historical DB rows containing raw enums (`CASH_ON_DELIVERY`, `READY_FOR_DISPATCH`,
 * or `"Status updated to ... by ..."`) render cleanly for customers.
 */
export function formatCustomerTimelineNote(
  status: string,
  rawNote?: string | null,
  fallback?: string
): string {
  const clean = rawNote?.trim();
  if (!clean) {
    return fallback || buildOrderStatusHistoryNote(status);
  }

  const submittedMatch = clean.match(/^Order submitted online via ([A-Z_]+)\.?$/i);
  if (submittedMatch) {
    return buildOrderStatusHistoryNote("PENDING", {
      paymentMethod: submittedMatch[1],
    });
  }

  const staffStatusMatch = clean.match(
    /^Status updated to ([A-Z_]+)(?: by .+)?\.?$/i
  );
  if (staffStatusMatch) {
    return buildOrderStatusHistoryNote(staffStatusMatch[1]);
  }

  return clean
    .replace(/\bCASH_ON_DELIVERY\b/gi, PAYMENT_METHOD_LABELS.CASH_ON_DELIVERY)
    .replace(/\bCASH_ON_COLLECTION\b/gi, PAYMENT_METHOD_LABELS.CASH_ON_COLLECTION)
    .replace(/\bPAYSTACK\b/gi, PAYMENT_METHOD_LABELS.PAYSTACK)
    .replace(/\bREADY_FOR_DISPATCH\b/gi, FULFILMENT_STATUS_LABELS.READY_FOR_DISPATCH)
    .replace(/\bOUT_FOR_DELIVERY\b/gi, FULFILMENT_STATUS_LABELS.OUT_FOR_DELIVERY)
    .replace(/\bREADY_FOR_PICKUP\b/gi, FULFILMENT_STATUS_LABELS.READY_FOR_PICKUP)
    .replace(/\bREFUND_PENDING\b/gi, PAYMENT_STATUS_LABELS.REFUND_PENDING);
}

/**
 * Extracts and normalizes a user's first name so multi-word Ghanaian names
 * (e.g. "Clement Kwame Osei Bonsu") display cleanly in headers, profile pills,
 * and greeting banners without overflowing or pushing badges onto extra lines.
 */
export function formatFirstName(
  fullName?: string | null,
  fallback = "Guest",
  maxLen = 18
): string {
  const cleaned = typeof fullName === "string" ? fullName.trim() : "";
  if (!cleaned) return fallback;

  const firstToken = cleaned.split(/\s+/)[0] || fallback;
  const normalized =
    firstToken === firstToken.toUpperCase() ||
    firstToken === firstToken.toLowerCase()
      ? firstToken.charAt(0).toUpperCase() + firstToken.slice(1).toLowerCase()
      : firstToken;

  if (normalized.length > maxLen) {
    return `${normalized.slice(0, Math.max(maxLen - 1, 1))}…`;
  }
  return normalized;
}

/**
 * Extracts 1–2 uppercase monogram initials (e.g. "Clement Kwame Osei" -> "CK")
 * for branded obsidian/crimson avatar seals.
 */
export function formatInitials(
  fullName?: string | null,
  fallback = "SC"
): string {
  const cleaned = typeof fullName === "string" ? fullName.trim() : "";
  if (!cleaned) return fallback;

  const parts = cleaned.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return fallback;
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return `${parts[0].charAt(0)}${parts[1].charAt(0)}`.toUpperCase();
}

/**
 * Generates a warm time-of-day hospitality greeting using only the customer's first name.
 */
export function formatTimeOfDayGreeting(
  fullName?: string | null,
  now: Date = new Date()
): string {
  const hour = now.getHours();
  const salutation =
    hour < 12 ? "Good Morning" : hour < 17 ? "Good Afternoon" : "Good Evening";
  const first = formatFirstName(fullName, "");
  return first ? `${salutation}, ${first}` : salutation;
}

const DISALLOWED_CUSTOMER_RETURN_PATHS = new Set([
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/admin/login",
  "/rider/login",
]);

/**
 * Determines the post-login / post-registration destination for a `CUSTOMER`:
 * 1. Valid internal `returnTo` query path (e.g. `/checkout`, `/menu`, `/orders`)
 * 2. `/checkout` when the customer already has items waiting in their tray (`cartItemCount > 0`)
 * 3. `/` (Storefront Home) by default so customers land on the menu showcase rather than a static settings page.
 */
export function resolveCustomerAuthRedirect(options?: {
  returnTo?: string | null;
  cartItemCount?: number;
}): string {
  const rawReturn =
    typeof options?.returnTo === "string" ? options.returnTo.trim() : "";
  if (
    rawReturn.startsWith("/") &&
    !rawReturn.startsWith("//") &&
    !rawReturn.includes("://")
  ) {
    const pathnameOnly = rawReturn.split("?")[0].split("#")[0];
    if (!DISALLOWED_CUSTOMER_RETURN_PATHS.has(pathnameOnly)) {
      return rawReturn;
    }
  }

  if ((options?.cartItemCount ?? 0) > 0) {
    return "/checkout";
  }

  return "/";
}

export interface CartOwnerTransitionResult<T> {
  nextOwnerId: string | null;
  nextItems: T[];
  shouldPersistOutOwnerId?: string;
}

/**
 * Pure session-scoped cart ownership transition resolver used by both Web and Mobile:
 * - Guest (`null`) -> Signed-in User (`userB`): carries over non-empty guest tray to User B's checkout, or restores User B's saved tray.
 * - Signed-in User A -> Different User B: isolates User A's items (saving them under User A) and loads User B's own tray so carts never leak across accounts.
 * - Signed-in User A -> Guest (`null`, expired or signed out): clears active tray immediately.
 */
export function resolveCartOwnerTransition<T>(options: {
  currentOwnerId: string | null;
  nextOwnerId: string | null;
  currentItems: T[];
  nextUserSavedItems?: T[];
}): CartOwnerTransitionResult<T> {
  const {
    currentOwnerId,
    nextOwnerId,
    currentItems,
    nextUserSavedItems = [],
  } = options;

  if (currentOwnerId === nextOwnerId) {
    return {
      nextOwnerId,
      nextItems: currentItems,
    };
  }

  // Signed-in session ended or expired -> never show prior user's items to guest/next user
  if (!nextOwnerId) {
    return {
      nextOwnerId: null,
      nextItems: [],
      shouldPersistOutOwnerId: currentOwnerId ?? undefined,
    };
  }

  // Guest -> Signed-in User: keep guest's active items if any, otherwise load user's saved items
  if (!currentOwnerId) {
    return {
      nextOwnerId,
      nextItems: currentItems.length > 0 ? currentItems : nextUserSavedItems,
    };
  }

  // Switching directly from User A to User B -> strict isolation
  return {
    nextOwnerId,
    nextItems: nextUserSavedItems,
    shouldPersistOutOwnerId: currentOwnerId,
  };
}

