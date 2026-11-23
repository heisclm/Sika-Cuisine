import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { verifySameOriginMutation } from "@/lib/auth/csrf";
import { getAuthUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

const markReadSchema = z.object({
  notificationId: z.string().min(1).optional(),
  markAll: z.boolean().optional(),
});

/**
 * PATCH /api/v1/notifications/read
 * Marks either a single notification (owned by user) or all unread notifications as read.
 */
export async function PATCH(req: NextRequest) {
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

    const body = await req.json().catch(() => ({}));
    const parsed = markReadSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Invalid notification update payload." },
        { status: 400 }
      );
    }

    const now = new Date();
    if (parsed.data.notificationId) {
      await prisma.inAppNotification.updateMany({
        where: {
          id: parsed.data.notificationId,
          userId: user.id,
          isRead: false,
        },
        data: { isRead: true, readAt: now },
      });
    } else if (parsed.data.markAll) {
      await prisma.inAppNotification.updateMany({
        where: { userId: user.id, isRead: false },
        data: { isRead: true, readAt: now },
      });
    }

    const unreadCount = await prisma.inAppNotification.count({
      where: { userId: user.id, isRead: false },
    });

    return NextResponse.json({ success: true, unreadCount }, { status: 200 });
  } catch (error) {
    console.error("[API v1 Notifications Read PATCH Error]:", error);
    return NextResponse.json(
      { success: false, error: "Unable to update notification state." },
      { status: 500 }
    );
  }
}
