import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  FlatList,
  Keyboard,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import {
  ArrowLeft,
  Flame,
  Search,
  SlidersHorizontal,
  Sparkles,
  X,
} from "lucide-react-native";
import { formatPesewasToGhs } from "@sika/shared";
import { DishCard, EnrichedMenuItem } from "../components/DishCard";
import { DishDetailModal } from "../components/DishDetailModal";
import { RestaurantClocheIcon } from "../components/icons/RestaurantClocheIcon";
import { EmptyState } from "../components/ui/EmptyState";
import {
  DEFAULT_MENU_FILTERS,
  FilterSheet,
  MenuFilterState,
} from "../components/ui/FilterSheet";
import { useCart } from "../context/CartContext";
import { useToast } from "../context/ToastContext";
import { DEFAULT_MENU_CATEGORIES, DEFAULT_MENU_ITEMS } from "../data/default-menu";
import { apiRequest } from "../services/api-client";
import { getLiveMenuCache, saveLiveMenuCache } from "../services/offline-menu-cache";
import { SikaColors, SikaRadius, SikaSpace } from "../theme";
import { triggerLightHaptic } from "../utils/haptics";

interface SearchScreenProps {
  initialQuery?: string;
  onBack: () => void;
  onOpenCart: () => void;
}

const POPULAR_SEARCH_TERMS = [
  "Tilapia",
  "Jollof",
  "Banku",
  "Fufu",
  "Fried Rice",
  "Okro Soup",
  "Pizza",
  "Platter",
];

/**
 * Dedicated Telegram-style full-screen Search & Discovery page without the bottom tab navbar.
 * Eliminates keyboard-navbar layout jumping while providing instant dish search, popular chips,
 * category shortcuts, and in-card portion additions.
 */
