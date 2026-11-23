"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Bike,
  ChevronDown,
  ChevronUp,
  Clock,
  Compass,
  CreditCard,
  LogIn,
  Receipt,
  RotateCcw,
  Search,
  Store,
  X,
} from "lucide-react";
import {
  formatFulfilmentStatusLabel,
  formatFulfilmentTypeLabel,
  PAST_ORDER_STATUSES,
  ReorderResponseDTO,
} from "@sika/shared";
import { formatPesewasToGhs } from "@/lib/currency";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { PageReveal } from "@/components/ui/MotionPrimitives";
import { OrderRowSkeleton } from "@/components/ui/Skeleton";
import { useCart } from "@/context/CartContext";
import { useToast } from "@/context/ToastContext";

interface OrderListItem {
  id: string;
  orderNumber: string;
  fulfilmentType: "DELIVERY" | "COLLECTION";
  fulfilmentStatus: string;
  paymentMethod?: string;
  paymentStatus?: string;
  totalPesewas: number;
  primaryImageUrl?: string | null;
  rejectionReason?: string | null;
  cancellationReason?: string | null;
  createdAt: string;
  items?: Array<{
    id: string;
    itemNameSnapshot: string;
    quantity: number;
    imageUrl?: string | null;
  }>;
}

type HistoryScope = "active" | "past" | "all";
type StatusPill = "ALL" | "COMPLETED" | "ABORTED" | "REFUNDED";
type FulfilmentPill = "ALL" | "DELIVERY" | "COLLECTION";
type DateRangePill = "7d" | "30d" | "all";

function getStatusVariant(
  status: string
): "brand" | "neutral" | "success" | "warning" | "error" {
  if (status === "DELIVERED" || status === "COLLECTED") return "success";
  if (status === "CANCELLED" || status === "REJECTED") return "error";
  if (
    status === "PREPARING" ||
    status === "OUT_FOR_DELIVERY" ||
    status === "READY_FOR_PICKUP" ||
    status === "READY_FOR_DISPATCH"
  ) {
    return "brand";
  }
  return "warning";
}

/**
 * Industry-standard Customer Order History & Tracking Hub (`/orders`).
 * Features Active/Past segmented tabs, dish/reference search, multi-facet filter pills,
 * automatic Web guest history via signed cookie, cursor pagination, dish thumbnails,
 * refund indicators, and 1-tap Reorder directly into the live cart drawer.
 */
