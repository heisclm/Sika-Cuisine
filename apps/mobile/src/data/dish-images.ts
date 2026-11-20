/**
 * @file apps/mobile/src/data/dish-images.ts
 * @description Static asset bundler lookup mapping API imageUrl paths to bundled local photography.
 *
 * Ensures crisp zero-latency rendering on ordinary Android devices even when offline or over 3G.
 */

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
 * Resolves a MenuItemDTO `imageUrl` string (e.g., `/images/dishes/tilapia-banku.jpg`)
 * into a local static asset ID with guaranteed fallback to the signature plate photo.
 */
export function resolveDishImageSource(imageUrl?: string | null): number {
  if (!imageUrl) return MOBILE_IMAGE_ASSETS.heroPlate;
  const filename = imageUrl.split("/").pop()?.trim() ?? "";
  return DISH_IMAGE_BY_FILENAME[filename] ?? MOBILE_IMAGE_ASSETS.heroPlate;
}
