import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import { Search, SlidersHorizontal, X } from "lucide-react-native";
import { formatPesewasToGhs } from "@sika/shared";
import { DishCard, EnrichedMenuItem } from "../components/DishCard";
import { DishDetailModal } from "../components/DishDetailModal";
import { RestaurantClocheIcon } from "../components/icons/RestaurantClocheIcon";
import { OfflineBanner } from "../components/OfflineBanner";
import { EmptyState } from "../components/ui/EmptyState";
import {
  DEFAULT_MENU_FILTERS,
  FilterSheet,
  MenuFilterState,
} from "../components/ui/FilterSheet";
import { DishCardSkeleton } from "../components/ui/Skeleton";
import { useCart } from "../context/CartContext";
import { useToast } from "../context/ToastContext";
import { DEFAULT_MENU_CATEGORIES, DEFAULT_MENU_ITEMS } from "../data/default-menu";
import { apiRequest } from "../services/api-client";
import {
  fetchAndCacheMobileMenu,
  getInMemoryMenuCache,
  getLiveMenuCache,
} from "../services/offline-menu-cache";
import { SikaColors, SikaRadius, SikaSpace } from "../theme";
import { triggerLightHaptic } from "../utils/haptics";

interface MenuScreenProps {
  initialCategoryId?: string;
  initialSearch?: string;
  onOpenSearch?: () => void;
  onNavigateToCart: () => void;
}

/**
 * Searchable 2-column menu catalog synchronized with live `/menu/items` API
 * and seamless offline fallback to Sika Cuisine's bundled Sunyani dishes.
 */
const MOBILE_MENU_PAGE_SIZE = 12;

