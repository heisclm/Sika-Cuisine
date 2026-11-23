import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  AppState,
  Linking,
  Pressable,
  RefreshControl,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from "react-native";
import NetInfo from "@react-native-community/netinfo";
import {
  ArrowLeft,
  Bike,
  CheckCircle2,
  Clock,
  CreditCard,
  MessageCircle,
  Phone,
  Receipt,
  RefreshCw,
  RotateCcw,
  Share2,
  ShieldAlert,
  Store,
} from "lucide-react-native";
import {
  PAST_ORDER_STATUSES,
  PaymentMethod,
  PaymentStatus,
  PublicOrderTrackingDTO,
  RESTAURANT_INFO,
  ReorderResponseDTO,
  formatFulfilmentStatusLabel,
  formatPaymentMethodLabel,
  formatPaymentStatusLabel,
  formatPesewasToGhs,
} from "@sika/shared";
import { OfflineBanner } from "../components/OfflineBanner";
import { OrderStatusTimeline } from "../components/OrderStatusTimeline";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { ErrorState } from "../components/ui/ErrorState";
import { OrderRowSkeleton } from "../components/ui/Skeleton";
import { useCart } from "../context/CartContext";
import { useToast } from "../context/ToastContext";
import { apiRequest } from "../services/api-client";
import {
  CachedOrderSummary,
  getOrdersFromCache,
  updateCachedOrder,
} from "../services/offline-order-cache";
import { getCurrentUser } from "../services/storage";
import {
  getMobilePaymentReturnUrl,
  openInAppPaystackCheckout,
} from "../utils/paystack-browser";
import { triggerSuccessHaptic } from "../utils/haptics";
import { SikaColors, SikaRadius, SikaSpace } from "../theme";

interface OrderTrackingScreenProps {
  orderNumber: string;
  onBack: () => void;
  onOpenCart?: () => void;
}

/**
 * Live customer order tracking screen with NetInfo auto-reconciliation,
 * double-debit-safe Paystack payment verification/completion via in-app Safari/Chrome sheet,
 * transparent OfflineBanner staleness timestamping, automated refund notices,
 * 1-tap Reorder, and native Receipt Sharing.
 */
