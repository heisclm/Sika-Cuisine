"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  Clock,
  CheckCircle2,
  ChefHat,
  Bike,
  Package,
  MapPin,
  ArrowRight,
  Phone,
  MessageCircle,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { formatPesewasToGhs } from "@/lib/currency";
import { useCart } from "@/context/CartContext";

interface OrderSummary {
  orderNumber: string;
  createdAt: string;
  fulfilmentStatus: "PENDING_CONFIRMATION" | "CONFIRMED" | "PREPARING" | "OUT_FOR_DELIVERY" | "COMPLETED";
  fulfilmentType: "DELIVERY" | "COLLECTION";
  totalPesewas: number;
  locality: string;
  items: {
    name: string;
    quantity: number;
    options?: string;
  }[];
}

const SAMPLE_ORDERS: OrderSummary[] = [
  {
    orderNumber: "SIKA-2026-1042",
    createdAt: "Today at 1:15 PM",
    fulfilmentStatus: "PREPARING",
    fulfilmentType: "DELIVERY",
    totalPesewas: 10000,
    locality: "Fiapre & UENR Campus",
    items: [
      { name: "SIKA Special Combo (De Mixture)", quantity: 1, options: "Standard combo mixture" },
    ],
  },
  {
    orderNumber: "SIKA-2026-1001",
    createdAt: "Yesterday at 6:40 PM",
    fulfilmentStatus: "COMPLETED",
    fulfilmentType: "DELIVERY",
    totalPesewas: 10000,
    locality: "Fiapre & UENR Campus",
    items: [
      { name: "Tilapia with Banku (Chilli)", quantity: 1, options: "Extra hot chilli pepper" },
    ],
  },
  {
    orderNumber: "SIKA-2026-0985",
    createdAt: "14 Oct 2026",
    fulfilmentStatus: "COMPLETED",
    fulfilmentType: "COLLECTION",
    totalPesewas: 4000,
    locality: "Sunyani Central Counter",
    items: [
      { name: "Grilled Chicken with Jollof Rice", quantity: 1, options: "Spicy quarter chicken" },
    ],
  },
];

