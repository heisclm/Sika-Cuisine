"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  MapPin,
  CreditCard,
  Truck,
  Store,
  ShieldCheck,
  AlertCircle,
  Loader2,
  ArrowLeft,
} from "lucide-react";
import { RestaurantClocheIcon } from "@/components/icons/RestaurantClocheIcon";
import { useCart } from "@/context/CartContext";
import { formatPesewasToGhs } from "@/lib/currency";
import { SUNYANI_DELIVERY_ZONES, getZoneFeePesewas } from "@/lib/delivery-zones";
import { createOrderAction } from "@/app/actions/order";
import { FulfilmentType, PaymentMethod } from "@/types/order";
import { formatGhanaPhone, isValidGhanaPhone } from "@/lib/phone";

export default function CheckoutPage() {
  const router = useRouter();
  const { items, subtotalPesewas, clearCart } = useCart();

  const [fulfilmentType, setFulfilmentType] = useState<FulfilmentType>("DELIVERY");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("PAYSTACK");

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");

  const [areaLocality, setAreaLocality] = useState(SUNYANI_DELIVERY_ZONES[0].name);
  const [streetAddress, setStreetAddress] = useState("");
  const [landmark, setLandmark] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const deliveryFeePesewas =
    fulfilmentType === "DELIVERY" ? getZoneFeePesewas(areaLocality) : 0;
  const grandTotalPesewas = subtotalPesewas + deliveryFeePesewas;

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (items.length === 0) {
      setErrorMessage("Your cart is empty. Please add delicious dishes first!");
      return;
    }

    if (!isValidGhanaPhone(phone)) {
      setErrorMessage("Please enter a valid 10-digit Ghanaian mobile number (e.g. 053 337 6760) for courier dispatch.");
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        fulfilmentType,
        paymentMethod,
        customerInfo: {
          fullName,
          phone,
          email,
        },
        deliveryAddress:
          fulfilmentType === "DELIVERY"
            ? {
                recipientName: fullName,
                recipientPhone: phone,
                streetAddress,
                areaLocality,
                landmark,
                city: "Sunyani",
              }
            : undefined,
        items: items.map((i) => ({
          menuItemId: i.menuItemId,
          quantity: i.quantity,
          selectedOptionIds: i.selectedOptions.map((o) => o.optionId),
          specialInstructions: i.specialInstructions,
        })),
        customerNotes: notes,
      };

      const result = await createOrderAction(payload);

      if (!result.success) {
        setErrorMessage(result.error || "Failed to process order.");
        setIsSubmitting(false);
        return;
      }

      clearCart();

      if (result.authorizationUrl) {
        window.location.href = result.authorizationUrl;
      } else if (result.redirectUrl) {
        router.push(result.redirectUrl);
      } else {
        router.push(`/orders/${result.orderNumber}`);
      }
    } catch (err: any) {
      setErrorMessage(err.message || "An unexpected error occurred.");
      setIsSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full rounded-3xl bg-surface-300 border border-border-subtle p-8 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-surface-100 text-gray-400 mx-auto mb-4">
            <RestaurantClocheIcon className="h-8 w-8 text-brand-red" />
          </div>
          <h1 className="font-serif text-2xl font-bold text-white mb-2">
            Your Dining Tray is Empty
          </h1>
          <p className="text-sm text-gray-400 mb-6">
            You cannot proceed to checkout without adding dishes to your order.
          </p>
          <Link
            href="/menu"
            className="btn-red-gradient inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-semibold text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Browse Full Menu</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8">
          <Link
            href="/menu"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-400 hover:text-white transition-colors mb-2"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Menu
          </Link>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-white">
            Secure Checkout
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Deliveries powered across Sunyani, Bono Region. Payments secured by Paystack.
          </p>
        </div>

        {errorMessage && (
          <div className="mb-8 flex items-center gap-3 rounded-2xl bg-red-950/50 border border-red-800 p-4 text-sm text-red-200">
            <AlertCircle className="h-5 w-5 text-brand-red flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmitOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-7 space-y-6">
            <div className="rounded-3xl bg-surface-300 border border-border-subtle p-6">
              <h2 className="text-base font-bold text-white font-serif mb-4 flex items-center gap-2">
                <Truck className="h-5 w-5 text-brand-red" />
                1. Select Fulfilment Type
              </h2>

              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setFulfilmentType("DELIVERY")}
                  className={`flex flex-col items-center justify-center p-4 rounded-2xl border text-center transition-all ${
                    fulfilmentType === "DELIVERY"
                      ? "border-brand-red bg-brand-red/10 text-white"
                      : "border-border-subtle bg-surface-200 text-gray-400 hover:text-white"
                  }`}
                >
                  <Truck className="h-6 w-6 mb-2 text-brand-red" />
                  <span className="font-bold text-sm">Sunyani Delivery</span>
                  <span className="text-xs text-gray-400 mt-0.5">25-45 mins</span>
                </button>

                <button
                  type="button"
                  onClick={() => setFulfilmentType("COLLECTION")}
                  className={`flex flex-col items-center justify-center p-4 rounded-2xl border text-center transition-all ${
                    fulfilmentType === "COLLECTION"
                      ? "border-brand-red bg-brand-red/10 text-white"
                      : "border-border-subtle bg-surface-200 text-gray-400 hover:text-white"
                  }`}
                >
                  <Store className="h-6 w-6 mb-2 text-brand-red" />
                  <span className="font-bold text-sm">Kitchen Collection</span>
                  <span className="text-xs text-gray-400 mt-0.5">Pick up in Sunyani Central</span>
                </button>
              </div>
            </div>

            <div className="rounded-3xl bg-surface-300 border border-border-subtle p-6 space-y-4">
              <h2 className="text-base font-bold text-white font-serif mb-2">
                2. Contact Information
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Kwame Mensah"
                    className="w-full rounded-xl bg-surface-200 border border-border-subtle p-3 text-sm text-white focus:outline-none focus:border-brand-red"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                    Phone Number (MoMo Enabled) *
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(formatGhanaPhone(e.target.value))}
                    placeholder="053 337 6760"
                    maxLength={12}
                    className="w-full rounded-xl bg-surface-200 border border-border-subtle p-3 text-sm text-white focus:outline-none focus:border-brand-red font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                  Email Address (For Receipt & Tracking) *
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="kwame@example.com"
                  className="w-full rounded-xl bg-surface-200 border border-border-subtle p-3 text-sm text-white focus:outline-none focus:border-brand-red"
                />
              </div>
            </div>

            {fulfilmentType === "DELIVERY" && (
              <div className="rounded-3xl bg-surface-300 border border-border-subtle p-6 space-y-4">
                <h2 className="text-base font-bold text-white font-serif mb-2 flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-brand-red" />
                  3. Sunyani Delivery Address
                </h2>

                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                    Sunyani Locality / Zone *
                  </label>
                  <select
                    value={areaLocality}
                    onChange={(e) => setAreaLocality(e.target.value)}
                    className="w-full rounded-xl bg-surface-200 border border-border-subtle p-3 text-sm text-white focus:outline-none focus:border-brand-red"
                  >
                    {SUNYANI_DELIVERY_ZONES.map((zone) => (
                      <option key={zone.id} value={zone.name} className="bg-surface-300">
                        {zone.name} — {formatPesewasToGhs(zone.feePesewas)} ({zone.estimatedMinutes} mins)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                    Street Address / House Description *
                  </label>
                  <input
                    type="text"
                    required
                    value={streetAddress}
                    onChange={(e) => setStreetAddress(e.target.value)}
                    placeholder="e.g. House No. 24, UENR Main Road"
                    className="w-full rounded-xl bg-surface-200 border border-border-subtle p-3 text-sm text-white focus:outline-none focus:border-brand-red"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                    Prominent Landmark
                  </label>
                  <input
                    type="text"
                    value={landmark}
                    onChange={(e) => setLandmark(e.target.value)}
                    placeholder="e.g. Opposite UENR Gate, Near Total Station"
                    className="w-full rounded-xl bg-surface-200 border border-border-subtle p-3 text-sm text-white focus:outline-none focus:border-brand-red"
                  />
                </div>
              </div>
            )}

            <div className="rounded-3xl bg-surface-300 border border-border-subtle p-6 space-y-4">
              <h2 className="text-base font-bold text-white font-serif mb-2 flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-brand-red" />
                4. Payment Method
              </h2>

              <div className="space-y-3">
                <label
                  className={`flex items-start gap-3 p-4 rounded-2xl border cursor-pointer transition-all ${
                    paymentMethod === "PAYSTACK"
                      ? "border-brand-red bg-brand-red/10"
                      : "border-border-subtle bg-surface-200 hover:border-gray-600"
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="PAYSTACK"
                    checked={paymentMethod === "PAYSTACK"}
                    onChange={() => setPaymentMethod("PAYSTACK")}
                    className="mt-1 text-brand-red focus:ring-brand-red"
                  />
                  <div>
                    <span className="font-bold text-sm text-white block">
                      Paystack (Mobile Money & Cards)
                    </span>
                    <span className="text-xs text-gray-400">
                      MTN Mobile Money, Telecel Cash, AT Money, Visa, & Mastercard. Instant verification.
                    </span>
                  </div>
                </label>

                <label
                  className={`flex items-start gap-3 p-4 rounded-2xl border cursor-pointer transition-all ${
                    paymentMethod === "CASH_ON_DELIVERY"
                      ? "border-brand-red bg-brand-red/10"
                      : "border-border-subtle bg-surface-200 hover:border-gray-600"
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="CASH_ON_DELIVERY"
                    checked={paymentMethod === "CASH_ON_DELIVERY"}
                    onChange={() => setPaymentMethod("CASH_ON_DELIVERY")}
                    className="mt-1 text-brand-red focus:ring-brand-red"
                  />
                  <div>
                    <span className="font-bold text-sm text-white block">
                      Cash on {fulfilmentType === "DELIVERY" ? "Delivery" : "Collection"}
                    </span>
                    <span className="text-xs text-gray-400">
                      Pay in cash directly to our delivery courier or kitchen counter upon receipt.
                    </span>
                  </div>
                </label>
              </div>
            </div>

            <div className="rounded-3xl bg-surface-300 border border-border-subtle p-6">
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                Order Notes / Special Requests (Optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Please call before arriving, extra pepper on the side..."
                rows={2}
                className="w-full rounded-xl bg-surface-200 border border-border-subtle p-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-brand-red"
              />
            </div>
          </div>

          <div className="lg:col-span-5">
            <div className="sticky top-28 rounded-3xl bg-surface-300 border border-border-subtle p-6 space-y-6">
              <h2 className="font-serif text-xl font-bold text-white border-b border-border-subtle pb-4">
                Order Summary
              </h2>

              <div className="space-y-4 max-h-64 overflow-y-auto pr-1">
                {items.map((item) => (
                  <div key={item.id} className="flex justify-between items-start text-sm">
                    <div className="flex gap-2">
                      <span className="font-bold text-brand-red">{item.quantity}x</span>
                      <div>
                        <p className="font-semibold text-white leading-tight">{item.name}</p>
                        {item.selectedOptions.length > 0 && (
                          <p className="text-xs text-gray-400 mt-0.5">
                            {item.selectedOptions.map((o) => o.optionName).join(", ")}
                          </p>
                        )}
                      </div>
                    </div>
                    <span className="font-semibold text-white ml-2">
                      {formatPesewasToGhs(item.lineTotalPesewas)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="border-t border-border-subtle pt-4 space-y-2.5 text-sm">
                <div className="flex justify-between text-gray-400">
                  <span>Subtotal</span>
                  <span className="font-semibold text-white">
                    {formatPesewasToGhs(subtotalPesewas)}
                  </span>
                </div>

                <div className="flex justify-between text-gray-400">
                  <span>Delivery ({fulfilmentType === "DELIVERY" ? areaLocality : "Collection"})</span>
                  <span className="font-semibold text-white">
                    {fulfilmentType === "DELIVERY"
                      ? formatPesewasToGhs(deliveryFeePesewas)
                      : "FREE"}
                  </span>
                </div>

                <div className="border-t border-border-subtle pt-3 flex justify-between items-baseline">
                  <span className="font-serif text-base font-bold text-white">Total</span>
                  <span className="font-serif text-2xl font-black text-brand-red">
                    {formatPesewasToGhs(grandTotalPesewas)}
                  </span>
                </div>
              </div>

              <div className="rounded-2xl bg-surface-200 p-3 flex items-center gap-3 border border-border-subtle text-xs text-gray-400">
                <ShieldCheck className="h-5 w-5 text-emerald-400 flex-shrink-0" />
                <span>
                  All transactions encrypted. Official Paystack API integration for Ghana.
                </span>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-red-gradient flex w-full items-center justify-center gap-2 py-4 rounded-full text-base font-semibold text-white shadow-glow disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Processing Order...</span>
                  </>
                ) : (
                  <span>
                    Confirm & {paymentMethod === "PAYSTACK" ? "Pay Online" : "Place Order"}
                  </span>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
