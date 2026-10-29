import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await getAuthUser(req);
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Authentication required." },
        { status: 401 }
      );
    }

    const isStaff = ["ADMIN", "STAFF_CASHIER", "STAFF_KITCHEN", "DELIVERY_RIDER"].includes(
      session.role
    );

    if (!isStaff) {
      return NextResponse.json(
        { success: false, error: "Access denied. Staff privileges required." },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const fulfilmentType = searchParams.get("fulfilmentType");
    const paymentStatus = searchParams.get("paymentStatus");
    const search = searchParams.get("search");

    const where: any = {};

    if (status && status !== "ALL") {
      where.fulfilmentStatus = status;
    }
    if (fulfilmentType) {
      where.fulfilmentType = fulfilmentType;
    }
    if (paymentStatus) {
      where.paymentStatus = paymentStatus;
    }
    if (search) {
      where.OR = [
        { orderNumber: { contains: search, mode: "insensitive" } },
        { guestName: { contains: search, mode: "insensitive" } },
        { guestPhone: { contains: search } },
      ];
    }

    const orders = await prisma.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        items: true,
        deliveryAddress: true,
        statusHistory: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
      take: 100,
    });

    return NextResponse.json({
      success: true,
      count: orders.length,
      orders,
    });
  } catch (error: any) {
    console.error("[API v1 Admin Orders Error]:", error);
    return NextResponse.json(
      { success: false, error: "Unable to retrieve orders queue." },
      { status: 500 }
    );
  }
}
