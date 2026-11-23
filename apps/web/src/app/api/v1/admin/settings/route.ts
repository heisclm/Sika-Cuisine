import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { RESTAURANT_INFO } from "@sika/shared";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth/session";
import { verifySameOriginMutation } from "@/lib/auth/csrf";
import { recordAuditLog } from "@/lib/audit";

export const dynamic = "force-dynamic";

const updateSettingsSchema = z
  .object({
    name: z.string().min(2).max(120).optional(),
    tagline: z.string().min(2).max(120).optional(),
    phone: z.string().min(6).max(40).optional(),
    whatsapp: z.string().min(6).max(40).optional(),
    address: z.string().min(4).max(240).optional(),
    isAcceptingOrders: z.boolean().optional(),
    isDeliveryEnabled: z.boolean().optional(),
    isCollectionEnabled: z.boolean().optional(),
    weekdayHours: z.string().min(4).max(80).optional(),
    sundayHours: z.string().min(4).max(80).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one settings field must be provided.",
  });

function getDefaultSettings() {
  return {
    id: "default",
    name: process.env.NEXT_PUBLIC_RESTAURANT_NAME || RESTAURANT_INFO.brandName,
    tagline: RESTAURANT_INFO.city,
    phone: process.env.NEXT_PUBLIC_RESTAURANT_PHONE || RESTAURANT_INFO.primaryPhone,
    whatsapp:
      process.env.NEXT_PUBLIC_RESTAURANT_WHATSAPP || RESTAURANT_INFO.primaryPhoneIntl,
    address:
      process.env.NEXT_PUBLIC_RESTAURANT_ADDRESS || RESTAURANT_INFO.address,
    isAcceptingOrders: true,
    isDeliveryEnabled: true,
    isCollectionEnabled: true,
    weekdayHours: "10:00 AM - 10:00 PM",
    sundayHours: "12:00 PM - 9:00 PM",
  };
}

/**
 * GET /api/v1/admin/settings
 * Returns persisted restaurant operational settings for the Admin CMS console.
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
    if (user.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "Admin role required." },
        { status: 403 }
      );
    }

    if (!process.env.DATABASE_URL?.trim()) {
      return NextResponse.json(
        { success: true, settings: getDefaultSettings() },
        { status: 200 }
      );
    }

    const settings = await prisma.restaurantSettings.findUnique({
      where: { id: "default" },
    });

    return NextResponse.json(
      { success: true, settings: settings ?? getDefaultSettings() },
      { status: 200 }
    );
  } catch (error) {
    console.error("[API v1 Admin Settings GET Error]:", error);
    return NextResponse.json(
      { success: false, error: "Failed to load restaurant settings." },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/v1/admin/settings
 * Updates restaurant operational status, hours, and fulfilment toggles cleanly with audit logging.
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
    if (user.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "Admin role required." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const parsed = updateSettingsSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid restaurant settings payload.",
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    if (!process.env.DATABASE_URL?.trim()) {
      return NextResponse.json(
        { success: false, error: "PostgreSQL is required to update restaurant settings." },
        { status: 503 }
      );
    }

    const defaults = getDefaultSettings();
    const settings = await prisma.restaurantSettings.upsert({
      where: { id: "default" },
      update: parsed.data,
      create: {
        ...defaults,
        ...parsed.data,
      },
    });

    await recordAuditLog({
      userId: user.id,
      action: "RESTAURANT_SETTINGS_UPDATED",
      entityType: "RestaurantSettings",
      entityId: "default",
      metadata: parsed.data as Record<string, unknown>,
      req,
    });

    return NextResponse.json({ success: true, settings }, { status: 200 });
  } catch (error) {
    console.error("[API v1 Admin Settings PATCH Error]:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update restaurant settings." },
      { status: 500 }
    );
  }
}
