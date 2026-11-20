import React, { useCallback, useEffect, useState } from "react";
import {
  FlatList,
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
  Clock,
  Receipt,
  Search,
  Store,
} from "lucide-react-native";
import {
  FulfilmentStatus,
  OrderDTO,
  formatPesewasToGhs,
} from "@sika/shared";
import { OfflineBanner } from "../components/OfflineBanner";
import { Badge, BadgeVariant } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { EmptyState } from "../components/ui/EmptyState";
import { ErrorState } from "../components/ui/ErrorState";
import { OrderRowSkeleton } from "../components/ui/Skeleton";
import { apiRequest } from "../services/api-client";
import {
  CachedOrderSummary,
  getOrdersFromCache,
  saveOrdersToCache,
} from "../services/offline-order-cache";
import { getCurrentUser } from "../services/storage";
import { SikaColors, SikaRadius, SikaSpace } from "../theme";

interface OrdersScreenProps {
  onTrackOrder: (orderNumber: string) => void;
  onBrowseMenu?: () => void;
}

function getStatusVariant(status: FulfilmentStatus): BadgeVariant {
  if (status === "DELIVERED" || status === "COLLECTED") return "success";
  if (status === "CANCELLED" || status === "REJECTED") return "error";
  if (status === "PENDING") return "warning";
  return "brand";
}

/**
 * Displays customer order history reconciled with customer-scoped local cache
 * alongside an instant reference lookup bar for guest or quick order tracking.
 */
