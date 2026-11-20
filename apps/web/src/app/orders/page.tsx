"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Compass, LogIn, Receipt, Search } from "lucide-react";
import { formatPesewasToGhs } from "@/lib/currency";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { PageReveal } from "@/components/ui/MotionPrimitives";
import { OrderRowSkeleton } from "@/components/ui/Skeleton";

interface OrderListItem {
  id: string;
  orderNumber: string;
  fulfilmentType: "DELIVERY" | "COLLECTION";
  fulfilmentStatus: string;
  totalPesewas: number;
  createdAt: string;
  items?: Array<{ id: string; itemNameSnapshot: string; quantity: number }>;
}

function getStatusVariant(status: string): "brand" | "neutral" | "success" | "warning" | "error" {
  if (status === "DELIVERED" || status === "COLLECTED") return "success";
  if (status === "CANCELLED" || status === "REJECTED") return "error";
  if (status === "PREPARING" || status === "OUT_FOR_DELIVERY" || status === "READY_FOR_PICKUP") {
    return "brand";
  }
  return "warning";
}

/**
 * Order lookup & live customer order history page.
 * Validates order references via `/api/v1/orders/track/[orderNumber]` before navigating
 * and lists real authenticated user orders via `/api/v1/orders/my-orders`.
 */
export default function OrdersPage() {
  const router = useRouter();
  const [lookupOrderNumber, setLookupOrderNumber] = useState("");
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);

  const [orders, setOrders] = useState<OrderListItem[]>([]);
  const [requiresAuth, setRequiresAuth] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState<string | null>(null);

  const fetchMyOrders = useCallback(async () => {
    setHistoryLoading(true);
    setHistoryError(null);
    setRequiresAuth(false);
    try {
      const res = await fetch("/api/v1/orders/my-orders", { cache: "no-store" });
      if (res.status === 401) {
        setRequiresAuth(true);
        setOrders([]);
        return;
      }
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Unable to load your order history.");
      }
      setOrders(data.orders ?? []);
    } catch (err) {
      setHistoryError(
        err instanceof Error ? err.message : "Unable to load order history right now."
      );
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMyOrders();
  }, [fetchMyOrders]);

  const handleTrackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = lookupOrderNumber.trim().toUpperCase();
    if (!cleaned) {
      setLookupError("Please enter an order reference number (e.g. SIKA-2026-1001).");
      return;
    }

    setLookupLoading(true);
    setLookupError(null);
    try {
      const res = await fetch(`/api/v1/orders/track/${encodeURIComponent(cleaned)}`, {
        cache: "no-store",
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setLookupError(
          data.error || `No order found matching "${cleaned}". Check your receipt and try again.`
        );
        setLookupLoading(false);
        return;
      }
      router.push(`/orders/${encodeURIComponent(cleaned)}`);
    } catch {
      setLookupError("Unable to reach tracking server. Please check your connection.");
      setLookupLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#101010] py-10 sm:py-14 pb-20">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 space-y-10">
        <PageReveal className="space-y-2">
          <span className="font-mono text-[11px] font-bold uppercase tracking-[0.22em] text-[#F0444A]">
            Live Kitchen &amp; Rider Tracking
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl font-black tracking-tight text-white">
            Orders &amp; Delivery Status
          </h1>
          <p className="text-sm text-[#A3A3A3]">
            Look up any Sunyani order by reference number or inspect orders linked to your signed-in account.
          </p>
        </PageReveal>

        {/* Reference Lookup Card */}
        <section className="rounded-3xl border border-[#333333] bg-[#1C1C1C] p-6 sm:p-7 space-y-4">
          <div className="flex items-center gap-2.5">
            <Compass className="h-5 w-5 text-[#F0444A]" aria-hidden="true" />
            <h2 className="font-serif text-xl font-bold text-[#F5F1EA]">
              Track Any Order by Reference
            </h2>
          </div>

          <form onSubmit={handleTrackSubmit} className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#737373]"
                aria-hidden="true"
              />
              <input
                type="text"
                value={lookupOrderNumber}
                onChange={(e) => setLookupOrderNumber(e.target.value)}
                placeholder="Enter reference (e.g. SIKA-2026-1001)"
                aria-label="Order Reference Number"
                className="w-full rounded-xl border border-[#333333] bg-[#262626] pl-10 pr-4 py-3 text-sm text-[#F5F1EA] placeholder-[#737373] focus:outline-none focus:border-[#D71920] font-mono uppercase"
              />
            </div>
            <Button type="submit" variant="primary" size="md" loading={lookupLoading} className="sm:px-6">
              <span>Track Order</span>
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Button>
          </form>

          {lookupError && (
            <div
              role="alert"
              className="rounded-xl border border-[#FB7185]/40 bg-[#FB7185]/10 px-4 py-3 text-xs sm:text-sm text-[#FDA4AF]"
            >
              {lookupError}
            </div>
          )}

          {orders.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-[#A3A3A3]">
              <span>Recent references:</span>
              {orders.slice(0, 2).map((o) => (
                <Link
                  key={o.id}
                  href={`/orders/${o.orderNumber}`}
                  className="rounded-full border border-[#333333] bg-[#262626] hover:border-[#D71920] px-3 py-1 font-mono text-[11px] font-semibold text-[#F5F1EA] transition-colors"
                >
                  {o.orderNumber}
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Account Orders Section */}
        <section className="space-y-4">
          <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#F5F1EA]">
            Account Order History
          </h2>

          {historyLoading ? (
            <div className="space-y-3">
              <OrderRowSkeleton />
              <OrderRowSkeleton />
            </div>
          ) : historyError ? (
            <ErrorState message={historyError} onRetry={fetchMyOrders} />
          ) : requiresAuth ? (
            <EmptyState
              icon={LogIn}
              title="Sign In for Automatic Order History"
              description="Guests can always track orders using the reference box above. Sign in to keep all past and active Sika Cuisine orders in one place."
              action={
                <Link
                  href="/login"
                  className="inline-flex h-11 items-center gap-2 rounded-xl border border-[#333333] bg-[#262626] hover:bg-[#2F2F2F] px-6 text-sm font-semibold text-[#F5F1EA] transition-colors"
                >
                  <LogIn className="h-4 w-4 text-[#F0444A]" aria-hidden="true" />
                  <span>Sign In to Account</span>
                </Link>
              }
            />
          ) : orders.length === 0 ? (
            <EmptyState
              icon={Receipt}
              title="No Orders Found"
              description="Your account has no placed orders yet. Start with our Sunyani menu to place your first pickup or delivery order."
              action={
                <Link
                  href="/menu"
                  className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#D71920] hover:bg-[#A91017] px-6 text-sm font-semibold text-white transition-colors"
                >
                  <span>Browse Menu</span>
                </Link>
              }
            />
          ) : (
            <div className="space-y-3">
              {orders.map((order) => (
                <Link
                  key={order.id}
                  href={`/orders/${order.orderNumber}`}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-[#333333] bg-[#1C1C1C] hover:border-[#D71920]/60 p-5 transition-colors"
                >
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-sm font-bold text-white">
                        {order.orderNumber}
                      </span>
                      <Badge variant={getStatusVariant(order.fulfilmentStatus)}>
                        {order.fulfilmentStatus.replace(/_/g, " ")}
                      </Badge>
                      <Badge variant="neutral">{order.fulfilmentType}</Badge>
                    </div>
                    <p className="text-xs text-[#A3A3A3]">
                      {order.items?.length
                        ? order.items
                            .map((item) => `${item.quantity}x ${item.itemNameSnapshot}`)
                            .join(", ")
                        : "Order items"}
                    </p>
                  </div>

                  <div className="flex sm:flex-col items-center sm:items-end justify-between gap-1">
                    <span className="font-mono text-base font-bold text-[#F0444A] tabular-nums">
                      {formatPesewasToGhs(order.totalPesewas)}
                    </span>
                    <span className="text-[11px] text-[#737373]">
                      {new Date(order.createdAt).toLocaleDateString("en-GH", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
