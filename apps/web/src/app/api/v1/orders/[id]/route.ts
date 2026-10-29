import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getAuthUser(req);

    if (!session) {
      return NextResponse.json(
        { success: false, error: "Authentication required to access order details." },
        { status: 401 }
      );
    }

    const order = await prisma.order.findFirst({
      where: {
        OR: [{ id }, { orderNumber: id }],
      },
      include: {
        items: true,
        deliveryAddress: true,
        statusHistory: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!order) {
      return NextResponse.json(
        { success: false, error: "Order not found." },
        { status: 404 }
      );
    }

    // IDOR Defense: verify order ownership or staff privileges
    const isStaff = ["ADMIN", "STAFF_CASHIER", "STAFF_KITCHEN", "DELIVERY_RIDER"].includes(
      session.role
    );
    const isOwner =
      order.customerId === session.id ||
      (order.guestEmail && order.guestEmail.toLowerCase() === session.email.toLowerCase());

    if (!isStaff && !isOwner) {
      return NextResponse.json(
        { success: false, error: "Access denied. You do not have permission to view this order." },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      order,
    });
  } catch (error: any) {
    console.error("[API v1 Order Detail Error]:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error." },
      { status: 500 }
    );
  }
}
