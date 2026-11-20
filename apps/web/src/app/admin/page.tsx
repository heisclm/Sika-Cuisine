"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Banknote,
  ChefHat,
  CreditCard,
  LogOut,
  MapPin,
  PackageCheck,
  RefreshCw,
  Search,
  ShieldAlert,
  TrendingUp,
  UtensilsCrossed,
} from "lucide-react";
import {
  FulfilmentStatus,
  FulfilmentType,
  getAllowedNextStatuses,
} from "@sika/shared";
import { formatPesewasToGhs } from "@/lib/currency";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { PageReveal } from "@/components/ui/MotionPrimitives";
import { OrderRowSkeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/context/ToastContext";

interface AdminOrderItem {
  id: string;
  itemNameSnapshot: string;
  quantity: number;
  subtotalPesewas: number;
  specialInstructions?: string | null;
}

interface AdminOrder {
  id: string;
  orderNumber: string;
  guestName?: string | null;
  guestPhone?: string | null;
  fulfilmentType: FulfilmentType;
  fulfilmentStatus: FulfilmentStatus;
  paymentMethod: "PAYSTACK" | "CASH_ON_DELIVERY" | "CASH_ON_COLLECTION";
  paymentStatus: "PENDING" | "PAID" | "FAILED" | "REFUNDED";
  totalPesewas: number;
  customerNotes?: string | null;
  createdAt: string;
  deliveryAddress?: {
    recipientName: string;
    recipientPhone: string;
    streetAddress: string;
    areaLocality: string;
    landmark?: string | null;
  } | null;
  items: AdminOrderItem[];
}

interface AdminMenuItem {
  id: string;
  name: string;
  slug: string;
  basePricePesewas: number;
  isAvailable: boolean;
  isFeatured: boolean;
  category?: { name: string } | null;
}

type AdminTab = "ORDERS" | "MENU" | "REVENUE";

const STATUS_FILTER_TABS: Array<{ id: string; label: string }> = [
  { id: "ALL", label: "All Active & Past" },
  { id: "PENDING", label: "Pending" },
  { id: "CONFIRMED", label: "Confirmed" },
  { id: "PREPARING", label: "Preparing" },
  { id: "READY_FOR_DISPATCH", label: "Ready Dispatch" },
  { id: "READY_FOR_PICKUP", label: "Ready Pickup" },
  { id: "OUT_FOR_DELIVERY", label: "Out for Delivery" },
  { id: "DELIVERED", label: "Delivered" },
  { id: "COLLECTED", label: "Collected" },
];

const DESTRUCTIVE_TARGETS = new Set<FulfilmentStatus>(["CANCELLED", "REJECTED"]);

function getStatusVariant(status: string): "brand" | "neutral" | "success" | "warning" | "error" {
  if (status === "DELIVERED" || status === "COLLECTED") return "success";
  if (status === "CANCELLED" || status === "REJECTED") return "error";
  if (status === "PENDING") return "warning";
  return "brand";
}

/**
 * Kitchen Display System (KDS) & Staff Operations Dashboard.
 * Reads live orders from `/api/v1/admin/orders` and catalog items (including sold-out
 * items via `?includeUnavailable=true`). Uses `getAllowedNextStatuses()` from `@sika/shared`
 * so staff only trigger state-machine-valid transitions, with `<ConfirmDialog />` guarding
 * order cancellations and rejections.
 */
export default function AdminDashboardPage() {
  const router = useRouter();
  const { success, error: toastError, info } = useToast();

  const [activeTab, setActiveTab] = useState<AdminTab>("ORDERS");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [menuItems, setMenuItems] = useState<AdminMenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [authRequired, setAuthRequired] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [mutatingOrderId, setMutatingOrderId] = useState<string | null>(null);

  const [pendingAbort, setPendingAbort] = useState<{
    order: AdminOrder;
    targetStatus: FulfilmentStatus;
  } | null>(null);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    setAuthRequired(false);
    try {
      const [ordersRes, menuRes] = await Promise.all([
        fetch("/api/v1/admin/orders", { cache: "no-store" }),
        fetch("/api/v1/menu/items?includeUnavailable=true", { cache: "no-store" }),
      ]);

      if (ordersRes.status === 401 || ordersRes.status === 403) {
        setAuthRequired(true);
        setLoading(false);
        return;
      }

      const [ordersData, menuData] = await Promise.all([
        ordersRes.json(),
        menuRes.json(),
      ]);

      if (!ordersRes.ok || !ordersData.success) {
        throw new Error(ordersData.error || "Unable to retrieve kitchen orders.");
      }

      setOrders(ordersData.orders ?? []);
      setMenuItems(menuData.items ?? []);
    } catch (err) {
      setLoadError(
        err instanceof Error ? err.message : "Unable to load kitchen operations data."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const executeStatusTransition = async (
    order: AdminOrder,
    targetStatus: FulfilmentStatus
  ) => {
    setMutatingOrderId(order.id);
    try {
      const bodyPayload: Record<string, string> = { targetStatus };
      if (targetStatus === "REJECTED") {
        bodyPayload.rejectionReason = "Declined via Staff KDS Terminal";
      } else if (targetStatus === "CANCELLED") {
        bodyPayload.cancellationReason = "Cancelled via Staff KDS Terminal";
      }

      const res = await fetch(`/api/v1/orders/${order.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyPayload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        toastError(
          "Transition Blocked",
          data.error || `Cannot move ${order.orderNumber} to ${targetStatus}.`
        );
        return;
      }

      setOrders((prev) =>
        prev.map((item) =>
          item.id === order.id ? { ...item, fulfilmentStatus: targetStatus } : item
        )
      );
      success("Order Updated", `${order.orderNumber} moved to ${targetStatus.replace(/_/g, " ")}.`);
    } catch {
      toastError("Network Error", "Failed to communicate with order status endpoint.");
    } finally {
      setMutatingOrderId(null);
      setPendingAbort(null);
    }
  };

  const handleSignOut = async () => {
    await fetch("/api/v1/auth/logout", { method: "POST" }).catch(() => {});
    info("Signed Out", "Staff terminal session closed.");
    router.push("/admin/login");
    router.refresh();
  };

  const filteredOrders = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return orders.filter((order) => {
      if (statusFilter !== "ALL" && order.fulfilmentStatus !== statusFilter) {
        return false;
      }
      if (!q) return true;
      return (
        order.orderNumber.toLowerCase().includes(q) ||
        (order.guestName || "").toLowerCase().includes(q) ||
        (order.guestPhone || "").includes(q) ||
        (order.deliveryAddress?.recipientName || "").toLowerCase().includes(q)
      );
    });
  }, [orders, statusFilter, searchQuery]);

  const metrics = useMemo(() => {
    const activeOrders = orders.filter(
      (o) => !["DELIVERED", "COLLECTED", "CANCELLED", "REJECTED"].includes(o.fulfilmentStatus)
    );
    const nonAbortedOrders = orders.filter(
      (o) => !["CANCELLED", "REJECTED"].includes(o.fulfilmentStatus)
    );
    const paidOnlinePesewas = nonAbortedOrders
      .filter((o) => o.paymentStatus === "PAID" || o.paymentMethod === "PAYSTACK")
      .filter((o) => o.paymentStatus === "PAID")
      .reduce((acc, o) => acc + o.totalPesewas, 0);

    // Covers both Delivery cash and Counter Collection cash
    const cashOnHandoverPesewas = nonAbortedOrders
      .filter(
        (o) =>
          o.paymentMethod === "CASH_ON_DELIVERY" ||
          o.paymentMethod === "CASH_ON_COLLECTION"
      )
      .reduce((acc, o) => acc + o.totalPesewas, 0);

    const grossOrderValuePesewas = nonAbortedOrders.reduce(
      (acc, o) => acc + o.totalPesewas,
      0
    );

    return {
      totalCount: orders.length,
      activeCount: activeOrders.length,
      paidOnlinePesewas,
      cashOnHandoverPesewas,
      grossOrderValuePesewas,
    };
  }, [orders]);

  if (authRequired) {
    return (
      <div className="min-h-[calc(100vh-80px)] bg-[#101010] px-4 py-16 flex items-center justify-center">
        <div className="w-full max-w-lg">
          <EmptyState
            icon={ShieldAlert}
            title="Staff Authentication Required"
            description="Sign in with an authorized Admin, Cashier, or Kitchen Staff account to manage live orders."
            action={
              <Link
                href="/admin/login"
                className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#D71920] hover:bg-[#A91017] px-6 text-sm font-semibold text-white transition-colors"
              >
                <span>Open Staff Login</span>
              </Link>
            }
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#101010] py-8 sm:py-10 pb-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Header Bar */}
        <PageReveal className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#333333] pb-6">
          <div>
            <span className="font-mono text-[11px] font-bold uppercase tracking-[0.22em] text-[#F0444A]">
              Sika Cuisine Sunyani Operations
            </span>
            <h1 className="font-serif text-3xl sm:text-4xl font-black tracking-tight text-white">
              Kitchen &amp; Dispatch Terminal
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Button variant="secondary" size="sm" onClick={loadDashboard} loading={loading}>
              <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Refresh Queue</span>
            </Button>
            <Button variant="danger" size="sm" onClick={handleSignOut}>
              <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Sign Out</span>
            </Button>
          </div>
        </PageReveal>

        {/* Top KPI Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-2xl border border-[#333333] bg-[#1C1C1C] p-5 space-y-1">
            <span className="text-xs font-medium text-[#A3A3A3]">Active Queue</span>
            <p className="font-mono text-2xl font-black text-[#F0444A] tabular-nums">
              {metrics.activeCount}
            </p>
            <span className="text-[11px] text-[#737373]">
              Out of {metrics.totalCount} total fetched
            </span>
          </div>
          <div className="rounded-2xl border border-[#333333] bg-[#1C1C1C] p-5 space-y-1">
            <span className="text-xs font-medium text-[#A3A3A3]">Settled Online (Paid)</span>
            <p className="font-mono text-2xl font-black text-[#4ADE80] tabular-nums">
              {formatPesewasToGhs(metrics.paidOnlinePesewas)}
            </p>
            <span className="text-[11px] text-[#737373]">Confirmed Paystack settlements</span>
          </div>
          <div className="rounded-2xl border border-[#333333] bg-[#1C1C1C] p-5 space-y-1">
            <span className="text-xs font-medium text-[#A3A3A3]">Cash on Handover</span>
            <p className="font-mono text-2xl font-black text-[#F5F1EA] tabular-nums">
              {formatPesewasToGhs(metrics.cashOnHandoverPesewas)}
            </p>
            <span className="text-[11px] text-[#737373]">
              Delivery &amp; Counter Collection cash
            </span>
          </div>
          <div className="rounded-2xl border border-[#333333] bg-[#1C1C1C] p-5 space-y-1">
            <span className="text-xs font-medium text-[#A3A3A3]">Gross Valid Value</span>
            <p className="font-mono text-2xl font-black text-[#F5F1EA] tabular-nums">
              {formatPesewasToGhs(metrics.grossOrderValuePesewas)}
            </p>
            <span className="text-[11px] text-[#737373]">Excludes cancelled/rejected</span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-2 border-b border-[#333333] pb-3">
          <button
            type="button"
            onClick={() => setActiveTab("ORDERS")}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs sm:text-sm font-semibold transition-colors ${
              activeTab === "ORDERS"
                ? "bg-[#D71920] text-white"
                : "bg-[#1C1C1C] text-[#A3A3A3] hover:text-white border border-[#333333]"
            }`}
          >
            <ChefHat className="h-4 w-4" aria-hidden="true" />
            <span>Orders Queue ({filteredOrders.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("MENU")}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs sm:text-sm font-semibold transition-colors ${
              activeTab === "MENU"
                ? "bg-[#D71920] text-white"
                : "bg-[#1C1C1C] text-[#A3A3A3] hover:text-white border border-[#333333]"
            }`}
          >
            <UtensilsCrossed className="h-4 w-4" aria-hidden="true" />
            <span>Menu Availability ({menuItems.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("REVENUE")}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs sm:text-sm font-semibold transition-colors ${
              activeTab === "REVENUE"
                ? "bg-[#D71920] text-white"
                : "bg-[#1C1C1C] text-[#A3A3A3] hover:text-white border border-[#333333]"
            }`}
          >
            <TrendingUp className="h-4 w-4" aria-hidden="true" />
            <span>Revenue Breakdown</span>
          </button>
        </div>

        {loading && orders.length === 0 ? (
          <div className="space-y-4">
            <OrderRowSkeleton />
            <OrderRowSkeleton />
          </div>
        ) : loadError ? (
          <ErrorState message={loadError} onRetry={loadDashboard} />
        ) : activeTab === "ORDERS" ? (
          <div className="space-y-5">
            {/* Search & Status Filters */}
            <div className="flex flex-col lg:flex-row gap-4 justify-between">
              <div className="relative w-full lg:max-w-sm">
                <Search
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#737373]"
                  aria-hidden="true"
                />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search order #, guest name, phone..."
                  aria-label="Search orders"
                  className="w-full rounded-xl border border-[#333333] bg-[#1C1C1C] pl-10 pr-4 py-2.5 text-sm text-[#F5F1EA] placeholder-[#737373] focus:outline-none focus:border-[#D71920]"
                />
              </div>

              <div className="flex flex-wrap gap-1.5">
                {STATUS_FILTER_TABS.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setStatusFilter(tab.id)}
                    className={`rounded-full px-3 py-1.5 text-xs font-semibold border transition-colors ${
                      statusFilter === tab.id
                        ? "border-[#D71920] bg-[#D71920]/15 text-[#F0444A]"
                        : "border-[#333333] bg-[#1C1C1C] text-[#A3A3A3] hover:text-white"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {filteredOrders.length === 0 ? (
              <EmptyState
                icon={PackageCheck}
                title="No Matching Orders"
                description="Try clearing the search query or switching to a different status filter."
              />
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {filteredOrders.map((order) => {
                  const nextStatuses = getAllowedNextStatuses(
                    order.fulfilmentType,
                    order.fulfilmentStatus
                  );
                  const isMutating = mutatingOrderId === order.id;

                  return (
                    <article
                      key={order.id}
                      className="rounded-3xl border border-[#333333] bg-[#1C1C1C] p-6 space-y-4 flex flex-col justify-between"
                    >
                      <div className="space-y-4">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <h2 className="font-mono text-base font-black text-white">
                                {order.orderNumber}
                              </h2>
                              <Badge variant={getStatusVariant(order.fulfilmentStatus)}>
                                {order.fulfilmentStatus.replace(/_/g, " ")}
                              </Badge>
                              <Badge variant="neutral">{order.fulfilmentType}</Badge>
                            </div>
                            <p className="mt-1 text-xs text-[#A3A3A3]">
                              {order.guestName ||
                                order.deliveryAddress?.recipientName ||
                                "Customer"}{" "}
                              &bull;{" "}
                              <span className="font-mono">
                                {order.guestPhone || order.deliveryAddress?.recipientPhone}
                              </span>
                            </p>
                          </div>

                          <div className="text-right">
                            <p className="font-mono text-lg font-black text-[#F0444A] tabular-nums">
                              {formatPesewasToGhs(order.totalPesewas)}
                            </p>
                            <Badge
                              variant={order.paymentStatus === "PAID" ? "success" : "warning"}
                            >
                              {order.paymentMethod.replace(/_/g, " ")} ({order.paymentStatus})
                            </Badge>
                          </div>
                        </div>

                        {order.fulfilmentType === "DELIVERY" && order.deliveryAddress && (
                          <div className="rounded-2xl border border-[#333333] bg-[#262626] p-3 text-xs text-[#A3A3A3] flex items-start gap-2">
                            <MapPin
                              className="h-4 w-4 text-[#F0444A] flex-shrink-0 mt-0.5"
                              aria-hidden="true"
                            />
                            <div>
                              <span className="font-semibold text-[#F5F1EA]">
                                {order.deliveryAddress.areaLocality}
                              </span>{" "}
                              — {order.deliveryAddress.streetAddress}
                              {order.deliveryAddress.landmark
                                ? ` (${order.deliveryAddress.landmark})`
                                : ""}
                            </div>
                          </div>
                        )}

                        <ul className="space-y-1.5 rounded-2xl border border-[#333333] bg-[#262626]/60 p-3.5 text-xs">
                          {order.items.map((item) => (
                            <li
                              key={item.id}
                              className="flex items-start justify-between gap-2 text-[#F5F1EA]"
                            >
                              <span>
                                <strong className="font-mono text-[#F0444A] mr-1">
                                  {item.quantity}x
                                </strong>
                                {item.itemNameSnapshot}
                                {item.specialInstructions && (
                                  <span className="block pl-5 text-[11px] italic text-[#A3A3A3]">
                                    Note: {item.specialInstructions}
                                  </span>
                                )}
                              </span>
                              <span className="font-mono tabular-nums text-[#A3A3A3]">
                                {formatPesewasToGhs(item.subtotalPesewas)}
                              </span>
                            </li>
                          ))}
                        </ul>

                        {order.customerNotes && (
                          <p className="rounded-xl border border-[#EAB308]/30 bg-[#EAB308]/10 px-3 py-2 text-xs text-[#FACC15]">
                            Guest Note: {order.customerNotes}
                          </p>
                        )}
                      </div>

                      {nextStatuses.length > 0 && (
                        <div className="flex flex-wrap gap-2 border-t border-[#333333] pt-4">
                          {nextStatuses.map((target) => {
                            const isDestructive = DESTRUCTIVE_TARGETS.has(target);
                            return (
                              <Button
                                key={target}
                                variant={isDestructive ? "danger" : "primary"}
                                size="sm"
                                loading={isMutating}
                                onClick={() => {
                                  if (isDestructive) {
                                    setPendingAbort({ order, targetStatus: target });
                                  } else {
                                    executeStatusTransition(order, target);
                                  }
                                }}
                              >
                                {target.replace(/_/g, " ")}
                              </Button>
                            );
                          })}
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        ) : activeTab === "MENU" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {menuItems.map((item) => (
              <div
                key={item.id}
                className="rounded-2xl border border-[#333333] bg-[#1C1C1C] p-5 flex items-start justify-between gap-4"
              >
                <div className="space-y-1 min-w-0">
                  <p className="font-serif text-base font-bold text-[#F5F1EA] truncate">
                    {item.name}
                  </p>
                  <p className="text-xs text-[#A3A3A3]">
                    {item.category?.name || "Menu Item"}
                  </p>
                  <p className="font-mono text-sm font-bold text-[#F0444A] tabular-nums pt-1">
                    {formatPesewasToGhs(item.basePricePesewas)}
                  </p>
                </div>

                <Badge variant={item.isAvailable ? "success" : "error"}>
                  {item.isAvailable ? "Available" : "Sold Out"}
                </Badge>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="rounded-3xl border border-[#333333] bg-[#1C1C1C] p-6 space-y-4">
              <div className="flex items-center gap-2.5">
                <CreditCard className="h-5 w-5 text-[#F0444A]" aria-hidden="true" />
                <h2 className="font-serif text-xl font-bold text-[#F5F1EA]">
                  Paystack Electronic Settlement
                </h2>
              </div>
              <p className="font-mono text-3xl font-black text-[#4ADE80] tabular-nums">
                {formatPesewasToGhs(metrics.paidOnlinePesewas)}
              </p>
              <p className="text-xs text-[#A3A3A3]">
                Verified paid orders across MTN MoMo, Telecel Cash, and card payments.
              </p>
            </div>

            <div className="rounded-3xl border border-[#333333] bg-[#1C1C1C] p-6 space-y-4">
              <div className="flex items-center gap-2.5">
                <Banknote className="h-5 w-5 text-[#F0444A]" aria-hidden="true" />
                <h2 className="font-serif text-xl font-bold text-[#F5F1EA]">
                  Cash on Handover (Delivery &amp; Collection)
                </h2>
              </div>
              <p className="font-mono text-3xl font-black text-[#F5F1EA] tabular-nums">
                {formatPesewasToGhs(metrics.cashOnHandoverPesewas)}
              </p>
              <p className="text-xs text-[#A3A3A3]">
                Combines non-cancelled Cash on Delivery drops and Cash on Collection counter orders.
              </p>
            </div>
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={Boolean(pendingAbort)}
        title={
          pendingAbort?.targetStatus === "REJECTED"
            ? `Reject Order ${pendingAbort.order.orderNumber}?`
            : `Cancel Order ${pendingAbort?.order.orderNumber ?? ""}?`
        }
        description="This terminal transition stops preparation and records an immutable audit event."
        confirmLabel={
          pendingAbort?.targetStatus === "REJECTED" ? "Reject Order" : "Cancel Order"
        }
        destructive
        loading={Boolean(pendingAbort && mutatingOrderId === pendingAbort.order.id)}
        onConfirm={() => {
          if (pendingAbort) {
            executeStatusTransition(pendingAbort.order, pendingAbort.targetStatus);
          }
        }}
        onCancel={() => setPendingAbort(null)}
      />
    </div>
  );
}
