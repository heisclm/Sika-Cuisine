"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  Banknote,
  Bike,
  CheckCircle2,
  CreditCard,
  MapPin,
  Phone,
  ShieldCheck,
  Store,
  Trash2,
  User,
} from "lucide-react";
import { formatFirstName } from "@sika/shared";
import { useCart } from "@/context/CartContext";
import { usePublicConfig } from "@/context/PublicConfigContext";
import { useToast } from "@/context/ToastContext";
import { formatPesewasToGhs } from "@/lib/currency";
import { RESTAURANT_INFO } from "@/lib/navigation";
import { formatGhanaPhone, isValidGhanaPhone } from "@/lib/phone";
import { FulfilmentType, PaymentMethod } from "@/types/order";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageReveal } from "@/components/ui/MotionPrimitives";
import { Select } from "@/components/ui/Select";

/**
 * Checkout flow supporting Delivery (Sunyani zone tariffs) and Restaurant Pickup.
 * Auto-synchronizes Cash payment methods (`CASH_ON_DELIVERY` <-> `CASH_ON_COLLECTION`)
 * whenever fulfilment type changes so client payloads strictly match Zod schema invariants.
 */
export default function CheckoutPage() {
  const router = useRouter();
  const {
    items,
    subtotalPesewas,
    clearCart,
    selectedFulfilmentType: fulfilmentType,
    setSelectedFulfilmentType: setFulfilmentType,
    selectedZoneId,
    setSelectedZoneId,
    unavailableMenuItemIds,
    unavailableCount,
    refreshCartAvailability,
    markItemsUnavailable,
    removeUnavailableItems,
  } = useCart();
  const { deliveryZones, restaurant } = usePublicConfig();
  const { error: toastError, success: toastSuccess } = useToast();

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("PAYSTACK");

  // Customer identity fields (prefilled from active session when available)
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [signedInUser, setSignedInUser] = useState<{ fullName: string; email: string } | null>(
    null
  );

  // Delivery destination fields
  const [streetAddress, setStreetAddress] = useState("");
  const [landmark, setLandmark] = useState("");
  const [customerNotes, setCustomerNotes] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const idempotencyKeyRef = useRef<string | null>(null);

  useEffect(() => {
    idempotencyKeyRef.current = null;
  }, [items, fulfilmentType, paymentMethod, selectedZoneId]);

  // Verify live dish stock & prices when entering checkout
  useEffect(() => {
    if (items.length > 0) {
      void refreshCartAvailability();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Prefill contact information when a customer is already signed in
  useEffect(() => {
    let active = true;
    fetch("/api/v1/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!active || !data?.success || !data.user) return;
        setSignedInUser({
          fullName: data.user.fullName || "Customer",
          email: data.user.email || "",
        });
        setFullName((prev) => prev || data.user.fullName || "");
        setEmail((prev) => prev || data.user.email || "");
        setPhone((prev) =>
          prev || (data.user.phone ? formatGhanaPhone(data.user.phone) : "")
        );
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (deliveryZones.length > 0 && !deliveryZones.some((z) => z.id === selectedZoneId)) {
      setSelectedZoneId(deliveryZones[0].id);
    }
  }, [deliveryZones, selectedZoneId]);

  const selectedZone = useMemo(
    () =>
      deliveryZones.find((z) => z.id === selectedZoneId) ??
      deliveryZones[0],
    [deliveryZones, selectedZoneId]
  );

  const deliveryFeePesewas = useMemo(
    () => (fulfilmentType === "DELIVERY" ? selectedZone?.feePesewas ?? 0 : 0),
    [fulfilmentType, selectedZone]
  );

  const totalPesewas = subtotalPesewas + deliveryFeePesewas;

  const handleFulfilmentChange = (nextType: FulfilmentType) => {
    setFulfilmentType(nextType);
    // Keep cash payment variant aligned with the chosen fulfilment mode
    if (nextType === "COLLECTION" && paymentMethod === "CASH_ON_DELIVERY") {
      setPaymentMethod("CASH_ON_COLLECTION");
    } else if (nextType === "DELIVERY" && paymentMethod === "CASH_ON_COLLECTION") {
      setPaymentMethod("CASH_ON_DELIVERY");
    }
  };

  useEffect(() => {
    if (
      fulfilmentType === "DELIVERY" &&
      !restaurant.isDeliveryEnabled &&
      restaurant.isCollectionEnabled
    ) {
      handleFulfilmentChange("COLLECTION");
    } else if (
      fulfilmentType === "COLLECTION" &&
      !restaurant.isCollectionEnabled &&
      restaurant.isDeliveryEnabled
    ) {
      handleFulfilmentChange("DELIVERY");
    }
  }, [fulfilmentType, restaurant.isDeliveryEnabled, restaurant.isCollectionEnabled]); // eslint-disable-line react-hooks/exhaustive-deps

  const cashMethodValue: PaymentMethod =
    fulfilmentType === "DELIVERY" ? "CASH_ON_DELIVERY" : "CASH_ON_COLLECTION";

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!restaurant.isAcceptingOrders) {
      setFormError(
        restaurant.kitchenStatusReason ||
          "Sika Cuisine kitchen is currently closed for new online orders. Please check back during operating hours."
      );
      return;
    }

    if (fulfilmentType === "DELIVERY" && !restaurant.isDeliveryEnabled) {
      setFormError("Delivery is currently paused. Switch to Restaurant Pickup to continue.");
      return;
    }

    if (fulfilmentType === "COLLECTION" && !restaurant.isCollectionEnabled) {
      setFormError("Counter Pickup is currently paused. Switch to Sunyani Delivery to continue.");
      return;
    }

    if (items.length === 0) {
      setFormError("Your cart is empty.");
      return;
    }

    if (unavailableCount > 0) {
      setFormError(
        "Please remove sold-out dishes from your order summary before placing your order."
      );
      return;
    }

    const compactPhone = phone.replace(/\s+/g, "");
    if (fullName.trim().length < 2) {
      setFormError("Please enter your full name (at least 2 characters).");
      return;
    }
    if (!isValidGhanaPhone(compactPhone)) {
      setFormError("Please enter a valid 10-digit Ghanaian mobile number (e.g. 0244123456).");
      return;
    }
    if (!email.trim() || !email.includes("@")) {
      setFormError("Please enter a valid email address for receipt and order confirmation.");
      return;
    }

    if (fulfilmentType === "DELIVERY" && streetAddress.trim().length < 3) {
      setFormError("Please provide your Sunyani street address, hostel, or house number.");
      return;
    }

    setSubmitting(true);
    try {
      const normalizedMethod: PaymentMethod =
        paymentMethod === "PAYSTACK" ? "PAYSTACK" : cashMethodValue;

      if (!idempotencyKeyRef.current) {
        idempotencyKeyRef.current =
          typeof crypto !== "undefined" && "randomUUID" in crypto
            ? crypto.randomUUID()
            : `sika-web-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
      }

      const response = await fetch("/api/v1/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": idempotencyKeyRef.current,
        },
        body: JSON.stringify({
          fulfilmentType,
          paymentMethod: normalizedMethod,
          clientPlatform: "web",
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
                  areaLocality: selectedZone?.name || "Sunyani Central",
                  landmark: landmark.trim() || undefined,
                  city: "Sunyani",
                  deliveryNotes: customerNotes.trim() || undefined,
                }
              : undefined,
          items: items.map((item) => ({
            menuItemId: item.menuItemId,
            quantity: item.quantity,
            selectedOptionIds: item.selectedOptions.map((o) => o.optionId),
            specialInstructions: item.specialInstructions || undefined,
          })),
          customerNotes: customerNotes.trim() || undefined,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        if (
          Array.isArray(result.unavailableItemIds) &&
          result.unavailableItemIds.length > 0
        ) {
          markItemsUnavailable(result.unavailableItemIds, "SOLD_OUT");
        }
        const message = result.error || "Unable to complete checkout right now.";
        setFormError(message);
        toastError("Checkout Failed", message);
        setSubmitting(false);
        return;
      }

      if (normalizedMethod === "PAYSTACK" && !result.authorizationUrl) {
        const msg =
          "Paystack checkout session could not be initialized. Please retry or choose Cash.";
        setFormError(msg);
        toastError("Paystack Unavailable", msg);
        setSubmitting(false);
        return;
      }

      idempotencyKeyRef.current = null;
      clearCart();

      if (result.authorizationUrl) {
        toastSuccess(
          "Opening Paystack",
          "Complete online payment to send your order to our Cashier & Kitchen."
        );
        window.location.href = result.authorizationUrl;
        return;
      }

      const nextUrl =
        result.redirectUrl || (result.orderNumber ? `/orders/${result.orderNumber}` : "/orders");
      toastSuccess(
        "Order Submitted",
        result.orderNumber
          ? `Order #${result.orderNumber} sent to front desk — awaiting cashier confirmation.`
          : "Sent to front desk — awaiting cashier confirmation."
      );
      router.push(nextUrl);
    } catch {
      const msg = "Unexpected network error placing your order. Please retry.";
      setFormError(msg);
      toastError("Order Error", msg);
      setSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-[calc(100vh-80px)] bg-[#101010] px-4 py-16 flex items-center justify-center">
        <div className="w-full max-w-lg">
          <EmptyState
            title="Your Checkout Tray is Empty"
            description="Select freshly prepared Ghanaian dishes, grills, swallows, or pizza from the Sika Cuisine Sunyani menu first."
            action={
              <Link
                href="/menu"
                className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#D71920] hover:bg-[#A91017] px-6 text-sm font-semibold text-white transition-colors"
              >
                <span>Explore Full Menu</span>
              </Link>
            }
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#101010] py-10 sm:py-12 pb-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8">
        <PageReveal className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#333333] pb-6">
          <div>
            <Link
              href="/menu"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#A3A3A3] hover:text-white transition-colors mb-3"
            >
              <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Add more dishes</span>
            </Link>
            <h1 className="font-serif text-3xl sm:text-4xl font-black tracking-tight text-white">
              Checkout &amp; Fulfilment
            </h1>
            <p className="mt-1 text-sm text-[#A3A3A3]">
              Confirm delivery or counter pickup in Sunyani and select how you want to pay.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-[#333333] bg-[#1C1C1C] px-3.5 py-1.5 text-xs text-[#F5F1EA]">
            <ShieldCheck className="h-4 w-4 text-[#4ADE80]" aria-hidden="true" />
            <span>Server-verified pricing in GHS</span>
          </div>
        </PageReveal>

        <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Checkout Column */}
          <div className="lg:col-span-7 space-y-6">
            {!restaurant.isAcceptingOrders && (
              <div
                role="status"
                className="rounded-2xl border border-[#F59E0B]/45 bg-[#F59E0B]/10 px-4 py-3.5 text-sm text-[#FDE68A]"
              >
                {restaurant.kitchenStatusReason ||
                  `Kitchen ordering is currently closed. Check back during service hours (${restaurant.weekdayHours}).`}
              </div>
            )}

            {formError && (
              <div
                role="alert"
                className="rounded-2xl border border-[#FB7185]/40 bg-[#FB7185]/10 px-4 py-3.5 text-sm text-[#FDA4AF]"
              >
                {formError}
              </div>
            )}

            {/* 1. Fulfilment Selector */}
            <section className="rounded-3xl border border-[#333333] bg-[#1C1C1C] p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-serif text-lg font-bold text-[#F5F1EA]">
                  1. Fulfilment Method
                </h2>
                <span className="font-mono text-[11px] uppercase tracking-wider text-[#A3A3A3]">
                  Required
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  disabled={!restaurant.isDeliveryEnabled}
                  onClick={() =>
                    restaurant.isDeliveryEnabled && handleFulfilmentChange("DELIVERY")
                  }
                  className={`flex items-start gap-3 rounded-2xl border p-4 text-left transition-colors disabled:opacity-45 disabled:cursor-not-allowed ${
                    fulfilmentType === "DELIVERY"
                      ? "border-[#D71920] bg-[#D71920]/10"
                      : "border-[#333333] bg-[#262626] hover:border-[#4A4A4A]"
                  }`}
                >
                  <Bike
                    className={`h-5 w-5 flex-shrink-0 mt-0.5 ${
                      fulfilmentType === "DELIVERY" ? "text-[#F0444A]" : "text-[#A3A3A3]"
                    }`}
                    aria-hidden="true"
                  />
                  <div>
                    <p className="text-sm font-bold text-[#F5F1EA]">Sunyani Delivery</p>
                    <p className="text-xs text-[#A3A3A3] mt-0.5">
                      {restaurant.isDeliveryEnabled
                        ? `Dispatched by rider (${formatPesewasToGhs(selectedZone?.feePesewas ?? 0)})`
                        : "Temporarily paused"}
                    </p>
                  </div>
                </button>

                <button
                  type="button"
                  disabled={!restaurant.isCollectionEnabled}
                  onClick={() =>
                    restaurant.isCollectionEnabled && handleFulfilmentChange("COLLECTION")
                  }
                  className={`flex items-start gap-3 rounded-2xl border p-4 text-left transition-colors disabled:opacity-45 disabled:cursor-not-allowed ${
                    fulfilmentType === "COLLECTION"
                      ? "border-[#D71920] bg-[#D71920]/10"
                      : "border-[#333333] bg-[#262626] hover:border-[#4A4A4A]"
                  }`}
                >
                  <Store
                    className={`h-5 w-5 flex-shrink-0 mt-0.5 ${
                      fulfilmentType === "COLLECTION" ? "text-[#F0444A]" : "text-[#A3A3A3]"
                    }`}
                    aria-hidden="true"
                  />
                  <div>
                    <p className="text-sm font-bold text-[#F5F1EA]">Restaurant Pickup</p>
                    <p className="text-xs text-[#4ADE80] mt-0.5 font-semibold">
                      {restaurant.isCollectionEnabled
                        ? `GHS 0.00 fee \u2022 ${restaurant.address}`
                        : "Temporarily paused"}
                    </p>
                  </div>
                </button>
              </div>
            </section>

            {/* 2. Customer Contact */}
            <section className="rounded-3xl border border-[#333333] bg-[#1C1C1C] p-6 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="font-serif text-lg font-bold text-[#F5F1EA]">
                  2. Contact Details
                </h2>
                {signedInUser ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-[#22C55E]/35 bg-[#22C55E]/10 px-3 py-1 text-[11px] font-semibold text-[#4ADE80]">
                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    <span className="truncate max-w-[220px]">
                      Signed in as {formatFirstName(signedInUser.fullName)} · Pre-filled
                    </span>
                  </span>
                ) : (
                  <Link
                    href="/login?returnTo=/checkout"
                    className="text-xs font-semibold text-[#F0444A] hover:underline"
                  >
                    Have an account? Sign in to prefill →
                  </Link>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="checkout-name"
                    className="block text-xs font-semibold uppercase tracking-wider text-[#A3A3A3] mb-1.5"
                  >
                    Full Name *
                  </label>
                  <div className="relative">
                    <User
                      className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#737373]"
                      aria-hidden="true"
                    />
                    <input
                      id="checkout-name"
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Kwame Mensah"
                      className="w-full rounded-xl border border-[#333333] bg-[#262626] pl-10 pr-4 py-3 text-sm text-[#F5F1EA] placeholder-[#737373] focus:outline-none focus:border-[#D71920]"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="checkout-phone"
                    className="block text-xs font-semibold uppercase tracking-wider text-[#A3A3A3] mb-1.5"
                  >
                    Ghana Mobile Number *
                  </label>
                  <div className="relative">
                    <Phone
                      className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#737373]"
                      aria-hidden="true"
                    />
                    <input
                      id="checkout-phone"
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(formatGhanaPhone(e.target.value))}
                      placeholder="024 412 3456"
                      className="w-full rounded-xl border border-[#333333] bg-[#262626] pl-10 pr-4 py-3 text-sm text-[#F5F1EA] placeholder-[#737373] focus:outline-none focus:border-[#D71920] font-mono"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label
                  htmlFor="checkout-email"
                  className="block text-xs font-semibold uppercase tracking-wider text-[#A3A3A3] mb-1.5"
                >
                  Email Address *
                </label>
                <input
                  id="checkout-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="kwame@example.com"
                  className="w-full rounded-xl border border-[#333333] bg-[#262626] px-4 py-3 text-sm text-[#F5F1EA] placeholder-[#737373] focus:outline-none focus:border-[#D71920]"
                />
              </div>
            </section>

            {/* 3. Conditional Delivery Address OR Pickup Point Info */}
            {fulfilmentType === "DELIVERY" ? (
              <section className="rounded-3xl border border-[#333333] bg-[#1C1C1C] p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="font-serif text-lg font-bold text-[#F5F1EA]">
                    3. Sunyani Delivery Destination
                  </h2>
                  <span className="font-mono text-xs text-[#F0444A] font-semibold">
                    Est. {selectedZone.estimatedMinutes} mins
                  </span>
                </div>

                <div>
                  <label
                    htmlFor="checkout-zone"
                    className="block text-xs font-semibold uppercase tracking-wider text-[#A3A3A3] mb-1.5"
                  >
                    Delivery Zone *
                  </label>
                  <Select
                    id="checkout-zone"
                    ariaLabel="Delivery Zone"
                    value={selectedZoneId}
                    onChange={setSelectedZoneId}
                    variant="elevated"
                    size="md"
                    fullWidth
                    leadingIcon={<MapPin className="h-4 w-4" />}
                    options={deliveryZones.map((zone) => ({
                      value: zone.id,
                      label: zone.name,
                      description: `Est. ~${zone.estimatedMinutes} mins \u2022 ${zone.description}`,
                      meta: formatPesewasToGhs(zone.feePesewas),
                    }))}
                  />
                  <p className="mt-1.5 text-xs text-[#737373]">{selectedZone.description}</p>
                </div>

                <div>
                  <label
                    htmlFor="checkout-street"
                    className="block text-xs font-semibold uppercase tracking-wider text-[#A3A3A3] mb-1.5"
                  >
                    Street, Hostel, or House Number *
                  </label>
                  <div className="relative">
                    <MapPin
                      className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#737373]"
                      aria-hidden="true"
                    />
                    <input
                      id="checkout-street"
                      type="text"
                      required
                      value={streetAddress}
                      onChange={(e) => setStreetAddress(e.target.value)}
                      placeholder="e.g. Plot 14, UENR Main Gate Road"
                      className="w-full rounded-xl border border-[#333333] bg-[#262626] pl-10 pr-4 py-3 text-sm text-[#F5F1EA] placeholder-[#737373] focus:outline-none focus:border-[#D71920]"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="checkout-landmark"
                    className="block text-xs font-semibold uppercase tracking-wider text-[#A3A3A3] mb-1.5"
                  >
                    Nearby Landmark (Optional)
                  </label>
                  <input
                    id="checkout-landmark"
                    type="text"
                    value={landmark}
                    onChange={(e) => setLandmark(e.target.value)}
                    placeholder="e.g. Opposite Goil Station"
                    className="w-full rounded-xl border border-[#333333] bg-[#262626] px-4 py-3 text-sm text-[#F5F1EA] placeholder-[#737373] focus:outline-none focus:border-[#D71920]"
                  />
                </div>
              </section>
            ) : (
              <section className="rounded-3xl border border-[#22C55E]/30 bg-[#22C55E]/5 p-6 flex items-start gap-4">
                <Store className="h-6 w-6 text-[#4ADE80] flex-shrink-0 mt-0.5" aria-hidden="true" />
                <div>
                  <h2 className="font-serif text-lg font-bold text-[#F5F1EA]">
                    Counter Pickup in Sunyani Central
                  </h2>
                  <p className="mt-1 text-xs sm:text-sm text-[#A3A3A3]">
                    Collect hot from Sika Cuisine counter at <strong className="text-white">{RESTAURANT_INFO.address}</strong>. No delivery fee applies.
                  </p>
                </div>
              </section>
            )}

            {/* 4. Payment & Notes */}
            <section className="rounded-3xl border border-[#333333] bg-[#1C1C1C] p-6 space-y-4">
              <h2 className="font-serif text-lg font-bold text-[#F5F1EA]">
                4. Payment Method &amp; Kitchen Note
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label
                  className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition-colors ${
                    paymentMethod === "PAYSTACK"
                      ? "border-[#D71920] bg-[#D71920]/10"
                      : "border-[#333333] bg-[#262626] hover:border-[#4A4A4A]"
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="PAYSTACK"
                    checked={paymentMethod === "PAYSTACK"}
                    onChange={() => setPaymentMethod("PAYSTACK")}
                    className="sr-only"
                  />
                  <span
                    aria-hidden="true"
                    className={`mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full border ${
                      paymentMethod === "PAYSTACK"
                        ? "border-[#D71920] bg-[#D71920]/20"
                        : "border-[#737373] bg-[#1C1C1C]"
                    }`}
                  >
                    {paymentMethod === "PAYSTACK" && (
                      <span className="h-2 w-2 rounded-full bg-[#D71920]" />
                    )}
                  </span>
                  <div>
                    <span className="flex items-center gap-1.5 text-sm font-bold text-[#F5F1EA]">
                      <CreditCard className="h-4 w-4 text-[#F0444A]" aria-hidden="true" />
                      Paystack (MoMo / Card)
                    </span>
                    <span className="mt-0.5 block text-xs text-[#A3A3A3]">
                      MTN MoMo, Telecel Cash, or Visa/Mastercard
                    </span>
                  </div>
                </label>

                <label
                  className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition-colors ${
                    paymentMethod !== "PAYSTACK"
                      ? "border-[#D71920] bg-[#D71920]/10"
                      : "border-[#333333] bg-[#262626] hover:border-[#4A4A4A]"
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value={cashMethodValue}
                    checked={paymentMethod !== "PAYSTACK"}
                    onChange={() => setPaymentMethod(cashMethodValue)}
                    className="sr-only"
                  />
                  <span
                    aria-hidden="true"
                    className={`mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full border ${
                      paymentMethod !== "PAYSTACK"
                        ? "border-[#D71920] bg-[#D71920]/20"
                        : "border-[#737373] bg-[#1C1C1C]"
                    }`}
                  >
                    {paymentMethod !== "PAYSTACK" && (
                      <span className="h-2 w-2 rounded-full bg-[#D71920]" />
                    )}
                  </span>
                  <div>
                    <span className="flex items-center gap-1.5 text-sm font-bold text-[#F5F1EA]">
                      <Banknote className="h-4 w-4 text-[#4ADE80]" aria-hidden="true" />
                      {fulfilmentType === "DELIVERY" ? "Cash on Delivery" : "Cash on Collection"}
                    </span>
                    <span className="mt-0.5 block text-xs text-[#A3A3A3]">
                      {fulfilmentType === "DELIVERY"
                        ? "Pay our rider in Ghana Cedis upon arrival"
                        : "Settle at the restaurant counter during pickup"}
                    </span>
                  </div>
                </label>
              </div>

              <div>
                <label
                  htmlFor="checkout-notes"
                  className="block text-xs font-semibold uppercase tracking-wider text-[#A3A3A3] mb-1.5"
                >
                  Order / Kitchen Notes (Optional)
                </label>
                <textarea
                  id="checkout-notes"
                  rows={2}
                  maxLength={500}
                  value={customerNotes}
                  onChange={(e) => setCustomerNotes(e.target.value)}
                  placeholder="Call on arrival, extra shito on the side, etc."
                  className="w-full rounded-xl border border-[#333333] bg-[#262626] p-3 text-sm text-[#F5F1EA] placeholder-[#737373] focus:outline-none focus:border-[#D71920]"
                />
              </div>
            </section>
          </div>

          {/* Right Order Summary Column */}
          <div className="lg:col-span-5">
            <div className="sticky top-24 rounded-3xl border border-[#333333] bg-[#1C1C1C] p-6 space-y-5 shadow-2xl">
              <div className="flex items-center justify-between border-b border-[#333333] pb-4">
                <h2 className="font-serif text-xl font-bold text-[#F5F1EA]">Order Summary</h2>
                <span className="font-mono text-xs text-[#A3A3A3]">
                  {items.reduce((acc, item) => acc + item.quantity, 0)} items
                </span>
              </div>

              {unavailableCount > 0 && (
                <div
                  role="alert"
                  className="rounded-2xl border border-[#FB7185]/45 bg-[#FB7185]/10 p-3.5 space-y-2.5"
                >
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-[#FDA4AF] shrink-0 mt-0.5" aria-hidden="true" />
                    <p className="text-xs text-[#FDA4AF] font-semibold leading-relaxed">
                      {unavailableCount === 1
                        ? "1 dish in your order just sold out."
                        : `${unavailableCount} dishes in your order are no longer available.`}{" "}
                      Remove it to continue without losing your details.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      removeUnavailableItems();
                      setFormError(null);
                    }}
                    className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-[#FB7185]/40 bg-[#FB7185]/15 hover:bg-[#FB7185]/25 py-2 text-xs font-bold text-[#FDA4AF] transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Remove Sold-Out &amp; Continue</span>
                  </button>
                </div>
              )}

              <div className="max-h-72 overflow-y-auto space-y-3 pr-1">
                {items.map((item) => {
                  const unavailableReason = unavailableMenuItemIds[item.menuItemId];
                  const isUnavailable = Boolean(unavailableReason);
                  return (
                  <div
                    key={item.id}
                    className={`flex items-start justify-between gap-3 rounded-2xl border p-3 ${
                      isUnavailable
                        ? "border-[#FB7185]/45 bg-[#262626]/60 opacity-75"
                        : "border-[#333333] bg-[#262626]"
                    }`}
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[#F5F1EA]">
                        <span className="font-mono text-[#F0444A] mr-1.5">{item.quantity}x</span>
                        {item.name}
                      </p>
                      {isUnavailable && (
                        <span className="mt-1 inline-flex items-center rounded-full border border-[#FB7185]/45 bg-[#FB7185]/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#FDA4AF]">
                          {unavailableReason === "REMOVED" ? "No longer on menu" : "Sold Out"}
                        </span>
                      )}
                      {item.selectedOptions.length > 0 && (
                        <p className="mt-0.5 text-[11px] text-[#A3A3A3]">
                          {item.selectedOptions.map((o) => o.optionName).join(", ")}
                        </p>
                      )}
                      {item.specialInstructions && (
                        <p className="mt-0.5 text-[11px] italic text-[#737373]">
                          Note: {item.specialInstructions}
                        </p>
                      )}
                    </div>
                    <span className="font-mono text-sm font-bold text-[#F5F1EA] tabular-nums flex-shrink-0">
                      {formatPesewasToGhs(item.lineTotalPesewas)}
                    </span>
                  </div>
                  );
                })}
              </div>

              <div className="space-y-2 border-t border-[#333333] pt-4 text-sm">
                <div className="flex justify-between text-[#A3A3A3]">
                  <span>Food Subtotal</span>
                  <span className="font-mono font-semibold text-[#F5F1EA] tabular-nums">
                    {formatPesewasToGhs(subtotalPesewas)}
                  </span>
                </div>
                <div className="flex justify-between text-[#A3A3A3]">
                  <span>
                    {fulfilmentType === "DELIVERY"
                      ? `Delivery (${selectedZone.name})`
                      : "Counter Pickup"}
                  </span>
                  <span className="font-mono font-semibold text-[#F5F1EA] tabular-nums">
                    {formatPesewasToGhs(deliveryFeePesewas)}
                  </span>
                </div>
                <div className="flex items-center justify-between border-t border-[#333333] pt-3">
                  <span className="font-serif text-base font-bold text-white">Total Due</span>
                  <span className="font-mono text-2xl font-black text-[#F0444A] tabular-nums">
                    {formatPesewasToGhs(totalPesewas)}
                  </span>
                </div>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                fullWidth
                loading={submitting}
                disabled={
                  unavailableCount > 0 ||
                  !restaurant.isAcceptingOrders ||
                  (fulfilmentType === "DELIVERY" && !restaurant.isDeliveryEnabled) ||
                  (fulfilmentType === "COLLECTION" && !restaurant.isCollectionEnabled)
                }
              >
                <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                <span>
                  {unavailableCount > 0
                    ? "Remove Sold-Out Items to Continue"
                    : !restaurant.isAcceptingOrders
                    ? "Kitchen Currently Paused"
                    : paymentMethod === "PAYSTACK"
                    ? `Proceed to Paystack (${formatPesewasToGhs(totalPesewas)})`
                    : `Place Order (${formatPesewasToGhs(totalPesewas)})`}
                </span>
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