export function SearchScreen({
  initialQuery = "",
  onBack,
  onOpenCart,
}: SearchScreenProps) {
  const { width } = useWindowDimensions();
  const cardWidth = Math.floor((width - SikaSpace.md * 2 - 10) / 2);

  const { addItem, totalItemCount, cartSubtotalPesewas } = useCart();
  const { success } = useToast();

  const [query, setQuery] = useState(initialQuery);
  const [menuItems, setMenuItems] = useState<EnrichedMenuItem[]>(
    DEFAULT_MENU_ITEMS as EnrichedMenuItem[]
  );
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("all");
  const [filters, setFilters] = useState<MenuFilterState>(DEFAULT_MENU_FILTERS);
  const [filterVisible, setFilterVisible] = useState(false);
  const [selectedDish, setSelectedDish] = useState<EnrichedMenuItem | null>(null);

  const loadCatalog = useCallback(async () => {
    const cached = await getLiveMenuCache();
    if (cached?.items?.length) {
      setMenuItems(cached.items as EnrichedMenuItem[]);
    }

    const itemsRes = await apiRequest<{
      success: boolean;
      items: EnrichedMenuItem[];
    }>("/menu/items?includeUnavailable=true");

    if (itemsRes.success && itemsRes.data?.items?.length) {
      setMenuItems(itemsRes.data.items);
      void saveLiveMenuCache(itemsRes.data.items);
    }
  }, []);

  useEffect(() => {
    void loadCatalog();
  }, [loadCatalog]);

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

  const getCategoryName = useCallback((item: EnrichedMenuItem): string => {
    if (item.category?.name) return item.category.name;
    return (
      DEFAULT_MENU_CATEGORIES.find((c) => c.id === item.categoryId)?.name ||
      "Sika Kitchen"
    );
  }, []);

  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase();

    const list = menuItems.filter((item) => {
      if (
        selectedCategoryId !== "all" &&
        item.categoryId !== selectedCategoryId &&
        item.category?.slug !== selectedCategoryId
      ) {
        return false;
      }
      if (filters.availableOnly && !item.isAvailable) return false;
      if (filters.maxSpice !== "all" && item.spiceLevel > filters.maxSpice) {
        return false;
      }
      if (!q) return true;

      const catName = getCategoryName(item).toLowerCase();
      return (
        item.name.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        catName.includes(q)
      );
    });

    return list.sort((a, b) => {
      if (a.isAvailable !== b.isAvailable) return a.isAvailable ? -1 : 1;
      if (filters.sortBy === "price-asc") {
        return a.basePricePesewas - b.basePricePesewas;
      }
      if (filters.sortBy === "price-desc") {
        return b.basePricePesewas - a.basePricePesewas;
      }
      if (filters.sortBy === "prep-time") {
        return a.preparationTimeMinutes - b.preparationTimeMinutes;
      }
      return Number(b.isFeatured) - Number(a.isFeatured) || a.sortOrder - b.sortOrder;
    });
  }, [menuItems, query, selectedCategoryId, filters, getCategoryName]);

  const hasActiveFilters =
    filters.sortBy !== "featured" ||
    filters.maxSpice !== "all" ||
    filters.availableOnly;

  const handleQuickAdd = (dish: EnrichedMenuItem) => {
    if (!dish.isAvailable) return;
    addItem(dish, 1, []);
    success("Added to Tray", `${dish.name} added to your tray.`);
  };

  const handleClose = () => {
    Keyboard.dismiss();
    onBack();
  };

  const isSearching =
    query.trim().length > 0 ||
    selectedCategoryId !== "all" ||
    hasActiveFilters;

  return (
    <View style={styles.root}>
      {/* Dedicated Top Search Bar */}
      <View style={styles.topSearchHeader}>
        <Pressable
          onPress={handleClose}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="Back from search"
          style={({ pressed }) => [
            styles.backBtn,
            pressed && { transform: [{ scale: 0.94 }] },
          ]}
        >
          <ArrowLeft size={18} color={SikaColors.warmWhite} />
        </Pressable>

        <View style={styles.inputWrap}>
          <Search size={16} color={SikaColors.accentLight} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            autoFocus
            returnKeyType="search"
            placeholder="Search tilapia, banku, jollof, pizza..."
            placeholderTextColor={SikaColors.muted}
            style={styles.input}
          />
          {query.length > 0 ? (
            <Pressable
              onPress={() => {
                triggerLightHaptic();
                setQuery("");
              }}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Clear search query"
              style={styles.clearIconBtn}
            >
              <X size={15} color={SikaColors.secondaryText} />
            </Pressable>
          ) : null}
        </View>

        <Pressable
          onPress={() => {
            triggerLightHaptic();
            Keyboard.dismiss();
            setFilterVisible(true);
          }}
          accessibilityRole="button"
          accessibilityLabel="Filter search results"
          style={[styles.filterBtn, hasActiveFilters && styles.filterBtnActive]}
        >
          <SlidersHorizontal
            size={17}
            color={hasActiveFilters ? SikaColors.accentLight : SikaColors.warmWhite}
          />
          {hasActiveFilters ? <View style={styles.filterDot} /> : null}
        </Pressable>
      </View>

      {/* Main Results & Discovery Body */}
      <FlatList
        key="search-grid-2col"
        data={filteredItems}
        numColumns={2}
        keyExtractor={(item) => item.id}
        columnWrapperStyle={styles.gridRow}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View style={styles.headerBlock}>
            {/* Popular Search Chips when query is empty */}
            {!query.trim() ? (
              <View style={styles.discoverySection}>
                <View style={styles.discoveryHeaderRow}>
                  <Flame size={13} color={SikaColors.accentLight} />
                  <Text style={styles.discoveryLabel}>Popular Searches</Text>
                </View>
                <View style={styles.popularChipsWrap}>
                  {POPULAR_SEARCH_TERMS.map((term) => (
                    <Pressable
                      key={term}
                      onPress={() => {
                        triggerLightHaptic();
                        setQuery(term);
                      }}
                      style={({ pressed }) => [
                        styles.popularChip,
                        pressed && { transform: [{ scale: 0.95 }] },
                      ]}
                    >
                      <Search size={11} color={SikaColors.secondaryText} />
                      <Text style={styles.popularChipText}>{term}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            ) : null}

            {/* Horizontal Category Filter Pills */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.categoryChipsRow}
            >
              <Pressable
                onPress={() => {
                  triggerLightHaptic();
                  setSelectedCategoryId("all");
                }}
                style={[
                  styles.catChip,
                  selectedCategoryId === "all" && styles.catChipActive,
                ]}
              >
                <Text
                  style={[
                    styles.catChipText,
                    selectedCategoryId === "all" && styles.catChipTextActive,
                  ]}
                >
                  All Dishes
                </Text>
              </Pressable>

              {categories
                .filter((cat) => cat.id !== "all")
                .map((cat) => {
                  const active = selectedCategoryId === cat.id;
                  return (
                    <Pressable
                      key={cat.id}
                      onPress={() => {
                        triggerLightHaptic();
                        setSelectedCategoryId(active ? "all" : cat.id);
                      }}
                      style={[styles.catChip, active && styles.catChipActive]}
                    >
                      <Text
                        style={[
                          styles.catChipText,
                          active && styles.catChipTextActive,
                        ]}
                      >
                        {cat.name}
                      </Text>
                    </Pressable>
                  );
                })}
            </ScrollView>

            {/* Result Counter & Tray Quick Pill */}
            <View style={styles.resultsBar}>
              <View style={styles.resultsTitleRow}>
                <Sparkles size={13} color={SikaColors.accentLight} />
                <Text style={styles.resultsCountText}>
                  {isSearching
                    ? `${filteredItems.length} ${
                        filteredItems.length === 1 ? "dish" : "dishes"
                      } found`
                    : "All Kitchen Dishes"}
                </Text>
              </View>

              {totalItemCount > 0 ? (
                <Pressable
                  onPress={() => {
                    triggerLightHaptic();
                    Keyboard.dismiss();
                    onOpenCart();
                  }}
                  style={styles.miniTrayBtn}
                >
                  <RestaurantClocheIcon size={13} color={SikaColors.text} />
                  <Text style={styles.miniTrayText}>
                    Tray ({totalItemCount}) · {formatPesewasToGhs(cartSubtotalPesewas)}
                  </Text>
                </Pressable>
              ) : null}
            </View>
          </View>
        }
        ListEmptyComponent={
          <EmptyState
            title="No Matching Dishes"
            description={`No dishes matched "${query.trim()}". Try searching for tilapia, jollof, banku, fufu, or pizza.`}
            actionLabel="Clear Search & Filters"
            onAction={() => {
              setQuery("");
              setSelectedCategoryId("all");
              setFilters(DEFAULT_MENU_FILTERS);
            }}
          />
        }
        renderItem={({ item }) => (
          <DishCard
            dish={item}
            cardWidth={cardWidth}
            compact
            categoryLabel={getCategoryName(item)}
            onPress={(dish) => {
              Keyboard.dismiss();
              setSelectedDish(dish);
            }}
            onQuickAdd={handleQuickAdd}
          />
        )}
      />

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
  topSearchHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: SikaSpace.sm,
    paddingHorizontal: SikaSpace.md,
    paddingVertical: SikaSpace.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: SikaColors.border,
    backgroundColor: SikaColors.surface,
  },
  backBtn: {
    width: 42,
    height: 42,
    borderRadius: SikaRadius.md,
    borderWidth: 1,
    borderColor: SikaColors.border,
    backgroundColor: SikaColors.elevated,
    alignItems: "center",
    justifyContent: "center",
  },
  inputWrap: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: SikaSpace.sm,
    height: 44,
    borderRadius: SikaRadius.md,
    borderWidth: 1,
    borderColor: SikaColors.accentWash40,
    backgroundColor: SikaColors.elevated,
    paddingHorizontal: SikaSpace.md,
  },
  input: {
    flex: 1,
    color: SikaColors.text,
    fontSize: 13.5,
    fontWeight: "600",
  },
  clearIconBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: SikaColors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  filterBtn: {
    width: 42,
    height: 42,
    borderRadius: SikaRadius.md,
    borderWidth: 1,
    borderColor: SikaColors.border,
    backgroundColor: SikaColors.elevated,
    alignItems: "center",
    justifyContent: "center",
  },
  filterBtnActive: {
    borderColor: SikaColors.accent,
    backgroundColor: SikaColors.accentWash16,
  },
  filterDot: {
    position: "absolute",
    top: 7,
    right: 7,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: SikaColors.accent,
  },
  listContent: {
    paddingHorizontal: SikaSpace.md,
    paddingTop: SikaSpace.md,
    paddingBottom: 36,
  },
  headerBlock: {
    gap: SikaSpace.md,
    marginBottom: SikaSpace.md,
  },
  discoverySection: {
    gap: SikaSpace.xs + 2,
  },
  discoveryHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  discoveryLabel: {
    color: SikaColors.secondaryText,
    fontSize: 11.5,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  popularChipsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  popularChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: SikaRadius.pill,
    borderWidth: 1,
    borderColor: SikaColors.border,
    backgroundColor: SikaColors.surface,
  },
  popularChipText: {
    color: SikaColors.warmWhite,
    fontSize: 12,
    fontWeight: "700",
  },
  categoryChipsRow: {
    gap: 8,
    paddingVertical: 2,
  },
  catChip: {
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: SikaRadius.pill,
    borderWidth: 1,
    borderColor: SikaColors.border,
    backgroundColor: SikaColors.surface,
  },
  catChipActive: {
    borderColor: SikaColors.accent,
    backgroundColor: SikaColors.accent,
  },
  catChipText: {
    color: SikaColors.secondaryText,
    fontSize: 12,
    fontWeight: "700",
  },
  catChipTextActive: {
    color: SikaColors.text,
  },
  resultsBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: SikaSpace.sm,
    paddingTop: 2,
  },
  resultsTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  resultsCountText: {
    color: SikaColors.warmWhite,
    fontSize: 13,
    fontWeight: "800",
  },
  miniTrayBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: SikaRadius.pill,
    backgroundColor: SikaColors.accent,
  },
  miniTrayText: {
    color: SikaColors.text,
    fontSize: 11.5,
    fontWeight: "800",
    fontVariant: ["tabular-nums"],
  },
  gridRow: {
    justifyContent: "space-between",
    gap: 10,
  },
});
