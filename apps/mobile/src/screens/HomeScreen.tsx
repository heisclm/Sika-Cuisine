import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import {
  ArrowRight,
  Bike,
  Clock,
  MapPin,
  Plus,
  Search,
  SlidersHorizontal,
  Store,
} from "lucide-react-native";
import { RESTAURANT_INFO, formatPesewasToGhs } from "@sika/shared";
import { DishCard, EnrichedMenuItem } from "../components/DishCard";
import { DishDetailModal } from "../components/DishDetailModal";
import { OfflineBanner } from "../components/OfflineBanner";
import {
  DEFAULT_MENU_FILTERS,
  FilterSheet,
  MenuFilterState,
} from "../components/ui/FilterSheet";
import { DishCardSkeleton } from "../components/ui/Skeleton";
import { Badge } from "../components/ui/Badge";
import { useCart } from "../context/CartContext";
import { useToast } from "../context/ToastContext";
import { DEFAULT_MENU_CATEGORIES, DEFAULT_MENU_ITEMS } from "../data/default-menu";
import { resolveDishImageSource } from "../data/dish-images";
import { apiRequest } from "../services/api-client";
import { SikaColors, SikaRadius, SikaSpace } from "../theme";

interface HomeScreenProps {
  onNavigateToMenu: (categoryId?: string, initialQuery?: string) => void;
  onOpenCart: () => void;
  onOpenOrders: () => void;
}

/**
 * Primary Customer Home Showcase balancing editorial photography, rapid search,
 * featured dish carousel, Sunyani category chips, and a 2-column Popular Today grid.
 */
