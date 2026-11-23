import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth/session";
import { recordAuditLog } from "@/lib/audit";

const updateZoneSchema = z
  .object({
    name: z.string().min(2).max(120).optional(),
    description: z.string().min(2).max(400).optional(),
    feePesewas: z.number().int().min(0).optional(),
    estimatedMinutes: z.number().int().min(5).max(180).optional(),
    localities: z.array(z.string().min(1).max(100)).min(1).optional(),
    isActive: z.boolean().optional(),
    sortOrder: z.number().int().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one zone field must be provided.",
  });

/**
 * PATCH /api/v1/admin/zones/[id]
 * Updates tariff, ETA, localities, or active flag for a Sunyani delivery zone.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
    const body = await req.json();
    const parsed = updateZoneSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid delivery zone update payload.",
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const existing = await prisma.deliveryZone.findFirst({
      where: { OR: [{ id }, { slug: id }] },
    });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Delivery zone not found." },
        { status: 404 }
      );
    }

    const zone = await prisma.deliveryZone.update({
      where: { id: existing.id },
      data: {
        ...(parsed.data.name !== undefined && { name: parsed.data.name.trim() }),
        ...(parsed.data.description !== undefined && {
          description: parsed.data.description.trim(),
        }),
        ...(parsed.data.feePesewas !== undefined && {
          feePesewas: parsed.data.feePesewas,
        }),
        ...(parsed.data.estimatedMinutes !== undefined && {
          estimatedMinutes: parsed.data.estimatedMinutes,
        }),
        ...(parsed.data.localities !== undefined && {
          localities: parsed.data.localities.map((l) => l.trim()).filter(Boolean),
        }),
        ...(parsed.data.isActive !== undefined && {
          isActive: parsed.data.isActive,
        }),
        ...(parsed.data.sortOrder !== undefined && {
          sortOrder: parsed.data.sortOrder,
        }),
      },
    });

    await recordAuditLog({
      userId: user.id,
      action: "DELIVERY_ZONE_UPDATED",
      entityType: "DeliveryZone",
      entityId: zone.id,
      metadata: parsed.data as Record<string, unknown>,
      req,
    });

    return NextResponse.json({ success: true, zone }, { status: 200 });
  } catch (error: any) {
    console.error("[API v1 Admin Zone PATCH Error]:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to update delivery zone." },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/v1/admin/zones/[id]
 * Deactivates a delivery zone by default (or deletes permanently for ADMIN when `?hard=true`).
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const hardDelete = searchParams.get("hard") === "true";

    const existing = await prisma.deliveryZone.findFirst({
      where: { OR: [{ id }, { slug: id }] },
    });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Delivery zone not found." },
        { status: 404 }
      );
    }

    if (hardDelete && user.role === "ADMIN") {
      await prisma.deliveryZone.delete({ where: { id: existing.id } });
      await recordAuditLog({
        userId: user.id,
        action: "DELIVERY_ZONE_DELETED",
        entityType: "DeliveryZone",
        entityId: existing.id,
        metadata: { slug: existing.slug, name: existing.name },
        req,
      });
      return NextResponse.json({ success: true, deleted: true }, { status: 200 });
    }

    const zone = await prisma.deliveryZone.update({
      where: { id: existing.id },
      data: { isActive: false },
    });

    await recordAuditLog({
      userId: user.id,
      action: "DELIVERY_ZONE_ARCHIVED",
      entityType: "DeliveryZone",
      entityId: zone.id,
      metadata: { slug: zone.slug, name: zone.name },
      req,
    });

    return NextResponse.json({ success: true, zone }, { status: 200 });
  } catch (error: any) {
    console.error("[API v1 Admin Zone DELETE Error]:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to archive delivery zone." },
      { status: 500 }
    );
  }
}
