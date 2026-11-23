import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getFallbackMenuItems } from "@/lib/menu-catalog";

/**
 * Retrieves restaurant menu items from PostgreSQL with optional category, featured,
 * slug, and availability filtering, falling back gracefully to `FALLBACK_MENU_ITEMS`
 * whenever `DATABASE_URL` is unconfigured or the database cannot be reached.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const categoryId = searchParams.get("categoryId");
  const featuredOnly = searchParams.get("featured") === "true";
  const includeUnavailable = searchParams.get("includeUnavailable") === "true";
  const slug = searchParams.get("slug");

  const hasDatabaseUrl = Boolean(process.env.DATABASE_URL?.trim());

  if (hasDatabaseUrl) {
    try {
      if (slug) {
        const item = await prisma.menuItem.findUnique({
          where: { slug },
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

        if (!item) {
          return NextResponse.json(
            { success: false, error: "Dish not found." },
            { status: 404 }
          );
        }

        return NextResponse.json({ success: true, item, source: "database" });
      }

      const where: Record<string, unknown> = includeUnavailable ? {} : { isAvailable: true };
      if (categoryId) {
        where.categoryId = categoryId;
      }
      if (featuredOnly) {
        where.isFeatured = true;
      }

      const items = await prisma.menuItem.findMany({
        where,
        orderBy: [{ isAvailable: "desc" }, { isFeatured: "desc" }, { sortOrder: "asc" }],
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

      if (items.length > 0 || categoryId || process.env.NODE_ENV === "production") {
        return NextResponse.json({
          success: true,
          items,
          source: "database",
        });
      }
    } catch (error) {
      console.warn(
        "[API v1 Menu Items] Database error:",
        error instanceof Error ? error.message : error
      );
      if (process.env.NODE_ENV === "production") {
        return NextResponse.json(
          { success: false, error: "Menu temporarily unavailable. Please retry shortly." },
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

  // Fallback path strictly for unconfigured local preview/development environments
  if (slug) {
    const fallbackItem = getFallbackMenuItems({ slug });
    if (!fallbackItem) {
      return NextResponse.json(
        { success: false, error: "Dish not found." },
        { status: 404 }
      );
    }
    return NextResponse.json({
      success: true,
      item: fallbackItem,
      source: "catalog",
    });
  }

  const fallbackItems = getFallbackMenuItems({
    categoryId,
    featuredOnly,
    includeUnavailable,
  });

  return NextResponse.json({
    success: true,
    items: fallbackItems,
    source: "catalog",
  });
}
