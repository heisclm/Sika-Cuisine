"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  Award,
  Banknote,
  BarChart3,
  Bike,
  Calendar,
  ChefHat,
  Clock,
  CreditCard,
  Download,
  MapPin,
  RefreshCw,
  ShoppingBag,
  Store,
  TrendingUp,
  UserCheck,
  Users,
  UtensilsCrossed,
} from "lucide-react";
import { AnalyticsPeriod } from "@sika/shared";
import { formatPesewasToGhs } from "@/lib/currency";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ErrorState } from "@/components/ui/ErrorState";
import { OrderRowSkeleton } from "@/components/ui/Skeleton";

interface AnalyticsSummary {
  netSettledRevenuePesewas: number;
  grossPipelinePesewas: number;
  paystackRevenuePesewas: number;
  cashCollectedPesewas: number;
  cashPendingPesewas: number;
  refundedOrAbortedPesewas: number;
  deliveryFeeRevenuePesewas: number;
  validOrderCount: number;
  completedOrderCount: number;
  abortedOrderCount: number;
  refundedOrderCount: number;
  deliveryOrderCount: number;
  deliveryRevenuePesewas: number;
  collectionOrderCount: number;
  collectionRevenuePesewas: number;
  avgOrderValuePesewas: number;
}

interface AnalyticsBucket {
  key: string;
  label: string;
  shortLabel: string;
  revenuePesewas: number;
  paystackPesewas: number;
  cashPesewas: number;
  orderCount: number;
  abortedCount: number;
}

interface TopDishItem {
  name: string;
  portionsSold: number;
  orderCount: number;
  revenuePesewas: number;
  shareOfRevenuePct: number;
}

interface TopZoneItem {
  locality: string;
  orderCount: number;
  revenuePesewas: number;
  deliveryFeesPesewas: number;
}

interface RiderPerformanceRow {
  id: string;
  fullName: string;
  phone: string;
  isActive: boolean;
  completedDrops: number;
  activeDrops: number;
  totalDeliveredValuePesewas: number;
  codCollectedPesewas: number;
  codPendingOnRoadPesewas: number;
  avgDeliveryMinutes: number | null;
}

interface CashierPerformanceRow {
  id: string;
  fullName: string;
  role: string;
  isActive: boolean;
  ordersConfirmed: number;
  pickupsHandedOver: number;
  ordersAborted: number;
  totalActions: number;
  avgConfirmationMinutes: number | null;
}

interface KitchenPerformanceRow {
  id: string;
  fullName: string;
  role: string;
  isActive: boolean;
  ticketsStarted: number;
  ticketsPacked: number;
  totalActions: number;
  avgPrepMinutes: number | null;
}

interface TopCustomerRow {
  key: string;
  name: string;
  phone: string;
  email: string;
  isRegistered: boolean;
  isReturning: boolean;
  orderCount: number;
  totalSpendPesewas: number;
  avgOrderPesewas: number;
  favoriteDish: string;
  lastOrderAt: string;
}

interface AdminAnalyticsResponse {
  success: boolean;
  period: AnalyticsPeriod;
  periodLabel: string;
  comparisonLabel: string;
  currentStart: string;
  currentEnd: string;
  summary: AnalyticsSummary;
  previousSummary: AnalyticsSummary;
  deltas: {
    netRevenuePct: number;
    grossPipelinePct: number;
    validOrdersPct: number;
    completedOrdersPct: number;
    avgOrderValuePct: number;
  };
  chartBuckets: AnalyticsBucket[];
  topDishes: TopDishItem[];
  topZones: TopZoneItem[];
  workers: {
    riders: RiderPerformanceRow[];
    cashiers: CashierPerformanceRow[];
    kitchen: KitchenPerformanceRow[];
  };
  customers: {
    uniqueCustomersCount: number;
    newCustomersCount: number;
    returningCustomersCount: number;
    repeatCustomerRatePct: number;
    registeredOrderCount: number;
    guestOrderCount: number;
    registeredSharePct: number;
    topCustomers: TopCustomerRow[];
  };
}

type AnalyticsSection = "SALES" | "WORKERS" | "CUSTOMERS";
type ChartMetricMode = "REVENUE" | "ORDERS";

const PERIOD_OPTIONS: Array<{
  id: AnalyticsPeriod;
  label: string;
  sub: string;
}> = [
  { id: "daily", label: "Daily", sub: "Today (Hourly)" },
  { id: "weekly", label: "Weekly", sub: "Last 7 Days" },
  { id: "monthly", label: "Monthly", sub: "Last 30 Days" },
  { id: "yearly", label: "Yearly", sub: "Last 12 Months" },
];

