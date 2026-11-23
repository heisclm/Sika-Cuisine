import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getFallbackMenuCategories } from "@/lib/menu-catalog";

/**
 * Retrieves active menu categories from PostgreSQL, falling back gracefully
 * to `FALLBACK_MENU_CATEGORIES` when `DATABASE_URL` is unconfigured or offline.
 */
export async function GET() {
  const hasDatabaseUrl = Boolean(process.env.DATABASE_URL?.trim());

  if (hasDatabaseUrl) {
    try {
      const categories = await prisma.menuCategory.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
          imageUrl: true,
          sortOrder: true,
          isActive: true,
        },
      });

      if (categories.length > 0 || process.env.NODE_ENV === "production") {
        return NextResponse.json({
          success: true,
          categories,
          source: "database",
        });
      }
    } catch (error) {
      console.warn(
        "[API v1 Menu Categories] Database error:",
        error instanceof Error ? error.message : error
      );
      if (process.env.NODE_ENV === "production") {
        return NextResponse.json(
          { success: false, error: "Menu categories temporarily unavailable." },
          { status: 503 }
        );
      }
    }
  }

  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { success: false, error: "Menu database is not configured." },
      { status: 503 }
    );
  }

  return NextResponse.json({
    success: true,
    categories: getFallbackMenuCategories(),
    source: "catalog",
  });
}
