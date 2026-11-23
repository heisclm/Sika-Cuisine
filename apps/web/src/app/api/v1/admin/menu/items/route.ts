import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verifySameOriginMutation } from "@/lib/auth/csrf";
import { getAuthUser } from "@/lib/auth/session";
import { recordAuditLog } from "@/lib/audit";

const createMenuItemSchema = z.object({
  categoryId: z.string().min(1),
  name: z.string().min(2).max(120),
  slug: z
    .string()
    .min(2)
    .max(120)
    .regex(/^[a-z0-9-]+$/),
  description: z.string().min(5).max(1000),
  basePricePesewas: z.number().int().positive(),
  imageUrl: z.string().min(1),
  isAvailable: z.boolean().optional().default(true),
  isFeatured: z.boolean().optional().default(false),
  spiceLevel: z.number().int().min(0).max(5).optional().default(1),
  preparationTimeMinutes: z.number().int().min(1).max(180).optional().default(20),
  sortOrder: z.number().int().optional().default(100),
});

/**
 * POST /api/v1/admin/menu/items
 * Creates a new menu dish in PostgreSQL (ADMIN only).
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
      return NextResponse.json({ success: false, error: "Authentication required." }, { status: 401 });
    }
    if (user.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "Admin role required to create menu items." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const parsed = createMenuItemSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Invalid menu item payload.", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const created = await prisma.menuItem.create({
      data: parsed.data,
      include: { category: true, optionGroups: { include: { options: true } } },
    });

    await recordAuditLog({
      userId: user.id,
      action: "MENU_ITEM_CREATED",
      entityType: "MenuItem",
      entityId: created.id,
      metadata: { name: created.name, basePricePesewas: created.basePricePesewas },
      req,
    });

    return NextResponse.json({ success: true, item: created }, { status: 201 });
  } catch (error: any) {
    console.error("[API v1 Admin Menu Create Error]:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to create menu item." },
      { status: 500 }
    );
  }
}
