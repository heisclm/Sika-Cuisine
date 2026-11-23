import React, { useEffect, useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  AlertCircle,
  ArrowLeft,
  Banknote,
  Bike,
  CheckCircle2,
  Clock,
  CreditCard,
  MapPin,
  Store,
  Trash2,
  WifiOff,
} from "lucide-react-native";
import {
  DeliveryZone,
  FulfilmentType,
  OrderDTO,
  PaymentMethod,
  RESTAURANT_INFO,
  SUNYANI_DELIVERY_ZONES,
  formatFirstName,
  formatPesewasToGhs,
  phoneRegex,
} from "@sika/shared";
import { Button } from "../components/ui/Button";
import { SikaModal } from "../components/ui/SikaModal";
import { useCart } from "../context/CartContext";
import { useToast } from "../context/ToastContext";
import { apiRequest } from "../services/api-client";
import { CachedOrderSummary, updateCachedOrder } from "../services/offline-order-cache";
import { getCurrentUser } from "../services/storage";
import {
  getMobilePaymentReturnUrl,
  openInAppPaystackCheckout,
} from "../utils/paystack-browser";
import { SikaColors, SikaRadius, SikaSpace } from "../theme";

interface CheckoutScreenProps {
  onBackToCart: () => void;
  onOrderPlaced: (orderNumber: string) => void;
}

/**
 * Customer checkout screen enforcing Ghanaian contact validation, Sunyani
 * delivery tariffs (or zero-fee pickup), payment pairing, and offline fallback queueing.
 */
