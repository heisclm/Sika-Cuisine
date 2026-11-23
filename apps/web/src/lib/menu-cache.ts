import { MenuItem } from "@/types/menu";

const MENU_CACHE_KEY = "sika_web_menu_cache_v1";
const STALE_AFTER_MS = 45_000;

interface MenuCacheSnapshot {
  items: MenuItem[];
  fetchedAt: number;
}

let memorySnapshot: MenuCacheSnapshot | null = null;
let inflightRequest: Promise<MenuItem[]> | null = null;

function mapCatalogItems(
  rawItems: Array<MenuItem & { category?: { name: string } }>
): MenuItem[] {
  return rawItems.map((item) => ({
    ...item,
    categoryName: item.category?.name ?? item.categoryName,
  }));
}

/**
 * Synchronously returns the latest cached menu snapshot (memory first, then sessionStorage)
 * so Home and Menu pages render dishes and cached images on frame 1 without skeleton flashes.
 */
export function readCachedWebMenu(): MenuCacheSnapshot | null {
  if (memorySnapshot && memorySnapshot.items.length > 0) {
    return memorySnapshot;
  }

  if (typeof window === "undefined") return null;

  try {
    const raw = window.sessionStorage.getItem(MENU_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as MenuCacheSnapshot;
    if (!Array.isArray(parsed?.items) || parsed.items.length === 0) return null;
    memorySnapshot = parsed;
    return parsed;
  } catch {
    return null;
  }
}

export function isWebMenuCacheFresh(snapshot: MenuCacheSnapshot | null): boolean {
  if (!snapshot) return false;
  return Date.now() - snapshot.fetchedAt < STALE_AFTER_MS;
}

/**
 * Fetches and caches the live Sika Cuisine menu catalog, deduplicating concurrent calls
 * across components (e.g. Home -> Menu transitions).
 */
export async function fetchAndCacheWebMenu(force = false): Promise<MenuItem[]> {
  if (!force) {
    const existing = readCachedWebMenu();
    if (existing && isWebMenuCacheFresh(existing)) {
      return existing.items;
    }
  }

  if (inflightRequest) {
    return inflightRequest;
  }

  inflightRequest = (async () => {
    const response = await fetch("/api/v1/menu/items?includeUnavailable=true");
    const payload = await response.json();
    if (!response.ok || !payload.success) {
      throw new Error(payload.error || "Unable to load restaurant menu.");
    }

    const mapped = mapCatalogItems(payload.items ?? []);
    const snapshot: MenuCacheSnapshot = {
      items: mapped,
      fetchedAt: Date.now(),
    };
    memorySnapshot = snapshot;

    if (typeof window !== "undefined") {
      try {
        window.sessionStorage.setItem(MENU_CACHE_KEY, JSON.stringify(snapshot));
      } catch {
        // Ignore quota errors on private browsing tabs
      }
    }

    return mapped;
  })();

  try {
    return await inflightRequest;
  } finally {
    inflightRequest = null;
  }
}