export default function OrdersHubPage() {
  const router = useRouter();
  const { addItem } = useCart();
  const [lookupOrderNumber, setLookupOrderNumber] = useState("");
  const [lookupPhone, setLookupPhone] = useState("");
  const [lookupError, setLookupError] = useState<string | null>(null);

  const handleLookup = (e: React.FormEvent) => {
    e.preventDefault();
    setLookupError(null);

    const cleanRef = lookupOrderNumber.trim().toUpperCase();
    if (!cleanRef) {
      setLookupError("Please enter your Sika order reference (e.g. SIKA-2026-1042).");
      return;
    }

    router.push(`/orders/${cleanRef}`);
  };

  const getStatusBadge = (status: OrderSummary["fulfilmentStatus"]) => {
    switch (status) {
      case "PENDING_CONFIRMATION":
        return {
          label: "Order Placed",
          color: "bg-amber-950/50 text-amber-300 border-amber-800",
          icon: Clock,
        };
      case "CONFIRMED":
        return {
          label: "Kitchen Confirmed",
          color: "bg-blue-950/50 text-blue-300 border-blue-800",
          icon: CheckCircle2,
        };
      case "PREPARING":
        return {
          label: "Piping Hot & Preparing",
          color: "bg-brand-red/15 text-brand-red border-brand-red/30",
          icon: ChefHat,
        };
      case "OUT_FOR_DELIVERY":
        return {
          label: "Out for Delivery",
          color: "bg-purple-950/50 text-purple-300 border-purple-800",
          icon: Bike,
        };
      case "COMPLETED":
        return {
          label: "Delivered",
          color: "bg-emerald-950/50 text-emerald-300 border-emerald-800",
          icon: CheckCircle2,
        };
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="border-b border-border-subtle bg-surface-300 py-14 sm:py-20 text-center relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[300px] bg-brand-red/5 blur-[100px] pointer-events-none -z-10" />
        <div className="mx-auto max-w-4xl px-4">
          <span className="text-xs font-bold uppercase tracking-widest text-brand-red flex items-center justify-center gap-1.5 mb-2">
            <Sparkles className="h-4 w-4" /> Real-Time Kitchen Dispatch
          </span>
          <h1 className="font-serif text-3xl sm:text-5xl font-black text-white">
            Track Delivery & Orders
          </h1>
          <p className="mt-3 text-sm sm:text-base text-gray-300 max-w-xl mx-auto font-light">
            Check the live preparation status of your culinary feast or view your order history across Sunyani.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 -mt-8">
        <div className="rounded-3xl bg-surface-300 border border-border-subtle p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
          <h2 className="font-serif text-lg sm:text-xl font-bold text-white mb-2 flex items-center gap-2">
            <Search className="h-5 w-5 text-brand-red" />
            <span>Instant Guest Food Tracker</span>
          </h2>
          <p className="text-xs text-gray-400 mb-6">
            Enter your order reference received via SMS, Paystack receipt, or on-screen confirmation.
          </p>

          <form onSubmit={handleLookup} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
              <div className="sm:col-span-6">
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                  Order Reference *
                </label>
                <input
                  type="text"
                  required
                  value={lookupOrderNumber}
                  onChange={(e) => setLookupOrderNumber(e.target.value)}
                  placeholder="e.g. SIKA-2026-1042"
                  className="w-full rounded-xl bg-surface-200 border border-border-subtle px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-brand-red font-mono uppercase"
                />
              </div>

              <div className="sm:col-span-4">
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                  Phone Number (Optional)
                </label>
                <input
                  type="tel"
                  value={lookupPhone}
                  onChange={(e) => setLookupPhone(e.target.value)}
                  placeholder="0244123456"
                  className="w-full rounded-xl bg-surface-200 border border-border-subtle px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-brand-red"
                />
              </div>

              <div className="sm:col-span-2 flex items-end">
                <button
                  type="submit"
                  className="btn-red-gradient flex w-full items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-white shadow-glow"
                >
                  <span>Track</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            {lookupError && (
              <p className="text-xs text-brand-red font-medium">{lookupError}</p>
            )}

            <div className="pt-2 flex flex-wrap items-center gap-2 text-xs text-gray-400">
              <span>Quick Demo References:</span>
              <button
                type="button"
                onClick={() => setLookupOrderNumber("SIKA-2026-1042")}
                className="font-mono bg-surface-200 hover:bg-surface-100 border border-white/5 text-gray-300 px-2.5 py-1 rounded-lg text-[11px] transition-colors"
              >
                SIKA-2026-1042
              </button>
              <button
                type="button"
                onClick={() => setLookupOrderNumber("SIKA-2026-1001")}
                className="font-mono bg-surface-200 hover:bg-surface-100 border border-white/5 text-gray-300 px-2.5 py-1 rounded-lg text-[11px] transition-colors"
              >
                SIKA-2026-1001
              </button>
            </div>
          </form>
        </div>

        <div className="mt-12 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-serif text-2xl font-bold text-white">
                Recent Orders in Sunyani
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">
                Saved orders from this browser session
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {SAMPLE_ORDERS.map((order) => {
              const badge = getStatusBadge(order.fulfilmentStatus);
              const BadgeIcon = badge.icon;

              return (
                <div
                  key={order.orderNumber}
                  className="rounded-3xl bg-surface-300 border border-border-subtle p-6 transition-all hover:border-brand-red/40 space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border-subtle/70 pb-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-bold text-white">
                          {order.orderNumber}
                        </span>
                        <span className="text-xs text-gray-500">&bull;</span>
                        <span className="text-xs text-gray-400">{order.createdAt}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-gray-400">
                        <MapPin className="h-3.5 w-3.5 text-brand-red" />
                        <span>{order.locality}</span>
                        <span className="text-gray-500">&bull;</span>
                        <span className="capitalize">{order.fulfilmentType.toLowerCase()}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${badge.color}`}
                      >
                        <BadgeIcon className="h-3.5 w-3.5" />
                        <span>{badge.label}</span>
                      </div>
                      <span className="font-serif text-lg font-bold text-white">
                        {formatPesewasToGhs(order.totalPesewas)}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      {order.items.map((item, idx) => (
                        <p key={idx} className="text-sm font-medium text-gray-200">
                          {item.quantity}x {item.name}
                          {item.options && (
                            <span className="text-xs text-gray-400 block sm:inline sm:ml-2">
                              ({item.options})
                            </span>
                          )}
                        </p>
                      ))}
                    </div>

                    <div className="flex items-center gap-2">
                      <Link
                        href={`/orders/${order.orderNumber}`}
                        className="btn-red-gradient inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold text-white shadow-glow"
                      >
                        <span>View Live Status</span>
                        <ArrowRight className="h-3 w-3" />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-12 rounded-3xl bg-gradient-to-r from-surface-300 via-surface-200 to-surface-300 border border-border-subtle p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-1 text-center sm:text-left">
            <h4 className="font-serif text-lg font-bold text-white flex items-center justify-center sm:justify-start gap-2">
              <MessageCircle className="h-5 w-5 text-emerald-400" />
              <span>Need Direct Kitchen Assistance?</span>
            </h4>
            <p className="text-xs text-gray-400 max-w-md leading-relaxed">
              Our dispatch team in Sunyani is on standby. Message us with your order reference on WhatsApp for immediate updates.
            </p>
          </div>
          <a
            href="https://wa.me/233533376760?text=Hello%20Sika%20Cuisine,%20I%20need%20assistance%20with%20my%20order"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs tracking-wide shadow-glow transition-colors flex-shrink-0"
          >
            <Phone className="h-4 w-4" />
            <span>WhatsApp Dispatch (0533376760)</span>
          </a>
        </div>
      </div>
    </div>
  );
}
