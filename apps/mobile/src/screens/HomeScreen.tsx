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
  Minus,
  Plus,
  Search,
  SlidersHorizontal,
  Store,
} from "lucide-react-native";
import {
  FulfilmentStatus,
  OrderDTO,
  RESTAURANT_INFO,
  UserDTO,
  formatPesewasToGhs,
  formatTimeOfDayGreeting,
} from "@sika/shared";
import { DishCard, EnrichedMenuItem } from "../components/DishCard";
import { DishDetailModal } from "../components/DishDetailModal";
import { OfflineBanner } from "../components/OfflineBanner";
import {
  DEFAULT_MENU_FILTERS,
  FilterSheet,
  MenuFilterState,
} from "../components/ui/FilterSheet";
import { ScalePressable } from "../components/ui/ScalePressable";
import { DishCardSkeleton } from "../components/ui/Skeleton";
import { Badge } from "../components/ui/Badge";
import { useCart } from "../context/CartContext";
import { useToast } from "../context/ToastContext";
import { DEFAULT_MENU_CATEGORIES, DEFAULT_MENU_ITEMS } from "../data/default-menu";
import { MOBILE_IMAGE_ASSETS, resolveDishImageSource } from "../data/dish-images";
import { apiRequest } from "../services/api-client";
import { getLiveMenuCache, saveLiveMenuCache } from "../services/offline-menu-cache";
import {
  CachedOrderSummary,
  getOrdersFromCache,
  saveOrdersToCache,
} from "../services/offline-order-cache";
import { getCurrentUser } from "../services/storage";
import { SikaColors, SikaRadius, SikaSpace } from "../theme";
import { triggerLightHaptic } from "../utils/haptics";

interface HomeScreenProps {
  currentUser?: UserDTO | null;
  onNavigateToMenu: (categoryId?: string, initialQuery?: string) => void;
  onOpenSearch?: () => void;
  onOpenCart: () => void;
  onOpenOrders: () => void;
  onTrackOrder?: (orderNumber: string) => void;
}

function getTimeOfDayGreeting(fullName?: string | null): string {
  return formatTimeOfDayGreeting(fullName);
}

const TERMINAL_ORDER_STATUSES = new Set<FulfilmentStatus>([
  "DELIVERED",
  "COLLECTED",
  "CANCELLED",
  "REJECTED",
]);

function formatActiveStatusLabel(status: FulfilmentStatus): string {
  switch (status) {
    case "PENDING":
      return "Pending Confirmation";
    case "CONFIRMED":
      return "Confirmed";
    case "PREPARING":
      return "Being Prepared";
    case "READY_FOR_DISPATCH":
      return "Ready for Rider";
    case "OUT_FOR_DELIVERY":
      return "Out for Delivery";
    case "READY_FOR_PICKUP":
      return "Ready for Pickup";
    default:
      return status.replace(/_/g, " ");
  }
}

/**
 * Primary Customer Home Showcase balancing editorial photography, rapid search,
 * featured dish carousel, Sunyani category chips, and a 2-column Popular Today grid.
 */
