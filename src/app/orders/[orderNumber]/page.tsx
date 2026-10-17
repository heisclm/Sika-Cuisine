import React from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Clock,
  ChefHat,
  Bike,
  PackageCheck,
  ShoppingBag,
  MapPin,
  CreditCard,
  ArrowRight,
  Printer,
  Phone,
  MessageCircle,
  FileText,
  Compass,
} from "lucide-react";
import { formatPesewasToGhs } from "@/lib/currency";
import { FulfilmentStatus } from "@/types/order";

interface PageProps {
  params: Promise<{
    orderNumber: string;
  }>;
  searchParams: Promise<{
    reference?: string;
    simulated?: string;
  }>;
}

export default async function OrderDetailPage({ params, searchParams }: PageProps) {
  const { orderNumber } = await params;
  const { reference, simulated } = await searchParams;

  const order = {
    orderNumber,
    createdAt: "Just now",
    fulfilmentType: "DELIVERY",
    fulfilmentStatus: "PREPARING" as FulfilmentStatus,
    paymentStatus: simulated || reference ? "PAID" : "PENDING",
    paymentMethod: "PAYSTACK",
    subtotalPesewas: 8000,
    deliveryFeePesewas: 2000,
    totalPesewas: 10000,
    estimatedMinutes: 30,
    customerName: "Kwame Mensah",
    recipientPhone: "+233 53 337 6760",
    locality: "Fiapre & UENR Campus",
    streetAddress: "House No. 12, Near Notre Dame Gate",
    items: [
      {
        id: "1",
        itemNameSnapshot: "SIKA Special Combo (De Mixture)",
        unitPricePesewas: 8000,
        quantity: 1,
        subtotalPesewas: 8000,
        selectedOptions: ["Chef Mixture Special", "Packed separately"],
      },
    ],
  };

  const steps = [
    {
      status: "PENDING_CONFIRMATION",
      title: "Order Placed",
      desc: "Received by kitchen",
      icon: Clock,
      completed: true,
      current: false,
    },
    {
      status: "CONFIRMED",
      title: "Chef Confirmed",
      desc: "Ticket sent to station",
      icon: CheckCircle2,
      completed: true,
      current: false,
    },
    {
      status: "PREPARING",
      title: "Cooking & Packaging",
      desc: "Fresh on the grill",
      icon: ChefHat,
      completed: true,
      current: true,
    },
    {
      status: "OUT_FOR_DELIVERY",
      title: "Rider Dispatched",
      desc: "En route across Sunyani",
      icon: Bike,
      completed: false,
      current: false,
    },
    {
      status: "COMPLETED",
      title: "Delivered",
      desc: "Enjoy your feast",
      icon: PackageCheck,
      completed: false,
      current: false,
    },
  ];

  const whatsappMessage = encodeURIComponent(
    `Hello Sika Cuisine, I am inquiring about my active order ${order.orderNumber} for delivery to ${order.locality}.`
  );

  return (
    <div className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl space-y-8">
        <div className="flex items-center justify-between">
          <Link
            href="/orders"
            className="inline-flex items-center gap-2 text-xs font-semibold text-gray-400 hover:text-white transition-colors"
          >
            <Compass className="h-4 w-4 text-brand-red" />
            <span>&larr; View All Recent Orders</span>
          </Link>
          <div className="flex items-center gap-2">
            <span className="inline-flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs text-gray-400 font-medium">Live Kitchen Link Active</span>
          </div>
        </div>

        <div className="rounded-3xl bg-surface-300 border border-border-subtle p-8 sm:p-10 text-center relative overflow-hidden shadow-2xl">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-950/60 border border-emerald-600/40 text-emerald-400 mx-auto mb-4">
            <CheckCircle2 className="h-8 w-8" />
          </div>

          <span className="text-xs font-bold uppercase tracking-widest text-brand-red">
            Order Confirmed & Sent to Kitchen
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-white mt-1">
            Thank you, {order.customerName}!
          </h1>
          <p className="text-sm text-gray-300 mt-2">
            Your unique order reference is{" "}
            <span className="font-mono font-bold text-white bg-surface-100 px-3 py-1 rounded-lg border border-white/5">
              {order.orderNumber}
            </span>
          </p>

          <div className="mt-5 flex flex-wrap items-center justify-center gap-3 text-xs">
            <div className="rounded-full bg-surface-100 px-3.5 py-1.5 text-gray-300 border border-border-subtle flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-brand-red" />
              <span>Est. Preparation & Delivery: {order.estimatedMinutes} Mins</span>
            </div>
            <div className="rounded-full bg-emerald-950/50 px-3.5 py-1.5 text-emerald-300 border border-emerald-800/60 font-semibold flex items-center gap-1.5">
              <CreditCard className="h-3.5 w-3.5" />
              <span>Payment: {order.paymentStatus} ({order.paymentMethod})</span>
            </div>
          </div>
        </div>

        <div className="rounded-3xl bg-surface-300 border border-border-subtle p-6 sm:p-8 shadow-card">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 mb-6 border-b border-border-subtle/80 gap-2">
            <div>
              <h2 className="font-serif text-xl font-bold text-white">
                Live Kitchen & Dispatch Timeline
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">
                Real-time preparation stages tracked in Sunyani
              </p>
            </div>
            <span className="inline-flex items-center gap-1 text-xs text-brand-gold bg-brand-gold/10 border border-brand-gold/30 px-3 py-1 rounded-full w-fit">
              <Clock className="h-3 w-3" />
              <span>Active Stage: Cooking</span>
            </span>
          </div>

          <div className="relative">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
              {steps.map((step, idx) => {
                const Icon = step.icon;
                return (
                  <div key={idx} className="flex flex-col items-center text-center relative">
                    <div
                      className={`flex h-14 w-14 items-center justify-center rounded-2xl border transition-all ${
                        step.current
                          ? "bg-brand-red border-brand-red-light text-white shadow-glow scale-110 ring-4 ring-brand-red/20"
                          : step.completed
                          ? "bg-surface-100 border-emerald-600/50 text-emerald-400"
                          : "bg-surface-200 border-border-subtle text-gray-600"
                      }`}
                    >
                      <Icon className="h-6 w-6" />
                    </div>

                    <h3
                      className={`text-sm font-bold mt-3 leading-tight ${
                        step.current
                          ? "text-brand-red"
                          : step.completed
                          ? "text-white"
                          : "text-gray-500"
                      }`}
                    >
                      {step.title}
                    </h3>
                    <p className="text-xs text-gray-400 mt-1 max-w-[130px]">
                      {step.desc}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="rounded-3xl bg-surface-300 border border-border-subtle p-6 sm:p-8 shadow-card space-y-4">
          <h3 className="font-serif text-lg font-bold text-white flex items-center gap-2">
            <FileText className="h-5 w-5 text-brand-red" />
            <span>Itemized Order Summary</span>
          </h3>

          <div className="divide-y divide-border-subtle/60">
            {order.items.map((item) => (
              <div key={item.id} className="py-3 flex justify-between items-center text-sm">
                <div>
                  <p className="font-semibold text-white">
                    {item.quantity}x {item.itemNameSnapshot}
                  </p>
                  {item.selectedOptions && (
                    <p className="text-xs text-gray-400 mt-0.5">
                      {item.selectedOptions.join(", ")}
                    </p>
                  )}
                </div>
                <span className="font-semibold text-white">
                  {formatPesewasToGhs(item.subtotalPesewas)}
                </span>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-border-subtle/80 space-y-2 text-sm">
            <div className="flex justify-between text-gray-400">
              <span>Items Subtotal</span>
              <span>{formatPesewasToGhs(order.subtotalPesewas)}</span>
            </div>
            <div className="flex justify-between text-gray-400">
              <span>Delivery Fee ({order.locality})</span>
              <span>{formatPesewasToGhs(order.deliveryFeePesewas)}</span>
            </div>
            <div className="border-t border-border-subtle pt-2 flex justify-between font-bold text-white text-base">
              <span>Total Paid</span>
              <span className="text-brand-red font-serif text-lg">
                {formatPesewasToGhs(order.totalPesewas)}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="rounded-3xl bg-surface-300 border border-border-subtle p-6 space-y-3">
            <h3 className="font-serif text-base font-bold text-white flex items-center gap-2">
              <MapPin className="h-4 w-4 text-brand-red" />
              <span>Delivery Address in Sunyani</span>
            </h3>
            <div className="space-y-1 text-xs text-gray-300">
              <p className="text-sm font-semibold text-white">{order.customerName}</p>
              <p>{order.streetAddress}</p>
              <p className="text-brand-red font-medium">{order.locality}, Sunyani</p>
              <p className="text-gray-400 pt-1">Phone: {order.recipientPhone}</p>
            </div>
          </div>

          <div className="rounded-3xl bg-surface-300 border border-border-subtle p-6 flex flex-col justify-between space-y-4">
            <div>
              <h3 className="font-serif text-base font-bold text-white flex items-center gap-2">
                <MessageCircle className="h-4 w-4 text-emerald-400" />
                <span>Direct Kitchen Dispatch Support</span>
              </h3>
              <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                Have special delivery gate instructions or questions regarding your order? Connect directly with our Sunyani team.
              </p>
            </div>

            <a
              href={`https://wa.me/233533376760?text=${whatsappMessage}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-colors shadow-glow"
            >
              <Phone className="h-3.5 w-3.5" />
              <span>WhatsApp Kitchen (0533376760)</span>
            </a>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-border-subtle/60">
          <Link
            href="/menu"
            className="btn-red-gradient inline-flex items-center gap-2 px-6 py-3 rounded-full text-xs font-semibold text-white shadow-glow"
          >
            <ShoppingBag className="h-4 w-4" />
            <span>Order More Delicacies</span>
          </Link>

          <Link
            href="/orders"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-400 hover:text-white transition-colors"
          >
            <span>Track Another Food Order</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