export function OrderTrackingScreen({
  orderNumber,
  onBack,
  onOpenCart,
}: OrderTrackingScreenProps) {
  const { addItem } = useCart();
  const { error: toastError, info: toastInfo, success: toastSuccess } = useToast();

  const [tracking, setTracking] = useState<CachedOrderSummary | null>(null);
  const [etaMinutes, setEtaMinutes] = useState<number>(35);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>("PENDING");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | undefined>(undefined);
  const [verifyingPayment, setVerifyingPayment] = useState(false);
  const [retryingPayment, setRetryingPayment] = useState(false);
  const [reordering, setReordering] = useState(false);
  const [paymentFeedback, setPaymentFeedback] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const wasOfflineRef = useRef(false);
  const prevStatusRef = useRef<string | null>(null);
  const prevPaymentRef = useRef<string | null>(null);

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
        if (cachedEntry.paymentMethod) setPaymentMethod(cachedEntry.paymentMethod);
        if (cachedEntry.paymentStatus) setPaymentStatus(cachedEntry.paymentStatus);
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
          paymentMethod: dto.paymentMethod ?? cachedEntry?.paymentMethod,
          paymentStatus: dto.paymentStatus,
          createdAt: dto.createdAt,
          primaryImageUrl: dto.primaryImageUrl ?? cachedEntry?.primaryImageUrl ?? null,
          rejectionReason: dto.rejectionReason,
          cancellationReason: dto.cancellationReason,
          statusHistory: dto.timeline.map((t) => ({
            status: t.status,
            timestamp: t.timestamp,
            note: t.note,
          })),
          totalPesewas: dto.totalPesewas ?? cachedEntry?.totalPesewas ?? 0,
          itemsSummary: dto.itemsSummary.map((i) => ({
            name: i.itemName,
            quantity: i.quantity,
          })),
          lastSynchronizedAt: syncedAt,
        };

        await updateCachedOrder(customerId, reconciled);
        if (
          prevStatusRef.current &&
          prevStatusRef.current !== dto.fulfilmentStatus
        ) {
          triggerSuccessHaptic();
          toastInfo(
            `Order #${dto.orderNumber}`,
            `Status updated to ${dto.fulfilmentStatus.replace(/_/g, " ").toLowerCase()}.`
          );
        }
        if (
          prevPaymentRef.current &&
          prevPaymentRef.current !== dto.paymentStatus &&
          dto.paymentStatus === "PAID"
        ) {
          triggerSuccessHaptic();
          toastSuccess(
            `Payment Confirmed (#${dto.orderNumber})`,
            "Your online payment has been verified."
          );
        }
        prevStatusRef.current = dto.fulfilmentStatus;
        prevPaymentRef.current = dto.paymentStatus;

        setTracking(reconciled);
        setEtaMinutes(dto.estimatedDeliveryMinutes);
        setPaymentStatus(dto.paymentStatus);
        if (dto.paymentMethod) setPaymentMethod(dto.paymentMethod);
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

  // Poll every 15 seconds while the order is active and refresh immediately on app foreground
  useEffect(() => {
    const status = tracking?.lastKnownStatus;
    const isTerminal =
      status === "DELIVERED" ||
      status === "COLLECTED" ||
      status === "CANCELLED" ||
      status === "REJECTED";

    const appStateSub = AppState.addEventListener("change", (nextState) => {
      if (nextState === "active") {
        syncTracking(false);
      }
    });

    const intervalId = isTerminal
      ? null
      : setInterval(() => {
          syncTracking(false);
        }, 15_000);

    return () => {
      appStateSub.remove();
      if (intervalId) clearInterval(intervalId);
    };
  }, [tracking?.lastKnownStatus, syncTracking]);

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

  const handleVerifyPaid = async () => {
    setVerifyingPayment(true);
    setPaymentFeedback(null);
    try {
      const res = await apiRequest<{
        success: boolean;
        verified?: boolean;
        message?: string;
        error?: string;
      }>(`/orders/${encodeURIComponent(orderNumber)}/pay`, {
        method: "POST",
        timeoutMs: 30000,
        body: JSON.stringify({ verifyOnly: true, clientPlatform: "mobile" }),
      });

      if (res.status === 409) {
        const msg =
          res.error ||
          "Mobile Money/card payment is still processing. Please approve on your phone or try Verify again in 30 seconds.";
        setPaymentFeedback(msg);
        toastInfo("Payment In Progress", msg);
        return;
      }

      if (!res.success || !res.data) {
        const msg = res.error || "Unable to verify payment right now.";
        setPaymentFeedback(msg);
        toastError("Verification Failed", msg);
        return;
      }

      if (res.data.verified) {
        setPaymentStatus("PAID");
        setPaymentFeedback(
          res.data.message || "Payment confirmed! Your order has been sent to our kitchen."
        );
        toastSuccess("Payment Confirmed", `#${orderNumber} is now in the Cashier queue.`);
        await syncTracking(false);
      } else {
        const msg =
          res.data.message ||
          "No completed payment found yet. Tap Complete Payment below to pay securely.";
        setPaymentFeedback(msg);
        toastInfo("Not Confirmed Yet", msg);
      }
    } finally {
      setVerifyingPayment(false);
    }
  };

  const handleCompletePayment = async () => {
    setRetryingPayment(true);
    setPaymentFeedback(null);
    const mobileReturnUrl = getMobilePaymentReturnUrl();

    try {
      const res = await apiRequest<{
        success: boolean;
        verified?: boolean;
        alreadyPaid?: boolean;
        authorizationUrl?: string;
        message?: string;
        error?: string;
      }>(`/orders/${encodeURIComponent(orderNumber)}/pay`, {
        method: "POST",
        timeoutMs: 30000,
        body: JSON.stringify({
          verifyOnly: false,
          clientPlatform: "mobile",
          mobileReturnUrl,
        }),
      });

      if (res.status === 409) {
        const msg =
          res.error ||
          "A Mobile Money payment is currently processing. Approve the prompt instead of paying twice.";
        setPaymentFeedback(msg);
        toastInfo("Payment Processing", msg);
        return;
      }

      if (!res.success || !res.data) {
        const msg = res.error || "Unable to start Paystack checkout.";
        setPaymentFeedback(msg);
        toastError("Checkout Unavailable", msg);
        return;
      }

      if (res.data.alreadyPaid || res.data.verified) {
        setPaymentStatus("PAID");
        const msg =
          res.data.message ||
          "Your earlier payment is already confirmed — you will not be charged again.";
        setPaymentFeedback(msg);
        toastSuccess("Already Paid", msg);
        await syncTracking(false);
        return;
      }

      if (res.data.authorizationUrl) {
        await openInAppPaystackCheckout(res.data.authorizationUrl, mobileReturnUrl);
        await handleVerifyPaid();
        await syncTracking(false);
      }
    } finally {
      setRetryingPayment(false);
    }
  };

  const needsOnlinePayment =
    paymentMethod === "PAYSTACK" &&
    paymentStatus !== "PAID" &&
    tracking?.lastKnownStatus !== "CANCELLED" &&
    tracking?.lastKnownStatus !== "REJECTED";

  const isPastOrder = tracking
    ? (PAST_ORDER_STATUSES as readonly string[]).includes(
        tracking.lastKnownStatus
      )
    : false;

  const declineReason = tracking?.rejectionReason || tracking?.cancellationReason;

  const handleShareReceipt = async () => {
    if (!tracking) return;
    const itemLines = tracking.itemsSummary
      .map((i) => `- ${i.quantity}x ${i.name}`)
      .join("\n");
    const placedStr = new Date(
      tracking.createdAt || tracking.lastSynchronizedAt
    ).toLocaleString();
    const message = [
      `SIKA CUISINE SUNYANI — RECEIPT`,
      `Order: #${tracking.orderNumber}`,
      `Placed: ${placedStr}`,
      `Type: ${
        tracking.fulfilmentType === "COLLECTION" ? "Counter Pickup" : "Delivery"
      }`,
      `Status: ${formatFulfilmentStatusLabel(tracking.lastKnownStatus)}`,
      `Payment: ${formatPaymentMethodLabel(paymentMethod)} (${formatPaymentStatusLabel(
        paymentStatus
      )})`,
      ``,
      `Dishes:`,
      itemLines,
      ``,
      `Total: ${formatPesewasToGhs(tracking.totalPesewas)}`,
      `Support: ${RESTAURANT_INFO.primaryPhone}`,
    ].join("\n");

    await Share.share({
      title: `Sika Cuisine Receipt #${tracking.orderNumber}`,
      message,
    }).catch(() => {});
  };

  const handleOrderAgain = async () => {
    setReordering(true);
    try {
      const res = await apiRequest<ReorderResponseDTO>(
        `/orders/${encodeURIComponent(orderNumber)}/reorder`,
        {
          method: "POST",
        }
      );

      if (!res.success || !res.data) {
        toastError("Reorder Failed", res.error || "Unable to load dishes.");
        return;
      }

      if (res.data.itemsToAdd.length === 0) {
        toastInfo(
          "Dishes Currently Sold Out",
          res.data.unavailableItems[0]?.itemName
            ? `${res.data.unavailableItems.map((u) => u.itemName).join(", ")} cannot be ordered right now.`
            : "Dishes from this order are currently unavailable."
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
      toastSuccess(
        "Added to Tray",
        `Loaded ${res.data.itemsToAdd.length} ${
          res.data.itemsToAdd.length === 1 ? "dish" : "dishes"
        } from #${orderNumber}.`
      );
      onOpenCart?.();
    } finally {
      setReordering(false);
    }
  };

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
                label={formatFulfilmentStatusLabel(tracking.lastKnownStatus)}
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
                {formatPaymentStatusLabel(paymentStatus)}
              </Text>
            </View>

            <View style={styles.quickActionRow}>
              <Button
                title="Share Receipt"
                variant="secondary"
                size="sm"
                style={{ flex: 1 }}
                leadingIcon={<Share2 size={14} color={SikaColors.warmWhite} />}
                onPress={() => void handleShareReceipt()}
              />
              {isPastOrder ? (
                <Button
                  title="Order Again"
                  variant="primary"
                  size="sm"
                  style={{ flex: 1 }}
                  loading={reordering}
                  leadingIcon={<RotateCcw size={14} color={SikaColors.text} />}
                  onPress={() => void handleOrderAgain()}
                />
              ) : null}
            </View>
          </View>

          {/* Refund / Rejection / Cancellation Notice */}
          {paymentStatus === "REFUND_PENDING" ||
          paymentStatus === "REFUNDED" ||
          Boolean(declineReason) ? (
            <View
              style={[
                styles.refundBanner,
                paymentStatus === "REFUNDED"
                  ? styles.refundBannerSuccess
                  : paymentStatus === "REFUND_PENDING"
                  ? styles.refundBannerPending
                  : styles.refundBannerDeclined,
              ]}
            >
              <Text style={styles.refundTitle}>
                {paymentStatus === "REFUNDED"
                  ? `Refund Completed (${formatPesewasToGhs(tracking.totalPesewas)})`
                  : paymentStatus === "REFUND_PENDING"
                  ? `Automatic Refund Initiated (${formatPesewasToGhs(tracking.totalPesewas)})`
                  : tracking.lastKnownStatus === "REJECTED"
                  ? "Order Declined"
                  : "Order Cancelled"}
              </Text>
              {declineReason ? (
                <Text style={styles.refundReason}>Reason: {declineReason}</Text>
              ) : null}
              {paymentStatus === "REFUND_PENDING" ? (
                <Text style={styles.refundBody}>
                  Paystack is returning your payment automatically. Mobile Money refunds arrive within minutes to 24 hours; Card refunds take 3-7 business days.
                </Text>
              ) : paymentStatus === "REFUNDED" ? (
                <Text style={styles.refundBody}>
                  Paystack has completed your refund back to your original payment method.
                </Text>
              ) : null}
            </View>
          ) : null}

          {/* Awaiting Online Payment Recovery Card */}
          {needsOnlinePayment ? (
            <View style={styles.paymentCard}>
              <View style={styles.paymentHeader}>
                <ShieldAlert size={18} color={SikaColors.accentLight} />
                <Text style={styles.paymentTitle}>
                  Complete Online Payment to Start Cooking
                </Text>
              </View>
              <Text style={styles.paymentBody}>
                Paystack orders only reach our Cashier and Kitchen once payment is confirmed.
                Already debited via MoMo or Card? Tap Verify first — you will never be charged
                twice.
              </Text>

              {paymentFeedback ? (
                <View style={styles.feedbackBox}>
                  <Text style={styles.feedbackText}>{paymentFeedback}</Text>
                </View>
              ) : null}

              <View style={styles.paymentActions}>
                <Button
                  title="I Already Paid — Verify Now"
                  variant="secondary"
                  size="md"
                  fullWidth
                  loading={verifyingPayment}
                  disabled={retryingPayment}
                  leadingIcon={<CheckCircle2 size={16} color={SikaColors.success} />}
                  onPress={handleVerifyPaid}
                />
                <Button
                  title="Complete / Retry Payment"
                  variant="primary"
                  size="md"
                  fullWidth
                  loading={retryingPayment}
                  disabled={verifyingPayment}
                  leadingIcon={<CreditCard size={16} color={SikaColors.text} />}
                  onPress={handleCompletePayment}
                />
              </View>
            </View>
          ) : null}

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

          {/* Support Actions */}
          <View style={styles.supportRow}>
            <Pressable
              onPress={() => Linking.openURL(`tel:${RESTAURANT_INFO.primaryPhoneIntl}`)}
              style={[styles.callCard, { flex: 1 }]}
            >
              <Phone size={15} color={SikaColors.accentLight} />
              <Text style={styles.callText}>Call Kitchen</Text>
            </Pressable>

            <Pressable
              onPress={() =>
                Linking.openURL(
                  `${RESTAURANT_INFO.whatsappBaseUrl}?text=${encodeURIComponent(
                    `Hello Sika Cuisine Sunyani, I need help with Order #${orderNumber}.`
                  )}`
                )
              }
              style={[styles.whatsappCard, { flex: 1 }]}
            >
              <MessageCircle size={15} color={SikaColors.success} />
              <Text style={styles.whatsappText}>WhatsApp Help</Text>
            </Pressable>
          </View>
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
    paddingBottom: 115,
  },
  card: {
    borderRadius: SikaRadius.xl,
    borderWidth: 1,
    borderColor: SikaColors.border,
    backgroundColor: SikaColors.surface,
    padding: SikaSpace.lg,
  },
  paymentCard: {
    borderRadius: SikaRadius.xl,
    borderWidth: 1,
    borderColor: SikaColors.accentWash40,
    backgroundColor: SikaColors.surface,
    padding: SikaSpace.lg,
    gap: SikaSpace.sm + 2,
  },
  paymentHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: SikaSpace.sm,
  },
  paymentTitle: {
    flex: 1,
    color: SikaColors.text,
    fontSize: 15,
    fontWeight: "800",
  },
  paymentBody: {
    color: SikaColors.secondaryText,
    fontSize: 12.5,
    lineHeight: 18,
  },
  feedbackBox: {
    borderRadius: SikaRadius.md,
    borderWidth: 1,
    borderColor: SikaColors.border,
    backgroundColor: SikaColors.elevated,
    padding: SikaSpace.md,
  },
  feedbackText: {
    color: SikaColors.warmWhite,
    fontSize: 12.5,
    lineHeight: 17,
  },
  paymentActions: {
    gap: SikaSpace.sm,
    marginTop: 4,
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
    paddingVertical: SikaSpace.md + 2,
  },
  callText: {
    color: SikaColors.warmWhite,
    fontSize: 13,
    fontWeight: "700",
  },
  supportRow: {
    flexDirection: "row",
    gap: SikaSpace.sm,
  },
  whatsappCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: SikaSpace.sm,
    borderRadius: SikaRadius.lg,
    borderWidth: 1,
    borderColor: SikaColors.successBorder,
    backgroundColor: SikaColors.successBg,
    paddingVertical: SikaSpace.md + 2,
  },
  whatsappText: {
    color: SikaColors.success,
    fontSize: 13,
    fontWeight: "700",
  },
  quickActionRow: {
    flexDirection: "row",
    gap: SikaSpace.sm,
    marginTop: SikaSpace.md,
  },
  refundBanner: {
    borderRadius: SikaRadius.xl,
    borderWidth: 1,
    padding: SikaSpace.lg,
    gap: 6,
  },
  refundBannerSuccess: {
    borderColor: SikaColors.successBorder,
    backgroundColor: SikaColors.successBg,
  },
  refundBannerPending: {
    borderColor: SikaColors.warningBorder,
    backgroundColor: SikaColors.warningBg,
  },
  refundBannerDeclined: {
    borderColor: SikaColors.accentWash40,
    backgroundColor: SikaColors.accentWash16,
  },
  refundTitle: {
    color: SikaColors.text,
    fontSize: 15,
    fontWeight: "900",
  },
  refundReason: {
    color: SikaColors.warmWhite,
    fontSize: 13,
    fontWeight: "700",
  },
  refundBody: {
    color: SikaColors.secondaryText,
    fontSize: 12.5,
    lineHeight: 18,
  },
});
