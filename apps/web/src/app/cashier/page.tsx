"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Banknote,
  Bike,
  CheckCircle2,
  ChefHat,
  Clock,
  CreditCard,
  Inbox,
  LogOut,
  MapPin,
  PackageCheck,
  Pause,
  Phone,
  Play,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
  UtensilsCrossed,
  XCircle,
} from "lucide-react";
import {
  canAccessWorkspace,
  formatFulfilmentStatusLabel,
  formatFulfilmentTypeLabel,
  FulfilmentStatus,
  FulfilmentType,
  getDashboardForRole,
  REJECTION_REASON_PRESETS,
} from "@sika/shared";
import { formatPesewasToGhs } from "@/lib/currency";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { PageReveal } from "@/components/ui/MotionPrimitives";
import { Select } from "@/components/ui/Select";
import { OrderRowSkeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/context/ToastContext";

interface CashierOrderItem {
  id: string;
  itemNameSnapshot: string;
  quantity: number;
  subtotalPesewas: number;
  specialInstructions?: string | null;
}

interface CashierOrder {
  id: string;
  orderNumber: string;
  guestName?: string | null;
  guestPhone?: string | null;
  fulfilmentType: FulfilmentType;
  fulfilmentStatus: FulfilmentStatus;
  paymentMethod: "PAYSTACK" | "CASH_ON_DELIVERY" | "CASH_ON_COLLECTION";
  paymentStatus: "PENDING" | "PAID" | "FAILED" | "REFUND_PENDING" | "REFUNDED";
  totalPesewas: number;
  customerNotes?: string | null;
  rejectionReason?: string | null;
  assignedRiderId?: string | null;
  assignedRider?: {
    id: string;
    fullName: string;
    phone: string;
  } | null;
  createdAt: string;
  deliveryAddress?: {
    recipientName: string;
    recipientPhone: string;
    streetAddress: string;
    areaLocality: string;
    landmark?: string | null;
  } | null;
  items: CashierOrderItem[];
}

interface CashierRiderOption {
  id: string;
  fullName: string;
  phone: string;
}

interface CashierMenuItem {
  id: string;
  name: string;
  isAvailable: boolean;
  category?: {
    id: string;
    name: string;
  } | null;
}

type CashierTab = "INCOMING" | "PICKUPS" | "DISPATCH" | "STOCK";

function getStatusVariant(status: string): "brand" | "neutral" | "success" | "warning" | "error" {
  if (status === "DELIVERED" || status === "COLLECTED") return "success";
  if (status === "CANCELLED" || status === "REJECTED") return "error";
  if (status === "PENDING") return "warning";
  return "brand";
}

function getPaymentSummary(order: CashierOrder): {
  label: string;
  variant: "success" | "warning" | "neutral";
} {
  if (order.paymentStatus === "REFUNDED") {
    return {
      label: `Paystack Refunded (${formatPesewasToGhs(order.totalPesewas)})`,
      variant: "neutral",
    };
  }
  if (order.paymentStatus === "REFUND_PENDING") {
    return {
      label: `Refund Processing (${formatPesewasToGhs(order.totalPesewas)})`,
      variant: "warning",
    };
  }
  if (order.paymentStatus === "PAID") {
    return {
      label: `Paid via Paystack (${formatPesewasToGhs(order.totalPesewas)})`,
      variant: "success",
    };
  }
  if (order.paymentMethod === "CASH_ON_COLLECTION") {
    return {
      label: `Collect ${formatPesewasToGhs(order.totalPesewas)} Cash at Counter`,
      variant: "warning",
    };
  }
  if (order.paymentMethod === "CASH_ON_DELIVERY") {
    return {
      label: `Cash on Delivery (${formatPesewasToGhs(order.totalPesewas)})`,
      variant: "warning",
    };
  }
  return {
    label: `Payment Pending (${formatPesewasToGhs(order.totalPesewas)})`,
    variant: "neutral",
  };
}

/**
 * Dedicated Front-Desk Counter & Dispatch Terminal (`/cashier`).
 * Accessible strictly to `STAFF_CASHIER` and `ADMIN` (supervision).
 * Focuses exclusively on incoming order confirmation, counter pickups, delivery rider dispatch,
 * and quick sold-out availability toggles.
 */
export default function CashierDashboardPage() {
  const router = useRouter();
  const { success, error: toastError, info } = useToast();

  const [activeTab, setActiveTab] = useState<CashierTab>("INCOMING");
  const [searchQuery, setSearchQuery] = useState("");
  const [paymentModeFilter, setPaymentModeFilter] = useState<"ALL" | "PAYSTACK" | "CASH">("ALL");
  const [fulfilmentFilter, setFulfilmentFilter] = useState<"ALL" | "DELIVERY" | "COLLECTION">("ALL");
  const [shiftWindow, setShiftWindow] = useState<"today" | "yesterday" | "7d" | "all">("all");
  const [stockSearch, setStockSearch] = useState("");

  const [sessionRole, setSessionRole] = useState<string | null>(null);
  const [sessionName, setSessionName] = useState<string>("");
  const [orders, setOrders] = useState<CashierOrder[]>([]);
  const [riders, setRiders] = useState<CashierRiderOption[]>([]);
  const [menuItems, setMenuItems] = useState<CashierMenuItem[]>([]);

  const [loading, setLoading] = useState(true);
  const [authRequired, setAuthRequired] = useState(false);
  const [redirectingPath, setRedirectingPath] = useState<string | null>(null);
  const [autoRefreshPaused, setAutoRefreshPaused] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [mutatingOrderId, setMutatingOrderId] = useState<string | null>(null);
  const [assigningOrderId, setAssigningOrderId] = useState<string | null>(null);
  const [togglingItemId, setTogglingItemId] = useState<string | null>(null);
  const [pendingRejectOrder, setPendingRejectOrder] = useState<CashierOrder | null>(null);
  const [rejectPreset, setRejectPreset] = useState<string>("");
  const [customRejectReason, setCustomRejectReason] = useState<string>("");

  const loadDesk = useCallback(
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
        if (!canAccessWorkspace(role, "cashier")) {
          const target = getDashboardForRole(role).path;
          setRedirectingPath(target);
          router.replace(target);
          if (!silent) setLoading(false);
          return;
        }

        setSessionRole(role);
        setSessionName(meData?.user?.fullName || "Cashier");

        const ordersUrl =
          shiftWindow !== "all"
            ? `/api/v1/admin/orders?dateRange=${encodeURIComponent(shiftWindow)}`
            : "/api/v1/admin/orders";

        const [ordersRes, ridersRes, menuRes] = await Promise.all([
          fetch(ordersUrl, { cache: "no-store" }),
          fetch("/api/v1/admin/riders", { cache: "no-store" }),
          fetch("/api/v1/menu/items?includeUnavailable=true", { cache: "no-store" }),
        ]);

        if (ordersRes.status === 401 || ordersRes.status === 403) {
          setAuthRequired(true);
          if (!silent) setLoading(false);
          return;
        }

        const [ordersData, ridersData, menuData] = await Promise.all([
          ordersRes.json(),
          ridersRes.ok ? ridersRes.json() : Promise.resolve({ success: false }),
          menuRes.ok ? menuRes.json() : Promise.resolve({ success: false }),
        ]);

        if (!ordersRes.ok || !ordersData.success) {
          throw new Error(ordersData.error || "Unable to load cashier order queues.");
        }

        setOrders(ordersData.orders ?? []);
        if (ridersRes.ok && ridersData.success) {
          setRiders(ridersData.riders ?? []);
        }
        if (menuRes.ok && menuData.success) {
          setMenuItems(menuData.items ?? []);
        }
        if (silent) {
          setLoadError(null);
        }
      } catch (err) {
        if (!silent) {
          setLoadError(err instanceof Error ? err.message : "Unable to load Cashier Desk.");
        }
      } finally {
        if (!silent) {
          setLoading(false);
        }
      }
    },
    [router, shiftWindow]
  );

  useEffect(() => {
    loadDesk();
  }, [loadDesk]);

  useEffect(() => {
    if (autoRefreshPaused || authRequired || redirectingPath) return;

    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        loadDesk({ silent: true });
      }
    }, 15_000);

    return () => window.clearInterval(timer);
  }, [autoRefreshPaused, authRequired, redirectingPath, loadDesk]);

  const effectiveRejectReason = (customRejectReason.trim() || rejectPreset).trim();

  const executeStatusTransition = async (
    order: CashierOrder,
    targetStatus: FulfilmentStatus,
    explicitReason?: string
  ) => {
    setMutatingOrderId(order.id);
    try {
      const bodyPayload: Record<string, string> = { targetStatus };
      if (targetStatus === "REJECTED") {
        bodyPayload.rejectionReason =
          explicitReason?.trim() || "Declined at Front Desk Cashier Terminal";
      }

      const res = await fetch(`/api/v1/orders/${order.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyPayload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        toastError(
          "Action Blocked",
          data.error || `Cannot move ${order.orderNumber} to ${targetStatus}.`
        );
        return;
      }

      setOrders((prev) =>
        prev.map((item) =>
          item.id === order.id
            ? {
                ...item,
                fulfilmentStatus: targetStatus,
                paymentStatus: data.order?.paymentStatus ?? item.paymentStatus,
              }
            : item
        )
      );

      if (targetStatus === "REJECTED" && data.refund) {
        if (data.refund.initiated) {
          success(
            "Order Declined & Paystack Refund Sent",
            `${order.orderNumber} rejected and automatic Paystack refund initiated.`
          );
        } else if (data.refund.error) {
          toastError(
            "Order Declined — Refund Retry Needed",
            `Order rejected, but automatic Paystack refund failed: ${data.refund.error}`
          );
        } else {
          success("Order Declined", `${order.orderNumber} rejected cleanly.`);
        }
      } else {
        success(
          "Order Updated",
          `${order.orderNumber} marked ${targetStatus.replace(/_/g, " ").toLowerCase()}.`
        );
      }
    } catch {
      toastError("Network Error", "Could not update order status.");
    } finally {
      setMutatingOrderId(null);
      setPendingRejectOrder(null);
      setRejectPreset("");
      setCustomRejectReason("");
    }
  };

  const handleAssignRider = async (order: CashierOrder, riderId: string) => {
    setAssigningOrderId(order.id);
    try {
      const res = await fetch(`/api/v1/admin/orders/${order.id}/assign-rider`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ riderId: riderId || null }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        toastError(
          "Assignment Failed",
          data.error || `Unable to assign rider to ${order.orderNumber}.`
        );
        return;
      }

      setOrders((prev) =>
        prev.map((item) =>
          item.id === order.id
            ? {
                ...item,
                assignedRiderId: data.order?.assignedRiderId ?? null,
                assignedRider: data.order?.assignedRider ?? null,
              }
            : item
        )
      );
      success(
        riderId ? "Rider Assigned" : "Assignment Cleared",
        `${order.orderNumber} ${
          data.order?.assignedRider?.fullName
            ? `assigned to ${data.order.assignedRider.fullName}`
            : "unassigned"
        }.`
      );
    } catch {
      toastError("Network Error", "Could not reach dispatch API.");
    } finally {
      setAssigningOrderId(null);
    }
  };

  const handleToggleAvailability = async (item: CashierMenuItem) => {
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
        toastError("Update Failed", data.error || `Unable to update ${item.name}.`);
        return;
      }
      setMenuItems((prev) =>
        prev.map((m) => (m.id === item.id ? { ...m, isAvailable: nextAvailability } : m))
      );
      success(
        nextAvailability ? "Dish Available" : "Dish Marked Sold Out",
        `${item.name} is now ${nextAvailability ? "back in stock" : "marked Sold Out"}.`
      );
    } catch {
      toastError("Network Error", "Unable to reach menu availability endpoint.");
    } finally {
      setTogglingItemId(null);
    }
  };

  const handleSignOut = async () => {
    await fetch("/api/v1/auth/logout", { method: "POST" }).catch(() => {});
    info("Signed Out", "Cashier session closed.");
    router.push("/admin/login");
    router.refresh();
  };

  const matchesCashierFilters = useCallback(
    (order: CashierOrder) => {
      if (paymentModeFilter === "PAYSTACK" && order.paymentMethod !== "PAYSTACK") {
        return false;
      }
      if (
        paymentModeFilter === "CASH" &&
        order.paymentMethod !== "CASH_ON_DELIVERY" &&
        order.paymentMethod !== "CASH_ON_COLLECTION"
      ) {
        return false;
      }
      if (
        activeTab === "INCOMING" &&
        fulfilmentFilter !== "ALL" &&
        order.fulfilmentType !== fulfilmentFilter
      ) {
        return false;
      }

      const q = searchQuery.trim().toLowerCase();
      if (!q) return true;
      return (
        order.orderNumber.toLowerCase().includes(q) ||
        (order.guestName || "").toLowerCase().includes(q) ||
        (order.guestPhone || "").includes(q) ||
        (order.deliveryAddress?.recipientName || "").toLowerCase().includes(q) ||
        (order.deliveryAddress?.areaLocality || "").toLowerCase().includes(q) ||
        order.items.some((i) => i.itemNameSnapshot.toLowerCase().includes(q))
      );
    },
    [searchQuery, paymentModeFilter, fulfilmentFilter, activeTab]
  );

  const incomingOrders = useMemo(
    () =>
      orders
        .filter((o) => o.fulfilmentStatus === "PENDING")
        .filter(matchesCashierFilters)
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()),
    [orders, matchesCashierFilters]
  );

  const pickupOrders = useMemo(() => {
    const rank: Record<string, number> = {
      READY_FOR_PICKUP: 0,
      CONFIRMED: 1,
      PREPARING: 2,
      COLLECTED: 3,
    };
    return orders
      .filter(
        (o) =>
          o.fulfilmentType === "COLLECTION" &&
          ["READY_FOR_PICKUP", "CONFIRMED", "PREPARING", "COLLECTED"].includes(
            o.fulfilmentStatus
          )
      )
      .filter(matchesCashierFilters)
      .sort((a, b) => {
        const diff = (rank[a.fulfilmentStatus] ?? 9) - (rank[b.fulfilmentStatus] ?? 9);
        if (diff !== 0) return diff;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }, [orders, matchesCashierFilters]);

  const dispatchOrders = useMemo(
    () =>
      orders
        .filter(
          (o) =>
            o.fulfilmentType === "DELIVERY" &&
            [
              "CONFIRMED",
              "PREPARING",
              "READY_FOR_DISPATCH",
              "OUT_FOR_DELIVERY",
            ].includes(o.fulfilmentStatus)
        )
        .filter(matchesCashierFilters)
        .sort((a, b) => {
          const aUnassigned = a.assignedRiderId ? 1 : 0;
          const bUnassigned = b.assignedRiderId ? 1 : 0;
          if (aUnassigned !== bUnassigned) return aUnassigned - bUnassigned;
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        }),
    [orders, matchesCashierFilters]
  );

  const filteredMenuStock = useMemo(() => {
    const q = stockSearch.trim().toLowerCase();
    return menuItems.filter((item) => {
      if (!q) return true;
      return (
        item.name.toLowerCase().includes(q) ||
        (item.category?.name || "").toLowerCase().includes(q)
      );
    });
  }, [menuItems, stockSearch]);

  const metrics = useMemo(() => {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const incomingPending = orders.filter((o) => o.fulfilmentStatus === "PENDING").length;
    const readyForCounterPickup = orders.filter(
      (o) => o.fulfilmentType === "COLLECTION" && o.fulfilmentStatus === "READY_FOR_PICKUP"
    ).length;
    const awaitingRiderDispatch = orders.filter(
      (o) =>
        o.fulfilmentType === "DELIVERY" &&
        !o.assignedRiderId &&
        ["CONFIRMED", "PREPARING", "READY_FOR_DISPATCH"].includes(o.fulfilmentStatus)
    ).length;
    const todaysCounterCashPesewas = orders
      .filter(
        (o) =>
          o.fulfilmentType === "COLLECTION" &&
          o.fulfilmentStatus === "COLLECTED" &&
          o.paymentMethod === "CASH_ON_COLLECTION" &&
          new Date(o.createdAt) >= startOfToday
      )
      .reduce((sum, o) => sum + o.totalPesewas, 0);

    return {
      incomingPending,
      readyForCounterPickup,
      awaitingRiderDispatch,
      todaysCounterCashPesewas,
    };
  }, [orders]);

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
            title="Cashier Authentication Required"
            description="Sign in with a Cashier or Super Admin account to confirm incoming orders, complete counter pickups, and dispatch riders."
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
        <PageReveal className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-[#333333] pb-6">
          <div>
            <span className="font-mono text-[11px] font-bold uppercase tracking-[0.22em] text-[#F0444A]">
              Front Desk &amp; Dispatch &middot; {sessionName}
            </span>
            <h1 className="font-serif text-3xl sm:text-4xl font-black tracking-tight text-white">
              Cashier &amp; Dispatch Desk
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
                  href="/kitchen"
                  className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-[#333333] bg-[#1C1C1C] hover:bg-[#262626] px-3 text-xs font-semibold text-[#F5F1EA] transition-colors"
                >
                  <ChefHat className="h-3.5 w-3.5 text-[#F0444A]" aria-hidden="true" />
                  <span>Kitchen KDS</span>
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
            <Button
              variant="secondary"
              size="sm"
              onClick={() => loadDesk()}
              loading={loading}
            >
              <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Refresh</span>
            </Button>
            <Button variant="danger" size="sm" onClick={handleSignOut}>
              <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Sign Out</span>
            </Button>
          </div>
        </PageReveal>

        {/* Focused Cashier KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="rounded-2xl border border-[#333333] bg-[#1C1C1C] p-3.5 sm:p-5 space-y-1 min-w-0">
            <span className="text-[11px] sm:text-xs font-medium text-[#A3A3A3]">Incoming Pending</span>
            <p className="font-mono text-lg sm:text-2xl font-black text-[#FACC15] tabular-nums">
              {metrics.incomingPending}
            </p>
            <span className="text-[10px] sm:text-[11px] text-[#737373] block truncate">
              Awaiting confirmation
            </span>
          </div>
          <div className="rounded-2xl border border-[#333333] bg-[#1C1C1C] p-3.5 sm:p-5 space-y-1 min-w-0">
            <span className="text-[11px] sm:text-xs font-medium text-[#A3A3A3]">Pickups Ready</span>
            <p className="font-mono text-lg sm:text-2xl font-black text-[#4ADE80] tabular-nums">
              {metrics.readyForCounterPickup}
            </p>
            <span className="text-[10px] sm:text-[11px] text-[#737373] block truncate">
              Ready for counter handover
            </span>
          </div>
          <div className="rounded-2xl border border-[#333333] bg-[#1C1C1C] p-3.5 sm:p-5 space-y-1 min-w-0">
            <span className="text-[11px] sm:text-xs font-medium text-[#A3A3A3]">Unassigned Rides</span>
            <p className="font-mono text-lg sm:text-2xl font-black text-[#F0444A] tabular-nums">
              {metrics.awaitingRiderDispatch}
            </p>
            <span className="text-[10px] sm:text-[11px] text-[#737373] block truncate">
              Deliveries awaiting courier
            </span>
          </div>
          <div className="rounded-2xl border border-[#333333] bg-[#1C1C1C] p-3.5 sm:p-5 space-y-1 min-w-0">
            <span className="text-[11px] sm:text-xs font-medium text-[#A3A3A3]">Counter Cash</span>
            <p className="font-mono text-lg sm:text-2xl font-black text-[#F5F1EA] tabular-nums truncate">
              {formatPesewasToGhs(metrics.todaysCounterCashPesewas)}
            </p>
            <span className="text-[10px] sm:text-[11px] text-[#737373] block truncate">
              Settled counter cash
            </span>
          </div>
        </div>

        {/* Navigation Tabs — horizontal swipe on small phones */}
        <div className="flex overflow-x-auto scrollbar-none sm:flex-wrap sm:overflow-visible items-center gap-2 border-b border-[#333333] pb-3">
          <button
            type="button"
            onClick={() => setActiveTab("INCOMING")}
            className={`inline-flex items-center gap-2 rounded-xl px-3.5 sm:px-4 py-2 text-xs sm:text-sm font-semibold transition-all whitespace-nowrap shrink-0 ${
              activeTab === "INCOMING"
                ? "bg-[#D71920] text-white"
                : "bg-[#1C1C1C] text-[#A3A3A3] hover:text-white border border-[#333333]"
            }`}
          >
            <Inbox className="h-4 w-4" aria-hidden="true" />
            <span>Incoming &amp; Confirm ({incomingOrders.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("PICKUPS")}
            className={`inline-flex items-center gap-2 rounded-xl px-3.5 sm:px-4 py-2 text-xs sm:text-sm font-semibold transition-all whitespace-nowrap shrink-0 ${
              activeTab === "PICKUPS"
                ? "bg-[#D71920] text-white"
                : "bg-[#1C1C1C] text-[#A3A3A3] hover:text-white border border-[#333333]"
            }`}
          >
            <PackageCheck className="h-4 w-4" aria-hidden="true" />
            <span>Counter Pickups ({pickupOrders.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("DISPATCH")}
            className={`inline-flex items-center gap-2 rounded-xl px-3.5 sm:px-4 py-2 text-xs sm:text-sm font-semibold transition-all whitespace-nowrap shrink-0 ${
              activeTab === "DISPATCH"
                ? "bg-[#D71920] text-white"
                : "bg-[#1C1C1C] text-[#A3A3A3] hover:text-white border border-[#333333]"
            }`}
          >
            <Bike className="h-4 w-4" aria-hidden="true" />
            <span>Delivery Dispatch ({dispatchOrders.length})</span>
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
            <span>Dish Availability</span>
          </button>
        </div>

        {/* Order Search & Shift Filter Bar */}
        {activeTab !== "STOCK" && (
          <div className="space-y-3">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              <div className="relative lg:max-w-md w-full">
                <Search
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#737373]"
                  aria-hidden="true"
                />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search order #, customer, dish, or Sunyani area..."
                  className="w-full rounded-xl border border-[#333333] bg-[#1C1C1C] pl-10 pr-4 py-2.5 text-sm text-[#F5F1EA] placeholder-[#737373] focus:outline-none focus:border-[#D71920]"
                />
              </div>

              <div className="flex overflow-x-auto scrollbar-none pb-1 sm:flex-wrap sm:overflow-visible items-center gap-1.5">
                {(
                  [
                    { id: "ALL", label: "All Payments" },
                    { id: "PAYSTACK", label: "Paystack Paid" },
                    { id: "CASH", label: "Cash" },
                  ] as const
                ).map((pill) => (
                  <button
                    key={pill.id}
                    type="button"
                    onClick={() => setPaymentModeFilter(pill.id)}
                    className={`rounded-full px-3 py-1.5 text-xs font-semibold border transition-colors whitespace-nowrap shrink-0 ${
                      paymentModeFilter === pill.id
                        ? "border-[#D71920] bg-[#D71920]/15 text-[#F0444A]"
                        : "border-[#333333] bg-[#1C1C1C] text-[#A3A3A3] hover:text-white"
                    }`}
                  >
                    {pill.label}
                  </button>
                ))}

                {activeTab === "INCOMING" && (
                  <>
                    <span className="h-4 w-px bg-[#333333] mx-0.5 shrink-0" aria-hidden="true" />
                    {(
                      [
                        { id: "ALL", label: "Delivery & Pickup" },
                        { id: "DELIVERY", label: "Delivery" },
                        { id: "COLLECTION", label: "Pickup" },
                      ] as const
                    ).map((pill) => (
                      <button
                        key={pill.id}
                        type="button"
                        onClick={() => setFulfilmentFilter(pill.id)}
                        className={`rounded-full px-3 py-1.5 text-xs font-semibold border transition-colors whitespace-nowrap shrink-0 ${
                          fulfilmentFilter === pill.id
                            ? "border-[#D71920] bg-[#D71920]/15 text-[#F0444A]"
                            : "border-[#333333] bg-[#1C1C1C] text-[#A3A3A3] hover:text-white"
                        }`}
                      >
                        {pill.label}
                      </button>
                    ))}
                  </>
                )}

                <span className="h-4 w-px bg-[#333333] mx-0.5 shrink-0" aria-hidden="true" />
                {(
                  [
                    { id: "today", label: "Today" },
                    { id: "yesterday", label: "Yesterday" },
                    { id: "7d", label: "7 Days" },
                    { id: "all", label: "All Shift" },
                  ] as const
                ).map((win) => (
                  <button
                    key={win.id}
                    type="button"
                    onClick={() => setShiftWindow(win.id)}
                    className={`rounded-full px-3 py-1.5 text-xs font-semibold border transition-colors whitespace-nowrap shrink-0 ${
                      shiftWindow === win.id
                        ? "border-[#D71920] bg-[#D71920]/15 text-[#F0444A]"
                        : "border-[#333333] bg-[#1C1C1C] text-[#A3A3A3] hover:text-white"
                    }`}
                  >
                    {win.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        {loadError ? (
          <ErrorState message={loadError} onRetry={() => loadDesk()} />
        ) : loading ? (
          <div className="space-y-4">
            <OrderRowSkeleton />
            <OrderRowSkeleton />
          </div>
        ) : activeTab === "INCOMING" ? (
          incomingOrders.length === 0 ? (
            <EmptyState
              icon={Inbox}
              title="No Pending Orders Waiting"
              description="All incoming customer orders have been reviewed. New Paystack and cash orders will appear here automatically."
            />
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-5">
              {incomingOrders.map((order) => {
                const isMutating = mutatingOrderId === order.id;
                const paySummary = getPaymentSummary(order);
                return (
                  <article
                    key={order.id}
                    className="rounded-3xl border border-[#333333] bg-[#1C1C1C] p-4 sm:p-6 flex flex-col justify-between space-y-4 sm:space-y-5 min-w-0"
                  >
                    <div className="space-y-3.5 min-w-0">
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-3">
                          <span className="font-mono text-sm sm:text-base font-black text-white min-w-0 truncate">
                            {order.orderNumber}
                          </span>
                          <span className="font-mono text-base sm:text-lg font-black text-[#F0444A] tabular-nums shrink-0">
                            {formatPesewasToGhs(order.totalPesewas)}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 flex-wrap">
                          <Badge variant="warning">Pending Confirmation</Badge>
                          <Badge
                            variant={order.fulfilmentType === "COLLECTION" ? "neutral" : "brand"}
                          >
                            {formatFulfilmentTypeLabel(order.fulfilmentType)}
                          </Badge>
                          <Badge variant={paySummary.variant}>{paySummary.label}</Badge>
                        </div>

                        <p className="text-xs text-[#A3A3A3] flex items-center gap-1.5 min-w-0">
                          <Clock className="h-3.5 w-3.5 text-[#737373] shrink-0" aria-hidden="true" />
                          <span className="truncate">
                            {new Date(order.createdAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}{" "}
                            &middot;{" "}
                            {order.deliveryAddress?.recipientName ||
                              order.guestName ||
                              "Guest Customer"}
                          </span>
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-4 text-xs text-[#A3A3A3]">
                        {(order.deliveryAddress?.recipientPhone || order.guestPhone) && (
                          <a
                            href={`tel:${order.deliveryAddress?.recipientPhone || order.guestPhone}`}
                            className="inline-flex items-center gap-1.5 text-[#F5F1EA] hover:text-[#F0444A]"
                          >
                            <Phone className="h-3.5 w-3.5 text-[#F0444A]" aria-hidden="true" />
                            <span>{order.deliveryAddress?.recipientPhone || order.guestPhone}</span>
                          </a>
                        )}
                        {order.deliveryAddress && (
                          <span className="inline-flex items-center gap-1.5">
                            <MapPin className="h-3.5 w-3.5 text-[#F0444A]" aria-hidden="true" />
                            <span>
                              {order.deliveryAddress.areaLocality} &mdash;{" "}
                              {order.deliveryAddress.streetAddress}
                            </span>
                          </span>
                        )}
                      </div>

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
                          Customer Note: {order.customerNotes}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2.5 border-t border-[#333333] pt-4">
                      <Button
                        variant="primary"
                        size="md"
                        className="w-full sm:flex-1"
                        loading={isMutating}
                        onClick={() => executeStatusTransition(order, "CONFIRMED")}
                      >
                        <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                        <span>Confirm &amp; Send to Kitchen</span>
                      </Button>
                      <Button
                        variant="danger"
                        size="md"
                        className="w-full sm:w-auto"
                        loading={isMutating}
                        onClick={() => setPendingRejectOrder(order)}
                      >
                        <XCircle className="h-4 w-4" aria-hidden="true" />
                        <span>Reject</span>
                      </Button>
                    </div>
                  </article>
                );
              })}
            </div>
          )
        ) : activeTab === "PICKUPS" ? (
          pickupOrders.length === 0 ? (
            <EmptyState
              icon={PackageCheck}
              title="No Active Counter Pickups"
              description="Confirmed pickup orders preparing in the kitchen or ready at the counter will appear here."
            />
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-5">
              {pickupOrders.map((order) => {
                const isReady = order.fulfilmentStatus === "READY_FOR_PICKUP";
                const isCash = order.paymentMethod === "CASH_ON_COLLECTION";
                const isMutating = mutatingOrderId === order.id;

                return (
                  <article
                    key={order.id}
                    className={`rounded-3xl border p-4 sm:p-6 flex flex-col justify-between space-y-4 min-w-0 ${
                      isReady
                        ? "border-[#22C55E]/50 bg-[#1C1C1C]"
                        : "border-[#333333] bg-[#1C1C1C]"
                    }`}
                  >
                    <div className="space-y-3 min-w-0">
                      <div className="space-y-1.5">
                        <div className="flex items-start justify-between gap-3">
                          <span className="font-mono text-sm sm:text-base font-black text-white min-w-0 truncate">
                            {order.orderNumber}
                          </span>
                          <span className="font-mono text-base sm:text-lg font-black text-[#F0444A] tabular-nums shrink-0">
                            {formatPesewasToGhs(order.totalPesewas)}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <Badge variant={getStatusVariant(order.fulfilmentStatus)}>
                            {formatFulfilmentStatusLabel(order.fulfilmentStatus)}
                          </Badge>
                        </div>
                        <p className="text-xs text-[#A3A3A3] break-words">
                          {order.guestName || "Walk-In Customer"}
                          {order.guestPhone ? ` · ${order.guestPhone}` : ""}
                        </p>
                      </div>

                      <div
                        className={`rounded-2xl border px-3.5 py-2.5 flex items-center justify-between gap-2 text-xs font-bold ${
                          isCash && order.paymentStatus !== "PAID"
                            ? "border-[#EAB308]/40 bg-[#EAB308]/10 text-[#FACC15]"
                            : "border-[#22C55E]/35 bg-[#22C55E]/10 text-[#4ADE80]"
                        }`}
                      >
                        <span className="inline-flex items-center gap-2">
                          {isCash && order.paymentStatus !== "PAID" ? (
                            <Banknote className="h-4 w-4 shrink-0" aria-hidden="true" />
                          ) : (
                            <CreditCard className="h-4 w-4 shrink-0" aria-hidden="true" />
                          )}
                          <span>
                            {isCash && order.paymentStatus !== "PAID"
                              ? `COLLECT ${formatPesewasToGhs(order.totalPesewas)} CASH ON HANDOVER`
                              : "PREPAID VIA PAYSTACK — VERIFY ORDER #"}
                          </span>
                        </span>
                      </div>

                      <ul className="space-y-1 text-xs text-[#F5F1EA] rounded-2xl border border-[#333333] bg-[#262626]/60 p-3.5">
                        {order.items.map((item) => (
                          <li key={item.id}>
                            <strong className="font-mono text-[#F0444A] mr-1.5">
                              {item.quantity}x
                            </strong>
                            {item.itemNameSnapshot}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {isReady && (
                      <div className="border-t border-[#333333] pt-4">
                        <Button
                          variant="primary"
                          size="md"
                          fullWidth
                          loading={isMutating}
                          className="!bg-[#16A34A] hover:!bg-[#15803D]"
                          onClick={() => executeStatusTransition(order, "COLLECTED")}
                        >
                          <PackageCheck className="h-4 w-4" aria-hidden="true" />
                          <span>Mark Counter Pickup Collected</span>
                        </Button>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )
        ) : activeTab === "DISPATCH" ? (
          dispatchOrders.length === 0 ? (
            <EmptyState
              icon={Bike}
              title="No Active Delivery Dispatch Orders"
              description="Confirmed and ready Sunyani delivery orders will appear here for courier assignment."
            />
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-5">
              {dispatchOrders.map((order) => {
                const paySummary = getPaymentSummary(order);
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
                        <span className="font-mono text-base sm:text-lg font-black text-[#F0444A] tabular-nums shrink-0">
                          {formatPesewasToGhs(order.totalPesewas)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <Badge variant={getStatusVariant(order.fulfilmentStatus)}>
                          {formatFulfilmentStatusLabel(order.fulfilmentStatus)}
                        </Badge>
                        <Badge variant={paySummary.variant}>{paySummary.label}</Badge>
                      </div>
                      <p className="text-xs text-[#A3A3A3] break-words">
                        {order.deliveryAddress?.recipientName || order.guestName || "Customer"}{" "}
                        &middot;{" "}
                        {order.deliveryAddress?.recipientPhone || order.guestPhone || "No phone"}
                      </p>
                    </div>

                    {order.deliveryAddress && (
                      <div className="rounded-2xl border border-[#333333] bg-[#262626]/60 px-3.5 py-2.5 text-xs text-[#A3A3A3] flex items-start gap-2">
                        <MapPin className="h-4 w-4 text-[#F0444A] shrink-0 mt-0.5" aria-hidden="true" />
                        <div>
                          <span className="font-semibold text-[#F5F1EA]">
                            {order.deliveryAddress.areaLocality}
                          </span>{" "}
                          &mdash; {order.deliveryAddress.streetAddress}
                          {order.deliveryAddress.landmark
                            ? ` (${order.deliveryAddress.landmark})`
                            : ""}
                        </div>
                      </div>
                    )}

                    <div className="rounded-2xl border border-[#333333] bg-[#161616] px-3.5 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-2 text-xs text-[#A3A3A3]">
                        <Bike className="h-4 w-4 text-[#F0444A] shrink-0" aria-hidden="true" />
                        <span>
                          {order.assignedRider
                            ? `Assigned: ${order.assignedRider.fullName} (${order.assignedRider.phone})`
                            : "Unassigned — Choose Sunyani Rider"}
                        </span>
                      </div>

                      <div className="w-full sm:w-56">
                        <Select
                          ariaLabel={`Assign delivery rider for ${order.orderNumber}`}
                          value={order.assignedRiderId ?? ""}
                          onChange={(val) => {
                            if (assigningOrderId !== order.id) {
                              handleAssignRider(order, val);
                            }
                          }}
                          options={[
                            { value: "", label: "Unassigned Rider" },
                            ...riders.map((r) => ({
                              value: r.id,
                              label: r.fullName,
                              description: r.phone,
                            })),
                          ]}
                          size="sm"
                          variant="elevated"
                          fullWidth
                        />
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )
        ) : (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="font-serif text-xl font-bold text-[#F5F1EA]">
                  Quick Dish Availability
                </h2>
                <p className="text-xs text-[#A3A3A3]">
                  Toggle sold-out items cleanly at the front desk. Menu prices and recipes can only
                  be modified by a Super Admin.
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
                  placeholder="Search dish or category..."
                  className="w-full rounded-xl border border-[#333333] bg-[#1C1C1C] pl-10 pr-4 py-2 text-sm text-[#F5F1EA] placeholder-[#737373] focus:outline-none focus:border-[#D71920]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredMenuStock.map((item) => {
                const isToggling = togglingItemId === item.id;
                return (
                  <div
                    key={item.id}
                    className="rounded-2xl border border-[#333333] bg-[#1C1C1C] p-4 flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-[#F5F1EA] truncate">{item.name}</p>
                      <span className="text-[11px] text-[#737373]">
                        {item.category?.name || "Menu Item"}
                      </span>
                    </div>
                    <Button
                      variant={item.isAvailable ? "secondary" : "danger"}
                      size="sm"
                      loading={isToggling}
                      onClick={() => handleToggleAvailability(item)}
                    >
                      {item.isAvailable ? "In Stock" : "Sold Out"}
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={Boolean(pendingRejectOrder)}
        title={`Reject Order ${pendingRejectOrder?.orderNumber}?`}
        description="Select or enter a clear reason for declining this order. The customer will be notified automatically."
        confirmLabel="Yes, Reject Order"
        loading={Boolean(mutatingOrderId)}
        confirmDisabled={!effectiveRejectReason}
        onCancel={() => {
          setPendingRejectOrder(null);
          setRejectPreset("");
          setCustomRejectReason("");
        }}
        onConfirm={() => {
          if (pendingRejectOrder && effectiveRejectReason) {
            executeStatusTransition(
              pendingRejectOrder,
              "REJECTED",
              effectiveRejectReason
            );
          }
        }}
      >
        <div className="space-y-3">
          {pendingRejectOrder?.paymentMethod === "PAYSTACK" &&
            pendingRejectOrder?.paymentStatus === "PAID" && (
              <div className="rounded-xl border border-[#EAB308]/40 bg-[#EAB308]/10 px-3 py-2 text-xs text-[#FACC15]">
                Paid Paystack order ({formatPesewasToGhs(pendingRejectOrder.totalPesewas)}):
                declining will automatically trigger a full Paystack refund to the customer.
              </div>
            )}

          <div className="flex flex-wrap gap-1.5">
            {REJECTION_REASON_PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => {
                  setRejectPreset(preset);
                  setCustomRejectReason("");
                }}
                className={`rounded-full px-3 py-1 text-xs font-semibold border transition-colors ${
                  rejectPreset === preset && !customRejectReason.trim()
                    ? "border-[#D71920] bg-[#D71920]/20 text-[#F0444A]"
                    : "border-[#333333] bg-[#262626] text-[#A3A3A3] hover:text-white"
                }`}
              >
                {preset}
              </button>
            ))}
          </div>

          <input
            type="text"
            value={customRejectReason}
            onChange={(e) => setCustomRejectReason(e.target.value)}
            placeholder="Or type custom reason (e.g. Tilapia batch delayed 45m)..."
            aria-label="Rejection reason"
            maxLength={200}
            className="w-full rounded-xl border border-[#333333] bg-[#262626] px-3.5 py-2 text-xs text-[#F5F1EA] placeholder-[#737373] focus:outline-none focus:border-[#D71920]"
          />
        </div>
      </ConfirmDialog>
    </div>
  );
}
