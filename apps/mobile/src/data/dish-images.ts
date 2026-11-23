/**
 * @file apps/mobile/src/data/dish-images.ts
 * @description Resolves dish photography across bundled local assets, Supabase/HTTPS cloud URLs,
 * and server-hosted Admin CMS uploads (`/images/uploads/...`).
 *
 * Bundled seed photography renders with zero latency offline, while newly uploaded Admin CMS
 * images resolve cleanly against `WEB_ORIGIN` or their direct HTTPS URL.
 */

import { ImageSourcePropType } from "react-native";
import { WEB_ORIGIN } from "../services/api-client";

export const MOBILE_IMAGE_ASSETS = {
  heroPlate: require("../../assets/dishes/hero-signature-plate.jpg"),
  signaturePlatter: require("../../assets/dishes/signature-platter.jpg"),
  loungeInterior: require("../../assets/restaurant/lounge-interior.jpg"),
  logo: require("../../assets/logo.png"),
} as const;

const DISH_IMAGE_BY_FILENAME: Record<string, number> = {
  "artisan-pizza.jpg": require("../../assets/dishes/artisan-pizza.jpg"),
  "fried-chicken.jpg": require("../../assets/dishes/fried-chicken.jpg"),
  "fruit-salad.jpg": require("../../assets/dishes/fruit-salad.jpg"),
  "fufu-goat-soup.jpg": require("../../assets/dishes/fufu-goat-soup.jpg"),
  "grilled-chicken-jollof.jpg": require("../../assets/dishes/grilled-chicken-jollof.jpg"),
  "hero-signature-plate.jpg": require("../../assets/dishes/hero-signature-plate.jpg"),
  "noodles-stir-fry.jpg": require("../../assets/dishes/noodles-stir-fry.jpg"),
  "pineapple-rice.jpg": require("../../assets/dishes/pineapple-rice.jpg"),
  "red-fish.jpg": require("../../assets/dishes/red-fish.jpg"),
  "rice-specialty.jpg": require("../../assets/dishes/rice-specialty.jpg"),
  "signature-platter.jpg": require("../../assets/dishes/signature-platter.jpg"),
  "special-combo.jpg": require("../../assets/dishes/special-combo.jpg"),
  "swallow-soup.jpg": require("../../assets/dishes/swallow-soup.jpg"),
  "tilapia-banku.jpg": require("../../assets/dishes/tilapia-banku.jpg"),
};

/**
 * Resolves a MenuItemDTO `imageUrl` into a React Native `ImageSourcePropType`:
 * 1. Direct remote URLs (`https://...`, `http://...`, `data:...`) -> `{ uri }`
 * 2. Bundled seed dish filenames (e.g. `/images/dishes/tilapia-banku.jpg`) -> local asset ID
 * 3. Server-relative uploaded paths (e.g. `/images/uploads/dish-....jpg`) -> `{ uri: `${WEB_ORIGIN}${path}` }`
 * 4. Missing/invalid values -> fallback signature plate photo.
 */
export function resolveDishImageSource(imageUrl?: string | null): ImageSourcePropType {
  const trimmed = typeof imageUrl === "string" ? imageUrl.trim() : "";
  if (!trimmed) return MOBILE_IMAGE_ASSETS.heroPlate;

  if (/^(https?:\/\/|data:image\/)/i.test(trimmed)) {
    return { uri: trimmed };
  }

  const cleanPath = trimmed.split("?")[0];
  const filename = cleanPath.split("/").pop()?.trim() ?? "";
  if (!cleanPath.includes("/uploads/") && DISH_IMAGE_BY_FILENAME[filename]) {
    return DISH_IMAGE_BY_FILENAME[filename];
  }

  if (trimmed.startsWith("/")) {
    const cleanOrigin = WEB_ORIGIN.replace(/\/+$/, "");
    return { uri: `${cleanOrigin}${trimmed}` };
  }

  return DISH_IMAGE_BY_FILENAME[filename] ?? MOBILE_IMAGE_ASSETS.heroPlate;
}
