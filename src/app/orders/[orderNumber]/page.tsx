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
    fulfilmentType: "DELIVERY",
    fulfilmentStatus: "PREPARING" as FulfilmentStatus,
    paymentStatus: simulated || reference ? "PAID" : "PENDING",
    paymentMethod: "PAYSTACK",
    subtotalPesewas: 6500,
    deliveryFeePesewas: 2000,
    totalPesewas: 8500,
    estimatedMinutes: 30,
    customerName: "Kwame Mensah",
    recipientPhone: "+233 24 123 4567",
    locality: "Fiapre & UENR Campus",
    streetAddress: "House No. 12, Near Notre Dame Gate",
    items: [
      {
        id: "1",
        itemNameSnapshot: "Sika Signature Jollof Special",
        unitPricePesewas: 6500,
        quantity: 1,
        subtotalPesewas: 6500,
        selectedOptions: ["Charcoal Grilled Tilapia (+GH₵20.00)", "Mild Shito"],
      },
    ],
  };

  const steps = [
    {
      status: "PENDING_CONFIRMATION",
      title: "Order Received",
      desc: "Sent to Sunyani kitchen",
      icon: Clock,
      completed: true,
      current: false,
    },
    {
      status: "CONFIRMED",
      title: "Confirmed",
      desc: "Accepted by chef",
      icon: CheckCircle2,
      completed: true,
      current: false,
    },
    {
      status: "PREPARING",
      title: "Piping Hot & Preparing",
      desc: "Grilling and packaging",
      icon: ChefHat,
      completed: true,
      current: true,
    },
    {
      status: "OUT_FOR_DELIVERY",
      title: "Dispatched for Delivery",
      desc: "Rider en route across Sunyani",
      icon: Bike,
      completed: false,
      current: false,
    },
    {
      status: "COMPLETED",
      title: "Delivered",
      desc: "Enjoy your culinary feast",
      icon: PackageCheck,
      completed: false,
      current: false,
    },
  ];

  return (
    <div className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <div className="rounded-3xl bg-surface-300 border border-border-subtle p-8 sm:p-10 mb-8 text-center relative overflow-hidden">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-950/60 border border-emerald-600/40 text-emerald-400 mx-auto mb-4">
            <CheckCircle2 className="h-8 w-8" />
          </div>

          <span className="text-xs font-bold uppercase tracking-widest text-brand-red">
            Order Confirmed & Logged
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-white mt-1">
            Thank you for ordering, {order.customerName}!
          </h1>
          <p className="text-sm text-gray-300 mt-2">
            Your order reference is{" "}
            <span className="font-mono font-bold text-white bg-surface-100 px-2 py-0.5 rounded">
              {order.orderNumber}
            </span>
          </p>

          <div className="mt-4 flex flex-wrap items-center justify-center gap-3 text-xs">
            <div className="rounded-full bg-surface-100 px-3 py-1 text-gray-300 border border-border-subtle flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-brand-red" />
              <span>Est. Delivery: {order.estimatedMinutes} Mins</span>
            </div>
            <div className="rounded-full bg-emerald-950/40 px-3 py-1 text-emerald-400 border border-emerald-800/40 font-semibold flex items-center gap-1.5">
              <CreditCard className="h-3.5 w-3.5" />
              <span>Payment: {order.paymentStatus}</span>
            </div>
          </div>
        </div>

        <div className="rounded-3xl bg-surface-300 border border-border-subtle p-6 sm:p-8 mb-8">
          <h2 className="font-serif text-xl font-bold text-white mb-6">
            Live Kitchen & Delivery Status
          </h2>

          <div className="relative">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
              {steps.map((step, idx) => {
                const Icon = step.icon;
                return (
                  <div key={idx} className="flex flex-col items-center text-center relative">
                    <div
                      className={`flex h-14 w-14 items-center justify-center rounded-2xl border transition-all ${
                        step.current
                          ? "bg-brand-red border-brand-red-light text-white shadow-glow scale-110"
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
                    <p className="text-xs text-gray-400 mt-1 max-w-[120px]">
                      {step.desc}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <div className="rounded-3xl bg-surface-300 border border-border-subtle p-6">
            <h3 className="font-serif text-lg font-bold text-white mb-4 flex items-center gap-2">
              <MapPin className="h-5 w-5 text-brand-red" />
              Delivery Destination
            </h3>
            <div className="space-y-1.5 text-sm">
              <p className="text-white font-semibold">{order.customerName}</p>
              <p className="text-gray-300">{order.streetAddress}</p>
              <p className="text-brand-red font-medium">{order.locality}, Sunyani</p>
              <p className="text-gray-400 pt-2 text-xs">Phone: {order.recipientPhone}</p>
            </div>
          </div>

          <div className="rounded-3xl bg-surface-300 border border-border-subtle p-6">
            <h3 className="font-serif text-lg font-bold text-white mb-4 flex items-center gap-2">
              <ShoppingBag className="h-5 w-5 text-brand-red" />
              Price Breakdown
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-gray-300">
                <span>Items Subtotal</span>
                <span>{formatPesewasToGhs(order.subtotalPesewas)}</span>
              </div>
              <div className="flex justify-between text-gray-300">
                <span>Delivery Fee ({order.locality})</span>
                <span>{formatPesewasToGhs(order.deliveryFeePesewas)}</span>
              </div>
              <div className="border-t border-border-subtle pt-2 flex justify-between font-bold text-white text-base">
                <span>Grand Total</span>
                <span className="text-brand-red">{formatPesewasToGhs(order.totalPesewas)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center">
          <Link
            href="/menu"
            className="inline-flex items-center gap-2 text-sm font-semibold text-gray-400 hover:text-white transition-colors"
          >
            <span>Return to Menu</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
