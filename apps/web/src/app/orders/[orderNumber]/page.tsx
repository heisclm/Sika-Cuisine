import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Banknote, Bike, Clock, CreditCard, MapPin, Phone, Receipt, Store } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatPesewasToGhs } from "@/lib/currency";
import { RESTAURANT_INFO } from "@/lib/navigation";
import { FulfilmentStatus, FulfilmentType } from "@sika/shared";
import { Badge } from "@/components/ui/Badge";
import { OrderTimeline } from "@/components/ui/OrderTimeline";

export const dynamic = "force-dynamic";

interface SelectedOptionDisplay {
  optionName?: string;
  priceDeltaPesewas?: number;
}

function getPaymentBadgeVariant(status: string): "success" | "warning" | "error" | "neutral" {
  if (status === "PAID") return "success";
  if (status === "FAILED") return "error";
  if (status === "REFUNDED") return "neutral";
  return "warning";
}

function getFulfilmentBadgeVariant(status: string): "brand" | "success" | "warning" | "error" {
  if (status === "DELIVERED" || status === "COLLECTED") return "success";
  if (status === "CANCELLED" || status === "REJECTED") return "error";
  if (status === "PENDING") return "warning";
  return "brand";
}

/**
 * Live customer order tracking & itemized receipt view.
 * Queries PostgreSQL directly for order line items, delivery destination,
 * and chronological `statusHistory` timestamps rendered via `<OrderTimeline />`.
 */
