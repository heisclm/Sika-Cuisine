import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { RESTAURANT_INFO, SUNYANI_DELIVERY_ZONES } from "@sika/shared";

export const dynamic = "force-dynamic";

/**
 * GET /api/v1/config/public
 * Serves live restaurant operating settings and active Sunyani delivery zones from PostgreSQL,
 * falling back transparently to `@sika/shared` defaults when unconfigured.
 */
export async function GET() {
  const hasDatabaseUrl = Boolean(process.env.DATABASE_URL?.trim());

  const fallbackResponse = {
    success: true,
    source: "fallback" as const,
    restaurant: {
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
    },
    deliveryZones: SUNYANI_DELIVERY_ZONES,
  };

  if (!hasDatabaseUrl) {
    return NextResponse.json(fallbackResponse, { status: 200 });
  }

  try {
    const [settings, dbZones] = await Promise.all([
      prisma.restaurantSettings.findUnique({ where: { id: "default" } }),
      prisma.deliveryZone.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
      }),
    ]);

    return NextResponse.json(
      {
        success: true,
        source: "database" as const,
        restaurant: settings
          ? {
              name: settings.name,
              tagline: settings.tagline,
              phone: settings.phone,
              whatsapp: settings.whatsapp,
              address: settings.address,
              isAcceptingOrders: settings.isAcceptingOrders,
              isDeliveryEnabled: settings.isDeliveryEnabled,
              isCollectionEnabled: settings.isCollectionEnabled,
              weekdayHours: settings.weekdayHours,
              sundayHours: settings.sundayHours,
            }
          : fallbackResponse.restaurant,
        deliveryZones:
          dbZones.length > 0
            ? dbZones.map((zone) => ({
                id: zone.slug,
                name: zone.name,
                description: zone.description,
                feePesewas: zone.feePesewas,
                estimatedMinutes: zone.estimatedMinutes,
                localities: zone.localities,
              }))
            : SUNYANI_DELIVERY_ZONES,
      },
      { status: 200 }
    );
  } catch (error) {
    console.warn("[API v1 Config Public] Falling back to static config:", error);
    return NextResponse.json(fallbackResponse, { status: 200 });
  }
}