export function OrdersScreen({ onTrackOrder, onBrowseMenu }: OrdersScreenProps) {
  const [lookupInput, setLookupInput] = useState("");
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);

  const [orders, setOrders] = useState<CachedOrderSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadOrders = useCallback(async (isPull = false) => {
    if (isPull) setRefreshing(true);
    else setLoading(true);
    setErrorMessage(null);

    const user = await getCurrentUser();
    const customerId = user?.id || "guest";
    const cached = await getOrdersFromCache(customerId);

    if (cached.length > 0) {
      setOrders(cached);
    }

    if (user) {
      const res = await apiRequest<{ success: boolean; orders: OrderDTO[] }>(
        "/orders/my-orders"
      );

      if (res.success && res.data?.orders) {
        const syncedAt = new Date().toISOString();
        const mapped: CachedOrderSummary[] = res.data.orders.map((order) => ({
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
        setOrders(mapped);
        setIsOffline(false);
        setLastSyncedAt(syncedAt);
      } else if (res.isOffline) {
        setIsOffline(true);
        setLastSyncedAt(cached[0]?.lastSynchronizedAt || null);
      } else if (cached.length === 0) {
        setErrorMessage(res.error || "Unable to fetch orders.");
      }
    } else {
      setIsOffline(false);
      setLastSyncedAt(cached[0]?.lastSynchronizedAt || null);
    }

    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    loadOrders(false);
  }, [loadOrders]);

  const handleLookupOrder = async () => {
    const cleaned = lookupInput.trim().toUpperCase();
    if (!cleaned) {
      setLookupError("Enter a Sika order reference (e.g. SIKA-2026-1001).");
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

    // Allow opening locally cached offline orders even if disconnected
    const localMatch = orders.find((o) => o.orderNumber.toUpperCase() === cleaned);
    if (localMatch) {
      onTrackOrder(localMatch.orderNumber);
      return;
    }

    setLookupError(
      res.error || `No order found matching reference "${cleaned}".`
    );
  };

  return (
    <View style={styles.root}>
      <OfflineBanner isOffline={isOffline} lastSynchronizedAt={lastSyncedAt} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadOrders(true)}
            tintColor={SikaColors.accent}
          />
        }
      >
        {/* Reference Lookup Card */}
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
                placeholder="e.g. SIKA-2026-1001"
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
          {lookupError ? <Text style={styles.lookupError}>{lookupError}</Text> : null}
        </View>

        <Text style={styles.sectionTitle}>Your Orders</Text>

        {loading && orders.length === 0 ? (
          <>
            <OrderRowSkeleton />
            <OrderRowSkeleton />
          </>
        ) : errorMessage ? (
          <ErrorState message={errorMessage} onRetry={() => loadOrders(false)} />
        ) : orders.length === 0 ? (
          <EmptyState
            icon={<Receipt size={24} color={SikaColors.accentLight} />}
            title="No Recent Orders Here"
            description="Orders placed on this device or linked to your signed-in Sika account will appear automatically."
            actionLabel={onBrowseMenu ? "Browse Menu" : undefined}
            onAction={onBrowseMenu}
          />
        ) : (
          <FlatList
            data={orders}
            scrollEnabled={false}
            keyExtractor={(item) => item.orderNumber}
            renderItem={({ item }) => (
              <Pressable
                onPress={() => onTrackOrder(item.orderNumber)}
                style={styles.orderCard}
              >
                <View style={styles.orderTopRow}>
                  <View style={styles.orderRefWrap}>
                    <Text style={styles.orderNumber}>{item.orderNumber}</Text>
                    <Badge
                      label={item.lastKnownStatus.replace(/_/g, " ")}
                      variant={getStatusVariant(item.lastKnownStatus)}
                    />
                  </View>
                  {item.fulfilmentType === "COLLECTION" ? (
                    <Store size={16} color={SikaColors.success} />
                  ) : (
                    <Bike size={16} color={SikaColors.accentLight} />
                  )}
                </View>

                <Text style={styles.itemsLine} numberOfLines={2}>
                  {item.itemsSummary
                    .map((i) => `${i.quantity}x ${i.name}`)
                    .join(", ")}
                </Text>

                <View style={styles.orderBottomRow}>
                  <View style={styles.timeRow}>
                    <Clock size={12} color={SikaColors.muted} />
                    <Text style={styles.timeText}>
                      {new Date(item.lastSynchronizedAt).toLocaleDateString([], {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </Text>
                  </View>

                  <View style={styles.priceAction}>
                    {item.totalPesewas > 0 ? (
                      <Text style={styles.priceText}>
                        {formatPesewasToGhs(item.totalPesewas)}
                      </Text>
                    ) : null}
                    <ArrowRight size={14} color={SikaColors.accentLight} />
                  </View>
                </View>
              </Pressable>
            )}
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
    paddingBottom: 32,
  },
  lookupCard: {
    borderRadius: SikaRadius.xl,
    borderWidth: 1,
    borderColor: SikaColors.border,
    backgroundColor: SikaColors.surface,
    padding: SikaSpace.lg,
    marginBottom: SikaSpace.xl,
    gap: SikaSpace.md,
  },
  lookupTitle: {
    color: SikaColors.warmWhite,
    fontSize: 15,
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
  sectionTitle: {
    color: SikaColors.text,
    fontSize: 18,
    fontWeight: "800",
    marginBottom: SikaSpace.md,
  },
  orderCard: {
    borderRadius: SikaRadius.xl,
    borderWidth: 1,
    borderColor: SikaColors.border,
    backgroundColor: SikaColors.surface,
    padding: SikaSpace.lg,
    marginBottom: SikaSpace.md,
  },
  orderTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: SikaSpace.sm,
  },
  orderRefWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: SikaSpace.sm,
    flexWrap: "wrap",
    flex: 1,
  },
  orderNumber: {
    color: SikaColors.text,
    fontSize: 15,
    fontWeight: "900",
  },
  itemsLine: {
    color: SikaColors.secondaryText,
    fontSize: 13,
    lineHeight: 18,
  },
  orderBottomRow: {
    marginTop: SikaSpace.md,
    paddingTop: SikaSpace.md,
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
  priceAction: {
    flexDirection: "row",
    alignItems: "center",
    gap: SikaSpace.sm,
  },
  priceText: {
    color: SikaColors.accentLight,
    fontSize: 14,
    fontWeight: "900",
    fontVariant: ["tabular-nums"],
  },
});
