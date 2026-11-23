import type { MetadataRoute } from "next";
import { SikaPalette } from "@sika/shared";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Sika Cuisine — Sunyani, Ghana",
    short_name: "Sika Cuisine",
    description:
      "Authentic Ghanaian culinary delicacies, charcoal-grilled tilapia, smoky jollof, and lounge dining in Sunyani, Bono Region.",
    start_url: "/",
    display: "standalone",
    background_color: SikaPalette.deepBlack,
    theme_color: SikaPalette.primaryRed,
    icons: [
      {
        src: "/images/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/images/logo.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
