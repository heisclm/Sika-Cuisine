import { NextRequest, NextResponse } from "next/server";
import { escapeCsvCell, getDateRangeBounds } from "@sika/shared";
import { getAuthUser } from "@/lib/auth/session";
import {
  expireAbandonedPaystackOrders,
  syncPendingPaystackRefunds,
} from "@/lib/payments";
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

    const isStaff = ["ADMIN", "STAFF_CASHIER", "STAFF_KITCHEN"].includes(
      session.role
    );

    if (!isStaff) {
      return NextResponse.json(
        { success: false, error: "Access denied. Staff privileges required." },
        { status: 403 }
      );
    }

    void expireAbandonedPaystackOrders(30).catch(() => {});
    void syncPendingPaystackRefunds().catch(() => {});

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status")?.trim().toUpperCase();
    const fulfilmentType = searchParams.get("fulfilmentType")?.trim().toUpperCase();
    const paymentMethod = searchParams.get("paymentMethod")?.trim().toUpperCase();
    const paymentStatus = searchParams.get("paymentStatus")?.trim().toUpperCase();
    const dateRange = searchParams.get("dateRange")?.trim().toLowerCase();
    const search = searchParams.get("search")?.trim();
    const format = searchParams.get("format")?.trim().toLowerCase();

    if (format === "csv" && session.role !== "ADMIN") {
      return NextResponse.json(
        {
          success: false,
          error: "Only Super Administrators can export order CSV reports.",
        },
        { status: 403 }
      );
    }

    const includeUnpaidOnline =
      searchParams.get("includeUnpaidOnline") === "true" &&
      session.role === "ADMIN";

    const where: any = {};

    if (!includeUnpaidOnline) {
      // Keep PAID, REFUND_PENDING, and REFUNDED Paystack orders visible to Cashier & Admin!
      where.NOT = {
        paymentMethod: "PAYSTACK",
        paymentStatus: { in: ["PENDING", "FAILED"] },
      };
    }

    if (status && status !== "ALL") {
      where.fulfilmentStatus = status;
    }

    if (fulfilmentType === "DELIVERY" || fulfilmentType === "COLLECTION") {
      where.fulfilmentType = fulfilmentType;
    }

    if (session.role !== "STAFF_KITCHEN") {
      if (paymentMethod && paymentMethod !== "ALL") {
        if (paymentMethod === "CASH") {
          where.paymentMethod = {
            in: ["CASH_ON_DELIVERY", "CASH_ON_COLLECTION"],
          };
        } else {
          where.paymentMethod = paymentMethod;
        }
      }

      if (paymentStatus && paymentStatus !== "ALL") {
        where.paymentStatus = paymentStatus;
      }
    }

    const dateBounds = getDateRangeBounds(dateRange);
    if (dateBounds.gte || dateBounds.lt) {
      where.createdAt = dateBounds;
    }

    if (search) {
      where.OR = [
        { orderNumber: { contains: search, mode: "insensitive" } },
        { guestName: { contains: search, mode: "insensitive" } },
        { guestPhone: { contains: search } },
        { guestEmail: { contains: search, mode: "insensitive" } },
        {
          deliveryAddress: {
            areaLocality: { contains: search, mode: "insensitive" },
          },
        },
        {
          items: {
            some: {
              itemNameSnapshot: { contains: search, mode: "insensitive" },
            },
          },
        },
      ];
    }

    const orders = await prisma.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        items: true,
        deliveryAddress: true,
        assignedRider: {
          select: { id: true, fullName: true, phone: true },
        },
        statusHistory: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
        ...(session.role === "ADMIN"
          ? {
              paymentAttempts: {
                orderBy: { createdAt: "desc" },
                take: 5,
                select: {
                  id: true,
                  reference: true,
                  status: true,
                  amountPesewas: true,
                  channel: true,
                  providerMetadata: true,
                  createdAt: true,
                },
              },
            }
          : {}),
      },
      take: format === "csv" ? 500 : 120,
    });

    if (format === "csv") {
      const headers = [
        "Order Number",
        "Created At",
        "Customer Name",
        "Phone",
        "Email",
        "Fulfilment Type",
        "Fulfilment Status",
        "Payment Method",
        "Payment Status",
        "Subtotal (GHS)",
        "Delivery Fee (GHS)",
        "Total (GHS)",
        "Area Locality",
        "Assigned Rider",
        "Items",
        "Rejection / Cancellation Reason",
      ];

      const lines = [headers.map((h) => escapeCsvCell(h)).join(",")];
      for (const order of orders) {
        const itemsText = order.items
          .map((i) => `${i.quantity}x ${i.itemNameSnapshot}`)
          .join("; ");
        const row = [
          order.orderNumber,
          order.createdAt.toISOString(),
          order.deliveryAddress?.recipientName || order.guestName || "",
          order.deliveryAddress?.recipientPhone || order.guestPhone || "",
          order.guestEmail || "",
          order.fulfilmentType,
          order.fulfilmentStatus,
          order.paymentMethod,
          order.paymentStatus,
          (order.subtotalPesewas / 100).toFixed(2),
          (order.deliveryFeePesewas / 100).toFixed(2),
          (order.totalPesewas / 100).toFixed(2),
          order.deliveryAddress?.areaLocality || "",
          order.assignedRider?.fullName || "",
          itemsText,
          order.rejectionReason || order.cancellationReason || "",
        ];
        lines.push(row.map((cell) => escapeCsvCell(cell)).join(","));
      }

      const csvBody = lines.join("\r\n");
      const filename = `sika-orders-${new Date().toISOString().slice(0, 10)}.csv`;
      return new NextResponse(csvBody, {
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="${filename}"`,
          "Cache-Control": "no-store",
        },
      });
    }

    if (session.role === "STAFF_KITCHEN") {
      const kitchenOrders = orders.map((order) => ({
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
      }));

      return NextResponse.json({
        success: true,
        count: kitchenOrders.length,
        orders: kitchenOrders,
      });
    }

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
