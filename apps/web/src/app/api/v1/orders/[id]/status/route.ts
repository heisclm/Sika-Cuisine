/**
 * @file apps/web/src/app/api/v1/orders/[id]/status/route.ts
 * @description State transition and audit logging route handler for staff kitchen and delivery workflows.
 *
 * GOVERNANCE & SECURITY DESIGN:
 * 1. State Machine Enforcement: Executes isValidOrderTransition() from @sika/shared to block cross-workflow
 *    or skipped states (e.g. attempting to mark a pickup order OUT_FOR_DELIVERY).
 * 2. Role-Based Access Control (RBAC): Executes isRoleAuthorizedForTransition() to ensure kitchen staff, cashiers,
 *    riders, and customers only perform their authorized actions.
 * 3. Immutable Audit Logging: Atomically appends an entry to OrderStatusHistory preserving previous state,
 *    target state, actor ID, and optional operational notes.
 */

import { NextRequest, NextResponse } from "next/server";
import {
  buildOrderStatusHistoryNote,
  canConfirmOrFulfilOrder,
  shouldAutoRefundOrder,
  updateOrderStatusSchema,
  isValidOrderTransition,
  isRoleAuthorizedForTransition,
} from "@sika/shared";
import { getAuthUser } from "@/lib/auth/session";
import { verifySameOriginMutation } from "@/lib/auth/csrf";
import { prisma } from "@/lib/prisma";
import { recordAuditLog } from "@/lib/audit";
import { notifyOrderStatusChanged } from "@/lib/notifications";
import { initiateOrderRefund } from "@/lib/payments";

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

    const { id } = await params;
    const session = await getAuthUser(req);

    if (!session) {
      return NextResponse.json(
        { success: false, error: "Authentication required to update order status." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const validated = updateOrderStatusSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation failed",
          details: validated.error.flatten(),
        },
        { status: 400 }
      );
    }

    const { targetStatus, note, rejectionReason, cancellationReason } = validated.data;

    const order = await prisma.order.findFirst({
      where: {
        OR: [{ id }, { orderNumber: id }],
      },
    });

    if (!order) {
      return NextResponse.json(
        { success: false, error: "Order not found." },
        { status: 404 }
      );
    }

    const currentStatus = order.fulfilmentStatus as any;
    const fulfilmentType = order.fulfilmentType as any;

    // 1. Enforce State Machine Transition Rules
    const isValidTransition = isValidOrderTransition(
      fulfilmentType,
      currentStatus,
      targetStatus
    );

    if (!isValidTransition) {
      return NextResponse.json(
        {
          success: false,
          error: `Illegal state transition: Cannot advance ${fulfilmentType} order from ${currentStatus} to ${targetStatus}.`,
        },
        { status: 422 }
      );
    }

    // 2. Enforce Role Authorization for Transition
    const roleAuth = isRoleAuthorizedForTransition(
      session.role as any,
      currentStatus,
      targetStatus
    );

    if (!roleAuth.authorized) {
      return NextResponse.json(
        {
          success: false,
          error: roleAuth.reason || "Unauthorized to perform this status transition.",
        },
        { status: 403 }
      );
    }

    // 3. Enforce Server-Side Payment Gate on Online Orders
    const paymentGate = canConfirmOrFulfilOrder(
      order.paymentMethod as any,
      order.paymentStatus as any,
      targetStatus
    );

    if (!paymentGate.allowed) {
      return NextResponse.json(
        {
          success: false,
          error:
            paymentGate.reason ||
            "Online Paystack payment must be verified before confirming or preparing this order.",
        },
        { status: 409 }
      );
    }

    // Ownership enforcement for non-admin operational actors
    if (session.role === "DELIVERY_RIDER" && order.assignedRiderId !== session.id) {
      return NextResponse.json(
        {
          success: false,
          error: "You can only update delivery orders assigned to you.",
        },
        { status: 403 }
      );
    }

    if (session.role === "CUSTOMER" && order.customerId !== session.id) {
      return NextResponse.json(
        {
          success: false,
          error: "You can only cancel your own orders.",
        },
        { status: 403 }
      );
    }

    // 3. Atomically Update Order and Append Status History
    const updatedOrder = await prisma.$transaction(async (tx) => {
      const updateData: any = {
        fulfilmentStatus: targetStatus,
      };

      if (targetStatus === "REJECTED" && rejectionReason) {
        updateData.rejectionReason = rejectionReason;
      }
      if (targetStatus === "CANCELLED" && cancellationReason) {
        updateData.cancellationReason = cancellationReason;
      }

      if (
        order.paymentStatus === "PENDING" &&
        ((targetStatus === "DELIVERED" && order.paymentMethod === "CASH_ON_DELIVERY") ||
          (targetStatus === "COLLECTED" && order.paymentMethod === "CASH_ON_COLLECTION"))
      ) {
        updateData.paymentStatus = "PAID";
      }

      const o = await tx.order.update({
        where: { id: order.id },
        data: updateData,
        include: { items: true },
      });

      await tx.orderStatusHistory.create({
        data: {
          orderId: order.id,
          fromStatus: currentStatus,
          toStatus: targetStatus,
          note:
            note ||
            buildOrderStatusHistoryNote(targetStatus, {
              fulfilmentType: order.fulfilmentType,
            }),
          changedByUserId: session.id,
        },
      });

      return o;
    });

    await recordAuditLog({
      userId: session.id,
      action: "ORDER_STATUS_UPDATED",
      entityType: "Order",
      entityId: order.id,
      metadata: {
        orderNumber: order.orderNumber,
        fromStatus: currentStatus,
        toStatus: targetStatus,
      },
      req,
    });

    let refundSummary: {
      initiated: boolean;
      status?: string;
      error?: string;
    } | null = null;
    let finalPaymentStatus = updatedOrder.paymentStatus;

    if (
      shouldAutoRefundOrder(
        order.paymentMethod as any,
        order.paymentStatus as any,
        targetStatus
      )
    ) {
      const refundReason =
        rejectionReason ||
        cancellationReason ||
        note ||
        `Order ${targetStatus.toLowerCase()} by ${session.fullName}`;

      const refundRes = await initiateOrderRefund({
        orderId: order.id,
        reason: refundReason,
        initiatedByUserId: session.id,
        initiatedByName: session.fullName,
        req,
      });

      if (refundRes.paymentStatus) {
        finalPaymentStatus = refundRes.paymentStatus as typeof finalPaymentStatus;
      }

      refundSummary = {
        initiated: refundRes.initiated,
        status: refundRes.paymentStatus,
        error: refundRes.error,
      };
    }

    void notifyOrderStatusChanged(updatedOrder, targetStatus).catch(() => {});

    return NextResponse.json({
      success: true,
      message: `Order ${updatedOrder.orderNumber} transitioned to ${targetStatus}.`,
      order: {
        id: updatedOrder.id,
        orderNumber: updatedOrder.orderNumber,
        fulfilmentStatus: updatedOrder.fulfilmentStatus,
        paymentStatus: finalPaymentStatus,
        updatedAt: updatedOrder.updatedAt,
      },
      refund: refundSummary,
    });
  } catch (error: any) {
    console.error("[API v1 Update Status Error]:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error while updating status." },
      { status: 500 }
    );
  }
}