export default async function OrderTrackingDetailPage({
  params,
}: {
  params: Promise<{ orderNumber: string }>;
}) {
  const { orderNumber } = await params;
  const decodedOrderNumber = decodeURIComponent(orderNumber).trim().toUpperCase();

  const order = await prisma.order.findUnique({
    where: { orderNumber: decodedOrderNumber },
    include: {
      items: true,
      deliveryAddress: true,
      statusHistory: {
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!order) {
    notFound();
  }

  const serializedHistory = order.statusHistory.map((h) => ({
    id: h.id,
    toStatus: h.toStatus,
    note: h.note,
    createdAt: h.createdAt.toISOString(),
  }));

  const isDelivery = order.fulfilmentType === "DELIVERY";

  return (
    <div className="min-h-screen bg-[#101010] py-10 sm:py-14 pb-20">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#333333] pb-6">
          <div className="space-y-2">
            <Link
              href="/orders"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#A3A3A3] hover:text-white transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Back to Orders</span>
            </Link>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="font-mono text-2xl sm:text-3xl font-black tracking-tight text-white">
                {order.orderNumber}
              </h1>
              <Badge variant={getFulfilmentBadgeVariant(order.fulfilmentStatus)}>
                {order.fulfilmentStatus.replace(/_/g, " ")}
              </Badge>
            </div>
            <p className="text-xs sm:text-sm text-[#A3A3A3] flex items-center gap-2">
              <Clock className="h-3.5 w-3.5 text-[#F0444A]" aria-hidden="true" />
              <span>
                Placed{" "}
                {order.createdAt.toLocaleString("en-GH", {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
                {" \u2022 "}Est. {order.estimatedDeliveryMinutes} mins
              </span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={`tel:${RESTAURANT_INFO.primaryPhoneIntl}`}
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-[#333333] bg-[#1C1C1C] hover:border-[#D71920]/60 px-4 text-xs font-semibold text-[#F5F1EA] transition-colors"
            >
              <Phone className="h-3.5 w-3.5 text-[#F0444A]" aria-hidden="true" />
              <span>Call Kitchen ({RESTAURANT_INFO.primaryPhone})</span>
            </a>
          </div>
        </div>

        {/* Live Status Stepper */}
        <section className="rounded-3xl border border-[#333333] bg-[#1C1C1C] p-6 sm:p-8 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <h2 className="font-serif text-xl font-bold text-[#F5F1EA]">
              {isDelivery ? "Delivery Progress" : "Counter Pickup Progress"}
            </h2>
            <span className="font-mono text-xs text-[#A3A3A3]">
              {order.statusHistory.length} recorded updates
            </span>
          </div>

          <OrderTimeline
            fulfilmentType={order.fulfilmentType as FulfilmentType}
            currentStatus={order.fulfilmentStatus as FulfilmentStatus}
            history={serializedHistory}
          />
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Itemized Receipt */}
          <section className="lg:col-span-7 rounded-3xl border border-[#333333] bg-[#1C1C1C] p-6 space-y-4">
            <div className="flex items-center gap-2 border-b border-[#333333] pb-3.5">
              <Receipt className="h-5 w-5 text-[#F0444A]" aria-hidden="true" />
              <h2 className="font-serif text-lg font-bold text-[#F5F1EA]">Ordered Dishes</h2>
            </div>

            <div className="space-y-3">
              {order.items.map((item) => {
                const options = Array.isArray(item.selectedOptionsSnapshot)
                  ? (item.selectedOptionsSnapshot as SelectedOptionDisplay[])
                  : [];

                return (
                  <div
                    key={item.id}
                    className="flex items-start justify-between gap-3 rounded-2xl border border-[#333333] bg-[#262626] p-3.5"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[#F5F1EA]">
                        <span className="font-mono text-[#F0444A] mr-1.5">{item.quantity}x</span>
                        {item.itemNameSnapshot}
                      </p>
                      {options.length > 0 && (
                        <p className="mt-0.5 text-xs text-[#A3A3A3]">
                          {options
                            .map((opt) => opt.optionName)
                            .filter(Boolean)
                            .join(", ")}
                        </p>
                      )}
                      {item.specialInstructions && (
                        <p className="mt-1 text-xs italic text-[#737373]">
                          Note: {item.specialInstructions}
                        </p>
                      )}
                    </div>
                    <span className="font-mono text-sm font-bold text-[#F5F1EA] tabular-nums flex-shrink-0">
                      {formatPesewasToGhs(item.subtotalPesewas)}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="space-y-2 border-t border-[#333333] pt-4 text-sm">
              <div className="flex justify-between text-[#A3A3A3]">
                <span>Subtotal</span>
                <span className="font-mono text-[#F5F1EA] tabular-nums">
                  {formatPesewasToGhs(order.subtotalPesewas)}
                </span>
              </div>
              <div className="flex justify-between text-[#A3A3A3]">
                <span>{isDelivery ? "Sunyani Delivery Fee" : "Counter Pickup Fee"}</span>
                <span className="font-mono text-[#F5F1EA] tabular-nums">
                  {formatPesewasToGhs(order.deliveryFeePesewas)}
                </span>
              </div>
              <div className="flex justify-between border-t border-[#333333] pt-3">
                <span className="font-serif text-base font-bold text-white">Order Total</span>
                <span className="font-mono text-xl font-black text-[#F0444A] tabular-nums">
                  {formatPesewasToGhs(order.totalPesewas)}
                </span>
              </div>
            </div>
          </section>

          {/* Fulfilment & Payment Summary */}
          <aside className="lg:col-span-5 space-y-6">
            <div className="rounded-3xl border border-[#333333] bg-[#1C1C1C] p-6 space-y-4">
              <div className="flex items-center gap-2 border-b border-[#333333] pb-3.5">
                {isDelivery ? (
                  <Bike className="h-5 w-5 text-[#F0444A]" aria-hidden="true" />
                ) : (
                  <Store className="h-5 w-5 text-[#4ADE80]" aria-hidden="true" />
                )}
                <h2 className="font-serif text-lg font-bold text-[#F5F1EA]">
                  {isDelivery ? "Delivery Details" : "Pickup Counter"}
                </h2>
              </div>

              {isDelivery && order.deliveryAddress ? (
                <div className="space-y-2 text-sm text-[#A3A3A3]">
                  <p className="font-semibold text-[#F5F1EA]">
                    {order.deliveryAddress.recipientName}
                  </p>
                  <p className="font-mono text-xs">{order.deliveryAddress.recipientPhone}</p>
                  <div className="flex items-start gap-2 pt-1">
                    <MapPin className="h-4 w-4 text-[#F0444A] flex-shrink-0 mt-0.5" aria-hidden="true" />
                    <div>
                      <p className="text-[#F5F1EA]">{order.deliveryAddress.streetAddress}</p>
                      <p className="text-xs text-[#A3A3A3]">
                        {order.deliveryAddress.areaLocality}, {order.deliveryAddress.city}
                      </p>
                      {order.deliveryAddress.landmark && (
                        <p className="text-xs text-[#737373] mt-0.5">
                          Landmark: {order.deliveryAddress.landmark}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-2 text-sm text-[#A3A3A3]">
                  <p className="font-semibold text-[#F5F1EA]">{RESTAURANT_INFO.brandName}</p>
                  <p>{RESTAURANT_INFO.address}</p>
                  <p className="text-xs text-[#737373]">
                    Present your order number at the counter to collect.
                  </p>
                </div>
              )}

              {order.customerNotes && (
                <div className="rounded-xl border border-[#333333] bg-[#262626] p-3 text-xs text-[#A3A3A3]">
                  <span className="font-semibold text-[#F5F1EA] block mb-0.5">Customer Note</span>
                  {order.customerNotes}
                </div>
              )}
            </div>

            <div className="rounded-3xl border border-[#333333] bg-[#1C1C1C] p-6 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="font-serif text-lg font-bold text-[#F5F1EA]">Payment</h2>
                <Badge variant={getPaymentBadgeVariant(order.paymentStatus)}>
                  {order.paymentStatus}
                </Badge>
              </div>
              <div className="flex items-center gap-2.5 text-sm text-[#A3A3A3]">
                {order.paymentMethod === "PAYSTACK" ? (
                  <CreditCard className="h-4 w-4 text-[#F0444A]" aria-hidden="true" />
                ) : (
                  <Banknote className="h-4 w-4 text-[#4ADE80]" aria-hidden="true" />
                )}
                <span>{order.paymentMethod.replace(/_/g, " ")}</span>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
