import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isAvailabilityOnlyMenuPatch } from "@sika/shared";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth/session";
import { recordAuditLog } from "@/lib/audit";

const updateMenuItemSchema = z
  .object({
    categoryId: z.string().min(1).optional(),
    name: z.string().min(2).max(120).optional(),
    description: z.string().min(5).max(1000).optional(),
    basePricePesewas: z.number().int().positive().optional(),
    imageUrl: z.string().min(1).optional(),
    isAvailable: z.boolean().optional(),
    isFeatured: z.boolean().optional(),
    spiceLevel: z.number().int().min(0).max(5).optional(),
    preparationTimeMinutes: z.number().int().min(1).max(180).optional(),
    sortOrder: z.number().int().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one updatable field is required.",
  });

/**
 * PATCH /api/v1/admin/menu/items/[id]
 * Updates dish availability, price, or details cleanly and logs the change.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return NextResponse.json({ success: false, error: "Authentication required." }, { status: 401 });
    }
    if (!["ADMIN", "STAFF_CASHIER", "STAFF_KITCHEN"].includes(user.role)) {
      return NextResponse.json({ success: false, error: "Insufficient permissions." }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();
    const parsed = updateMenuItemSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Invalid update payload.", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    if (user.role !== "ADMIN" && !isAvailabilityOnlyMenuPatch(parsed.data)) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Only Super Admins can edit dish prices, photos, or descriptions. Staff may only toggle dish availability.",
        },
        { status: 403 }
      );
    }

    if (!process.env.DATABASE_URL?.trim()) {
      return NextResponse.json(
        {
          success: false,
          error: "PostgreSQL is not configured yet. Connect DATABASE_URL to persist menu availability changes.",
        },
        { status: 503 }
      );
    }

    const updated = await prisma.menuItem.update({
      where: { id },
      data: parsed.data,
      include: { category: true },
    });

    await recordAuditLog({
      userId: user.id,
      action: "MENU_ITEM_UPDATED",
      entityType: "MenuItem",
      entityId: updated.id,
      metadata: parsed.data,
      req,
    });

    return NextResponse.json({ success: true, item: updated }, { status: 200 });
  } catch (error: any) {
    console.error("[API v1 Admin Menu Update Error]:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to update menu item." },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/v1/admin/menu/items/[id]
 * Soft-disables a dish (or deletes if strictly requested by ADMIN).
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return NextResponse.json({ success: false, error: "Authentication required." }, { status: 401 });
    }
    if (user.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Admin role required." }, { status: 403 });
    }

    const { id } = await params;
    const disabled = await prisma.menuItem.update({
      where: { id },
      data: { isAvailable: false },
    });

    await recordAuditLog({
      userId: user.id,
      action: "MENU_ITEM_ARCHIVED",
      entityType: "MenuItem",
      entityId: disabled.id,
      req,
    });

    return NextResponse.json({ success: true, item: disabled }, { status: 200 });
  } catch (error: any) {
    console.error("[API v1 Admin Menu Delete Error]:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to archive menu item." },
      { status: 500 }
    );
  }
}
