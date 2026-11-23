import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verifySameOriginMutation } from "@/lib/auth/csrf";
import { getAuthUser } from "@/lib/auth/session";
import { recordAuditLog } from "@/lib/audit";
import { notifyRiderAssigned } from "@/lib/notifications";

const assignRiderSchema = z.object({
  riderId: z.string().min(1).nullable(),
});

/**
 * PATCH /api/v1/admin/orders/[id]/assign-rider
 * Assigns (or unassigns) a verified DELIVERY_RIDER account to a delivery order.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!verifySameOriginMutation(req)) {
      return NextResponse.json(
        { success: false, error: "Cross-origin request rejected." },
        { status: 403 }
      );
    }

    const user = await getAuthUser(req);
    if (!user) {
      return NextResponse.json({ success: false, error: "Authentication required." }, { status: 401 });
    }
    if (!["ADMIN", "STAFF_CASHIER"].includes(user.role)) {
      return NextResponse.json({ success: false, error: "Insufficient permissions." }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();
    const parsed = assignRiderSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Invalid rider assignment payload." },
        { status: 400 }
      );
    }

    const order = await prisma.order.findUnique({ where: { id } });
    if (!order) {
      return NextResponse.json({ success: false, error: "Order not found." }, { status: 404 });
    }
    if (order.fulfilmentType !== "DELIVERY") {
      return NextResponse.json(
        { success: false, error: "Collection orders cannot be assigned to a rider." },
        { status: 400 }
      );
    }

    let riderName = "Unassigned";
    if (parsed.data.riderId) {
      const rider = await prisma.user.findFirst({
        where: { id: parsed.data.riderId, role: "DELIVERY_RIDER" },
        select: { id: true, fullName: true },
      });
      if (!rider) {
        return NextResponse.json(
          { success: false, error: "Selected rider account not found." },
          { status: 404 }
        );
      }
      riderName = rider.fullName;
    }

    const updated = await prisma.$transaction(async (tx) => {
      const updatedOrder = await tx.order.update({
        where: { id },
        data: { assignedRiderId: parsed.data.riderId },
        include: {
          deliveryAddress: true,
          assignedRider: {
            select: { id: true, fullName: true, phone: true },
          },
        },
      });

      await tx.orderStatusHistory.create({
        data: {
          orderId: id,
          fromStatus: order.fulfilmentStatus,
          toStatus: order.fulfilmentStatus,
          changedByUserId: user.id,
          note: parsed.data.riderId
            ? `Assigned delivery rider: ${riderName}.`
            : "Delivery rider assignment cleared.",
        },
      });

      return updatedOrder;
    });

    await recordAuditLog({
      userId: user.id,
      action: "ORDER_RIDER_ASSIGNED",
      entityType: "Order",
      entityId: updated.id,
      metadata: { orderNumber: updated.orderNumber, assignedRiderId: parsed.data.riderId },
      req,
    });

    if (parsed.data.riderId && updated.assignedRider) {
      void notifyRiderAssigned({
        riderId: updated.assignedRider.id,
        riderName: updated.assignedRider.fullName,
        riderPhone: updated.assignedRider.phone,
        orderId: updated.id,
        orderNumber: updated.orderNumber,
        recipientName:
          updated.deliveryAddress?.recipientName || updated.guestName || "Customer",
        areaLocality: updated.deliveryAddress?.areaLocality || "Sunyani",
        landmark: updated.deliveryAddress?.landmark,
        paymentMethod: updated.paymentMethod,
        paymentStatus: updated.paymentStatus,
        totalPesewas: updated.totalPesewas,
      }).catch(() => {});
    }

    return NextResponse.json({ success: true, order: updated }, { status: 200 });
  } catch (error) {
    console.error("[API v1 Admin Assign Rider Error]:", error);
    return NextResponse.json(
      { success: false, error: "Failed to assign delivery rider." },
      { status: 500 }
    );
  }
}
