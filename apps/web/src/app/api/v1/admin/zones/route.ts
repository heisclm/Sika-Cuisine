import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verifySameOriginMutation } from "@/lib/auth/csrf";
import { getAuthUser } from "@/lib/auth/session";
import { recordAuditLog } from "@/lib/audit";

export const dynamic = "force-dynamic";

const createZoneSchema = z.object({
  name: z.string().min(2).max(120),
  slug: z
    .string()
    .min(2)
    .max(120)
    .regex(/^[a-z0-9-]+$/)
    .optional(),
  description: z.string().min(2).max(400),
  feePesewas: z.number().int().min(0),
  estimatedMinutes: z.number().int().min(5).max(180).default(35),
  localities: z.array(z.string().min(1).max(100)).min(1),
  isActive: z.boolean().optional().default(true),
  sortOrder: z.number().int().optional(),
});

function toKebabSlug(value: string): string {
  const base = value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return base || `zone-${Date.now()}`;
}

/**
 * GET /api/v1/admin/zones
 * Lists all configured Sunyani delivery zones (active and inactive) ordered by sortOrder.
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
      return NextResponse.json({ success: true, zones: [] }, { status: 200 });
    }

    const zones = await prisma.deliveryZone.findMany({
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    });

    return NextResponse.json({ success: true, zones }, { status: 200 });
  } catch (error) {
    console.error("[API v1 Admin Zones GET Error]:", error);
    return NextResponse.json(
      { success: false, error: "Failed to load delivery zones." },
      { status: 500 }
    );
  }
}

/**
 * POST /api/v1/admin/zones
 * Creates a new Sunyani delivery zone and records an operational audit entry.
 */
export async function POST(req: NextRequest) {
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
    const parsed = createZoneSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid delivery zone payload.",
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const cleanLocalities = parsed.data.localities
      .map((l) => l.trim())
      .filter(Boolean);

    const baseSlug = parsed.data.slug || toKebabSlug(parsed.data.name);
    const existingCount = await prisma.deliveryZone.count();

    let slug = baseSlug;
    const conflict = await prisma.deliveryZone.findUnique({ where: { slug } });
    if (conflict) {
      slug = `${baseSlug}-${Date.now().toString().slice(-4)}`;
    }

    const zone = await prisma.deliveryZone.create({
      data: {
        slug,
        name: parsed.data.name.trim(),
        description: parsed.data.description.trim(),
        feePesewas: parsed.data.feePesewas,
        estimatedMinutes: parsed.data.estimatedMinutes,
        localities: cleanLocalities,
        isActive: parsed.data.isActive,
        sortOrder: parsed.data.sortOrder ?? existingCount + 1,
      },
    });

    await recordAuditLog({
      userId: user.id,
      action: "DELIVERY_ZONE_CREATED",
      entityType: "DeliveryZone",
      entityId: zone.id,
      metadata: {
        slug: zone.slug,
        name: zone.name,
        feePesewas: zone.feePesewas,
      },
      req,
    });

    return NextResponse.json({ success: true, zone }, { status: 201 });
  } catch (error: any) {
    console.error("[API v1 Admin Zones POST Error]:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to create delivery zone." },
      { status: 500 }
    );
  }
}