export function HomeScreen({
  onNavigateToMenu,
  onOpenCart,
  onOpenOrders,
}: HomeScreenProps) {
  const { width } = useWindowDimensions();
  const cardWidth = Math.floor((width - SikaSpace.md * 2 - 10) / 2);

  const { addItem } = useCart();
  const { success } = useToast();

  const [menuItems, setMenuItems] = useState<EnrichedMenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);

  const [searchText, setSearchText] = useState("");
  const [filters, setFilters] = useState<MenuFilterState>(DEFAULT_MENU_FILTERS);
  const [filterSheetVisible, setFilterSheetVisible] = useState(false);
  const [selectedDish, setSelectedDish] = useState<EnrichedMenuItem | null>(null);

  const loadHomeCatalog = useCallback(async (isPull = false) => {
    if (isPull) setRefreshing(true);
    else setLoading(true);

    const res = await apiRequest<{ success: boolean; items: EnrichedMenuItem[] }>(
      "/menu/items?includeUnavailable=true"
    );

    if (res.success && res.data?.items?.length) {
      setMenuItems(res.data.items);
      setIsOffline(false);
      setLastSyncedAt(new Date().toISOString());
    } else {
      setMenuItems(DEFAULT_MENU_ITEMS);
      setIsOffline(true);
    }

    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    loadHomeCatalog(false);
  }, [loadHomeCatalog]);

  const categories = useMemo(() => {
    const map = new Map<string, string>();
    menuItems.forEach((item) => {
      if (item.category?.id && item.category?.name) {
        map.set(item.category.id, item.category.name);
      }
    });

    if (map.size > 0) {
      return [
        { id: "all", name: "All" },
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

  const featuredItems = useMemo(() => {
    const picks = menuItems.filter((item) => item.isFeatured && item.isAvailable);
    return picks.length > 0 ? picks.slice(0, 6) : menuItems.slice(0, 5);
  }, [menuItems]);

  const popularDishes = useMemo(() => {
    let list = [...menuItems];
    if (filters.availableOnly) {
      list = list.filter((i) => i.isAvailable);
    }
    if (filters.maxSpice !== "all") {
      const ceiling = filters.maxSpice;
      list = list.filter((i) => i.spiceLevel <= ceiling);
    }

    list.sort((a, b) => {
      if (filters.sortBy === "price-asc") return a.basePricePesewas - b.basePricePesewas;
      if (filters.sortBy === "price-desc") return b.basePricePesewas - a.basePricePesewas;
      if (filters.sortBy === "prep-time") {
        return a.preparationTimeMinutes - b.preparationTimeMinutes;
      }
      return Number(b.isFeatured) - Number(a.isFeatured) || a.sortOrder - b.sortOrder;
    });

    return list.slice(0, 6);
  }, [menuItems, filters]);

  const handleQuickAdd = (dish: EnrichedMenuItem) => {
    if (!dish.isAvailable) return;
    addItem(dish, 1, []);
    success("Added to Cart", `${dish.name} is ready in your tray.`);
  };

  return (
    <View style={styles.root}>
      <OfflineBanner isOffline={isOffline} lastSynchronizedAt={lastSyncedAt} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadHomeCatalog(true)}
            tintColor={SikaColors.accent}
          />
        }
        contentContainerStyle={styles.scrollContent}
      >
        {/* Greeting Header */}
        <View style={styles.heroHeader}>
          <View style={styles.locationPill}>
            <MapPin size={13} color={SikaColors.accentLight} />
            <Text style={styles.locationText}>{RESTAURANT_INFO.city}</Text>
          </View>
          <Text style={styles.headline}>
            Authentic Ghanaian Fire &amp; Craft.
          </Text>
          <Text style={styles.subheadline}>
            Charcoal-grilled tilapia with banku, slow-cooked smoky jollof, and fresh Sunyani specials.
          </Text>
        </View>

        {/* Search & Filter Row */}
        <View style={styles.searchRow}>
          <View style={styles.searchBox}>
            <Search size={16} color={SikaColors.muted} />
            <TextInput
              value={searchText}
              onChangeText={setSearchText}
              onSubmitEditing={() => onNavigateToMenu("all", searchText.trim())}
              returnKeyType="search"
              placeholder="Search tilapia, banku, jollof, pizza..."
              placeholderTextColor={SikaColors.muted}
              style={styles.searchInput}
            />
          </View>

          <Pressable
            onPress={() => setFilterSheetVisible(true)}
            accessibilityRole="button"
            accessibilityLabel="Filter dishes"
            style={styles.filterTrigger}
          >
            <SlidersHorizontal size={18} color={SikaColors.warmWhite} />
          </Pressable>
        </View>

        {/* Compact Category Chips */}
        <View style={styles.sectionBlock}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Categories</Text>
            <Pressable onPress={() => onNavigateToMenu("all")}>
              <Text style={styles.sectionLink}>See all</Text>
            </Pressable>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipsRow}
          >
            {categories.map((cat) => (
              <Pressable
                key={cat.id}
                onPress={() => onNavigateToMenu(cat.id)}
                style={styles.catChip}
              >
                <Text style={styles.catChipText}>{cat.name}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* Featured Carousel */}
        <View style={styles.sectionBlock}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Kitchen Highlights</Text>
            <Badge label="Fresh Daily" variant="brand" />
          </View>

          {loading ? (
            <View style={styles.popularGrid}>
              <DishCardSkeleton cardWidth={cardWidth} compact />
              <DishCardSkeleton cardWidth={cardWidth} compact />
            </View>
          ) : (
            <FlatList
              horizontal
              data={featuredItems}
              keyExtractor={(item) => item.id}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.carouselList}
              renderItem={({ item }) => {
                const hasOptions = Boolean(item.optionGroups?.length);
                return (
                  <Pressable
                    onPress={() => setSelectedDish(item)}
                    style={styles.featuredCard}
                  >
                    <Image
                      source={resolveDishImageSource(item.imageUrl)}
                      style={styles.featuredImg}
                      resizeMode="cover"
                    />
                    <LinearGradient
                      colors={["rgba(16,16,16,0.05)", "rgba(16,16,16,0.94)"]}
                      locations={[0.3, 1]}
                      style={StyleSheet.absoluteFill}
                    />
                    <View style={styles.featuredTop}>
                      <View style={styles.prepBadge}>
                        <Clock size={11} color={SikaColors.warmWhite} />
                        <Text style={styles.prepBadgeText}>
                          {item.preparationTimeMinutes}m
                        </Text>
                      </View>
                    </View>

                    <View style={styles.featuredBottom}>
                      <Text style={styles.featuredCat}>{getCategoryName(item)}</Text>
                      <Text style={styles.featuredTitle} numberOfLines={1}>
                        {item.name}
                      </Text>
                      <View style={styles.featuredFooter}>
                        <Text style={styles.featuredPrice}>
                          {formatPesewasToGhs(item.basePricePesewas)}
                        </Text>
                        <Pressable
                          onPress={(e) => {
                            e.stopPropagation();
                            if (hasOptions) setSelectedDish(item);
                            else handleQuickAdd(item);
                          }}
                          accessibilityRole="button"
                          accessibilityLabel={`Add ${item.name}`}
                          style={styles.miniAddBtn}
                        >
                          <Plus size={16} color={SikaColors.text} />
                        </Pressable>
                      </View>
                    </View>
                  </Pressable>
                );
              }}
            />
          )}
        </View>

        {/* Sunyani Fulfilment Highlights */}
        <View style={styles.fulfilmentBand}>
          <View style={styles.fulfilmentCard}>
            <Bike size={18} color={SikaColors.accentLight} />
            <Text style={styles.fulfilmentTitle}>Sunyani Delivery</Text>
            <Text style={styles.fulfilmentSub}>Fast zone rates from GHS 8.00</Text>
          </View>
          <View style={styles.fulfilmentCard}>
            <Store size={18} color={SikaColors.success} />
            <Text style={styles.fulfilmentTitle}>Counter Pickup</Text>
            <Text style={styles.fulfilmentSub}>GHS 0.00 at Commercial Rd</Text>
          </View>
        </View>

        {/* Quick Navigation Strip */}
        <View style={styles.quickActionRow}>
          <Pressable onPress={onOpenCart} style={styles.quickPill}>
            <Text style={styles.quickPillText}>Open Tray</Text>
            <ArrowRight size={14} color={SikaColors.accentLight} />
          </Pressable>
          <Pressable onPress={onOpenOrders} style={styles.quickPill}>
            <Text style={styles.quickPillText}>Track Active Order</Text>
            <ArrowRight size={14} color={SikaColors.accentLight} />
          </Pressable>
        </View>

        {/* Popular Today 2-Column Dish Grid */}
        <View style={styles.paddedHorizontal}>
          <View style={styles.sectionHeaderNoPad}>
            <Text style={styles.sectionTitle}>Popular Today</Text>
            <Pressable onPress={() => onNavigateToMenu("all")}>
              <Text style={styles.sectionLink}>Full Menu</Text>
            </Pressable>
          </View>

          <View style={styles.popularGrid}>
            {loading
              ? Array.from({ length: 4 }).map((_, i) => (
                  <DishCardSkeleton key={i} cardWidth={cardWidth} compact />
                ))
              : popularDishes.map((dish) => (
                  <DishCard
                    key={dish.id}
                    dish={dish}
                    cardWidth={cardWidth}
                    compact
                    categoryLabel={getCategoryName(dish)}
                    onPress={setSelectedDish}
                    onQuickAdd={handleQuickAdd}
                  />
                ))}
          </View>
        </View>
      </ScrollView>

      <DishDetailModal
        visible={Boolean(selectedDish)}
        dish={selectedDish}
        onClose={() => setSelectedDish(null)}
        onAddToCart={(dish, qty, opts, notes) => addItem(dish, qty, opts, notes)}
      />

      <FilterSheet
        visible={filterSheetVisible}
        value={filters}
        onClose={() => setFilterSheetVisible(false)}
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
  scrollContent: {
    paddingBottom: 24,
  },
  heroHeader: {
    paddingHorizontal: SikaSpace.md,
    paddingTop: SikaSpace.lg,
    paddingBottom: SikaSpace.md,
  },
  locationPill: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 5,
    paddingHorizontal: SikaSpace.md,
    paddingVertical: 5,
    borderRadius: SikaRadius.pill,
    borderWidth: 1,
    borderColor: SikaColors.accentWash40,
    backgroundColor: SikaColors.accentWash12,
    marginBottom: SikaSpace.md,
  },
  locationText: {
    color: SikaColors.warmWhite,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.6,
  },
  headline: {
    color: SikaColors.text,
    fontSize: 27,
    fontWeight: "900",
    letterSpacing: -0.6,
    lineHeight: 32,
  },
  subheadline: {
    color: SikaColors.secondaryText,
    fontSize: 13,
    lineHeight: 19,
    marginTop: SikaSpace.sm,
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SikaSpace.sm,
    paddingHorizontal: SikaSpace.md,
    marginTop: SikaSpace.sm,
    marginBottom: SikaSpace.lg,
  },
  searchBox: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: SikaSpace.sm,
    height: 46,
    borderRadius: SikaRadius.md,
    borderWidth: 1,
    borderColor: SikaColors.border,
    backgroundColor: SikaColors.surface,
    paddingHorizontal: SikaSpace.md,
  },
  searchInput: {
    flex: 1,
    color: SikaColors.warmWhite,
    fontSize: 13,
  },
  filterTrigger: {
    width: 46,
    height: 46,
    borderRadius: SikaRadius.md,
    borderWidth: 1,
    borderColor: SikaColors.border,
    backgroundColor: SikaColors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionBlock: {
    marginBottom: SikaSpace.xl,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SikaSpace.md,
    marginBottom: SikaSpace.md,
  },
  sectionHeaderNoPad: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: SikaSpace.md,
  },
  sectionTitle: {
    color: SikaColors.text,
    fontSize: 18,
    fontWeight: "800",
  },
  sectionLink: {
    color: SikaColors.accentLight,
    fontSize: 13,
    fontWeight: "700",
  },
  chipsRow: {
    paddingHorizontal: SikaSpace.md,
    gap: SikaSpace.sm,
  },
  catChip: {
    borderRadius: SikaRadius.pill,
    borderWidth: 1,
    borderColor: SikaColors.border,
    backgroundColor: SikaColors.surface,
    paddingHorizontal: SikaSpace.md + 2,
    paddingVertical: 8,
  },
  catChipText: {
    color: SikaColors.warmWhite,
    fontSize: 12,
    fontWeight: "700",
  },
  carouselList: {
    paddingHorizontal: SikaSpace.md,
    gap: SikaSpace.md,
  },
  featuredCard: {
    width: 245,
    height: 210,
    borderRadius: SikaRadius.xl,
    borderWidth: 1,
    borderColor: SikaColors.border,
    backgroundColor: SikaColors.surface,
    overflow: "hidden",
    justifyContent: "space-between",
  },
  featuredImg: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  featuredTop: {
    padding: SikaSpace.md,
    alignItems: "flex-end",
  },
  prepBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(28, 28, 28, 0.88)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: SikaRadius.pill,
  },
  prepBadgeText: {
    color: SikaColors.warmWhite,
    fontSize: 11,
    fontWeight: "700",
  },
  featuredBottom: {
    padding: SikaSpace.md,
  },
  featuredCat: {
    color: SikaColors.accentLight,
    fontSize: 10,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1.2,
  },
  featuredTitle: {
    color: SikaColors.text,
    fontSize: 16,
    fontWeight: "800",
    marginTop: 2,
  },
  featuredFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: SikaSpace.sm,
  },
  featuredPrice: {
    color: SikaColors.warmWhite,
    fontSize: 15,
    fontWeight: "900",
    fontVariant: ["tabular-nums"],
  },
  miniAddBtn: {
    width: 32,
    height: 32,
    borderRadius: SikaRadius.sm,
    backgroundColor: SikaColors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  fulfilmentBand: {
    flexDirection: "row",
    gap: SikaSpace.sm + 2,
    paddingHorizontal: SikaSpace.md,
    marginBottom: SikaSpace.md,
  },
  fulfilmentCard: {
    flex: 1,
    borderRadius: SikaRadius.lg,
    borderWidth: 1,
    borderColor: SikaColors.border,
    backgroundColor: SikaColors.surface,
    padding: SikaSpace.md,
    gap: 4,
  },
  fulfilmentTitle: {
    color: SikaColors.warmWhite,
    fontSize: 13,
    fontWeight: "800",
    marginTop: 2,
  },
  fulfilmentSub: {
    color: SikaColors.secondaryText,
    fontSize: 11,
    lineHeight: 16,
  },
  quickActionRow: {
    flexDirection: "row",
    gap: SikaSpace.sm + 2,
    paddingHorizontal: SikaSpace.md,
    marginBottom: SikaSpace.xl,
  },
  quickPill: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: SikaRadius.md,
    borderWidth: 1,
    borderColor: SikaColors.border,
    backgroundColor: SikaColors.elevated,
    paddingHorizontal: SikaSpace.md,
    paddingVertical: SikaSpace.md,
  },
  quickPillText: {
    color: SikaColors.warmWhite,
    fontSize: 12,
    fontWeight: "700",
  },
  paddedHorizontal: {
    paddingHorizontal: SikaSpace.md,
  },
  popularGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 10,
  },
});
