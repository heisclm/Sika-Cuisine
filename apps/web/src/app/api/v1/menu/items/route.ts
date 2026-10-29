import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const categoryId = searchParams.get("categoryId");
    const featuredOnly = searchParams.get("featured") === "true";

    const where: any = { isAvailable: true };
    if (categoryId) {
      where.categoryId = categoryId;
    }
    if (featuredOnly) {
      where.isFeatured = true;
    }

    const items = await prisma.menuItem.findMany({
      where,
      orderBy: [{ isFeatured: "desc" }, { sortOrder: "asc" }],
      include: {
        category: {
          select: { id: true, name: true, slug: true },
        },
        optionGroups: {
          include: {
            options: {
              where: { isAvailable: true },
            },
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      items,
    });
  } catch (error: any) {
    console.error("[API v1 Menu Items Error]:", error);
    return NextResponse.json(
      { success: false, error: "Unable to retrieve menu items." },
      { status: 500 }
    );
  }
}