function DeltaBadge({
  pct,
  comparisonLabel,
}: {
  pct: number;
  comparisonLabel: string;
}) {
  const isPositive = pct > 0;
  const isZero = pct === 0;

  return (
    <span
      className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[11px] font-bold tabular-nums ${
        isZero
          ? "bg-[#262626] text-[#A3A3A3]"
          : isPositive
          ? "bg-[#4ADE80]/15 text-[#4ADE80]"
          : "bg-[#F0444A]/15 text-[#F0444A]"
      }`}
      title={`${pct > 0 ? "+" : ""}${pct}% ${comparisonLabel}`}
    >
      {isZero ? null : isPositive ? (
        <ArrowUpRight className="h-3 w-3 shrink-0" aria-hidden="true" />
      ) : (
        <ArrowDownRight className="h-3 w-3 shrink-0" aria-hidden="true" />
      )}
      <span>
        {isPositive ? "+" : ""}
        {pct}%
      </span>
    </span>
  );
}

export function AdminAnalyticsPanel() {
  const [period, setPeriod] = useState<AnalyticsPeriod>("weekly");
  const [activeSection, setActiveSection] = useState<AnalyticsSection>("SALES");
  const [chartMetric, setChartMetric] = useState<ChartMetricMode>("REVENUE");
  const [selectedBucketKey, setSelectedBucketKey] = useState<string | null>(null);

  const [data, setData] = useState<AdminAnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAnalytics = useCallback(async (targetPeriod: AnalyticsPeriod) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/v1/admin/analytics?period=${encodeURIComponent(targetPeriod)}`,
        { cache: "no-store" }
      );
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Unable to load analytics report.");
      }
      setData(json as AdminAnalyticsResponse);
      setSelectedBucketKey(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load analytics data."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAnalytics(period);
  }, [period, loadAnalytics]);

  const maxBucketValue = useMemo(() => {
    if (!data || data.chartBuckets.length === 0) return 1;
    const vals = data.chartBuckets.map((b) =>
      chartMetric === "REVENUE" ? b.revenuePesewas : b.orderCount
    );
    return Math.max(...vals, 1);
  }, [data, chartMetric]);

  const activeBucket = useMemo(() => {
    if (!data || data.chartBuckets.length === 0) return null;
    if (selectedBucketKey) {
      const found = data.chartBuckets.find((b) => b.key === selectedBucketKey);
      if (found) return found;
    }
    // Default to highest-value bucket or latest bucket with activity
    const nonZero = [...data.chartBuckets]
      .reverse()
      .find((b) => b.orderCount > 0);
    return nonZero || data.chartBuckets[data.chartBuckets.length - 1];
  }, [data, selectedBucketKey]);

  const handleExportCsv = () => {
    window.open(
      `/api/v1/admin/analytics?period=${encodeURIComponent(period)}&format=csv`,
      "_blank",
      "noopener,noreferrer"
    );
  };

  if (loading && !data) {
    return (
      <div className="space-y-4">
        <OrderRowSkeleton />
        <OrderRowSkeleton />
      </div>
    );
  }

  if (error && !data) {
    return (
      <ErrorState
        message={error}
        onRetry={() => void loadAnalytics(period)}
      />
    );
  }

  if (!data) return null;

  const { summary, previousSummary, deltas, comparisonLabel } = data;
  const totalPaymentVolume =
    summary.paystackRevenuePesewas +
    summary.cashCollectedPesewas +
    summary.cashPendingPesewas;
  const paystackSharePct =
    totalPaymentVolume > 0
      ? Math.round((summary.paystackRevenuePesewas / totalPaymentVolume) * 100)
      : 0;
  const deliverySharePct =
    summary.validOrderCount > 0
      ? Math.round((summary.deliveryOrderCount / summary.validOrderCount) * 100)
      : 0;

  return (
    <div className="space-y-6">
      {/* Period Selector & Sub-View Navigation */}
      <div className="rounded-3xl border border-[#333333] bg-[#1C1C1C] p-4 sm:p-5 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Daily / Weekly / Monthly / Yearly Switcher */}
          <div className="flex overflow-x-auto scrollbar-none pb-1 sm:pb-0 sm:flex-wrap items-center gap-2">
            {PERIOD_OPTIONS.map((opt) => {
              const active = period === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setPeriod(opt.id)}
                  className={`flex items-center gap-2 rounded-2xl px-3.5 py-2 text-xs sm:text-sm font-bold transition-colors whitespace-nowrap shrink-0 border ${
                    active
                      ? "border-[#D71920] bg-[#D71920] text-white"
                      : "border-[#333333] bg-[#262626] text-[#A3A3A3] hover:text-white"
                  }`}
                >
                  <Calendar className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  <span>{opt.label}</span>
                  <span
                    className={`text-[11px] font-normal ${
                      active ? "text-white/85" : "text-[#737373]"
                    }`}
                  >
                    ({opt.sub})
                  </span>
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              loading={loading}
              onClick={() => void loadAnalytics(period)}
            >
              <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Refresh</span>
            </Button>
            <Button variant="secondary" size="sm" onClick={handleExportCsv}>
              <Download className="h-3.5 w-3.5 text-[#4ADE80]" aria-hidden="true" />
              <span>Export Report CSV</span>
            </Button>
          </div>
        </div>

        {/* Sub-Section Tabs: Sales & Charts | Worker & Rider Performance | Customer Insights */}
        <div className="flex overflow-x-auto scrollbar-none sm:flex-wrap items-center gap-2 border-t border-[#333333] pt-3">
          <button
            type="button"
            onClick={() => setActiveSection("SALES")}
            className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
              activeSection === "SALES"
                ? "bg-[#D71920]/15 text-[#F0444A] border border-[#D71920]"
                : "bg-[#262626] text-[#A3A3A3] hover:text-white border border-[#333333]"
            }`}
          >
            <BarChart3 className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Sales &amp; Revenue Charts</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSection("WORKERS")}
            className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
              activeSection === "WORKERS"
                ? "bg-[#D71920]/15 text-[#F0444A] border border-[#D71920]"
                : "bg-[#262626] text-[#A3A3A3] hover:text-white border border-[#333333]"
            }`}
          >
            <Users className="h-3.5 w-3.5" aria-hidden="true" />
            <span>
              Workers &amp; Riders (
              {data.workers.riders.length +
                data.workers.cashiers.length +
                data.workers.kitchen.length}
              )
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSection("CUSTOMERS")}
            className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
              activeSection === "CUSTOMERS"
                ? "bg-[#D71920]/15 text-[#F0444A] border border-[#D71920]"
                : "bg-[#262626] text-[#A3A3A3] hover:text-white border border-[#333333]"
            }`}
          >
            <Award className="h-3.5 w-3.5" aria-hidden="true" />
            <span>
              Customer &amp; Menu Insights ({data.customers.uniqueCustomersCount})
            </span>
          </button>
        </div>
      </div>

      {/* Period Executive KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
        {/* 1. Net Settled Revenue */}
        <div className="rounded-3xl border border-[#333333] bg-[#1C1C1C] p-4 sm:p-5 space-y-2 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-[#A3A3A3]">
              Net Settled Revenue
            </span>
            <DeltaBadge
              pct={deltas.netRevenuePct}
              comparisonLabel={comparisonLabel}
            />
          </div>
          <p className="font-mono text-2xl sm:text-3xl font-black text-[#4ADE80] tabular-nums truncate">
            {formatPesewasToGhs(summary.netSettledRevenuePesewas)}
          </p>
          <div className="flex items-center justify-between text-[11px] text-[#737373] pt-1 border-t border-[#2A2A2A]">
            <span>
              Pipeline: {formatPesewasToGhs(summary.grossPipelinePesewas)}
            </span>
            <span>
              Prev: {formatPesewasToGhs(previousSummary.netSettledRevenuePesewas)}
            </span>
          </div>
        </div>

        {/* 2. Order Volume & AOV */}
        <div className="rounded-3xl border border-[#333333] bg-[#1C1C1C] p-4 sm:p-5 space-y-2 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-[#A3A3A3]">
              Valid Orders &amp; AOV
            </span>
            <DeltaBadge
              pct={deltas.validOrdersPct}
              comparisonLabel={comparisonLabel}
            />
          </div>
          <div className="flex items-baseline justify-between gap-2">
            <p className="font-mono text-2xl sm:text-3xl font-black text-white tabular-nums">
              {summary.validOrderCount}
            </p>
            <span className="font-mono text-xs sm:text-sm font-bold text-[#F0444A] tabular-nums">
              AOV {formatPesewasToGhs(summary.avgOrderValuePesewas)}
            </span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-[#737373] pt-1 border-t border-[#2A2A2A]">
            <span>{summary.completedOrderCount} fulfilled</span>
            <span>
              {summary.abortedOrderCount} declined/cancelled
            </span>
          </div>
        </div>

        {/* 3. Payment Method Mix */}
        <div className="rounded-3xl border border-[#333333] bg-[#1C1C1C] p-4 sm:p-5 space-y-2 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-[#A3A3A3]">
              Paystack vs. Cash Mix
            </span>
            <span className="font-mono text-xs font-bold text-[#F5F1EA] tabular-nums">
              {paystackSharePct}% Online
            </span>
          </div>
          <div className="h-2.5 w-full rounded-full bg-[#262626] overflow-hidden flex">
            <div
              className="h-full bg-[#D71920] transition-all"
              style={{ width: `${paystackSharePct}%` }}
            />
            <div
              className="h-full bg-[#4ADE80] transition-all"
              style={{ width: `${100 - paystackSharePct}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[11px] text-[#A3A3A3] pt-1">
            <span className="truncate">
              Paystack: {formatPesewasToGhs(summary.paystackRevenuePesewas)}
            </span>
            <span className="truncate">
              Cash:{" "}
              {formatPesewasToGhs(
                summary.cashCollectedPesewas + summary.cashPendingPesewas
              )}
            </span>
          </div>
        </div>

        {/* 4. Fulfilment Channel Mix */}
        <div className="rounded-3xl border border-[#333333] bg-[#1C1C1C] p-4 sm:p-5 space-y-2 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-[#A3A3A3]">
              Delivery vs. Counter Pickup
            </span>
            <span className="font-mono text-xs font-bold text-[#F5F1EA] tabular-nums">
              {deliverySharePct}% Delivery
            </span>
          </div>
          <div className="h-2.5 w-full rounded-full bg-[#262626] overflow-hidden flex">
            <div
              className="h-full bg-[#F0444A] transition-all"
              style={{ width: `${deliverySharePct}%` }}
            />
            <div
              className="h-full bg-[#FACC15] transition-all"
              style={{ width: `${100 - deliverySharePct}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[11px] text-[#A3A3A3] pt-1">
            <span>{summary.deliveryOrderCount} Deliveries</span>
            <span>{summary.collectionOrderCount} Pickups</span>
          </div>
        </div>
      </div>

      {/* SECTION 1: SALES & REVENUE CHARTS */}
      {activeSection === "SALES" && (
        <div className="space-y-6">
          {/* Interactive Bar Chart Card */}
          <div className="rounded-3xl border border-[#333333] bg-[#1C1C1C] p-4 sm:p-6 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-widest text-[#F0444A]">
                  {data.periodLabel} &middot; {data.comparisonLabel}
                </span>
                <h2 className="font-serif text-xl sm:text-2xl font-bold text-white mt-0.5">
                  Sales &amp; Order Volume Trend
                </h2>
              </div>

              <div className="flex items-center gap-1.5 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setChartMetric("REVENUE")}
                  className={`rounded-xl px-3 py-1.5 text-xs font-bold border transition-colors ${
                    chartMetric === "REVENUE"
                      ? "border-[#D71920] bg-[#D71920] text-white"
                      : "border-[#333333] bg-[#262626] text-[#A3A3A3] hover:text-white"
                  }`}
                >
                  Revenue (GH₵)
                </button>
                <button
                  type="button"
                  onClick={() => setChartMetric("ORDERS")}
                  className={`rounded-xl px-3 py-1.5 text-xs font-bold border transition-colors ${
                    chartMetric === "ORDERS"
                      ? "border-[#D71920] bg-[#D71920] text-white"
                      : "border-[#333333] bg-[#262626] text-[#A3A3A3] hover:text-white"
                  }`}
                >
                  Order Count
                </button>
              </div>
            </div>

            {/* Active Bucket Spotlight Banner */}
            {activeBucket && (
              <div className="rounded-2xl border border-[#333333] bg-[#262626] p-3.5 sm:p-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <span className="text-[11px] uppercase tracking-wider font-bold text-[#A3A3A3]">
                    Selected Window
                  </span>
                  <p className="text-sm sm:text-base font-bold text-white">
                    {activeBucket.label}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-4 sm:gap-6">
                  <div>
                    <span className="text-[11px] text-[#A3A3A3] block">
                      Total Sales
                    </span>
                    <span className="font-mono text-sm sm:text-base font-black text-white tabular-nums">
                      {formatPesewasToGhs(activeBucket.revenuePesewas)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] text-[#A3A3A3] block">
                      Paystack
                    </span>
                    <span className="font-mono text-xs sm:text-sm font-bold text-[#F0444A] tabular-nums">
                      {formatPesewasToGhs(activeBucket.paystackPesewas)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] text-[#A3A3A3] block">
                      Cash
                    </span>
                    <span className="font-mono text-xs sm:text-sm font-bold text-[#4ADE80] tabular-nums">
                      {formatPesewasToGhs(activeBucket.cashPesewas)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] text-[#A3A3A3] block">
                      Valid Orders
                    </span>
                    <span className="font-mono text-xs sm:text-sm font-bold text-[#F5F1EA] tabular-nums">
                      {activeBucket.orderCount}
                      {activeBucket.abortedCount > 0
                        ? ` (${activeBucket.abortedCount} aborted)`
                        : ""}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Bar Chart Canvas */}
            <div className="overflow-x-auto pb-2">
              <div
                className="flex items-end gap-1.5 sm:gap-2 pt-6 pb-2 px-1"
                style={{
                  minWidth:
                    data.chartBuckets.length > 14
                      ? `${data.chartBuckets.length * 36}px`
                      : "100%",
                  height: "240px",
                }}
              >
                {data.chartBuckets.map((bucket) => {
                  const val =
                    chartMetric === "REVENUE"
                      ? bucket.revenuePesewas
                      : bucket.orderCount;
                  const heightPct =
                    val > 0
                      ? Math.max(Math.round((val / maxBucketValue) * 100), 8)
                      : 3;
                  const paystackRatio =
                    bucket.revenuePesewas > 0
                      ? Math.round(
                          (bucket.paystackPesewas / bucket.revenuePesewas) * 100
                        )
                      : 0;
                  const isSelected = activeBucket?.key === bucket.key;

                  return (
                    <button
                      key={bucket.key}
                      type="button"
                      onClick={() => setSelectedBucketKey(bucket.key)}
                      onMouseEnter={() => setSelectedBucketKey(bucket.key)}
                      className={`group flex-1 flex flex-col items-center justify-end h-full min-w-[28px] rounded-xl p-1 transition-colors focus:outline-none ${
                        isSelected
                          ? "bg-[#262626]/90 ring-1 ring-[#D71920]"
                          : "hover:bg-[#262626]/50"
                      }`}
                      title={`${bucket.label}: ${formatPesewasToGhs(
                        bucket.revenuePesewas
                      )} (${bucket.orderCount} orders)`}
                    >
                      <div className="w-full flex-1 flex flex-col justify-end items-center">
                        {val > 0 && (
                          <span className="font-mono text-[9px] font-bold text-[#A3A3A3] group-hover:text-white mb-1 tabular-nums truncate max-w-full">
                            {chartMetric === "REVENUE"
                              ? `₵${Math.round(bucket.revenuePesewas / 100)}`
                              : bucket.orderCount}
                          </span>
                        )}
                        <div
                          className={`w-full max-w-[36px] rounded-t-lg overflow-hidden transition-all flex flex-col justify-end ${
                            val === 0 ? "bg-[#2A2A2A]" : "bg-[#4ADE80]"
                          }`}
                          style={{ height: `${heightPct}%` }}
                        >
                          {val > 0 && chartMetric === "REVENUE" && (
                            <div
                              className="w-full bg-[#D71920] transition-all"
                              style={{ height: `${paystackRatio}%` }}
                            />
                          )}
                          {val > 0 && chartMetric === "ORDERS" && (
                            <div className="w-full h-full bg-[#D71920]" />
                          )}
                        </div>
                      </div>
                      <span
                        className={`mt-2 text-[10px] font-medium truncate max-w-full ${
                          isSelected
                            ? "text-white font-bold"
                            : "text-[#737373] group-hover:text-[#A3A3A3]"
                        }`}
                      >
                        {bucket.shortLabel}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Chart Legend */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#333333] pt-3 text-xs text-[#A3A3A3]">
              <div className="flex flex-wrap items-center gap-4">
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-sm bg-[#D71920]" />
                  <span>
                    {chartMetric === "REVENUE"
                      ? "Paystack (MoMo & Cards)"
                      : "Valid Orders"}
                  </span>
                </span>
                {chartMetric === "REVENUE" && (
                  <span className="inline-flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-sm bg-[#4ADE80]" />
                    <span>Cash on Handover (Delivery &amp; Counter)</span>
                  </span>
                )}
              </div>
              <span className="text-[11px] text-[#737373]">
                Tap or hover any bar to inspect exact breakdown
              </span>
            </div>
          </div>

          {/* 2-Column Top Dishes & Sunyani Delivery Zones */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
            {/* Top-Selling Dishes */}
            <div className="rounded-3xl border border-[#333333] bg-[#1C1C1C] p-4 sm:p-6 space-y-4">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <UtensilsCrossed
                    className="h-5 w-5 text-[#F0444A] shrink-0"
                    aria-hidden="true"
                  />
                  <h3 className="font-serif text-lg sm:text-xl font-bold text-white">
                    Top-Selling Dishes
                  </h3>
                </div>
                <Badge variant="brand">{data.topDishes.length} Ranked</Badge>
              </div>

              {data.topDishes.length === 0 ? (
                <p className="text-xs text-[#737373] py-6 text-center">
                  No dish sales recorded in this period yet.
                </p>
              ) : (
                <div className="space-y-3">
                  {data.topDishes.map((dish, idx) => (
                    <div
                      key={dish.name}
                      className="rounded-2xl border border-[#333333] bg-[#262626] p-3.5 space-y-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <span className="font-mono text-xs font-bold text-[#F0444A] mr-2">
                            #{idx + 1}
                          </span>
                          <span className="text-sm font-bold text-[#F5F1EA] break-words">
                            {dish.name}
                          </span>
                        </div>
                        <span className="font-mono text-sm font-black text-white tabular-nums shrink-0">
                          {formatPesewasToGhs(dish.revenuePesewas)}
                        </span>
                      </div>

                      <div className="h-1.5 w-full rounded-full bg-[#1C1C1C] overflow-hidden">
                        <div
                          className="h-full bg-[#D71920]"
                          style={{
                            width: `${Math.max(dish.shareOfRevenuePct, 4)}%`,
                          }}
                        />
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-[#A3A3A3]">
                        <span>
                          {dish.portionsSold}{" "}
                          {dish.portionsSold === 1 ? "portion" : "portions"} across{" "}
                          {dish.orderCount}{" "}
                          {dish.orderCount === 1 ? "order" : "orders"}
                        </span>
                        <span className="font-mono font-semibold">
                          {dish.shareOfRevenuePct}% of food sales
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Sunyani Delivery Zones & Financial Reconciliation */}
            <div className="space-y-4 sm:space-y-6">
              <div className="rounded-3xl border border-[#333333] bg-[#1C1C1C] p-4 sm:p-6 space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <MapPin
                      className="h-5 w-5 text-[#F0444A] shrink-0"
                      aria-hidden="true"
                    />
                    <h3 className="font-serif text-lg sm:text-xl font-bold text-white">
                      Top Sunyani Delivery Areas
                    </h3>
                  </div>
                  <Badge variant="neutral">
                    Tariffs:{" "}
                    {formatPesewasToGhs(summary.deliveryFeeRevenuePesewas)}
                  </Badge>
                </div>

                {data.topZones.length === 0 ? (
                  <p className="text-xs text-[#737373] py-6 text-center">
                    No delivery orders recorded in this period yet.
                  </p>
                ) : (
                  <div className="space-y-2.5">
                    {data.topZones.map((z) => (
                      <div
                        key={z.locality}
                        className="flex items-center justify-between gap-3 rounded-2xl border border-[#333333] bg-[#262626] px-4 py-3 text-sm"
                      >
                        <div className="min-w-0">
                          <p className="font-bold text-[#F5F1EA] truncate">
                            {z.locality}
                          </p>
                          <p className="text-xs text-[#A3A3A3]">
                            {z.orderCount}{" "}
                            {z.orderCount === 1 ? "delivery" : "deliveries"}{" "}
                            &middot; Fees:{" "}
                            {formatPesewasToGhs(z.deliveryFeesPesewas)}
                          </p>
                        </div>
                        <span className="font-mono text-sm font-black text-[#F0444A] tabular-nums shrink-0">
                          {formatPesewasToGhs(z.revenuePesewas)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Settlement & Refund Ledger Card */}
              <div className="rounded-3xl border border-[#333333] bg-[#1C1C1C] p-4 sm:p-6 space-y-3">
                <h3 className="font-serif text-lg font-bold text-white">
                  Period Financial Ledger
                </h3>
                <div className="space-y-2 text-xs sm:text-sm">
                  <div className="flex items-center justify-between py-1.5 border-b border-[#2A2A2A]">
                    <span className="text-[#A3A3A3] flex items-center gap-2">
                      <CreditCard
                        className="h-4 w-4 text-[#F0444A]"
                        aria-hidden="true"
                      />
                      Paystack Settled (MoMo / Card)
                    </span>
                    <span className="font-mono font-bold text-[#4ADE80] tabular-nums">
                      {formatPesewasToGhs(summary.paystackRevenuePesewas)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-1.5 border-b border-[#2A2A2A]">
                    <span className="text-[#A3A3A3] flex items-center gap-2">
                      <Banknote
                        className="h-4 w-4 text-[#4ADE80]"
                        aria-hidden="true"
                      />
                      Cash Collected (Handed Over)
                    </span>
                    <span className="font-mono font-bold text-white tabular-nums">
                      {formatPesewasToGhs(summary.cashCollectedPesewas)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-1.5 border-b border-[#2A2A2A]">
                    <span className="text-[#A3A3A3] flex items-center gap-2">
                      <Clock
                        className="h-4 w-4 text-[#FACC15]"
                        aria-hidden="true"
                      />
                      Cash Pending (In-Flight Orders)
                    </span>
                    <span className="font-mono font-bold text-[#FACC15] tabular-nums">
                      {formatPesewasToGhs(summary.cashPendingPesewas)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-1.5">
                    <span className="text-[#A3A3A3]">
                      Declined / Cancelled / Refunded ({summary.abortedOrderCount})
                    </span>
                    <span className="font-mono font-bold text-[#F0444A] tabular-nums">
                      {formatPesewasToGhs(summary.refundedOrAbortedPesewas)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 2: WORKER & RIDER PERFORMANCE */}
      {activeSection === "WORKERS" && (
        <div className="space-y-6">
          {/* 1. Delivery Riders Performance & COD Cash Reconciliation */}
          <div className="rounded-3xl border border-[#333333] bg-[#1C1C1C] p-4 sm:p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <Bike
                  className="h-5 w-5 text-[#F0444A] shrink-0"
                  aria-hidden="true"
                />
                <div>
                  <h3 className="font-serif text-lg sm:text-xl font-bold text-white">
                    Delivery Rider Performance &amp; COD Reconciliation
                  </h3>
                  <p className="text-xs text-[#A3A3A3]">
                    Completed drops, dispatch-to-doorstep speed, and Cash on
                    Delivery collected per courier during {data.periodLabel}.
                  </p>
                </div>
              </div>
              <Badge variant="brand">
                {data.workers.riders.length} Registered Riders
              </Badge>
            </div>

            {data.workers.riders.length === 0 ? (
              <p className="text-xs text-[#737373] py-6 text-center">
                No delivery rider accounts registered yet.
              </p>
            ) : (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-3 sm:gap-4">
                {data.workers.riders.map((rider) => (
                  <div
                    key={rider.id}
                    className="rounded-2xl border border-[#333333] bg-[#262626] p-4 space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm sm:text-base font-bold text-white truncate">
                          {rider.fullName}
                        </p>
                        <p className="font-mono text-xs text-[#A3A3A3]">
                          {rider.phone}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {rider.activeDrops > 0 && (
                          <Badge variant="warning">
                            {rider.activeDrops} On Road
                          </Badge>
                        )}
                        <Badge variant={rider.isActive ? "success" : "error"}>
                          {rider.isActive ? "Active" : "Suspended"}
                        </Badge>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-[#333333] text-xs">
                      <div className="rounded-xl bg-[#1C1C1C] p-2.5">
                        <span className="text-[10px] text-[#A3A3A3] block">
                          Completed Drops
                        </span>
                        <span className="font-mono text-base font-black text-white tabular-nums">
                          {rider.completedDrops}
                        </span>
                      </div>
                      <div className="rounded-xl bg-[#1C1C1C] p-2.5">
                        <span className="text-[10px] text-[#A3A3A3] block">
                          Avg Road Time
                        </span>
                        <span className="font-mono text-base font-black text-[#F5F1EA] tabular-nums">
                          {rider.avgDeliveryMinutes !== null
                            ? `${rider.avgDeliveryMinutes}m`
                            : "—"}
                        </span>
                      </div>
                      <div className="rounded-xl bg-[#1C1C1C] p-2.5">
                        <span className="text-[10px] text-[#A3A3A3] block">
                          COD Collected
                        </span>
                        <span className="font-mono text-sm font-black text-[#4ADE80] tabular-nums">
                          {formatPesewasToGhs(rider.codCollectedPesewas)}
                        </span>
                      </div>
                      <div className="rounded-xl bg-[#1C1C1C] p-2.5">
                        <span className="text-[10px] text-[#A3A3A3] block">
                          COD On Road
                        </span>
                        <span className="font-mono text-sm font-black text-[#FACC15] tabular-nums">
                          {formatPesewasToGhs(rider.codPendingOnRoadPesewas)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 2. Front Desk Cashiers & 3. Kitchen KDS Chefs */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
            {/* Cashiers & Front Desk */}
            <div className="rounded-3xl border border-[#333333] bg-[#1C1C1C] p-4 sm:p-6 space-y-4">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Store
                    className="h-5 w-5 text-[#F0444A] shrink-0"
                    aria-hidden="true"
                  />
                  <div>
                    <h3 className="font-serif text-lg sm:text-xl font-bold text-white">
                      Front Desk &amp; Cashier Performance
                    </h3>
                    <p className="text-xs text-[#A3A3A3]">
                      Order confirmation speed, counter pickup handovers, and
                      declined orders.
                    </p>
                  </div>
                </div>
              </div>

              {data.workers.cashiers.length === 0 ? (
                <p className="text-xs text-[#737373] py-6 text-center">
                  No cashier accounts found.
                </p>
              ) : (
                <div className="space-y-3">
                  {data.workers.cashiers.map((c) => (
                    <div
                      key={c.id}
                      className="rounded-2xl border border-[#333333] bg-[#262626] p-3.5 space-y-2.5"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-white truncate">
                            {c.fullName}
                          </p>
                          <span className="text-[11px] text-[#A3A3A3]">
                            {c.role === "ADMIN"
                              ? "Super Admin"
                              : "Cashier & Dispatch"}
                          </span>
                        </div>
                        <Badge variant={c.isActive ? "success" : "error"}>
                          {c.totalActions} actions
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                        <div className="rounded-xl bg-[#1C1C1C] p-2">
                          <span className="text-[10px] text-[#A3A3A3] block">
                            Confirmed
                          </span>
                          <span className="font-mono font-bold text-[#4ADE80]">
                            {c.ordersConfirmed}
                          </span>
                        </div>
                        <div className="rounded-xl bg-[#1C1C1C] p-2">
                          <span className="text-[10px] text-[#A3A3A3] block">
                            Pickups Handed
                          </span>
                          <span className="font-mono font-bold text-white">
                            {c.pickupsHandedOver}
                          </span>
                        </div>
                        <div className="rounded-xl bg-[#1C1C1C] p-2">
                          <span className="text-[10px] text-[#A3A3A3] block">
                            Avg Confirm
                          </span>
                          <span className="font-mono font-bold text-[#F5F1EA]">
                            {c.avgConfirmationMinutes !== null
                              ? `${c.avgConfirmationMinutes}m`
                              : "—"}
                          </span>
                        </div>
                        <div className="rounded-xl bg-[#1C1C1C] p-2">
                          <span className="text-[10px] text-[#A3A3A3] block">
                            Declined/Aborted
                          </span>
                          <span className="font-mono font-bold text-[#F0444A]">
                            {c.ordersAborted}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Kitchen KDS Performance */}
            <div className="rounded-3xl border border-[#333333] bg-[#1C1C1C] p-4 sm:p-6 space-y-4">
              <div className="flex items-center gap-2">
                <ChefHat
                  className="h-5 w-5 text-[#F0444A] shrink-0"
                  aria-hidden="true"
                />
                <div>
                  <h3 className="font-serif text-lg sm:text-xl font-bold text-white">
                    Kitchen KDS Throughput &amp; Prep Speed
                  </h3>
                  <p className="text-xs text-[#A3A3A3]">
                    Tickets cooked, tickets packed ready, and average prep time.
                  </p>
                </div>
              </div>

              {data.workers.kitchen.length === 0 ? (
                <p className="text-xs text-[#737373] py-6 text-center">
                  No kitchen staff accounts found.
                </p>
              ) : (
                <div className="space-y-3">
                  {data.workers.kitchen.map((k) => (
                    <div
                      key={k.id}
                      className="rounded-2xl border border-[#333333] bg-[#262626] p-3.5 space-y-2.5"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-white truncate">
                            {k.fullName}
                          </p>
                          <span className="text-[11px] text-[#A3A3A3]">
                            {k.role === "ADMIN"
                              ? "Super Admin (KDS)"
                              : "Kitchen KDS Chef"}
                          </span>
                        </div>
                        <Badge variant={k.isActive ? "brand" : "error"}>
                          {k.ticketsPacked} packed
                        </Badge>
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div className="rounded-xl bg-[#1C1C1C] p-2">
                          <span className="text-[10px] text-[#A3A3A3] block">
                            Cooking Started
                          </span>
                          <span className="font-mono font-bold text-white">
                            {k.ticketsStarted}
                          </span>
                        </div>
                        <div className="rounded-xl bg-[#1C1C1C] p-2">
                          <span className="text-[10px] text-[#A3A3A3] block">
                            Packed Ready
                          </span>
                          <span className="font-mono font-bold text-[#4ADE80]">
                            {k.ticketsPacked}
                          </span>
                        </div>
                        <div className="rounded-xl bg-[#1C1C1C] p-2">
                          <span className="text-[10px] text-[#A3A3A3] block">
                            Avg Prep Time
                          </span>
                          <span className="font-mono font-bold text-[#FACC15]">
                            {k.avgPrepMinutes !== null
                              ? `${k.avgPrepMinutes}m`
                              : "—"}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* SECTION 3: CUSTOMER & RETENTION INSIGHTS */}
      {activeSection === "CUSTOMERS" && (
        <div className="space-y-6">
          {/* Customer Cohort Summary Strip */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="rounded-2xl border border-[#333333] bg-[#1C1C1C] p-4 space-y-1">
              <span className="text-xs text-[#A3A3A3]">Unique Customers</span>
              <p className="font-mono text-2xl font-black text-white tabular-nums">
                {data.customers.uniqueCustomersCount}
              </p>
              <span className="text-[11px] text-[#737373] block">
                Ordered during {data.periodLabel}
              </span>
            </div>

            <div className="rounded-2xl border border-[#333333] bg-[#1C1C1C] p-4 space-y-1">
              <span className="text-xs text-[#A3A3A3]">
                Repeat Customer Rate
              </span>
              <p className="font-mono text-2xl font-black text-[#4ADE80] tabular-nums">
                {data.customers.repeatCustomerRatePct}%
              </p>
              <span className="text-[11px] text-[#737373] block">
                {data.customers.returningCustomersCount} returning &middot;{" "}
                {data.customers.newCustomersCount} new
              </span>
            </div>

            <div className="rounded-2xl border border-[#333333] bg-[#1C1C1C] p-4 space-y-1">
              <span className="text-xs text-[#A3A3A3]">
                Account vs. Guest Orders
              </span>
              <p className="font-mono text-2xl font-black text-[#F0444A] tabular-nums">
                {data.customers.registeredSharePct}%
              </p>
              <span className="text-[11px] text-[#737373] block">
                {data.customers.registeredOrderCount} signed-in &middot;{" "}
                {data.customers.guestOrderCount} guest
              </span>
            </div>

            <div className="rounded-2xl border border-[#333333] bg-[#1C1C1C] p-4 space-y-1">
              <span className="text-xs text-[#A3A3A3]">#1 Dish in Period</span>
              <p className="text-sm sm:text-base font-black text-[#F5F1EA] truncate">
                {data.topDishes[0]?.name || "No orders yet"}
              </p>
              <span className="text-[11px] text-[#737373] block">
                {data.topDishes[0]
                  ? `${data.topDishes[0].portionsSold} portions (${formatPesewasToGhs(
                      data.topDishes[0].revenuePesewas
                    )})`
                  : "—"}
              </span>
            </div>
          </div>

          {/* Top VIP Customers Leaderboard */}
          <div className="rounded-3xl border border-[#333333] bg-[#1C1C1C] p-4 sm:p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <UserCheck
                  className="h-5 w-5 text-[#F0444A] shrink-0"
                  aria-hidden="true"
                />
                <div>
                  <h3 className="font-serif text-lg sm:text-xl font-bold text-white">
                    Top Customers Leaderboard ({data.periodLabel})
                  </h3>
                  <p className="text-xs text-[#A3A3A3]">
                    Ranked by total spend across registered accounts and
                    phone-unified guest checkouts.
                  </p>
                </div>
              </div>
              <Badge variant="brand">
                Top {data.customers.topCustomers.length}
              </Badge>
            </div>

            {data.customers.topCustomers.length === 0 ? (
              <p className="text-xs text-[#737373] py-8 text-center">
                No customer orders recorded in this period yet.
              </p>
            ) : (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-3 sm:gap-4">
                {data.customers.topCustomers.map((cust, index) => (
                  <div
                    key={cust.key}
                    className="rounded-2xl border border-[#333333] bg-[#262626] p-4 space-y-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-black text-[#F0444A]">
                            #{index + 1}
                          </span>
                          <p className="text-sm sm:text-base font-bold text-white truncate">
                            {cust.name}
                          </p>
                        </div>
                        <p className="font-mono text-xs text-[#A3A3A3] mt-0.5 truncate">
                          {cust.phone}
                          {cust.email !== "—" ? ` · ${cust.email}` : ""}
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <p className="font-mono text-base sm:text-lg font-black text-[#4ADE80] tabular-nums">
                          {formatPesewasToGhs(cust.totalSpendPesewas)}
                        </p>
                        <span className="text-[11px] text-[#A3A3A3]">
                          {cust.orderCount}{" "}
                          {cust.orderCount === 1 ? "order" : "orders"} &middot;
                          Avg {formatPesewasToGhs(cust.avgOrderPesewas)}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#333333] text-xs">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <Badge
                          variant={cust.isRegistered ? "brand" : "neutral"}
                        >
                          {cust.isRegistered ? "Registered" : "Guest"}
                        </Badge>
                        <Badge
                          variant={cust.isReturning ? "success" : "warning"}
                        >
                          {cust.isReturning ? "Returning" : "New Customer"}
                        </Badge>
                      </div>
                      <span className="text-[11px] text-[#A3A3A3] truncate max-w-[220px]">
                        Fav: <strong className="text-[#F5F1EA]">{cust.favoriteDish}</strong>
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
