import AsyncStorage from "@react-native-async-storage/async-storage";
import { EnrichedMenuItem } from "../components/DishCard";

const LIVE_MENU_CACHE_KEY = "@sika_live_menu_cache_v1";

interface LiveMenuCachePayload {
  items: EnrichedMenuItem[];
  savedAt: string;
}

/**
 * Persists the most recent live PostgreSQL menu snapshot returned from `/api/v1/menu/items`
 * so brief cellular drops preserve current prices & availability instead of stale static data.
 */
export async function saveLiveMenuCache(items: EnrichedMenuItem[]): Promise<void> {
  if (!items || items.length === 0) return;
  try {
    const payload: LiveMenuCachePayload = {
      items,
      savedAt: new Date().toISOString(),
    };
    await AsyncStorage.setItem(LIVE_MENU_CACHE_KEY, JSON.stringify(payload));
  } catch (err) {
    console.warn("[AsyncStorage Error]: Failed to cache live menu snapshot", err);
  }
}

/**
 * Reads the last live fetched menu snapshot from AsyncStorage, if available.
 */
export async function getLiveMenuCache(): Promise<LiveMenuCachePayload | null> {
  try {
    const raw = await AsyncStorage.getItem(LIVE_MENU_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as LiveMenuCachePayload;
    if (!Array.isArray(parsed?.items) || parsed.items.length === 0) return null;
    return parsed;
  } catch {
    return null;
  }
}
