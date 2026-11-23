"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  CheckCircle2,
  ChefHat,
  Clock,
  CreditCard,
  Flame,
  LogOut,
  PackageCheck,
  Pause,
  Play,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
  UtensilsCrossed,
} from "lucide-react";
import {
  canAccessWorkspace,
  FulfilmentStatus,
  FulfilmentType,
  getDashboardForRole,
} from "@sika/shared";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { PageReveal } from "@/components/ui/MotionPrimitives";
import { OrderRowSkeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/context/ToastContext";

interface KitchenSelectedOption {
  optionId?: string;
  optionName?: string;
  name?: string;
}

interface KitchenOrderItem {
  id: string;
  itemNameSnapshot: string;
  quantity: number;
  selectedOptionsSnapshot?: unknown;
  specialInstructions?: string | null;
}

interface KitchenOrder {
  id: string;
  orderNumber: string;
  guestName?: string | null;
  fulfilmentType: FulfilmentType;
  fulfilmentStatus: FulfilmentStatus;
  customerNotes?: string | null;
  createdAt: string;
  deliveryAddress?: {
    areaLocality: string;
  } | null;
  items: KitchenOrderItem[];
}

interface KitchenMenuItem {
  id: string;
  name: string;
  isAvailable: boolean;
  preparationTimeMinutes?: number;
  category?: {
    id: string;
    name: string;
  } | null;
}

type KitchenTab = "BOARD" | "STOCK";

function extractOptionLabels(snapshot: unknown): string[] {
  if (!Array.isArray(snapshot)) return [];
  const labels: string[] = [];
  for (const entry of snapshot) {
    if (entry && typeof entry === "object") {
      const candidate = entry as KitchenSelectedOption;
      const text = candidate.optionName || candidate.name;
      if (typeof text === "string" && text.trim()) {
        labels.push(text.trim());
      }
    }
  }
  return labels;
}

function getElapsedBadge(createdAt: string, nowMs: number): {
  label: string;
  variant: "neutral" | "warning" | "error";
} {
  const diffMins = Math.max(0, Math.floor((nowMs - new Date(createdAt).getTime()) / 60_000));
  if (diffMins >= 25) {
    return { label: `${diffMins}m waiting`, variant: "error" };
  }
  if (diffMins >= 15) {
    return { label: `${diffMins}m elapsed`, variant: "warning" };
  }
  return { label: diffMins === 0 ? "Just now" : `${diffMins}m elapsed`, variant: "neutral" };
}

/**
 * High-Contrast Kitchen Display System (`/kitchen`).
 * Accessible strictly to `STAFF_KITCHEN` and `ADMIN` (supervision).
 * Zero financial/revenue clutter: shows only order tickets, dish quantities, custom options,
 * special notes, prep timers, and quick 86/Sold-Out toggles.
 */
export default function KitchenDashboardPage() {
  const router = useRouter();
  const { success, error: toastError, info } = useToast();

  const [activeTab, setActiveTab] = useState<KitchenTab>("BOARD");
  const [ticketModeFilter, setTicketModeFilter] = useState<"ALL" | "DELIVERY" | "COLLECTION">("ALL");
  const [stockSearch, setStockSearch] = useState("");

  const [sessionRole, setSessionRole] = useState<string | null>(null);
  const [sessionName, setSessionName] = useState<string>("");
  const [orders, setOrders] = useState<KitchenOrder[]>([]);
  const [menuItems, setMenuItems] = useState<KitchenMenuItem[]>([]);

  const [nowMs, setNowMs] = useState<number>(() => Date.now());
  const [loading, setLoading] = useState(true);
  const [authRequired, setAuthRequired] = useState(false);
  const [redirectingPath, setRedirectingPath] = useState<string | null>(null);
  const [autoRefreshPaused, setAutoRefreshPaused] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [mutatingOrderId, setMutatingOrderId] = useState<string | null>(null);
  const [togglingItemId, setTogglingItemId] = useState<string | null>(null);

  const loadKds = useCallback(
    async (options?: { silent?: boolean }) => {
      const silent = Boolean(options?.silent);
      if (!silent) {
        setLoading(true);
        setLoadError(null);
        setAuthRequired(false);
      }

      try {
        const meRes = await fetch("/api/v1/auth/me", { cache: "no-store" });
        if (meRes.status === 401 || !meRes.ok) {
          setAuthRequired(true);
          if (!silent) setLoading(false);
          return;
        }
        const meData = await meRes.json().catch(() => null);
        const role = meData?.user?.role as string | undefined;
        if (!role) {
          setAuthRequired(true);
          if (!silent) setLoading(false);
          return;
        }
        if (!canAccessWorkspace(role, "kitchen")) {
          const target = getDashboardForRole(role).path;
          setRedirectingPath(target);
          router.replace(target);
          if (!silent) setLoading(false);
          return;
        }

        setSessionRole(role);
        setSessionName(meData?.user?.fullName || "Kitchen Chef");

        const [ordersRes, menuRes] = await Promise.all([
          fetch("/api/v1/admin/orders", { cache: "no-store" }),
          fetch("/api/v1/menu/items?includeUnavailable=true", { cache: "no-store" }),
        ]);

        if (ordersRes.status === 401 || ordersRes.status === 403) {
          setAuthRequired(true);
          if (!silent) setLoading(false);
          return;
        }

        const [ordersData, menuData] = await Promise.all([
          ordersRes.json(),
          menuRes.ok ? menuRes.json() : Promise.resolve({ success: false }),
        ]);

        if (!ordersRes.ok || !ordersData.success) {
          throw new Error(ordersData.error || "Unable to load kitchen ticket board.");
        }

        setOrders(ordersData.orders ?? []);
        if (menuRes.ok && menuData.success) {
          setMenuItems(menuData.items ?? []);
        }
        if (silent) {
          setLoadError(null);
        }
      } catch (err) {
        if (!silent) {
          setLoadError(err instanceof Error ? err.message : "Unable to load Kitchen Display.");
        }
      } finally {
        if (!silent) {
          setLoading(false);
        }
      }
    },
    [router]
  );

  useEffect(() => {
    loadKds();
  }, [loadKds]);

  useEffect(() => {
    if (autoRefreshPaused || authRequired || redirectingPath) return;

    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        loadKds({ silent: true });
      }
    }, 15_000);

    return () => window.clearInterval(timer);
  }, [autoRefreshPaused, authRequired, redirectingPath, loadKds]);

  useEffect(() => {
    const clock = window.setInterval(() => {
      setNowMs(Date.now());
    }, 30_000);
    return () => window.clearInterval(clock);
  }, []);

  const advanceTicket = async (order: KitchenOrder, targetStatus: FulfilmentStatus) => {
    setMutatingOrderId(order.id);
    try {
      const res = await fetch(`/api/v1/orders/${order.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetStatus }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        toastError(
          "Ticket Update Failed",
          data.error || `Cannot move ${order.orderNumber} to ${targetStatus}.`
        );
        return;
      }

      setOrders((prev) =>
        prev.map((o) => (o.id === order.id ? { ...o, fulfilmentStatus: targetStatus } : o))
      );
      success(
        "Ticket Updated",
        `${order.orderNumber} moved to ${targetStatus.replace(/_/g, " ").toLowerCase()}.`
      );
    } catch {
      toastError("Network Error", "Could not reach order status service.");
    } finally {
      setMutatingOrderId(null);
    }
  };

  const handleToggleStock = async (item: KitchenMenuItem) => {
    setTogglingItemId(item.id);
    try {
      const nextAvailability = !item.isAvailable;
      const res = await fetch(`/api/v1/admin/menu/items/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isAvailable: nextAvailability }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        toastError("Stock Toggle Failed", data.error || `Unable to update ${item.name}.`);
        return;
      }

      setMenuItems((prev) =>
        prev.map((m) => (m.id === item.id ? { ...m, isAvailable: nextAvailability } : m))
      );
      success(
        nextAvailability ? "Back on Menu" : "86'd (Sold Out)",
        `${item.name} is now ${nextAvailability ? "available to customers" : "marked Sold Out"}.`
      );
    } catch {
      toastError("Network Error", "Failed to toggle dish availability.");
    } finally {
      setTogglingItemId(null);
    }
  };

  const handleSignOut = async () => {
    await fetch("/api/v1/auth/logout", { method: "POST" }).catch(() => {});
    info("Signed Out", "Kitchen Display session closed.");
    router.push("/admin/login");
    router.refresh();
  };

  const toCookTickets = useMemo(
    () =>
      orders
        .filter((o) => o.fulfilmentStatus === "CONFIRMED")
        .filter((o) => ticketModeFilter === "ALL" || o.fulfilmentType === ticketModeFilter)
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()),
    [orders, ticketModeFilter]
  );

  const cookingNowTickets = useMemo(
    () =>
      orders
        .filter((o) => o.fulfilmentStatus === "PREPARING")
        .filter((o) => ticketModeFilter === "ALL" || o.fulfilmentType === ticketModeFilter)
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()),
    [orders, ticketModeFilter]
  );

  const recentlyPackedTickets = useMemo(
    () =>
      orders
        .filter(
          (o) =>
            o.fulfilmentStatus === "READY_FOR_DISPATCH" ||
            o.fulfilmentStatus === "READY_FOR_PICKUP"
        )
        .filter((o) => ticketModeFilter === "ALL" || o.fulfilmentType === ticketModeFilter)
        .slice(0, 8),
    [orders, ticketModeFilter]
  );

  const pendingCashierCount = useMemo(
    () => orders.filter((o) => o.fulfilmentStatus === "PENDING").length,
    [orders]
  );

  const filteredStockItems = useMemo(() => {
    const q = stockSearch.trim().toLowerCase();
    return menuItems.filter((item) => {
      if (!q) return true;
      return (
        item.name.toLowerCase().includes(q) ||
        (item.category?.name || "").toLowerCase().includes(q)
      );
    });
  }, [menuItems, stockSearch]);

  if (redirectingPath) {
    return (
      <div className="min-h-[calc(100vh-80px)] bg-[#101010] px-4 py-16 flex items-center justify-center">
        <div className="rounded-2xl border border-[#333333] bg-[#1C1C1C] px-6 py-5 text-center space-y-2">
          <p className="font-mono text-xs uppercase tracking-widest text-[#F0444A]">
            Routing to Your Workspace
          </p>
          <p className="text-sm text-[#A3A3A3]">
            Opening your dedicated operational dashboard ({redirectingPath})...
          </p>
        </div>
      </div>
    );
  }

  if (authRequired) {
    return (
      <div className="min-h-[calc(100vh-80px)] bg-[#101010] px-4 py-16 flex items-center justify-center">
        <div className="w-full max-w-lg">
          <EmptyState
            icon={ShieldAlert}
            title="Kitchen Staff Authentication Required"
            description="Sign in with a Kitchen Staff or Super Admin account to view live prep tickets and update cooking progress."
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
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-7">
        {/* Header Bar */}
        <PageReveal className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-[#333333] pb-6">
          <div>
            <span className="font-mono text-[11px] font-bold uppercase tracking-[0.22em] text-[#F0444A]">
              Kitchen Display System &middot; {sessionName}
            </span>
            <h1 className="font-serif text-3xl sm:text-4xl font-black tracking-tight text-white">
              Live Kitchen Ticket Board
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {sessionRole === "ADMIN" && (
              <>
                <Link
                  href="/admin"
                  className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-[#333333] bg-[#1C1C1C] hover:bg-[#262626] px-3 text-xs font-semibold text-[#F5F1EA] transition-colors"
                >
                  <ShieldCheck className="h-3.5 w-3.5 text-[#F0444A]" aria-hidden="true" />
                  <span>Admin Console</span>
                </Link>
                <Link
                  href="/cashier"
                  className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-[#333333] bg-[#1C1C1C] hover:bg-[#262626] px-3 text-xs font-semibold text-[#F5F1EA] transition-colors"
                >
                  <CreditCard className="h-3.5 w-3.5 text-[#F0444A]" aria-hidden="true" />
                  <span>Cashier Desk</span>
                </Link>
              </>
            )}
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setAutoRefreshPaused((prev) => !prev)}
            >
              {autoRefreshPaused ? (
                <>
                  <Play className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Resume Sync</span>
                </>
              ) : (
                <>
                  <Pause className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Auto-Sync (15s)</span>
                </>
              )}
            </Button>
            <Button variant="secondary" size="sm" onClick={() => loadKds()} loading={loading}>
              <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Refresh</span>
            </Button>
            <Button variant="danger" size="sm" onClick={handleSignOut}>
              <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Sign Out</span>
            </Button>
          </div>
        </PageReveal>

        {/* Zero-Financial KDS Workload Bar */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-3.5">
          <div className="rounded-2xl border border-[#D71920]/40 bg-[#1C1C1C] p-3.5 sm:p-4 space-y-1 min-w-0">
            <span className="text-[11px] sm:text-xs font-medium text-[#A3A3A3]">To Cook</span>
            <p className="font-mono text-2xl sm:text-3xl font-black text-[#F0444A] tabular-nums">
              {toCookTickets.length}
            </p>
            <span className="text-[10px] sm:text-[11px] text-[#737373] block truncate">
              Confirmed FIFO tickets
            </span>
          </div>
          <div className="rounded-2xl border border-[#EAB308]/35 bg-[#1C1C1C] p-3.5 sm:p-4 space-y-1 min-w-0">
            <span className="text-[11px] sm:text-xs font-medium text-[#A3A3A3]">Cooking Now</span>
            <p className="font-mono text-2xl sm:text-3xl font-black text-[#FACC15] tabular-nums">
              {cookingNowTickets.length}
            </p>
            <span className="text-[10px] sm:text-[11px] text-[#737373] block truncate">
              Active on stove / grill
            </span>
          </div>
          <div className="rounded-2xl border border-[#22C55E]/35 bg-[#1C1C1C] p-3.5 sm:p-4 space-y-1 min-w-0">
            <span className="text-[11px] sm:text-xs font-medium text-[#A3A3A3]">Packed &amp; Ready</span>
            <p className="font-mono text-2xl sm:text-3xl font-black text-[#4ADE80] tabular-nums">
              {recentlyPackedTickets.length}
            </p>
            <span className="text-[10px] sm:text-[11px] text-[#737373] block truncate">
              For rider or counter
            </span>
          </div>
          <div className="rounded-2xl border border-[#333333] bg-[#1C1C1C] p-3.5 sm:p-4 space-y-1 min-w-0">
            <span className="text-[11px] sm:text-xs font-medium text-[#A3A3A3]">At Cashier</span>
            <p className="font-mono text-2xl sm:text-3xl font-black text-[#F5F1EA] tabular-nums">
              {pendingCashierCount}
            </p>
            <span className="text-[10px] sm:text-[11px] text-[#737373] block truncate">
              Pending counter review
            </span>
          </div>
        </div>

        {/* KDS Mode Tabs & Ticket Type Toggle (Zero Financial Clutter) */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-[#333333] pb-3">
          <div className="flex overflow-x-auto scrollbar-none pb-1 md:pb-0 items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab("BOARD")}
              className={`inline-flex items-center gap-2 rounded-xl px-3.5 sm:px-4 py-2 text-xs sm:text-sm font-semibold transition-all whitespace-nowrap shrink-0 ${
                activeTab === "BOARD"
                  ? "bg-[#D71920] text-white"
                  : "bg-[#1C1C1C] text-[#A3A3A3] hover:text-white border border-[#333333]"
              }`}
            >
              <ChefHat className="h-4 w-4" aria-hidden="true" />
              <span>Live Ticket Board ({toCookTickets.length + cookingNowTickets.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("STOCK")}
              className={`inline-flex items-center gap-2 rounded-xl px-3.5 sm:px-4 py-2 text-xs sm:text-sm font-semibold transition-all whitespace-nowrap shrink-0 ${
                activeTab === "STOCK"
                  ? "bg-[#D71920] text-white"
                  : "bg-[#1C1C1C] text-[#A3A3A3] hover:text-white border border-[#333333]"
              }`}
            >
              <UtensilsCrossed className="h-4 w-4" aria-hidden="true" />
              <span>86 / Sold Out Items</span>
            </button>
          </div>

          {activeTab === "BOARD" && (
            <div className="flex overflow-x-auto scrollbar-none pb-1 md:pb-0 items-center gap-1.5">
              {(
                [
                  { id: "ALL", label: "All Tickets" },
                  { id: "DELIVERY", label: "Delivery Only" },
                  { id: "COLLECTION", label: "Pickup Only" },
                ] as const
              ).map((pill) => (
                <button
                  key={pill.id}
                  type="button"
                  onClick={() => setTicketModeFilter(pill.id)}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold border transition-colors whitespace-nowrap shrink-0 ${
                    ticketModeFilter === pill.id
                      ? "border-[#D71920] bg-[#D71920]/15 text-[#F0444A]"
                      : "border-[#333333] bg-[#1C1C1C] text-[#A3A3A3] hover:text-white"
                  }`}
                >
                  {pill.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {loadError ? (
          <ErrorState message={loadError} onRetry={() => loadKds()} />
        ) : loading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <OrderRowSkeleton />
            <OrderRowSkeleton />
          </div>
        ) : activeTab === "BOARD" ? (
          <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
              {/* Column 1: Confirmed Queue to Cook */}
              <section aria-labelledby="kds-to-cook-heading" className="space-y-4">
                <div className="flex items-center justify-between rounded-2xl border border-[#D71920]/40 bg-[#D71920]/10 px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-[#F0444A]" aria-hidden="true" />
                    <h2
                      id="kds-to-cook-heading"
                      className="font-serif text-lg font-bold text-[#F5F1EA]"
                    >
                      Confirmed &mdash; Queue to Cook
                    </h2>
                  </div>
                  <Badge variant="brand">{toCookTickets.length}</Badge>
                </div>

                {toCookTickets.length === 0 ? (
                  <div className="rounded-3xl border border-dashed border-[#333333] bg-[#1C1C1C]/50 p-8 text-center text-xs text-[#A3A3A3]">
                    No confirmed orders waiting to start cooking.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {toCookTickets.map((order) => {
                      const elapsed = getElapsedBadge(order.createdAt, nowMs);
                      const isMutating = mutatingOrderId === order.id;

                      return (
                        <article
                          key={order.id}
                          className="rounded-3xl border border-[#333333] bg-[#1C1C1C] p-4 sm:p-6 space-y-4 shadow-xl min-w-0"
                        >
                          <div className="flex items-start justify-between gap-2.5">
                            <div className="min-w-0 flex-1 space-y-1.5">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-mono text-lg sm:text-xl font-black text-white">
                                  {order.orderNumber}
                                </span>
                                <Badge
                                  variant={
                                    order.fulfilmentType === "COLLECTION" ? "neutral" : "brand"
                                  }
                                >
                                  {order.fulfilmentType === "COLLECTION"
                                    ? "Counter Pickup"
                                    : order.deliveryAddress?.areaLocality
                                    ? `Delivery · ${order.deliveryAddress.areaLocality}`
                                    : "Delivery"}
                                </Badge>
                              </div>
                              <p className="text-xs text-[#A3A3A3] truncate">
                                {order.guestName ? `Guest: ${order.guestName} · ` : ""}
                                Placed{" "}
                                {new Date(order.createdAt).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </p>
                            </div>
                            <Badge variant={elapsed.variant}>{elapsed.label}</Badge>
                          </div>

                          <ul className="space-y-3 rounded-2xl border border-[#333333] bg-[#262626]/70 p-4">
                            {order.items.map((item) => {
                              const optionLabels = extractOptionLabels(
                                item.selectedOptionsSnapshot
                              );
                              return (
                                <li
                                  key={item.id}
                                  className="space-y-1.5 border-b border-[#333333]/60 pb-2.5 last:border-b-0 last:pb-0"
                                >
                                  <div className="flex items-baseline gap-2.5">
                                    <span className="font-mono text-lg font-black text-[#F0444A] tabular-nums">
                                      {item.quantity}&times;
                                    </span>
                                    <span className="text-base font-bold text-[#F5F1EA] leading-snug">
                                      {item.itemNameSnapshot}
                                    </span>
                                  </div>

                                  {optionLabels.length > 0 && (
                                    <div className="flex flex-wrap gap-1.5 pl-7">
                                      {optionLabels.map((optLabel, idx) => (
                                        <span
                                          key={`${item.id}-opt-${idx}`}
                                          className="rounded-lg border border-[#333333] bg-[#161616] px-2.5 py-0.5 text-[11px] font-semibold text-[#F5F1EA]"
                                        >
                                          + {optLabel}
                                        </span>
                                      ))}
                                    </div>
                                  )}

                                  {item.specialInstructions && (
                                    <p className="ml-7 rounded-xl border border-[#EAB308]/35 bg-[#EAB308]/10 px-3 py-1.5 text-xs font-medium text-[#FACC15]">
                                      Chef Note: {item.specialInstructions}
                                    </p>
                                  )}
                                </li>
                              );
                            })}
                          </ul>

                          {order.customerNotes && (
                            <div className="rounded-2xl border border-[#EAB308]/40 bg-[#EAB308]/10 px-3.5 py-2.5 flex items-start gap-2 text-xs text-[#FACC15]">
                              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" aria-hidden="true" />
                              <span>Order Instruction: {order.customerNotes}</span>
                            </div>
                          )}

                          <Button
                            variant="primary"
                            size="lg"
                            fullWidth
                            loading={isMutating}
                            onClick={() => advanceTicket(order, "PREPARING")}
                          >
                            <Flame className="h-4 w-4" aria-hidden="true" />
                            <span>Start Cooking</span>
                          </Button>
                        </article>
                      );
                    })}
                  </div>
                )}
              </section>

              {/* Column 2: Cooking Now */}
              <section aria-labelledby="kds-cooking-heading" className="space-y-4">
                <div className="flex items-center justify-between rounded-2xl border border-[#EAB308]/40 bg-[#EAB308]/10 px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Flame className="h-4 w-4 text-[#FACC15]" aria-hidden="true" />
                    <h2
                      id="kds-cooking-heading"
                      className="font-serif text-lg font-bold text-[#F5F1EA]"
                    >
                      Cooking Now
                    </h2>
                  </div>
                  <Badge variant="warning">{cookingNowTickets.length}</Badge>
                </div>

                {cookingNowTickets.length === 0 ? (
                  <div className="rounded-3xl border border-dashed border-[#333333] bg-[#1C1C1C]/50 p-8 text-center text-xs text-[#A3A3A3]">
                    No meals currently on the stove. Tap &ldquo;Start Cooking&rdquo; on a ticket
                    to move it here.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {cookingNowTickets.map((order) => {
                      const elapsed = getElapsedBadge(order.createdAt, nowMs);
                      const isMutating = mutatingOrderId === order.id;
                      const readyTarget: FulfilmentStatus =
                        order.fulfilmentType === "COLLECTION"
                          ? "READY_FOR_PICKUP"
                          : "READY_FOR_DISPATCH";

                      return (
                        <article
                          key={order.id}
                          className="rounded-3xl border border-[#EAB308]/45 bg-[#1C1C1C] p-4 sm:p-6 space-y-4 shadow-xl min-w-0"
                        >
                          <div className="flex items-start justify-between gap-2.5">
                            <div className="min-w-0 flex-1 space-y-1.5">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-mono text-lg sm:text-xl font-black text-white">
                                  {order.orderNumber}
                                </span>
                                <Badge
                                  variant={
                                    order.fulfilmentType === "COLLECTION" ? "neutral" : "brand"
                                  }
                                >
                                  {order.fulfilmentType === "COLLECTION"
                                    ? "Counter Pickup"
                                    : order.deliveryAddress?.areaLocality
                                    ? `Delivery · ${order.deliveryAddress.areaLocality}`
                                    : "Delivery"}
                                </Badge>
                              </div>
                              <p className="text-xs text-[#A3A3A3] truncate">
                                {order.guestName ? `Guest: ${order.guestName} · ` : ""}
                                Placed{" "}
                                {new Date(order.createdAt).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </p>
                            </div>
                            <Badge variant={elapsed.variant}>{elapsed.label}</Badge>
                          </div>

                          <ul className="space-y-3 rounded-2xl border border-[#333333] bg-[#262626]/70 p-4">
                            {order.items.map((item) => {
                              const optionLabels = extractOptionLabels(
                                item.selectedOptionsSnapshot
                              );
                              return (
                                <li
                                  key={item.id}
                                  className="space-y-1.5 border-b border-[#333333]/60 pb-2.5 last:border-b-0 last:pb-0"
                                >
                                  <div className="flex items-baseline gap-2.5">
                                    <span className="font-mono text-lg font-black text-[#FACC15] tabular-nums">
                                      {item.quantity}&times;
                                    </span>
                                    <span className="text-base font-bold text-[#F5F1EA] leading-snug">
                                      {item.itemNameSnapshot}
                                    </span>
                                  </div>

                                  {optionLabels.length > 0 && (
                                    <div className="flex flex-wrap gap-1.5 pl-7">
                                      {optionLabels.map((optLabel, idx) => (
                                        <span
                                          key={`${item.id}-opt-${idx}`}
                                          className="rounded-lg border border-[#333333] bg-[#161616] px-2.5 py-0.5 text-[11px] font-semibold text-[#F5F1EA]"
                                        >
                                          + {optLabel}
                                        </span>
                                      ))}
                                    </div>
                                  )}

                                  {item.specialInstructions && (
                                    <p className="ml-7 rounded-xl border border-[#EAB308]/35 bg-[#EAB308]/10 px-3 py-1.5 text-xs font-medium text-[#FACC15]">
                                      Chef Note: {item.specialInstructions}
                                    </p>
                                  )}
                                </li>
                              );
                            })}
                          </ul>

                          {order.customerNotes && (
                            <div className="rounded-2xl border border-[#EAB308]/40 bg-[#EAB308]/10 px-3.5 py-2.5 flex items-start gap-2 text-xs text-[#FACC15]">
                              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" aria-hidden="true" />
                              <span>Order Instruction: {order.customerNotes}</span>
                            </div>
                          )}

                          <Button
                            variant="primary"
                            size="lg"
                            fullWidth
                            loading={isMutating}
                            className="!bg-[#16A34A] hover:!bg-[#15803D]"
                            onClick={() => advanceTicket(order, readyTarget)}
                          >
                            {order.fulfilmentType === "COLLECTION" ? (
                              <>
                                <PackageCheck className="h-4 w-4" aria-hidden="true" />
                                <span>Packed &amp; Ready for Pickup</span>
                              </>
                            ) : (
                              <>
                                <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                                <span>Packed &amp; Ready for Rider</span>
                              </>
                            )}
                          </Button>
                        </article>
                      );
                    })}
                  </div>
                )}
              </section>
            </div>

            {/* Recently Packed Strip */}
            {recentlyPackedTickets.length > 0 && (
              <div className="rounded-2xl border border-[#333333] bg-[#1C1C1C] p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-[#4ADE80]">
                    Recently Packed &amp; Handed Off to Dispatch / Counter
                  </span>
                  <span className="text-xs text-[#737373]">
                    Waiting for pickup or rider departure
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {recentlyPackedTickets.map((ticket) => (
                    <div
                      key={ticket.id}
                      className="inline-flex items-center gap-2 rounded-xl border border-[#22C55E]/30 bg-[#22C55E]/10 px-3 py-1.5 text-xs"
                    >
                      <span className="font-mono font-bold text-[#F5F1EA]">
                        {ticket.orderNumber}
                      </span>
                      <Badge variant="success">
                        {ticket.fulfilmentStatus === "READY_FOR_PICKUP" ? "COUNTER" : "RIDER"}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="font-serif text-xl font-bold text-[#F5F1EA]">
                  86 / Sold Out Dish Strip
                </h2>
                <p className="text-xs text-[#A3A3A3]">
                  Instantly pause dishes when ingredients run low so customers cannot add them to
                  new orders.
                </p>
              </div>

              <div className="relative w-full sm:w-72">
                <Search
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#737373]"
                  aria-hidden="true"
                />
                <input
                  type="search"
                  value={stockSearch}
                  onChange={(e) => setStockSearch(e.target.value)}
                  placeholder="Search menu item..."
                  className="w-full rounded-xl border border-[#333333] bg-[#1C1C1C] pl-10 pr-4 py-2 text-sm text-[#F5F1EA] placeholder-[#737373] focus:outline-none focus:border-[#D71920]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredStockItems.map((item) => {
                const isToggling = togglingItemId === item.id;
                return (
                  <div
                    key={item.id}
                    className="rounded-2xl border border-[#333333] bg-[#1C1C1C] p-4 flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-[#F5F1EA] truncate">{item.name}</p>
                      <span className="text-[11px] text-[#737373]">
                        {item.category?.name || "Kitchen Item"}
                        {item.preparationTimeMinutes
                          ? ` · ~${item.preparationTimeMinutes} min prep`
                          : ""}
                      </span>
                    </div>

                    <Button
                      variant={item.isAvailable ? "secondary" : "danger"}
                      size="sm"
                      loading={isToggling}
                      onClick={() => handleToggleStock(item)}
                    >
                      {item.isAvailable ? "In Stock" : "86 / Sold Out"}
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