export function CheckoutScreen({ onBackToCart, onOrderPlaced }: CheckoutScreenProps) {
  const {
    items,
    cartSubtotalPesewas,
    clearCart,
    unavailableCount,
    refreshCartAvailability,
    markItemsUnavailable,
    removeUnavailableItems,
  } = useCart();
  const { error: toastError, info: toastInfo, success: toastSuccess } = useToast();

  const [fulfilmentType, setFulfilmentType] = useState<FulfilmentType>("DELIVERY");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("PAYSTACK");

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [signedInUser, setSignedInUser] = useState<{ fullName: string } | null>(null);

  const [streetAddress, setStreetAddress] = useState("");
  const [deliveryZones, setDeliveryZones] = useState<DeliveryZone[]>(SUNYANI_DELIVERY_ZONES);
  const [selectedZoneId, setSelectedZoneId] = useState<string>(SUNYANI_DELIVERY_ZONES[0].id);
  const [restaurantConfig, setRestaurantConfig] = useState<{
    isAcceptingOrders: boolean;
    isDeliveryEnabled: boolean;
    isCollectionEnabled: boolean;
    address: string;
  }>({
    isAcceptingOrders: true,
    isDeliveryEnabled: true,
    isCollectionEnabled: true,
    address: RESTAURANT_INFO.address,
  });
  const [landmark, setLandmark] = useState("");
  const [deliveryNotes, setDeliveryNotes] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [submittedCashModal, setSubmittedCashModal] = useState<{
    orderNumber: string;
    totalPesewas: number;
    fulfilmentType: FulfilmentType;
    paymentMethod: PaymentMethod;
  } | null>(null);
  const [offlineModalMessage, setOfflineModalMessage] = useState<string | null>(null);
  const [paystackFallbackModal, setPaystackFallbackModal] = useState<{
    orderNumber: string;
    authorizationUrl: string;
  } | null>(null);

  // Sync live restaurant config & delivery zones from /api/v1/config/public
  useEffect(() => {
    let active = true;
    apiRequest<{
      success: boolean;
      restaurant?: {
        isAcceptingOrders?: boolean;
        isDeliveryEnabled?: boolean;
        isCollectionEnabled?: boolean;
        address?: string;
      };
      deliveryZones?: DeliveryZone[];
    }>("/config/public").then((res) => {
      if (!active || !res.success || !res.data) return;

      const nextZones = res.data.deliveryZones;
      if (Array.isArray(nextZones) && nextZones.length > 0) {
        setDeliveryZones(nextZones);
        setSelectedZoneId((prev) =>
          nextZones.some((z) => z.id === prev) ? prev : nextZones[0].id
        );
      }

      if (res.data.restaurant) {
        const nextConfig = {
          isAcceptingOrders: res.data.restaurant.isAcceptingOrders ?? true,
          isDeliveryEnabled: res.data.restaurant.isDeliveryEnabled ?? true,
          isCollectionEnabled: res.data.restaurant.isCollectionEnabled ?? true,
          address: res.data.restaurant.address || RESTAURANT_INFO.address,
        };
        setRestaurantConfig(nextConfig);
        if (!nextConfig.isDeliveryEnabled && nextConfig.isCollectionEnabled) {
          setFulfilmentType("COLLECTION");
          setPaymentMethod((prev) =>
            prev === "CASH_ON_DELIVERY" ? "CASH_ON_COLLECTION" : prev
          );
        } else if (!nextConfig.isCollectionEnabled && nextConfig.isDeliveryEnabled) {
          setFulfilmentType("DELIVERY");
          setPaymentMethod((prev) =>
            prev === "CASH_ON_COLLECTION" ? "CASH_ON_DELIVERY" : prev
          );
        }
      }
    });

    return () => {
      active = false;
    };
  }, []);

  // Prefill contact information when a customer session already exists in SecureStore
  useEffect(() => {
    let active = true;
    if (items.length > 0) {
      void refreshCartAvailability();
    }
    getCurrentUser().then((user) => {
      if (!active || !user) return;
      setSignedInUser({ fullName: user.fullName || "Customer" });
      setFullName((prev) => prev || user.fullName || "");
      setPhone((prev) => prev || user.phone || "");
      setEmail((prev) => prev || user.email || "");
    });
    return () => {
      active = false;
    };
  }, []);

  const selectedZone = useMemo(
    () => deliveryZones.find((z) => z.id === selectedZoneId) ?? deliveryZones[0],
    [deliveryZones, selectedZoneId]
  );

  const deliveryFeePesewas = useMemo(
    () => (fulfilmentType === "COLLECTION" ? 0 : selectedZone?.feePesewas ?? 0),
    [fulfilmentType, selectedZone]
  );

  const grandTotalPesewas = useMemo(
    () => cartSubtotalPesewas + deliveryFeePesewas,
    [cartSubtotalPesewas, deliveryFeePesewas]
  );

  const handleFulfilmentChange = (nextType: FulfilmentType) => {
    setFulfilmentType(nextType);
    if (nextType === "COLLECTION" && paymentMethod === "CASH_ON_DELIVERY") {
      setPaymentMethod("CASH_ON_COLLECTION");
    } else if (nextType === "DELIVERY" && paymentMethod === "CASH_ON_COLLECTION") {
      setPaymentMethod("CASH_ON_DELIVERY");
    }
  };

  const cashVariant: PaymentMethod =
    fulfilmentType === "DELIVERY" ? "CASH_ON_DELIVERY" : "CASH_ON_COLLECTION";

  const validateForm = (): string | null => {
    const cleanPhone = phone.replace(/\s+/g, "").trim();

    if (fullName.trim().length < 2) {
      return "Please enter your full name.";
    }
    if (!cleanPhone || !phoneRegex.test(cleanPhone)) {
      return "Please enter a valid Ghanaian phone number (e.g. 0244123456 or +233244123456).";
    }
    if (!email.trim() || !email.includes("@")) {
      return "Please enter a valid email address for order notifications.";
    }
    if (fulfilmentType === "DELIVERY" && streetAddress.trim().length < 3) {
      return "Please provide your Sunyani street address, hostel, or house number.";
    }
    return null;
  };

  const handlePlaceOrder = async () => {
    if (!restaurantConfig.isAcceptingOrders) {
      setErrorMessage(
        "Sika Cuisine kitchen is currently closed for new online orders. Please check back shortly."
      );
      return;
    }

    if (fulfilmentType === "DELIVERY" && !restaurantConfig.isDeliveryEnabled) {
      setErrorMessage("Delivery is temporarily paused. Switch to Pickup to continue.");
      return;
    }

    if (fulfilmentType === "COLLECTION" && !restaurantConfig.isCollectionEnabled) {
      setErrorMessage("Counter Pickup is temporarily paused. Switch to Delivery to continue.");
      return;
    }

    const validationErr = validateForm();
    if (validationErr) {
      setErrorMessage(validationErr);
      return;
    }

    if (items.length === 0) {
      toastError("Tray Empty", "Please select dishes from the menu first.");
      return;
    }

    if (unavailableCount > 0) {
      setErrorMessage(
        "Please remove sold-out dishes from your tray before placing your order."
      );
      return;
    }

    setErrorMessage(null);
    setIsSubmitting(true);

    const compactPhone = phone.replace(/\s+/g, "").trim();
    const resolvedMethod: PaymentMethod =
      paymentMethod === "PAYSTACK" ? "PAYSTACK" : cashVariant;
    const mobileReturnUrl = getMobilePaymentReturnUrl();

    const payload = {
      fulfilmentType,
      paymentMethod: resolvedMethod,
      clientPlatform: "mobile",
      mobileReturnUrl,
      customerInfo: {
        fullName: fullName.trim(),
        email: email.trim(),
        phone: compactPhone,
      },
      deliveryAddress:
        fulfilmentType === "DELIVERY"
          ? {
              recipientName: fullName.trim(),
              recipientPhone: compactPhone,
              streetAddress: streetAddress.trim(),
              areaLocality: selectedZone?.localities?.[0] || selectedZone?.name || "Sunyani Central",
              landmark: landmark.trim() || undefined,
              city: "Sunyani",
              deliveryNotes: deliveryNotes.trim() || undefined,
            }
          : undefined,
      items: items.map((item) => ({
        menuItemId: item.menuItem.id,
        quantity: item.quantity,
        selectedOptionIds: item.selectedOptions.map((o) => o.optionId),
        specialInstructions: item.specialInstructions,
      })),
      customerNotes: deliveryNotes.trim() || undefined,
    };

    try {
      const idempotencyKey = `sika-mobile-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 10)}`;

      const response = await apiRequest<{
        success: boolean;
        order: OrderDTO;
        authorizationUrl?: string;
      }>("/orders", {
        method: "POST",
        timeoutMs: 30000,
        headers: {
          "Idempotency-Key": idempotencyKey,
        },
        body: JSON.stringify(payload),
      });

      const user = await getCurrentUser();
      const customerId = user?.id || "guest";

      if (response.success && response.data?.order) {
        const confirmed = response.data.order;
        const authorizationUrl = response.data.authorizationUrl;
        const summary: CachedOrderSummary = {
          orderId: confirmed.id,
          orderNumber: confirmed.orderNumber,
          fulfilmentType: confirmed.fulfilmentType,
          lastKnownStatus: confirmed.fulfilmentStatus,
          paymentMethod: confirmed.paymentMethod,
          paymentStatus: confirmed.paymentStatus,
          statusHistory: (confirmed.statusHistory || []).map((h) => ({
            status: h.toStatus,
            timestamp: h.createdAt,
            note: h.note,
          })),
          totalPesewas: confirmed.totalPesewas,
          itemsSummary: confirmed.items.map((i) => ({
            name: i.itemNameSnapshot,
            quantity: i.quantity,
          })),
          lastSynchronizedAt: new Date().toISOString(),
        };

        await updateCachedOrder(customerId, summary);

        if (resolvedMethod === "PAYSTACK") {
          if (!authorizationUrl) {
            setIsSubmitting(false);
            const missingUrlMsg =
              "Paystack checkout session could not be opened. Your tray is intact — please try again or select Cash.";
            setErrorMessage(missingUrlMsg);
            toastError("Paystack Unavailable", missingUrlMsg);
            return;
          }

          clearCart();
          const launchOutcome = await openInAppPaystackCheckout(
            authorizationUrl,
            mobileReturnUrl
          );

          if (launchOutcome === "failed") {
            setIsSubmitting(false);
            setPaystackFallbackModal({
              orderNumber: confirmed.orderNumber,
              authorizationUrl,
            });
            return;
          }

          const verifyRes = await apiRequest<{
            success: boolean;
            verified?: boolean;
            paymentStatus?: "PENDING" | "PAID" | "FAILED" | "REFUNDED";
          }>(`/orders/${encodeURIComponent(confirmed.orderNumber)}/pay`, {
            method: "POST",
            timeoutMs: 30000,
            body: JSON.stringify({ verifyOnly: true, clientPlatform: "mobile" }),
          });

          const isPaid = Boolean(verifyRes.success && verifyRes.data?.verified);
          if (isPaid) {
            await updateCachedOrder(customerId, {
              ...summary,
              paymentStatus: "PAID",
              lastSynchronizedAt: new Date().toISOString(),
            });
            toastSuccess(
              "Payment Confirmed",
              `Order #${confirmed.orderNumber} sent to Sika Cuisine kitchen.`
            );
          } else {
            toastInfo(
              "Payment Pending",
              `Tap Complete Payment or Verify on order #${confirmed.orderNumber}.`
            );
          }

          setIsSubmitting(false);
          onOrderPlaced(confirmed.orderNumber);
          return;
        }

        // Cash checkout: preserve cart snapshot until modal closes so subtotal doesn't flash GH₵0.00 behind modal
        setIsSubmitting(false);
        toastSuccess(
          "Order Sent to Front Desk",
          `#${confirmed.orderNumber} is awaiting cashier confirmation.`
        );
        setSubmittedCashModal({
          orderNumber: confirmed.orderNumber,
          totalPesewas: confirmed.totalPesewas,
          fulfilmentType: confirmed.fulfilmentType,
          paymentMethod: confirmed.paymentMethod,
        });
      } else if (response.isOffline) {
        setIsSubmitting(false);
        const offlineMsg =
          "Connect to Wi-Fi or mobile data and tap Place Order again — your tray items are safely preserved.";
        setErrorMessage(offlineMsg);
        setOfflineModalMessage(offlineMsg);
      } else {
        setIsSubmitting(false);
        const soldOutIds = (
          response.data as { unavailableItemIds?: string[] } | undefined
        )?.unavailableItemIds;
        if (Array.isArray(soldOutIds) && soldOutIds.length > 0) {
          markItemsUnavailable(soldOutIds, "SOLD_OUT");
        }
        setErrorMessage(response.error || "Unable to submit order. Check details and retry.");
      }
    } catch (err) {
      setIsSubmitting(false);
      setErrorMessage(
        err instanceof Error
          ? err.message
          : "Unexpected error placing your order. Please retry."
      );
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.root}
    >
      {/* Sub-header */}
      <View style={styles.header}>
        <Pressable
          onPress={onBackToCart}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="Back to cart"
          style={styles.backBtn}
        >
          <ArrowLeft size={16} color={SikaColors.warmWhite} />
          <Text style={styles.backText}>Tray</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Checkout</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {!restaurantConfig.isAcceptingOrders ? (
          <View style={styles.errorBanner}>
            <AlertCircle size={17} color={SikaColors.warning} />
            <Text style={styles.errorText}>
              Kitchen ordering is temporarily paused. Please check back during operating hours.
            </Text>
          </View>
        ) : null}

        {unavailableCount > 0 ? (
          <View style={styles.soldOutBanner}>
            <View style={styles.soldOutTop}>
              <AlertCircle size={17} color={SikaColors.error} />
              <Text style={styles.errorText}>
                {unavailableCount === 1
                  ? "1 dish in your tray just sold out."
                  : `${unavailableCount} dishes in your tray are no longer available.`}{" "}
                Remove it to continue without losing your details.
              </Text>
            </View>
            <Pressable
              onPress={() => {
                removeUnavailableItems();
                setErrorMessage(null);
                toastInfo("Tray Updated", "Sold-out dishes removed. Your checkout details are preserved.");
              }}
              style={({ pressed }) => [
                styles.removeSoldOutBtn,
                pressed && { opacity: 0.8 },
              ]}
            >
              <Trash2 size={13} color="#FDA4AF" />
              <Text style={styles.removeSoldOutText}>Remove Sold-Out &amp; Continue</Text>
            </Pressable>
          </View>
        ) : null}

        {errorMessage ? (
          <View style={styles.errorBanner}>
            <AlertCircle size={17} color={SikaColors.error} />
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        ) : null}

        {/* 1. Fulfilment Selector */}
        <Text style={styles.sectionTitle}>1. Fulfilment Method</Text>
        <View style={styles.toggleGrid}>
          <Pressable
            disabled={!restaurantConfig.isDeliveryEnabled}
            onPress={() =>
              restaurantConfig.isDeliveryEnabled && handleFulfilmentChange("DELIVERY")
            }
            style={[
              styles.optionCard,
              fulfilmentType === "DELIVERY" && styles.optionCardActive,
              !restaurantConfig.isDeliveryEnabled && { opacity: 0.45 },
            ]}
          >
            <Bike
              size={20}
              color={
                fulfilmentType === "DELIVERY"
                  ? SikaColors.accentLight
                  : SikaColors.secondaryText
              }
            />
            <Text style={styles.optionTitle}>Delivery</Text>
            <Text style={styles.optionSub}>
              {restaurantConfig.isDeliveryEnabled ? "Sunyani zones" : "Temporarily paused"}
            </Text>
          </Pressable>

          <Pressable
            disabled={!restaurantConfig.isCollectionEnabled}
            onPress={() =>
              restaurantConfig.isCollectionEnabled && handleFulfilmentChange("COLLECTION")
            }
            style={[
              styles.optionCard,
              fulfilmentType === "COLLECTION" && styles.optionCardActive,
              !restaurantConfig.isCollectionEnabled && { opacity: 0.45 },
            ]}
          >
            <Store
              size={20}
              color={
                fulfilmentType === "COLLECTION"
                  ? SikaColors.success
                  : SikaColors.secondaryText
              }
            />
            <Text style={styles.optionTitle}>Pickup</Text>
            <Text style={[styles.optionSub, { color: SikaColors.success }]}>
              {restaurantConfig.isCollectionEnabled ? "GHS 0.00 fee" : "Temporarily paused"}
            </Text>
          </Pressable>
        </View>

        {/* 2. Contact Information */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>2. Contact Information</Text>
          {signedInUser ? (
            <View style={styles.prefillBadge}>
              <CheckCircle2 size={12} color={SikaColors.success} />
              <Text style={styles.prefillBadgeText} numberOfLines={1}>
                Signed in as {formatFirstName(signedInUser.fullName)} · Pre-filled
              </Text>
            </View>
          ) : null}
        </View>
        <View style={styles.formCard}>
          <Text style={styles.inputLabel}>Full Name *</Text>
          <TextInput
            value={fullName}
            onChangeText={setFullName}
            placeholder="Kwame Mensah"
            placeholderTextColor={SikaColors.muted}
            style={styles.input}
          />

          <Text style={styles.inputLabel}>Ghana Phone Number *</Text>
          <TextInput
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            placeholder="0244123456"
            placeholderTextColor={SikaColors.muted}
            style={styles.input}
          />

          <Text style={styles.inputLabel}>Email Address *</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            placeholder="kwame@example.com"
            placeholderTextColor={SikaColors.muted}
            style={styles.input}
          />
        </View>

        {/* 3. Destination Zone or Counter Info */}
        {fulfilmentType === "DELIVERY" ? (
          <>
            <Text style={styles.sectionTitle}>3. Sunyani Delivery Zone &amp; Address</Text>
            <View style={styles.formCard}>
              <Text style={styles.inputLabel}>Select Zone *</Text>
              <View style={styles.zoneList}>
                {deliveryZones.map((zone) => {
                  const zoneActive = zone.id === selectedZone?.id;
                  return (
                    <Pressable
                      key={zone.id}
                      onPress={() => setSelectedZoneId(zone.id)}
                      style={[styles.zoneRow, zoneActive && styles.zoneRowActive]}
                    >
                      <View style={styles.zoneTextCol}>
                        <Text style={styles.zoneName}>{zone.name}</Text>
                        <Text style={styles.zoneDesc} numberOfLines={2}>
                          {zone.description} ({zone.estimatedMinutes}m est.)
                        </Text>
                      </View>
                      <Text style={styles.zoneFee}>
                        {formatPesewasToGhs(zone.feePesewas)}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <Text style={styles.inputLabel}>Street / House / Hostel *</Text>
              <TextInput
                value={streetAddress}
                onChangeText={setStreetAddress}
                placeholder="House No. 42, UENR Main Road"
                placeholderTextColor={SikaColors.muted}
                style={styles.input}
              />

              <Text style={styles.inputLabel}>Nearby Landmark (Optional)</Text>
              <TextInput
                value={landmark}
                onChangeText={setLandmark}
                placeholder="Opposite Goil Fuel Station"
                placeholderTextColor={SikaColors.muted}
                style={styles.input}
              />
            </View>
          </>
        ) : (
          <View style={styles.pickupCard}>
            <MapPin size={20} color={SikaColors.success} />
            <View style={styles.pickupCopy}>
              <Text style={styles.pickupTitle}>Counter Collection — Sunyani Central</Text>
              <Text style={styles.pickupDesc}>
                Collect hot at {restaurantConfig.address}. Delivery tariff is zero.
              </Text>
            </View>
          </View>
        )}

        {/* 4. Payment Method */}
        <Text style={styles.sectionTitle}>4. Payment &amp; Instructions</Text>
        <View style={styles.toggleGrid}>
          <Pressable
            onPress={() => setPaymentMethod("PAYSTACK")}
            style={[
              styles.optionCard,
              paymentMethod === "PAYSTACK" && styles.optionCardActive,
            ]}
          >
            <CreditCard
              size={20}
              color={
                paymentMethod === "PAYSTACK"
                  ? SikaColors.accentLight
                  : SikaColors.secondaryText
              }
            />
            <Text style={styles.optionTitle}>Paystack</Text>
            <Text style={styles.optionSub}>MoMo &amp; Cards</Text>
          </Pressable>

          <Pressable
            onPress={() => setPaymentMethod(cashVariant)}
            style={[
              styles.optionCard,
              paymentMethod !== "PAYSTACK" && styles.optionCardActive,
            ]}
          >
            <Banknote
              size={20}
              color={
                paymentMethod !== "PAYSTACK"
                  ? SikaColors.success
                  : SikaColors.secondaryText
              }
            />
            <Text style={styles.optionTitle}>
              {fulfilmentType === "DELIVERY" ? "Cash Delivery" : "Cash Pickup"}
            </Text>
            <Text style={styles.optionSub}>Pay at handover</Text>
          </Pressable>
        </View>

        <View style={styles.formCard}>
          <Text style={styles.inputLabel}>Delivery / Kitchen Notes (Optional)</Text>
          <TextInput
            value={deliveryNotes}
            onChangeText={setDeliveryNotes}
            multiline
            numberOfLines={2}
            placeholder="Call on arrival at main gate..."
            placeholderTextColor={SikaColors.muted}
            style={[styles.input, styles.notesArea]}
          />
        </View>

        {/* Financial Breakdown */}
        <View style={styles.totalsCard}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Food Subtotal</Text>
            <Text style={styles.totalVal}>{formatPesewasToGhs(cartSubtotalPesewas)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>
              {fulfilmentType === "DELIVERY" ? "Delivery Tariff" : "Counter Pickup"}
            </Text>
            <Text style={styles.totalVal}>{formatPesewasToGhs(deliveryFeePesewas)}</Text>
          </View>
          <View style={styles.grandRow}>
            <Text style={styles.grandLabel}>Total Due</Text>
            <Text style={styles.grandVal}>{formatPesewasToGhs(grandTotalPesewas)}</Text>
          </View>
        </View>

        <Button
          title={
            unavailableCount > 0
              ? "Remove Sold-Out Items to Continue"
              : !restaurantConfig.isAcceptingOrders
              ? "Kitchen Currently Paused"
              : paymentMethod === "PAYSTACK"
              ? `Pay with Paystack (${formatPesewasToGhs(grandTotalPesewas)})`
              : `Place Order (${formatPesewasToGhs(grandTotalPesewas)})`
          }
          variant="primary"
          size="lg"
          fullWidth
          disabled={
            unavailableCount > 0 ||
            !restaurantConfig.isAcceptingOrders ||
            (fulfilmentType === "DELIVERY" && !restaurantConfig.isDeliveryEnabled) ||
            (fulfilmentType === "COLLECTION" && !restaurantConfig.isCollectionEnabled)
          }
          loading={isSubmitting}
          leadingIcon={<CheckCircle2 size={17} color={SikaColors.text} />}
          onPress={handlePlaceOrder}
        />
      </ScrollView>

      {/* Branded Dark Order Submitted Modal (Cash on Delivery / Pickup) */}
      <SikaModal
        visible={Boolean(submittedCashModal)}
        tone="warning"
        icon={<Clock size={24} color={SikaColors.warning} />}
        badgeLabel="Awaiting Cashier Confirmation"
        badgeVariant="warning"
        title="Order Submitted"
        message="Your order has been sent to our front desk in Sunyani. We will notify you as soon as our cashier confirms it."
        metaRows={
          submittedCashModal
            ? [
                {
                  label: "Order Reference",
                  value: `#${submittedCashModal.orderNumber}`,
                },
                {
                  label: "Payment Method",
                  value:
                    submittedCashModal.paymentMethod === "CASH_ON_DELIVERY"
                      ? "Cash on Delivery"
                      : "Cash at Counter Pickup",
                },
                {
                  label: "Total Due at Handover",
                  value: formatPesewasToGhs(submittedCashModal.totalPesewas),
                  accent: true,
                },
              ]
            : undefined
        }
        primaryLabel="Track Live Order"
        onPrimaryPress={() => {
          const targetOrder = submittedCashModal?.orderNumber;
          setSubmittedCashModal(null);
          clearCart();
          if (targetOrder) {
            onOrderPlaced(targetOrder);
          }
        }}
      />

      {/* Branded Dark Offline Alert */}
      <SikaModal
        visible={Boolean(offlineModalMessage)}
        tone="warning"
        icon={<WifiOff size={24} color={SikaColors.warning} />}
        badgeLabel="Connection Needed"
        badgeVariant="warning"
        title="Internet Connection Required"
        message={
          offlineModalMessage ||
          "Please reconnect to Wi-Fi or mobile data before placing your order."
        }
        primaryLabel="Got It"
        onPrimaryPress={() => setOfflineModalMessage(null)}
      />

      {/* Paystack Browser Launch Fallback Modal */}
      <SikaModal
        visible={Boolean(paystackFallbackModal)}
        tone="brand"
        icon={<CreditCard size={24} color={SikaColors.accentLight} />}
        badgeLabel="Paystack Checkout"
        badgeVariant="brand"
        title="Open Paystack Payment"
        message="Tap below to open Paystack securely in your browser and complete payment for your order."
        metaRows={
          paystackFallbackModal
            ? [
                {
                  label: "Order Reference",
                  value: `#${paystackFallbackModal.orderNumber}`,
                },
              ]
            : undefined
        }
        primaryLabel="Open Paystack Now"
        onPrimaryPress={() => {
          const url = paystackFallbackModal?.authorizationUrl;
          const orderNum = paystackFallbackModal?.orderNumber;
          setPaystackFallbackModal(null);
          if (url) {
            void Linking.openURL(url).catch(() => {});
          }
          if (orderNum) {
            onOrderPlaced(orderNum);
          }
        }}
        secondaryLabel="Go to Order Tracker"
        onSecondaryPress={() => {
          const orderNum = paystackFallbackModal?.orderNumber;
          setPaystackFallbackModal(null);
          if (orderNum) {
            onOrderPlaced(orderNum);
          }
        }}
      />
    </KeyboardAvoidingView>
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
  headerTitle: {
    color: SikaColors.text,
    fontSize: 17,
    fontWeight: "800",
  },
  headerSpacer: {
    width: 64,
  },
  scrollContent: {
    padding: SikaSpace.lg,
    paddingBottom: 115,
    gap: SikaSpace.md,
  },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: SikaSpace.sm,
    borderRadius: SikaRadius.md,
    borderWidth: 1,
    borderColor: SikaColors.errorBorder,
    backgroundColor: SikaColors.errorBg,
    padding: SikaSpace.md,
  },
  errorText: {
    flex: 1,
    color: "#FDA4AF",
    fontSize: 13,
    lineHeight: 18,
  },
  soldOutBanner: {
    borderRadius: SikaRadius.md,
    borderWidth: 1,
    borderColor: SikaColors.errorBorder,
    backgroundColor: SikaColors.errorBg,
    padding: SikaSpace.md,
    gap: 10,
  },
  soldOutTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: SikaSpace.sm,
  },
  removeSoldOutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderRadius: SikaRadius.md,
    borderWidth: 1,
    borderColor: SikaColors.errorBorder,
    backgroundColor: "rgba(251, 113, 133, 0.14)",
    paddingVertical: 8,
  },
  removeSoldOutText: {
    color: "#FDA4AF",
    fontSize: 12,
    fontWeight: "800",
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 8,
    marginTop: SikaSpace.xs,
  },
  sectionTitle: {
    color: SikaColors.warmWhite,
    fontSize: 15,
    fontWeight: "800",
    marginTop: SikaSpace.xs,
  },
  prefillBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderRadius: SikaRadius.pill,
    borderWidth: 1,
    borderColor: SikaColors.successBorder,
    backgroundColor: SikaColors.successBg,
    paddingHorizontal: 10,
    paddingVertical: 4,
    maxWidth: 220,
  },
  prefillBadgeText: {
    color: SikaColors.success,
    fontSize: 11,
    fontWeight: "700",
    flexShrink: 1,
  },
  toggleGrid: {
    flexDirection: "row",
    gap: SikaSpace.md,
  },
  optionCard: {
    flex: 1,
    borderRadius: SikaRadius.lg,
    borderWidth: 1,
    borderColor: SikaColors.border,
    backgroundColor: SikaColors.surface,
    padding: SikaSpace.lg,
    gap: 4,
  },
  optionCardActive: {
    borderColor: SikaColors.accent,
    backgroundColor: SikaColors.accentWash12,
  },
  optionTitle: {
    color: SikaColors.text,
    fontSize: 14,
    fontWeight: "800",
    marginTop: 4,
  },
  optionSub: {
    color: SikaColors.secondaryText,
    fontSize: 12,
  },
  formCard: {
    borderRadius: SikaRadius.xl,
    borderWidth: 1,
    borderColor: SikaColors.border,
    backgroundColor: SikaColors.surface,
    padding: SikaSpace.lg,
  },
  inputLabel: {
    color: SikaColors.secondaryText,
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.7,
    marginBottom: 6,
    marginTop: SikaSpace.sm,
  },
  input: {
    borderRadius: SikaRadius.md,
    borderWidth: 1,
    borderColor: SikaColors.border,
    backgroundColor: SikaColors.elevated,
    color: SikaColors.warmWhite,
    paddingHorizontal: SikaSpace.md,
    paddingVertical: 11,
    fontSize: 14,
  },
  notesArea: {
    minHeight: 68,
    textAlignVertical: "top",
  },
  zoneList: {
    gap: SikaSpace.sm,
    marginBottom: SikaSpace.sm,
  },
  zoneRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: SikaRadius.md,
    borderWidth: 1,
    borderColor: SikaColors.border,
    backgroundColor: SikaColors.elevated,
    padding: SikaSpace.md,
  },
  zoneRowActive: {
    borderColor: SikaColors.accent,
    backgroundColor: SikaColors.accentWash12,
  },
  zoneTextCol: {
    flex: 1,
    paddingRight: SikaSpace.md,
  },
  zoneName: {
    color: SikaColors.warmWhite,
    fontSize: 13,
    fontWeight: "700",
  },
  zoneDesc: {
    color: SikaColors.secondaryText,
    fontSize: 11,
    marginTop: 2,
  },
  zoneFee: {
    color: SikaColors.accentLight,
    fontSize: 13,
    fontWeight: "800",
    fontVariant: ["tabular-nums"],
  },
  pickupCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: SikaSpace.md,
    borderRadius: SikaRadius.lg,
    borderWidth: 1,
    borderColor: SikaColors.successBorder,
    backgroundColor: SikaColors.successBg,
    padding: SikaSpace.lg,
  },
  pickupCopy: {
    flex: 1,
  },
  pickupTitle: {
    color: SikaColors.warmWhite,
    fontSize: 14,
    fontWeight: "800",
  },
  pickupDesc: {
    color: SikaColors.secondaryText,
    fontSize: 12,
    marginTop: 3,
    lineHeight: 17,
  },
  totalsCard: {
    borderRadius: SikaRadius.xl,
    borderWidth: 1,
    borderColor: SikaColors.border,
    backgroundColor: SikaColors.surface,
    padding: SikaSpace.lg,
    gap: SikaSpace.sm,
    marginTop: SikaSpace.xs,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  totalLabel: {
    color: SikaColors.secondaryText,
    fontSize: 13,
  },
  totalVal: {
    color: SikaColors.warmWhite,
    fontSize: 13,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },
  grandRow: {
    marginTop: SikaSpace.sm,
    paddingTop: SikaSpace.md,
    borderTopWidth: 1,
    borderTopColor: SikaColors.border,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  grandLabel: {
    color: SikaColors.text,
    fontSize: 16,
    fontWeight: "800",
  },
  grandVal: {
    color: SikaColors.accentLight,
    fontSize: 20,
    fontWeight: "900",
    fontVariant: ["tabular-nums"],
  },
});
