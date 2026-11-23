import React from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DishDetailClient } from "@/components/menu/DishDetailClient";
import { formatPesewasToGhs } from "@/lib/currency";
import { getSiteOrigin } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { MenuItem } from "@/types/menu";

export const dynamic = "force-dynamic";

function serializeDish(raw: {
  id: string;
  categoryId: string;
  name: string;
  slug: string;
  description: string;
  basePricePesewas: number;
  imageUrl: string;
  isAvailable: boolean;
  isFeatured: boolean;
  spiceLevel: number;
  preparationTimeMinutes: number;
  sortOrder: number;
  category?: { name: string } | null;
  optionGroups?: Array<{
    id: string;
    name: string;
    description: string | null;
    minSelect: number;
    maxSelect: number;
    isRequired: boolean;
    options: Array<{
      id: string;
      name: string;
      priceDeltaPesewas: number;
      isAvailable: boolean;
    }>;
  }>;
}): MenuItem {
  return {
    id: raw.id,
    categoryId: raw.categoryId,
    categoryName: raw.category?.name,
    name: raw.name,
    slug: raw.slug,
    description: raw.description,
    basePricePesewas: raw.basePricePesewas,
    imageUrl: raw.imageUrl,
    isAvailable: raw.isAvailable,
    isFeatured: raw.isFeatured,
    spiceLevel: raw.spiceLevel,
    preparationTimeMinutes: raw.preparationTimeMinutes,
    sortOrder: raw.sortOrder,
    optionGroups: (raw.optionGroups ?? []).map((group) => ({
      id: group.id,
      name: group.name,
      description: group.description ?? undefined,
      minSelect: group.minSelect,
      maxSelect: group.maxSelect,
      isRequired: group.isRequired,
      options: group.options.map((opt) => ({
        id: opt.id,
        name: opt.name,
        priceDeltaPesewas: opt.priceDeltaPesewas,
        isAvailable: opt.isAvailable,
      })),
    })),
  };
}

async function fetchDishBySlug(slug: string): Promise<MenuItem | null> {
  if (!process.env.DATABASE_URL?.trim()) return null;
  try {
    const raw = await prisma.menuItem.findUnique({
      where: { slug },
      include: {
        category: { select: { name: true } },
        optionGroups: {
          include: {
            options: {
              where: { isAvailable: true },
            },
          },
        },
      },
    });
    return raw ? serializeDish(raw) : null;
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const decodedSlug = decodeURIComponent(slug);
  const dish = await fetchDishBySlug(decodedSlug);

  if (!dish) {
    return {
      title: "Dish Not Found",
      robots: { index: false, follow: false },
    };
  }

  const origin = getSiteOrigin();
  const priceLabel = formatPesewasToGhs(dish.basePricePesewas);
  const canonicalPath = `/menu/${encodeURIComponent(dish.slug)}`;
  const absoluteImageUrl = dish.imageUrl.startsWith("http")
    ? dish.imageUrl
    : `${origin}${dish.imageUrl.startsWith("/") ? dish.imageUrl : `/${dish.imageUrl}`}`;

  return {
    title: `${dish.name} — ${priceLabel}`,
    description: `${dish.description} Order fresh in Sunyani for ${priceLabel} (pickup GH₵ 0.00 or doorstep delivery).`,
    alternates: {
      canonical: canonicalPath,
    },
    openGraph: {
      title: `${dish.name} (${priceLabel}) | Sika Cuisine Sunyani`,
      description: dish.description,
      url: `${origin}${canonicalPath}`,
      type: "article",
      images: [
        {
          url: absoluteImageUrl,
          width: 1200,
          height: 900,
          alt: dish.name,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${dish.name} — ${priceLabel}`,
      description: dish.description,
      images: [absoluteImageUrl],
    },
  };
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const decodedSlug = decodeURIComponent(slug);
  const dish = await fetchDishBySlug(decodedSlug);

  if (!dish && process.env.DATABASE_URL?.trim()) {
    notFound();
  }

  let related: MenuItem[] = [];
  if (dish && process.env.DATABASE_URL?.trim()) {
    try {
      const rawRelated = await prisma.menuItem.findMany({
        where: {
          categoryId: dish.categoryId,
          id: { not: dish.id },
          isAvailable: true,
        },
        orderBy: [{ isFeatured: "desc" }, { sortOrder: "asc" }],
        take: 4,
        include: {
          category: { select: { name: true } },
          optionGroups: {
            include: {
              options: {
                where: { isAvailable: true },
              },
            },
          },
        },
      });
      related = rawRelated.map(serializeDish);
    } catch {
      related = [];
    }
  }

  const origin = getSiteOrigin();
  const absoluteImageUrl = dish?.imageUrl.startsWith("http")
    ? dish.imageUrl
    : `${origin}${dish?.imageUrl || "/images/dishes/hero-signature-plate.jpg"}`;

  const menuItemJsonLd = dish
    ? {
        "@context": "https://schema.org",
        "@type": "MenuItem",
        name: dish.name,
        description: dish.description,
        image: absoluteImageUrl,
        url: `${origin}/menu/${encodeURIComponent(dish.slug)}`,
        offers: {
          "@type": "Offer",
          priceCurrency: "GHS",
          price: (dish.basePricePesewas / 100).toFixed(2),
          availability: dish.isAvailable
            ? "https://schema.org/InStock"
            : "https://schema.org/OutOfStock",
        },
      }
    : null;

  const breadcrumbJsonLd = dish
    ? {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Home",
            item: origin,
          },
          {
            "@type": "ListItem",
            position: 2,
            name: "Menu",
            item: `${origin}/menu`,
          },
          {
            "@type": "ListItem",
            position: 3,
            name: dish.name,
            item: `${origin}/menu/${encodeURIComponent(dish.slug)}`,
          },
        ],
      }
    : null;

  return (
    <>
      {menuItemJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(menuItemJsonLd) }}
        />
      )}
      {breadcrumbJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
        />
      )}
      <DishDetailClient
        slug={decodedSlug}
        initialDish={dish}
        initialRelated={related}
      />
    </>
  );
}
