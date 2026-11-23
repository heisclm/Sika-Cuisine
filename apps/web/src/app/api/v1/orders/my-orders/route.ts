import { NextRequest, NextResponse } from "next/server";
import {
  ACTIVE_ORDER_STATUSES,
  PAST_ORDER_STATUSES,
  getDateRangeBounds,
} from "@sika/shared";
import { getAuthUser } from "@/lib/auth/session";
import { syncPendingPaystackRefunds } from "@/lib/payments";
import { prisma } from "@/lib/prisma";

function buildCustomerOrderWhere(customerId: string, searchParams: URLSearchParams) {
  const scope = (searchParams.get("scope") || "all").toLowerCase();
  const status = searchParams.get("status")?.trim().toUpperCase();
  const fulfilmentType = searchParams.get("fulfilmentType")?.trim().toUpperCase();
  const dateRange = searchParams.get("dateRange")?.trim().toLowerCase();
  const search = searchParams.get("search")?.trim();

  const where: any = {
    customerId,
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

export async function GET(req: NextRequest) {
  try {
    const session = await getAuthUser(req);
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Authentication required to view order history." },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const limitRaw = Number(searchParams.get("limit") || "15");
    const limit = Number.isFinite(limitRaw)
      ? Math.max(1, Math.min(50, Math.floor(limitRaw)))
      : 15;
    const cursor = searchParams.get("cursor")?.trim() || null;

    const where = buildCustomerOrderWhere(session.id, searchParams);

    await syncPendingPaystackRefunds().catch(() => {});

    const [ordersPage, activeCount, pastCount] = await Promise.all([
      prisma.order.findMany({
        where,
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        take: limit + 1,
        ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
        include: {
          items: {
            include: {
              menuItem: {
                select: { imageUrl: true },
              },
            },
          },
          deliveryAddress: true,
          statusHistory: {
            orderBy: { createdAt: "asc" },
          },
          paymentAttempts: {
            orderBy: { createdAt: "desc" },
            take: 1,
            select: { reference: true },
          },
        },
      }),
      prisma.order.count({
        where: {
          customerId: session.id,
          fulfilmentStatus: { in: [...ACTIVE_ORDER_STATUSES] },
        },
      }),
      prisma.order.count({
        where: {
          customerId: session.id,
          fulfilmentStatus: { in: [...PAST_ORDER_STATUSES] },
        },
      }),
    ]);

    const hasMore = ordersPage.length > limit;
    const sliced = hasMore ? ordersPage.slice(0, limit) : ordersPage;
    const nextCursor = hasMore ? sliced[sliced.length - 1]?.id ?? null : null;

    const orders = sliced.map((order) => {
      const mappedItems = order.items.map((item) => ({
        id: item.id,
        orderId: item.orderId,
        menuItemId: item.menuItemId,
        itemNameSnapshot: item.itemNameSnapshot,
        imageUrl: item.menuItem?.imageUrl ?? null,
        unitPricePesewas: item.unitPricePesewas,
        quantity: item.quantity,
        subtotalPesewas: item.subtotalPesewas,
        selectedOptionsSnapshot: item.selectedOptionsSnapshot,
        specialInstructions: item.specialInstructions,
      }));
      const primaryImageUrl =
        mappedItems.find((i) => Boolean(i.imageUrl))?.imageUrl ?? null;

      return {
        ...order,
        primaryImageUrl,
        latestPaymentReference: order.paymentAttempts[0]?.reference ?? null,
        items: mappedItems,
      };
    });

    return NextResponse.json({
      success: true,
      orders,
      nextCursor,
      hasMore,
      activeCount,
      pastCount,
    });
  } catch (error: any) {
    console.error("[API v1 My Orders Error]:", error);
    return NextResponse.json(
      { success: false, error: "Unable to retrieve order history." },
      { status: 500 }
    );
  }
}
