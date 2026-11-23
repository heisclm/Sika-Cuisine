"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Banknote,
  Bike,
  CheckCircle2,
  Clock,
  LogOut,
  MapPin,
  Navigation,
  Pause,
  Phone,
  Play,
  RefreshCw,
  ShieldAlert,
} from "lucide-react";
import { formatFirstName, formatFulfilmentStatusLabel, FulfilmentStatus } from "@sika/shared";
import { formatPesewasToGhs } from "@/lib/currency";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { PageReveal } from "@/components/ui/MotionPrimitives";
import { OrderRowSkeleton } from "@/components/ui/Skeleton";
import { useCart } from "@/context/CartContext";
import { useToast } from "@/context/ToastContext";

interface RiderOrder {
  id: string;
  orderNumber: string;
  guestName?: string | null;
  guestPhone?: string | null;
  fulfilmentStatus: FulfilmentStatus;
  paymentMethod: string;
  paymentStatus: string;
  totalPesewas: number;
  customerNotes?: string | null;
  createdAt: string;
  deliveryAddress?: {
    recipientName: string;
    recipientPhone: string;
    streetAddress: string;
    areaLocality: string;
    landmark?: string | null;
    deliveryNotes?: string | null;
  } | null;
  items: Array<{ id: string; itemNameSnapshot: string; quantity: number }>;
}

/**
 * Delivery Rider Dispatch Console backed by `/api/v1/rider/orders`.
 * Advances courier-owned delivery drops across `READY_FOR_DISPATCH -> OUT_FOR_DELIVERY -> DELIVERED`.
 */
