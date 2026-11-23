import type { MetadataRoute } from "next";
import { getSiteOrigin } from "@/lib/env";
import { prisma } from "@/lib/prisma";

export const revalidate = 3600;

/**
 * Generates an authoritative XML sitemap combining public storefront pages
 * with live dish detail routes (`/menu/[slug]`) queried from PostgreSQL.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getSiteOrigin();

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/menu`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];

  if (!process.env.DATABASE_URL?.trim()) {
    return staticRoutes;
  }

  try {
    const items = await prisma.menuItem.findMany({
      where: { isAvailable: true },
      select: { slug: true, updatedAt: true },
      orderBy: { sortOrder: "asc" },
    });

    const dishRoutes: MetadataRoute.Sitemap = items.map((item) => ({
      url: `${baseUrl}/menu/${encodeURIComponent(item.slug)}`,
      lastModified: item.updatedAt,
      changeFrequency: "weekly",
      priority: 0.8,
    }));

    return [...staticRoutes, ...dishRoutes];
  } catch {
    return staticRoutes;
  }
}
