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

    // Role-strict access control & IDOR isolation
    const isAdminOrCashier =
      session.role === "ADMIN" || session.role === "STAFF_CASHIER";
    const isKitchenStaff = session.role === "STAFF_KITCHEN";
    const isAssignedRider =
      session.role === "DELIVERY_RIDER" && order.assignedRiderId === session.id;
    const isCustomerOwner =
      session.role === "CUSTOMER" && order.customerId === session.id;

    if (
      !isAdminOrCashier &&
      !isKitchenStaff &&
      !isAssignedRider &&
      !isCustomerOwner
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Access denied. You do not have permission to view this order.",
        },
        { status: 403 }
      );
    }

    if (isKitchenStaff) {
      return NextResponse.json({
        success: true,
        order: {
          id: order.id,
          orderNumber: order.orderNumber,
          guestName: order.guestName,
          fulfilmentType: order.fulfilmentType,
          fulfilmentStatus: order.fulfilmentStatus,
          customerNotes: order.customerNotes,
          createdAt: order.createdAt,
          updatedAt: order.updatedAt,
          deliveryAddress: order.deliveryAddress
            ? { areaLocality: order.deliveryAddress.areaLocality }
            : null,
          statusHistory: order.statusHistory,
          items: order.items.map((item) => ({
            id: item.id,
            itemNameSnapshot: item.itemNameSnapshot,
            quantity: item.quantity,
            selectedOptionsSnapshot: item.selectedOptionsSnapshot,
            specialInstructions: item.specialInstructions,
          })),
        },
      });
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