export default function RiderDashboardPage() {
  const router = useRouter();
  const { clearCartOnSignOut } = useCart();
  const { success, error: toastError, info } = useToast();

  const [riderName, setRiderName] = useState("Sunyani Rider");
  const [orders, setOrders] = useState<RiderOrder[]>([]);
  const [activeFilter, setActiveFilter] = useState<"ALL" | "READY" | "OUT" | "COD">("ALL");
  const [completedDateRange, setCompletedDateRange] = useState<"today" | "7d" | "30d">("today");
  const [completedPayFilter, setCompletedPayFilter] = useState<"ALL" | "COD" | "PREPAID">("ALL");
  const [loading, setLoading] = useState(true);
  const [authRequired, setAuthRequired] = useState(false);
  const [autoRefreshPaused, setAutoRefreshPaused] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [mutatingId, setMutatingId] = useState<string | null>(null);
  const [pendingDeliverOrder, setPendingDeliverOrder] = useState<RiderOrder | null>(null);

  const loadAssignedDeliveries = useCallback(async (options?: { silent?: boolean }) => {
    const silent = Boolean(options?.silent);
    if (!silent) {
      setLoading(true);
      setLoadError(null);
      setAuthRequired(false);
    }
    try {
      const res = await fetch(
        `/api/v1/rider/orders?dateRange=${encodeURIComponent(completedDateRange)}`,
        { cache: "no-store" }
      );
      if (res.status === 401 || res.status === 403) {
        setAuthRequired(true);
        if (!silent) setLoading(false);
        return;
      }

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Unable to retrieve assigned delivery queue.");
      }

      setRiderName(data.riderName || "Delivery Rider");
      setOrders(data.orders ?? []);
      if (silent) {
        setLoadError(null);
      }
    } catch (err) {
      if (!silent) {
        setLoadError(
          err instanceof Error ? err.message : "Unable to load assigned deliveries."
        );
      }
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  }, [completedDateRange]);

  useEffect(() => {
    loadAssignedDeliveries();
  }, [loadAssignedDeliveries]);

  useEffect(() => {
    if (autoRefreshPaused || authRequired) return;

    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        loadAssignedDeliveries({ silent: true });
      }
    }, 15_000);

    return () => window.clearInterval(timer);
  }, [autoRefreshPaused, authRequired, loadAssignedDeliveries]);

  const advanceDrop = async (
    order: RiderOrder,
    targetStatus: "OUT_FOR_DELIVERY" | "DELIVERED"
  ) => {
    setMutatingId(order.id);
    try {
      const res = await fetch(`/api/v1/orders/${order.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetStatus }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        toastError(
          "Update Failed",
          data.error || `Unable to move ${order.orderNumber} to ${targetStatus}.`
        );
        return;
      }

      setOrders((prev) =>
        prev.map((item) =>
          item.id === order.id ? { ...item, fulfilmentStatus: targetStatus } : item
        )
      );
      success(
        targetStatus === "OUT_FOR_DELIVERY" ? "Dispatched" : "Drop Completed",
        `${order.orderNumber} is now ${targetStatus.replace(/_/g, " ").toLowerCase()}.`
      );
    } catch {
      toastError("Network Error", "Could not update delivery status.");
    } finally {
      setMutatingId(null);
      setPendingDeliverOrder(null);
    }
  };

  const handleSignOut = async () => {
    await fetch("/api/v1/auth/logout", { method: "POST" }).catch(() => {});
    clearCartOnSignOut();
    info("Signed Out", "Rider dispatch session ended.");
    router.push("/rider/login");
    router.refresh();
  };

  const { activeDrops, completedDrops, filteredActiveDrops, filteredCompletedDrops } =
    useMemo(() => {
      const active = orders.filter(
        (o) =>
          o.fulfilmentStatus === "READY_FOR_DISPATCH" ||
          o.fulfilmentStatus === "OUT_FOR_DELIVERY"
      );
      const completed = orders.filter((o) => o.fulfilmentStatus === "DELIVERED");

      const filtActive = active.filter((o) => {
        if (activeFilter === "READY") return o.fulfilmentStatus === "READY_FOR_DISPATCH";
        if (activeFilter === "OUT") return o.fulfilmentStatus === "OUT_FOR_DELIVERY";
        if (activeFilter === "COD") {
          return o.paymentMethod === "CASH_ON_DELIVERY" && o.paymentStatus !== "PAID";
        }
        return true;
      });

      const filtCompleted = completed.filter((o) => {
        if (completedPayFilter === "COD") return o.paymentMethod === "CASH_ON_DELIVERY";
        if (completedPayFilter === "PREPAID") return o.paymentMethod !== "CASH_ON_DELIVERY";
        return true;
      });

      return {
        activeDrops: active,
        completedDrops: completed,
        filteredActiveDrops: filtActive,
        filteredCompletedDrops: filtCompleted,
      };
    }, [orders, activeFilter, completedPayFilter]);

  if (authRequired) {
    return (
      <div className="min-h-[calc(100vh-80px)] bg-[#101010] px-4 py-16 flex items-center justify-center">
        <div className="w-full max-w-lg">
          <EmptyState
            icon={ShieldAlert}
            title="Delivery Rider Login Required"
            description="Sign in with a verified DELIVERY_RIDER account to access your active Sunyani dispatch queue."
            action={
              <Link
                href="/rider/login"
                className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#D71920] hover:bg-[#A91017] px-6 text-sm font-semibold text-white transition-colors"
              >
                <span>Open Rider Login</span>
              </Link>
            }
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#101010] py-8 sm:py-10 pb-20">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 space-y-8">
        <PageReveal className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#333333] pb-6">
          <div className="min-w-0">
            <span className="font-mono text-[11px] font-bold uppercase tracking-[0.22em] text-[#F0444A]">
              Sunyani Courier Portal
            </span>
            <h1 className="font-serif text-3xl sm:text-4xl font-black tracking-tight text-white truncate">
              {formatFirstName(riderName, "Rider")} · Dispatch
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setAutoRefreshPaused((prev) => !prev)}
            >
              {autoRefreshPaused ? (
                <>
                  <Play className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Resume Auto-Sync</span>
                </>
              ) : (
                <>
                  <Pause className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Pause Auto-Sync (15s)</span>
                </>
              )}
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => loadAssignedDeliveries()}
              loading={loading}
            >
              <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Sync Drops</span>
            </Button>
            <Button variant="danger" size="sm" onClick={handleSignOut}>
              <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Sign Out</span>
            </Button>
          </div>
        </PageReveal>

        {loading && orders.length === 0 ? (
          <div className="space-y-4">
            <OrderRowSkeleton />
            <OrderRowSkeleton />
          </div>
        ) : loadError ? (
          <ErrorState message={loadError} onRetry={loadAssignedDeliveries} />
        ) : (
          <div className="space-y-10">
            {/* Active Drops */}
            <section className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="font-serif text-xl font-bold text-[#F5F1EA] flex items-center gap-2">
                  <Bike className="h-5 w-5 text-[#F0444A]" aria-hidden="true" />
                  <span>Active Drops ({filteredActiveDrops.length})</span>
                </h2>

                <div className="flex overflow-x-auto scrollbar-none pb-1 sm:flex-wrap sm:overflow-visible items-center gap-1.5 w-full sm:w-auto">
                  {(
                    [
                      { id: "ALL", label: `All (${activeDrops.length})` },
                      { id: "READY", label: "Ready Pickup" },
                      { id: "OUT", label: "En Route" },
                      { id: "COD", label: "COD Only" },
                    ] as const
                  ).map((pill) => (
                    <button
                      key={pill.id}
                      type="button"
                      onClick={() => setActiveFilter(pill.id)}
                      className={`rounded-full px-3 py-1 text-xs font-semibold border transition-colors whitespace-nowrap shrink-0 ${
                        activeFilter === pill.id
                          ? "border-[#D71920] bg-[#D71920]/15 text-[#F0444A]"
                          : "border-[#333333] bg-[#1C1C1C] text-[#A3A3A3] hover:text-white"
                      }`}
                    >
                      {pill.label}
                    </button>
                  ))}
                </div>
              </div>

              {filteredActiveDrops.length === 0 ? (
                <EmptyState
                  icon={Bike}
                  title={
                    activeFilter === "ALL"
                      ? "No Pending Delivery Drops"
                      : "No Matching Active Drops"
                  }
                  description={
                    activeFilter === "ALL"
                      ? "Assigned kitchen orders ready for dispatch or currently on your route will appear here automatically once assigned."
                      : "Try clearing your active drop filter pill."
                  }
                />
              ) : (
                <div className="space-y-4">
                  {filteredActiveDrops.map((order) => {
                    const phone =
                      order.deliveryAddress?.recipientPhone || order.guestPhone || "";
                    const recipient =
                      order.deliveryAddress?.recipientName || order.guestName || "Customer";
                    const cashToCollect =
                      order.paymentMethod === "CASH_ON_DELIVERY" &&
                      order.paymentStatus !== "PAID";

                    return (
                      <article
                        key={order.id}
                        className="rounded-3xl border border-[#333333] bg-[#1C1C1C] p-4 sm:p-6 space-y-4 min-w-0"
                      >
                        <div className="space-y-2">
                          <div className="flex items-start justify-between gap-3">
                            <span className="font-mono text-sm sm:text-base font-black text-white min-w-0 truncate">
                              {order.orderNumber}
                            </span>
                            <p className="font-mono text-base sm:text-lg font-black text-[#F0444A] tabular-nums shrink-0">
                              {formatPesewasToGhs(order.totalPesewas)}
                            </p>
                          </div>

                          <div className="flex flex-wrap items-center gap-1.5">
                            <Badge
                              variant={
                                order.fulfilmentStatus === "OUT_FOR_DELIVERY"
                                  ? "brand"
                                  : "warning"
                              }
                            >
                              {formatFulfilmentStatusLabel(order.fulfilmentStatus)}
                            </Badge>
                            {cashToCollect ? (
                              <Badge variant="warning">
                                <Banknote className="h-3 w-3" aria-hidden="true" />
                                Collect Cash
                              </Badge>
                            ) : (
                              <Badge variant="success">Already Settled</Badge>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="text-sm font-semibold text-[#F5F1EA] break-words">
                              {recipient}
                            </p>
                            <span className="inline-flex items-center gap-1 font-mono text-[11px] text-[#A3A3A3]">
                              <Clock className="h-3 w-3 shrink-0 text-[#737373]" aria-hidden="true" />
                              {new Date(order.createdAt).toLocaleDateString("en-GH", {
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                        </div>

                        {order.deliveryAddress && (
                          <div className="rounded-2xl border border-[#333333] bg-[#262626] p-3.5 sm:p-4 space-y-1.5 text-sm">
                            <div className="flex items-start gap-2">
                              <MapPin
                                className="h-4 w-4 text-[#F0444A] flex-shrink-0 mt-0.5"
                                aria-hidden="true"
                              />
                              <div className="min-w-0">
                                <p className="font-semibold text-[#F5F1EA]">
                                  {order.deliveryAddress.areaLocality}
                                </p>
                                <p className="text-xs text-[#A3A3A3] break-words">
                                  {order.deliveryAddress.streetAddress}
                                </p>
                                {order.deliveryAddress.landmark && (
                                  <p className="text-xs text-[#737373] mt-0.5 break-words">
                                    Landmark: {order.deliveryAddress.landmark}
                                  </p>
                                )}
                                {(order.deliveryAddress.deliveryNotes ||
                                  order.customerNotes) && (
                                  <p className="mt-1.5 rounded-lg border border-amber-500/25 bg-amber-500/10 px-2.5 py-1.5 text-xs font-medium text-amber-200 break-words">
                                    Note:{" "}
                                    {order.deliveryAddress.deliveryNotes ||
                                      order.customerNotes}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        )}

                        {!order.deliveryAddress && order.customerNotes && (
                          <p className="rounded-xl border border-amber-500/25 bg-amber-500/10 px-3 py-2 text-xs font-medium text-amber-200 break-words">
                            Note: {order.customerNotes}
                          </p>
                        )}

                        <p className="text-xs text-[#A3A3A3]">
                          Items:{" "}
                          {order.items
                            .map((i) => `${i.quantity}x ${i.itemNameSnapshot}`)
                            .join(", ")}
                        </p>

                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 border-t border-[#333333] pt-4">
                          {phone ? (
                            <a
                              href={`tel:${phone.replace(/\s+/g, "")}`}
                              className="inline-flex h-10 w-full sm:w-auto items-center justify-center gap-2 rounded-xl border border-[#333333] bg-[#262626] hover:bg-[#2F2F2F] px-4 text-xs font-semibold text-[#F5F1EA] transition-colors"
                            >
                              <Phone className="h-3.5 w-3.5 text-[#F0444A]" aria-hidden="true" />
                              <span className="font-mono">{phone}</span>
                            </a>
                          ) : (
                            <span className="text-xs text-[#737373]">No phone listed</span>
                          )}

                          {order.fulfilmentStatus === "READY_FOR_DISPATCH" ? (
                            <Button
                              variant="primary"
                              size="sm"
                              className="w-full sm:w-auto"
                              loading={mutatingId === order.id}
                              onClick={() => advanceDrop(order, "OUT_FOR_DELIVERY")}
                            >
                              <Navigation className="h-3.5 w-3.5" aria-hidden="true" />
                              <span>Start Delivery</span>
                            </Button>
                          ) : (
                            <Button
                              variant="primary"
                              size="sm"
                              className="w-full sm:w-auto"
                              loading={mutatingId === order.id}
                              onClick={() => setPendingDeliverOrder(order)}
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                              <span>Mark Delivered</span>
                            </Button>
                          )}
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>

            {/* Completed History */}
            <section className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="font-serif text-lg font-bold text-[#A3A3A3]">
                  Completed Drops ({filteredCompletedDrops.length})
                </h2>

                <div className="flex overflow-x-auto scrollbar-none pb-1 sm:flex-wrap sm:overflow-visible items-center gap-1.5 w-full sm:w-auto">
                  {(
                    [
                      { id: "today", label: "Today" },
                      { id: "7d", label: "7 Days" },
                      { id: "30d", label: "30 Days" },
                    ] as const
                  ).map((win) => (
                    <button
                      key={win.id}
                      type="button"
                      onClick={() => setCompletedDateRange(win.id)}
                      className={`rounded-full px-3 py-1 text-xs font-semibold border transition-colors whitespace-nowrap shrink-0 ${
                        completedDateRange === win.id
                          ? "border-[#D71920] bg-[#D71920]/15 text-[#F0444A]"
                          : "border-[#333333] bg-[#1C1C1C] text-[#A3A3A3] hover:text-white"
                      }`}
                    >
                      {win.label}
                    </button>
                  ))}

                  <span className="h-4 w-px bg-[#333333] mx-0.5 shrink-0" aria-hidden="true" />

                  {(
                    [
                      { id: "ALL", label: "All" },
                      { id: "COD", label: "COD" },
                      { id: "PREPAID", label: "Prepaid" },
                    ] as const
                  ).map((pay) => (
                    <button
                      key={pay.id}
                      type="button"
                      onClick={() => setCompletedPayFilter(pay.id)}
                      className={`rounded-full px-3 py-1 text-xs font-semibold border transition-colors whitespace-nowrap shrink-0 ${
                        completedPayFilter === pay.id
                          ? "border-[#D71920] bg-[#D71920]/15 text-[#F0444A]"
                          : "border-[#333333] bg-[#1C1C1C] text-[#A3A3A3] hover:text-white"
                      }`}
                    >
                      {pay.label}
                    </button>
                  ))}
                </div>
              </div>

              {filteredCompletedDrops.length === 0 ? (
                <p className="rounded-2xl border border-dashed border-[#333333] bg-[#1C1C1C]/50 px-5 py-4 text-xs text-[#737373]">
                  No completed deliveries found for this window and payment mode.
                </p>
              ) : (
                <div className="space-y-2.5">
                  {filteredCompletedDrops.map((order) => (
                    <div
                      key={order.id}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#333333] bg-[#1C1C1C]/70 px-5 py-3.5 text-sm"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="font-mono font-bold text-white">
                          {order.orderNumber}
                        </span>
                        <Badge variant="success">DELIVERED</Badge>
                        <Badge
                          variant={
                            order.paymentMethod === "CASH_ON_DELIVERY"
                              ? "warning"
                              : "neutral"
                          }
                        >
                          {order.paymentMethod === "CASH_ON_DELIVERY"
                            ? "COD CASH"
                            : "PREPAID"}
                        </Badge>
                        <span className="inline-flex items-center gap-1 font-mono text-[11px] text-[#737373]">
                          <Clock className="h-3 w-3 shrink-0" aria-hidden="true" />
                          {new Date(order.createdAt).toLocaleDateString("en-GH", {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      <span className="font-mono font-semibold text-[#A3A3A3] tabular-nums">
                        {formatPesewasToGhs(order.totalPesewas)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={Boolean(pendingDeliverOrder)}
        title={`Confirm Delivery of ${pendingDeliverOrder?.orderNumber ?? ""}?`}
        description="Confirm that the customer has received all items (and settled Cash on Delivery if applicable)."
        confirmLabel="Confirm Delivered"
        destructive={false}
        loading={Boolean(pendingDeliverOrder && mutatingId === pendingDeliverOrder.id)}
        onConfirm={() => {
          if (pendingDeliverOrder) {
            advanceDrop(pendingDeliverOrder, "DELIVERED");
          }
        }}
        onCancel={() => setPendingDeliverOrder(null)}
      />
    </div>
  );
}
