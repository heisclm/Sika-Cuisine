import { NextRequest, NextResponse } from "next/server";
import { verifySameOriginMutation } from "@/lib/auth/csrf";
import { getAuthUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * GET /api/v1/notifications
 * Returns the latest 30 persistent in-app notifications plus unread counter
 * scoped strictly to the authenticated user (customer, cashier, kitchen, rider, or admin).
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Authentication required." },
        { status: 401 }
      );
    }

    if (!process.env.DATABASE_URL?.trim()) {
      return NextResponse.json(
        { success: true, unreadCount: 0, notifications: [] },
        { status: 200 }
      );
    }

    const [notifications, unreadCount] = await Promise.all([
      prisma.inAppNotification.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        take: 30,
      }),
      prisma.inAppNotification.count({
        where: { userId: user.id, isRead: false },
      }),
    ]);

    return NextResponse.json(
      {
        success: true,
        unreadCount,
        notifications: notifications.map((n) => ({
          id: n.id,
          type: n.type,
          title: n.title,
          body: n.body,
          orderNumber: n.orderNumber,
          actionUrl: n.actionUrl,
          isRead: n.isRead,
          readAt: n.readAt ? n.readAt.toISOString() : null,
          createdAt: n.createdAt.toISOString(),
        })),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[API v1 Notifications GET Error]:", error);
    return NextResponse.json(
      { success: false, error: "Unable to load notifications." },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/v1/notifications
 * Clears all in-app notification history for the authenticated user
 * (or a single notification when `?id=<notificationId>` is provided).
 */
export async function DELETE(req: NextRequest) {
  try {
    if (!verifySameOriginMutation(req)) {
      return NextResponse.json(
        { success: false, error: "Cross-origin request rejected." },
        { status: 403 }
      );
    }

    const user = await getAuthUser(req);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Authentication required." },
        { status: 401 }
      );
    }

    if (!process.env.DATABASE_URL?.trim()) {
      return NextResponse.json(
        { success: true, deletedCount: 0 },
        { status: 200 }
      );
    }

    const singleId = req.nextUrl.searchParams.get("id")?.trim();

    const result = await prisma.inAppNotification.deleteMany({
      where: singleId
        ? { id: singleId, userId: user.id }
        : { userId: user.id },
    });

    return NextResponse.json(
      {
        success: true,
        deletedCount: result.count,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[API v1 Notifications DELETE Error]:", error);
    return NextResponse.json(
      { success: false, error: "Unable to clear notifications right now." },
      { status: 500 }
    );
  }
}