export default function OrdersPage() {
  const router = useRouter();
  const { addItem, setIsCartOpen } = useCart();
  const { success, info, error: toastError } = useToast();

  const [scope, setScope] = useState<HistoryScope>("active");
  const [statusFilter, setStatusFilter] = useState<StatusPill>("ALL");
  const [fulfilmentFilter, setFulfilmentFilter] = useState<FulfilmentPill>("ALL");
  const [dateRange, setDateRange] = useState<DateRangePill>("all");
  const [searchText, setSearchText] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [lookupOpen, setLookupOpen] = useState(false);
  const [lookupOrderNumber, setLookupOrderNumber] = useState("");
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);

  const [isGuestMode, setIsGuestMode] = useState(false);
  const [orders, setOrders] = useState<OrderListItem[]>([]);
  const [activeCount, setActiveCount] = useState(0);
  const [pastCount, setPastCount] = useState(0);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);

  const [historyLoading, setHistoryLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [reorderingOrderNumber, setReorderingOrderNumber] = useState<string | null>(
    null
  );
  const [hasInitializedTab, setHasInitializedTab] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(searchText.trim());
    }, 280);
    return () => window.clearTimeout(timer);
  }, [searchText]);

  const buildFilterQuery = useCallback(
    (cursor?: string | null) => {
      const qs = new URLSearchParams();
      qs.set("scope", scope);
      if (statusFilter !== "ALL") qs.set("status", statusFilter);
      if (fulfilmentFilter !== "ALL") qs.set("fulfilmentType", fulfilmentFilter);
      if (dateRange !== "all") qs.set("dateRange", dateRange);
      if (debouncedSearch) qs.set("search", debouncedSearch);
      qs.set("limit", "15");
      if (cursor) qs.set("cursor", cursor);
      return qs.toString();
    },
    [scope, statusFilter, fulfilmentFilter, dateRange, debouncedSearch]
  );

  const fetchOrders = useCallback(
    async (options?: { cursor?: string | null; append?: boolean }) => {
      const append = Boolean(options?.append);
      if (append) setLoadingMore(true);
      else setHistoryLoading(true);
      setHistoryError(null);

      try {
        const query = buildFilterQuery(options?.cursor);
        const res = await fetch(`/api/v1/orders/my-orders?${query}`, {
          cache: "no-store",
        });

        if (res.status === 401) {
          setIsGuestMode(true);
          const guestRes = await fetch(`/api/v1/orders/guest-recent?${query}`, {
            cache: "no-store",
          });
          const guestData = await guestRes.json();
          if (!guestRes.ok || !guestData.success) {
            throw new Error(guestData.error || "Unable to load device orders.");
          }

          const list: OrderListItem[] = guestData.orders ?? [];
          setOrders(list);
          setActiveCount(guestData.activeCount ?? 0);
          setPastCount(guestData.pastCount ?? 0);
          setNextCursor(null);
          setHasMore(false);

          if (!hasInitializedTab) {
            setHasInitializedTab(true);
            if ((guestData.activeCount ?? 0) === 0 && (guestData.pastCount ?? 0) > 0) {
              setScope("past");
            } else if (
              (guestData.activeCount ?? 0) === 0 &&
              (guestData.pastCount ?? 0) === 0
            ) {
              setLookupOpen(true);
            }
          }
          return;
        }

        setIsGuestMode(false);
        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || "Unable to load your order history.");
        }

        const fetchedOrders: OrderListItem[] = data.orders ?? [];
        setOrders((prev) => (append ? [...prev, ...fetchedOrders] : fetchedOrders));
        setActiveCount(data.activeCount ?? 0);
        setPastCount(data.pastCount ?? 0);
        setNextCursor(data.nextCursor ?? null);
        setHasMore(Boolean(data.hasMore));

        if (!hasInitializedTab) {
          setHasInitializedTab(true);
          if ((data.activeCount ?? 0) === 0 && (data.pastCount ?? 0) > 0) {
            setScope("past");
          }
        }
      } catch (err) {
        setHistoryError(
          err instanceof Error
            ? err.message
            : "Unable to load order history right now."
        );
      } finally {
        setHistoryLoading(false);
        setLoadingMore(false);
      }
    },
    [buildFilterQuery, hasInitializedTab]
  );

  useEffect(() => {
    void fetchOrders({ append: false });
  }, [fetchOrders]);

  const handleTrackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = lookupOrderNumber.trim().toUpperCase();
    if (!cleaned) {
      setLookupError(
        "Please enter an order reference number (e.g. SIKA-2026-XXXX)."
      );
      return;
    }

    setLookupLoading(true);
    setLookupError(null);
    try {
      const res = await fetch(
        `/api/v1/orders/track/${encodeURIComponent(cleaned)}`,
        {
          cache: "no-store",
        }
      );
      const data = await res.json();
      if (!res.ok || !data.success) {
        setLookupError(
          data.error ||
            `No order found matching "${cleaned}". Check your receipt and try again.`
        );
        setLookupLoading(false);
        return;
      }
      router.push(`/orders/${encodeURIComponent(cleaned)}`);
    } catch {
      setLookupError(
        "Unable to reach tracking server. Please check your connection."
      );
      setLookupLoading(false);
    }
  };

  const handleReorder = async (orderNumber: string) => {
    setReorderingOrderNumber(orderNumber);
    try {
      const res = await fetch(
        `/api/v1/orders/${encodeURIComponent(orderNumber)}/reorder`,
        {
          method: "POST",
        }
      );
      const data: ReorderResponseDTO & { error?: string } = await res.json();
      if (!res.ok || !data.success) {
        toastError("Reorder Failed", data.error || "Unable to prepare reorder.");
        return;
      }

      if (data.itemsToAdd.length === 0) {
        info(
          "Dishes Currently Sold Out",
          data.unavailableItems[0]?.itemName
            ? `${data.unavailableItems.map((u) => u.itemName).join(", ")} cannot be ordered right now.`
            : "Items from this order are currently unavailable."
        );
        return;
      }

      for (const entry of data.itemsToAdd) {
        addItem(
          entry.menuItem,
          entry.selectedOptions,
          entry.quantity,
          entry.specialInstructions
        );
      }

      const skipped =
        data.unavailableItems.length > 0
          ? ` (${data.unavailableItems.map((u) => u.itemName).join(", ")} unavailable)`
          : "";
      success(
        "Added to Tray",
        `Reordered ${data.itemsToAdd.length} ${
          data.itemsToAdd.length === 1 ? "dish" : "dishes"
        } from #${orderNumber}${skipped}.`
      );
      setIsCartOpen(true);
    } catch {
      toastError("Network Error", "Could not reorder right now.");
    } finally {
      setReorderingOrderNumber(null);
    }
  };

  const clearAllFilters = () => {
    setStatusFilter("ALL");
    setFulfilmentFilter("ALL");
    setDateRange("all");
    setSearchText("");
  };

  const hasFiltersApplied =
    statusFilter !== "ALL" ||
    fulfilmentFilter !== "ALL" ||
    dateRange !== "all" ||
    searchText.trim().length > 0;

  return (
    <div className="min-h-screen bg-[#101010] py-10 sm:py-14 pb-20">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 space-y-8">
        <PageReveal className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="space-y-2">
            <span className="font-mono text-[11px] font-bold uppercase tracking-[0.22em] text-[#F0444A]">
              Live Kitchen &amp; Order Archive
            </span>
            <h1 className="font-serif text-3xl sm:text-4xl font-black tracking-tight text-white">
              Your Sika Orders
            </h1>
            <p className="text-sm text-[#A3A3A3]">
              Track live Sunyani kitchen progress, inspect refund updates, or reorder your favorite dishes in one tap.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setLookupOpen((prev) => !prev)}
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-[#333333] bg-[#1C1C1C] hover:border-[#D71920]/60 px-4 text-xs font-semibold text-[#F5F1EA] transition-colors self-start sm:self-auto"
          >
            <Compass className="h-3.5 w-3.5 text-[#F0444A]" aria-hidden="true" />
            <span>Track by Reference</span>
            {lookupOpen ? (
              <ChevronUp className="h-3.5 w-3.5 text-[#A3A3A3]" aria-hidden="true" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5 text-[#A3A3A3]" aria-hidden="true" />
            )}
          </button>
        </PageReveal>

        {/* Collapsible Quick Reference Tracker */}
        {lookupOpen && (
          <section className="rounded-3xl border border-[#333333] bg-[#1C1C1C] p-5 sm:p-6 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Compass className="h-4 w-4 text-[#F0444A]" aria-hidden="true" />
                <h2 className="font-serif text-base font-bold text-[#F5F1EA]">
                  Track Any Order Reference
                </h2>
              </div>
              <span className="text-[11px] text-[#737373]">
                Works for any Sunyani receipt code
              </span>
            </div>

            <form
              onSubmit={handleTrackSubmit}
              className="flex flex-col sm:flex-row gap-3"
            >
              <div className="relative flex-1">
                <Search
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#737373]"
                  aria-hidden="true"
                />
                <input
                  type="text"
                  value={lookupOrderNumber}
                  onChange={(e) => setLookupOrderNumber(e.target.value)}
                  placeholder="Enter reference (e.g. SIKA-2026-XXXX)"
                  aria-label="Order Reference Number"
                  className="w-full rounded-xl border border-[#333333] bg-[#262626] pl-10 pr-4 py-2.5 text-sm text-[#F5F1EA] placeholder-[#737373] focus:outline-none focus:border-[#D71920] font-mono uppercase"
                />
              </div>
              <Button
                type="submit"
                variant="primary"
                size="md"
                loading={lookupLoading}
                className="sm:px-6"
              >
                <span>Track Order</span>
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Button>
            </form>

            {lookupError && (
              <div
                role="alert"
                className="rounded-xl border border-[#FB7185]/40 bg-[#FB7185]/10 px-4 py-2.5 text-xs text-[#FDA4AF]"
              >
                {lookupError}
              </div>
            )}
          </section>
        )}

        {/* Guest Browser Notice & Sign-In Callout */}
        {isGuestMode && (
          <div className="rounded-2xl border border-[#333333] bg-[#1C1C1C] px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-0.5">
              <p className="text-sm font-semibold text-[#F5F1EA]">
                Guest Mode &middot; Showing recent orders placed on this browser (24h)
              </p>
              <p className="text-xs text-[#A3A3A3]">
                Sign in to access your permanent Sika Cuisine order history and instant 1-tap reorder across devices.
              </p>
            </div>
            <Link
              href="/login"
              className="inline-flex h-10 shrink-0 items-center gap-2 rounded-xl bg-[#D71920] hover:bg-[#A91017] px-4 text-xs font-semibold text-white transition-colors"
            >
              <LogIn className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Sign In</span>
            </Link>
          </div>
        )}

        {/* Active / Past Segmented Tabs & Search/Filter Controls */}
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="inline-flex rounded-2xl border border-[#333333] bg-[#1C1C1C] p-1 self-start">
              {(
                [
                  { id: "active", label: `Active (${activeCount})` },
                  { id: "past", label: `Past (${pastCount})` },
                  { id: "all", label: "All" },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setScope(tab.id);
                    if (tab.id === "active") {
                      setStatusFilter("ALL");
                    }
                  }}
                  className={`rounded-xl px-4 py-2 text-xs sm:text-sm font-semibold transition-colors ${
                    scope === tab.id
                      ? "bg-[#D71920] text-white"
                      : "text-[#A3A3A3] hover:text-white"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-72">
              <Search
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#737373]"
                aria-hidden="true"
              />
              <input
                type="search"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder="Search order # or dish (e.g. Jollof)..."
                aria-label="Search orders by reference or dish name"
                className="w-full rounded-xl border border-[#333333] bg-[#1C1C1C] pl-10 pr-4 py-2 text-sm text-[#F5F1EA] placeholder-[#737373] focus:outline-none focus:border-[#D71920]"
              />
            </div>
          </div>

          {/* Filter Pills Row — horizontal swipe on small phones, wraps cleanly on tablet/desktop */}
          <div className="flex overflow-x-auto scrollbar-none pb-1 sm:flex-wrap sm:overflow-visible items-center gap-2">
            {scope !== "active" && (
              <>
                {(
                  [
                    { id: "ALL", label: "All Outcomes" },
                    { id: "COMPLETED", label: "Completed" },
                    { id: "ABORTED", label: "Cancelled / Declined" },
                    { id: "REFUNDED", label: "Refunds" },
                  ] as const
                ).map((pill) => (
                  <button
                    key={pill.id}
                    type="button"
                    onClick={() => setStatusFilter(pill.id)}
                    className={`rounded-full px-3 py-1.5 text-xs font-semibold border transition-colors whitespace-nowrap shrink-0 ${
                      statusFilter === pill.id
                        ? "border-[#D71920] bg-[#D71920]/15 text-[#F0444A]"
                        : "border-[#333333] bg-[#1C1C1C] text-[#A3A3A3] hover:text-white"
                    }`}
                  >
                    {pill.label}
                  </button>
                ))}
                <span className="h-4 w-px bg-[#333333] mx-0.5 shrink-0" aria-hidden="true" />
              </>
            )}

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

            <span className="h-4 w-px bg-[#333333] mx-0.5 shrink-0" aria-hidden="true" />

            {(
              [
                { id: "7d", label: "7 Days" },
                { id: "30d", label: "30 Days" },
                { id: "all", label: "All Time" },
              ] as const
            ).map((pill) => (
              <button
                key={pill.id}
                type="button"
                onClick={() => setDateRange(pill.id)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold border transition-colors whitespace-nowrap shrink-0 ${
                  dateRange === pill.id
                    ? "border-[#D71920] bg-[#D71920]/15 text-[#F0444A]"
                    : "border-[#333333] bg-[#1C1C1C] text-[#A3A3A3] hover:text-white"
                }`}
              >
                {pill.label}
              </button>
            ))}

            {hasFiltersApplied && (
              <button
                type="button"
                onClick={clearAllFilters}
                className="inline-flex items-center gap-1 rounded-full border border-[#333333] bg-[#262626] px-3 py-1.5 text-xs font-semibold text-[#F5F1EA] hover:border-[#F0444A] transition-colors whitespace-nowrap shrink-0"
              >
                <X className="h-3 w-3" aria-hidden="true" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </section>

        {/* Orders Feed */}
        {historyLoading ? (
          <div className="space-y-3">
            <OrderRowSkeleton />
            <OrderRowSkeleton />
          </div>
        ) : historyError ? (
          <ErrorState message={historyError} onRetry={() => fetchOrders()} />
        ) : orders.length === 0 ? (
          <EmptyState
            icon={Receipt}
            title={
              hasFiltersApplied
                ? "No Matching Orders"
                : scope === "active"
                ? "No Active Orders Right Now"
                : "No Orders Found"
            }
            description={
              hasFiltersApplied
                ? "Try clearing your search or switching date/status filters."
                : scope === "active" && pastCount > 0
                ? "Your recent deliveries and counter pickups are saved in the Past tab."
                : "Start with our Sunyani menu to place a pickup or delivery order."
            }
            action={
              hasFiltersApplied ? (
                <Button variant="secondary" size="md" onClick={clearAllFilters}>
                  Clear Filters
                </Button>
              ) : scope === "active" && pastCount > 0 ? (
                <Button
                  variant="secondary"
                  size="md"
                  onClick={() => setScope("past")}
                >
                  View Past Orders ({pastCount})
                </Button>
              ) : (
                <Link
                  href="/menu"
                  className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#D71920] hover:bg-[#A91017] px-6 text-sm font-semibold text-white transition-colors"
                >
                  <span>Browse Menu</span>
                </Link>
              )
            }
          />
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const isPast = (PAST_ORDER_STATUSES as readonly string[]).includes(
                order.fulfilmentStatus
              );
              const needsOnlinePay =
                order.paymentMethod === "PAYSTACK" &&
                order.paymentStatus !== "PAID" &&
                !isPast;
              const thumbUrl =
                order.primaryImageUrl ||
                order.items?.find((i) => i.imageUrl)?.imageUrl ||
                null;
              const isReordering = reorderingOrderNumber === order.orderNumber;

              return (
                <article
                  key={order.id}
                  className="rounded-3xl border border-[#333333] bg-[#1C1C1C] hover:border-[#D71920]/45 p-5 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <Link
                    href={`/orders/${encodeURIComponent(order.orderNumber)}`}
                    className="flex items-start gap-4 flex-1 min-w-0 group"
                  >
                    <div className="h-16 w-16 rounded-2xl border border-[#333333] bg-[#262626] overflow-hidden shrink-0 flex items-center justify-center">
                      {thumbUrl ? (
                        <img
                          src={thumbUrl}
                          alt={
                            order.items?.[0]?.itemNameSnapshot || order.orderNumber
                          }
                          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : order.fulfilmentType === "COLLECTION" ? (
                        <Store className="h-6 w-6 text-[#4ADE80]" aria-hidden="true" />
                      ) : (
                        <Bike className="h-6 w-6 text-[#F0444A]" aria-hidden="true" />
                      )}
                    </div>

                    <div className="space-y-1.5 min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-sm font-black text-white group-hover:text-[#F0444A] transition-colors">
                          {order.orderNumber}
                        </span>
                        <Badge variant={getStatusVariant(order.fulfilmentStatus)}>
                          {formatFulfilmentStatusLabel(order.fulfilmentStatus)}
                        </Badge>
                        {order.paymentStatus === "REFUND_PENDING" && (
                          <Badge variant="warning">Refund Processing</Badge>
                        )}
                        {order.paymentStatus === "REFUNDED" && (
                          <Badge variant="success">Refunded</Badge>
                        )}
                        {needsOnlinePay && (
                          <Badge variant="warning">Complete Pay</Badge>
                        )}
                      </div>

                      <p className="text-xs sm:text-sm text-[#F5F1EA] line-clamp-2 sm:truncate">
                        {order.items?.length
                          ? order.items
                              .map(
                                (item) => `${item.quantity}x ${item.itemNameSnapshot}`
                              )
                              .join(", ")
                          : "Sika Cuisine Order"}
                      </p>

                      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11px] text-[#737373]">
                        <span className="inline-flex items-center gap-1">
                          <Clock className="h-3 w-3" aria-hidden="true" />
                          {new Date(order.createdAt).toLocaleDateString("en-GH", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                        <span>&bull;</span>
                        <span>{formatFulfilmentTypeLabel(order.fulfilmentType)}</span>
                      </div>
                    </div>
                  </Link>

                  <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2.5 shrink-0 border-t sm:border-t-0 border-[#333333] pt-3 sm:pt-0">
                    <span className="font-mono text-base font-black text-[#F0444A] tabular-nums">
                      {formatPesewasToGhs(order.totalPesewas)}
                    </span>

                    <div className="flex items-center gap-2">
                      {needsOnlinePay && (
                        <Link
                          href={`/orders/${encodeURIComponent(order.orderNumber)}`}
                          className="inline-flex h-8 items-center gap-1.5 rounded-xl bg-[#D71920] hover:bg-[#A91017] px-3 text-xs font-semibold text-white transition-colors"
                        >
                          <CreditCard className="h-3.5 w-3.5" aria-hidden="true" />
                          <span>Complete Pay</span>
                        </Link>
                      )}

                      {isPast && (
                        <Button
                          variant="secondary"
                          size="sm"
                          loading={isReordering}
                          onClick={() => handleReorder(order.orderNumber)}
                        >
                          <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                          <span>Reorder</span>
                        </Button>
                      )}

                      <Link
                        href={`/orders/${encodeURIComponent(order.orderNumber)}`}
                        className="inline-flex h-8 items-center gap-1 rounded-xl border border-[#333333] bg-[#262626] hover:border-[#D71920]/60 px-3 text-xs font-semibold text-[#F5F1EA] transition-colors"
                      >
                        <span>Details</span>
                        <ArrowRight className="h-3 w-3" aria-hidden="true" />
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}

            {hasMore && nextCursor && (
              <div className="pt-2 flex justify-center">
                <Button
                  variant="secondary"
                  size="md"
                  loading={loadingMore}
                  onClick={() =>
                    fetchOrders({ cursor: nextCursor, append: true })
                  }
                >
                  Load Older Orders
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
