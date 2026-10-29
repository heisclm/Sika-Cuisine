import AsyncStorage from "@react-native-async-storage/async-storage";
import { FulfilmentStatus, FulfilmentType } from "@sika/shared";

export interface CachedOrderSummary {
  orderId: string;
  orderNumber: string;
  fulfilmentType: FulfilmentType;
  lastKnownStatus: FulfilmentStatus;
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
  lastSynchronizedAt: string; // ISO 8601
}

function getCacheKey(customerId: string): string {
  return `@sika_orders_cache_${customerId}`;
}

/**
 * Persists minimal order summaries to local device cache.
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
 * Retrieves cached orders for an authenticated customer.
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
 * Updates a single order's cached state without hallucinating or overriding the server.
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
 * Clears cached orders on customer logout.
 */
export async function clearOrdersCache(customerId: string): Promise<void> {
  try {
    const key = getCacheKey(customerId);
    await AsyncStorage.removeItem(key);
  } catch (err) {
    console.error("[AsyncStorage Error]: Failed to clear orders cache", err);
  }
}
