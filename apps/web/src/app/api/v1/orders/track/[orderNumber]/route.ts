import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { PublicOrderTrackingDTO } from "@sika/shared";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ orderNumber: string }> }
) {
  try {
    const { orderNumber } = await params;
    const cleanOrderNumber = orderNumber.trim().toUpperCase();

    const order = await prisma.order.findUnique({
      where: { orderNumber: cleanOrderNumber },
      include: {
        items: true,
        statusHistory: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!order) {
      return NextResponse.json(
        { success: false, error: "Order not found. Please verify your reference number." },
        { status: 404 }
      );
    }

    // Return sanitized public tracking DTO (strictly zero PII)
    const trackingData: PublicOrderTrackingDTO = {
      orderNumber: order.orderNumber,
      fulfilmentType: order.fulfilmentType as any,
      fulfilmentStatus: order.fulfilmentStatus as any,
      paymentStatus: order.paymentStatus as any,
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
