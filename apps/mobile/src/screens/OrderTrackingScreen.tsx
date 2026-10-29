import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { OrderStatusTimeline } from "../components/OrderStatusTimeline";
import { OfflineBanner } from "../components/OfflineBanner";
import {
  CachedOrderSummary,
  getOrdersFromCache,
  updateCachedOrder,
} from "../services/offline-order-cache";
import { apiRequest } from "../services/api-client";
import { getCurrentUser } from "../services/storage";
import { formatPesewasToGhs, FulfilmentStatus } from "@sika/shared";

interface OrderTrackingScreenProps {
  orderNumber: string;
}

export function OrderTrackingScreen({ orderNumber }: OrderTrackingScreenProps) {
  const [order, setOrder] = useState<CachedOrderSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchOrder = useCallback(
    async (isManualRefresh = false) => {
      if (isManualRefresh) setRefreshing(true);
      setErrorMessage(null);

      const user = await getCurrentUser();
      const customerId = user?.id || "guest";

      // 1. First load from local offline cache to be immediately responsive
      const cachedList = await getOrdersFromCache(customerId);
      const cached = cachedList.find((o) => o.orderNumber === orderNumber);
      if (cached) {
        setOrder(cached);
      }

      // 2. Query live server API
      const res = await apiRequest(`/orders/track/${orderNumber}`);

      if (res.success && res.data?.tracking) {
        const tracking = res.data.tracking;
        const freshSummary: CachedOrderSummary = {
          orderId: tracking.orderNumber,
          orderNumber: tracking.orderNumber,
          fulfilmentType: tracking.fulfilmentType,
          lastKnownStatus: tracking.fulfilmentStatus,
          statusHistory: tracking.timeline || [],
          totalPesewas: 0,
          itemsSummary: tracking.itemsSummary.map((i: any) => ({
            name: i.itemName,
            quantity: i.quantity,
          })),
          lastSynchronizedAt: new Date().toISOString(),
        };

        setOrder(freshSummary);
        setIsOffline(false);
        // Update offline cache with authoritative server state
        await updateCachedOrder(customerId, freshSummary);
      } else {
        if (res.isOffline) {
          setIsOffline(true);
          if (!cached) {
            setErrorMessage(
              "Unable to connect to Sika Cuisine servers. Please check your internet connection."
            );
          }
        } else {
          setErrorMessage(res.error || "Order not found.");
        }
      }

      setLoading(false);
      setRefreshing(false);
    },
    [orderNumber]
  );

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  if (loading && !order) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#e11d48" />
        <Text style={styles.loadingText}>Fetching live kitchen status...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Offline Stale Data Banner */}
      <OfflineBanner
        isOffline={isOffline}
        lastSynchronizedAt={order?.lastSynchronizedAt}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchOrder(true)}
            tintColor="#e11d48"
          />
        }
      >
        {/* Order Reference Card */}
        <View style={styles.headerCard}>
          <Text style={styles.orderLabel}>ORDER REFERENCE</Text>
          <Text style={styles.orderNumber}>{order?.orderNumber || orderNumber}</Text>
          <View style={styles.typeBadge}>
            <Text style={styles.typeBadgeText}>
              {order?.fulfilmentType === "COLLECTION"
                ? "RESTAURANT PICKUP"
                : "HOME / OFFICE DELIVERY"}
            </Text>
          </View>
        </View>

        {errorMessage && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        )}

        {/* Milestone Timeline */}
        {order && (
          <View style={styles.timelineCard}>
            <Text style={styles.cardHeading}>Preparation & Dispatch Status</Text>
            <OrderStatusTimeline
              fulfilmentType={order.fulfilmentType}
              currentStatus={order.lastKnownStatus}
            />
          </View>
        )}

        {/* Items Summary */}
        {order && order.itemsSummary.length > 0 && (
          <View style={styles.itemsCard}>
            <Text style={styles.cardHeading}>Items in this Order</Text>
            {order.itemsSummary.map((item, idx) => (
              <View key={idx} style={styles.itemRow}>
                <Text style={styles.itemQty}>{item.quantity}x</Text>
                <Text style={styles.itemName}>{item.name}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Help & Contact */}
        <View style={styles.supportCard}>
          <Text style={styles.supportTitle}>Need to modify your feast?</Text>
          <Text style={styles.supportSubtext}>
            Call our Sunyani kitchen directly at +233 53 337 6760
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0d0e12",
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  centered: {
    flex: 1,
    backgroundColor: "#0d0e12",
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    color: "#9ca3af",
    marginTop: 12,
    fontSize: 14,
  },
  headerCard: {
    backgroundColor: "#16171d",
    borderColor: "rgba(255, 255, 255, 0.08)",
    borderWidth: 1,
    borderRadius: 20,
    padding: 20,
    alignItems: "center",
    marginBottom: 16,
  },
  orderLabel: {
    color: "#9ca3af",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.5,
  },
  orderNumber: {
    color: "#ffffff",
    fontSize: 24,
    fontWeight: "800",
    marginVertical: 6,
  },
  typeBadge: {
    backgroundColor: "rgba(225, 29, 72, 0.15)",
    borderColor: "rgba(225, 29, 72, 0.4)",
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 10,
    marginTop: 4,
  },
  typeBadgeText: {
    color: "#e11d48",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  timelineCard: {
    backgroundColor: "#16171d",
    borderColor: "rgba(255, 255, 255, 0.08)",
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
  },
  cardHeading: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 12,
  },
  itemsCard: {
    backgroundColor: "#16171d",
    borderColor: "rgba(255, 255, 255, 0.08)",
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomColor: "rgba(255, 255, 255, 0.05)",
    borderBottomWidth: 1,
  },
  itemQty: {
    color: "#e11d48",
    fontWeight: "700",
    fontSize: 14,
    width: 28,
  },
  itemName: {
    color: "#e5e7eb",
    fontSize: 14,
    fontWeight: "500",
    flex: 1,
  },
  supportCard: {
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    borderColor: "rgba(255, 255, 255, 0.06)",
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
  },
  supportTitle: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
  },
  supportSubtext: {
    color: "#9ca3af",
    fontSize: 12,
    marginTop: 4,
  },
  errorBox: {
    backgroundColor: "rgba(220, 38, 38, 0.2)",
    borderColor: "rgba(220, 38, 38, 0.5)",
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: "#fca5a5",
    fontSize: 13,
    textAlign: "center",
  },
});
