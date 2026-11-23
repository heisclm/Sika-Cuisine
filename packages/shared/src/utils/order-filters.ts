import { FulfilmentStatus, PaymentMethod, PaymentStatus } from "../contracts/order";

export const ACTIVE_ORDER_STATUSES: readonly FulfilmentStatus[] = [
  "PENDING",
  "CONFIRMED",
  "PREPARING",
  "READY_FOR_DISPATCH",
  "OUT_FOR_DELIVERY",
  "READY_FOR_PICKUP",
];

export const PAST_ORDER_STATUSES: readonly FulfilmentStatus[] = [
  "DELIVERED",
  "COLLECTED",
  "CANCELLED",
  "REJECTED",
];

export const REJECTION_REASON_PRESETS: readonly string[] = [
  "Dish sold out",
  "Outside Sunyani delivery zone",
  "Kitchen closing soon",
  "Unable to reach customer phone",
  "Ingredient unavailable today",
];

export type OrderDateRange = "today" | "yesterday" | "7d" | "30d" | "year" | "all";

/**
 * Computes inclusive lower (`gte`) and exclusive upper (`lt`) Date bounds for
 * server-side order history and dispatch filtering.
 */
export function getDateRangeBounds(
  range: OrderDateRange | string | null | undefined,
  now: Date = new Date()
): { gte?: Date; lt?: Date } {
  const normalized = typeof range === "string" ? range.trim().toLowerCase() : "all";

  if (normalized === "today") {
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);
    return { gte: startOfToday };
  }

  if (normalized === "yesterday") {
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);
    const startOfYesterday = new Date(startOfToday);
    startOfYesterday.setDate(startOfYesterday.getDate() - 1);
    return { gte: startOfYesterday, lt: startOfToday };
  }

  if (normalized === "7d") {
    const cutoff = new Date(now.getTime() - 7 * 24 * 60 * 60_000);
    return { gte: cutoff };
  }

  if (normalized === "30d") {
    const cutoff = new Date(now.getTime() - 30 * 24 * 60 * 60_000);
    return { gte: cutoff };
  }

  if (normalized === "year") {
    const startOfYear = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
    return { gte: startOfYear };
  }

  return {};
}

/**
 * Determines whether transitioning a customer order to `targetStatus` must automatically
 * initiate a full Paystack refund.
 */
export function shouldAutoRefundOrder(
  paymentMethod: PaymentMethod | string,
  paymentStatus: PaymentStatus | string,
  targetStatus: FulfilmentStatus | string
): boolean {
  return (
    paymentMethod === "PAYSTACK" &&
    paymentStatus === "PAID" &&
    (targetStatus === "REJECTED" || targetStatus === "CANCELLED")
  );
}

/**
 * Escapes a single CSV cell per RFC 4180 while neutralizing spreadsheet formula injection
 * (`=`, `+`, `-`, `@`, `\t`, `\r`) before exporting financial/order tables.
 */
export function escapeCsvCell(value: unknown): string {
  if (value === null || value === undefined) return "";
  let str = String(value);

  if (/^[=+\-@\t\r]/.test(str)) {
    str = `'${str}`;
  }

  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }

  return str;
}
