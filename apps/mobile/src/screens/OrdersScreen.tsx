import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  ArrowRight,
  Bike,
  ChevronDown,
  ChevronUp,
  Clock,
  Compass,
  Receipt,
  RotateCcw,
  Search,
  Store,
  X,
} from "lucide-react-native";
import {
  ACTIVE_ORDER_STATUSES,
  FulfilmentStatus,
  OrderDTO,
  PAST_ORDER_STATUSES,
  PublicOrderTrackingDTO,
  ReorderResponseDTO,
  formatFulfilmentStatusLabel,
  formatPesewasToGhs,
  getDateRangeBounds,
} from "@sika/shared";
import { OfflineBanner } from "../components/OfflineBanner";
import { Badge, BadgeVariant } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { EmptyState } from "../components/ui/EmptyState";
import { ErrorState } from "../components/ui/ErrorState";
import { OrderRowSkeleton } from "../components/ui/Skeleton";
import { useCart } from "../context/CartContext";
import { useToast } from "../context/ToastContext";
import { resolveDishImageSource } from "../data/dish-images";
import { apiRequest } from "../services/api-client";
import {
  CachedOrderSummary,
  getOrdersFromCache,
  saveOrdersToCache,
} from "../services/offline-order-cache";
import { getCurrentUser } from "../services/storage";
import { SikaColors, SikaRadius, SikaSpace } from "../theme";
import { triggerLightHaptic, triggerSuccessHaptic } from "../utils/haptics";

interface OrdersScreenProps {
  onTrackOrder: (orderNumber: string) => void;
  onBrowseMenu?: () => void;
  onOpenCart?: () => void;
}

type HistoryScope = "active" | "past" | "all";
type StatusFilter = "ALL" | "COMPLETED" | "ABORTED" | "REFUNDED";
type FulfilmentFilter = "ALL" | "DELIVERY" | "COLLECTION";
type DateRangeFilter = "7d" | "30d" | "all";

function getStatusVariant(status: FulfilmentStatus): BadgeVariant {
  if (status === "DELIVERED" || status === "COLLECTED") return "success";
  if (status === "CANCELLED" || status === "REJECTED") return "error";
  if (status === "PENDING") return "warning";
  return "brand";
}

function mapDtoToCachedSummary(
  order: OrderDTO,
  syncedAt: string
): CachedOrderSummary {
  return {
    orderId: order.id,
    orderNumber: order.orderNumber,
    fulfilmentType: order.fulfilmentType,
    lastKnownStatus: order.fulfilmentStatus,
    paymentMethod: order.paymentMethod,
    paymentStatus: order.paymentStatus,
    createdAt: order.createdAt,
    primaryImageUrl:
      order.primaryImageUrl ||
      order.items?.find((i) => i.imageUrl)?.imageUrl ||
      null,
    rejectionReason: order.rejectionReason,
    cancellationReason: order.cancellationReason,
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
  };
}

/**
 * Industry-standard Mobile Order History & Tracking Screen:
 * - Active / Past segmented tabs with counts
 * - Collapsible Reference Lookup bar
 * - Instant search by Order # or dish name + horizontal filter pills
 * - Real order `createdAt` timestamps + dish thumbnails + refund pills
 * - Pull-to-refresh live reconciliation for both authenticated accounts and cached guests
 * - Cursor pagination (`Load Older Orders`) + 1-Tap Reorder directly into Tray
 */
