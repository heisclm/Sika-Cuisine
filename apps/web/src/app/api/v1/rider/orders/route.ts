import { NextRequest, NextResponse } from "next/server";
import { getDateRangeBounds } from "@sika/shared";
import { getAuthUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getAuthUser(request);
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Authentication required." },
        { status: 401 }
      );
    }
    if (session.role !== "DELIVERY_RIDER") {
      return NextResponse.json(
        { success: false, error: "Rider access required." },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const scope = (searchParams.get("scope") || "all").trim().toLowerCase();
    const dateRange = (searchParams.get("dateRange") || "today").trim().toLowerCase();
    const paymentFilter = (searchParams.get("paymentFilter") || "all").trim().toLowerCase();
    const statusParam = searchParams.get("status")?.trim().toUpperCase();

    const completedBounds = getDateRangeBounds(dateRange);
    const createdAtFilter =
      completedBounds.gte || completedBounds.lt ? completedBounds : undefined;

    const where: any = {
      assignedRiderId: session.id,
      fulfilmentType: "DELIVERY",
    };

    if (paymentFilter === "cod") {
      where.paymentMethod = "CASH_ON_DELIVERY";
    } else if (paymentFilter === "prepaid") {
      where.paymentMethod = "PAYSTACK";
    }

    if (scope === "active") {
      where.fulfilmentStatus =
        statusParam === "READY_FOR_DISPATCH" || statusParam === "OUT_FOR_DELIVERY"
          ? statusParam
          : { in: ["READY_FOR_DISPATCH", "OUT_FOR_DELIVERY"] };
    } else if (scope === "completed") {
      where.fulfilmentStatus = "DELIVERED";
      if (createdAtFilter) {
        where.createdAt = createdAtFilter;
      }
    } else {
      const activeStatuses =
        statusParam === "READY_FOR_DISPATCH" || statusParam === "OUT_FOR_DELIVERY"
          ? [statusParam]
          : ["READY_FOR_DISPATCH", "OUT_FOR_DELIVERY"];

      where.OR = [
        { fulfilmentStatus: { in: activeStatuses } },
        {
          fulfilmentStatus: "DELIVERED",
          ...(createdAtFilter ? { createdAt: createdAtFilter } : {}),
        },
      ];
    }

    const orders = await prisma.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: { deliveryAddress: true, items: true },
      take: 120,
    });

    return NextResponse.json({
      success: true,
      riderName: session.fullName,
      orders,
    });
  } catch (error) {
    console.error("[API v1 Rider Orders Error]:", error);
    return NextResponse.json(
      { success: false, error: "Unable to load assigned deliveries." },
      { status: 500 }
    );
  }
}
