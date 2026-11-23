import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth/session";

const registerDeviceSchema = z.object({
  expoPushToken: z
    .string()
    .trim()
    .regex(/^Expo(nent)?PushToken\[.+\]$/, "Invalid Expo Push token format."),
  platform: z.enum(["ios", "android", "web"]).optional().default("android"),
});

const unregisterDeviceSchema = z.object({
  expoPushToken: z.string().trim().min(10),
});

/**
 * POST /api/v1/notifications/devices
 * Registers or refreshes an Expo Push device token optionally linked to the authenticated user.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = registerDeviceSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: parsed.error.issues[0]?.message || "Invalid push device token.",
        },
        { status: 400 }
      );
    }

    const user = await getAuthUser(req);

    await prisma.pushDeviceToken.upsert({
      where: { expoPushToken: parsed.data.expoPushToken },
      update: {
        userId: user?.id ?? undefined,
        platform: parsed.data.platform,
        isActive: true,
        lastSeenAt: new Date(),
      },
      create: {
        userId: user?.id ?? null,
        expoPushToken: parsed.data.expoPushToken,
        platform: parsed.data.platform,
        isActive: true,
      },
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("[API v1 Notifications Device Register Error]:", error);
    return NextResponse.json(
      { success: false, error: "Failed to register push device." },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/v1/notifications/devices
 * Deactivates a push notification token cleanly when signing out or opting out.
 */
export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = unregisterDeviceSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Invalid push token payload." },
        { status: 400 }
      );
    }

    await prisma.pushDeviceToken.updateMany({
      where: { expoPushToken: parsed.data.expoPushToken },
      data: { isActive: false },
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("[API v1 Notifications Device Delete Error]:", error);
    return NextResponse.json(
      { success: false, error: "Failed to deactivate push device." },
      { status: 500 }
    );
  }
}
