"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Banknote,
  Bike,
  ChefHat,
  Clock,
  CreditCard,
  Download,
  LogOut,
  MapPin,
  PackageCheck,
  Pause,
  Play,
  RefreshCw,
  RotateCcw,
  Search,
  ShieldAlert,
  SlidersHorizontal,
  TrendingUp,
  Users,
  UtensilsCrossed,
} from "lucide-react";
import {
  canAccessWorkspace,
  canConfirmOrFulfilOrder,
  formatFulfilmentStatusLabel,
  formatFulfilmentTypeLabel,
  formatPaymentMethodLabel,
  formatPaymentStatusLabel,
  FulfilmentStatus,
  FulfilmentType,
  getAllowedNextStatuses,
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
import { useCart } from "@/context/CartContext";
import { useToast } from "@/context/ToastContext";
import {
  AdminCategoryOption,
  AdminMenuItem,
  AdminMenuManager,
} from "@/components/admin/AdminMenuManager";
import { AdminAnalyticsPanel } from "@/components/admin/AdminAnalyticsPanel";
import { AdminSettingsZonesPanel } from "@/components/admin/AdminSettingsZonesPanel";
import { AdminStaffPanel } from "@/components/admin/AdminStaffPanel";

interface AdminOrderItem {
  id: string;
  itemNameSnapshot: string;
  quantity: number;
  subtotalPesewas: number;
  specialInstructions?: string | null;
}

interface AdminPaymentAttempt {
  id: string;
  reference: string;
  status: string;
  amountPesewas: number;
  channel?: string | null;
  providerMetadata?: Record<string, unknown> | null;
  createdAt: string;
}

interface AdminOrder {
  id: string;
  orderNumber: string;
  guestName?: string | null;
  guestPhone?: string | null;
  guestEmail?: string | null;
  fulfilmentType: FulfilmentType;
  fulfilmentStatus: FulfilmentStatus;
  paymentMethod: "PAYSTACK" | "CASH_ON_DELIVERY" | "CASH_ON_COLLECTION";
  paymentStatus: "PENDING" | "PAID" | "FAILED" | "REFUND_PENDING" | "REFUNDED";
  totalPesewas: number;
  customerNotes?: string | null;
  rejectionReason?: string | null;
  cancellationReason?: string | null;
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
  items: AdminOrderItem[];
  paymentAttempts?: AdminPaymentAttempt[];
}

interface RiderOption {
  id: string;
  fullName: string;
  phone: string;
}

type AdminTab = "ORDERS" | "MENU" | "REVENUE" | "SETTINGS" | "TEAM";

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
  { id: "CANCELLED", label: "Cancelled" },
  { id: "REJECTED", label: "Rejected" },
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
  const { clearCartOnSignOut } = useCart();
  const { success, error: toastError, info } = useToast();

  const [activeTab, setActiveTab] = useState<AdminTab>("ORDERS");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [dateRangeFilter, setDateRangeFilter] = useState<
    "today" | "yesterday" | "7d" | "30d" | "all"
  >("all");
  const [fulfilmentFilter, setFulfilmentFilter] = useState<
    "ALL" | "DELIVERY" | "COLLECTION"
  >("ALL");
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<
    "ALL" | "PAYSTACK" | "CASH_ON_DELIVERY" | "CASH_ON_COLLECTION"
  >("ALL");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<
    "ALL" | "PAID" | "PENDING" | "FAILED" | "REFUND_PENDING" | "REFUNDED"
  >("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [exportingCsv, setExportingCsv] = useState(false);

  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [menuItems, setMenuItems] = useState<AdminMenuItem[]>([]);
  const [menuCategories, setMenuCategories] = useState<AdminCategoryOption[]>([]);
  const [riders, setRiders] = useState<RiderOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [authRequired, setAuthRequired] = useState(false);
  const [redirectingRolePath, setRedirectingRolePath] = useState<string | null>(null);
  const [showUnpaidOnline, setShowUnpaidOnline] = useState(false);
  const [autoRefreshPaused, setAutoRefreshPaused] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [mutatingOrderId, setMutatingOrderId] = useState<string | null>(null);
  const [refundingOrderId, setRefundingOrderId] = useState<string | null>(null);
  const [assigningOrderId, setAssigningOrderId] = useState<string | null>(null);

  const [pendingAbort, setPendingAbort] = useState<{
    order: AdminOrder;
    targetStatus: FulfilmentStatus;
  } | null>(null);
  const [abortPresetReason, setAbortPresetReason] = useState<string>("");
  const [abortCustomReason, setAbortCustomReason] = useState<string>("");
  const [pendingManualRefund, setPendingManualRefund] = useState<{
    order: AdminOrder;
    reference?: string;
    isDuplicate: boolean;
  } | null>(null);

  const loadDashboard = useCallback(
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
        if (!canAccessWorkspace(role, "admin")) {
          const target = getDashboardForRole(role).path;
          setRedirectingRolePath(target);
          router.replace(target);
          if (!silent) setLoading(false);
          return;
        }

        const orderParams = new URLSearchParams();
        if (showUnpaidOnline) orderParams.set("includeUnpaidOnline", "true");
        if (dateRangeFilter !== "all") orderParams.set("dateRange", dateRangeFilter);
        if (fulfilmentFilter !== "ALL") orderParams.set("fulfilmentType", fulfilmentFilter);
        if (paymentMethodFilter !== "ALL") orderParams.set("paymentMethod", paymentMethodFilter);
        if (paymentStatusFilter !== "ALL") orderParams.set("paymentStatus", paymentStatusFilter);
        const qs = orderParams.toString();
        const ordersUrl = qs ? `/api/v1/admin/orders?${qs}` : "/api/v1/admin/orders";
        const [ordersRes, menuRes, catsRes, ridersRes] = await Promise.all([
          fetch(ordersUrl, { cache: "no-store" }),
          fetch("/api/v1/menu/items?includeUnavailable=true", { cache: "no-store" }),
          fetch("/api/v1/menu/categories", { cache: "no-store" }),
          fetch("/api/v1/admin/riders", { cache: "no-store" }),
        ]);

        if (ordersRes.status === 401 || ordersRes.status === 403) {
          setAuthRequired(true);
          if (!silent) setLoading(false);
          return;
        }

        const [ordersData, menuData, catsData, ridersData] = await Promise.all([
          ordersRes.json(),
          menuRes.json(),
          catsRes.ok ? catsRes.json() : Promise.resolve({ success: false }),
          ridersRes.ok ? ridersRes.json() : Promise.resolve({ success: false }),
        ]);

        if (!ordersRes.ok || !ordersData.success) {
          throw new Error(ordersData.error || "Unable to retrieve admin orders.");
        }

        setOrders(ordersData.orders ?? []);
        setMenuItems(menuData.items ?? []);
        if (catsRes.ok && catsData.success) {
          setMenuCategories(catsData.categories ?? []);
        }
        if (ridersRes.ok && ridersData.success) {
          setRiders(ridersData.riders ?? []);
        }
        if (silent) {
          setLoadError(null);
        }
      } catch (err) {
        if (!silent) {
          setLoadError(
            err instanceof Error ? err.message : "Unable to load admin operations data."
          );
        }
      } finally {
        if (!silent) {
          setLoading(false);
        }
      }
    },
    [
      router,
      showUnpaidOnline,
      dateRangeFilter,
      fulfilmentFilter,
      paymentMethodFilter,
      paymentStatusFilter,
    ]
  );

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  useEffect(() => {
    if (autoRefreshPaused || authRequired || redirectingRolePath) return;

    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        loadDashboard({ silent: true });
      }
    }, 15_000);

    return () => window.clearInterval(timer);
  }, [autoRefreshPaused, authRequired, redirectingRolePath, loadDashboard]);

  const handleAssignRider = async (order: AdminOrder, riderId: string) => {
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

  const effectiveAbortReason = (abortCustomReason.trim() || abortPresetReason).trim();

  const executeStatusTransition = async (
    order: AdminOrder,
    targetStatus: FulfilmentStatus,
    explicitReason?: string
  ) => {
    setMutatingOrderId(order.id);
    try {
      const bodyPayload: Record<string, string> = { targetStatus };
      if (targetStatus === "REJECTED") {
        bodyPayload.rejectionReason =
          explicitReason?.trim() || "Declined via Staff KDS Terminal";
      } else if (targetStatus === "CANCELLED") {
        bodyPayload.cancellationReason =
          explicitReason?.trim() || "Cancelled via Staff KDS Terminal";
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
          item.id === order.id
            ? {
                ...item,
                fulfilmentStatus: targetStatus,
                paymentStatus: data.order?.paymentStatus ?? item.paymentStatus,
              }
            : item
        )
      );

      if ((targetStatus === "REJECTED" || targetStatus === "CANCELLED") && data.refund) {
        if (data.refund.initiated) {
          success(
            "Order Closed & Paystack Refund Sent",
            `${order.orderNumber} marked ${targetStatus.toLowerCase()} and Paystack refund initiated.`
          );
        } else if (data.refund.error) {
          toastError(
            "Refund Retry Needed",
            `Order updated, but Paystack refund failed: ${data.refund.error}`
          );
        }
      } else {
        success(
          "Order Updated",
          `${order.orderNumber} moved to ${targetStatus.replace(/_/g, " ")}.`
        );
      }
    } catch {
      toastError("Network Error", "Failed to communicate with order status endpoint.");
    } finally {
      setMutatingOrderId(null);
      setPendingAbort(null);
      setAbortPresetReason("");
      setAbortCustomReason("");
    }
  };

  const executeManualRefund = async () => {
    if (!pendingManualRefund) return;
    const { order, reference, isDuplicate } = pendingManualRefund;
    setRefundingOrderId(order.id);
    try {
      const res = await fetch(`/api/v1/admin/orders/${order.id}/refund`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reference,
          reason: isDuplicate
            ? "Duplicate Paystack charge refund approved by Super Admin"
            : "Super Admin manual refund for cancelled/rejected Paystack order",
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        toastError("Refund Failed", data.error || "Unable to issue Paystack refund.");
        return;
      }
      success(
        "Paystack Refund Sent",
        data.refund?.alreadyRefunded
          ? `${order.orderNumber} refund was already registered.`
          : `Refund initiated for ${order.orderNumber}.`
      );
      await loadDashboard({ silent: true });
    } catch {
      toastError("Network Error", "Could not reach refund endpoint.");
    } finally {
      setRefundingOrderId(null);
      setPendingManualRefund(null);
    }
  };

  const handleExportCsv = async () => {
    setExportingCsv(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "ALL") params.set("status", statusFilter);
      if (dateRangeFilter !== "all") params.set("dateRange", dateRangeFilter);
      if (fulfilmentFilter !== "ALL") params.set("fulfilmentType", fulfilmentFilter);
      if (paymentMethodFilter !== "ALL") params.set("paymentMethod", paymentMethodFilter);
      if (paymentStatusFilter !== "ALL") params.set("paymentStatus", paymentStatusFilter);
      if (showUnpaidOnline) params.set("includeUnpaidOnline", "true");
      if (searchQuery.trim()) params.set("search", searchQuery.trim());
      params.set("format", "csv");

      const res = await fetch(`/api/v1/admin/orders?${params.toString()}`, {
        cache: "no-store",
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        toastError("Export Failed", errData?.error || "Unable to export orders CSV.");
        return;
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `sika-orders-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.URL.revokeObjectURL(url);
      success("CSV Exported", "Filtered orders report downloaded.");
    } catch {
      toastError("Export Failed", "Could not generate orders CSV.");
    } finally {
      setExportingCsv(false);
    }
  };

  const handleSignOut = async () => {
    await fetch("/api/v1/auth/logout", { method: "POST" }).catch(() => {});
    clearCartOnSignOut();
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
        (order.guestEmail || "").toLowerCase().includes(q) ||
        (order.deliveryAddress?.recipientName || "").toLowerCase().includes(q) ||
        (order.deliveryAddress?.areaLocality || "").toLowerCase().includes(q) ||
        order.items.some((i) => i.itemNameSnapshot.toLowerCase().includes(q))
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

  if (redirectingRolePath) {
    return (
      <div className="min-h-[calc(100vh-80px)] bg-[#101010] px-4 py-16 flex items-center justify-center">
        <div className="rounded-2xl border border-[#333333] bg-[#1C1C1C] px-6 py-5 text-center space-y-2">
          <p className="font-mono text-xs uppercase tracking-widest text-[#F0444A]">
            Routing to Your Workspace
          </p>
          <p className="text-sm text-[#A3A3A3]">
            Opening your dedicated operational dashboard ({redirectingRolePath})...
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
            title="Admin Authentication Required"
            description="Sign in with a Super Admin account to access full console controls, or log in as Cashier / Kitchen / Rider to open your dedicated portal."
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
              Super Admin &middot; Sika Cuisine Sunyani
            </span>
            <h1 className="font-serif text-3xl sm:text-4xl font-black tracking-tight text-white">
              Admin Operations Console
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/cashier"
              className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-[#333333] bg-[#1C1C1C] hover:bg-[#262626] px-3 text-xs font-semibold text-[#F5F1EA] transition-colors"
            >
              <CreditCard className="h-3.5 w-3.5 text-[#F0444A]" aria-hidden="true" />
              <span>Cashier Desk</span>
            </Link>
            <Link
              href="/kitchen"
              className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-[#333333] bg-[#1C1C1C] hover:bg-[#262626] px-3 text-xs font-semibold text-[#F5F1EA] transition-colors"
            >
              <ChefHat className="h-3.5 w-3.5 text-[#F0444A]" aria-hidden="true" />
              <span>Kitchen KDS</span>
            </Link>
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
              onClick={() => loadDashboard()}
              loading={loading}
            >
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
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="rounded-2xl border border-[#333333] bg-[#1C1C1C] p-3.5 sm:p-5 space-y-1 min-w-0">
            <span className="text-[11px] sm:text-xs font-medium text-[#A3A3A3]">Active Queue</span>
            <p className="font-mono text-lg sm:text-2xl font-black text-[#F0444A] tabular-nums">
              {metrics.activeCount}
            </p>
            <span className="text-[10px] sm:text-[11px] text-[#737373] block truncate">
              Out of {metrics.totalCount} fetched
            </span>
          </div>
          <div className="rounded-2xl border border-[#333333] bg-[#1C1C1C] p-3.5 sm:p-5 space-y-1 min-w-0">
            <span className="text-[11px] sm:text-xs font-medium text-[#A3A3A3]">Settled Online</span>
            <p className="font-mono text-lg sm:text-2xl font-black text-[#4ADE80] tabular-nums truncate">
              {formatPesewasToGhs(metrics.paidOnlinePesewas)}
            </p>
            <span className="text-[10px] sm:text-[11px] text-[#737373] block truncate">
              Confirmed Paystack
            </span>
          </div>
          <div className="rounded-2xl border border-[#333333] bg-[#1C1C1C] p-3.5 sm:p-5 space-y-1 min-w-0">
            <span className="text-[11px] sm:text-xs font-medium text-[#A3A3A3]">Cash on Handover</span>
            <p className="font-mono text-lg sm:text-2xl font-black text-[#F5F1EA] tabular-nums truncate">
              {formatPesewasToGhs(metrics.cashOnHandoverPesewas)}
            </p>
            <span className="text-[10px] sm:text-[11px] text-[#737373] block truncate">
              Delivery &amp; Counter Cash
            </span>
          </div>
          <div className="rounded-2xl border border-[#333333] bg-[#1C1C1C] p-3.5 sm:p-5 space-y-1 min-w-0">
            <span className="text-[11px] sm:text-xs font-medium text-[#A3A3A3]">Gross Value</span>
            <p className="font-mono text-lg sm:text-2xl font-black text-[#F5F1EA] tabular-nums truncate">
              {formatPesewasToGhs(metrics.grossOrderValuePesewas)}
            </p>
            <span className="text-[10px] sm:text-[11px] text-[#737373] block truncate">
              Excludes cancelled/declined
            </span>
          </div>
        </div>

        {/* Navigation Tabs — swipeable horizontally on narrow screens */}
        <div className="flex overflow-x-auto scrollbar-none sm:flex-wrap sm:overflow-visible items-center gap-2 border-b border-[#333333] pb-3">
          <button
            type="button"
            onClick={() => setActiveTab("ORDERS")}
            className={`inline-flex items-center gap-2 rounded-xl px-3.5 sm:px-4 py-2 text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap shrink-0 ${
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
            className={`inline-flex items-center gap-2 rounded-xl px-3.5 sm:px-4 py-2 text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap shrink-0 ${
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
            className={`inline-flex items-center gap-2 rounded-xl px-3.5 sm:px-4 py-2 text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap shrink-0 ${
              activeTab === "REVENUE"
                ? "bg-[#D71920] text-white"
                : "bg-[#1C1C1C] text-[#A3A3A3] hover:text-white border border-[#333333]"
            }`}
          >
            <TrendingUp className="h-4 w-4" aria-hidden="true" />
            <span>Analytics &amp; Performance</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("SETTINGS")}
            className={`inline-flex items-center gap-2 rounded-xl px-3.5 sm:px-4 py-2 text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap shrink-0 ${
              activeTab === "SETTINGS"
                ? "bg-[#D71920] text-white"
                : "bg-[#1C1C1C] text-[#A3A3A3] hover:text-white border border-[#333333]"
            }`}
          >
            <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
            <span>Settings &amp; Zones</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("TEAM")}
            className={`inline-flex items-center gap-2 rounded-xl px-3.5 sm:px-4 py-2 text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap shrink-0 ${
              activeTab === "TEAM"
                ? "bg-[#D71920] text-white"
                : "bg-[#1C1C1C] text-[#A3A3A3] hover:text-white border border-[#333333]"
            }`}
          >
            <Users className="h-4 w-4" aria-hidden="true" />
            <span>Team &amp; Riders</span>
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
            {/* Search & Multi-Facet Operational Filters */}
            <div className="space-y-3">
              <div className="flex flex-col lg:flex-row gap-3 justify-between items-start lg:items-center">
                <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
                  <div className="relative w-full sm:w-72">
                    <Search
                      className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#737373]"
                      aria-hidden="true"
                    />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search order #, guest, phone, email, dish..."
                      aria-label="Search orders"
                      className="w-full rounded-xl border border-[#333333] bg-[#1C1C1C] pl-10 pr-4 py-2.5 text-sm text-[#F5F1EA] placeholder-[#737373] focus:outline-none focus:border-[#D71920]"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowUnpaidOnline((prev) => !prev)}
                    className={`rounded-xl px-3 py-2 text-xs font-semibold border transition-colors ${
                      showUnpaidOnline
                        ? "border-[#EAB308]/50 bg-[#EAB308]/15 text-[#FACC15]"
                        : "border-[#333333] bg-[#1C1C1C] text-[#A3A3A3] hover:text-white"
                    }`}
                  >
                    {showUnpaidOnline ? "Showing Unpaid Paystack" : "Include Unpaid Online"}
                  </button>
                  <Button
                    variant="secondary"
                    size="sm"
                    loading={exportingCsv}
                    onClick={handleExportCsv}
                  >
                    <Download className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Export CSV</span>
                  </Button>
                </div>

                {/* Date Window & Facet Selectors */}
                <div className="flex overflow-x-auto scrollbar-none pb-1 sm:flex-wrap sm:overflow-visible items-center gap-2 w-full lg:w-auto">
                  {(
                    [
                      { id: "today", label: "Today" },
                      { id: "yesterday", label: "Yesterday" },
                      { id: "7d", label: "7d" },
                      { id: "30d", label: "30d" },
                      { id: "all", label: "All Time" },
                    ] as const
                  ).map((win) => (
                    <button
                      key={win.id}
                      type="button"
                      onClick={() => setDateRangeFilter(win.id)}
                      className={`rounded-full px-3 py-1.5 text-xs font-semibold border transition-colors whitespace-nowrap shrink-0 ${
                        dateRangeFilter === win.id
                          ? "border-[#D71920] bg-[#D71920]/15 text-[#F0444A]"
                          : "border-[#333333] bg-[#1C1C1C] text-[#A3A3A3] hover:text-white"
                      }`}
                    >
                      {win.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 max-w-2xl">
                <Select
                  ariaLabel="Filter by fulfilment type"
                  value={fulfilmentFilter}
                  onChange={(v) => setFulfilmentFilter(v as any)}
                  size="sm"
                  variant="elevated"
                  fullWidth
                  options={[
                    { value: "ALL", label: "All Fulfilment" },
                    { value: "DELIVERY", label: "Delivery" },
                    { value: "COLLECTION", label: "Counter Pickup" },
                  ]}
                />
                <Select
                  ariaLabel="Filter by payment method"
                  value={paymentMethodFilter}
                  onChange={(v) => setPaymentMethodFilter(v as any)}
                  size="sm"
                  variant="elevated"
                  fullWidth
                  options={[
                    { value: "ALL", label: "All Methods" },
                    { value: "PAYSTACK", label: "Paystack" },
                    { value: "CASH_ON_DELIVERY", label: "Cash on Delivery" },
                    { value: "CASH_ON_COLLECTION", label: "Cash at Counter" },
                  ]}
                />
                <Select
                  ariaLabel="Filter by payment status"
                  value={paymentStatusFilter}
                  onChange={(v) => setPaymentStatusFilter(v as any)}
                  size="sm"
                  variant="elevated"
                  fullWidth
                  options={[
                    { value: "ALL", label: "All Payment States" },
                    { value: "PAID", label: "Paid" },
                    { value: "PENDING", label: "Pending" },
                    { value: "FAILED", label: "Failed" },
                    { value: "REFUND_PENDING", label: "Refund Processing" },
                    { value: "REFUNDED", label: "Refunded" },
                  ]}
                />
              </div>

              <div className="flex overflow-x-auto scrollbar-none pb-1 sm:flex-wrap sm:overflow-visible gap-1.5">
                {STATUS_FILTER_TABS.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setStatusFilter(tab.id)}
                    className={`rounded-full px-3 py-1.5 text-xs font-semibold border transition-colors whitespace-nowrap shrink-0 ${
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
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-5">
                {filteredOrders.map((order) => {
                  const nextStatuses = getAllowedNextStatuses(
                    order.fulfilmentType,
                    order.fulfilmentStatus
                  );
                  const isMutating = mutatingOrderId === order.id;

                  return (
                    <article
                      key={order.id}
                      className="rounded-3xl border border-[#333333] bg-[#1C1C1C] p-4 sm:p-6 space-y-4 flex flex-col justify-between min-w-0"
                    >
                      <div className="space-y-3.5 min-w-0">
                        {/* 2-row deterministic card header preventing mid-card price wrapping */}
                        <div className="space-y-2">
                          <div className="flex items-start justify-between gap-3">
                            <h2 className="font-mono text-sm sm:text-base font-black text-white min-w-0 truncate">
                              {order.orderNumber}
                            </h2>
                            <p className="font-mono text-base sm:text-lg font-black text-[#F0444A] tabular-nums shrink-0">
                              {formatPesewasToGhs(order.totalPesewas)}
                            </p>
                          </div>

                          <div className="flex flex-wrap items-center gap-1.5">
                            <Badge variant={getStatusVariant(order.fulfilmentStatus)}>
                              {formatFulfilmentStatusLabel(order.fulfilmentStatus)}
                            </Badge>
                            <Badge variant="neutral">
                              {formatFulfilmentTypeLabel(order.fulfilmentType)}
                            </Badge>
                            <Badge
                              variant={
                                order.paymentStatus === "PAID" ||
                                order.paymentStatus === "REFUNDED"
                                  ? "success"
                                  : order.paymentStatus === "FAILED"
                                  ? "error"
                                  : "warning"
                              }
                            >
                              {formatPaymentMethodLabel(order.paymentMethod)} &middot;{" "}
                              {formatPaymentStatusLabel(order.paymentStatus)}
                            </Badge>
                            {order.paymentMethod === "PAYSTACK" &&
                              (order.paymentStatus === "PENDING" ||
                                order.paymentStatus === "FAILED") && (
                                <Badge variant="warning">Unpaid Online &mdash; Locked</Badge>
                              )}
                          </div>

                          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-[#A3A3A3] min-w-0">
                            <span className="break-words">
                              {order.guestName ||
                                order.deliveryAddress?.recipientName ||
                                "Customer"}
                            </span>
                            <span>&bull;</span>
                            <span className="font-mono">
                              {order.guestPhone || order.deliveryAddress?.recipientPhone}
                            </span>
                            <span>&bull;</span>
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
                        </div>

                        {order.fulfilmentType === "DELIVERY" && order.deliveryAddress && (
                          <div className="space-y-2.5">
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

                            {!["DELIVERED", "CANCELLED", "REJECTED"].includes(
                              order.fulfilmentStatus
                            ) && (
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-2xl border border-[#333333] bg-[#161616] px-3 py-2.5">
                                <div className="flex items-center gap-2 text-xs text-[#A3A3A3]">
                                  <Bike
                                    className="h-4 w-4 text-[#F0444A] flex-shrink-0"
                                    aria-hidden="true"
                                  />
                                  <span>
                                    {order.assignedRider
                                      ? `Rider: ${order.assignedRider.fullName} (${order.assignedRider.phone})`
                                      : "Assign Delivery Rider"}
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
                            )}
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
                        {(order.rejectionReason || order.cancellationReason) && (
                          <p className="rounded-xl border border-[#FB7185]/35 bg-[#FB7185]/10 px-3 py-2 text-xs text-[#FDA4AF]">
                            Decline / Cancel Reason:{" "}
                            {order.rejectionReason || order.cancellationReason}
                          </p>
                        )}
                      </div>

                      {(() => {
                        const successAttempts = (order.paymentAttempts ?? []).filter(
                          (a) => a.status === "SUCCESS"
                        );
                        const unrefundedDuplicates = successAttempts
                          .slice(0, Math.max(0, successAttempts.length - 1))
                          .filter(
                            (a) =>
                              !a.providerMetadata?.refundId ||
                              a.providerMetadata?.refundStatus === "failed"
                          );
                        const needsFullOrderRefund =
                          order.paymentMethod === "PAYSTACK" &&
                          order.paymentStatus === "PAID" &&
                          (order.fulfilmentStatus === "REJECTED" ||
                            order.fulfilmentStatus === "CANCELLED");
                        const targetDuplicateRef = unrefundedDuplicates[0]?.reference;
                        const canIssueManualRefund =
                          needsFullOrderRefund || Boolean(targetDuplicateRef);

                        const allowedButtons = nextStatuses.filter(
                          (target) =>
                            canConfirmOrFulfilOrder(
                              order.paymentMethod,
                              order.paymentStatus as any,
                              target
                            ).allowed
                        );

                        if (allowedButtons.length === 0 && !canIssueManualRefund) {
                          return null;
                        }

                        return (
                          <div className="flex flex-wrap gap-2 border-t border-[#333333] pt-4">
                            {allowedButtons.map((target) => {
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

                            {canIssueManualRefund && (
                              <Button
                                variant="secondary"
                                size="sm"
                                loading={refundingOrderId === order.id}
                                onClick={() =>
                                  setPendingManualRefund({
                                    order,
                                    reference: needsFullOrderRefund
                                      ? undefined
                                      : targetDuplicateRef,
                                    isDuplicate: !needsFullOrderRefund,
                                  })
                                }
                              >
                                <RotateCcw className="h-3.5 w-3.5 text-[#FACC15]" aria-hidden="true" />
                                <span>
                                  {needsFullOrderRefund
                                    ? "Retry Paystack Refund"
                                    : "Refund Duplicate Charge"}
                                </span>
                              </Button>
                            )}
                          </div>
                        );
                      })()}
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        ) : activeTab === "MENU" ? (
          <AdminMenuManager
            items={menuItems}
            categories={menuCategories}
            onRefresh={() => loadDashboard({ silent: true })}
          />
        ) : activeTab === "SETTINGS" ? (
          <AdminSettingsZonesPanel />
        ) : activeTab === "TEAM" ? (
          <AdminStaffPanel onTeamChanged={() => loadDashboard({ silent: true })} />
        ) : (
          <AdminAnalyticsPanel />
        )}
      </div>

      <ConfirmDialog
        isOpen={Boolean(pendingAbort)}
        title={
          pendingAbort?.targetStatus === "REJECTED"
            ? `Reject Order ${pendingAbort.order.orderNumber}?`
            : `Cancel Order ${pendingAbort?.order.orderNumber ?? ""}?`
        }
        description="Select or type the reason for closing this order. This records an immutable audit event and notifies the customer."
        confirmLabel={
          pendingAbort?.targetStatus === "REJECTED" ? "Reject Order" : "Cancel Order"
        }
        destructive
        loading={Boolean(pendingAbort && mutatingOrderId === pendingAbort.order.id)}
        confirmDisabled={!effectiveAbortReason}
        onConfirm={() => {
          if (pendingAbort && effectiveAbortReason) {
            executeStatusTransition(
              pendingAbort.order,
              pendingAbort.targetStatus,
              effectiveAbortReason
            );
          }
        }}
        onCancel={() => {
          setPendingAbort(null);
          setAbortPresetReason("");
          setAbortCustomReason("");
        }}
      >
        <div className="space-y-3">
          {pendingAbort?.order.paymentMethod === "PAYSTACK" &&
            pendingAbort?.order.paymentStatus === "PAID" && (
              <div className="rounded-xl border border-[#EAB308]/40 bg-[#EAB308]/10 px-3 py-2 text-xs text-[#FACC15]">
                Paid Paystack order ({formatPesewasToGhs(pendingAbort.order.totalPesewas)}):
                confirming this will automatically initiate a full Paystack refund.
              </div>
            )}

          <div className="flex flex-wrap gap-1.5">
            {REJECTION_REASON_PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => {
                  setAbortPresetReason(preset);
                  setAbortCustomReason("");
                }}
                className={`rounded-full px-3 py-1 text-xs font-semibold border transition-colors ${
                  abortPresetReason === preset && !abortCustomReason.trim()
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
            value={abortCustomReason}
            onChange={(e) => setAbortCustomReason(e.target.value)}
            placeholder="Or enter custom reason..."
            aria-label="Rejection or cancellation reason"
            maxLength={200}
            className="w-full rounded-xl border border-[#333333] bg-[#262626] px-3.5 py-2 text-xs text-[#F5F1EA] placeholder-[#737373] focus:outline-none focus:border-[#D71920]"
          />
        </div>
      </ConfirmDialog>

      <ConfirmDialog
        isOpen={Boolean(pendingManualRefund)}
        title={
          pendingManualRefund?.isDuplicate
            ? `Refund Duplicate Charge on ${pendingManualRefund.order.orderNumber}?`
            : `Issue Paystack Refund for ${pendingManualRefund?.order.orderNumber ?? ""}?`
        }
        description={
          pendingManualRefund?.isDuplicate
            ? `This sends a Paystack refund request for the secondary verified reference (${pendingManualRefund.reference}) without cancelling the customer's meal.`
            : "This invokes Paystack Refund API for the verified payment on this cancelled/rejected order."
        }
        confirmLabel="Confirm Paystack Refund"
        destructive={false}
        loading={Boolean(
          pendingManualRefund && refundingOrderId === pendingManualRefund.order.id
        )}
        onConfirm={executeManualRefund}
        onCancel={() => setPendingManualRefund(null)}
      />
    </div>
  );
}
