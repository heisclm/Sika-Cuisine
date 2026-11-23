import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  AppState,
  AppStateStatus,
  Keyboard,
  LayoutAnimation,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  UIManager,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Banknote,
  Bike,
  CheckCircle2,
  Pause,
  Play,
  RefreshCw,
  User as UserIcon,
} from "lucide-react-native";
import { UserDTO, formatFirstName, formatPesewasToGhs } from "@sika/shared";
import { OfflineBanner } from "../OfflineBanner";
import { MobileNotificationBell } from "../notifications/MobileNotificationBell";
import { SikaModal } from "../ui/SikaModal";
import { useToast } from "../../context/ToastContext";
import {
  RiderCompletedScreen,
  RiderDateWindow,
} from "../../screens/rider/RiderCompletedScreen";
import { RiderProfileScreen } from "../../screens/rider/RiderProfileScreen";
import { RiderQueueScreen } from "../../screens/rider/RiderQueueScreen";
import { apiRequest } from "../../services/api-client";
import { SikaColors, SikaRadius, SikaSpace } from "../../theme";
import { RiderOrder } from "../../types/rider";
import { triggerLightHaptic, triggerSuccessHaptic } from "../../utils/haptics";

interface RiderShellProps {
  user: UserDTO;
  onSignOut: () => Promise<void>;
  onSessionRevoked: () => Promise<void>;
}

type RiderTab = "active" | "completed" | "profile";

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const animateRiderDock = () => {
  LayoutAnimation.configureNext(
    LayoutAnimation.create(
      220,
      LayoutAnimation.Types.easeInEaseOut,
      LayoutAnimation.Properties.opacity
    )
  );
};

/**
 * Isolated native 3-tab dispatch workstation rendered exclusively for authenticated
 * `DELIVERY_RIDER` sessions, replacing customer shopping tabs cleanly.
 */