export function HomeScreen({
  currentUser,
  onNavigateToMenu,
  onOpenSearch,
  onOpenOrders,
  onTrackOrder,
}: HomeScreenProps) {
  const { width } = useWindowDimensions();
  const cardWidth = Math.floor((width - SikaSpace.md * 2 - 10) / 2);

  const { items, addItem, updateQuantity } = useCart();
  const { success } = useToast();

  const [menuItems, setMenuItems] = useState<EnrichedMenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const [isAcceptingOrders, setIsAcceptingOrders] = useState(true);
  const [lowestDeliveryPesewas, setLowestDeliveryPesewas] = useState(800);
  const [activeOrder, setActiveOrder] = useState<CachedOrderSummary | null>(null);

  const [searchText, setSearchText] = useState("");
  const [filters, setFilters] = useState<MenuFilterState>(DEFAULT_MENU_FILTERS);
  const [filterSheetVisible, setFilterSheetVisible] = useState(false);
  const [selectedDish, setSelectedDish] = useState<EnrichedMenuItem | null>(null);

  const loadHomeCatalog = useCallback(async (isPull = false) => {
    if (isPull) setRefreshing(true);
    else setLoading(true);

    const [res, configRes, user] = await Promise.all([
      apiRequest<{ success: boolean; items: EnrichedMenuItem[] }>(
        "/menu/items?includeUnavailable=true"
      ),
      apiRequest<{
        success: boolean;
        restaurant?: { isAcceptingOrders?: boolean };
        deliveryZones?: Array<{ feePesewas?: number }>;
      }>("/config/public"),
      getCurrentUser(),
    ]);

    if (res.success && res.data?.items?.length) {
      setMenuItems(res.data.items);
      void saveLiveMenuCache(res.data.items);
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

    if (configRes.success && configRes.data) {
      if (typeof configRes.data.restaurant?.isAcceptingOrders === "boolean") {
        setIsAcceptingOrders(configRes.data.restaurant.isAcceptingOrders);
      }
      const fees = (configRes.data.deliveryZones || [])
        .map((z) => z.feePesewas)
        .filter((f): f is number => typeof f === "number" && f > 0);
      if (fees.length > 0) {
        setLowestDeliveryPesewas(Math.min(...fees));
      }
    }

    const customerId = user?.id || "guest";
    const cachedOrders = await getOrdersFromCache(customerId);
    const cachedActive =
      cachedOrders.find((o) => !TERMINAL_ORDER_STATUSES.has(o.lastKnownStatus)) ||
      null;
    setActiveOrder(cachedActive);

    if (user) {
      const ordersRes = await apiRequest<{ success: boolean; orders: OrderDTO[] }>(
        "/orders/my-orders"
      );
      if (ordersRes.success && ordersRes.data?.orders) {
        const syncedAt = new Date().toISOString();
        const mapped: CachedOrderSummary[] = ordersRes.data.orders.map((order) => ({
          orderId: order.id,
          orderNumber: order.orderNumber,
          fulfilmentType: order.fulfilmentType,
          lastKnownStatus: order.fulfilmentStatus,
          statusHistory: (order.statusHistory || []).map((h) => ({
            status: h.toStatus,
            timestamp: h.createdAt,
            note: h.note,
          })),
          totalPesewas: order.totalPesewas,
          itemsSummary: order.items.map((i) => ({
            name: i.itemNameSnapshot,
            quantity: i.quantity,
          })),
          lastSynchronizedAt: syncedAt,
        }));
        await saveOrdersToCache(customerId, mapped);
        setActiveOrder(
          mapped.find((o) => !TERMINAL_ORDER_STATUSES.has(o.lastKnownStatus)) || null
        );
      }
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
        {/* Personalized Greeting & Photographic Chef's Table Hero Card */}
        <View style={styles.heroHeader}>
          <View style={styles.topGreetingRow}>
            <Text style={styles.greetingEyebrow}>
              {getTimeOfDayGreeting(currentUser?.fullName)}
            </Text>

            <View
              style={[
                styles.locationPill,
                isAcceptingOrders
                  ? styles.statusOpenPill
                  : styles.statusPausedPill,
              ]}
            >
              <View
                style={[
                  styles.statusDot,
                  isAcceptingOrders
                    ? styles.statusDotOpen
                    : styles.statusDotPaused,
                ]}
              />
              <Text
                style={[
                  styles.statusStateText,
                  !isAcceptingOrders && styles.statusPausedText,
                ]}
              >
                {isAcceptingOrders ? "Kitchen Open" : "Ordering Paused"}
              </Text>
            </View>
          </View>

          {activeOrder ? (
            <ScalePressable
              scaleTo={0.98}
              onPress={() =>
                onTrackOrder
                  ? onTrackOrder(activeOrder.orderNumber)
                  : onOpenOrders()
              }
              accessibilityRole="button"
              accessibilityLabel={`Track active order ${activeOrder.orderNumber}`}
              style={styles.activeOrderBanner}
            >
              <View style={styles.activeOrderLeft}>
                <View style={styles.activeOrderPulseDot} />
                <View>
                  <Text style={styles.activeOrderTitle}>
                    Live Order · {activeOrder.orderNumber}
                  </Text>
                  <Text style={styles.activeOrderStatus}>
                    {formatActiveStatusLabel(activeOrder.lastKnownStatus)}
                  </Text>
                </View>
              </View>
              <View style={styles.activeOrderAction}>
                <Text style={styles.activeOrderActionText}>Track Live</Text>
                <ArrowRight size={13} color={SikaColors.accentLight} />
              </View>
            </ScalePressable>
          ) : null}

          {/* Editorial Hero Showcase Card */}
          <Pressable
            onPress={() => onNavigateToMenu("all")}
            style={styles.heroBannerCard}
          >
            <Image
              source={MOBILE_IMAGE_ASSETS.heroPlate}
              style={styles.heroBannerImg}
              resizeMode="cover"
            />
            <LinearGradient
              colors={[
                "rgba(16, 16, 16, 0.25)",
                "rgba(16, 16, 16, 0.72)",
                "rgba(16, 16, 16, 0.96)",
              ]}
              locations={[0, 0.5, 1]}
              style={StyleSheet.absoluteFill}
            />

            <View style={styles.heroBannerContent}>
              <View style={styles.heroBannerTopRow}>
                <Badge label="Commercial Rd · Sunyani" variant="brand" />
                <View style={styles.heroPrepTag}>
                  <Clock size={11} color={SikaColors.warmWhite} />
                  <Text style={styles.heroPrepTagText}>20–30 min prep</Text>
                </View>
              </View>

              <View style={styles.heroBannerCopy}>
                <Text style={styles.headline}>
                  Fresh Off the Grill, Warm to Your Table.
                </Text>
                <Text style={styles.subheadline}>
                  Whole tilapia over live charcoal, smoky party jollof, and
                  traditional soups cooked fresh to order.
                </Text>

                <View style={styles.heroRibbonRow}>
                  <View style={styles.heroRibbonMeta}>
                    <Store size={12} color={SikaColors.success} />
                    <Text style={styles.heroRibbonText}>Free Pickup</Text>
                    <Text style={styles.heroRibbonDot}>·</Text>
                    <Bike size={12} color={SikaColors.accentLight} />
                    <Text style={styles.heroRibbonText}>
                      Delivery from {formatPesewasToGhs(lowestDeliveryPesewas)}
                    </Text>
                  </View>

                  <View style={styles.heroCtaPill}>
                    <Text style={styles.heroCtaText}>Menu</Text>
                    <ArrowRight size={12} color={SikaColors.text} />
                  </View>
                </View>
              </View>
            </View>
          </Pressable>
        </View>

        {/* Search & Filter Row — Tapping opens dedicated Telegram-style SearchScreen */}
        <View style={styles.searchRow}>
          <Pressable
            onPress={() => {
              triggerLightHaptic();
              if (onOpenSearch) {
                onOpenSearch();
              } else {
                onNavigateToMenu("all");
              }
            }}
            accessibilityRole="search"
            accessibilityLabel="Search dishes"
            style={styles.searchBox}
          >
            <Search size={16} color={SikaColors.muted} />
            <Text style={styles.searchPlaceholderText} numberOfLines={1}>
              Search tilapia, banku, jollof, pizza...
            </Text>
          </Pressable>

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
              <ScalePressable
                key={cat.id}
                scaleTo={0.95}
                onPress={() => onNavigateToMenu(cat.id)}
                style={styles.catChip}
              >
                <Text style={styles.catChipText}>{cat.name}</Text>
              </ScalePressable>
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
                const simpleCartItem = !hasOptions
                  ? items.find(
                      (cartEntry) =>
                        cartEntry.menuItem.id === item.id &&
                        cartEntry.selectedOptions.length === 0 &&
                        !cartEntry.specialInstructions
                    )
                  : undefined;

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
                        {item.isAvailable && !hasOptions && simpleCartItem ? (
                          <View style={styles.miniStepperPill}>
                            <Pressable
                              onPress={(e) => {
                                e.stopPropagation();
                                triggerLightHaptic();
                                updateQuantity(
                                  simpleCartItem.id,
                                  simpleCartItem.quantity - 1
                                );
                              }}
                              hitSlop={6}
                              accessibilityRole="button"
                              accessibilityLabel={`Decrease quantity of ${item.name}`}
                              style={styles.miniStepperBtn}
                            >
                              <Minus size={12} color={SikaColors.text} />
                            </Pressable>
                            <Text style={styles.miniStepperCount}>
                              {simpleCartItem.quantity}
                            </Text>
                            <Pressable
                              onPress={(e) => {
                                e.stopPropagation();
                                triggerLightHaptic();
                                updateQuantity(
                                  simpleCartItem.id,
                                  simpleCartItem.quantity + 1
                                );
                              }}
                              hitSlop={6}
                              accessibilityRole="button"
                              accessibilityLabel={`Increase quantity of ${item.name}`}
                              style={styles.miniStepperBtn}
                            >
                              <Plus size={12} color={SikaColors.text} />
                            </Pressable>
                          </View>
                        ) : (
                          <Pressable
                            onPress={(e) => {
                              e.stopPropagation();
                              triggerLightHaptic();
                              if (hasOptions) setSelectedDish(item);
                              else handleQuickAdd(item);
                            }}
                            accessibilityRole="button"
                            accessibilityLabel={`Add ${item.name}`}
                            style={styles.miniAddBtn}
                          >
                            <Plus size={16} color={SikaColors.text} />
                          </Pressable>
                        )}
                      </View>
                    </View>
                  </Pressable>
                );
              }}
            />
          )}
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
    paddingBottom: 145,
  },
  heroHeader: {
    paddingHorizontal: SikaSpace.md,
    paddingTop: SikaSpace.md,
    paddingBottom: SikaSpace.sm,
  },
  topGreetingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: SikaSpace.sm,
    marginBottom: SikaSpace.sm + 2,
  },
  greetingEyebrow: {
    color: SikaColors.warmWhite,
    fontSize: 13.5,
    fontWeight: "800",
    letterSpacing: 0.2,
  },
  locationPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: SikaRadius.pill,
    borderWidth: 1,
    borderColor: SikaColors.accentWash40,
    backgroundColor: SikaColors.accentWash12,
  },
  heroBannerCard: {
    height: 226,
    borderRadius: SikaRadius.xl,
    borderWidth: 1,
    borderColor: SikaColors.border,
    borderTopColor: "rgba(255, 255, 255, 0.14)",
    backgroundColor: SikaColors.surface,
    overflow: "hidden",
  },
  heroBannerImg: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    width: "100%",
    height: "100%",
  },
  heroBannerContent: {
    flex: 1,
    justifyContent: "space-between",
    padding: SikaSpace.md + 2,
  },
  heroBannerTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  heroPrepTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: SikaRadius.pill,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.14)",
    backgroundColor: "rgba(16, 16, 16, 0.72)",
  },
  heroPrepTagText: {
    color: SikaColors.warmWhite,
    fontSize: 10.5,
    fontWeight: "700",
  },
  heroBannerCopy: {
    gap: 4,
  },
  heroRibbonRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 8,
    paddingTop: 9,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.12)",
  },
  heroRibbonMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    flex: 1,
  },
  heroRibbonText: {
    color: SikaColors.warmWhite,
    fontSize: 11,
    fontWeight: "700",
  },
  heroRibbonDot: {
    color: SikaColors.secondaryText,
    fontSize: 11,
    fontWeight: "900",
  },
  heroCtaPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: SikaColors.accent,
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: SikaRadius.pill,
  },
  heroCtaText: {
    color: SikaColors.text,
    fontSize: 11,
    fontWeight: "800",
  },
  statusOpenPill: {
    borderColor: "rgba(34, 197, 94, 0.35)",
    backgroundColor: "rgba(34, 197, 94, 0.10)",
  },
  statusPausedPill: {
    borderColor: "rgba(251, 113, 133, 0.35)",
    backgroundColor: "rgba(251, 113, 133, 0.10)",
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  statusDotOpen: {
    backgroundColor: SikaColors.success,
  },
  statusDotPaused: {
    backgroundColor: SikaColors.error,
  },
  statusStateText: {
    color: SikaColors.success,
    fontSize: 10.5,
    fontWeight: "800",
    letterSpacing: 0.7,
    textTransform: "uppercase",
  },
  statusPausedText: {
    color: SikaColors.error,
  },
  statusSeparator: {
    color: SikaColors.muted,
    fontSize: 11,
    fontWeight: "700",
  },
  locationText: {
    color: SikaColors.warmWhite,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.6,
  },
  activeOrderBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: SikaRadius.lg,
    borderWidth: 1,
    borderColor: SikaColors.accentWash40,
    borderTopColor: "rgba(255, 255, 255, 0.12)",
    backgroundColor: SikaColors.accentWash12,
    paddingHorizontal: SikaSpace.md,
    paddingVertical: 10,
    marginBottom: SikaSpace.md,
  },
  activeOrderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  activeOrderPulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: SikaColors.accentLight,
  },
  activeOrderTitle: {
    color: SikaColors.warmWhite,
    fontSize: 12,
    fontWeight: "800",
  },
  activeOrderStatus: {
    color: SikaColors.accentLight,
    fontSize: 11,
    fontWeight: "700",
    marginTop: 1,
  },
  activeOrderAction: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  activeOrderActionText: {
    color: SikaColors.accentLight,
    fontSize: 11.5,
    fontWeight: "800",
  },
  headline: {
    color: SikaColors.text,
    fontSize: 22,
    fontWeight: "900",
    letterSpacing: -0.4,
    lineHeight: 27,
  },
  subheadline: {
    color: "rgba(245, 241, 234, 0.80)",
    fontSize: 12,
    lineHeight: 17,
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
  searchPlaceholderText: {
    flex: 1,
    color: SikaColors.muted,
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
    borderTopColor: "rgba(255, 255, 255, 0.10)",
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
  miniStepperPill: {
    flexDirection: "row",
    alignItems: "center",
    height: 30,
    borderRadius: SikaRadius.sm,
    backgroundColor: SikaColors.accent,
    overflow: "hidden",
  },
  miniStepperBtn: {
    paddingHorizontal: 8,
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  miniStepperCount: {
    color: SikaColors.text,
    fontSize: 12,
    fontWeight: "800",
    minWidth: 16,
    textAlign: "center",
    fontVariant: ["tabular-nums"],
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
    borderTopColor: "rgba(255, 255, 255, 0.09)",
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
  quickPillWrap: {
    flex: 1,
  },
  quickPill: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: SikaRadius.md,
    borderWidth: 1,
    borderColor: SikaColors.border,
    borderTopColor: "rgba(255, 255, 255, 0.08)",
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
