import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
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
  CreditCard,
  MapPin,
  Store,
} from "lucide-react-native";
import {
  FulfilmentType,
  OrderDTO,
  PaymentMethod,
  RESTAURANT_INFO,
  SUNYANI_DELIVERY_ZONES,
  calculateDeliveryFeePesewas,
  formatPesewasToGhs,
  phoneRegex,
} from "@sika/shared";
import { Button } from "../components/ui/Button";
import { useCart } from "../context/CartContext";
import { useToast } from "../context/ToastContext";
import { apiRequest } from "../services/api-client";
import { CachedOrderSummary, updateCachedOrder } from "../services/offline-order-cache";
import { getCurrentUser } from "../services/storage";
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
  const { items, cartSubtotalPesewas, clearCart } = useCart();
  const { error: toastError, success: toastSuccess } = useToast();

  const [fulfilmentType, setFulfilmentType] = useState<FulfilmentType>("DELIVERY");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("PAYSTACK");

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  const [streetAddress, setStreetAddress] = useState("");
  const [selectedZoneLocality, setSelectedZoneLocality] = useState(
    SUNYANI_DELIVERY_ZONES[0].localities[0]
  );
  const [landmark, setLandmark] = useState("");
  const [deliveryNotes, setDeliveryNotes] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Prefill contact information when a customer session already exists in SecureStore
  useEffect(() => {
    let active = true;
    getCurrentUser().then((user) => {
      if (!active || !user) return;
      setFullName((prev) => prev || user.fullName || "");
      setPhone((prev) => prev || user.phone || "");
      setEmail((prev) => prev || user.email || "");
    });
    return () => {
      active = false;
    };
  }, []);

  const deliveryFeePesewas = useMemo(
    () =>
      calculateDeliveryFeePesewas(
        fulfilmentType,
        fulfilmentType === "DELIVERY" ? selectedZoneLocality : null
      ),
    [fulfilmentType, selectedZoneLocality]
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
    const validationErr = validateForm();
    if (validationErr) {
      setErrorMessage(validationErr);
      return;
    }

    if (items.length === 0) {
      toastError("Tray Empty", "Please select dishes from the menu first.");
      return;
    }

    setErrorMessage(null);
    setIsSubmitting(true);

    const compactPhone = phone.replace(/\s+/g, "").trim();
    const resolvedMethod: PaymentMethod =
      paymentMethod === "PAYSTACK" ? "PAYSTACK" : cashVariant;

    const payload = {
      fulfilmentType,
      paymentMethod: resolvedMethod,
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
              areaLocality: selectedZoneLocality,
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
      const response = await apiRequest<{ success: boolean; order: OrderDTO }>(
        "/orders",
        {
          method: "POST",
          body: JSON.stringify(payload),
        }
      );

      const user = await getCurrentUser();
      const customerId = user?.id || "guest";

      if (response.success && response.data?.order) {
        const confirmed = response.data.order;
        const summary: CachedOrderSummary = {
          orderId: confirmed.id,
          orderNumber: confirmed.orderNumber,
          fulfilmentType: confirmed.fulfilmentType,
          lastKnownStatus: confirmed.fulfilmentStatus,
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
        clearCart();
        setIsSubmitting(false);
        toastSuccess("Order Submitted", `Reference #${confirmed.orderNumber}`);

        Alert.alert(
          "Order Confirmed",
          `Your order #${confirmed.orderNumber} has been sent to Sika Cuisine Sunyani.`,
          [{ text: "Track Order", onPress: () => onOrderPlaced(confirmed.orderNumber) }]
        );
      } else if (response.isOffline) {
        const fallbackOrderNumber = `SIKA-${new Date().getFullYear()}-${Math.floor(
          1000 + Math.random() * 9000
        )}`;
        const localOrder: CachedOrderSummary = {
          orderId: `local-${Date.now()}`,
          orderNumber: fallbackOrderNumber,
          fulfilmentType,
          lastKnownStatus: "PENDING",
          totalPesewas: grandTotalPesewas,
          itemsSummary: items.map((item) => ({
            name: item.menuItem.name,
            quantity: item.quantity,
          })),
          lastSynchronizedAt: new Date().toISOString(),
          statusHistory: [
            {
              status: "PENDING",
              timestamp: new Date().toISOString(),
              note: "Recorded in offline device queue awaiting server sync.",
            },
          ],
        };

        await updateCachedOrder(customerId, localOrder);
        clearCart();
        setIsSubmitting(false);

        Alert.alert(
          "Saved to Offline Queue",
          `Order #${fallbackOrderNumber} is cached locally while offline. View tracking details below.`,
          [{ text: "View Order", onPress: () => onOrderPlaced(fallbackOrderNumber) }]
        );
      } else {
        setIsSubmitting(false);
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
            onPress={() => handleFulfilmentChange("DELIVERY")}
            style={[
              styles.optionCard,
              fulfilmentType === "DELIVERY" && styles.optionCardActive,
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
            <Text style={styles.optionSub}>Sunyani zones</Text>
          </Pressable>

          <Pressable
            onPress={() => handleFulfilmentChange("COLLECTION")}
            style={[
              styles.optionCard,
              fulfilmentType === "COLLECTION" && styles.optionCardActive,
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
              GHS 0.00 fee
            </Text>
          </Pressable>
        </View>

        {/* 2. Contact Information */}
        <Text style={styles.sectionTitle}>2. Contact Information</Text>
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
                {SUNYANI_DELIVERY_ZONES.map((zone) => {
                  const zoneActive = zone.localities.includes(selectedZoneLocality);
                  return (
                    <Pressable
                      key={zone.id}
                      onPress={() => setSelectedZoneLocality(zone.localities[0])}
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
                Collect hot at {RESTAURANT_INFO.address}. Delivery tariff is zero.
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
          title={`Confirm Order (${formatPesewasToGhs(grandTotalPesewas)})`}
          variant="primary"
          size="lg"
          fullWidth
          loading={isSubmitting}
          leadingIcon={<CheckCircle2 size={17} color={SikaColors.text} />}
          onPress={handlePlaceOrder}
        />
      </ScrollView>
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
    paddingBottom: 36,
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
  sectionTitle: {
    color: SikaColors.warmWhite,
    fontSize: 15,
    fontWeight: "800",
    marginTop: SikaSpace.xs,
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
