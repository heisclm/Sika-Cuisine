import AsyncStorage from "@react-native-async-storage/async-storage";
import { EnrichedMenuItem } from "../components/DishCard";
import { apiRequest } from "./api-client";

const LIVE_MENU_CACHE_KEY = "@sika_live_menu_cache_v1";
const STALE_AFTER_MS = 45_000;

export interface LiveMenuCachePayload {
  items: EnrichedMenuItem[];
  savedAt: string;
  fetchedAt?: number;
}

let memoryMenuCache: LiveMenuCachePayload | null = null;
let inflightMenuPromise: Promise<{
  success: boolean;
  items?: EnrichedMenuItem[];
}> | null = null;

/**
 * Synchronously returns the in-memory menu snapshot so tab transitions
 * and screen mounts render dishes and images immediately on frame 1.
 */
export function getInMemoryMenuCache(): LiveMenuCachePayload | null {
  return memoryMenuCache && memoryMenuCache.items.length > 0
    ? memoryMenuCache
    : null;
}

export function isMemoryMenuCacheFresh(): boolean {
  if (!memoryMenuCache?.fetchedAt) return false;
  return Date.now() - memoryMenuCache.fetchedAt < STALE_AFTER_MS;
}

/**
 * Persists the most recent live PostgreSQL menu snapshot returned from `/api/v1/menu/items`
 * in both fast RAM and AsyncStorage so tab switches render instantly and brief cellular drops
 * preserve current prices & availability.
 */
export async function saveLiveMenuCache(items: EnrichedMenuItem[]): Promise<void> {
  if (!items || items.length === 0) return;
  const payload: LiveMenuCachePayload = {
    items,
    savedAt: new Date().toISOString(),
    fetchedAt: Date.now(),
  };
  memoryMenuCache = payload;
  try {
    await AsyncStorage.setItem(LIVE_MENU_CACHE_KEY, JSON.stringify(payload));
  } catch (err) {
    console.warn("[AsyncStorage Error]: Failed to cache live menu snapshot", err);
  }
}

/**
 * Reads the last live fetched menu snapshot from memory or AsyncStorage, if available.
 */
export async function getLiveMenuCache(): Promise<LiveMenuCachePayload | null> {
  if (memoryMenuCache && memoryMenuCache.items.length > 0) {
    return memoryMenuCache;
  }
  try {
    const raw = await AsyncStorage.getItem(LIVE_MENU_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as LiveMenuCachePayload;
    if (!Array.isArray(parsed?.items) || parsed.items.length === 0) return null;
    memoryMenuCache = parsed;
    return parsed;
  } catch {
    return null;
  }
}

/**
 * Fetches `/api/v1/menu/items?includeUnavailable=true`, deduplicating concurrent callers
 * across HomeScreen and MenuScreen and keeping memory + AsyncStorage snapshots warm.
 */
export async function fetchAndCacheMobileMenu(force = false): Promise<{
  success: boolean;
  items?: EnrichedMenuItem[];
}> {
  if (!force && isMemoryMenuCacheFresh() && memoryMenuCache?.items?.length) {
    return { success: true, items: memoryMenuCache.items };
  }

  if (inflightMenuPromise) {
    return inflightMenuPromise;
  }

  inflightMenuPromise = (async () => {
    const res = await apiRequest<{
      success: boolean;
      items: EnrichedMenuItem[];
    }>("/menu/items?includeUnavailable=true");

    if (res.success && res.data?.items?.length) {
      await saveLiveMenuCache(res.data.items);
      return { success: true, items: res.data.items };
    }
    return { success: false };
  })();

  try {
    return await inflightMenuPromise;
  } finally {
    inflightMenuPromise = null;
  }
}