export function RiderShell({
  user,
  onSignOut,
  onSessionRevoked,
}: RiderShellProps) {
  const insets = useSafeAreaInsets();
  const { success, error: toastError } = useToast();

  const [activeTab, setActiveTab] = useState<RiderTab>("active");
  const [completedDateRange, setCompletedDateRange] = useState<RiderDateWindow>("today");
  const [orders, setOrders] = useState<RiderOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const [autoRefreshPaused, setAutoRefreshPaused] = useState(false);
  const [mutatingId, setMutatingId] = useState<string | null>(null);
  const [pendingDeliverOrder, setPendingDeliverOrder] = useState<RiderOrder | null>(
    null
  );
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  useEffect(() => {
    const showEvent =
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent =
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const showSub = Keyboard.addListener(showEvent, () =>
      setIsKeyboardVisible(true)
    );
    const hideSub = Keyboard.addListener(hideEvent, () =>
      setIsKeyboardVisible(false)
    );

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const loadAssignedDeliveries = useCallback(
    async (options?: { silent?: boolean; isPull?: boolean }) => {
      const silent = Boolean(options?.silent);
      if (options?.isPull) setRefreshing(true);
      else if (!silent) setLoading(true);

      const res = await apiRequest<{
        success: boolean;
        riderName?: string;
        orders: RiderOrder[];
      }>(`/rider/orders?dateRange=${encodeURIComponent(completedDateRange)}`);

      if (res.status === 401 || res.status === 403) {
        setLoading(false);
        setRefreshing(false);
        await onSessionRevoked();
        return;
      }

      if (res.success && res.data?.orders) {
        setOrders(res.data.orders);
        setIsOffline(false);
        setLastSyncedAt(new Date().toISOString());
      } else if (res.isOffline) {
        setIsOffline(true);
      } else if (!silent) {
        toastError("Sync Error", res.error || "Unable to fetch assigned deliveries.");
      }

      setLoading(false);
      setRefreshing(false);
    },
    [onSessionRevoked, toastError, completedDateRange]
  );

  useEffect(() => {
    void loadAssignedDeliveries();
  }, [loadAssignedDeliveries]);

  useEffect(() => {
    if (autoRefreshPaused) return;
    const timer = setInterval(() => {
      if (AppState.currentState === "active") {
        void loadAssignedDeliveries({ silent: true });
      }
    }, 15_000);
    return () => clearInterval(timer);
  }, [autoRefreshPaused, loadAssignedDeliveries]);

  useEffect(() => {
    const sub = AppState.addEventListener("change", (nextState: AppStateStatus) => {
      if (nextState === "active") {
        void loadAssignedDeliveries({ silent: true });
      }
    });
    return () => sub.remove();
  }, [loadAssignedDeliveries]);

  const { activeDrops, completedToday, readyCount, outCount, cashToCollectPesewas } =
    useMemo(() => {
      const active = orders
        .filter((o) =>
          ["READY_FOR_DISPATCH", "OUT_FOR_DELIVERY"].includes(o.fulfilmentStatus)
        )
        .sort((a, b) => {
          if (a.fulfilmentStatus === b.fulfilmentStatus) return 0;
          return a.fulfilmentStatus === "OUT_FOR_DELIVERY" ? -1 : 1;
        });

      const delivered = orders.filter((o) => o.fulfilmentStatus === "DELIVERED");
      const ready = active.filter(
        (o) => o.fulfilmentStatus === "READY_FOR_DISPATCH"
      ).length;
      const out = active.filter(
        (o) => o.fulfilmentStatus === "OUT_FOR_DELIVERY"
      ).length;
      const codDue = active
        .filter(
          (o) =>
            o.paymentMethod === "CASH_ON_DELIVERY" && o.paymentStatus !== "PAID"
        )
        .reduce((sum, o) => sum + o.totalPesewas, 0);

      return {
        activeDrops: active,
        completedToday: delivered,
        readyCount: ready,
        outCount: out,
        cashToCollectPesewas: codDue,
      };
    }, [orders]);

  const advanceDrop = async (
    order: RiderOrder,
    targetStatus: "OUT_FOR_DELIVERY" | "DELIVERED"
  ) => {
    setMutatingId(order.id);
    try {
      const res = await apiRequest<{ success: boolean; error?: string }>(
        `/orders/${order.id}/status`,
        {
          method: "PATCH",
          body: JSON.stringify({ targetStatus }),
        }
      );

      if (res.status === 401 || res.status === 403) {
        await onSessionRevoked();
        return;
      }

      if (!res.success) {
        toastError(
          "Dispatch Update Failed",
          res.error || `Unable to update ${order.orderNumber}.`
        );
        return;
      }

      triggerSuccessHaptic();
      success(
        targetStatus === "OUT_FOR_DELIVERY"
          ? "En Route to Customer"
          : "Delivery Completed",
        targetStatus === "OUT_FOR_DELIVERY"
          ? `${order.orderNumber} marked Out for Delivery.`
          : `${order.orderNumber} marked Delivered.`
      );
      await loadAssignedDeliveries({ silent: true });
    } finally {
      setMutatingId(null);
      setPendingDeliverOrder(null);
    }
  };

  const pendingIsCod =
    pendingDeliverOrder?.paymentMethod === "CASH_ON_DELIVERY" &&
    pendingDeliverOrder?.paymentStatus !== "PAID";

  return (
    <View style={styles.root}>
      {/* Dispatch Console Header */}
      <View
        style={[
          styles.header,
          { paddingTop: Math.max(insets.top + 8, SikaSpace.lg) },
        ]}
      >
        <View style={styles.headerLeft}>
          <View style={styles.dispatchIcon}>
            <Bike size={18} color={SikaColors.accentLight} />
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={styles.brandTitle} numberOfLines={1}>
              SIKA DISPATCH
            </Text>
            <Text style={styles.brandSubtitle} numberOfLines={1}>
              {formatFirstName(user.fullName, "Rider")} · Sunyani
            </Text>
          </View>
        </View>

        <View style={styles.headerActions}>
          <Pressable
            onPress={() => {
              triggerLightHaptic();
              setAutoRefreshPaused((prev) => !prev);
            }}
            style={[
              styles.syncChip,
              autoRefreshPaused ? styles.syncChipPaused : styles.syncChipLive,
            ]}
          >
            {autoRefreshPaused ? (
              <Play size={11} color={SikaColors.warning} />
            ) : (
              <Pause size={11} color={SikaColors.success} />
            )}
            <Text
              style={[
                styles.syncChipText,
                { color: autoRefreshPaused ? SikaColors.warning : SikaColors.success },
              ]}
            >
              {autoRefreshPaused ? "Paused" : "Live 15s"}
            </Text>
          </Pressable>

          <Pressable
            onPress={() => {
              triggerLightHaptic();
              void loadAssignedDeliveries({ isPull: true });
            }}
            accessibilityRole="button"
            accessibilityLabel="Refresh rider dispatch queue"
            style={styles.refreshBtn}
          >
            <RefreshCw size={16} color={SikaColors.warmWhite} />
          </Pressable>

          <MobileNotificationBell
            enabled
            onSelectNotification={() => {
              setActiveTab("active");
              void loadAssignedDeliveries({ isPull: true });
            }}
          />
        </View>
      </View>

      <OfflineBanner isOffline={isOffline} lastSynchronizedAt={lastSyncedAt} />

      {/* Active Dispatch Screen Stage */}
      <View style={styles.stage}>
        {activeTab === "active" && (
          <RiderQueueScreen
            orders={activeDrops}
            loading={loading}
            refreshing={refreshing}
            mutatingId={mutatingId}
            cashToCollectPesewas={cashToCollectPesewas}
            readyCount={readyCount}
            outCount={outCount}
            onRefresh={() => void loadAssignedDeliveries({ isPull: true })}
            onStartDelivery={(order) => void advanceDrop(order, "OUT_FOR_DELIVERY")}
            onRequestComplete={(order) => setPendingDeliverOrder(order)}
          />
        )}

        {activeTab === "completed" && (
          <RiderCompletedScreen
            orders={completedToday}
            dateRange={completedDateRange}
            onDateRangeChange={setCompletedDateRange}
            refreshing={refreshing}
            onRefresh={() => void loadAssignedDeliveries({ isPull: true })}
          />
        )}

        {activeTab === "profile" && (
          <RiderProfileScreen
            user={user}
            autoRefreshPaused={autoRefreshPaused}
            lastSyncedAt={lastSyncedAt}
            onToggleAutoRefresh={() => setAutoRefreshPaused((prev) => !prev)}
            onManualRefresh={() => void loadAssignedDeliveries({ isPull: true })}
            onSignOut={onSignOut}
          />
        )}
      </View>

      {/* 3-Tab Rider Floating Capsule Dock (Hidden when Keyboard is Open) */}
      {!isKeyboardVisible ? (
        <View
          pointerEvents="box-none"
          style={[
            styles.dockWrapper,
            { bottom: Math.max(insets.bottom + 6, 14) },
          ]}
        >
          <View style={styles.dockPill}>
            <Pressable
              onPress={() => {
                triggerLightHaptic();
                animateRiderDock();
                setActiveTab("active");
              }}
              accessibilityRole="tab"
              accessibilityState={{ selected: activeTab === "active" }}
              style={({ pressed }) => [
                styles.tabItem,
                activeTab === "active" && styles.tabItemActive,
                pressed && { transform: [{ scale: 0.96 }] },
              ]}
            >
              <View style={styles.tabIconWrap}>
                <Bike
                  size={18}
                  strokeWidth={activeTab === "active" ? 2.2 : 1.75}
                  color={
                    activeTab === "active"
                      ? SikaColors.text
                      : SikaColors.secondaryText
                  }
                />
                {activeDrops.length > 0 ? (
                  <View style={styles.countBadge}>
                    <Text style={styles.countBadgeText}>
                      {activeDrops.length}
                    </Text>
                  </View>
                ) : null}
              </View>
              {activeTab === "active" ? (
                <Text style={styles.tabLabelActive} numberOfLines={1}>
                  Active Drops
                </Text>
              ) : null}
            </Pressable>

            <Pressable
              onPress={() => {
                triggerLightHaptic();
                animateRiderDock();
                setActiveTab("completed");
              }}
              accessibilityRole="tab"
              accessibilityState={{ selected: activeTab === "completed" }}
              style={({ pressed }) => [
                styles.tabItem,
                activeTab === "completed" && styles.tabItemActive,
                pressed && { transform: [{ scale: 0.96 }] },
              ]}
            >
              <CheckCircle2
                size={18}
                strokeWidth={activeTab === "completed" ? 2.2 : 1.75}
                color={
                  activeTab === "completed"
                    ? SikaColors.text
                    : SikaColors.secondaryText
                }
              />
              {activeTab === "completed" ? (
                <Text style={styles.tabLabelActive} numberOfLines={1}>
                  Completed ({completedToday.length})
                </Text>
              ) : null}
            </Pressable>

            <Pressable
              onPress={() => {
                triggerLightHaptic();
                animateRiderDock();
                setActiveTab("profile");
              }}
              accessibilityRole="tab"
              accessibilityState={{ selected: activeTab === "profile" }}
              style={({ pressed }) => [
                styles.tabItem,
                activeTab === "profile" && styles.tabItemActive,
                pressed && { transform: [{ scale: 0.96 }] },
              ]}
            >
              <UserIcon
                size={18}
                strokeWidth={activeTab === "profile" ? 2.2 : 1.75}
                color={
                  activeTab === "profile"
                    ? SikaColors.text
                    : SikaColors.secondaryText
                }
              />
              {activeTab === "profile" ? (
                <Text style={styles.tabLabelActive} numberOfLines={1}>
                  Rider Hub
                </Text>
              ) : null}
            </Pressable>
          </View>
        </View>
      ) : null}

      {/* Branded Dark Cash-on-Delivery Verification & Handover Modal */}
      <SikaModal
        visible={Boolean(pendingDeliverOrder)}
        tone={pendingIsCod ? "warning" : "success"}
        icon={
          pendingIsCod ? (
            <Banknote size={24} color={SikaColors.warning} />
          ) : (
            <CheckCircle2 size={24} color={SikaColors.success} />
          )
        }
        badgeLabel={
          pendingIsCod ? "Collect Cash at Handover" : "Prepaid via Paystack"
        }
        badgeVariant={pendingIsCod ? "warning" : "success"}
        title={`Complete ${pendingDeliverOrder?.orderNumber ?? "Delivery"}?`}
        message={
          pendingIsCod
            ? `Confirm you have collected ${formatPesewasToGhs(
                pendingDeliverOrder?.totalPesewas ?? 0
              )} in cash before completing this drop.`
            : "This order was prepaid via Paystack. Hand over the meal — collect GH₵ 0.00."
        }
        metaRows={
          pendingDeliverOrder
            ? [
                {
                  label: "Recipient",
                  value:
                    pendingDeliverOrder.deliveryAddress?.recipientName ||
                    pendingDeliverOrder.guestName ||
                    "Customer",
                },
                {
                  label: "Delivery Area",
                  value:
                    pendingDeliverOrder.deliveryAddress?.areaLocality ||
                    "Sunyani",
                },
                {
                  label: "Cash to Collect",
                  value: pendingIsCod
                    ? formatPesewasToGhs(pendingDeliverOrder.totalPesewas)
                    : "GH₵0.00 (Prepaid)",
                  accent: pendingIsCod,
                },
              ]
            : undefined
        }
        primaryLabel={
          pendingIsCod ? "Cash Collected & Deliver" : "Confirm Delivered"
        }
        primaryLoading={
          Boolean(pendingDeliverOrder) &&
          mutatingId === pendingDeliverOrder?.id
        }
        onPrimaryPress={() => {
          if (pendingDeliverOrder) {
            void advanceDrop(pendingDeliverOrder, "DELIVERED");
          }
        }}
        secondaryLabel="Cancel"
        onSecondaryPress={() => {
          if (!mutatingId) {
            setPendingDeliverOrder(null);
          }
        }}
        onRequestClose={() => {
          if (!mutatingId) {
            setPendingDeliverOrder(null);
          }
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: SikaColors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SikaSpace.md,
    paddingBottom: SikaSpace.md,
    borderBottomWidth: 1,
    borderBottomColor: SikaColors.border,
    backgroundColor: SikaColors.surface,
    gap: SikaSpace.sm,
  },
  headerLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: SikaSpace.sm + 2,
  },
  dispatchIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: SikaColors.accentWash40,
    backgroundColor: SikaColors.accentWash16,
    alignItems: "center",
    justifyContent: "center",
  },
  brandTitle: {
    color: SikaColors.text,
    fontSize: 13.5,
    fontWeight: "900",
    letterSpacing: 1.2,
  },
  brandSubtitle: {
    color: SikaColors.secondaryText,
    fontSize: 11,
    fontWeight: "600",
    marginTop: 1,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  syncChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderRadius: SikaRadius.pill,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  syncChipLive: {
    borderColor: SikaColors.successBorder,
    backgroundColor: SikaColors.successBg,
  },
  syncChipPaused: {
    borderColor: SikaColors.warningBorder,
    backgroundColor: SikaColors.warningBg,
  },
  syncChipText: {
    fontSize: 11,
    fontWeight: "800",
  },
  refreshBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: SikaColors.border,
    backgroundColor: SikaColors.elevated,
    alignItems: "center",
    justifyContent: "center",
  },
  stage: {
    flex: 1,
  },
  dockWrapper: {
    position: "absolute",
    left: 18,
    right: 18,
    zIndex: 30,
  },
  dockPill: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 999,
    backgroundColor: "rgba(24, 24, 24, 0.96)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.14)",
    paddingHorizontal: 8,
    paddingVertical: 7,
    shadowColor: "#000000",
    shadowOpacity: 0.65,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 16,
  },
  tabItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 11,
    paddingHorizontal: 18,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "transparent",
    gap: 8,
  },
  tabItemActive: {
    backgroundColor: "#2B1416",
    borderColor: "rgba(215, 25, 32, 0.65)",
    paddingHorizontal: 20,
  },
  tabIconWrap: {
    position: "relative",
  },
  countBadge: {
    position: "absolute",
    top: -6,
    right: -10,
    minWidth: 17,
    height: 17,
    borderRadius: 9,
    backgroundColor: SikaColors.accent,
    paddingHorizontal: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  countBadgeText: {
    color: SikaColors.text,
    fontSize: 9.5,
    fontWeight: "900",
    fontVariant: ["tabular-nums"],
  },
  tabLabelActive: {
    color: SikaColors.text,
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 0.2,
  },
});
