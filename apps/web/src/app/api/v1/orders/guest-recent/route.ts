import { NextRequest, NextResponse } from "next/server";
import {
  ACTIVE_ORDER_STATUSES,
  PAST_ORDER_STATUSES,
  getDateRangeBounds,
} from "@sika/shared";
import { readGuestReceiptOrderNumbers } from "@/lib/auth/guest-receipt";
import { prisma } from "@/lib/prisma";

function buildGuestOrderFilterWhere(
  orderNumbers: string[],
  searchParams: URLSearchParams
) {
  const scope = (searchParams.get("scope") || "all").toLowerCase();
  const status = searchParams.get("status")?.trim().toUpperCase();
  const fulfilmentType = searchParams.get("fulfilmentType")?.trim().toUpperCase();
  const dateRange = searchParams.get("dateRange")?.trim().toLowerCase();
  const search = searchParams.get("search")?.trim();

  const where: any = {
    orderNumber: { in: orderNumbers },
  };

  if (scope === "active") {
    where.fulfilmentStatus = { in: [...ACTIVE_ORDER_STATUSES] };
  } else if (scope === "past") {
    where.fulfilmentStatus = { in: [...PAST_ORDER_STATUSES] };
  }

  if (status && status !== "ALL") {
    if (status === "REFUNDED") {
      where.paymentStatus = { in: ["REFUND_PENDING", "REFUNDED"] };
    } else if (status === "COMPLETED") {
      where.fulfilmentStatus = { in: ["DELIVERED", "COLLECTED"] };
    } else if (status === "ABORTED") {
      where.fulfilmentStatus = { in: ["CANCELLED", "REJECTED"] };
    } else {
      where.fulfilmentStatus = status;
    }
  }

  if (fulfilmentType === "DELIVERY" || fulfilmentType === "COLLECTION") {
    where.fulfilmentType = fulfilmentType;
  }

  const bounds = getDateRangeBounds(dateRange);
  if (bounds.gte || bounds.lt) {
    where.createdAt = bounds;
  }

  if (search) {
    where.OR = [
      { orderNumber: { contains: search, mode: "insensitive" } },
      {
        items: {
          some: {
            itemNameSnapshot: { contains: search, mode: "insensitive" },
          },
        },
      },
    ];
  }

  return where;
}

/**
 * GET /api/v1/orders/guest-recent
 * Returns recent non-PII orders placed on the current browser using the signed
 * `sika_guest_receipts` cookie so Web guests automatically see active & recent orders.
 */
export async function GET(req: NextRequest) {
  try {
    const orderNumbers = await readGuestReceiptOrderNumbers();
    if (orderNumbers.length === 0) {
      return NextResponse.json({
        success: true,
        orders: [],
        activeCount: 0,
        pastCount: 0,
      });
    }

    const { searchParams } = new URL(req.url);
    const where = buildGuestOrderFilterWhere(orderNumbers, searchParams);

    const [orders, activeCount, pastCount] = await Promise.all([
      prisma.order.findMany({
        where,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          orderNumber: true,
          fulfilmentType: true,
          fulfilmentStatus: true,
          paymentMethod: true,
          paymentStatus: true,
          subtotalPesewas: true,
          deliveryFeePesewas: true,
          discountPesewas: true,
          totalPesewas: true,
          rejectionReason: true,
          cancellationReason: true,
          estimatedDeliveryMinutes: true,
          createdAt: true,
          updatedAt: true,
          items: {
            select: {
              id: true,
              menuItemId: true,
              itemNameSnapshot: true,
              unitPricePesewas: true,
              quantity: true,
              subtotalPesewas: true,
              selectedOptionsSnapshot: true,
              menuItem: { select: { imageUrl: true } },
            },
          },
          paymentAttempts: {
            orderBy: { createdAt: "desc" },
            take: 1,
            select: { reference: true },
          },
        },
        take: 20,
      }),
      prisma.order.count({
        where: {
          orderNumber: { in: orderNumbers },
          fulfilmentStatus: { in: [...ACTIVE_ORDER_STATUSES] },
        },
      }),
      prisma.order.count({
        where: {
          orderNumber: { in: orderNumbers },
          fulfilmentStatus: { in: [...PAST_ORDER_STATUSES] },
        },
      }),
    ]);

    const serialized = orders.map((order) => {
      const serializedItems = order.items.map((item) => ({
        id: item.id,
        menuItemId: item.menuItemId,
        itemNameSnapshot: item.itemNameSnapshot,
        imageUrl: item.menuItem?.imageUrl ?? null,
        unitPricePesewas: item.unitPricePesewas,
        quantity: item.quantity,
        subtotalPesewas: item.subtotalPesewas,
        selectedOptionsSnapshot: item.selectedOptionsSnapshot,
      }));
      const primaryImageUrl =
        serializedItems.find((i) => Boolean(i.imageUrl))?.imageUrl ?? null;

      return {
        id: order.id,
        orderNumber: order.orderNumber,
        fulfilmentType: order.fulfilmentType,
        fulfilmentStatus: order.fulfilmentStatus,
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
        subtotalPesewas: order.subtotalPesewas,
        deliveryFeePesewas: order.deliveryFeePesewas,
        discountPesewas: order.discountPesewas,
        totalPesewas: order.totalPesewas,
        rejectionReason: order.rejectionReason,
        cancellationReason: order.cancellationReason,
        estimatedDeliveryMinutes: order.estimatedDeliveryMinutes,
        primaryImageUrl,
        latestPaymentReference: order.paymentAttempts[0]?.reference ?? null,
        items: serializedItems,
        createdAt: order.createdAt.toISOString(),
        updatedAt: order.updatedAt.toISOString(),
      };
    });

    return NextResponse.json({
      success: true,
      orders: serialized,
      activeCount,
      pastCount,
    });
  } catch (error) {
    console.error("[API v1 Guest Recent Orders Error]:", error);
    return NextResponse.json(
      { success: false, error: "Unable to retrieve guest order history." },
      { status: 500 }
    );
  }
}
