import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Linking,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import NetInfo from "@react-native-community/netinfo";
import {
  ArrowLeft,
  Bike,
  Clock,
  Phone,
  Receipt,
  RefreshCw,
  Store,
} from "lucide-react-native";
import {
  PublicOrderTrackingDTO,
  RESTAURANT_INFO,
  formatPesewasToGhs,
} from "@sika/shared";
import { OfflineBanner } from "../components/OfflineBanner";
import { OrderStatusTimeline } from "../components/OrderStatusTimeline";
import { Badge } from "../components/ui/Badge";
import { ErrorState } from "../components/ui/ErrorState";
import { OrderRowSkeleton } from "../components/ui/Skeleton";
import { apiRequest } from "../services/api-client";
import {
  CachedOrderSummary,
  getOrdersFromCache,
  updateCachedOrder,
} from "../services/offline-order-cache";
import { getCurrentUser } from "../services/storage";
import { SikaColors, SikaRadius, SikaSpace } from "../theme";

interface OrderTrackingScreenProps {
  orderNumber: string;
  onBack: () => void;
}

/**
 * Live customer order tracking screen with NetInfo auto-reconciliation on reconnect,
 * transparent OfflineBanner staleness timestamping, and milestone history log.
 */
export function OrderTrackingScreen({
  orderNumber,
  onBack,
}: OrderTrackingScreenProps) {
  const [tracking, setTracking] = useState<CachedOrderSummary | null>(null);
  const [etaMinutes, setEtaMinutes] = useState<number>(35);
  const [paymentStatus, setPaymentStatus] = useState<string>("PENDING");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const wasOfflineRef = useRef(false);

  const syncTracking = useCallback(
    async (isPull = false) => {
      if (isPull) setRefreshing(true);
      else if (!tracking) setLoading(true);

      const user = await getCurrentUser();
      const customerId = user?.id || "guest";
      const cachedList = await getOrdersFromCache(customerId);
      const cachedEntry = cachedList.find(
        (o) => o.orderNumber.toUpperCase() === orderNumber.toUpperCase()
      );

      if (cachedEntry && !tracking) {
        setTracking(cachedEntry);
      }

      const res = await apiRequest<{
        success: boolean;
        tracking: PublicOrderTrackingDTO;
      }>(`/orders/track/${encodeURIComponent(orderNumber)}`);

      if (res.success && res.data?.tracking) {
        const dto = res.data.tracking;
        const syncedAt = new Date().toISOString();
        const reconciled: CachedOrderSummary = {
          orderId: cachedEntry?.orderId || dto.orderNumber,
          orderNumber: dto.orderNumber,
          fulfilmentType: dto.fulfilmentType,
          lastKnownStatus: dto.fulfilmentStatus,
          statusHistory: dto.timeline.map((t) => ({
            status: t.status,
            timestamp: t.timestamp,
            note: t.note,
          })),
          totalPesewas: cachedEntry?.totalPesewas ?? 0,
          itemsSummary: dto.itemsSummary.map((i) => ({
            name: i.itemName,
            quantity: i.quantity,
          })),
          lastSynchronizedAt: syncedAt,
        };

        await updateCachedOrder(customerId, reconciled);
        setTracking(reconciled);
        setEtaMinutes(dto.estimatedDeliveryMinutes);
        setPaymentStatus(dto.paymentStatus);
        setIsOffline(false);
        wasOfflineRef.current = false;
        setErrorMessage(null);
      } else if (res.isOffline) {
        setIsOffline(true);
        wasOfflineRef.current = true;
        if (!cachedEntry && !tracking) {
          setErrorMessage(
            "You are offline and this order reference is not yet stored on your device."
          );
        }
      } else if (!cachedEntry && !tracking) {
        setErrorMessage(res.error || `Order ${orderNumber} could not be found.`);
      }

      setLoading(false);
      setRefreshing(false);
    },
    [orderNumber, tracking]
  );

  useEffect(() => {
    syncTracking(false);
  }, [orderNumber]); // eslint-disable-line react-hooks/exhaustive-deps

  // Automatically re-sync tracking when network transitions back online
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      const online = Boolean(state.isConnected && state.isInternetReachable !== false);
      if (online && wasOfflineRef.current) {
        wasOfflineRef.current = false;
        syncTracking(false);
      } else if (!online) {
        setIsOffline(true);
        wasOfflineRef.current = true;
      }
    });
    return () => unsubscribe();
  }, [syncTracking]);

  return (
    <View style={styles.root}>
      {/* Sub-header */}
      <View style={styles.topBar}>
        <Pressable
          onPress={onBack}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="Back to orders"
          style={styles.backBtn}
        >
          <ArrowLeft size={16} color={SikaColors.warmWhite} />
          <Text style={styles.backText}>Orders</Text>
        </Pressable>

        <Text style={styles.headerRef} numberOfLines={1}>
          {orderNumber}
        </Text>

        <Pressable
          onPress={() => syncTracking(true)}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="Refresh tracking status"
          style={styles.refreshBtn}
        >
          <RefreshCw size={16} color={SikaColors.warmWhite} />
        </Pressable>
      </View>

      <OfflineBanner
        isOffline={isOffline}
        lastSynchronizedAt={tracking?.lastSynchronizedAt}
      />

      {loading && !tracking ? (
        <View style={styles.pad}>
          <OrderRowSkeleton />
          <OrderRowSkeleton />
        </View>
      ) : errorMessage && !tracking ? (
        <View style={styles.pad}>
          <ErrorState
            title="Order Tracking Unavailable"
            message={errorMessage}
            onRetry={() => syncTracking(false)}
          />
        </View>
      ) : tracking ? (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => syncTracking(true)}
              tintColor={SikaColors.accent}
            />
          }
        >
          {/* Summary Card */}
          <View style={styles.card}>
            <View style={styles.summaryTop}>
              <View style={styles.fulfilmentBadgeRow}>
                {tracking.fulfilmentType === "COLLECTION" ? (
                  <Store size={18} color={SikaColors.success} />
                ) : (
                  <Bike size={18} color={SikaColors.accentLight} />
                )}
                <Text style={styles.fulfilmentHeading}>
                  {tracking.fulfilmentType === "COLLECTION"
                    ? "Counter Pickup"
                    : "Sunyani Delivery"}
                </Text>
              </View>
              <Badge
                label={tracking.lastKnownStatus.replace(/_/g, " ")}
                variant={
                  tracking.lastKnownStatus === "DELIVERED" ||
                  tracking.lastKnownStatus === "COLLECTED"
                    ? "success"
                    : tracking.lastKnownStatus === "CANCELLED" ||
                      tracking.lastKnownStatus === "REJECTED"
                    ? "error"
                    : "brand"
                }
              />
            </View>

            <View style={styles.etaRow}>
              <Clock size={14} color={SikaColors.secondaryText} />
              <Text style={styles.etaText}>
                Est. prep &amp; fulfilment window: {etaMinutes} mins &bull; Payment:{" "}
                {paymentStatus}
              </Text>
            </View>
          </View>

          {/* Progress Stepper */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Live Status Timeline</Text>
            <OrderStatusTimeline
              fulfilmentType={tracking.fulfilmentType}
              currentStatus={tracking.lastKnownStatus}
              history={tracking.statusHistory}
            />
          </View>

          {/* Ordered Items */}
          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <Receipt size={16} color={SikaColors.accentLight} />
              <Text style={styles.cardTitleInline}>Items Summary</Text>
            </View>

            <View style={styles.itemsList}>
              {tracking.itemsSummary.map((item, idx) => (
                <View key={`${item.name}-${idx}`} style={styles.itemRow}>
                  <Text style={styles.itemQty}>{item.quantity}x</Text>
                  <Text style={styles.itemName}>{item.name}</Text>
                </View>
              ))}
            </View>

            {tracking.totalPesewas > 0 ? (
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Recorded Total</Text>
                <Text style={styles.totalAmount}>
                  {formatPesewasToGhs(tracking.totalPesewas)}
                </Text>
              </View>
            ) : null}
          </View>

          {/* Support Call Link */}
          <Pressable
            onPress={() => Linking.openURL(`tel:${RESTAURANT_INFO.primaryPhoneIntl}`)}
            style={styles.callCard}
          >
            <Phone size={16} color={SikaColors.accentLight} />
            <Text style={styles.callText}>
              Questions? Call Sika Kitchen ({RESTAURANT_INFO.primaryPhone})
            </Text>
          </Pressable>
        </ScrollView>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: SikaColors.background,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SikaSpace.lg,
    paddingVertical: SikaSpace.md,
    borderBottomWidth: 1,
    borderBottomColor: SikaColors.border,
  },
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: SikaRadius.pill,
    borderWidth: 1,
    borderColor: SikaColors.border,
    backgroundColor: SikaColors.surface,
  },
  backText: {
    color: SikaColors.warmWhite,
    fontSize: 12,
    fontWeight: "700",
  },
  headerRef: {
    color: SikaColors.text,
    fontSize: 15,
    fontWeight: "900",
    maxWidth: 180,
  },
  refreshBtn: {
    width: 36,
    height: 36,
    borderRadius: SikaRadius.pill,
    borderWidth: 1,
    borderColor: SikaColors.border,
    backgroundColor: SikaColors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  pad: {
    padding: SikaSpace.lg,
  },
  scrollContent: {
    padding: SikaSpace.lg,
    gap: SikaSpace.lg,
    paddingBottom: 32,
  },
  card: {
    borderRadius: SikaRadius.xl,
    borderWidth: 1,
    borderColor: SikaColors.border,
    backgroundColor: SikaColors.surface,
    padding: SikaSpace.lg,
  },
  summaryTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: SikaSpace.sm,
  },
  fulfilmentBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SikaSpace.sm,
  },
  fulfilmentHeading: {
    color: SikaColors.text,
    fontSize: 16,
    fontWeight: "800",
  },
  etaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: SikaSpace.md,
  },
  etaText: {
    color: SikaColors.secondaryText,
    fontSize: 12,
    flexShrink: 1,
  },
  cardTitle: {
    color: SikaColors.text,
    fontSize: 16,
    fontWeight: "800",
    marginBottom: SikaSpace.md,
  },
  cardHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SikaSpace.sm,
    marginBottom: SikaSpace.md,
  },
  cardTitleInline: {
    color: SikaColors.text,
    fontSize: 16,
    fontWeight: "800",
  },
  itemsList: {
    gap: SikaSpace.sm,
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: SikaSpace.sm,
  },
  itemQty: {
    color: SikaColors.accentLight,
    fontSize: 13,
    fontWeight: "800",
    minWidth: 26,
  },
  itemName: {
    flex: 1,
    color: SikaColors.warmWhite,
    fontSize: 13,
    fontWeight: "600",
  },
  totalRow: {
    marginTop: SikaSpace.md,
    paddingTop: SikaSpace.md,
    borderTopWidth: 1,
    borderTopColor: SikaColors.border,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  totalLabel: {
    color: SikaColors.secondaryText,
    fontSize: 13,
  },
  totalAmount: {
    color: SikaColors.accentLight,
    fontSize: 16,
    fontWeight: "900",
    fontVariant: ["tabular-nums"],
  },
  callCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: SikaSpace.sm,
    borderRadius: SikaRadius.lg,
    borderWidth: 1,
    borderColor: SikaColors.border,
    backgroundColor: SikaColors.elevated,
    paddingVertical: SikaSpace.lg,
  },
  callText: {
    color: SikaColors.warmWhite,
    fontSize: 13,
    fontWeight: "700",
  },
});
