import type { MetadataRoute } from "next";
import { getSiteOrigin } from "@/lib/env";

export default function robots(): MetadataRoute.Robots {
  const siteOrigin = getSiteOrigin();

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin",
          "/admin/*",
          "/cashier",
          "/cashier/*",
          "/kitchen",
          "/kitchen/*",
          "/rider",
          "/rider/*",
          "/api/*",
          "/checkout",
          "/account",
          "/orders",
          "/orders/*",
          "/login",
          "/register",
          "/forgot-password",
          "/reset-password",
        ],
      },
    ],
    sitemap: `${siteOrigin}/sitemap.xml`,
  };
}