export function OrdersScreen({
  onTrackOrder,
  onBrowseMenu,
  onOpenCart,
}: OrdersScreenProps) {
  const { addItem } = useCart();
  const { success, info, error: toastError } = useToast();

  const [scope, setScope] = useState<HistoryScope>("active");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [fulfilmentFilter, setFulfilmentFilter] =
    useState<FulfilmentFilter>("ALL");
  const [dateRange, setDateRange] = useState<DateRangeFilter>("all");
  const [searchText, setSearchText] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [lookupOpen, setLookupOpen] = useState(false);
  const [lookupInput, setLookupInput] = useState("");
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);

  const [orders, setOrders] = useState<CachedOrderSummary[]>([]);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [activeCount, setActiveCount] = useState(0);
  const [pastCount, setPastCount] = useState(0);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [reorderingOrderNumber, setReorderingOrderNumber] = useState<
    string | null
  >(null);
  const initializedTabRef = useRef(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchText.trim());
    }, 280);
    return () => clearTimeout(timer);
  }, [searchText]);

  const filterLocally = useCallback(
    (source: CachedOrderSummary[]) => {
      const bounds = getDateRangeBounds(dateRange);
      const q = debouncedSearch.toLowerCase();

      return source.filter((item) => {
        if (
          scope === "active" &&
          !(ACTIVE_ORDER_STATUSES as readonly string[]).includes(
            item.lastKnownStatus
          )
        ) {
          return false;
        }
        if (
          scope === "past" &&
          !(PAST_ORDER_STATUSES as readonly string[]).includes(
            item.lastKnownStatus
          )
        ) {
          return false;
        }
        if (statusFilter === "COMPLETED") {
          if (
            item.lastKnownStatus !== "DELIVERED" &&
            item.lastKnownStatus !== "COLLECTED"
          ) {
            return false;
          }
        } else if (statusFilter === "ABORTED") {
          if (
            item.lastKnownStatus !== "CANCELLED" &&
            item.lastKnownStatus !== "REJECTED"
          ) {
            return false;
          }
        } else if (statusFilter === "REFUNDED") {
          if (
            item.paymentStatus !== "REFUND_PENDING" &&
            item.paymentStatus !== "REFUNDED"
          ) {
            return false;
          }
        }

        if (
          fulfilmentFilter !== "ALL" &&
          item.fulfilmentType !== fulfilmentFilter
        ) {
          return false;
        }

        if (bounds.gte || bounds.lt) {
          const ts = new Date(
            item.createdAt || item.lastSynchronizedAt
          ).getTime();
          if (bounds.gte && ts < bounds.gte.getTime()) return false;
          if (bounds.lt && ts >= bounds.lt.getTime()) return false;
        }

        if (q) {
          const matchesRef = item.orderNumber.toLowerCase().includes(q);
          const matchesDish = item.itemsSummary.some((d) =>
            d.name.toLowerCase().includes(q)
          );
          if (!matchesRef && !matchesDish) return false;
        }

        return true;
      });
    },
    [scope, statusFilter, fulfilmentFilter, dateRange, debouncedSearch]
  );

  const loadOrders = useCallback(
    async (options?: { isPull?: boolean; cursor?: string | null; append?: boolean }) => {
      const isPull = Boolean(options?.isPull);
      const append = Boolean(options?.append);
      if (append) setLoadingMore(true);
      else if (isPull) setRefreshing(true);
      else setLoading(true);
      setErrorMessage(null);

      const user = await getCurrentUser();
      setIsSignedIn(Boolean(user));
      const customerId = user?.id || "guest";
      const cached = await getOrdersFromCache(customerId);

      const isDefaultUnfiltered =
        scope === "all" &&
        statusFilter === "ALL" &&
        fulfilmentFilter === "ALL" &&
        dateRange === "all" &&
        !debouncedSearch &&
        !append;

      if (cached.length > 0 && orders.length === 0 && !append) {
        const localFiltered = filterLocally(cached);
        setOrders(localFiltered);
        setActiveCount(
          cached.filter((c) =>
            (ACTIVE_ORDER_STATUSES as readonly string[]).includes(c.lastKnownStatus)
          ).length
        );
        setPastCount(
          cached.filter((c) =>
            (PAST_ORDER_STATUSES as readonly string[]).includes(c.lastKnownStatus)
          ).length
        );
      }

      if (user) {
        const qs = new URLSearchParams();
        qs.set("scope", scope);
        if (statusFilter !== "ALL") qs.set("status", statusFilter);
        if (fulfilmentFilter !== "ALL") qs.set("fulfilmentType", fulfilmentFilter);
        if (dateRange !== "all") qs.set("dateRange", dateRange);
        if (debouncedSearch) qs.set("search", debouncedSearch);
        qs.set("limit", "15");
        if (options?.cursor) qs.set("cursor", options.cursor);

        const res = await apiRequest<{
          success: boolean;
          orders: OrderDTO[];
          nextCursor?: string | null;
          hasMore?: boolean;
          activeCount?: number;
          pastCount?: number;
        }>(`/orders/my-orders?${qs.toString()}`);

        if (res.success && res.data?.orders) {
          const syncedAt = new Date().toISOString();
          const mapped = res.data.orders.map((o) =>
            mapDtoToCachedSummary(o, syncedAt)
          );

          if (isDefaultUnfiltered) {
            await saveOrdersToCache(customerId, mapped);
          }

          setOrders((prev) => (append ? [...prev, ...mapped] : mapped));
          setNextCursor(res.data.nextCursor ?? null);
          setHasMore(Boolean(res.data.hasMore));
          const srvActive = res.data.activeCount ?? 0;
          const srvPast = res.data.pastCount ?? 0;
          setActiveCount(srvActive);
          setPastCount(srvPast);
          setIsOffline(false);
          setLastSyncedAt(syncedAt);

          if (!initializedTabRef.current) {
            initializedTabRef.current = true;
            if (srvActive === 0 && srvPast > 0) {
              setScope("past");
            } else if (srvActive === 0 && srvPast === 0) {
              setLookupOpen(true);
            }
          }
        } else if (res.isOffline) {
          setIsOffline(true);
          setOrders(filterLocally(cached));
          setLastSyncedAt(cached[0]?.lastSynchronizedAt || null);
        } else if (cached.length === 0) {
          setErrorMessage(res.error || "Unable to fetch orders.");
        }
      } else {
        // Guest mode: refresh up to 5 active cached device orders when pulling or initializing
        let workingCache = [...cached];
        if (workingCache.length > 0 && (isPull || !initializedTabRef.current)) {
          const activeCandidates = workingCache
            .filter((o) =>
              (ACTIVE_ORDER_STATUSES as readonly string[]).includes(
                o.lastKnownStatus
              )
            )
            .slice(0, 5);

          if (activeCandidates.length > 0) {
            const refreshedResults = await Promise.all(
              activeCandidates.map((cand) =>
                apiRequest<{
                  success: boolean;
                  tracking: PublicOrderTrackingDTO;
                }>(`/orders/track/${encodeURIComponent(cand.orderNumber)}`)
              )
            );
            const syncedAt = new Date().toISOString();
            let offlineHit = false;
            refreshedResults.forEach((trackRes, idx) => {
              const targetRef = activeCandidates[idx]?.orderNumber;
              if (trackRes.isOffline) offlineHit = true;
              if (trackRes.success && trackRes.data?.tracking && targetRef) {
                const dto = trackRes.data.tracking;
                const pos = workingCache.findIndex(
                  (c) => c.orderNumber === targetRef
                );
                if (pos >= 0) {
                  workingCache[pos] = {
                    ...workingCache[pos],
                    lastKnownStatus: dto.fulfilmentStatus,
                    paymentMethod:
                      dto.paymentMethod ?? workingCache[pos].paymentMethod,
                    paymentStatus: dto.paymentStatus,
                    createdAt: dto.createdAt || workingCache[pos].createdAt,
                    primaryImageUrl:
                      dto.primaryImageUrl ?? workingCache[pos].primaryImageUrl,
                    rejectionReason: dto.rejectionReason,
                    cancellationReason: dto.cancellationReason,
                    totalPesewas:
                      dto.totalPesewas ?? workingCache[pos].totalPesewas,
                    statusHistory: dto.timeline.map((t) => ({
                      status: t.status,
                      timestamp: t.timestamp,
                      note: t.note,
                    })),
                    lastSynchronizedAt: syncedAt,
                  };
                }
              }
            });
            setIsOffline(offlineHit);
            await saveOrdersToCache("guest", workingCache);
          }
        }

        const guestActive = workingCache.filter((c) =>
          (ACTIVE_ORDER_STATUSES as readonly string[]).includes(c.lastKnownStatus)
        ).length;
        const guestPast = workingCache.filter((c) =>
          (PAST_ORDER_STATUSES as readonly string[]).includes(c.lastKnownStatus)
        ).length;

        setActiveCount(guestActive);
        setPastCount(guestPast);
        setOrders(filterLocally(workingCache));
        setLastSyncedAt(workingCache[0]?.lastSynchronizedAt || null);
        setHasMore(false);
        setNextCursor(null);

        if (!initializedTabRef.current) {
          initializedTabRef.current = true;
          if (guestActive === 0 && guestPast > 0) {
            setScope("past");
          } else if (guestActive === 0 && guestPast === 0) {
            setLookupOpen(true);
          }
        }
      }

      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    },
    [scope, statusFilter, fulfilmentFilter, dateRange, debouncedSearch, filterLocally]
  );

  useEffect(() => {
    void loadOrders();
  }, [loadOrders]);

  const handleLookupOrder = async () => {
    const cleaned = lookupInput.trim().toUpperCase();
    if (!cleaned) {
      setLookupError("Enter a Sika order reference (e.g. SIKA-2026-XXXX).");
      return;
    }

    setLookupLoading(true);
    setLookupError(null);

    const res = await apiRequest(`/orders/track/${encodeURIComponent(cleaned)}`);
    setLookupLoading(false);

    if (res.success) {
      onTrackOrder(cleaned);
      return;
    }

    const localMatch = orders.find(
      (o) => o.orderNumber.toUpperCase() === cleaned
    );
    if (localMatch) {
      onTrackOrder(localMatch.orderNumber);
      return;
    }

    setLookupError(
      res.error || `No order found matching reference "${cleaned}".`
    );
  };

  const handleReorder = async (orderNumber: string) => {
    triggerLightHaptic();
    setReorderingOrderNumber(orderNumber);
    try {
      const res = await apiRequest<ReorderResponseDTO>(
        `/orders/${encodeURIComponent(orderNumber)}/reorder`,
        {
          method: "POST",
        }
      );

      if (!res.success || !res.data) {
        toastError("Reorder Failed", res.error || "Unable to load items.");
        return;
      }

      if (res.data.itemsToAdd.length === 0) {
        info(
          "Dishes Sold Out",
          res.data.unavailableItems[0]?.itemName
            ? `${res.data.unavailableItems.map((u) => u.itemName).join(", ")} cannot be added right now.`
            : "Items from this order are currently unavailable."
        );
        return;
      }

      for (const entry of res.data.itemsToAdd) {
        addItem(
          entry.menuItem,
          entry.quantity,
          entry.selectedOptions,
          entry.specialInstructions
        );
      }

      triggerSuccessHaptic();
      const skipped =
        res.data.unavailableItems.length > 0
          ? ` (${res.data.unavailableItems.map((u) => u.itemName).join(", ")} skipped)`
          : "";
      success(
        "Added to Tray",
        `Reordered ${res.data.itemsToAdd.length} ${
          res.data.itemsToAdd.length === 1 ? "dish" : "dishes"
        } from #${orderNumber}${skipped}.`
      );
      onOpenCart?.();
    } finally {
      setReorderingOrderNumber(null);
    }
  };

  const clearFilters = () => {
    setStatusFilter("ALL");
    setFulfilmentFilter("ALL");
    setDateRange("all");
    setSearchText("");
  };

  const hasFilters =
    statusFilter !== "ALL" ||
    fulfilmentFilter !== "ALL" ||
    dateRange !== "all" ||
    searchText.trim().length > 0;

  const statusChips = useMemo(
    () =>
      scope === "active"
        ? ([] as Array<{ id: StatusFilter; label: string }>)
        : ([
            { id: "ALL", label: "All Past" },
            { id: "COMPLETED", label: "Completed" },
            { id: "ABORTED", label: "Cancelled / Declined" },
            { id: "REFUNDED", label: "Refunds" },
          ] as Array<{ id: StatusFilter; label: string }>),
    [scope]
  );

  return (
    <View style={styles.root}>
      <OfflineBanner isOffline={isOffline} lastSynchronizedAt={lastSyncedAt} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void loadOrders({ isPull: true })}
            tintColor={SikaColors.accent}
          />
        }
      >
        {/* Top Reference Lookup Toggle */}
        <View style={styles.topActionBar}>
          <Text style={styles.sectionHeading}>Order History</Text>
          <Pressable
            onPress={() => {
              triggerLightHaptic();
              setLookupOpen((prev) => !prev);
            }}
            style={styles.lookupToggleBtn}
          >
            <Compass size={14} color={SikaColors.accentLight} />
            <Text style={styles.lookupToggleText}>Track Ref</Text>
            {lookupOpen ? (
              <ChevronUp size={14} color={SikaColors.secondaryText} />
            ) : (
              <ChevronDown size={14} color={SikaColors.secondaryText} />
            )}
          </Pressable>
        </View>

        {lookupOpen ? (
          <View style={styles.lookupCard}>
            <Text style={styles.lookupTitle}>Track Any Order Reference</Text>
            <View style={styles.lookupRow}>
              <View style={styles.lookupInputBox}>
                <Search size={15} color={SikaColors.muted} />
                <TextInput
                  value={lookupInput}
                  onChangeText={setLookupInput}
                  onSubmitEditing={handleLookupOrder}
                  autoCapitalize="characters"
                  returnKeyType="search"
                  placeholder="e.g. SIKA-2026-XXXX"
                  placeholderTextColor={SikaColors.muted}
                  style={styles.lookupInput}
                />
              </View>
              <Button
                title="Track"
                variant="primary"
                size="md"
                loading={lookupLoading}
                trailingIcon={<ArrowRight size={14} color={SikaColors.text} />}
                onPress={handleLookupOrder}
              />
            </View>
            {lookupError ? (
              <Text style={styles.lookupError}>{lookupError}</Text>
            ) : null}
          </View>
        ) : null}

        {/* Active / Past / All Segmented Tabs */}
        <View style={styles.segmentedBar}>
          {(
            [
              { id: "active", label: `Active (${activeCount})` },
              { id: "past", label: `Past (${pastCount})` },
              { id: "all", label: "All" },
            ] as const
          ).map((tab) => {
            const active = scope === tab.id;
            return (
              <Pressable
                key={tab.id}
                onPress={() => {
                  triggerLightHaptic();
                  setScope(tab.id);
                  if (tab.id === "active") setStatusFilter("ALL");
                }}
                style={[
                  styles.segmentBtn,
                  active && styles.segmentBtnActive,
                ]}
              >
                <Text
                  style={[
                    styles.segmentLabel,
                    active && styles.segmentLabelActive,
                  ]}
                >
                  {tab.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Search Input */}
        <View style={styles.searchBox}>
          <Search size={15} color={SikaColors.muted} />
          <TextInput
            value={searchText}
            onChangeText={setSearchText}
            placeholder="Search order # or dish name..."
            placeholderTextColor={SikaColors.muted}
            style={styles.searchInput}
          />
          {searchText.length > 0 ? (
            <Pressable onPress={() => setSearchText("")} hitSlop={8}>
              <X size={15} color={SikaColors.secondaryText} />
            </Pressable>
          ) : null}
        </View>

        {/* Horizontal Filter Pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsRow}
        >
          {statusChips.map((chip) => {
            const active = statusFilter === chip.id;
            return (
              <Pressable
                key={`st-${chip.id}`}
                onPress={() => {
                  triggerLightHaptic();
                  setStatusFilter(chip.id);
                }}
                style={[styles.chip, active && styles.chipActive]}
              >
                <Text
                  style={[styles.chipText, active && styles.chipTextActive]}
                >
                  {chip.label}
                </Text>
              </Pressable>
            );
          })}

          {(
            [
              { id: "ALL", label: "All Types" },
              { id: "DELIVERY", label: "Delivery" },
              { id: "COLLECTION", label: "Pickup" },
            ] as const
          ).map((chip) => {
            const active = fulfilmentFilter === chip.id;
            return (
              <Pressable
                key={`ft-${chip.id}`}
                onPress={() => {
                  triggerLightHaptic();
                  setFulfilmentFilter(chip.id);
                }}
                style={[styles.chip, active && styles.chipActive]}
              >
                <Text
                  style={[styles.chipText, active && styles.chipTextActive]}
                >
                  {chip.label}
                </Text>
              </Pressable>
            );
          })}

          {(
            [
              { id: "7d", label: "7 Days" },
              { id: "30d", label: "30 Days" },
              { id: "all", label: "All Time" },
            ] as const
          ).map((chip) => {
            const active = dateRange === chip.id;
            return (
              <Pressable
                key={`dr-${chip.id}`}
                onPress={() => {
                  triggerLightHaptic();
                  setDateRange(chip.id);
                }}
                style={[styles.chip, active && styles.chipActive]}
              >
                <Text
                  style={[styles.chipText, active && styles.chipTextActive]}
                >
                  {chip.label}
                </Text>
              </Pressable>
            );
          })}

          {hasFilters ? (
            <Pressable onPress={clearFilters} style={styles.resetChip}>
              <X size={12} color={SikaColors.warmWhite} />
              <Text style={styles.resetChipText}>Reset</Text>
            </Pressable>
          ) : null}
        </ScrollView>

        {loading && orders.length === 0 ? (
          <>
            <OrderRowSkeleton />
            <OrderRowSkeleton />
          </>
        ) : errorMessage ? (
          <ErrorState
            message={errorMessage}
            onRetry={() => void loadOrders()}
          />
        ) : orders.length === 0 ? (
          <EmptyState
            icon={<Receipt size={24} color={SikaColors.accentLight} />}
            title={
              hasFilters
                ? "No Matching Orders"
                : scope === "active"
                ? "No Active Orders"
                : "No Recent Orders Here"
            }
            description={
              hasFilters
                ? "Try clearing search or filter chips to see all orders."
                : scope === "active" && pastCount > 0
                ? "Your completed or cancelled orders are stored under the Past tab."
                : "Orders placed on this device or linked to your signed-in Sika account will appear automatically."
            }
            actionLabel={
              hasFilters
                ? "Clear Filters"
                : scope === "active" && pastCount > 0
                ? `View Past (${pastCount})`
                : onBrowseMenu
                ? "Browse Menu"
                : undefined
            }
            onAction={
              hasFilters
                ? clearFilters
                : scope === "active" && pastCount > 0
                ? () => setScope("past")
                : onBrowseMenu
            }
          />
        ) : (
          <FlatList
            data={orders}
            scrollEnabled={false}
            keyExtractor={(item) => item.orderNumber}
            renderItem={({ item }) => {
              const isPast = (PAST_ORDER_STATUSES as readonly string[]).includes(
                item.lastKnownStatus
              );
              const timestamp = item.createdAt || item.lastSynchronizedAt;
              const imgSource = resolveDishImageSource(item.primaryImageUrl);
              const isReordering = reorderingOrderNumber === item.orderNumber;

              return (
                <View style={styles.orderCard}>
                  <Pressable
                    onPress={() => onTrackOrder(item.orderNumber)}
                    style={styles.cardMainRow}
                  >
                    <Image source={imgSource} style={styles.thumb} />

                    <View style={styles.cardInfo}>
                      <View style={styles.orderTopRow}>
                        <Text style={styles.orderNumber}>
                          {item.orderNumber}
                        </Text>
                        {item.fulfilmentType === "COLLECTION" ? (
                          <Store size={15} color={SikaColors.success} />
                        ) : (
                          <Bike size={15} color={SikaColors.accentLight} />
                        )}
                      </View>

                      <View style={styles.badgesRow}>
                        <Badge
                          label={formatFulfilmentStatusLabel(item.lastKnownStatus)}
                          variant={getStatusVariant(item.lastKnownStatus)}
                        />
                        {item.paymentStatus === "REFUND_PENDING" ? (
                          <Badge label="Refund Processing" variant="warning" />
                        ) : item.paymentStatus === "REFUNDED" ? (
                          <Badge label="Refunded" variant="success" />
                        ) : null}
                      </View>

                      <Text style={styles.itemsLine} numberOfLines={2}>
                        {item.itemsSummary
                          .map((i) => `${i.quantity}x ${i.name}`)
                          .join(", ")}
                      </Text>
                    </View>
                  </Pressable>

                  <View style={styles.orderBottomRow}>
                    <View style={styles.timeRow}>
                      <Clock size={12} color={SikaColors.muted} />
                      <Text style={styles.timeText}>
                        {new Date(timestamp).toLocaleDateString([], {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </Text>
                    </View>

                    <View style={styles.rightActions}>
                      {item.totalPesewas > 0 ? (
                        <Text style={styles.priceText}>
                          {formatPesewasToGhs(item.totalPesewas)}
                        </Text>
                      ) : null}

                      {isPast ? (
                        <Pressable
                          disabled={isReordering}
                          onPress={() => void handleReorder(item.orderNumber)}
                          style={({ pressed }) => [
                            styles.reorderBtn,
                            isReordering && { opacity: 0.6 },
                            pressed && { opacity: 0.85 },
                          ]}
                        >
                          <RotateCcw size={12} color={SikaColors.warmWhite} />
                          <Text style={styles.reorderBtnText}>
                            {isReordering ? "..." : "Reorder"}
                          </Text>
                        </Pressable>
                      ) : (
                        <Pressable
                          onPress={() => onTrackOrder(item.orderNumber)}
                          hitSlop={6}
                        >
                          <ArrowRight size={15} color={SikaColors.accentLight} />
                        </Pressable>
                      )}
                    </View>
                  </View>
                </View>
              );
            }}
            ListFooterComponent={
              isSignedIn && hasMore && nextCursor ? (
                <View style={styles.loadMoreWrap}>
                  <Button
                    title="Load Older Orders"
                    variant="secondary"
                    size="md"
                    loading={loadingMore}
                    onPress={() =>
                      void loadOrders({ cursor: nextCursor, append: true })
                    }
                  />
                </View>
              ) : undefined
            }
          />
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: SikaColors.background,
  },
  scrollContent: {
    padding: SikaSpace.lg,
    paddingBottom: 115,
    gap: SikaSpace.md,
  },
  topActionBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionHeading: {
    color: SikaColors.text,
    fontSize: 20,
    fontWeight: "900",
  },
  lookupToggleBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: SikaRadius.pill,
    borderWidth: 1,
    borderColor: SikaColors.border,
    backgroundColor: SikaColors.surface,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  lookupToggleText: {
    color: SikaColors.warmWhite,
    fontSize: 12,
    fontWeight: "700",
  },
  lookupCard: {
    borderRadius: SikaRadius.xl,
    borderWidth: 1,
    borderColor: SikaColors.border,
    backgroundColor: SikaColors.surface,
    padding: SikaSpace.lg,
    gap: SikaSpace.md,
  },
  lookupTitle: {
    color: SikaColors.warmWhite,
    fontSize: 14,
    fontWeight: "800",
  },
  lookupRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SikaSpace.sm,
  },
  lookupInputBox: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: SikaSpace.sm,
    height: 44,
    borderRadius: SikaRadius.md,
    borderWidth: 1,
    borderColor: SikaColors.border,
    backgroundColor: SikaColors.elevated,
    paddingHorizontal: SikaSpace.md,
  },
  lookupInput: {
    flex: 1,
    color: SikaColors.warmWhite,
    fontSize: 13,
    fontWeight: "700",
  },
  lookupError: {
    color: "#FDA4AF",
    fontSize: 12,
  },
  segmentedBar: {
    flexDirection: "row",
    borderRadius: SikaRadius.lg,
    borderWidth: 1,
    borderColor: SikaColors.border,
    backgroundColor: SikaColors.surface,
    padding: 4,
    gap: 4,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: SikaRadius.md,
    alignItems: "center",
  },
  segmentBtnActive: {
    backgroundColor: SikaColors.accent,
  },
  segmentLabel: {
    color: SikaColors.secondaryText,
    fontSize: 12.5,
    fontWeight: "700",
  },
  segmentLabelActive: {
    color: SikaColors.text,
    fontWeight: "800",
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: SikaSpace.sm,
    height: 42,
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
  chipsRow: {
    gap: 8,
    paddingVertical: 2,
  },
  chip: {
    borderRadius: SikaRadius.pill,
    borderWidth: 1,
    borderColor: SikaColors.border,
    backgroundColor: SikaColors.surface,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  chipActive: {
    borderColor: SikaColors.accent,
    backgroundColor: SikaColors.accentWash16,
  },
  chipText: {
    color: SikaColors.secondaryText,
    fontSize: 12,
    fontWeight: "700",
  },
  chipTextActive: {
    color: SikaColors.accentLight,
  },
  resetChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: SikaRadius.pill,
    borderWidth: 1,
    borderColor: SikaColors.border,
    backgroundColor: SikaColors.elevated,
    paddingHorizontal: 11,
    paddingVertical: 7,
  },
  resetChipText: {
    color: SikaColors.warmWhite,
    fontSize: 12,
    fontWeight: "700",
  },
  orderCard: {
    borderRadius: SikaRadius.xl,
    borderWidth: 1,
    borderColor: SikaColors.border,
    backgroundColor: SikaColors.surface,
    padding: SikaSpace.md + 2,
    marginBottom: SikaSpace.md,
  },
  cardMainRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: SikaSpace.md,
  },
  thumb: {
    width: 60,
    height: 60,
    borderRadius: SikaRadius.md,
    borderWidth: 1,
    borderColor: SikaColors.border,
    backgroundColor: SikaColors.elevated,
  },
  cardInfo: {
    flex: 1,
    gap: 5,
  },
  orderTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  orderNumber: {
    color: SikaColors.text,
    fontSize: 14.5,
    fontWeight: "900",
  },
  badgesRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  itemsLine: {
    color: SikaColors.secondaryText,
    fontSize: 12.5,
    lineHeight: 17,
  },
  orderBottomRow: {
    marginTop: SikaSpace.md,
    paddingTop: SikaSpace.sm + 2,
    borderTopWidth: 1,
    borderTopColor: SikaColors.border,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  timeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  timeText: {
    color: SikaColors.muted,
    fontSize: 11,
  },
  rightActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: SikaSpace.sm,
  },
  priceText: {
    color: SikaColors.accentLight,
    fontSize: 13.5,
    fontWeight: "900",
    fontVariant: ["tabular-nums"],
  },
  reorderBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderRadius: SikaRadius.md,
    borderWidth: 1,
    borderColor: SikaColors.border,
    backgroundColor: SikaColors.elevated,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  reorderBtnText: {
    color: SikaColors.warmWhite,
    fontSize: 11.5,
    fontWeight: "800",
  },
  loadMoreWrap: {
    paddingTop: SikaSpace.sm,
    alignItems: "center",
  },
});
