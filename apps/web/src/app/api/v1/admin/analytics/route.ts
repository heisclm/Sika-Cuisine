import { NextRequest, NextResponse } from "next/server";
import {
  computePercentageDelta,
  escapeCsvCell,
  formatPesewasToGhs,
  getAnalyticsPeriodBounds,
  normalizeCustomerCohortKey,
  parseAnalyticsPeriod,
} from "@sika/shared";
import { getAuthUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

interface ValidatedOrderRecord {
  id: string;
  orderNumber: string;
  customerId: string | null;
  guestName: string | null;
  guestPhone: string | null;
  guestEmail: string | null;
  fulfilmentType: "DELIVERY" | "COLLECTION";
  fulfilmentStatus: string;
  paymentStatus: string;
  paymentMethod: string;
  subtotalPesewas: number;
  deliveryFeePesewas: number;
  totalPesewas: number;
  assignedRiderId: string | null;
  createdAt: Date;
  customer: {
    id: string;
    fullName: string;
    phone: string;
    email: string;
  } | null;
  deliveryAddress: {
    areaLocality: string;
  } | null;
  items: Array<{
    itemNameSnapshot: string;
    quantity: number;
    subtotalPesewas: number;
  }>;
  statusHistory: Array<{
    fromStatus: string | null;
    toStatus: string;
    changedByUserId: string | null;
    createdAt: Date;
  }>;
}

function isAbortedOrder(order: { fulfilmentStatus: string }): boolean {
  return (
    order.fulfilmentStatus === "CANCELLED" ||
    order.fulfilmentStatus === "REJECTED"
  );
}

function isSettledOrder(order: {
  fulfilmentStatus: string;
  paymentStatus: string;
}): boolean {
  if (isAbortedOrder(order)) return false;
  if (
    order.paymentStatus === "REFUNDED" ||
    order.paymentStatus === "REFUND_PENDING" ||
    order.paymentStatus === "FAILED"
  ) {
    return false;
  }
  return (
    order.paymentStatus === "PAID" ||
    order.fulfilmentStatus === "DELIVERED" ||
    order.fulfilmentStatus === "COLLECTED"
  );
}

export async function GET(req: NextRequest) {
  try {
    const session = await getAuthUser(req);
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Authentication required." },
        { status: 401 }
      );
    }

    if (session.role !== "ADMIN") {
      return NextResponse.json(
        {
          success: false,
          error: "Access denied. Super Administrator privileges required.",
        },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const period = parseAnalyticsPeriod(searchParams.get("period"));
    const format = searchParams.get("format")?.trim().toLowerCase();
    const bounds = getAnalyticsPeriodBounds(period, new Date());

    // Fetch all non-abandoned orders spanning [previousStart, currentEnd) + all staff users + prior customer keys
    const [windowOrdersRaw, staffUsers, priorOrdersMeta, activeRiderOrders] =
      await Promise.all([
        prisma.order.findMany({
          where: {
            createdAt: {
              gte: bounds.previousStart,
              lt: bounds.currentEnd,
            },
            NOT: {
              paymentMethod: "PAYSTACK",
              paymentStatus: { in: ["PENDING", "FAILED"] },
            },
          },
          orderBy: { createdAt: "asc" },
          include: {
            customer: {
              select: { id: true, fullName: true, phone: true, email: true },
            },
            deliveryAddress: {
              select: { areaLocality: true },
            },
            items: {
              select: {
                itemNameSnapshot: true,
                quantity: true,
                subtotalPesewas: true,
              },
            },
            statusHistory: {
              orderBy: { createdAt: "asc" },
              select: {
                fromStatus: true,
                toStatus: true,
                changedByUserId: true,
                createdAt: true,
              },
            },
          },
        }),
        prisma.user.findMany({
          where: {
            role: {
              in: [
                "ADMIN",
                "STAFF_CASHIER",
                "STAFF_KITCHEN",
                "DELIVERY_RIDER",
              ],
            },
          },
          orderBy: [{ isActive: "desc" }, { fullName: "asc" }],
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
            role: true,
            isActive: true,
          },
        }),
        prisma.order.findMany({
          where: {
            createdAt: { lt: bounds.currentStart },
            fulfilmentStatus: { notIn: ["CANCELLED", "REJECTED"] },
            NOT: {
              paymentMethod: "PAYSTACK",
              paymentStatus: { in: ["PENDING", "FAILED"] },
            },
          },
          select: {
            customerId: true,
            guestPhone: true,
            guestEmail: true,
          },
          take: 5000,
        }),
        prisma.order.findMany({
          where: {
            assignedRiderId: { not: null },
            fulfilmentType: "DELIVERY",
            fulfilmentStatus: { in: ["READY_FOR_DISPATCH", "OUT_FOR_DELIVERY"] },
          },
          select: {
            assignedRiderId: true,
            paymentMethod: true,
            paymentStatus: true,
            totalPesewas: true,
          },
        }),
      ]);

    const windowOrders = windowOrdersRaw as unknown as ValidatedOrderRecord[];

    const currentOrders = windowOrders.filter(
      (o) =>
        o.createdAt >= bounds.currentStart && o.createdAt < bounds.currentEnd
    );
    const previousOrders = windowOrders.filter(
      (o) =>
        o.createdAt >= bounds.previousStart && o.createdAt < bounds.previousEnd
    );

    // Helper to compute core financial summary for a slice of orders
    const summarizeSlice = (slice: ValidatedOrderRecord[]) => {
      let netSettledRevenuePesewas = 0;
      let grossPipelinePesewas = 0;
      let paystackRevenuePesewas = 0;
      let cashCollectedPesewas = 0;
      let cashPendingPesewas = 0;
      let refundedOrAbortedPesewas = 0;
      let deliveryFeeRevenuePesewas = 0;

      let validOrderCount = 0;
      let completedOrderCount = 0;
      let abortedOrderCount = 0;
      let refundedOrderCount = 0;
      let deliveryOrderCount = 0;
      let deliveryRevenuePesewas = 0;
      let collectionOrderCount = 0;
      let collectionRevenuePesewas = 0;

      for (const order of slice) {
        const aborted = isAbortedOrder(order);
        const settled = isSettledOrder(order);
        const isRefunded =
          order.paymentStatus === "REFUNDED" ||
          order.paymentStatus === "REFUND_PENDING";

        if (isRefunded) {
          refundedOrderCount += 1;
        }

        if (aborted || isRefunded) {
          if (aborted) abortedOrderCount += 1;
          refundedOrAbortedPesewas += order.totalPesewas;
          continue;
        }

        validOrderCount += 1;
        grossPipelinePesewas += order.totalPesewas;

        if (
          order.fulfilmentStatus === "DELIVERED" ||
          order.fulfilmentStatus === "COLLECTED"
        ) {
          completedOrderCount += 1;
        }

        if (settled) {
          netSettledRevenuePesewas += order.totalPesewas;
        }

        if (order.paymentMethod === "PAYSTACK") {
          if (order.paymentStatus === "PAID") {
            paystackRevenuePesewas += order.totalPesewas;
          }
        } else {
          // Cash on Delivery or Cash on Collection
          if (
            order.paymentStatus === "PAID" ||
            order.fulfilmentStatus === "DELIVERED" ||
            order.fulfilmentStatus === "COLLECTED"
          ) {
            cashCollectedPesewas += order.totalPesewas;
          } else {
            cashPendingPesewas += order.totalPesewas;
          }
        }

        if (order.fulfilmentType === "DELIVERY") {
          deliveryOrderCount += 1;
          deliveryRevenuePesewas += order.totalPesewas;
          deliveryFeeRevenuePesewas += order.deliveryFeePesewas;
        } else {
          collectionOrderCount += 1;
          collectionRevenuePesewas += order.totalPesewas;
        }
      }

      const avgOrderValuePesewas =
        validOrderCount > 0
          ? Math.round(grossPipelinePesewas / validOrderCount)
          : 0;

      return {
        netSettledRevenuePesewas,
        grossPipelinePesewas,
        paystackRevenuePesewas,
        cashCollectedPesewas,
        cashPendingPesewas,
        refundedOrAbortedPesewas,
        deliveryFeeRevenuePesewas,
        validOrderCount,
        completedOrderCount,
        abortedOrderCount,
        refundedOrderCount,
        deliveryOrderCount,
        deliveryRevenuePesewas,
        collectionOrderCount,
        collectionRevenuePesewas,
        avgOrderValuePesewas,
      };
    };

    const currentSummary = summarizeSlice(currentOrders);
    const previousSummary = summarizeSlice(previousOrders);

    const deltas = {
      netRevenuePct: computePercentageDelta(
        currentSummary.netSettledRevenuePesewas,
        previousSummary.netSettledRevenuePesewas
      ),
      grossPipelinePct: computePercentageDelta(
        currentSummary.grossPipelinePesewas,
        previousSummary.grossPipelinePesewas
      ),
      validOrdersPct: computePercentageDelta(
        currentSummary.validOrderCount,
        previousSummary.validOrderCount
      ),
      completedOrdersPct: computePercentageDelta(
        currentSummary.completedOrderCount,
        previousSummary.completedOrderCount
      ),
      avgOrderValuePct: computePercentageDelta(
        currentSummary.avgOrderValuePesewas,
        previousSummary.avgOrderValuePesewas
      ),
    };

    // Build chart series across bounds.buckets
    const chartBuckets = bounds.buckets.map((b) => ({
      key: b.key,
      label: b.label,
      shortLabel: b.shortLabel,
      revenuePesewas: 0,
      paystackPesewas: 0,
      cashPesewas: 0,
      orderCount: 0,
      abortedCount: 0,
    }));

    for (const order of currentOrders) {
      const ts = order.createdAt.getTime();
      const bucketIdx = bounds.buckets.findIndex(
        (b) => ts >= b.start.getTime() && ts < b.end.getTime()
      );
      if (bucketIdx === -1) continue;

      const target = chartBuckets[bucketIdx];
      const aborted = isAbortedOrder(order);
      const isRefunded =
        order.paymentStatus === "REFUNDED" ||
        order.paymentStatus === "REFUND_PENDING";

      if (aborted || isRefunded) {
        target.abortedCount += 1;
        continue;
      }

      target.orderCount += 1;
      target.revenuePesewas += order.totalPesewas;
      if (order.paymentMethod === "PAYSTACK") {
        target.paystackPesewas += order.totalPesewas;
      } else {
        target.cashPesewas += order.totalPesewas;
      }
    }

    // Top-selling dishes & top Sunyani delivery zones in current period
    const dishMap = new Map<
      string,
      { name: string; portionsSold: number; orderCount: number; revenuePesewas: number }
    >();
    const zoneMap = new Map<
      string,
      { locality: string; orderCount: number; revenuePesewas: number; deliveryFeesPesewas: number }
    >();

    for (const order of currentOrders) {
      if (
        isAbortedOrder(order) ||
        order.paymentStatus === "REFUNDED" ||
        order.paymentStatus === "REFUND_PENDING"
      ) {
        continue;
      }

      const seenDishesInOrder = new Set<string>();
      for (const item of order.items) {
        const key = item.itemNameSnapshot.trim();
        const existing = dishMap.get(key) || {
          name: key,
          portionsSold: 0,
          orderCount: 0,
          revenuePesewas: 0,
        };
        existing.portionsSold += item.quantity;
        existing.revenuePesewas += item.subtotalPesewas;
        if (!seenDishesInOrder.has(key)) {
          existing.orderCount += 1;
          seenDishesInOrder.add(key);
        }
        dishMap.set(key, existing);
      }

      if (order.fulfilmentType === "DELIVERY") {
        const locality =
          order.deliveryAddress?.areaLocality?.trim() || "Sunyani Central";
        const z = zoneMap.get(locality) || {
          locality,
          orderCount: 0,
          revenuePesewas: 0,
          deliveryFeesPesewas: 0,
        };
        z.orderCount += 1;
        z.revenuePesewas += order.totalPesewas;
        z.deliveryFeesPesewas += order.deliveryFeePesewas;
        zoneMap.set(locality, z);
      }
    }

    const totalDishRevenuePesewas = Array.from(dishMap.values()).reduce(
      (acc, d) => acc + d.revenuePesewas,
      0
    );

    const topDishes = Array.from(dishMap.values())
      .sort(
        (a, b) =>
          b.revenuePesewas - a.revenuePesewas || b.portionsSold - a.portionsSold
      )
      .slice(0, 10)
      .map((d) => ({
        ...d,
        shareOfRevenuePct:
          totalDishRevenuePesewas > 0
            ? Math.round((d.revenuePesewas / totalDishRevenuePesewas) * 1000) / 10
            : 0,
      }));

    const topZones = Array.from(zoneMap.values())
      .sort((a, b) => b.orderCount - a.orderCount || b.revenuePesewas - a.revenuePesewas)
      .slice(0, 8);

    // Worker / Staff & Rider Performance Analytics
    // 1. Riders
    const riderStatsMap = new Map<
      string,
      {
        id: string;
        fullName: string;
        phone: string;
        isActive: boolean;
        completedDrops: number;
        activeDrops: number;
        totalDeliveredValuePesewas: number;
        codCollectedPesewas: number;
        codPendingOnRoadPesewas: number;
        deliveryDurationSamplesMin: number[];
      }
    >();

    // 2. Cashiers & Admins (Front Desk)
    const cashierStatsMap = new Map<
      string,
      {
        id: string;
        fullName: string;
        role: string;
        isActive: boolean;
        ordersConfirmed: number;
        pickupsHandedOver: number;
        dispatchesReady: number;
        ordersAborted: number;
        totalActions: number;
        confirmDurationSamplesMin: number[];
      }
    >();

    // 3. Kitchen Staff
    const kitchenStatsMap = new Map<
      string,
      {
        id: string;
        fullName: string;
        role: string;
        isActive: boolean;
        ticketsStarted: number;
        ticketsPacked: number;
        totalActions: number;
        prepDurationSamplesMin: number[];
      }
    >();

    for (const u of staffUsers) {
      if (u.role === "DELIVERY_RIDER") {
        riderStatsMap.set(u.id, {
          id: u.id,
          fullName: u.fullName,
          phone: u.phone,
          isActive: u.isActive,
          completedDrops: 0,
          activeDrops: 0,
          totalDeliveredValuePesewas: 0,
          codCollectedPesewas: 0,
          codPendingOnRoadPesewas: 0,
          deliveryDurationSamplesMin: [],
        });
      }
      if (u.role === "STAFF_CASHIER" || u.role === "ADMIN") {
        cashierStatsMap.set(u.id, {
          id: u.id,
          fullName: u.fullName,
          role: u.role,
          isActive: u.isActive,
          ordersConfirmed: 0,
          pickupsHandedOver: 0,
          dispatchesReady: 0,
          ordersAborted: 0,
          totalActions: 0,
          confirmDurationSamplesMin: [],
        });
      }
      if (u.role === "STAFF_KITCHEN") {
        kitchenStatsMap.set(u.id, {
          id: u.id,
          fullName: u.fullName,
          role: u.role,
          isActive: u.isActive,
          ticketsStarted: 0,
          ticketsPacked: 0,
          totalActions: 0,
          prepDurationSamplesMin: [],
        });
      }
    }

    // Active rider orders currently on road
    for (const activeOrd of activeRiderOrders) {
      if (!activeOrd.assignedRiderId) continue;
      const r = riderStatsMap.get(activeOrd.assignedRiderId);
      if (!r) continue;
      r.activeDrops += 1;
      if (
        activeOrd.paymentMethod === "CASH_ON_DELIVERY" &&
        activeOrd.paymentStatus !== "PAID"
      ) {
        r.codPendingOnRoadPesewas += activeOrd.totalPesewas;
      }
    }

    // Analyze current period orders + statusHistory transitions
    for (const order of currentOrders) {
      // Find key timestamps for duration calculations on this order
      let confirmedAt: Date | null = null;
      let preparingAt: Date | null = null;
      let outForDeliveryAt: Date | null = null;
      let deliveredAt: Date | null = null;

      for (const h of order.statusHistory) {
        if (h.toStatus === "CONFIRMED" && !confirmedAt) {
          confirmedAt = h.createdAt;
        }
        if (h.toStatus === "PREPARING" && !preparingAt) {
          preparingAt = h.createdAt;
        }
        if (h.toStatus === "OUT_FOR_DELIVERY" && !outForDeliveryAt) {
          outForDeliveryAt = h.createdAt;
        }
        if (h.toStatus === "DELIVERED" && !deliveredAt) {
          deliveredAt = h.createdAt;
        }

        const actorId = h.changedByUserId;
        if (!actorId) continue;

        // Cashier metrics
        const cashierEntry = cashierStatsMap.get(actorId);
        if (cashierEntry) {
          if (h.toStatus === "CONFIRMED") {
            cashierEntry.ordersConfirmed += 1;
            cashierEntry.totalActions += 1;
            const diffMin =
              (h.createdAt.getTime() - order.createdAt.getTime()) / 60_000;
            if (diffMin >= 0 && diffMin <= 240) {
              cashierEntry.confirmDurationSamplesMin.push(diffMin);
            }
          } else if (h.toStatus === "COLLECTED") {
            cashierEntry.pickupsHandedOver += 1;
            cashierEntry.totalActions += 1;
          } else if (
            h.toStatus === "REJECTED" ||
            h.toStatus === "CANCELLED"
          ) {
            cashierEntry.ordersAborted += 1;
            cashierEntry.totalActions += 1;
          }
        }

        // Kitchen metrics (also credit Admin if Admin operated KDS)
        let kitchenEntry = kitchenStatsMap.get(actorId);
        if (
          !kitchenEntry &&
          (h.toStatus === "PREPARING" ||
            h.toStatus === "READY_FOR_DISPATCH" ||
            h.toStatus === "READY_FOR_PICKUP")
        ) {
          const staffActor = staffUsers.find((u) => u.id === actorId);
          if (staffActor) {
            kitchenEntry = {
              id: staffActor.id,
              fullName: staffActor.fullName,
              role: staffActor.role,
              isActive: staffActor.isActive,
              ticketsStarted: 0,
              ticketsPacked: 0,
              totalActions: 0,
              prepDurationSamplesMin: [],
            };
            kitchenStatsMap.set(actorId, kitchenEntry);
          }
        }

        if (kitchenEntry) {
          if (h.toStatus === "PREPARING") {
            kitchenEntry.ticketsStarted += 1;
            kitchenEntry.totalActions += 1;
          } else if (
            h.toStatus === "READY_FOR_DISPATCH" ||
            h.toStatus === "READY_FOR_PICKUP"
          ) {
            kitchenEntry.ticketsPacked += 1;
            kitchenEntry.totalActions += 1;
            const baselineStart = confirmedAt || preparingAt || order.createdAt;
            const prepMin =
              (h.createdAt.getTime() - baselineStart.getTime()) / 60_000;
            if (prepMin >= 0 && prepMin <= 240) {
              kitchenEntry.prepDurationSamplesMin.push(prepMin);
            }
          }
        }
      }

      // Rider delivery credit
      if (
        order.assignedRiderId &&
        order.fulfilmentType === "DELIVERY" &&
        order.fulfilmentStatus === "DELIVERED"
      ) {
        const riderEntry = riderStatsMap.get(order.assignedRiderId);
        if (riderEntry) {
          riderEntry.completedDrops += 1;
          riderEntry.totalDeliveredValuePesewas += order.totalPesewas;
          if (order.paymentMethod === "CASH_ON_DELIVERY") {
            riderEntry.codCollectedPesewas += order.totalPesewas;
          }
          if (outForDeliveryAt && deliveredAt) {
            const roadMin =
              (deliveredAt.getTime() - outForDeliveryAt.getTime()) / 60_000;
            if (roadMin >= 0 && roadMin <= 240) {
              riderEntry.deliveryDurationSamplesMin.push(roadMin);
            }
          }
        }
      }
    }

    const avgOrNull = (arr: number[]): number | null => {
      if (arr.length === 0) return null;
      const sum = arr.reduce((a, b) => a + b, 0);
      return Math.round((sum / arr.length) * 10) / 10;
    };

    const ridersPerformance = Array.from(riderStatsMap.values())
      .map((r) => ({
        id: r.id,
        fullName: r.fullName,
        phone: r.phone,
        isActive: r.isActive,
        completedDrops: r.completedDrops,
        activeDrops: r.activeDrops,
        totalDeliveredValuePesewas: r.totalDeliveredValuePesewas,
        codCollectedPesewas: r.codCollectedPesewas,
        codPendingOnRoadPesewas: r.codPendingOnRoadPesewas,
        avgDeliveryMinutes: avgOrNull(r.deliveryDurationSamplesMin),
      }))
      .sort(
        (a, b) =>
          b.completedDrops - a.completedDrops ||
          b.totalDeliveredValuePesewas - a.totalDeliveredValuePesewas
      );

    const cashiersPerformance = Array.from(cashierStatsMap.values())
      .map((c) => ({
        id: c.id,
        fullName: c.fullName,
        role: c.role,
        isActive: c.isActive,
        ordersConfirmed: c.ordersConfirmed,
        pickupsHandedOver: c.pickupsHandedOver,
        ordersAborted: c.ordersAborted,
        totalActions: c.totalActions,
        avgConfirmationMinutes: avgOrNull(c.confirmDurationSamplesMin),
      }))
      .sort((a, b) => b.totalActions - a.totalActions);

    const kitchenPerformance = Array.from(kitchenStatsMap.values())
      .map((k) => ({
        id: k.id,
        fullName: k.fullName,
        role: k.role,
        isActive: k.isActive,
        ticketsStarted: k.ticketsStarted,
        ticketsPacked: k.ticketsPacked,
        totalActions: k.totalActions,
        avgPrepMinutes: avgOrNull(k.prepDurationSamplesMin),
      }))
      .sort((a, b) => b.ticketsPacked - a.ticketsPacked || b.totalActions - a.totalActions);

    // Customer Performance & Retention Insights
    const priorCustomerKeys = new Set<string>();
    for (const po of priorOrdersMeta) {
      const k = normalizeCustomerCohortKey(po);
      if (k !== "anonymous") {
        priorCustomerKeys.add(k);
      }
    }

    const customerProfilesMap = new Map<
      string,
      {
        key: string;
        name: string;
        phone: string;
        email: string;
        isRegistered: boolean;
        orderCount: number;
        totalSpendPesewas: number;
        lastOrderAt: Date;
        dishCounts: Map<string, number>;
      }
    >();

    let registeredOrderCount = 0;
    let guestOrderCount = 0;

    for (const order of currentOrders) {
      if (
        isAbortedOrder(order) ||
        order.paymentStatus === "REFUNDED" ||
        order.paymentStatus === "REFUND_PENDING"
      ) {
        continue;
      }

      if (order.customerId) {
        registeredOrderCount += 1;
      } else {
        guestOrderCount += 1;
      }

      const key = normalizeCustomerCohortKey(order);
      const displayName =
        order.customer?.fullName ||
        order.guestName?.trim() ||
        "Walk-In / Guest";
      const displayPhone =
        order.customer?.phone || order.guestPhone?.trim() || "—";
      const displayEmail =
        order.customer?.email || order.guestEmail?.trim() || "—";

      const existing = customerProfilesMap.get(key) || {
        key,
        name: displayName,
        phone: displayPhone,
        email: displayEmail,
        isRegistered: Boolean(order.customerId),
        orderCount: 0,
        totalSpendPesewas: 0,
        lastOrderAt: order.createdAt,
        dishCounts: new Map<string, number>(),
      };

      existing.orderCount += 1;
      existing.totalSpendPesewas += order.totalPesewas;
      if (order.customerId) {
        existing.isRegistered = true;
      }
      if (order.createdAt > existing.lastOrderAt) {
        existing.lastOrderAt = order.createdAt;
        if (displayName !== "Walk-In / Guest") existing.name = displayName;
      }

      for (const item of order.items) {
        const dName = item.itemNameSnapshot.trim();
        existing.dishCounts.set(
          dName,
          (existing.dishCounts.get(dName) || 0) + item.quantity
        );
      }

      customerProfilesMap.set(key, existing);
    }

    let newCustomersCount = 0;
    let returningCustomersCount = 0;

    for (const profile of customerProfilesMap.values()) {
      const hadPriorOrder = priorCustomerKeys.has(profile.key);
      if (hadPriorOrder || profile.orderCount >= 2) {
        returningCustomersCount += 1;
      } else {
        newCustomersCount += 1;
      }
    }

    const uniqueCustomersCount = customerProfilesMap.size;
    const repeatCustomerRatePct =
      uniqueCustomersCount > 0
        ? Math.round((returningCustomersCount / uniqueCustomersCount) * 1000) /
          10
        : 0;

    const totalCustomerOrders = registeredOrderCount + guestOrderCount;
    const registeredSharePct =
      totalCustomerOrders > 0
        ? Math.round((registeredOrderCount / totalCustomerOrders) * 1000) / 10
        : 0;

    const topCustomers = Array.from(customerProfilesMap.values())
      .sort(
        (a, b) =>
          b.totalSpendPesewas - a.totalSpendPesewas ||
          b.orderCount - a.orderCount
      )
      .slice(0, 15)
      .map((c) => {
        let favoriteDish = "—";
        let maxPortions = 0;
        for (const [dName, qty] of c.dishCounts.entries()) {
          if (qty > maxPortions) {
            maxPortions = qty;
            favoriteDish = `${dName} (${qty}x)`;
          }
        }

        return {
          key: c.key,
          name: c.name,
          phone: c.phone,
          email: c.email,
          isRegistered: c.isRegistered,
           isReturning:
            priorCustomerKeys.has(c.key) || c.orderCount >= 2,
          orderCount: c.orderCount,
          totalSpendPesewas: c.totalSpendPesewas,
          avgOrderPesewas:
            c.orderCount > 0
              ? Math.round(c.totalSpendPesewas / c.orderCount)
              : 0,
          favoriteDish,
          lastOrderAt: c.lastOrderAt.toISOString(),
        };
      });

    // Optional CSV Report Export
    if (format === "csv") {
      const lines: string[] = [];

      lines.push(
        ["SIKA CUISINE SUNYANI — ADMIN ANALYTICS REPORT", bounds.periodLabel]
          .map(escapeCsvCell)
          .join(",")
      );
      lines.push("");

      lines.push("1. EXECUTIVE SUMMARY");
      lines.push(
        [
          "Metric",
          "Current Period",
          `Previous Period (${bounds.comparisonLabel})`,
          "Change (%)",
        ]
          .map(escapeCsvCell)
          .join(",")
      );
      lines.push(
        [
          "Net Settled Revenue",
          formatPesewasToGhs(currentSummary.netSettledRevenuePesewas),
          formatPesewasToGhs(previousSummary.netSettledRevenuePesewas),
          `${deltas.netRevenuePct}%`,
        ]
          .map(escapeCsvCell)
          .join(",")
      );
      lines.push(
        [
          "Gross Order Pipeline",
          formatPesewasToGhs(currentSummary.grossPipelinePesewas),
          formatPesewasToGhs(previousSummary.grossPipelinePesewas),
          `${deltas.grossPipelinePct}%`,
        ]
          .map(escapeCsvCell)
          .join(",")
      );
      lines.push(
        [
          "Valid Orders",
          currentSummary.validOrderCount,
          previousSummary.validOrderCount,
          `${deltas.validOrdersPct}%`,
        ]
          .map(escapeCsvCell)
          .join(",")
      );
      lines.push(
        [
          "Average Order Value (AOV)",
          formatPesewasToGhs(currentSummary.avgOrderValuePesewas),
          formatPesewasToGhs(previousSummary.avgOrderValuePesewas),
          `${deltas.avgOrderValuePct}%`,
        ]
          .map(escapeCsvCell)
          .join(",")
      );
      lines.push("");

      lines.push("2. SALES BUCKET BREAKDOWN");
      lines.push(
        [
          "Time Bucket",
          "Valid Orders",
          "Gross Sales (GHS)",
          "Paystack (GHS)",
          "Cash (GHS)",
          "Cancelled / Rejected",
        ]
          .map(escapeCsvCell)
          .join(",")
      );
      for (const b of chartBuckets) {
        lines.push(
          [
            b.label,
            b.orderCount,
            (b.revenuePesewas / 100).toFixed(2),
            (b.paystackPesewas / 100).toFixed(2),
            (b.cashPesewas / 100).toFixed(2),
            b.abortedCount,
          ]
            .map(escapeCsvCell)
            .join(",")
        );
      }
      lines.push("");

      lines.push("3. DELIVERY RIDER PERFORMANCE");
      lines.push(
        [
          "Rider Name",
          "Phone",
          "Completed Drops",
          "Active On Road",
          "Total Delivered (GHS)",
          "COD Cash Collected (GHS)",
          "Pending COD on Road (GHS)",
          "Avg Delivery Time (mins)",
        ]
          .map(escapeCsvCell)
          .join(",")
      );
      for (const r of ridersPerformance) {
        lines.push(
          [
            r.fullName,
            r.phone,
            r.completedDrops,
            r.activeDrops,
            (r.totalDeliveredValuePesewas / 100).toFixed(2),
            (r.codCollectedPesewas / 100).toFixed(2),
            (r.codPendingOnRoadPesewas / 100).toFixed(2),
            r.avgDeliveryMinutes ?? "—",
          ]
            .map(escapeCsvCell)
            .join(",")
        );
      }
      lines.push("");

      lines.push("4. TOP CUSTOMERS");
      lines.push(
        [
          "Customer Name",
          "Phone",
          "Email",
          "Account Type",
          "Orders",
          "Total Spend (GHS)",
          "Avg Basket (GHS)",
          "Favorite Dish",
        ]
          .map(escapeCsvCell)
          .join(",")
      );
      for (const c of topCustomers) {
        lines.push(
          [
            c.name,
            c.phone,
            c.email,
            c.isRegistered ? "Registered" : "Guest",
            c.orderCount,
            (c.totalSpendPesewas / 100).toFixed(2),
            (c.avgOrderPesewas / 100).toFixed(2),
            c.favoriteDish,
          ]
            .map(escapeCsvCell)
            .join(",")
        );
      }

      const dateStamp = new Date().toISOString().slice(0, 10);
      return new NextResponse(lines.join("\r\n"), {
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="sika-analytics-${period}-${dateStamp}.csv"`,
          "Cache-Control": "no-store",
        },
      });
    }

    return NextResponse.json({
      success: true,
      period,
      periodLabel: bounds.periodLabel,
      comparisonLabel: bounds.comparisonLabel,
      currentStart: bounds.currentStart.toISOString(),
      currentEnd: bounds.currentEnd.toISOString(),
      summary: currentSummary,
      previousSummary,
      deltas,
      chartBuckets,
      topDishes,
      topZones,
      workers: {
        riders: ridersPerformance,
        cashiers: cashiersPerformance,
        kitchen: kitchenPerformance,
      },
      customers: {
        uniqueCustomersCount,
        newCustomersCount,
        returningCustomersCount,
        repeatCustomerRatePct,
        registeredOrderCount,
        guestOrderCount,
        registeredSharePct,
        topCustomers,
      },
    });
  } catch (error) {
    console.error("[API v1 Admin Analytics Error]:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Unable to compute restaurant analytics right now.",
      },
      { status: 500 }
    );
  }
}
