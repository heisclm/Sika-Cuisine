import React, { useMemo, useState } from "react";
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { Banknote, CheckCircle2 } from "lucide-react-native";
import { formatPesewasToGhs } from "@sika/shared";
import { Badge } from "../../components/ui/Badge";
import { EmptyState } from "../../components/ui/EmptyState";
import { SikaColors, SikaRadius, SikaSpace } from "../../theme";
import { RiderOrder } from "../../types/rider";
import { triggerLightHaptic } from "../../utils/haptics";

export type RiderDateWindow = "today" | "7d" | "30d";
type CompletedPaymentFilter = "ALL" | "COD" | "PREPAID";

interface RiderCompletedScreenProps {
  orders: RiderOrder[];
  dateRange: RiderDateWindow;
  onDateRangeChange: (next: RiderDateWindow) => void;
  refreshing: boolean;
  onRefresh: () => void;
}

/**
 * Completed Drops & Shift Cash Reconciliation Summary for Sunyani riders
 * supporting Today, 7-Day, and 30-Day lookbacks plus COD vs Prepaid filtering.
 */
export function RiderCompletedScreen({
  orders,
  dateRange,
  onDateRangeChange,
  refreshing,
  onRefresh,
}: RiderCompletedScreenProps) {
  const [paymentFilter, setPaymentFilter] = useState<CompletedPaymentFilter>("ALL");

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      if (paymentFilter === "COD") {
        return order.paymentMethod === "CASH_ON_DELIVERY";
      }
      if (paymentFilter === "PREPAID") {
        return order.paymentMethod !== "CASH_ON_DELIVERY";
      }
      return true;
    });
  }, [orders, paymentFilter]);

  const { cashCollectedPesewas, prepaidPesewas, codCount, prepaidCount } = useMemo(() => {
    let cash = 0;
    let prepaid = 0;
    let codTotalCount = 0;
    let prepaidTotalCount = 0;

    orders.forEach((order) => {
      if (order.paymentMethod === "CASH_ON_DELIVERY") {
        cash += order.totalPesewas;
        codTotalCount += 1;
      } else {
        prepaid += order.totalPesewas;
        prepaidTotalCount += 1;
      }
    });

    return {
      cashCollectedPesewas: cash,
      prepaidPesewas: prepaid,
      codCount: codTotalCount,
      prepaidCount: prepaidTotalCount,
    };
  }, [orders]);

  const windowHeading =
    dateRange === "today"
      ? "TODAY'S SHIFT RECONCILIATION"
      : dateRange === "7d"
      ? "LAST 7 DAYS RECONCILIATION"
      : "LAST 30 DAYS RECONCILIATION";

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
      {/* Window & Payment Filter Chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipsRow}
      >
        {(
          [
            { id: "today", label: "Today" },
            { id: "7d", label: "Last 7 Days" },
            { id: "30d", label: "Last 30 Days" },
          ] as const
        ).map((win) => {
          const active = dateRange === win.id;
          return (
            <Pressable
              key={win.id}
              onPress={() => {
                triggerLightHaptic();
                onDateRangeChange(win.id);
              }}
              style={[styles.chip, active && styles.chipActive]}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>
                {win.label}
              </Text>
            </Pressable>
          );
        })}

        <View style={styles.chipDivider} />

        {(
          [
            { id: "ALL", label: "All Payments" },
            { id: "COD", label: "COD Cash" },
            { id: "PREPAID", label: "Prepaid" },
          ] as const
        ).map((pay) => {
          const active = paymentFilter === pay.id;
          return (
            <Pressable
              key={pay.id}
              onPress={() => {
                triggerLightHaptic();
                setPaymentFilter(pay.id);
              }}
              style={[styles.chip, active && styles.chipActive]}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>
                {pay.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Shift Handover Summary Card */}
      <View style={styles.summaryCard}>
        <Text style={styles.summaryEyebrow}>{windowHeading}</Text>
        <View style={styles.cashHeroRow}>
          <View>
            <Text style={styles.cashHeroLabel}>Cash Collected (Hand to Cashier)</Text>
            <Text style={styles.cashHeroAmount}>
              {formatPesewasToGhs(cashCollectedPesewas)}
            </Text>
          </View>
          <View style={styles.cashIconPill}>
            <Banknote size={22} color={SikaColors.accentLight} />
          </View>
        </View>

        <View style={styles.splitRow}>
          <View style={styles.splitCell}>
            <Text style={styles.splitLabel}>COMPLETED DROPS</Text>
            <Text style={styles.splitValue}>{orders.length}</Text>
          </View>
          <View style={styles.splitCell}>
            <Text style={styles.splitLabel}>COD DROPS</Text>
            <Text style={styles.splitValue}>{codCount}</Text>
          </View>
          <View style={styles.splitCell}>
            <Text style={styles.splitLabel}>PREPAID ({prepaidCount})</Text>
            <Text style={styles.splitValueSmall}>
              {formatPesewasToGhs(prepaidPesewas)}
            </Text>
          </View>
        </View>
      </View>

      {filteredOrders.length === 0 ? (
        <EmptyState
          icon={<CheckCircle2 size={32} color={SikaColors.muted} />}
          title="No Completed Drops Found"
          description="Delivered orders for this Sunyani window and payment filter will appear here for cashier cash settlement."
        />
      ) : (
        <View style={styles.listStack}>
          {filteredOrders.map((order) => {
            const isCod = order.paymentMethod === "CASH_ON_DELIVERY";
            const itemCount = order.items.reduce((sum, i) => sum + i.quantity, 0);
            return (
              <View key={order.id} style={styles.rowCard}>
                <View style={styles.rowTop}>
                  <View style={styles.rowLeft}>
                    <Text style={styles.orderNum}>{order.orderNumber}</Text>
                    <Text style={styles.recipientText}>
                      {order.deliveryAddress?.recipientName || order.guestName || "Customer"}{" "}
                      · {order.deliveryAddress?.areaLocality || "Sunyani"}
                    </Text>
                  </View>
                  <Badge
                    label={isCod ? "COD COLLECTED" : "PREPAID"}
                    variant={isCod ? "brand" : "success"}
                  />
                </View>

                <View style={styles.rowBottom}>
                  <Text style={styles.itemsCount}>
                    {itemCount} {itemCount === 1 ? "item" : "items"} ·{" "}
                    {new Date(order.createdAt).toLocaleDateString([], {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </Text>
                  <Text style={styles.rowTotal}>
                    {formatPesewasToGhs(order.totalPesewas)}
                  </Text>
                </View>
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
  chipsRow: {
    gap: 8,
    alignItems: "center",
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
  chipDivider: {
    width: 1,
    height: 18,
    backgroundColor: SikaColors.border,
    marginHorizontal: 2,
  },
  summaryCard: {
    borderRadius: SikaRadius.xl,
    borderWidth: 1,
    borderColor: SikaColors.border,
    borderTopColor: "rgba(255, 255, 255, 0.10)",
    backgroundColor: SikaColors.surface,
    padding: SikaSpace.lg,
    gap: SikaSpace.md,
  },
  summaryEyebrow: {
    color: SikaColors.accentLight,
    fontSize: 10.5,
    fontWeight: "800",
    letterSpacing: 1.4,
  },
  cashHeroRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cashHeroLabel: {
    color: SikaColors.secondaryText,
    fontSize: 12,
    fontWeight: "600",
  },
  cashHeroAmount: {
    color: SikaColors.text,
    fontSize: 28,
    fontWeight: "900",
    marginTop: 2,
    fontVariant: ["tabular-nums"],
  },
  cashIconPill: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: SikaColors.accentWash40,
    backgroundColor: SikaColors.accentWash16,
    alignItems: "center",
    justifyContent: "center",
  },
  splitRow: {
    flexDirection: "row",
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: SikaColors.border,
    paddingTop: SikaSpace.md,
  },
  splitCell: {
    flex: 1,
    borderRadius: SikaRadius.md,
    borderWidth: 1,
    borderColor: SikaColors.border,
    backgroundColor: SikaColors.elevated,
    padding: 10,
  },
  splitLabel: {
    color: SikaColors.muted,
    fontSize: 9.5,
    fontWeight: "800",
    letterSpacing: 0.6,
  },
  splitValue: {
    color: SikaColors.text,
    fontSize: 16,
    fontWeight: "900",
    marginTop: 3,
    fontVariant: ["tabular-nums"],
  },
  splitValueSmall: {
    color: SikaColors.success,
    fontSize: 13.5,
    fontWeight: "900",
    marginTop: 5,
    fontVariant: ["tabular-nums"],
  },
  listStack: {
    gap: 10,
  },
  rowCard: {
    borderRadius: SikaRadius.lg,
    borderWidth: 1,
    borderColor: SikaColors.border,
    borderTopColor: "rgba(255, 255, 255, 0.08)",
    backgroundColor: SikaColors.surface,
    padding: SikaSpace.md,
    gap: 8,
  },
  rowTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 8,
  },
  rowLeft: {
    flex: 1,
  },
  orderNum: {
    color: SikaColors.text,
    fontSize: 14,
    fontWeight: "800",
  },
  recipientText: {
    color: SikaColors.secondaryText,
    fontSize: 12,
    marginTop: 2,
  },
  rowBottom: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: SikaColors.borderSubtle,
    paddingTop: 8,
  },
  itemsCount: {
    color: SikaColors.muted,
    fontSize: 11.5,
    fontWeight: "600",
  },
  rowTotal: {
    color: SikaColors.warmWhite,
    fontSize: 14,
    fontWeight: "900",
    fontVariant: ["tabular-nums"],
  },
});
