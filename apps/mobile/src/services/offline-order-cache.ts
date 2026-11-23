/**
 * @file apps/mobile/src/services/offline-order-cache.ts
 * @description Local persistent cache for customer order history and offline tracking.
 *
 * OFFLINE RESILIENCE & INTEGRITY GUARANTEES:
 * 1. Customer Scoping: Cache keys are partitioned by customer ID (@sika_orders_cache_${customerId})
 *    to prevent cross-user data leaks on shared devices.
 * 2. Minimal Footprint: Caches only necessary order summary fields (status, timeline, total, item list)
 *    rather than heavy database models.
 * 3. Temporal Integrity: Maintains lastSynchronizedAt timestamps. The UI displays an amber staleness banner
 *    and NEVER simulates status updates while disconnected from the server.
 * 4. Reconciliation: Automatically merges authoritative server data into the local cache on successful sync.
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  FulfilmentStatus,
  FulfilmentType,
  PaymentMethod,
  PaymentStatus,
} from "@sika/shared";

/**
 * Compact order representation stored in local device cache.
 */
export interface CachedOrderSummary {
  orderId: string;
  orderNumber: string;
  fulfilmentType: FulfilmentType;
  lastKnownStatus: FulfilmentStatus;
  paymentMethod?: PaymentMethod;
  paymentStatus?: PaymentStatus;
  createdAt?: string;
  primaryImageUrl?: string | null;
  rejectionReason?: string | null;
  cancellationReason?: string | null;
  statusHistory: Array<{
    status: FulfilmentStatus;
    timestamp: string;
    note?: string | null;
  }>;
  totalPesewas: number;
  itemsSummary: Array<{
    name: string;
    quantity: number;
  }>;
  lastSynchronizedAt: string; // ISO 8601 string
}

/**
 * Constructs a customer-scoped AsyncStorage key to isolate user data.
 */
function getCacheKey(customerId: string): string {
  return `@sika_orders_cache_${customerId}`;
}

/**
 * Persists an array of order summaries to customer-scoped local cache.
 *
 * @param customerId - User ID of the authenticated customer or 'guest'
 * @param orders - Array of order summaries to cache
 */
export async function saveOrdersToCache(
  customerId: string,
  orders: CachedOrderSummary[]
): Promise<void> {
  try {
    const key = getCacheKey(customerId);
    await AsyncStorage.setItem(key, JSON.stringify(orders));
  } catch (err) {
    console.error("[AsyncStorage Error]: Failed to save orders cache", err);
  }
}

/**
 * Retrieves cached orders for a specific customer.
 *
 * @param customerId - Customer identifier
 * @returns Promise<CachedOrderSummary[]> - Cached orders or empty array if none found
 */
export async function getOrdersFromCache(
  customerId: string
): Promise<CachedOrderSummary[]> {
  try {
    const key = getCacheKey(customerId);
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (err) {
    console.error("[AsyncStorage Error]: Failed to read orders cache", err);
    return [];
  }
}

/**
 * Updates or inserts a single order's cached state without overriding authoritative server history.
 *
 * @param customerId - Customer identifier
 * @param order - Updated order summary
 */
export async function updateCachedOrder(
  customerId: string,
  order: CachedOrderSummary
): Promise<void> {
  try {
    const existing = await getOrdersFromCache(customerId);
    const index = existing.findIndex((o) => o.orderNumber === order.orderNumber);
    if (index >= 0) {
      existing[index] = order;
    } else {
      existing.unshift(order);
    }
    await saveOrdersToCache(customerId, existing);
  } catch (err) {
    console.error("[AsyncStorage Error]: Failed to update cached order", err);
  }
}

/**
 * Clears customer-scoped order cache upon sign-out to prevent privacy leakage.
 *
 * @param customerId - Customer identifier
 */
export async function clearOrdersCache(customerId: string): Promise<void> {
  try {
    const key = getCacheKey(customerId);
    await AsyncStorage.removeItem(key);
  } catch (err) {
    console.error("[AsyncStorage Error]: Failed to clear orders cache", err);
  }
}
