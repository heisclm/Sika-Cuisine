import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  ArrowRight,
  Banknote,
  Bike,
  CheckCircle2,
  MapPin,
  Navigation,
  Phone,
} from "lucide-react-native";
import { formatPesewasToGhs } from "@sika/shared";
import { Badge } from "../../components/ui/Badge";
import { EmptyState } from "../../components/ui/EmptyState";
import { ScalePressable } from "../../components/ui/ScalePressable";
import { SikaColors, SikaRadius, SikaSpace } from "../../theme";
import { RiderOrder } from "../../types/rider";
import { triggerLightHaptic } from "../../utils/haptics";

interface RiderQueueScreenProps {
  orders: RiderOrder[];
  loading: boolean;
  refreshing: boolean;
  mutatingId: string | null;
  cashToCollectPesewas: number;
  readyCount: number;
  outCount: number;
  onRefresh: () => void;
  onStartDelivery: (order: RiderOrder) => void;
  onRequestComplete: (order: RiderOrder) => void;
}

type ActiveQueueFilter = "ALL" | "READY" | "OUT" | "COD";

function formatRelativeAge(isoDate: string): string {
  const diffMins = Math.max(
    1,
    Math.floor((Date.now() - new Date(isoDate).getTime()) / 60_000)
  );
  if (diffMins < 60) return `${diffMins}m ago`;
  const hrs = Math.floor(diffMins / 60);
  const remMins = diffMins % 60;
  return remMins > 0 ? `${hrs}h ${remMins}m` : `${hrs}h ago`;
}

/**
 * Active Rider Drop Queue featuring a high-contrast Sunyani shift KPI bar,
 * unmistakable Cash-on-Delivery vs Prepaid banners, one-tap Call & Maps,
 * and strict dispatch transitions (`READY_FOR_DISPATCH -> OUT_FOR_DELIVERY -> DELIVERED`).
 */
