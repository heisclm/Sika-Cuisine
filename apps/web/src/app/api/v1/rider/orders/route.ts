import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getAuthUser(request);
    if (!session) return NextResponse.json({ success: false, error: "Authentication required." }, { status: 401 });
    if (session.role !== "DELIVERY_RIDER") return NextResponse.json({ success: false, error: "Rider access required." }, { status: 403 });

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const orders = await prisma.order.findMany({
      where: {
        assignedRiderId: session.id,
        fulfilmentType: "DELIVERY",
        OR: [
          { fulfilmentStatus: { in: ["READY_FOR_DISPATCH", "OUT_FOR_DELIVERY"] } },
          { fulfilmentStatus: "DELIVERED", createdAt: { gte: startOfDay } },
        ],
      },
      orderBy: { createdAt: "desc" },
      include: { deliveryAddress: true, items: true },
      take: 100,
    });

    return NextResponse.json({ success: true, riderName: session.fullName, orders });
  } catch (error) {
    console.error("[API v1 Rider Orders Error]:", error);
    return NextResponse.json({ success: false, error: "Unable to load assigned deliveries." }, { status: 500 });
  }
}
