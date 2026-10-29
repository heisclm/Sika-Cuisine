import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await getAuthUser(req);
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Authentication required to view order history." },
        { status: 401 }
      );
    }

    const orders = await prisma.order.findMany({
      where: {
        OR: [
          { customerId: session.id },
          { guestEmail: session.email },
        ],
      },
      orderBy: { createdAt: "desc" },
      include: {
        items: true,
        deliveryAddress: true,
        statusHistory: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    return NextResponse.json({
      success: true,
      orders,
    });
  } catch (error: any) {
    console.error("[API v1 My Orders Error]:", error);
    return NextResponse.json(
      { success: false, error: "Unable to retrieve order history." },
      { status: 500 }
    );
  }
}