export function RiderQueueScreen({
  orders,
  loading,
  refreshing,
  mutatingId,
  cashToCollectPesewas,
  readyCount,
  outCount,
  onRefresh,
  onStartDelivery,
  onRequestComplete,
}: RiderQueueScreenProps) {
  const [queueFilter, setQueueFilter] = useState<ActiveQueueFilter>("ALL");

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      if (queueFilter === "READY") {
        return order.fulfilmentStatus === "READY_FOR_DISPATCH";
      }
      if (queueFilter === "OUT") {
        return order.fulfilmentStatus === "OUT_FOR_DELIVERY";
      }
      if (queueFilter === "COD") {
        return (
          order.paymentMethod === "CASH_ON_DELIVERY" &&
          order.paymentStatus !== "PAID"
        );
      }
      return true;
    });
  }, [orders, queueFilter]);

  const openMapsForOrder = (order: RiderOrder) => {
    triggerLightHaptic();
    const parts = [
      order.deliveryAddress?.streetAddress,
      order.deliveryAddress?.landmark,
      order.deliveryAddress?.areaLocality,
      "Sunyani, Ghana",
    ]
      .filter(Boolean)
      .join(", ");
    void Linking.openURL(
      `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(parts)}`
    );
  };

  const callCustomer = (order: RiderOrder) => {
    triggerLightHaptic();
    const phone = order.deliveryAddress?.recipientPhone || order.guestPhone || "";
    if (!phone) return;
    void Linking.openURL(`tel:${phone.replace(/\s+/g, "")}`);
  };

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={SikaColors.accent}
        />
      }
    >
      {/* Shift KPI Bar */}
      <View style={styles.kpiRow}>
        <View style={styles.kpiCard}>
          <Text style={styles.kpiLabel}>READY PICKUP</Text>
          <Text style={styles.kpiValue}>{readyCount}</Text>
        </View>
        <View style={[styles.kpiCard, outCount > 0 && styles.kpiCardHighlight]}>
          <Text style={styles.kpiLabel}>ON THE ROAD</Text>
          <Text style={[styles.kpiValue, outCount > 0 && { color: SikaColors.accentLight }]}>
            {outCount}
          </Text>
        </View>
        <View style={styles.kpiCard}>
          <Text style={styles.kpiLabel}>COD DUE</Text>
          <Text
            style={[
              styles.kpiValueSmall,
              cashToCollectPesewas > 0 && { color: SikaColors.accentLight },
            ]}
            numberOfLines={1}
          >
            {formatPesewasToGhs(cashToCollectPesewas)}
          </Text>
        </View>
      </View>

      {/* Active Queue Filter Pills */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterPillsRow}
      >
        {(
          [
            { id: "ALL", label: `All (${orders.length})` },
            { id: "READY", label: `Ready Pickup (${readyCount})` },
            { id: "OUT", label: `En Route (${outCount})` },
            { id: "COD", label: "COD Cash Only" },
          ] as const
        ).map((pill) => {
          const active = queueFilter === pill.id;
          return (
            <Pressable
              key={pill.id}
              onPress={() => {
                triggerLightHaptic();
                setQueueFilter(pill.id);
              }}
              style={[styles.filterChip, active && styles.filterChipActive]}
            >
              <Text
                style={[
                  styles.filterChipText,
                  active && styles.filterChipTextActive,
                ]}
              >
                {pill.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={SikaColors.accent} />
          <Text style={styles.loadingText}>Syncing Sunyani dispatch queue...</Text>
        </View>
      ) : filteredOrders.length === 0 ? (
        <EmptyState
          icon={<Bike size={34} color={SikaColors.accentLight} />}
          title={
            queueFilter === "ALL"
              ? "No Active Drops Assigned"
              : "No Matching Active Drops"
          }
          description={
            queueFilter === "ALL"
              ? "Pull down to refresh when the Commercial Road counter assigns your next Sunyani delivery."
              : "Switch filter pills above to inspect other assigned Sunyani deliveries."
          }
          actionLabel={queueFilter === "ALL" ? "Refresh Queue" : "Show All Drops"}
          onAction={queueFilter === "ALL" ? onRefresh : () => setQueueFilter("ALL")}
        />
      ) : (
        <View style={styles.cardsStack}>
          {filteredOrders.map((order) => {
            const isOut = order.fulfilmentStatus === "OUT_FOR_DELIVERY";
            const isCodPending =
              order.paymentMethod === "CASH_ON_DELIVERY" &&
              order.paymentStatus !== "PAID";
            const recipientName =
              order.deliveryAddress?.recipientName || order.guestName || "Customer";
            const recipientPhone =
              order.deliveryAddress?.recipientPhone || order.guestPhone || "";
            const isBusy = mutatingId === order.id;

            return (
              <View
                key={order.id}
                style={[styles.orderCard, isOut && styles.orderCardActive]}
              >
                {/* Header Row: Order Number + Status + Age */}
                <View style={styles.cardHeaderRow}>
                  <View>
                    <Text style={styles.orderNum}>{order.orderNumber}</Text>
                    <Text style={styles.orderMeta}>
                      {new Date(order.createdAt).toLocaleDateString([], {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}{" "}
                      · {formatRelativeAge(order.createdAt)} · {order.items.length}{" "}
                      {order.items.length === 1 ? "item" : "items"}
                    </Text>
                  </View>
                  <Badge
                    label={isOut ? "ON THE ROAD" : "READY PICKUP"}
                    variant={isOut ? "brand" : "warning"}
                  />
                </View>

                {/* Unmistakable Payment & Collection Callout */}
                <View
                  style={[
                    styles.paymentStrip,
                    isCodPending ? styles.paymentStripCod : styles.paymentStripPaid,
                  ]}
                >
                  {isCodPending ? (
                    <Banknote size={16} color={SikaColors.accentLight} />
                  ) : (
                    <CheckCircle2 size={16} color={SikaColors.success} />
                  )}
                  <Text
                    style={[
                      styles.paymentStripText,
                      isCodPending
                        ? styles.paymentStripTextCod
                        : styles.paymentStripTextPaid,
                    ]}
                  >
                    {isCodPending
                      ? `COLLECT CASH ON DELIVERY · ${formatPesewasToGhs(
                          order.totalPesewas
                        )}`
                      : `PREPAID (PAYSTACK) · COLLECT ${formatPesewasToGhs(0)}`}
                  </Text>
                </View>

                {/* Sunyani-First Address Hierarchy */}
                <View style={styles.addressBox}>
                  <View style={styles.addressHeader}>
                    <MapPin size={15} color={SikaColors.accentLight} />
                    <Text style={styles.localityText}>
                      {order.deliveryAddress?.areaLocality || "Sunyani"}
                    </Text>
                  </View>

                  {order.deliveryAddress?.landmark ? (
                    <Text style={styles.landmarkText}>
                      Landmark: {order.deliveryAddress.landmark}
                    </Text>
                  ) : null}

                  <Text style={styles.streetText}>
                    {recipientName} · {order.deliveryAddress?.streetAddress || "Commercial Rd"}
                  </Text>

                  {order.deliveryAddress?.deliveryNotes || order.customerNotes ? (
                    <Text style={styles.notesText}>
                      Note:{" "}
                      {order.deliveryAddress?.deliveryNotes || order.customerNotes}
                    </Text>
                  ) : null}
                </View>

                {/* Compact Bag Check Summary */}
                <View style={styles.bagBox}>
                  <Text style={styles.bagEyebrow}>BAG CHECK</Text>
                  <Text style={styles.bagItemsText}>
                    {order.items
                      .map((item) => `${item.quantity}x ${item.itemNameSnapshot}`)
                      .join("  ·  ")}
                  </Text>
                </View>

                {/* Road Utilities: Call + Navigate */}
                <View style={styles.utilityRow}>
                  <Pressable
                    onPress={() => callCustomer(order)}
                    disabled={!recipientPhone}
                    style={({ pressed }) => [
                      styles.utilityBtn,
                      !recipientPhone && { opacity: 0.45 },
                      pressed && { opacity: 0.8 },
                    ]}
                  >
                    <Phone size={15} color={SikaColors.accentLight} />
                    <Text style={styles.utilityBtnText}>
                      {recipientPhone ? "Call Customer" : "No Phone"}
                    </Text>
                  </Pressable>

                  <Pressable
                    onPress={() => openMapsForOrder(order)}
                    style={({ pressed }) => [
                      styles.utilityBtn,
                      pressed && { opacity: 0.8 },
                    ]}
                  >
                    <Navigation size={15} color={SikaColors.warmWhite} />
                    <Text style={styles.utilityBtnText}>Open Maps</Text>
                  </Pressable>
                </View>

                {/* Single Primary Status Transition Action */}
                {order.fulfilmentStatus === "READY_FOR_DISPATCH" ? (
                  <ScalePressable
                    scaleTo={0.98}
                    disabled={isBusy}
                    onPress={() => onStartDelivery(order)}
                    style={[styles.primaryActionBtn, isBusy && styles.btnBusy]}
                  >
                    {isBusy ? (
                      <ActivityIndicator size="small" color={SikaColors.text} />
                    ) : (
                      <>
                        <Text style={styles.primaryActionText}>
                          Confirm Pickup &amp; Start Delivery
                        </Text>
                        <ArrowRight size={16} color={SikaColors.text} />
                      </>
                    )}
                  </ScalePressable>
                ) : (
                  <ScalePressable
                    scaleTo={0.98}
                    disabled={isBusy}
                    onPress={() => onRequestComplete(order)}
                    style={[
                      styles.primaryActionBtn,
                      styles.completeActionBtn,
                      isBusy && styles.btnBusy,
                    ]}
                  >
                    {isBusy ? (
                      <ActivityIndicator size="small" color={SikaColors.background} />
                    ) : (
                      <>
                        <CheckCircle2 size={16} color={SikaColors.background} />
                        <Text style={styles.completeActionText}>
                          Complete Delivery
                        </Text>
                      </>
                    )}
                  </ScalePressable>
                )}
              </View>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: SikaColors.background,
  },
  scrollContent: {
    padding: SikaSpace.md,
    paddingBottom: 110,
    gap: SikaSpace.md,
  },
  kpiRow: {
    flexDirection: "row",
    gap: 8,
  },
  kpiCard: {
    flex: 1,
    borderRadius: SikaRadius.lg,
    borderWidth: 1,
    borderColor: SikaColors.border,
    borderTopColor: "rgba(255, 255, 255, 0.10)",
    backgroundColor: SikaColors.surface,
    paddingVertical: 11,
    paddingHorizontal: 10,
  },
  kpiCardHighlight: {
    borderColor: SikaColors.accentWash40,
    backgroundColor: SikaColors.accentWash12,
  },
  kpiLabel: {
    color: SikaColors.muted,
    fontSize: 9.5,
    fontWeight: "800",
    letterSpacing: 0.7,
  },
  kpiValue: {
    color: SikaColors.text,
    fontSize: 21,
    fontWeight: "900",
    marginTop: 3,
    fontVariant: ["tabular-nums"],
  },
  kpiValueSmall: {
    color: SikaColors.text,
    fontSize: 15,
    fontWeight: "900",
    marginTop: 6,
    fontVariant: ["tabular-nums"],
  },
  loadingWrap: {
    paddingVertical: 48,
    alignItems: "center",
    gap: SikaSpace.md,
  },
  loadingText: {
    color: SikaColors.secondaryText,
    fontSize: 13,
    fontWeight: "600",
  },
  cardsStack: {
    gap: SikaSpace.md,
  },
  orderCard: {
    borderRadius: SikaRadius.xl,
    borderWidth: 1,
    borderColor: SikaColors.border,
    borderTopColor: "rgba(255, 255, 255, 0.10)",
    backgroundColor: SikaColors.surface,
    padding: SikaSpace.md + 2,
    gap: SikaSpace.md - 2,
  },
  orderCardActive: {
    borderColor: SikaColors.accentWash40,
  },
  cardHeaderRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: SikaSpace.sm,
  },
  orderNum: {
    color: SikaColors.text,
    fontSize: 16,
    fontWeight: "900",
    letterSpacing: 0.4,
  },
  orderMeta: {
    color: SikaColors.secondaryText,
    fontSize: 11.5,
    marginTop: 2,
  },
  paymentStrip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: SikaRadius.md,
    borderWidth: 1,
    paddingHorizontal: SikaSpace.md,
    paddingVertical: 10,
  },
  paymentStripCod: {
    borderColor: SikaColors.accentWash40,
    backgroundColor: SikaColors.accentWash16,
  },
  paymentStripPaid: {
    borderColor: SikaColors.successBorder,
    backgroundColor: SikaColors.successBg,
  },
  paymentStripText: {
    flex: 1,
    fontSize: 11.5,
    fontWeight: "900",
    letterSpacing: 0.4,
    fontVariant: ["tabular-nums"],
  },
  paymentStripTextCod: {
    color: SikaColors.warmWhite,
  },
  paymentStripTextPaid: {
    color: SikaColors.success,
  },
  addressBox: {
    borderRadius: SikaRadius.md,
    borderWidth: 1,
    borderColor: SikaColors.border,
    backgroundColor: SikaColors.elevated,
    padding: SikaSpace.md,
    gap: 4,
  },
  addressHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  localityText: {
    color: SikaColors.text,
    fontSize: 15,
    fontWeight: "800",
  },
  landmarkText: {
    color: SikaColors.accentLight,
    fontSize: 12.5,
    fontWeight: "700",
    marginTop: 2,
  },
  streetText: {
    color: SikaColors.warmWhite,
    fontSize: 12.5,
    lineHeight: 18,
    marginTop: 2,
  },
  notesText: {
    color: SikaColors.warning,
    fontSize: 11.5,
    lineHeight: 16,
    marginTop: 4,
  },
  bagBox: {
    gap: 3,
  },
  bagEyebrow: {
    color: SikaColors.muted,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1,
  },
  bagItemsText: {
    color: SikaColors.secondaryText,
    fontSize: 12.5,
    lineHeight: 18,
  },
  utilityRow: {
    flexDirection: "row",
    gap: SikaSpace.sm,
  },
  utilityBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    height: 42,
    borderRadius: SikaRadius.md,
    borderWidth: 1,
    borderColor: SikaColors.border,
    backgroundColor: SikaColors.elevated,
  },
  utilityBtnText: {
    color: SikaColors.warmWhite,
    fontSize: 12.5,
    fontWeight: "700",
  },
  primaryActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 48,
    borderRadius: SikaRadius.md,
    backgroundColor: SikaColors.accent,
  },
  primaryActionText: {
    color: SikaColors.text,
    fontSize: 13.5,
    fontWeight: "800",
  },
  completeActionBtn: {
    backgroundColor: SikaColors.success,
  },
  completeActionText: {
    color: SikaColors.background,
    fontSize: 13.5,
    fontWeight: "900",
  },
  btnBusy: {
    opacity: 0.65,
  },
  filterPillsRow: {
    gap: 8,
  },
  filterChip: {
    borderRadius: SikaRadius.pill,
    borderWidth: 1,
    borderColor: SikaColors.border,
    backgroundColor: SikaColors.surface,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  filterChipActive: {
    borderColor: SikaColors.accent,
    backgroundColor: SikaColors.accentWash16,
  },
  filterChipText: {
    color: SikaColors.secondaryText,
    fontSize: 12,
    fontWeight: "700",
  },
  filterChipTextActive: {
    color: SikaColors.accentLight,
  },
});