export function MenuScreen({
  initialCategoryId = "all",
  initialSearch = "",
  onOpenSearch,
  onNavigateToCart,
}: MenuScreenProps) {
  const { width } = useWindowDimensions();
  const cardWidth = Math.floor((width - SikaSpace.md * 2 - 10) / 2);

  const { addItem, cartSubtotalPesewas, totalItemCount } = useCart();
  const { success } = useToast();

  const [menuItems, setMenuItems] = useState<EnrichedMenuItem[]>(
    () => getInMemoryMenuCache()?.items ?? []
  );
  const [loading, setLoading] = useState(
    () => (getInMemoryMenuCache()?.items?.length ?? 0) === 0
  );
  const [refreshing, setRefreshing] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);

  const [activeCategory, setActiveCategory] = useState(initialCategoryId);
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [filters, setFilters] = useState<MenuFilterState>(DEFAULT_MENU_FILTERS);
  const [filterVisible, setFilterVisible] = useState(false);
  const [selectedDish, setSelectedDish] = useState<EnrichedMenuItem | null>(null);
  const [visibleCount, setVisibleCount] = useState(MOBILE_MENU_PAGE_SIZE);

  useEffect(() => {
    setActiveCategory(initialCategoryId || "all");
  }, [initialCategoryId]);

  useEffect(() => {
    setSearchQuery(initialSearch || "");
  }, [initialSearch]);

  const fetchMenu = useCallback(async (isPull = false) => {
    const syncMem = getInMemoryMenuCache();
    if (isPull) {
      setRefreshing(true);
    } else if (!syncMem?.items?.length) {
      const diskCached = await getLiveMenuCache();
      if (diskCached?.items?.length) {
        setMenuItems(diskCached.items);
        setLastSyncedAt(diskCached.savedAt);
        setLoading(false);
      } else {
        setLoading(true);
      }
    }

    const res = await fetchAndCacheMobileMenu(isPull);

    if (res.success && res.items?.length) {
      setMenuItems(res.items);
      setIsOffline(false);
      setLastSyncedAt(new Date().toISOString());
    } else {
      const cachedMenu = await getLiveMenuCache();
      setMenuItems(cachedMenu?.items?.length ? cachedMenu.items : DEFAULT_MENU_ITEMS);
      setIsOffline(true);
      if (cachedMenu?.savedAt) {
        setLastSyncedAt(cachedMenu.savedAt);
      }
    }

    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    fetchMenu(false);
  }, [fetchMenu]);

  const categories = useMemo(() => {
    const map = new Map<string, string>();
    menuItems.forEach((item) => {
      if (item.category?.id && item.category?.name) {
        map.set(item.category.id, item.category.name);
      }
    });

    if (map.size > 0) {
      return [
        { id: "all", name: "All Dishes" },
        ...Array.from(map.entries()).map(([id, name]) => ({ id, name })),
      ];
    }
    return DEFAULT_MENU_CATEGORIES;
  }, [menuItems]);

  const getCategoryName = useCallback((item: EnrichedMenuItem) => {
    if (item.category?.name) return item.category.name;
    return (
      DEFAULT_MENU_CATEGORIES.find((c) => c.id === item.categoryId)?.name || "Menu"
    );
  }, []);

  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const list = menuItems.filter((item) => {
      if (activeCategory !== "all") {
        const matchesId = item.categoryId === activeCategory;
        const matchesSlug = item.category?.slug === activeCategory;
        if (!matchesId && !matchesSlug) return false;
      }

      if (filters.availableOnly && !item.isAvailable) return false;
      if (filters.maxSpice !== "all" && item.spiceLevel > filters.maxSpice) {
        return false;
      }

      if (q) {
        const haystack = `${item.name} ${item.description} ${getCategoryName(item)}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });

    list.sort((a, b) => {
      if (filters.sortBy === "price-asc") return a.basePricePesewas - b.basePricePesewas;
      if (filters.sortBy === "price-desc") return b.basePricePesewas - a.basePricePesewas;
      if (filters.sortBy === "prep-time") {
        return a.preparationTimeMinutes - b.preparationTimeMinutes;
      }
      return Number(b.isFeatured) - Number(a.isFeatured) || a.sortOrder - b.sortOrder;
    });

    return list;
  }, [menuItems, activeCategory, searchQuery, filters, getCategoryName]);

  useEffect(() => {
    setVisibleCount(MOBILE_MENU_PAGE_SIZE);
  }, [activeCategory, searchQuery, filters]);

  const visibleItems = useMemo(
    () => filteredItems.slice(0, visibleCount),
    [filteredItems, visibleCount]
  );
  const remainingCount = Math.max(0, filteredItems.length - visibleItems.length);
  const fullCardWidth = width - SikaSpace.md * 2;
  const spotlightDish =
    visibleItems.length > 0 && visibleItems.length % 2 === 1
      ? visibleItems[0]
      : null;
  const gridItems = spotlightDish ? visibleItems.slice(1) : visibleItems;

  const hasActiveFilters =
    filters.sortBy !== "featured" ||
    filters.maxSpice !== "all" ||
    filters.availableOnly;

  const handleQuickAdd = (dish: EnrichedMenuItem) => {
    if (!dish.isAvailable) return;
    addItem(dish, 1, []);
    success("Added to Tray", `${dish.name} added to your tray.`);
  };

  return (
    <View style={styles.root}>
      <OfflineBanner isOffline={isOffline} lastSynchronizedAt={lastSyncedAt} />

      {/* Search & Filter Toolbar — Tapping search opens dedicated SearchScreen */}
      <View style={styles.toolbar}>
        <View style={styles.searchRow}>
          <Pressable
            onPress={() => {
              triggerLightHaptic();
              onOpenSearch?.();
            }}
            accessibilityRole="search"
            accessibilityLabel="Search menu dishes"
            style={styles.searchBox}
          >
            <Search size={16} color={SikaColors.muted} />
            <Text
              style={[
                styles.searchPlaceholderText,
                searchQuery.length > 0 && styles.searchActiveText,
              ]}
              numberOfLines={1}
            >
              {searchQuery.length > 0
                ? searchQuery
                : "Search dishes, sides, combos..."}
            </Text>
            {searchQuery.length > 0 ? (
              <Pressable
                onPress={(e) => {
                  e.stopPropagation();
                  setSearchQuery("");
                }}
                hitSlop={8}
              >
                <X size={16} color={SikaColors.secondaryText} />
              </Pressable>
            ) : null}
          </Pressable>

          <Pressable
            onPress={() => {
              triggerLightHaptic();
              setFilterVisible(true);
            }}
            accessibilityRole="button"
            accessibilityLabel="Open menu filters"
            style={({ pressed }) => [
              styles.filterBtn,
              hasActiveFilters && styles.filterBtnActive,
              pressed && { transform: [{ scale: 0.94 }] },
            ]}
          >
            <SlidersHorizontal
              size={18}
              color={hasActiveFilters ? SikaColors.accentLight : SikaColors.warmWhite}
            />
            {hasActiveFilters ? <View style={styles.filterDot} /> : null}
          </Pressable>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsScroll}
        >
          {categories.map((cat) => {
            const active = activeCategory === cat.id;
            return (
              <Pressable
                key={cat.id}
                onPress={() => {
                  triggerLightHaptic();
                  setActiveCategory(cat.id);
                }}
                style={({ pressed }) => [
                  styles.chip,
                  active && styles.chipActive,
                  pressed && { transform: [{ scale: 0.95 }] },
                ]}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>
                  {cat.name}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* 2-Column Catalog Grid */}
      {loading ? (
        <ScrollView contentContainerStyle={styles.skeletonGrid}>
          {Array.from({ length: 6 }).map((_, idx) => (
            <DishCardSkeleton key={idx} cardWidth={cardWidth} compact />
          ))}
        </ScrollView>
      ) : (
        <FlatList
          key="menu-grid-2col"
          data={gridItems}
          numColumns={2}
          keyExtractor={(item) => item.id}
          columnWrapperStyle={styles.gridRow}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchMenu(true)}
              tintColor={SikaColors.accent}
            />
          }
          contentContainerStyle={[
            styles.listContent,
            totalItemCount > 0 && styles.listWithFloatingCart,
          ]}
          ListHeaderComponent={
            spotlightDish ? (
              <View style={styles.spotlightWrap}>
                <DishCard
                  dish={spotlightDish}
                  cardWidth={fullCardWidth}
                  categoryLabel={getCategoryName(spotlightDish)}
                  onPress={setSelectedDish}
                  onQuickAdd={handleQuickAdd}
                />
              </View>
            ) : undefined
          }
          ListFooterComponent={
            remainingCount > 0 ? (
              <View style={styles.loadMoreWrap}>
                <Text style={styles.loadMoreMeta}>
                  Showing {visibleItems.length} of {filteredItems.length} dishes
                </Text>
                <Pressable
                  onPress={() => {
                    triggerLightHaptic();
                    setVisibleCount((prev) => prev + MOBILE_MENU_PAGE_SIZE);
                  }}
                  style={({ pressed }) => [
                    styles.loadMoreBtn,
                    pressed && { transform: [{ scale: 0.97 }] },
                  ]}
                >
                  <Text style={styles.loadMoreBtnText}>
                    Load More Dishes ({remainingCount} remaining)
                  </Text>
                </Pressable>
              </View>
            ) : undefined
          }
          ListEmptyComponent={
            spotlightDish ? undefined : (
              <EmptyState
                title="No Dishes Match"
                description="Try clearing your search term or resetting spice and availability filters."
                actionLabel="Reset All Filters"
                onAction={() => {
                  setActiveCategory("all");
                  setSearchQuery("");
                  setFilters(DEFAULT_MENU_FILTERS);
                }}
              />
            )
          }
          renderItem={({ item }) => (
            <DishCard
              dish={item}
              cardWidth={cardWidth}
              compact
              categoryLabel={getCategoryName(item)}
              onPress={setSelectedDish}
              onQuickAdd={handleQuickAdd}
            />
          )}
        />
      )}

      <DishDetailModal
        visible={Boolean(selectedDish)}
        dish={selectedDish}
        onClose={() => setSelectedDish(null)}
        onAddToCart={(dish, qty, opts, notes) => addItem(dish, qty, opts, notes)}
      />

      <FilterSheet
        visible={filterVisible}
        value={filters}
        onClose={() => setFilterVisible(false)}
        onApply={setFilters}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: SikaColors.background,
  },
  toolbar: {
    borderBottomWidth: 1,
    borderBottomColor: SikaColors.border,
    paddingTop: SikaSpace.sm + 2,
    paddingBottom: SikaSpace.md,
    backgroundColor: SikaColors.background,
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SikaSpace.sm,
    paddingHorizontal: SikaSpace.md,
    marginBottom: SikaSpace.sm + 2,
  },
  searchBox: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: SikaSpace.sm,
    height: 44,
    borderRadius: SikaRadius.md,
    borderWidth: 1,
    borderColor: SikaColors.border,
    backgroundColor: SikaColors.surface,
    paddingHorizontal: SikaSpace.md,
  },
  searchPlaceholderText: {
    flex: 1,
    color: SikaColors.muted,
    fontSize: 13,
  },
  searchActiveText: {
    color: SikaColors.warmWhite,
    fontWeight: "600",
  },
  filterBtn: {
    width: 44,
    height: 44,
    borderRadius: SikaRadius.md,
    borderWidth: 1,
    borderColor: SikaColors.border,
    backgroundColor: SikaColors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  filterBtnActive: {
    borderColor: SikaColors.accent,
    backgroundColor: SikaColors.accentWash16,
  },
  filterDot: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: SikaColors.accent,
  },
  chipsScroll: {
    paddingHorizontal: SikaSpace.md,
    gap: SikaSpace.xs + 2,
  },
  chip: {
    paddingHorizontal: SikaSpace.md,
    paddingVertical: 7,
    borderRadius: SikaRadius.pill,
    borderWidth: 1,
    borderColor: SikaColors.border,
    backgroundColor: SikaColors.surface,
  },
  chipActive: {
    borderColor: SikaColors.accent,
    backgroundColor: SikaColors.accent,
  },
  spotlightWrap: {
    marginBottom: SikaSpace.sm + 2,
  },
  loadMoreWrap: {
    alignItems: "center",
    paddingTop: SikaSpace.md,
    paddingBottom: SikaSpace.sm,
    gap: 8,
  },
  loadMoreMeta: {
    color: SikaColors.secondaryText,
    fontSize: 12,
    fontWeight: "600",
  },
  loadMoreBtn: {
    borderRadius: SikaRadius.pill,
    borderWidth: 1,
    borderColor: SikaColors.accentWash40,
    backgroundColor: SikaColors.accentWash12,
    paddingHorizontal: 20,
    paddingVertical: 11,
  },
  loadMoreBtnText: {
    color: SikaColors.warmWhite,
    fontSize: 13,
    fontWeight: "800",
  },
  chipText: {
    color: SikaColors.secondaryText,
    fontSize: 12,
    fontWeight: "700",
  },
  chipTextActive: {
    color: SikaColors.text,
  },
  skeletonGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingHorizontal: SikaSpace.md,
    paddingTop: SikaSpace.md,
    gap: 10,
  },
  gridRow: {
    justifyContent: "space-between",
    gap: 10,
  },
  listContent: {
    paddingHorizontal: SikaSpace.md,
    paddingTop: SikaSpace.md,
    paddingBottom: 115,
  },
  listWithFloatingCart: {
    paddingBottom: 155,
  },
  cartBarWrap: {
    position: "absolute",
    left: SikaSpace.md,
    right: SikaSpace.md,
    bottom: SikaSpace.md,
  },
  cartBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: SikaRadius.xl,
    backgroundColor: SikaColors.accent,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.14)",
    paddingHorizontal: SikaSpace.lg,
    paddingVertical: 13,
    shadowColor: "#000000",
    shadowOpacity: 0.45,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  cartBarLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: SikaSpace.sm,
  },
  cartCountPill: {
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(16,16,16,0.3)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  cartCountText: {
    color: SikaColors.text,
    fontSize: 12,
    fontWeight: "800",
    fontVariant: ["tabular-nums"],
  },
  cartLabel: {
    color: SikaColors.text,
    fontSize: 14,
    fontWeight: "800",
  },
  cartPrice: {
    color: SikaColors.text,
    fontSize: 15,
    fontWeight: "900",
    fontVariant: ["tabular-nums"],
  },
});
