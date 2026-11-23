import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { syncPendingPaystackRefunds } from "@/lib/payments";
import { PublicOrderTrackingDTO } from "@sika/shared";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ orderNumber: string }> }
) {
  try {
    const ip = getClientIp(req);
    const rateLimit = await checkRateLimit(`order-track:${ip}`, {
      limit: 40,
      windowMs: 60_000,
    });
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: "Too many tracking lookups. Please wait a moment.",
        },
        { status: 429 }
      );
    }

    const { orderNumber } = await params;
    const cleanOrderNumber = orderNumber.trim().toUpperCase();

    await syncPendingPaystackRefunds({ orderNumber: cleanOrderNumber }).catch(
      () => {}
    );

    const order = await prisma.order.findUnique({
      where: { orderNumber: cleanOrderNumber },
      include: {
        items: {
          include: {
            menuItem: {
              select: { imageUrl: true },
            },
          },
        },
        statusHistory: {
          orderBy: { createdAt: "asc" },
        },
        paymentAttempts: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    if (!order) {
      return NextResponse.json(
        { success: false, error: "Order not found. Please verify your reference number." },
        { status: 404 }
      );
    }

    const primaryImageUrl =
      order.items.find((i) => Boolean(i.menuItem?.imageUrl))?.menuItem?.imageUrl ??
      null;

    // Return sanitized public tracking DTO (strictly zero PII)
    const trackingData: PublicOrderTrackingDTO = {
      orderNumber: order.orderNumber,
      fulfilmentType: order.fulfilmentType as any,
      fulfilmentStatus: order.fulfilmentStatus as any,
      paymentStatus: order.paymentStatus as any,
      paymentMethod: order.paymentMethod as any,
      totalPesewas: order.totalPesewas,
      latestPaymentReference: order.paymentAttempts[0]?.reference ?? null,
      primaryImageUrl,
      rejectionReason: order.rejectionReason,
      cancellationReason: order.cancellationReason,
      estimatedDeliveryMinutes: order.estimatedDeliveryMinutes,
      createdAt: order.createdAt.toISOString(),
      itemsSummary: order.items.map((i) => ({
        itemName: i.itemNameSnapshot,
        quantity: i.quantity,
      })),
      timeline: order.statusHistory.map((h) => ({
        status: h.toStatus as any,
        timestamp: h.createdAt.toISOString(),
        note: h.note,
      })),
    };

    return NextResponse.json({
      success: true,
      tracking: trackingData,
    });
  } catch (error: any) {
    console.error("[API v1 Track Order Error]:", error);
    return NextResponse.json(
      { success: false, error: "Unable to retrieve tracking information." },
      { status: 500 }
    );
  }
}
